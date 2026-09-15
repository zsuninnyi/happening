# Implementation plan

Total implementation time: ~3.5–4 hours.  
Order work so a working end-to-end solution exists as early as possible.  
Prioritize functionality over polishing.

**Run story:** root `npm install` once, then `npm run db:push -w server` and `npm run dev` starts API + UI. Prisma + SQLite locally (Postgres optional later); no Docker required for MVP.

**E2E milestone:** after Step 4 you can prove the product with curl (login → alert → fire event → deliveries). UI comes after.

Suggested layout:

```
/
  package.json          # workspaces + dev script
  server/               # Node/Express (or Fastify) + TS
  client/               # Vite + React + TS
```

---

## Step 0 — Scaffold & run scripts

- **Approx time:** 25 min
- **Depends on:** none
- **Should add tests:** no

**Goal:** Empty API + empty React app start locally with one command.

**Files / modules likely created:**

- `package.json`
- `server/package.json`
- `server/src/index.ts`
- `client/` (Vite + React + TS)
- Run section in `README.md`

**Acceptance criteria:**

- `npm run dev` serves API health (`GET /api/health`) and Vite UI

---

## Step 1 — Domain types, Prisma schema, seed

- **Approx time:** 25 min
- **Depends on:** Step 0
- **Should add tests:** yes (domain + unique constraint)

**Goal:** Zod domain types + Prisma models/relations + seed users (no in-memory store).

**Files / modules likely created:**

- `server/prisma/schema.prisma` (User, Alert, Event, Delivery)
- `server/prisma/seed.ts`
- `server/src/domain/types.ts`
- `server/src/domain/severity.ts`
- `server/src/domain/dedupe.ts`
- `server/src/domain/categories.ts`

**Acceptance criteria:**

- Seed: 1 admin + 1–2 users
- Prisma relations for users ↔ alerts/events/deliveries
- Unique constraint on `(alertId, dedupeKey)`
- Severity ordinal helpers (not string compare)

---

## Step 2 — Auth (login + middleware)

- **Approx time:** 20 min
- **Depends on:** Step 1
- **Should add tests:** yes (token store, middleware 401/403, login)

**Files / modules likely created:**

- `server/src/auth/tokens.ts`
- `server/src/auth/middleware.ts`
- `server/src/routes/auth.ts`

**Acceptance criteria:**

- `POST /api/auth/login` returns token + user **without password**
- `Authorization: Bearer` required on protected routes
- Non-admin → 403 on `/api/admin/*`

---

## Step 3 — Alerts API (user + admin toggle)

- **Approx time:** 25 min
- **Depends on:** Step 2
- **Should add tests:** yes (create/list scope, toggle ownership, admin toggle, validation)
- **Status:** done

**Goal:** Create / list / toggle own alerts; admin can toggle any alert.

**Files / modules:**

- `server/src/routes/alerts.ts`
- `server/src/routes/admin.ts` (`PATCH /alerts/:id`)
- `server/src/services/alerts.ts`

**Acceptance criteria:**

- Authenticated user: `POST/GET /api/alerts`, `PATCH /api/alerts/:id` `{ enabled }`
- Admin: `PATCH /api/admin/alerts/:id` `{ enabled }` for any user’s alert
- `categories.length >= 1`
- Default `minSeverity = low`
- User cannot toggle another user’s alert (404)

---

## Step 4 — Match + notify + fire event (first E2E)

- **Approx time:** 45–50 min
- **Depends on:** Steps 1–3
- **Should add tests:** yes (matcher, notify/dedupe, channel adapters, MVP e2e path)
- **Status:** done

**Goal:** Admin fires event → match → simulated channels → deliveries + counts.

**Files / modules:**

- `server/src/matching/matchAlerts.ts`
- `server/src/channels/types.ts`
- `server/src/channels/emailChannel.ts`
- `server/src/channels/slackChannel.ts`
- `server/src/channels/registry.ts`
- `server/src/services/notifications.ts`
- `server/src/services/events.ts`
- `server/src/routes/admin.ts` (`POST /events`)
- `server/src/e2e/mvpFlow.test.ts`

**Acceptance criteria:**

