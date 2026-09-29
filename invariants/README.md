# Invariant assertions

Each file here is one SQL assertion for one invariant from `docs/PLAN.md`'s
catalogue (INV-01 to INV-21). A query that returns zero rows means the
invariant holds; any returned row is a violation and the gate's invariant
check (`scripts/gate/02-invariants.js`) fails.

This directory is intentionally empty in Loop 0 - invariant introduction
starts at Loop 1 (INV-01 to INV-03). The runner itself still executes on
every gate run (twice: once against the test database, once against a
seeded "selection day" dataset), so it is proven out before any real
invariant depends on it.

Filename convention for later loops: `inv-01.sql`, `inv-02.sql`, etc.
