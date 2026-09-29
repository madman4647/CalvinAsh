-- Calvin CCA Platform - Migration: v1 to v2
-- Run this against an existing v1 database to apply v2 schema changes.

ALTER TABLE users ADD COLUMN IF NOT EXISTS general_resume_path VARCHAR(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS credential_sent BOOLEAN DEFAULT FALSE;
ALTER TABLE committees DROP CONSTRAINT IF EXISTS committees_type_check;
ALTER TABLE committees ADD CONSTRAINT committees_type_check CHECK (type IN ('committee', 'club', 'aig', 'hostel'));
CREATE TABLE IF NOT EXISTS admin_settings (
  key VARCHAR(50) PRIMARY KEY,
  value VARCHAR(200) NOT NULL,
  description VARCHAR(500),
  updated_at TIMESTAMP DEFAULT NOW()
);
INSERT INTO admin_settings (key, value, description) VALUES
  ('student_access_enabled', 'true', 'Global toggle: allow students to log in'),
  ('committee_access_enabled', 'true', 'Global toggle: allow committees to log in'),
  ('ranking_enabled', 'false', 'Whether students can use the ranking page'),
  ('max_applications', '4', 'Max CCA applications per student'),
  ('max_hostel_applications', '10', 'Max hostel nominations per student'),
  ('deadline_grace_seconds', '60', 'Grace period added to deadlines in seconds')
ON CONFLICT (key) DO NOTHING;
