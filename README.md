# Micro SaaS Starter Template

This repository is a backend-first starter template for building micro SaaS applications using:

- Supabase for database, auth, storage, and local infrastructure
- Next.js for the first authenticated application shell
- Codex CLI for implementation and iteration
- migrations-first schema management with RLS enabled by default

## Current Milestone

The starter now supports the first real SaaS workflow:

- sign up or sign in with Supabase Auth
- land in a protected dashboard
- create an organization through the `create_organization` RPC
- switch between organizations with a persisted active workspace
- initialize a canonical subscription row for every organization
- display workspace billing state and entitlement usage
- log billing lifecycle events into the workspace activity feed
- apply plan-based retention windows to historical activity and invite history
- invite members through server-owned actions
- resend or revoke invites from the owner dashboard
- accept invites through a dedicated onboarding link
- read back profile, membership, and invite data through RLS-protected queries

## Local Development Setup

1. Run `npm install`
2. Copy `.env.example` to `.env.local`
3. Fill `NEXT_PUBLIC_SUPABASE_ANON_KEY` from `supabase status -o env`
4. Optional: set `RESEND_API_KEY` and `EMAIL_FROM` to enable invite email delivery
5. Optional: set Stripe keys to enable paid checkout and portal flows
6. In Stripe, create recurring prices with lookup keys:
   - `micro-saas-starter-pro-monthly`
   - `micro-saas-starter-business-monthly`
7. Point your Stripe webhook to `/api/stripe/webhooks`
8. Run `supabase start`
9. Run `npm run dev`
10. Open `http://localhost:3000`

## Verification

- Run `npm run test:backend` to verify the sensitive local flows:
  - org and membership RPCs
  - entitlement limits and retention windows
  - Stripe webhook sync and billing activity logs
- Run `npm run build` before shipping template changes
- GitHub Actions now runs the same verification flow automatically on pull requests and pushes to `main`

## Local URLs

- App: `http://localhost:3000`
- Supabase Studio: `http://127.0.0.1:54323`
- Local inbox: `http://127.0.0.1:54324`

## Development Philosophy

- Backend first
- Migrations only, no direct schema edits
- RLS enabled on user data
- server-owned writes for billing and audit-sensitive records
- server-owned invite and membership changes
- Local development before production deployment
