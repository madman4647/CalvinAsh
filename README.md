# Calvin 2.0

Calvin is IIM Lucknow's CCA selection platform. Students apply to Committees,
Clubs and AIGs; CCAs run selection rounds (tasks and interviews) through
panels of their members; Senate monitors everything and runs the final
allocation.

This is a from-scratch rebuild, built one gated loop at a time. See
[`CLAUDE.md`](CLAUDE.md) for how the project is run loop by loop, and
[`docs/PLAN.md`](docs/PLAN.md) for the rules, invariants and execution plan
that is the source of truth for behaviour.

## Tech stack

- **Client**: React 18 + Vite + Tailwind CSS (`client/`)
- **Server**: Node.js + Express + `pg` (`server/`)
- **Database**: PostgreSQL 15+, migrated with [node-pg-migrate](https://github.com/salsita/node-pg-migrate) (`migrations/`)
- **Tests**: Vitest + Supertest (server, against a real Postgres), Playwright (end-to-end)

The repo is an npm workspace (`client`, `server`) so the whole stack installs
and runs from the root with one command.

## Prerequisites

- Node.js 20+
- Docker (for local Postgres)

## Setup

```bash
npm install
cp .env.example .env
npm run db:up        # starts Postgres 15 in Docker
npm run db:migrate   # applies the baseline schema
npm run dev          # runs client (:3000) and server (:5000) together
```

Open `http://localhost:3000/gallery` to see the base UI component set.

## Running the tests

```bash
npm run db:migrate:test   # migrate the test database
npm test                  # server unit + integration tests (Vitest + Supertest)
npm run test:e2e          # Playwright end-to-end tests
```

## The loop gate

Every loop closes only when `npm run gate` passes - the eight checks defined
in `docs/PLAN.md` → "The loop gate" (regression suite, invariant check,
mark-leak scan, route contract check, migration round-trip, impact review,
scripted demo, decision check). It requires a running Postgres (`npm run
db:up`) and expects `.env` to be present. CI runs the same command against a
Postgres service container - see `.github/workflows/ci.yml`.

```bash
npm run gate
```

## Project structure

```
calvin/
├── client/                 # React + Vite + Tailwind app
│   └── src/components/ui/  # Base components from docs/UI-UX.md
├── server/                 # Express + pg app
│   └── src/lib/routeRegistry.js  # Every route's permission/audit contract
├── migrations/              # node-pg-migrate SQL migrations
├── invariants/               # One SQL assertion per invariant (INV-01..21)
├── e2e/                       # Playwright end-to-end tests
├── scripts/gate/              # The eight loop-gate checks + orchestrator
├── scripts/seed/               # Fixture seeders used by the gate
└── docs/
    ├── PLAN.md              # Source of truth for behaviour
    ├── UI-UX.md              # Source of truth for look, tone and wording
    ├── prd/                   # Senate's requirements
    ├── loops/                  # One report per closed loop
    └── history/                 # Superseded PHP-era migration notes
```

## Progress

See `CLAUDE.md` → Progress for which loops are done.
