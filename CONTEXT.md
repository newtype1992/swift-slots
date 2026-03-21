# Context

Swift Slots is a mobile-first web marketplace for discounted last-minute boutique fitness class openings in Montreal. It is built from the Micro SaaS Starter foundation, but its product direction is now specific: help studios recover revenue from late cancellations and help consumers book spontaneous workouts quickly.

## Product Goal

The MVP exists to validate two core assumptions:

1. Boutique fitness studios will use the product to recover revenue from canceled spots.
2. Consumers will repeatedly book discounted classes on short notice.

Everything in scope should support one of those two outcomes.

## Target Users

### Studio operators

Job to be done:
"When a class spot cancels last minute, help me resell it quickly with minimal effort and without harming my brand or margins."

Pain points:

- lost revenue from no-shows and late cancellations
- manual or slow recovery workflows
- little control over how discounts are presented

Success metrics:

- percentage of canceled slots rebooked
- recovered revenue per week

### Consumers

Job to be done:
"When I decide to work out spontaneously, show me nearby discounted classes I can book instantly."

Pain points:

- last-minute classes are hard to discover
- spontaneous plans still cost full price
- no single marketplace for real-time openings

Success metrics:

- repeat bookings per user
- time from app open to booking confirmation

## MVP Scope

### Studio capabilities

- Create and maintain a studio profile.
- Post last-minute slots for classes.
- Set class type, start time, available spots, original price, and discount percentage.
- View bookings and slot status.
- Let the system auto-lock unfilled slots 15 minutes before class start.

### Consumer capabilities

- Browse nearby available slots in Montreal.
- View studio, class, distance, timing, and pricing details.
- Book one spot at a time.
- Pay at booking and receive immediate confirmation.

### Payments and monetization

- Consumers pay when they book.
- The platform keeps a 10-15% commission.
- The studio receives the remainder.
- There are no studio subscriptions or consumer memberships in the MVP.

## Canonical Product Rules

### Pricing

- The product should store `original_price` and `discount_percent` as the primary pricing inputs.
- Discounted display price should be derived from those values.

### Roles

- `studio_operator` and `consumer` are separate roles.
- The docs and implementation should not assume a shared combined role model unless that decision is revisited later.

### Slot lifecycle

- A slot must have a future start time.
- A slot must have at least one available spot.
- A slot auto-locks 15 minutes before class start if it is still open.
- A slot disappears from the marketplace when filled or locked.
- A slot cannot be edited after the first booking.
- Overbooking is not allowed.

### Geography

- The MVP is limited to Montreal.
- Marketplace ordering should prioritize proximity and start time using the simplest reliable approach first.

## Conceptual Data Model

### Studio

- id
- operator user reference
- name
- location
- class categories

### Slot

- id
- studio_id
- class_type
- start_time
- class_length
- original_price
- discount_percent
- available_spots
- status

### Booking

- id
- consumer user reference
- slot_id
- payment_status
- created_at

## Relationship to the Starter

Swift Slots inherits the Micro SaaS Starter stack and some generic product scaffolding, including auth, organizations, invites, billing scaffolding, and dashboard surfaces.

These inherited capabilities should be treated as assets to evaluate, not permanent product truths. For each starter feature, prefer one of these outcomes:

- adapt it to Swift Slots if the abstraction still fits
- extend it if it already solves part of the problem cleanly
- remove it if it no longer serves the product

The same evaluation rule applies to integrations and support tooling.

## Engineering Direction

- Keep the existing tech stack.
- Build the MVP as a web application first.
- A native mobile client may be added later, most likely for consumers, but it is not part of the initial implementation target.
- Keep schema changes migrations-first.
- Keep sensitive writes server-owned where appropriate.
- Prefer simple implementations over premature abstractions.
- Follow the UX and component direction documented in `UX-ARCHITECTURE.md` for future UI work.

## Non-Goals

The MVP must not include:

- long-term schedules
- recurring calendars
- consumer subscriptions
- class packs
- loyalty systems
- multi-city rollout
- ratings or reviews
- chat or messaging
- studio analytics dashboards
- dynamic pricing

## Success Criteria

The MVP is considered successful if:

- 30-40% of posted slots are rebooked
- at least 25% of consumers book more than once
- studios ask for continued access without being pushed

## Near-Term Build Sequence

The likely first implementation slices are:

1. Define roles and core schema for studios, slots, and bookings.
2. Replace or adapt starter organization concepts where needed.
3. Build studio profile and slot posting flows.
4. Build the consumer marketplace and booking flow.
5. Add payments, notifications, and geolocation only as needed to support the MVP.
