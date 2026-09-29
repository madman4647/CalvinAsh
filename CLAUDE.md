# CLAUDE.md — Calvin 2.0

Calvin is IIM Lucknow's CCA selection platform. Students apply to Committees, Clubs and AIGs; CCAs run selection rounds (tasks and interviews) through panels of their members; Senate monitors everything and runs the final allocation. We are rebuilding it so that evaluation is fair, blind and auditable.

**Source of truth: `docs/PLAN.md`.** It holds the rules (NN-T*, NN-I*), edge cases, decisions (D1–D14, N1–N5), the 12 loops, the loop gate and the 21 invariants (INV-01 to INV-21). Read the sections relevant to your task before writing code.

The Senate's requirements are in `docs/prd/`: `production-document.md` (the PRD; § numbers in PLAN.md refer to it) and `prd-gaps-corrected.md` (answers on ties, panel scoring, verticals, screening and final allocation). Where PLAN.md records a decision, PLAN.md wins; where PLAN.md is silent, follow the PRD and ask if it is ambiguous.

## Stack and commands

- Client: React 18 + Vite + Tailwind in `client/` (`npm run dev`, port 3000, proxies `/api` to port 5000).
- Server: Node/Express + `pg` in `server/` (`npm run dev`, port 5000).
- Database: PostgreSQL 15+. Today: `database/schema.sql`, `seed.sql`, `migrate-v1-to-v2.sql`. From Loop 0 on, every schema change is a migration with a working down step.
- Loop 0 must add: a test stack (Vitest, Supertest against a real Postgres in Docker, Playwright), CI, and one command, `npm run gate`, that runs the whole loop gate (PLAN.md → The loop gate).

## How to work

1. One loop per branch and per session. Find the loop's row in PLAN.md → Execution plan and build only that loop's scope.
2. A loop is done only when `npm run gate` passes on the whole system, not just the new tests.
3. Never delete, skip or weaken an existing test or invariant check to make the gate pass. If one looks wrong, stop and ask.
4. Stop rule: a bug in an earlier loop's area gets a failing test first, then the fix.
5. Don't invent policy. If a requirement is missing, ambiguous or conflicts with PLAN.md, stop and ask, then record the answer in PLAN.md → Decisions.
6. When a loop closes, tick it in Progress below and write a short report in `docs/loops/loop-N.md`: what changed, which shared components it touched, and the gate results.

## Non-negotiables

Every rule below is enforced in the backend or the database. Hiding a button is never the control: the API must refuse the action even when called directly (PRD §32).

**Roles and identity**
- Role comes from the `accounts` table (student, CCA, panelist, Senate), never from the login ID's prefix.
- Applicants are juniors and can never be panelists. Panelists are members of a CCA and sit only on that CCA's panels.
- There is no coordinator role. The CCA account configures; panelists evaluate.

**Marks**
- Every entered mark is a whole number from 0 to the component's max. Averages across panelists are computed exactly and never rounded.
- Marks are written once, already LOCKED; there are no server-side drafts. They are never updated or deleted. Corrections are Senate override rows that keep the original.
- Students never see marks, scores, totals or ranks. CCA accounts and panelists never see a locked mark. Only Senate reads marks, through a separate read-only database role; the app's normal role cannot SELECT marks.
- ABSENT, withdrawn and non-submitting students can only have 0.

**Task evaluation (Non-negotiable A)**
- The server serves exactly one submission to each panelist (one per panel in single-score mode). It serves the next only after that one is locked. There is no list, search, preview, skip or client-chosen order. Order is random, seeded per round, and the seed is audited.
- A submission file streams only to its own student, its current assignee, the panel of an ACTIVE interview session, or Senate. There are no public or guessable URLs, and the static `/uploads` route is never reused for submissions.
- Evaluation starts only after the hard close has passed and the CCA presses Start evaluation. The hard close moves only later, and only before Start evaluation.
- A panelist who cannot evaluate parks the submission with a reason, which alerts Senate. Open assignments are never released automatically.

