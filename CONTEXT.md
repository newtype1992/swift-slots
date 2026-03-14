# Project Context

This repository is the `v1` reusable platform starter for building micro SaaS applications.

It is intended to be cloned into new product repositories, not to hold every future SaaS idea in a single codebase.

## Current Status

The platform starter is complete for `v1`.

It has been validated for:

- local development with Supabase CLI and Docker
- hosted Supabase migration push
- Vercel deployment
- hosted sign up / sign in / organization creation smoke testing
- backend verification and CI

## Core Architecture

Frontend and app shell:
- Next.js App Router
- protected workspace dashboard and settings shell
- public auth flow

Backend:
- Supabase Postgres database
- Row Level Security
- Supabase Auth
- migrations-first schema management
- server-owned writes for invites, memberships, billing, and activity records

Current reusable platform entities:
- profiles
- organizations
- memberships
- subscriptions
- organization_invites
- activity_logs

Development tools:
- Codex CLI for automated coding
- Supabase CLI for local development and remote linking
- GitHub Actions for CI

## Development Principles

1. Backend-first development
2. Schema changes through migrations only
3. Keep the repo generic and reusable
4. All user-owned tables must use RLS
5. Prefer server-owned writes for sensitive workflows
6. Avoid premature complexity

## Project Goal

Provide a stable platform base for future SaaS products so new product repos can start with:

- auth
- organizations and memberships
- invites
- billing scaffolding
- settings shell
- deployment guidance

## V1 Scope

Included in v1:
- auth and protected routes
- organizations and active workspace context
- member invite lifecycle
- billing scaffolding and entitlement checks
- backend verification tests
- CI
- hosted deployment path

Explicitly out of scope for v1:
- domain-specific product workflows
- live Resend configuration by default
- live Stripe validation by default
- hosted SSR email confirmation callback support
- generator CLI for creating new product repos

## Known Hosted Limitation

Hosted auth currently assumes Supabase `Confirm email` is disabled.

The template does not yet include a dedicated SSR confirmation callback route such as `/auth/confirm`, so email confirmation should remain disabled for the current hosted v1 flow unless that route is added later.
