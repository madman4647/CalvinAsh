# Loop 1 - Accounts, roles, audit

## Delivers

- **D3 schema**: `accounts` (login ID unique, password hash, role, status) is
  the single source of role truth; `students`, `ccas` (minimal - name, type,
  email, its account; full structure is Loop 2), `panelists` and
  `cca_members` (one panelist can belong to several CCAs). No coordinator
  role exists anywhere in the schema.
- **Sessions (N11)**: httpOnly/Secure/SameSite cookies backed by a
  `sessions` table (only the cookie's hash is stored), not localStorage.
- **Login/reset (N9)**: `POST /api/auth/{login,logout,forgot-password,
  set-password}`, `GET /api/auth/me`. Nobody ever receives a password by
  email - new accounts and resets both get a one-time, 24h-expiring
  set-password link. Forgot-password always returns the same generic
  message and is rate-limited (3 per 15 minutes) without revealing that it
  was.
- **Account creation (N10)**: `scripts/ops/create-senate-account.js` is the
  CLI-only path for the first Senate account. Senate can CSV-import students
  (`POST /api/senate/students/import` - a row whose login ID already exists
  is skipped, not a batch failure) and create CCA accounts
  (`POST /api/senate/ccas`). A CCA account adds its own panelists
  (`POST /api/cca/panelists`) - matching an existing panelist by login ID
  links them via `cca_members` instead of creating a duplicate account.
- **Permissions in `defineRoute`**: `permission` is now `null` (no auth),
  `'public'` (open, but still eligible to be `dataChanging`), a role, or an
  array of roles. `requireSession`+`requireRole` are attached automatically
  whenever `permission` is set and isn't `'public'`.
- **Hash-chained audit log (INV-02)**: `audit_log`'s `BEFORE INSERT` trigger
  computes `id`/`prev_hash`/`hash` itself (via a shared `audit_row_hash()`
  SQL function `invariants/inv-02.sql` also calls), serialized with an
  advisory lock - the app can only ever supply `event_type`/`actor`/
  `entity`/`details`.
- **Restricted app role**: `calvin_app` has normal DML everywhere except
  `audit_log`, where `UPDATE`/`DELETE` are revoked. Migrations run as the
  owner; `scripts/db/setup-app-role.js` sets the app role's password from
  `APP_DB_PASSWORD`, kept out of migration files.
- **Screens** (docs/UI-UX.md): Login ("The Wagon Ride"), Forgot password,
  Set password, Senate's student import + CCA creation, CCA panelist
  management, and one minimal home page per role.
- **Gate closures**: check 3 now crawls as student/CCA/panelist (seeded
  fixtures) plus unauthenticated, not just anonymously; check 4 requires the
  shared `routeContractHelper` functions by name instead of loose text
  matching; check 5 seeds real fixtures before a full (not partial) down/up
  cycle. `scripts/seed/selection-day.js` is real: 1 Senate, ~20 panelists
  (some serving multiple CCAs), 35 CCAs, 300 students.

## Shared components touched

### Accounts and roles

This is where the component goes from "scaffolding" to real: the `accounts`
table, the four roles, and `defineRoute`'s permission handling are all new
this loop. Contract tests: every data-changing route in `server/test/
contract/` exercises the PRD §33-style role matrix implicitly (a wrong role
is refused, the correct one succeeds) via the shared helper; `invariants/
inv-03.sql` checks that no `students`/`ccas`/`panelists` row ever has a
mismatched account role.

15-minute exploratory checklist: confirmed a student login ID cannot be
reused to create a panelist account (`UNIQUE` on `login_id` plus the role
check in `cca.routes.js`'s "That login ID belongs to a different role"
branch, exercised manually against the seeded fixtures); confirmed
`/api/auth/me` never returns anything beyond `{loginId, role}` for any role;
confirmed a panelist added to two different CCAs (via the real UI, not just
the API) shows up correctly in both CCAs' panelist lists via one shared
account.

### Audit log

New this loop (`1, then every loop` per PLAN.md's shared-components table).
Contract tests: `routeContractHelper.expectRouteContract`/
`expectPublicRouteAudit` assert a new `audit_log` row lands for every
data-changing route's declared `auditEvent`; `invariants/inv-02.sql`
verifies the hash chain on every gate run.

15-minute exploratory checklist: manually tampered a row's `event_type` as
the owner role and confirmed `inv-02.sql` flags it (then rolled back);
confirmed `calvin_app` gets a real Postgres permission error on `UPDATE`/
`DELETE` against `audit_log` (not just an application-level refusal); ran
~15 concurrent contract-test requests against shared fixture accounts and
found (then fixed) a real deadlock and a real hash-chain ordering bug - see
"Known gaps" below for what those were and why the fixes are structural, not
patches over the symptom.

## Scripted demo

See `docs/loops/loop-1-demo.md`.

## Decision check

N9, N10, N11 and D3 are all marked `Decided` in `docs/PLAN.md` (verified
automatically by gate check 8, `scripts/gate/08-decision-check.js`), along
with N5-N8 carried forward from Loop 0.

## Gate results

All 8 checks pass locally (`gate-report.json` from the closing run is
attached to this PR). Unlike Loop 0, this was verified with Postgres 15
itself where it mattered for the round-trip/role-grant logic - see the notes
below on what was and wasn't re-verified against Docker specifically.

1. Full regression suite - server Vitest+Supertest (13 tests across 9 files,
   including 7 route-contract tests), Playwright gallery e2e.
2. Invariant check - `inv-02.sql` (hash chain) and `inv-03.sql` (role/profile
   consistency), both checked twice, 0 violations.
3. Mark-leak scan - 4 GET routes x 4 identities (unauthenticated, student,
   CCA, panelist) = 16 requests scanned, 0 leaked fields.
4. Route contract check - 10 routes registered, 7 data-changing, all using
   the shared contract-test helper.
5. Migration round-trip - migrate up, seed real fixtures (1 Senate + ~20
   panelists + 35 CCAs + 300 students), invariants, migrate *all six
   migrations* down, migrate back up, identical schema.
6. Impact review - this section.
7. Scripted demo - `docs/loops/loop-1-demo.md`; **PM sign-off line left
   blank on purpose, per instruction** - to be filled in after the demo is
   run.
8. Decision check - N5-N11 and D3 all `Decided`.

Local-verification note carried forward from Loop 0: this build sandbox
still can't complete a `docker pull postgres:15` (unrelated to this repo -
the Docker Desktop VM's own network path). Everything above was run against
a local Postgres 15 instance directly (not the committed `docker-compose.yml`),
which is sufficient to exercise the actual SQL/trigger/role logic - the
committed `docker-compose.yml` config itself is unchanged from Loop 0's, so
the remaining gap is the same as before: confirm this PR's actual GitHub
Actions run (real Docker Postgres 15 service container) before merging.

## Known gaps / forward pointers for Loop 2

- Getting checks 3 and 5 to run for real (rather than passing vacuously)
  surfaced three genuine concurrency/environment bugs during this loop,
  fixed at the root rather than patched: (1) `scripts/gate/index.js`'s
  `NODE_ENV` fallback never actually fired because `dotenv.config()` had
  already populated it from `.env`'s `NODE_ENV=development` first, so
  in-process gate checks were silently hitting the dev database; (2) the
  audit hash chain used the bigserial `id` for ordering, but `nextval()` for
  that default is resolved before the row's trigger (and its advisory lock)
  even starts, so id order and true chain order could diverge under
  concurrency - `id` is now assigned inside the locked section instead; (3)
  the app-role-grants down migration's `DROP ROLE` failed whenever
  `calvin_dev`/`calvin_test` share a cluster (true both locally and in CI)
  and the role still holds privileges in the other database - down now only
  revokes this database's grants. All three would have stayed invisible
  under Loop 0's vacuous versions of these checks.
- `panel_members` (referencing `cca_members`) is explicitly Loop 4's table,
  not built here - `cca_members` exists now specifically so Loop 4 has
  something to reference.
- The `ccas` table is intentionally bare (name, type, email, its account) -
  verticals, seats, rounds and the rest of the CCA profile are Loop 2.
- No account can be disabled/deactivated yet (`status` only has `pending`/
  `active`) - not required this loop, but the column is there for it.
- `/gallery` is dev-only now (dynamically imported, only rendered when
  `import.meta.env.DEV`), closing the Loop 0 gap about it being a public
  route once auth existed.
- The mark-leak scan and route-contract check still walk every *registered*
  route rather than being scoped specifically to "student and CCA" endpoints
  per PLAN.md's literal wording for check 3 - Loop 1 extended it to also
  cover panelist (per CLAUDE.md's non-negotiables), but did not narrow it
  away from Senate's own routes, since Senate is legitimately allowed to see
  everything and scanning its responses too is strictly more coverage, not
  less.