- `POST /api/admin/events` persists event, notifies matching alerts via adapters (console log)
- Returns `{ event, counts: { matched, sent, failed, skipped } }`
- Dedupe: second fire same `externalId` → skip count only, no second row
- Destination `fail@…` → `failed` terminal
- Unknown channel fails that delivery only
- Sync processing in-request (no queue)

**Tests:**

- Unit: matcher (category, severity ordinals, disabled)
- Unit: notification/dedupe (sent, skip, failed terminal)
- Unit: channel registry / simulated failure
- E2E path (service-level): login → create alert → fire event → dedupe → admin disable alert

**Manual curl happy path also proves the MVP core.**

---

## Step 5 — History + remaining admin lists

- **Approx time:** 20 min
- **Depends on:** Step 4
- **Should add tests:** yes (delivery ownership, admin lists, e2e path extended)
- **Status:** done

**Goal:** Read paths for demo / UI.

**Files / modules:**

- `server/src/routes/deliveries.ts`
- `server/src/services/deliveries.ts`
- `server/src/services/users.ts`
- `listAllAlerts` / `listEvents` on existing services
- Admin `GET`s on `server/src/routes/admin.ts`

**Acceptance criteria:**

- `GET /api/deliveries` (own)
- Admin `GET` events / alerts / deliveries / users (no passwords)
- Admin alert toggle already done in Step 3 — not reimplemented
  Implement that step>

---

## Step 6 — Minimal React UI

- **Approx time:** 50–60 min
- **Depends on:** Steps 2–5
- **Should add tests:** no

**Goal:** Thin screens to drive the loop; no polish.

**Files / modules likely created:**

- `client/src/api.ts`
- `client/src/AuthContext.tsx`
- Pages: `Login`, `Alerts`, `History`
- Admin pages: `Events`, `Alerts`, `History`, `Users`
- Basic router + nav by role

**Acceptance criteria:**

- User: login → create alert → see list/toggle → see history
- Admin: login → fire test event → see events/deliveries; toggle any alert
- Functional forms/tables only

---

## Step 7 — Wire-up, seed docs, smoke

- **Approx time:** 15 min
- **Depends on:** Steps 0–6
- **Should add tests:** no (manual smoke)

**Goal:** One-command local run + credentials documented.

**Files / modules likely created:**

- Root `package.json` scripts
- Short “Run locally” in `README.md` (seed emails/passwords)

**Acceptance criteria:**

- Fresh clone: `npm install && npm run dev`
- Full loop in browser without manual curl

---

## Suggested timeline

| Step                   | Time | Cumulative |
| ---------------------- | ---- | ---------- |
| 0 Scaffold             | 25m  | 25m        |
| 1 Store/types          | 25m  | 50m        |
| 2 Auth                 | 20m  | 1h10       |
| 3 Alerts               | 25m  | 1h35       |
| 4 E2E pipeline + tests | 50m  | 2h25       |
| 5 Admin/history APIs   | 20m  | 2h45       |
| 6 UI                   | 55m  | 3h40       |
| 7 Run docs/smoke       | 15m  | ≈3h55      |

If behind: cut Step 6 to **Login + Alerts + Admin Fire Event + one History table**; drop Admin Users page. Keep Step 4 tests.

---

## Test policy

| Area                                  | Tests?               |
| ------------------------------------- | -------------------- |
| Matcher + severity ranks              | Yes                  |
| Dedupe / failed-terminal notify logic | Yes                  |
| HTTP routes, UI, adapters             | No for this time box |

---

## Explicit non-work

Do not implement in this MVP:

- Postgres (or any persistence beyond in-memory)
- Real email or Slack network delivery (simulated adapters only)
- Polished CSS / design system
- Edit alert (beyond enable/disable)
- Signup / registration
- Retries, DLQ, outbox, background workers
- Channels beyond email/slack stubs
- Geo, keywords, free text matching
- Live external event feeds
- OAuth / SSO / production-grade auth
- Microservices, Redis, Kafka, websockets
- API gateway, GraphQL
- Mobile apps, push, SMS as user channels
- Horizontal scale, multi-region, full observability suite

---

## Order rationale

Store → auth → alerts → **process event** unlocks the product story before any UI. Lists and React are presentation on top of an already-working backend.
