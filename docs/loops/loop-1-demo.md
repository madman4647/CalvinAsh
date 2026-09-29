# Loop 1 - scripted demo

Walk through in order. Each step ties back to what Loop 1's report
(`docs/loops/loop-1.md`) claims it delivered.

1. `npm run db:up && npm run db:migrate && npm run db:setup-role`
   - The five Loop 1 migrations apply on top of Loop 0's baseline: `accounts`,
     `students`/`ccas`/`panelists`/`cca_members`, `sessions`/
     `password_set_tokens`, `audit_log` (with its hash-chaining trigger), and
     the `calvin_app` role's grants (full DML everywhere except no
     `UPDATE`/`DELETE` on `audit_log`).
2. `node scripts/ops/create-senate-account.js --loginId=senate --email=you@example.com`
   - Prints a one-time set-password link. Open it, set a password - nobody
     was emailed a plaintext password anywhere in this flow (N9).
3. `npm run dev`, then in a browser:
   - `/login` - "The Wagon Ride": a red-wagon doodle, "Hop in", nothing about
     admin areas. Log in as Senate with the password just set.
   - `/senate` - create a CCA account (login ID, name, type, email). Note the
     buttons here are pine, not red (docs/UI-UX.md: red is critical-only on
     Senate screens).
   - `/senate/students/import` - upload a CSV (`login_id,name,email,batch`
     header) and confirm the created/skipped counts.
   - Check the server log (or an SMTP inbox, if `SMTP_USER` is configured)
     for the CCA's and each imported student's set-password link - none of
     them is a password, only a one-time link.
   - Set the CCA's password via its link, log in, go to `/cca/panelists`,
     add a panelist by login ID + name + email, then add the *same* login ID
     again from a second CCA account and confirm it links instead of
     erroring or duplicating.
   - Try logging in as that CCA on a route meant for Senate (e.g. visiting
     `/senate` directly) and confirm it redirects away rather than showing
     anything.
   - Confirm `/gallery` 404s (or redirects) in a production build
     (`npm run build -w client && npm run preview -w client` - no `/gallery`
     route exists there at all).
4. `npm run gate`
   - All eight checks run and pass (see `gate-report.json` and the loop
     report's "Gate results" section for the run this loop closed on).
5. `psql` the test database and confirm `calvin_app` gets a permission error
   on `UPDATE audit_log SET event_type = 'x'` - the restriction is enforced
   by Postgres, not just application code.

## Sign-off

PM sign-off:
