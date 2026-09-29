# Loop 0 - scripted demo

Walk through in order. Each step ties back to what Loop 0's report
(`docs/loops/loop-0.md`) claims it delivered.

1. `npm install && cp .env.example .env && npm run db:up && npm run db:migrate`
   - The baseline migration applies: `pgcrypto` is enabled and `_health_check`
     is created and seeded with two rows.
2. `npm run dev`
   - Open `http://localhost:5000/api/health` - returns
     `{ "status": "ok", "checks": [...] }`, reading the two `_health_check`
     rows from the database (proves migration → DB → server chain).
   - Open `http://localhost:3000/gallery` - every base component from
     `docs/UI-UX.md` §3 renders: ComicPanel (3 variants), Button (5 variants ×
     3 sizes, plus a quiet SUBMIT & LOCK MARKS example), StatusBadge (5
     statuses), StateBanner, ProgressMap, Field/Select/FileDrop,
     ConfirmDialog (click "Open confirm dialog"), Toast/EmptyState/Loader.
3. `npm run db:migrate:test && npm run gate`
   - All eight gate checks run and pass (see `gate-report.json` and the loop
     report's "Gate results" section for the actual run this loop closed on).
4. `grep -ri hostel client/ server/` and `ls database/` (does not exist)
   - Confirms no hostel code and no legacy `database/` directory remain.

## Sign-off

This loop was built autonomously end to end per the approved Loop 0 plan; the
steps above were run and gate results are attached in the loop report. The
pull request was reviewed against CLAUDE.md and docs/PLAN.md's Loop 0 row and
loop gate; two UI-UX deviations (button font, missing background dot grid)
were found and fixed before this sign-off.

PM sign-off: Ashwin - 2026-09-29

