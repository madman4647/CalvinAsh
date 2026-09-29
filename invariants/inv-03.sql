-- INV-03: every login has exactly one role, read from the database, so no
-- applicant can ever be a panelist.
--
-- accounts.login_id is UNIQUE and accounts.role is a single column, so the
-- core fact is already structurally guaranteed - this check is defense in
-- depth against a mismatch between a profile row and its account's role
-- (e.g. a bug that inserts a panelists row for a student-role account).
-- Any row returned is a violation.
SELECT s.account_id AS id, 'students row on non-student account' AS problem
FROM students s
JOIN accounts a ON a.id = s.account_id
WHERE a.role != 'student'

UNION ALL

SELECT c.account_id, 'ccas row on non-cca account'
FROM ccas c
JOIN accounts a ON a.id = c.account_id
WHERE a.role != 'cca'

UNION ALL

SELECT p.account_id, 'panelists row on non-panelist account'
FROM panelists p
JOIN accounts a ON a.id = p.account_id
WHERE a.role != 'panelist'

UNION ALL

SELECT cm.panelist_id, 'cca_members references a non-panelist account'
FROM cca_members cm
LEFT JOIN panelists p ON p.account_id = cm.panelist_id
WHERE p.account_id IS NULL

UNION ALL

SELECT cm.cca_id, 'cca_members references a non-cca account'
FROM cca_members cm
LEFT JOIN ccas c ON c.account_id = cm.cca_id
WHERE c.account_id IS NULL;
