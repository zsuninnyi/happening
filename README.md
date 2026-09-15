# happening

A notification service to get what is happening around us

# brief

"We want users to be able to set up alerts so they get notified when something important happens in the world — like breaking news, market movements, natural disasters, that kind of thing. Should work for both email and Slack. Make it flexible enough that we can add more channels later. We need an admin view too."

# statement

Since the time is short and the capacity is not endless I would define here what I'm trying to achieve.

# Some question I would ask before I try to desing / implement anything (despite the given task says there is no info about them)

- What is an "important" event, and where the events come from?
- How do we detect the events?
- What does an alert look like, do we have any design guidelines?
- What can the users configure?
- What does the admin do?
- What happens when the Slack and/or email norification fails?
- Do we have any plan about the incoming notification channels?
- How we want to authenticate / authorize users/admins?

# MVP

## The users can

- Log in with hardcoded credentials
- Create an alert
- Set a name and the categories they're interested in (maybe severity)
- Choose a notification channel (Slack / email)
- Turn on / off an alert
- Listing the existing alerts
- Listing the alerts history

## The admin can

- Log in with hardcoded credentials
- Listing the events
- Listing the users
- Listing the configured alerts
- Listing the alerts history
- Turn on / off alerts
- Create a test event

## The system can

- Get an event
- Investigate who should be notified
- Deliver notifications
- Save the delivery results
- Deduplicate events, don't send the same event multiple times

## Architecture

- React (TypeScript) frontend (user login, config, admin)
- Node.js (TypeScript) REST API
- Prisma + SQLite (PostgreSQL optional later)
- Event processor (matching)
- Notification service (channel adapters: email, Slack, extensible)

## Technologies

Language: TypeScript  
Frontend: React, Vite, TanStack Query, TanStack Router, Zod  
Backend: Node.js, Express, Zod  
Auth: demo bearer tokens (in-memory; see security notes below)  
ORM: Prisma  
Database: SQLite locally (swap to PostgreSQL via Prisma `provider` + `DATABASE_URL`)

## API (implemented so far)

| Method  | Path                    | Access        | Notes                                                  |
| ------- | ----------------------- | ------------- | ------------------------------------------------------ |
| `GET`   | `/api/health`           | public        | API + DB check                                         |
| `POST`  | `/api/auth/login`       | public        | `{ email, password }` → `{ token, user }`              |
| `GET`   | `/api/alerts`           | authenticated | own alerts                                             |
| `POST`  | `/api/alerts`           | authenticated | create alert                                           |
| `PATCH` | `/api/alerts/:id`       | authenticated | `{ enabled }` only; 404 if not owned                   |
| `PATCH` | `/api/admin/alerts/:id` | admin         | `{ enabled }` for any user’s alert                     |
| `POST`  | `/api/admin/events`     | admin         | fire test event → match → notify → `{ event, counts }` |
| `GET`   | `/api/deliveries`       | authenticated | own delivery history                                   |
| `GET`   | `/api/admin/events`     | admin         | all events                                             |
| `GET`   | `/api/admin/alerts`     | admin         | all alerts                                             |
| `GET`   | `/api/admin/deliveries` | admin         | all deliveries                                         |
| `GET`   | `/api/admin/users`      | admin         | users (no passwords)                                   |

Simulated channels log to the server console. Destinations starting with `fail@` force a failed delivery (terminal for that dedupe key).

Backend MVP API surface is complete. Use the React UI (no CSS framework) for the product loop.

### MVP gaps (not done yet, not already listed under Out of Scope)

These are part of a credible product loop but are still **simulated or incomplete** in this repo:

- **Real email delivery** — adapters only `console.log`; no SMTP/API provider
- **Real Slack delivery** — adapters only `console.log`; no Incoming Webhook / Slack API calls
- **External event ingest** — events are admin-fired test events only (no provider webhook/poller beyond the admin form)
- **Alert edit** — users can create and enable/disable; they cannot change name, categories, channel, or destination after create
- **Auth durability** — bearer tokens live in process memory; server restart invalidates all sessions
- **Durable DB for demos beyond local** — SQLite file is fine locally; production-shaped Postgres is optional and not wired by default
- **Richer UI coverage** — minimal forms/tables only; limited client tests (no full browser e2e suite)

Intentional non-goals remain under **Out of the Scope** below (geo/keywords, ML, SSO, retries/DLQ, etc.).

### UI routes

| Path             | Who    | Purpose                           |
| ---------------- | ------ | --------------------------------- |
| `/login`         | public | Sign in with seeded users         |
| `/alerts`        | user   | Create / list / toggle own alerts |
| `/history`       | user   | Own delivery history              |
| `/admin/events`  | admin  | Fire test events + list events    |
| `/admin/alerts`  | admin  | List / toggle any alert           |
| `/admin/history` | admin  | All deliveries                    |
| `/admin/users`   | admin  | User list                         |

## Run locally

```bash
cp .env.example .env   # create local env from the example
npm install            # install workspace dependencies
npm run db:push        # apply Prisma schema to the local SQLite DB
npm run db:seed        # seed demo admin + users
npm run dev            # start API (:3001) and Vite UI (:5173)
```

- API: http://localhost:3001 (`GET /api/health`)
- UI: http://localhost:5173

**Demo users (after seed):**

| Email                   | Password   | Role  |
| ----------------------- | ---------- | ----- |
| `admin@happening.local` | `admin123` | admin |
| `alice@happening.local` | `alice123` | user  |
| `bob@happening.local`   | `bob123`   | user  |

**Other useful scripts:**

| Command             | Description                                |
| ------------------- | ------------------------------------------ |
| `npm run lint`      | Run ESLint on server and client            |
| `npm run test`      | Run unit/integration tests                 |
| `npm run format`    | Format the repo with Prettier              |
| `npm run db:reset`  | Reset the DB schema and re-seed demo users |
| `npm run db:studio` | Open Prisma Studio for the local DB        |

### Run the MVP e2e test

Service-level backend path (no browser). Suite: `server/src/e2e/mvpFlow.test.ts`.

**Steps covered:**

1. Login as user (Alice) and admin
2. Create an alert (news, min severity medium, email)
3. Admin fires a matching test event → delivery `sent`
4. Read history lists (user deliveries + admin events/alerts/deliveries/users)
5. Admin re-fires the same `externalId` → delivery skipped (dedupe)
6. Admin disables the alert → further matching events do not notify

Requires a seeded DB (`npm run db:push` and `npm run db:seed` if you haven’t already).

```bash
npm run test -w server -- src/e2e/mvpFlow.test.ts
```

Full server tests: `npm run test -w server`.

### Run the client tests

Minimal UI tests (api client, auth context, login page). No running API required.

```bash
npm run test -w client
```

Watch mode: `npm run test:watch -w client`.  
All workspaces (server + client): `npm run test`.

### ORM / database note

**Prisma + SQLite** is the default so the app runs with a real DB and no Docker.

To move to PostgreSQL later:

1. Set `DATABASE_URL` to a Postgres connection string
2. In `server/prisma/schema.prisma`, set `provider = "postgresql"`
3. Run `npm run db:migrate -w server`

## Out of the Scope

- Geo, keywords, free text for events
- Live feeds from news/markets/disaster APIs
- Smart ranking, ML, “importance” inference
- Full auth (SSO, invites, permissions matrix)
- Multi-tenant orgs, billing, rate plans
- Rich Slack apps (OAuth install, interactive messages)
- Guaranteed delivery, retries with backoff, DLQs (log failure is enough)
- Mobile apps, push, SMS, webhooks as user channels
- Real-time UI (websockets)
- Beautiful design system / marketing site
- Horizontal scale, multi-region, observability suite

## Future considerations

### Application

- Edit alerts after create; optional multi-channel per alert
- Stronger matching later (geo, keywords, free text) without rewriting notify/history
- Replace admin-only test events with a trusted ingest API (API key / signed webhook) when a real event source exists
- Add channels by implementing the existing `NotificationChannel` interface + registry entry + enum/UI option

### Security

See also the hardening list below. Priorities when leaving demo mode: hashed passwords, short-lived tokens/JWT, HTTPS, server-side authorization only, secrets in env/secret store, rate-limited login.

### Reliability

- Keep recording `Delivery` rows as the source of truth for sent/failed
- Add retries with backoff + dead-letter handling for transient provider errors (MVP intentionally skips this)
- Move notify off the request thread (queue/worker) so `POST /admin/events` stays fast under load
- Health checks for DB and notification providers; structured logs/metrics around match → send → persist

### Scalability

- Postgres instead of SQLite; indexes already sketched for user/alert/delivery lookups
- Horizontal API instances need shared session/JWT verification (in-memory tokens do not share)
- Bound fan-out: cap matched alerts per event or process deliveries asynchronously
- Idempotency stays on `(alertId, dedupeKey)`; protect unique constraints under concurrent workers

### How real email and Slack sending should be implemented

Keep the current adapter pattern. Do **not** put provider SDKs inside matching or route handlers.

1. **Keep the contract** — `NotificationChannel.send({ destination, event, alert })` in `server/src/channels/`.
2. **Email adapter**
   - Replace console logging with a provider (e.g. Resend, SendGrid, Amazon SES, or SMTP via nodemailer).
   - Config via env: API key / SMTP URL, from-address.
   - Treat `destination` as the recipient email.
   - On provider error, throw (existing notify loop records `failed` + error message).
   - Remove or gate the `fail@` simulation behind `NODE_ENV=test` / a dedicated test adapter.
3. **Slack adapter**
   - MVP-friendly path: **Incoming Webhook URL** stored as `destination` (or a webhook URL looked up from a channel name later).
   - `POST` a simple JSON payload (`text` or Block Kit) with event title, category, severity, alert name.
   - Alternative later: Slack Bolt/OAuth app posting to channel IDs — more setup, same adapter boundary.
   - On non-2xx webhook response, throw so delivery is marked `failed`.
4. **Register adapters** in `server/src/channels/registry.ts` the same way as today.
5. **Do not change** matching, dedupe, or `Delivery` persistence when swapping simulated → real senders.
6. **Secrets** — never commit provider keys; document required env vars in `.env.example` only as placeholders.

### Future security improvements (out of scope for MVP)

Current auth is demo-only: plain-text seed passwords and random bearer tokens kept in process memory.

Possible next steps when hardening:

- **JWT (or signed sessions)** — replace opaque in-memory tokens with signed access tokens (short TTL) so APIs can verify identity without a shared token map; optional refresh tokens for longer sessions
- **Password hashing** — store bcrypt/argon2 hashes instead of plain-text passwords; never return password fields from any API
- **Token lifecycle** — expiry, logout/revocation list, rotate tokens on privilege change
- **HTTPS + secure cookie option** — serve over TLS; consider `httpOnly` / `Secure` / `SameSite` cookies instead of localStorage bearers if the UI is first-party
- **Stronger authorization** — keep role checks server-side; broaden resource-level checks as admin/cross-user APIs grow; avoid trusting client-sent `userId` / `role`
- **Login abuse controls** — rate-limit `/auth/login`, generic 401 messages (already), optional lockout/alerting
- **Secrets management** — move credentials and signing keys to env/secret store; no demo passwords in docs for non-local environments
- **Later identity providers** — OAuth2/OIDC (Google, etc.) or SSO when multi-user production access is required
