# Swift Slots

Swift Slots is a mobile-first web marketplace for last-minute boutique fitness class openings in Montreal. Studios publish canceled or unsold spots at a percentage discount from the original price, and consumers book those openings quickly through a simple web flow.

This project starts from the Micro SaaS Starter codebase. It keeps the current stack and starter integrations for now, while explicitly evaluating which inherited capabilities should be adapted, extended, or removed as Swift Slots becomes more product-specific.

## Product Overview

Swift Slots exists to prove two things:

- Studios can recover revenue from late cancellations.
- Consumers will repeatedly book discounted classes on short notice.

The MVP is intentionally narrow. If a feature does not directly support slot recovery or repeat booking behavior, it is out of scope.

## Core MVP Scope

### Studio operator workflows

- Create and manage a studio profile.
- Post a last-minute slot for a class with class type, start time, available spots, original price, and discount percentage.
- View booking confirmations and slot status.
- Rely on the system to auto-lock a slot 15 minutes before class start if it has not already filled.

### Consumer workflows

- Browse nearby available classes in Montreal.
- View studio, class, timing, and pricing details.
- Book and pay for a single spot with a fast confirmation flow.
- See real-time availability so filled or locked slots are no longer bookable.

## Roles

Swift Slots uses separate product roles:

- `studio_operator`: manages studio information and posts slots.
- `consumer`: browses and books slots.

The docs and implementation should treat these as distinct roles rather than a single shared account type.

## Pricing and Inventory Rules

- The canonical pricing model is `original_price` plus `discount_percent`.
- The discounted price should be derived from those values rather than stored as the primary business input.
- Slots must have a future start time and at least one available spot.
- Slots auto-lock 15 minutes before class start if not already filled.
- Slots cannot be edited after the first booking.
- Overbooking is not allowed.

## Architecture

Swift Slots retains the current Micro SaaS Starter stack:

- Frontend: Next.js App Router application.
- Backend: Supabase Postgres, Supabase Auth, Row Level Security, and migrations-first schema management.
- Payments: Stripe for booking payments and platform commission handling.
- Email: Resend for transactional notifications if enabled.
- Deployment: local Supabase CLI plus Docker for development, and Vercel plus hosted Supabase for production.

The product is web-first. A native mobile application may be added later for consumers booking slots, but the initial MVP should be implemented as a web application.

## Inherited Starter Capabilities

The starter currently includes generic SaaS platform capabilities such as:

- auth and protected routes
- organization and membership scaffolding
- invites
- billing scaffolding
- dashboard and settings shells

Swift Slots should not remove these blindly. Each inherited capability should be evaluated and either:

- reused directly
- adapted into a studio or marketplace concept
- removed once it is clearly unnecessary

The same rule applies to integrations and supporting tools. Prefer extending existing starter functionality when it fits the product cleanly, and remove tools only when they are clearly not needed.

## Local Development

1. Install dependencies.

```bash
npm install
```

2. Copy `.env.example` to `.env.local`.

```bash
copy .env.example .env.local
```

3. Start local Supabase.

```bash
supabase start
```

4. Populate `.env.local`.

- Set `NEXT_PUBLIC_SUPABASE_ANON_KEY` from `supabase status -o env`.
- Keep the existing starter environment variables unless a new variable is genuinely required.
- Add Stripe and Resend values only when those flows are being exercised.

5. Start the app.

```bash
npm run dev
```

6. Open `http://localhost:3000`.

## Verification

Run the existing checks before shipping meaningful changes:

```bash
npm run build
npm run test:backend
```

As Swift Slots replaces starter concepts with domain-specific workflows, the verification surface should evolve with it.

## Production Direction

The intended production path remains:

- Vercel for the Next.js app
- hosted Supabase for the backend
- Stripe for payments
- Resend for transactional email if needed

Production setup should continue to follow the starter's deployment model unless Swift Slots introduces a concrete reason to change it.

## Development Workflow

This repository should follow GitHub Flow:

1. Create a branch from `main` for each feature or fix.
2. Make small, reviewable commits.
3. Open a pull request for review and discussion.
4. Merge only after approval.
5. Keep `main` deployable at all times.

## Out of Scope for the MVP

The MVP should not include:

- long-term schedules
- recurring calendars
- consumer memberships or class packs
- loyalty programs
- multi-city support
- ratings and reviews
- chat or messaging
- studio analytics dashboards
- dynamic pricing

## Success Criteria

The MVP is successful only if the initial launch proves:

- 30-40% of posted slots are rebooked
- 25% or more of consumers book more than once
- studios voluntarily ask for continued access
