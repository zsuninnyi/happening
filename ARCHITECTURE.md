# Architecture

Simple modular-monolith design for a 3–4 hour MVP. Prefer finishing the end-to-end loop over depth. Do not introduce new infrastructure without a compelling reason.

## Architecture overview

One **modular monolith**: React SPA + Node/TypeScript REST API in a single deployable backend process. No message brokers, no separate workers, no microservices.

```
┌─────────────┐     REST/JSON      ┌──────────────────────────────────────┐
│ React (TS)  │ ─────────────────► │ Node API (modular monolith)          │
│ user/admin  │ ◄───────────────── │  auth · alerts · events · admin      │
└─────────────┘                    │  matching · notify · stores          │
                                   │         ▼                            │
                                   │  ChannelRegistry                     │
                                   │   ├─ EmailAdapter (simulated)        │
                                   │   └─ SlackAdapter (simulated)        │
                                   │         ▼                            │
                                   │  Store (in-memory; Postgres optional)│
                                   └──────────────────────────────────────┘
```

**Default data layer:** in-memory repositories behind a thin interface. **Postgres** only if it is already running and migrations will not eat the clock—same repository interface either way.

**Processing model:** event create runs match + notify **synchronously in the request**. Good enough for demo volume; no queue.

## Main backend modules

| Module | Responsibility |
| --- | --- |
| `auth` | Hardcoded seed users; login; issue demo token; role checks |
| `alerts` | Create/list/toggle alerts (user-scoped) |
| `events` | Persist events; kick off processing on create |
| `matching` | Pure rules: enabled + category + severity |
| `notifications` | Orchestrate send + record `Delivery`; use channel registry |
| `channels` | `NotificationChannel` interface + email/slack adapters + registry |
| `admin` | Cross-user lists; admin toggle; thin wrappers over stores |
| `store` | Users, alerts, events, deliveries (memory or Postgres) |

Keep folders/modules as boundaries, not separate services. Controllers call services; services call store + matching + notifications.

## Domain entities

- **User** — identity, role (`user` | `admin`)
- **Alert** — subscription: what to match + how to notify
- **Event** — something that “happened” (admin-fired for MVP)
- **Delivery** — one attempt to notify one alert about one event
- **Category** / **Severity** — fixed enums (not free entities)

Later (out of scope for this iteration): geo, keywords, free text on events/alerts—extend matcher only.

## Database schema (data model)

Same shape whether memory or Postgres:

```
users
  id            text/uuid PK
  email         text unique
  name          text
  password      text          -- demo only, plain or lightly hashed
  role          text          -- 'user' | 'admin'

alerts
  id            text/uuid PK
  user_id       FK → users
  name          text
  categories    text[] / json -- subset of news|markets|disasters
  min_severity  text          -- low|medium|high
  channel       text          -- email|slack|(future)
  destination   text          -- address / webhook URL / label
  enabled       boolean
  created_at    timestamptz

events
  id            text/uuid PK
  external_id   text null     -- dedupe identity when provided
  title         text
  summary       text null
  category      text
  severity      text
  created_by    FK → users null
  created_at    timestamptz

deliveries
  id            text/uuid PK
  event_id      FK → events
  alert_id      FK → alerts
  user_id       FK → users
  channel       text
  destination   text
  status        text          -- sent|failed|skipped_duplicate
  error         text null
  created_at    timestamptz

  unique (alert_id, dedupe_key)  -- dedupe_key = external_id or event_id
```

**Seed:** 1 admin + 1–2 users. No other tables.

## API endpoints

### Auth

- `POST /api/auth/login` `{ email, password }` → `{ token, user }`

### User (role: user or admin acting as self for own alerts)

- `GET /api/alerts`
- `POST /api/alerts` `{ name, categories, minSeverity?, channel, destination }`
- `PATCH /api/alerts/:id` `{ enabled }`
- `GET /api/deliveries` — own history

### Admin

