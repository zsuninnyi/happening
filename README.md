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

- React (Typescript) Frontend (user login, config, admin)
- NodeJS (Typescript) Rest API
- A Database (PostgreSQL?)
- Event processor
  - Mathicng
- Notification service (adapter) (sending the notification via multiple channels, email, Slack and others in the future)

## Technologies

Language: TypeScript  
Frontend: React, Vite, TanStack Query, TanStack Router, Zod  
Backend: Node.js, Express, Zod  
ORM: Prisma  
Database: SQLite locally (swap to PostgreSQL via Prisma `provider` + `DATABASE_URL`)

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

| Email | Password | Role |
| --- | --- | --- |
| `admin@happening.local` | `admin123` | admin |
| `alice@happening.local` | `alice123` | user |
| `bob@happening.local` | `bob123` | user |

**Other useful scripts:**

| Command | Description |
| --- | --- |
| `npm run lint` | Run ESLint on server and client |
| `npm run test` | Run unit/integration tests |
| `npm run format` | Format the repo with Prettier |
| `npm run db:reset` | Reset the DB schema and re-seed demo users |
| `npm run db:studio` | Open Prisma Studio for the local DB |

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

### Future security improvements (out of scope for MVP)

Current auth is demo-only: plain-text seed passwords and random bearer tokens kept in process memory.

Possible next steps when hardening:

- **JWT (or signed sessions)** — replace opaque in-memory tokens with signed access tokens (short TTL) so APIs can verify identity without a shared token map; optional refresh tokens for longer sessions
- **Password hashing** — store bcrypt/argon2 hashes instead of plain-text passwords; never return password fields from any API
- **Token lifecycle** — expiry, logout/revocation list, rotate tokens on privilege change
- **HTTPS + secure cookie option** — serve over TLS; consider `httpOnly` / `Secure` / `SameSite` cookies instead of localStorage bearers if the UI is first-party
- **Stronger authorization** — keep role checks server-side; add resource-level checks (users only touch their own alerts) as features grow; avoid trusting client-sent `userId` / `role`
- **Login abuse controls** — rate-limit `/auth/login`, generic 401 messages (already), optional lockout/alerting
- **Secrets management** — move credentials and signing keys to env/secret store; no demo passwords in docs for non-local environments
- **Later identity providers** — OAuth2/OIDC (Google, etc.) or SSO when multi-user production access is required
