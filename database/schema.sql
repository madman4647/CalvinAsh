-- Calvin CCA Platform - Database Schema
-- PostgreSQL

-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  pgpid VARCHAR(20) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  batch VARCHAR(20),
  fname VARCHAR(100),
  mname VARCHAR(100),
  lname VARCHAR(100),
  name VARCHAR(200) NOT NULL,
  gender VARCHAR(10),
  dob DATE,
  marital_status VARCHAR(20),
  about_me TEXT,
  address TEXT,
  city VARCHAR(100),
  pincode VARCHAR(10),
  state VARCHAR(100),
  country VARCHAR(100),
  phone VARCHAR(20),
  mobile VARCHAR(20),
  email VARCHAR(200),
  iiml_room VARCHAR(50),
  cat_score VARCHAR(20),
  tenth_cgpa VARCHAR(10),
  twelfth_cgpa VARCHAR(10),
  grad_college VARCHAR(200),
  grad_degree VARCHAR(100),
  grad_specialization VARCHAR(100),
  grad_cgpa VARCHAR(10),
  postgrad_college VARCHAR(200),
  postgrad_degree VARCHAR(100),
  postgrad_specialization VARCHAR(100),
  postgrad_cgpa VARCHAR(10),
  workex_duration VARCHAR(50),
  workex_functional_area VARCHAR(200),
  workex_awards TEXT,
  committee_membership VARCHAR(200),
  club_membership VARCHAR(200),
  club_2 VARCHAR(200),
  area_of_interest TEXT,
  certification TEXT,
  secretary VARCHAR(200),
  class_rep VARCHAR(200),
  general_resume_path VARCHAR(500),
  credential_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Committees table
CREATE TABLE committees (
  id SERIAL PRIMARY KEY,
  login VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(200) NOT NULL,
  type VARCHAR(20) NOT NULL DEFAULT 'committee' CHECK (type IN ('committee', 'club', 'aig', 'hostel')),
  is_resume_required BOOLEAN DEFAULT FALSE,
  deadline TIMESTAMP,
  presentation_path VARCHAR(500),
  max_candidates INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Committee questions
CREATE TABLE committee_questions (
  id SERIAL PRIMARY KEY,
  committee_login VARCHAR(50) NOT NULL REFERENCES committees(login),
  question_order INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  UNIQUE(committee_login, question_order)
);

-- Applications
CREATE TABLE applications (
  id SERIAL PRIMARY KEY,
  pgpid VARCHAR(20) NOT NULL REFERENCES users(pgpid),
  committee_login VARCHAR(50) NOT NULL REFERENCES committees(login),
  resume_path VARCHAR(500),
  task TEXT,
  is_selected INTEGER DEFAULT 0,
  committee_rank INTEGER DEFAULT -1,
  is_active BOOLEAN DEFAULT TRUE,
  applied_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(pgpid, committee_login)
);

-- Application answers
CREATE TABLE application_answers (
  id SERIAL PRIMARY KEY,
  pgpid VARCHAR(20) NOT NULL,
  committee_login VARCHAR(50) NOT NULL,
  question_id INTEGER NOT NULL REFERENCES committee_questions(id),
  answer TEXT,
  UNIQUE(pgpid, committee_login, question_id),
  FOREIGN KEY (pgpid, committee_login) REFERENCES applications(pgpid, committee_login)
);

-- Rankings
CREATE TABLE rankings (
  id SERIAL PRIMARY KEY,
  pgpid VARCHAR(20) NOT NULL REFERENCES users(pgpid),
  committee_login VARCHAR(50) NOT NULL REFERENCES committees(login),
  rank INTEGER NOT NULL CHECK (rank > 0),
  UNIQUE(pgpid, committee_login),
  UNIQUE(pgpid, rank)
);

-- Common questions and answers
CREATE TABLE common_questions (
  id SERIAL PRIMARY KEY,
  question_text TEXT NOT NULL
);

CREATE TABLE common_answers (
  id SERIAL PRIMARY KEY,
  pgpid VARCHAR(20) NOT NULL REFERENCES users(pgpid),
  question_id INTEGER NOT NULL REFERENCES common_questions(id),
  answer TEXT,
  UNIQUE(pgpid, question_id)
);

-- Allocations
CREATE TABLE allocations (
  id SERIAL PRIMARY KEY,
  pgpid VARCHAR(20) NOT NULL REFERENCES users(pgpid),
  committee_login VARCHAR(50) NOT NULL REFERENCES committees(login),
  student_rank INTEGER NOT NULL,
  committee_rank INTEGER NOT NULL,
  is_waitlist BOOLEAN DEFAULT FALSE,
  allocated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(pgpid)
);

-- Council users
CREATE TABLE council_users (
  id SERIAL PRIMARY KEY,
  login VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(200) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Admin settings
CREATE TABLE admin_settings (
  key         VARCHAR(50) PRIMARY KEY,
  value       VARCHAR(200) NOT NULL,
  description VARCHAR(500),
  updated_at  TIMESTAMP DEFAULT NOW()
);
