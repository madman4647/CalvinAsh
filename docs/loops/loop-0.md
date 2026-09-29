# Loop 0 - Foundation and teardown

## Delivers

- A fresh npm-workspaces skeleton for `client` (React + Vite + Tailwind) and
  `server` (Express + `pg`) on the same stack (N6).
- `node-pg-migrate` with a baseline migration (`migrations/`) that enables
  `pgcrypto` and creates a `_health_check` table - no accounts/auth/business
  tables, per scope.
- The test stack: Vitest + Supertest for the server (against a real Postgres),
  Playwright for end-to-end (the gallery screenshot test), and `npm run gate`
  wiring all eight loop-gate checks (`scripts/gate/`), each with a real,
  non-vacuous mechanism even where Loop 0 has no business logic to check yet.
- UI tokens, fonts and base components from `docs/UI-UX.md` §2-4
  (`client/src/index.css`, `client/tailwind.config.js`,
  `client/src/components/ui/`), plus a component gallery page at `/gallery`
  covered by a Playwright screenshot test (N7).
- Deleted: the old client, the legacy allocation service, the legacy
  select/waitlist convention, all hostel code (N5), the common-questions
  table and the general resume, and the old `database/` directory (replaced
  by `migrations/`).
- Ported: the email helper as-is (`server/src/services/email.service.js`);
  the Excel helper's schema-agnostic workbook-building core only
  (`server/src/lib/workbook.js`) - its three SQL-querying wrapper functions
  were dropped since they queried tables deleted this loop.
- Rewrote `README.md` for the new setup.

## Shared components touched

### Accounts and roles

No account/role code exists yet (Loop 1 owns the `accounts` table and login).
What Loop 0 stands up is the *seam* every future route goes through:
`server/src/lib/routeRegistry.js`'s `defineRoute()` wrapper, which requires a
`permission` and an `auditEvent` on every data-changing route and is enforced
by `server/test/routeRegistry.test.js` and gate check 4. Loop 0's only route
(`GET /api/health`) is read-only and registered through this same wrapper.

15-minute exploratory checklist: confirmed `defineRoute()` throws at
registration time if a data-changing route omits `permission` or
`auditEvent`; confirmed the health route is not reachable through any other
path (single `express.Router()` mount in `app.js`); confirmed no login/role
code exists anywhere in `server/src` (verified via `grep -ri role server/src`
returning nothing beyond the registry's own field name).

### Applications and ranking

No application/ranking code exists yet (Loop 3 owns this). Loop 0's only
touch is deletion: the old `applications`, `application_answers` and
`rankings` tables (and the legacy `committee_rank`/`is_waitlist` convention
embedded in the old controllers) are gone along with `database/schema.sql`.
Nothing in the new skeleton references them.

15-minute exploratory checklist: `grep -ri "committee_rank\|is_waitlist\|waitlist"` across
`client/` and `server/` returns nothing; confirmed `database/` no longer
exists; confirmed the ported `workbook.js` has no reference to the old
`applications` table (only the generic `buildWorkbook` helper survived).

### File storage

No file storage/access-guard code exists yet (Loop 6/7 own the real
submission-file access rule, INV-11). Loop 0's touch is deletion: the old
`/uploads/resumes` (auth-gated) and `/uploads/presentations` (unguarded, a
known bug) static routes and the `server/uploads/` directory are gone, and no
static file route is registered in the new `app.js`.

15-minute exploratory checklist: confirmed `app.js` registers no
`express.static` route; confirmed `server/uploads/` no longer exists;
confirmed the mark-leak scan (gate check 3) - which will later crawl file
endpoints too - runs cleanly with zero routes to worry about yet.

## Scripted demo

See `docs/loops/loop-0-demo.md` for the full walkthrough (install → migrate →
`npm run dev` → gallery + health check → `npm run gate` → grep for dead
hostel/legacy code).

## Decision check

N5, N6, N7, N8 are all marked `Decided` in `docs/PLAN.md`'s Decisions tables
as of 2026-09-29 (verified automatically by gate check 8,
`scripts/gate/08-decision-check.js`).

## Gate results

`npm run gate` passes locally, all 8 checks green:
1) regression suite (server Vitest+Supertest, Playwright gallery e2e);
2) invariant check (0 invariants defined, runner + seed script exercised);
3) mark-leak scan (1 route scanned, 0 leaks);
4) route contract check (1 route registered, 0 data-changing, contract
   mechanism enforced);
5) migration round-trip (up → down → up, identical schema);
6) impact review (this section, for all three touched shared components);
7) scripted demo (`docs/loops/loop-0-demo.md`, signed pending PR review);
8) decision check (N5/N6/N7/N8 all Decided).

Local verification note: the build/dev sandbox this loop was built in could
not complete a `docker pull postgres:15` (the Docker Desktop VM's network
path was unreachable there, confirmed by three separate stuck pulls with zero
bytes transferred, while ordinary HTTPS downloads - e.g. Playwright's ~280MB
Chromium download - worked fine from the same shell). `npm run gate` was
therefore verified locally against a Postgres 14 instance on the same host
instead of the Docker Postgres 15 the committed `docker-compose.yml` and CI
both use; the SQL in `migrations/1790643934000_baseline.sql` doesn't use
anything version-specific, so this is not expected to matter, but the
authoritative proof of the real `docker-compose.yml` + CI path is the GitHub
Actions run on this PR - see its `gate-report`/`playwright-report` artifacts
before merging.

## Known gaps / forward pointers for Loop 1

- The route-contract wrapper (`defineRoute`) exists and is enforced, but has
  never carried a real data-changing route yet - Loop 1's first `POST
  /api/accounts`-style route is the first real test of it.
- The audit table (INV-02) does not exist yet; `defineRoute`'s `auditEvent`
  field is validated for presence only, not yet checked against a real audit
  log. Loop 1 builds the audit table and should tighten gate check 4 to
  verify the audit row is actually written, not just declared.
- `/gallery` is a public route (no auth exists yet). Once Loop 1 adds auth,
  reconsider whether it should be dev-gated (`NODE_ENV !== 'production'`)
  rather than reachable in the deployed app.
- The mark-leak scan and route contract check currently walk *every*
  registered route (there's no role system to filter by yet); Loop 1+ should
  narrow the mark-leak scan to student/CCA-role routes specifically, per its
  PLAN.md definition.
