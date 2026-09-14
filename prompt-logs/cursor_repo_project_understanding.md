# Repo project understanding
_Exported on 9/14/2026 at 17:40:09 GMT+2 from Cursor (3.17.8)_

---

**User**

Do you know and understand what I want to build in this repo from the @README.md ?

---

**Cursor**

I'll read the README and check whether it clearly describes what you're building.

Yes. From the README, here’s what I take as the target:

**Product:** A notification service (“happening”) that lets users get alerted when important real-world events occur (breaking news, markets, disasters, etc.) via email and Slack, with room for more channels later, plus an admin view.

**MVP scope you’ve locked in:**
- **Users:** create/configure alerts (name, categories, maybe severity), pick Slack or email, enable/disable, list alerts and delivery history
- **Admins:** list events, users, alerts, and history; enable/disable alerts
- **System:** ingest events → match subscribers → deliver → persist results → dedupe so the same event isn’t sent twice

**Stack direction:** TypeScript end-to-end — React frontend, Node REST API, PostgreSQL, plus an event processor (matching) and a notification service for multi-channel delivery.

You’ve also flagged open questions (event source/definition, auth, failure handling, UI, etc.) that you’ll decide under time/capacity constraints rather than leave unbounded.

If that matches your intent, we can start from architecture/MVP or from the open questions you care about most.

---

**User**

okay so you are acting as a senior product engineer helping me turn an ambiguous product brief into a small but credible MVP.

Here is the brief again which you can find in the README.md file:

"We want users to be able to set up alerts so they get notified when something important happens in the world — like breaking news, market movements, natural disasters, that kind of thing. Should work for both email and Slack. Make it flexible enough that we can add more channels later. We need an admin view too."

Before proposing an implementation, analyze the ambiguity.

Identify:

What the product is trying to achieve.
The likely primary user journey.
The major unanswered product questions.
The technical uncertainties.
The assumptions we could reasonably make for a 3–5 hour MVP.
What should explicitly be considered out of scope.
The riskiest parts of the problem.


Do NOT write code.

Do NOT attempt to solve every ambiguity.

Focus on helping an engineer make pragmatic decisions under time constraints.

---

**Cursor**

## What the product is trying to achieve

Give people a way to say “tell me when X-type of world event happens,” then actually deliver that notice on a channel they already check (email / Slack). Admin exists so someone can see what the system knows and what users configured—not so the product becomes a full ops console.

Core loop: **subscribe → event arrives → match → notify → record**.

---

## Likely primary user journey

1. Sign in (or land in a demo account)
2. Create an alert: name + categories of interest (+ optional severity)
3. Choose email and/or Slack destination
4. Leave it on
5. When a matching event occurs, get a notification
6. Later: check alert list / delivery history (“did it fire?”)

Admin secondary path: browse events, users, alerts, history; flip an alert off if needed.

---

## Major unanswered product questions

| Question | Why it matters |
|---|---|
| What is an “event”? Who defines importance? | Without a source + taxonomy, matching is undefined |
| Where do events come from? | Scraping vs API vs manual seed changes the whole MVP |
| What can users actually configure? | Categories only vs keywords, regions, severity, frequency |
| Email/Slack: real delivery or simulated? | Credentials, rate limits, failure UX |
| Who is the admin vs user? | Auth model, or shared demo with a role flag |
| What does history show? | Delivered / failed / skipped-dupe — and to whom |
| Multi-channel per alert or one channel? | Schema and UX complexity |
| Slack: DM, webhook, or channel? | Setup burden for a short build |

You already listed most of these in the README; the ones that **block design** are event source, match criteria, and auth.

---

## Technical uncertainties

- Event ingestion model (push webhook vs poll vs manual insert)
- Matching rules (exact category, severity threshold, future keyword search)
- Dedup key (external id? content hash? time window?)
- Sync request vs async worker for delivery
- Channel abstraction (strategy/plugin vs if/else for two channels)
- DB shape for alerts, events, deliveries
- Frontend depth (real forms + tables vs thin admin)
- How Slack/email are configured in a local demo (env vars, fake adapters)

None of these need a perfect answer for MVP—but each needs a **default**.

---

## Reasonable assumptions for a 3–5 hour MVP

Make these explicit so you stop debating them:

1. **Events are ingested, not discovered.** Seed + a simple “create event” API (or admin form). No live news/market feeds.
2. **Importance = category (+ optional severity).** Fixed enum: e.g. `news`, `markets`, `disasters` (and maybe `other`). User picks one or more.
3. **Matching is simple:** alert is on + shares a category + severity ≥ threshold (if used). No NLP, geo, or free-text search.
4. **One destination per alert** for speed (email *or* Slack); multi-channel later.
5. **Auth is minimal:** single-user / hardcoded demo users with `user` | `admin` roles, or no real auth and a role switcher. Don’t build OAuth.
6. **Notifications can be “real enough”:** email via a free SMTP/API if easy, Slack via incoming webhook; otherwise **console/log adapter** behind the same interface so the pipeline is real.
7. **Dedup by `event.externalId` or content hash** at delivery time; skip + record `skipped_duplicate`.
8. **Delivery is synchronous in-process** on ingest for simplicity; queue later.
9. **Admin = read-mostly lists + enable/disable alerts.** No analytics, moderation, or event editing beyond create/list.
10. **Stack as in README:** React + Node REST + Postgres is fine; skip extras (Redis, Kafka, microservices).

---

## Explicitly out of scope

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

---

## Riskiest parts (under time pressure)

1. **Event source vacuum** — If you wait for a “real” feed, you never finish matching/delivery. Seeded events unblock everything.
2. **Channel integration rabbit hole** — Slack OAuth or flaky email eats the whole budget. Prefer webhook + adapter interface; fake sender is acceptable if labeled.
3. **Scope creep on “flexible channels”** — Flexibility = a small `Channel` interface + two implementations, not a plugin marketplace.
4. **Auth theater** — Perfect auth doesn’t prove the product; role flag does.
5. **Over-modeling matching** — Categories beat keywords for a short MVP; keywords invite false confidence and edge cases.
6. **Admin becoming a second product** — Lists + toggle is enough to show the brief was met.

---

## Pragmatic decision frame

For this time box, optimize for proving: **user configures interest → system receives event → right people get notified → history/admin can inspect it.**

Defer anything that doesn’t sit on that path. The brief’s ambiguity is mostly about *world event intelligence*; your MVP should honestly be an **alert routing + multi-channel notification skeleton** with a stand-in event stream—not a news intelligence platform.

If useful next, I can turn this into a one-page MVP cut (entities, API sketch, and a build order for the 3–5 hours)—still without code.

