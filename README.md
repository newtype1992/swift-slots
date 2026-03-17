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

5. Reset and seed local demo data.

This clears local auth users and rebuilds deterministic Swift Slots demo data, including studio operators, a consumer with a saved fallback address, open/locked/filled slots, and seeded booking history.

```bash
npm run reset:local
```

If you already reset the database separately and only want to recreate the demo data, run:

```bash
npm run seed:local
```

6. Start the app.

```bash
npm run dev
```

7. Open `http://localhost:3000`.

## Local Demo Accounts

After `npm run reset:local`, these local accounts are available:

- `studio.olive@swiftslots.test` / `password123`
- `studio.pulse@swiftslots.test` / `password123`
- `consumer.demo@swiftslots.test` / `password123`
- `consumer.history@swiftslots.test` / `password123`

Seeded fallback address for the primary consumer:

- `consumer.demo@swiftslots.test`
- `5415 Avenue du Parc, Unit 204, Montreal, QC H2V 4G9, Canada`

Seeded local data includes:

- 2 studio operator accounts with studio profiles
- 1 primary consumer account with saved-address fallback coordinates
- 1 extra consumer account with paid and canceled booking history
- open, locked, filled, and expired slots across multiple class types and price points

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

This repository can use a lightweight development workflow:

1. Work directly in the repo when speed matters.
2. Commit in logical slices so changes stay understandable.
3. Use branches and pull requests only when they add real value for a larger or riskier change.

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
