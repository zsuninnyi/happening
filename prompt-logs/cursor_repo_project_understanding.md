# Repo project understanding
_Exported on 9/14/2026 at 17:25:06 GMT+2 from Cursor (3.17.8)_

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