- `POST /api/admin/events` `{ title, summary?, category, severity, externalId? }` → event + delivery summary
- `GET /api/admin/events`
- `GET /api/admin/alerts`
- `PATCH /api/admin/alerts/:id` `{ enabled }`
- `GET /api/admin/deliveries`
- `GET /api/admin/users`

Auth header: `Authorization: Bearer <token>`. Middleware checks role for `/admin/*`.

## Event-processing flow

```
POST /api/admin/events
  1. Validate payload (category/severity enums)
  2. Persist Event
  3. Load enabled alerts
  4. Matcher: category ∈ alert.categories AND severity ≥ minSeverity
  5. For each match → notification flow (below)
  6. Respond with event + counts { matched, sent, failed, skipped }
```

No async handoff. Matching is a pure function over in-memory/DB alert list.

### Matching rules

An alert matches an event when all are true:

1. `alert.enabled === true`
2. `event.category` is in `alert.categories`
3. `event.severity` ≥ `alert.minSeverity` (order: low < medium < high)
4. Dedup gate has not already produced a delivery for this alert + event identity

**Dedup key:** `(alertId, event.externalId ?? event.id)`. One attempt per key for MVP.

## Notification-processing flow

```
for each matched alert:
  dedupeKey = event.externalId ?? event.id
  if delivery exists for (alertId, dedupeKey):
    record skipped_duplicate (or no-op if unique constraint)
    continue

  adapter = ChannelRegistry.get(alert.channel)
  try:
    adapter.send({ destination, event, alert })
    record Delivery status=sent
  catch:
    record Delivery status=failed, error=message
```

Adapters for MVP **simulate** success (log to console). Optional: force-fail via destination magic string (e.g. `fail@example.com`) to demo failure path.

## How notification channels expand

**Contract** (conceptual):

```
interface NotificationChannel {
  readonly type: string   // 'email' | 'slack' | 'sms' | ...
  send(input: { destination: string; event: Event; alert: Alert }): Promise<void>
}
```

**Registry:** map `type → adapter`. `Notifier` only talks to the interface.

**To add a channel (e.g. SMS):**

1. Implement `NotificationChannel`
2. Register in bootstrap
3. Allow the new `channel` value on create-alert validation
4. UI: add option in the channel dropdown

No changes to matching, event ingest, or delivery schema beyond accepting the new enum value. Destination remains an opaque string interpreted by the adapter.

## Security considerations (MVP-honest)

| Do | Don’t |
| --- | --- |
| Hardcoded seed users + bearer token in memory | Real OAuth/SSO |
| Role check on admin routes | Fine-grained permissions |
| Scope user alert/delivery queries by `userId` | Trust client-sent userId |
| Validate enums/channel type server-side | Expose store dump endpoints |
| Treat passwords as demo secrets in README | Production password hashing theater unless free |

Token can be a random string stored in a `Map` (or signed JWT if already familiar). CSRF less relevant for Bearer token SPA. No public event ingest URL without auth—admin-only `POST` is the simulated source.

## Failure cases

| Case | Behavior |
| --- | --- |
| Bad login | 401 |
| User hits admin route | 403 |
| Invalid category/channel/severity | 400 |
| Toggle/list unknown alert | 404; user cannot toggle others’ alerts |
| Adapter throws / simulated fail | Delivery `failed` + error; event still saved; other alerts continue |
| Duplicate event identity for same alert | Delivery `skipped_duplicate` (or unique constraint → skip) |
| Unknown channel on old alert | Fail that delivery; don’t crash the whole batch |
| Process crash mid-batch | Some deliveries missing; acceptable for MVP (no outbox) |
| Store full / memory reset on restart | Expected with in-memory; document “refresh loses data” |

No retries, DLQ, or partial-transaction saga. Persist delivery outcome is the audit trail.

## What not to introduce

Redis, Kafka, separate notification service, Docker Compose fleets, API gateway, GraphQL, websockets, background workers—unless Postgres is already one `docker run` and you choose it for persistence. Extensibility lives in the **channel adapter interface**, not in new infrastructure.
