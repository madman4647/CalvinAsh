# Invariant assertions

Most invariants from `docs/PLAN.md`'s catalogue (INV-01 to INV-21) get one
file here: a SQL assertion that returns zero rows when the invariant holds,
or the violating rows when it doesn't. The gate's invariant check
(`scripts/gate/02-invariants.js`) runs every file here twice per gate run -
once against the test database after the regression suite, once against a
seeded "selection day" dataset - and fails if any file returns rows.

Not every invariant is checkable this way. **INV-01** ("no student/CCA-facing
response contains marks, scores, totals or ranks") is about API *response
shape*, not database state, so it has no file here - it's enforced by
`server/src/lib/serialize.js`'s allowlist helper and checked by the gate's
mark-leak scan (`scripts/gate/03-mark-leak-scan.js`) instead. If a future
invariant is similarly about behaviour rather than data, skip the SQL file
and say so in the loop that introduces it, the way this note does for INV-01.

Filename convention: `inv-01.sql`, `inv-02.sql`, etc., matching the
catalogue's numbering (skipping numbers like INV-01 that don't apply).
