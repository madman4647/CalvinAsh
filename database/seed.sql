-- Calvin CCA Platform - Seed Data
-- Password for all seeded accounts: calvin123

-- Council users
INSERT INTO council_users (login, password_hash, name) VALUES
  ('council', '$2b$10$rQZ8kHxN6xM0F3v6yZV5aeXJDbjKcE5yJJpq6DzF3YXAqBkzT5S6i', 'Student Council'),
  ('admin',   '$2b$10$rQZ8kHxN6xM0F3v6yZV5aeXJDbjKcE5yJJpq6DzF3YXAqBkzT5S6i', 'Admin'),
  ('senate',  '$2b$10$rQZ8kHxN6xM0F3v6yZV5aeXJDbjKcE5yJJpq6DzF3YXAqBkzT5S6i', 'Senate');

-- Sample committees
INSERT INTO committees (login, password_hash, name, type, is_resume_required, max_candidates) VALUES
  ('placemen',   '$2b$10$rQZ8kHxN6xM0F3v6yZV5aeXJDbjKcE5yJJpq6DzF3YXAqBkzT5S6i', 'Placement Committee', 'committee', TRUE,  30),
  ('km',         '$2b$10$rQZ8kHxN6xM0F3v6yZV5aeXJDbjKcE5yJJpq6DzF3YXAqBkzT5S6i', 'Knowledge Management', 'committee', FALSE, 20),
  ('manfest',    '$2b$10$rQZ8kHxN6xM0F3v6yZV5aeXJDbjKcE5yJJpq6DzF3YXAqBkzT5S6i', 'Manfest',              'club',      FALSE, 40),
  ('literary',   '$2b$10$rQZ8kHxN6xM0F3v6yZV5aeXJDbjKcE5yJJpq6DzF3YXAqBkzT5S6i', 'Literary Club',        'club',      FALSE, 25),
  ('financeaig', '$2b$10$rQZ8kHxN6xM0F3v6yZV5aeXJDbjKcE5yJJpq6DzF3YXAqBkzT5S6i', 'Finance AIG',          'aig',       TRUE,  15),
  ('hostel1',    '$2b$10$rQZ8kHxN6xM0F3v6yZV5aeXJDbjKcE5yJJpq6DzF3YXAqBkzT5S6i', 'Hostel A',             'hostel',    FALSE, 0);

-- Admin settings
INSERT INTO admin_settings (key, value, description) VALUES
  ('student_access_enabled', 'true', 'Global toggle: allow students to log in and use the platform'),
  ('committee_access_enabled', 'true', 'Global toggle: allow committees to log in and use the platform'),
  ('ranking_enabled', 'false', 'Whether students can see and use the ranking page'),
  ('max_applications', '4', 'Maximum number of applications a student can submit'),
  ('max_hostel_applications', '10', 'Maximum number of hostel nominations per student'),
  ('deadline_grace_seconds', '60', 'Grace period in seconds added to deadlines');

-- Common questions
INSERT INTO common_questions (question_text) VALUES
  ('Why do you want to join a CCA?'),
  ('What skills do you bring?'),
  ('Describe a leadership experience.');

-- Sample student user
INSERT INTO users (pgpid, password_hash, name, batch, email, fname, lname) VALUES
  ('pgp25001', '$2b$10$rQZ8kHxN6xM0F3v6yZV5aeXJDbjKcE5yJJpq6DzF3YXAqBkzT5S6i', 'Test Student', 'PGP25', 'test@iiml.ac.in', 'Test', 'Student');
