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

## Technologies (TBD)

Language: Typescript
Frontend: React
Backend: NodeJS
API: REST
Database: PostgreSQL

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
