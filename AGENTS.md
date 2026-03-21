# Agent Instructions

This repository is intended to be developed primarily with ChatGPT Codex and the Codex CLI, with manual steps called out explicitly when automation is not enough. Before making changes, read `CONTEXT.md` and `UX-ARCHITECTURE.md`.

## Development Rules

1. Migrations first. Never change the database schema manually. Add or modify schema through Supabase migrations only.
2. Preserve the current stack by default. Swift Slots keeps the existing starter stack unless there is a clear product reason to change it.
3. Evaluate inherited starter capabilities before removing them. Organizations, invites, billing scaffolding, and similar starter features should be reviewed and either adapted, extended, or removed deliberately.
4. Keep roles explicit. Studio operators and consumers are separate product roles and should be modeled that way in schema, authorization, and UI decisions.
5. Use percentage discounts as the source of truth. Store `original_price` and `discount_percent`; derive discounted display pricing from those values.
6. Keep the slot lifecycle consistent. Slots auto-lock 15 minutes before class start, disappear when filled or locked, and cannot be edited after the first booking.
7. Minimize environment changes. Reuse the starter environment variables when possible. Introduce new variables only when necessary and document them.
8. Explain architecture changes before or with implementation. If a change replaces a starter abstraction or adds a new domain abstraction, explain why.
9. Prefer simple solutions. Avoid unnecessary abstraction or speculative infrastructure.
10. Validate backend changes with Supabase before continuing.
11. For frontend work, follow the product flow and component direction in `UX-ARCHITECTURE.md` unless a deliberate product decision changes it.

## Workflow

Use a lightweight workflow by default:

1. Work directly in the current branch when that is the fastest path.
2. Keep commits focused and readable.
3. Use branches or pull requests only when they help with review, coordination, or rollback safety.

## Safety Rules

- Never delete existing migrations.
- Do not expose service role keys or other secrets in code or output.
- Do not assume production credentials.
- Do not remove starter functionality just because it is generic; remove it only after deciding it has no product value.

## Working Style

- Use Codex CLI as the default implementation path whenever practical.
- If a step must be done manually, call it out clearly.
- Keep task summaries concrete and implementation-focused.
- When product and starter concerns conflict, prefer the Swift Slots product rules documented in `CONTEXT.md`.

## Task Priorities

Suggested build order:

1. Core schema and roles
   - add `studios`, `slots`, and `bookings`
   - define separate `studio_operator` and `consumer` roles
   - add RLS policies and server-owned writes where needed
2. Studio management
   - create and edit studio profiles
   - post last-minute slots
   - enforce lock and edit rules
3. Consumer marketplace
   - list nearby available slots in Montreal
   - support a fast detail and booking flow
   - keep spot counts accurate in real time
4. Payments
   - process booking payments with Stripe
   - apply platform commission logic
   - document webhook and Stripe setup steps
5. Notifications and geolocation
   - add only the pieces needed to support the MVP cleanly
   - prefer extending existing integrations before adding new ones

## Required Output After Each Task

After completing a task, respond with:

1. Summary of the work completed.
2. Files modified.
3. Manual setup steps still required.
4. Suggested next step.