**Interview session (Non-negotiable B)**
- States: SCHEDULED → STUDENT_ENTERED → ACTIVE → STUDENT_EXITED → MARKS_LOCKED → CLOSED, plus MOVE LATER, NO_SHOW, RAISE EXCEPTION and Senate override. Implement exactly the transitions, actors and guards in PLAN.md → Non-negotiable B.
- Only the session at the head of the panel's queue can be entered, and only while the panel is AVAILABLE. One open session per panel; one open interview per student across all CCAs.
- Marks only after every student who entered has exited. The panel exits only after marks are locked, and it is BUSY from the student's entry until then.
- The CCA can never bypass the workflow. Only Senate can force exit, reschedule, mark no-show or release a panel, and always with a reason.

**Structure, audit and time**
- After Finalized → Locked, rounds, max marks and parameters cannot change. The hard close is the only date that may move.
- Every state change writes an audit row in the same transaction. The audit table is insert-only and hash-chained.
- All timestamps come from the database clock, never from the client.

## Engineering conventions

- Each state transition is one server function: open a transaction, `SELECT … FOR UPDATE` the row, check the guard, write the new state and the audit row, commit. Back every one-at-a-time rule with a partial unique index.
- Parameterized SQL only.
- Student, CCA and panelist responses are built from explicit field allowlists.
- Every route that changes data declares its permission and has two tests: a wrong role is refused, and an audit row is written. The route contract test enforces this.
- Every invariant in PLAN.md gets an automated check (SQL assertion or property test) in the loop that introduces it. That check runs in every later gate and is never removed.

## Known state of the codebase

Fix these in Loop 0 unless another loop is named.

- The frontend does not match the backend. Of the 38 distinct endpoints the client calls, 24 don't exist on the server, and most of the rest return different field names (the client expects Mongo-style `_id`, `status` and camelCase). The server sends errors as `{ error }`; the client reads `message`.
- The bcrypt hash in `database/seed.sql` does not match the documented password `calvin123`.
- Forgot password: the client sends `pgpId`, the server expects `pgpid`.
- Council common questions insert into a column `text` that doesn't exist (it is `question_text`).
- Admin settings: the server returns rows; the client expects an object with different key names.
- A resume upload overwrites the file on disk before the deadline check runs.
- Withdrawing and re-applying to the same CCA fails with a 500 (unique constraint).
- `/uploads/resumes` checks login but not role (Loop 1).
- Role is guessed from the login ID prefix (Loop 1 replaces this).
- The legacy allocation in `server/src/services/allocation.service.js` is replaced in Loop 10. Legacy select/waitlist screens go behind a flag in Loop 0.
- Hostel nominations are removed entirely in Loop 0 (N5). That covers `HostelDashboard` and `HostelApplyPage`, the `/student/hostel/*` routes and nav links, `getHostelCCAs` and `applyToHostel`, the hostel filters in `getCCAs` and `getApplications`, the `hostel` value in the committees type check (by migration), the `hostel1` seed row and the `max_hostel_applications` setting.
- Applications use one Senate-set close for every CCA (N4, Loop 3). The per-CCA `deadline` field is retired for applications.
- Vite runs on port 3000; the README says 5173.

## Progress

- [ ] Loop 0 · Baseline and safety net
- [ ] Loop 1 · Accounts, roles, audit
- [ ] Loop 2 · CCA setup and structure lock
- [ ] Loop 3 · Applications and ranking
- [ ] Loop 4 · Panels, groups, queues
- [ ] Loop 5 · Evaluation core and exceptions
- [ ] Loop 6 · Non-negotiable A: tasks
- [ ] Loop 7 · Non-negotiable B: interviews
- [ ] Loop 8 · Round close and elimination
- [ ] Loop 9 · Senate control centre
- [ ] Loop 10 · Final selection and allocation
- [ ] Loop 11 · Hardening and dress rehearsal
