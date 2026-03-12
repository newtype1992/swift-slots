# Project Context

This repository is a reusable starter template for building micro SaaS applications.

The template is designed to work with Codex CLI and Supabase.

## Core Architecture

Backend:
- Supabase Postgres database
- Row Level Security
- Supabase Auth
- Supabase Edge Functions

Development tools:
- Codex CLI for automated coding
- Supabase CLI for local development
- MCP server for AI database interaction

## Development Principles

1. Backend-first development
2. Schema changes through migrations only
3. All user-owned tables must use RLS
4. Every table should include created_at and updated_at timestamps
5. Avoid premature complexity

## Initial Database Concepts

Typical entities for micro SaaS:

- users / profiles
- organizations (optional)
- memberships
- subscriptions
- activity logs

## Project Goal

Allow Codex to quickly scaffold and test backend infrastructure for new SaaS ideas.

This repository will evolve into a reusable SaaS template factory.