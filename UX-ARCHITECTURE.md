# Swift Slots UX Architecture

## Direction

Swift Slots should move toward a component-based UI system with a custom product feel.

Recommended approach:

- use an internal Swift Slots design system
- use open-code component patterns instead of a heavy black-box UI framework
- prefer `shadcn/ui` style distribution and `Radix` primitives where accessible behavior is needed
- keep brand, spacing, typography, and layout decisions owned by the product

This means:

- do not rebuild every interaction from raw HTML if a good primitive already exists
- do not adopt a full framework visual language like Chakra defaults as the product identity
- build a small reusable system that can later support web and a future mobile client

## Design Principles

1. Fast path first
- the consumer should get from discovery to booking with minimal friction

2. Mobile-first behavior
- every primary flow should work cleanly on a phone before being expanded for desktop

3. Two-role clarity
- operator and consumer workflows should feel distinct, not like one generic SaaS dashboard

4. Marketplace density
- discovery screens should prioritize useful information over decorative space

5. Confidence at checkout
- pricing, timing, discount, and confirmation states must be obvious

## System Layers

### Layer 1: Foundations

- color tokens
- typography tokens
- spacing scale
- radii
- elevation
- motion rules
- form states
- status colors

### Layer 2: Primitives

- `AppShell`
- `PageHeader`
- `SectionHeader`
- `Card`
- `MetricCard`
- `Tag`
- `Button`
- `Input`
- `Select`
- `Textarea`
- `Notice`
- `EmptyState`
- `FilterBar`
- `Sheet` or `Dialog`

These should stay thin and product-owned.

### Layer 3: Domain Components

- `StudioSummaryCard`
- `SlotCard`
- `SlotStatusBadge`
- `DiscountPill`
- `BookingSummary`
- `LocationStatusCard`
- `MarketplaceFilterBar`
- `StudioProfileForm`
- `SlotComposer`
- `BookingConfirmationCard`

### Layer 4: Screen Patterns

- auth split view
- operator dashboard
- studio setup page
- slot posting page
- marketplace list
- slot detail
- checkout return state
- profile settings

## Information Architecture

### Consumer

- `Dashboard`
  - quick state
  - recent bookings later
- `Marketplace`
  - discovery
  - filters
  - ranking by location and time
- `Booking confirmation`
- `Profile settings`

### Studio operator

- `Dashboard`
  - studio readiness
  - current slot inventory
  - booking activity later
- `Studio settings`
  - studio identity
  - address
  - categories
- `Slot management`
  - post slot
  - monitor open, filled, locked, expired
- `Profile settings`

### Starter carryover to deprioritize

- organization settings
- billing settings
- invite flows

These should remain out of the main product path unless deliberately repurposed.

## Consumer Flow

### Primary path

1. Land in marketplace
2. Allow device location or use saved fallback
3. Scan nearby classes
4. Apply filter if needed
5. Open slot detail
6. Confirm class and price
7. Start Stripe checkout
8. Return to booking confirmation
9. Receive confirmation email

### Consumer wireframe outline

#### Marketplace list

- top bar
  - title
  - location status
  - profile shortcut
- filter bar
  - class type
  - start window
  - max price
  - min discount
- results list
  - studio
  - class type
  - time
  - distance
  - discount
  - price now
  - spots left
  - CTA

#### Slot detail

- hero summary
  - class type
  - studio
  - time
  - address
- decision section
  - original price
  - discount percent
  - discounted price
  - spots left
- CTA
  - reserve spot and pay

#### Booking confirmation

- success state
- booking details
- location
- date and time
- amount paid
- CTA back to marketplace

## Studio Operator Flow

### Primary path

1. Sign in
2. Complete studio profile
3. Add location and categories
4. Post open slot
5. Monitor inventory state
6. Receive booking alert

### Operator wireframe outline

#### Operator dashboard

- status overview
  - studio configured
  - open slots
  - filled slots
- quick action
  - post slot
- recent slot cards

#### Studio settings

- studio identity form
  - name
  - slug
  - address
  - categories
  - description
- save action

#### Slot composer

- class type
- start time
- length
- original price
- discount percent
- available spots
- derived discounted price preview
- publish action

## UX Improvements Needed In The Current Product

1. The app still exposes inherited starter surfaces too prominently.
2. Consumer pages should feel more marketplace-like and less dashboard-like.
3. Operator slot management should become its own first-class area instead of living only inside settings.
4. Booking history and operator booking activity need clearer dedicated surfaces later.

## Recommended Next UI Build Order

1. Hide or demote inherited starter navigation.
2. Promote marketplace as the primary consumer home.
3. Split operator studio management into:
- `Studio profile`
- `Slots`
4. Build a reusable `FilterBar` and `SlotCard` system.
5. Tighten mobile layouts for marketplace and slot detail.

## Figma Plan

Create three low-fidelity boards:

1. Information architecture
- role entry points
- primary routes
- hidden or deprecated starter routes

2. Consumer flow
- marketplace
- slot detail
- checkout handoff
- confirmation

3. Operator flow
- dashboard
- studio setup
- post slot
- slot list

For each frame, annotate:

- primary goal
- primary CTA
- secondary CTA
- failure or empty state

## Decision

Swift Slots should use a hybrid component strategy:

- custom product design system first
- `shadcn/ui` style open-code components where they accelerate implementation
- `Radix` primitives for accessibility-heavy interactions
- no full visual dependence on Chakra or Bulma
