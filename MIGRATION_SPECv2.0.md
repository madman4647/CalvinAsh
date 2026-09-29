# Calvin CCA Platform — Migration Specification

> **Source**: Legacy PHP/MySQL procedural app  
> **Target**: React (Vite) + Node.js/Express + PostgreSQL  
> **Purpose**: Co-Curricular Activity (CCA) selection platform for IIM Lucknow  
> **Tagline**: "Express your Interests...Online"  
> **Original Team**: Team SynapsE

---

## Table of Contents

1. [Application Overview](#1-application-overview)
2. [User Personas & Roles](#2-user-personas--roles)
3. [Database Schema (PostgreSQL)](#3-database-schema-postgresql)
4. [API Design (Express.js REST)](#4-api-design-expressjs-rest)
5. [Frontend Pages & Routes (React)](#5-frontend-pages--routes-react)
6. [Feature Specifications](#6-feature-specifications)
7. [Authentication & Authorization](#7-authentication--authorization)
8. [Allocation Algorithm](#8-allocation-algorithm)
9. [File Uploads](#9-file-uploads)
10. [Excel Export](#10-excel-export)
11. [Email System](#11-email-system)
12. [Project Structure](#12-project-structure)
13. [Environment Configuration](#13-environment-configuration)
14. [Setup & Run Instructions](#14-setup--run-instructions)

---

## 1. Application Overview

Calvin is a platform where:

- **Students** browse and apply to Committees, Clubs, and Academic Interest Groups (AIGs), answer committee-specific questions, upload resumes, and rank their preferences.
- **Committee Heads** review applications, assign tasks, select/waitlist candidates, and download applicant data.
- **Council/Admin** oversees all committees, runs a matching algorithm that allocates students to CCAs based on mutual preferences, and exports comprehensive reports.

### Business Rules

- A student can submit a **maximum of 4 applications** (configurable per context — see §6.5).
- A student can be a member of **either** a Committee **or** an AIG (not both), plus up to **2 Clubs**.
- Each committee can define up to **10 custom questions** on their application form.
- Committees set deadlines; students cannot apply after the deadline. Deadlines have a **60-second grace period** (configurable).
- Committees upload a presentation file (PDF/PPTX) describing their CCA.
- Students rank all CCAs they have applied to by preference (1 = highest). Ranking is a **phase-gated feature** controlled by an admin toggle.
- Students can **edit answers and re-upload resumes** after submission, as long as the deadline has not passed.
- The allocation algorithm uses a stable-matching approach: iterates through student preference ranks and checks committee selections.
- **Council manages global common questions** (up to 10) that all students answer in addition to committee-specific questions.

### CCA Types

| `type` value | DB value (legacy `isClub`) | Label | Description |
|---|---|---|---|
| `committee` | 0 | Committee | e.g., Placement Committee, Knowledge Management |
| `club` | 1 | Club | e.g., Literary Club, Cultural Club, Random Walk |
| `aig` | 2 | AIG | Academic Interest Group |
| `hostel` | 3 | Hostel | Hostel election nominations (separate flow) |

---

## 2. User Personas & Roles

### 2.1 Student

- **Who**: IIM Lucknow students (PGP, ABM, FPM programs)
- **Login ID pattern**: Starts with `pgp`, `abm`, `fpm` (case-insensitive)
- **Capabilities**:
  - View dashboard with instructions and rules
  - Browse all open CCAs with deadlines and presentation files
  - Apply to CCAs (fill committee-specific questions, upload resume)
  - View and edit submitted applications
  - Withdraw/delete applications
  - Rank all applied CCAs by preference order
  - Fill common/standard questions and upload a general resume
  - View allocation results
- **Restrictions**: Max 4 applications; cannot apply past deadline; committee-or-AIG exclusivity rule
- **Hostel Elections**: Separate flow where students nominate for hostel positions (same mechanics, different CCA type filter, limit of 10 applications)

### 2.2 Committee Head

- **Who**: Heads of committees, clubs, and AIGs
- **Login ID**: Committee alias (e.g., `placemen`, `manfest`, `km`)
- **Capabilities**:
  - View dashboard showing application count
  - Create/edit up to 10 custom application questions
  - Set application deadline
  - Upload a CCA presentation file (PDF/PPTX)
  - View all applicants with their answers and resumes
  - Assign tasks to applicants
  - Select, reject, or waitlist (with rank) each applicant
  - Download all applicant data as Excel
  - Download all resumes as a batch
- **Cannot**: See other committees' applications or run the allocation

### 2.3 Council/Admin

- **Who**: Student Council, Senate, or Admin
- **Login IDs**: `council`, `admin`, `senate`
- **Capabilities**:
  - Dashboard showing all committees with application counts and average student preference rankings
  - View all applications across all committees
  - Run the allocation algorithm (match students to CCAs)
  - Override committee selections
  - Download comprehensive Excel reports (3 worksheets):
    1. All selected applications
    2. All students who ranked CCAs
    3. Applications grouped by student
- **Manage global common questions** (up to 10) that all students must answer
- **Upload presentations** on behalf of committees
- **Full read/write access** to all data

### 2.4 Role Determination Logic

```
if loginId matches /^(pgp|abm|fpm)/i → role = "student"
else if loginId in ["council", "admin", "senate"] → role = "council"
else → role = "committee"
```

---

## 3. Database Schema (PostgreSQL)

### 3.1 Users Table (replaces `student`)

```sql
CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  pgpid         VARCHAR(20) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  batch         VARCHAR(20),
  fname         VARCHAR(100),
  mname         VARCHAR(100),
  lname         VARCHAR(100),
  name          VARCHAR(200) NOT NULL,
  gender        VARCHAR(10),
  dob           DATE,
  marital_status VARCHAR(20),
  about_me      TEXT,

  -- Contact
  address       TEXT,
  city          VARCHAR(100),
  pincode       VARCHAR(10),
  state         VARCHAR(100),
  country       VARCHAR(100),
  phone         VARCHAR(20),
  mobile        VARCHAR(20),
  email         VARCHAR(200),
  iiml_room     VARCHAR(50),

  -- Academic
  cat_score     VARCHAR(20),
  tenth_cgpa    VARCHAR(10),
  twelfth_cgpa  VARCHAR(10),
  grad_college  VARCHAR(200),
  grad_degree   VARCHAR(100),
  grad_specialization VARCHAR(100),
  grad_cgpa     VARCHAR(10),
  postgrad_college VARCHAR(200),
  postgrad_degree VARCHAR(100),
  postgrad_specialization VARCHAR(100),
  postgrad_cgpa VARCHAR(10),

  -- Professional
  workex_duration VARCHAR(50),
  workex_functional_area VARCHAR(200),
  workex_awards TEXT,

  -- CCA memberships (updated by allocation)
  committee_membership VARCHAR(200),
  club_membership      VARCHAR(200),
  club_2               VARCHAR(200),

  -- Other
  area_of_interest TEXT,
  certification    TEXT,
  secretary        VARCHAR(200),
  class_rep        VARCHAR(200),

  -- General resume (uploaded via common questions page, separate from per-committee resumes)
  general_resume_path VARCHAR(500),

  -- Bulk credential mailing tracker
  credential_sent BOOLEAN DEFAULT FALSE,

  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);
```

### 3.2 Committees Table

```sql
CREATE TABLE committees (
  id              SERIAL PRIMARY KEY,
  login           VARCHAR(50) UNIQUE NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,
  name            VARCHAR(200) NOT NULL,
  type            VARCHAR(20) NOT NULL DEFAULT 'committee'
                  CHECK (type IN ('committee', 'club', 'aig', 'hostel')),
  is_resume_required BOOLEAN DEFAULT FALSE,
  deadline        TIMESTAMP,
  presentation_path VARCHAR(500),
  max_candidates  INTEGER DEFAULT 0,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);
```

### 3.3 Committee Questions (replaces `application`)

```sql
CREATE TABLE committee_questions (
  id            SERIAL PRIMARY KEY,
  committee_login VARCHAR(50) NOT NULL REFERENCES committees(login),
  question_order INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  UNIQUE(committee_login, question_order)
);
```

### 3.4 Applications (replaces `student` join-tracking + `apply`)

```sql
CREATE TABLE applications (
  id              SERIAL PRIMARY KEY,
  pgpid           VARCHAR(20) NOT NULL REFERENCES users(pgpid),
  committee_login VARCHAR(50) NOT NULL REFERENCES committees(login),
  resume_path     VARCHAR(500),
  task            TEXT,
  is_selected     INTEGER DEFAULT 0,
  committee_rank  INTEGER DEFAULT -1,
  is_active       BOOLEAN DEFAULT TRUE,
  applied_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW(),
  UNIQUE(pgpid, committee_login)
);

-- committee_rank values:
--   -1 = not yet reviewed
--    0 = selected
--   >0 = waitlist position
```

### 3.5 Application Answers

```sql
CREATE TABLE application_answers (
  id              SERIAL PRIMARY KEY,
  pgpid           VARCHAR(20) NOT NULL,
  committee_login VARCHAR(50) NOT NULL,
  question_id     INTEGER NOT NULL REFERENCES committee_questions(id),
  answer          TEXT,
  UNIQUE(pgpid, committee_login, question_id),
  FOREIGN KEY (pgpid, committee_login) REFERENCES applications(pgpid, committee_login)
);
```

### 3.6 Student Rankings

```sql
CREATE TABLE rankings (
  id              SERIAL PRIMARY KEY,
  pgpid           VARCHAR(20) NOT NULL REFERENCES users(pgpid),
  committee_login VARCHAR(50) NOT NULL REFERENCES committees(login),
  rank            INTEGER NOT NULL CHECK (rank > 0),
  UNIQUE(pgpid, committee_login),
  UNIQUE(pgpid, rank)
);
```

### 3.7 Common Questions & Answers

```sql
CREATE TABLE common_questions (
  id            SERIAL PRIMARY KEY,
  question_text TEXT NOT NULL
);

CREATE TABLE common_answers (
  id          SERIAL PRIMARY KEY,
  pgpid       VARCHAR(20) NOT NULL REFERENCES users(pgpid),
  question_id INTEGER NOT NULL REFERENCES common_questions(id),
  answer      TEXT,
  UNIQUE(pgpid, question_id)
);
```

### 3.8 Allocations

```sql
CREATE TABLE allocations (
  id              SERIAL PRIMARY KEY,
  pgpid           VARCHAR(20) NOT NULL REFERENCES users(pgpid),
  committee_login VARCHAR(50) NOT NULL REFERENCES committees(login),
  student_rank    INTEGER NOT NULL,
  committee_rank  INTEGER NOT NULL,
  is_waitlist     BOOLEAN DEFAULT FALSE,
  allocated_at    TIMESTAMP DEFAULT NOW(),
  UNIQUE(pgpid)
);
```

### 3.9 Admin Settings (replaces `$gForStudent`, `$gForCommittee`, `$gRank_open` config flags)

```sql
CREATE TABLE admin_settings (
  key         VARCHAR(50) PRIMARY KEY,
  value       VARCHAR(200) NOT NULL,
  description VARCHAR(500),
  updated_at  TIMESTAMP DEFAULT NOW()
);
```

Seed with:

```sql
INSERT INTO admin_settings (key, value, description) VALUES
  ('student_access_enabled', 'true', 'Global toggle: allow students to log in and use the platform'),
  ('committee_access_enabled', 'true', 'Global toggle: allow committees to log in and use the platform'),
  ('ranking_enabled', 'false', 'Whether students can see and use the ranking page'),
  ('max_applications', '4', 'Maximum number of applications a student can submit'),
  ('deadline_grace_seconds', '60', 'Grace period in seconds added to deadlines');
```

### 3.10 Council Users

```sql
CREATE TABLE council_users (
  id            SERIAL PRIMARY KEY,
  login         VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name          VARCHAR(200) NOT NULL,
  created_at    TIMESTAMP DEFAULT NOW()
);
```

### Seed Data

Insert the council accounts:

```sql
INSERT INTO council_users (login, password_hash, name)
VALUES
  ('council', '<bcrypt_hash>', 'Student Council'),
  ('admin', '<bcrypt_hash>', 'Admin'),
  ('senate', '<bcrypt_hash>', 'Senate');
```

---

## 4. API Design (Express.js REST)

### 4.1 Auth

| Method | Endpoint | Body | Description |
|---|---|---|---|
| POST | `/api/auth/login` | `{ loginId, password }` | Authenticate any role; returns JWT + role |
| POST | `/api/auth/forgot-password` | `{ pgpid }` | Generate random password, email it |
| POST | `/api/auth/logout` | — | Invalidate token (client-side) |

### 4.1b Admin Settings APIs (council only)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/settings` | Get all admin settings (student_access_enabled, committee_access_enabled, ranking_enabled, max_applications, deadline_grace_seconds) |
| PUT | `/api/admin/settings` | Update settings `{ key: value, ... }` |

The `student_access_enabled` and `committee_access_enabled` flags are checked by auth middleware — when disabled, login returns a message like "Access is currently closed for students/committees."

### 4.2 Student APIs

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/student/profile` | Get logged-in student's profile |
| PUT | `/api/student/profile` | Update profile fields |
| GET | `/api/student/ccas` | List all CCAs with deadlines, type, presentation, resume-required flag |
| GET | `/api/student/ccas/:login` | Get CCA details + questions |
| POST | `/api/student/apply/:committeeLogin` | Submit application (answers + resume upload) |
| GET | `/api/student/applications` | List all submitted applications |
| GET | `/api/student/applications/:committeeLogin` | Get application detail for a specific CCA |
| PUT | `/api/student/applications/:committeeLogin` | Update answers for an application |
| DELETE | `/api/student/applications/:committeeLogin` | Withdraw application |
| GET | `/api/student/rankings` | Get current preference rankings |
| PUT | `/api/student/rankings` | Submit/update preference rankings `[{ committeeLogin, rank }]` |
| GET | `/api/student/common-questions` | Get common/standard questions |
| PUT | `/api/student/common-answers` | Submit common answers + upload general resume |
| GET | `/api/student/allocation` | Get allocation result for this student |
| PUT | `/api/student/applications/:committeeLogin/resume` | Re-upload resume for an existing application (if deadline not passed) |

### 4.3 Committee APIs

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/committee/profile` | Get committee profile + stats |
| PUT | `/api/committee/profile` | Update deadline, presentation, max_candidates, resume requirement |
| GET | `/api/committee/questions` | Get committee's custom questions |
| PUT | `/api/committee/questions` | Create/update questions `[{ order, text }]` (max 10) |
| GET | `/api/committee/applications` | List all applicants with answers, resume links |
| GET | `/api/committee/applications/:pgpid` | Get full student profile + answers |
| PUT | `/api/committee/applications/:pgpid/selection` | Set selection `{ status: "selected" | "rejected" | "waitlist", waitlistRank?: number, task?: string }` |
| PUT | `/api/committee/applications/bulk-selection` | Bulk update selections |
| GET | `/api/committee/applications/export/excel` | Download applicant data as .xlsx |
| GET | `/api/committee/applications/export/resumes` | Download all resumes as .zip |
| GET | `/api/committee/applications/export/contacts` | Download applicant contact info (ID, Name, Room, Mobile) as .xlsx |

### 4.4 Council APIs

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/council/dashboard` | All committees with app counts, avg rankings, selection counts |
| GET | `/api/council/committees` | List all committees with details |
| GET | `/api/council/committees/:login/applications` | View applications for a specific committee |
| GET | `/api/council/applications` | View all applications across committees |
| GET | `/api/council/applications/:pgpid` | Full student profile + all applications |
| PUT | `/api/council/applications/:pgpid/:committeeLogin/selection` | Override selection |
| POST | `/api/council/allocate` | Run the allocation algorithm |
| GET | `/api/council/allocations` | View all allocation results |
| DELETE | `/api/council/allocations` | Clear allocations (re-run) |
| GET | `/api/council/export/excel` | Download comprehensive 3-sheet Excel report |
| GET | `/api/council/export/flat-excel` | Download flat single-sheet Excel (ID, Name, Committee, Student Rank, Committee Rank) |
| GET | `/api/council/common-questions` | Get global common questions |
| PUT | `/api/council/common-questions` | Create/update global common questions (max 10) |
| POST | `/api/council/bulk-mail-credentials` | Send login credentials to all students not yet emailed (tracks `credential_sent` flag) |

---

## 5. Frontend Pages & Routes (React)

### 5.1 Public Routes

| Route | Component | Description |
|---|---|---|
| `/login` | `LoginPage` | Login form (username + password), role auto-detected |
| `/forgot-password` | `ForgotPasswordPage` | Enter pgpid, receive new password via email |

### 5.2 Student Routes (protected, role=student)

| Route | Component | Description |
|---|---|---|
| `/student` | `StudentDashboard` | Welcome page with instructions, rules, navigation cards |
| `/student/ccas` | `CCAListPage` | Browse all CCAs; filter by type (Committee/Club/AIG); show deadline, presentation download |
| `/student/ccas/:login/apply` | `ApplicationFormPage` | Committee-specific questions + resume upload; submit application |
| `/student/applications` | `MyApplicationsPage` | List of submitted applications with status (pending/selected/waitlisted/rejected) |
| `/student/applications/:login` | `ApplicationDetailPage` | View/edit answers for a submitted application; option to withdraw |
| `/student/rankings` | `RankingsPage` | Drag-and-drop interface to rank applied CCAs by preference |
| `/student/common-questions` | `CommonQuestionsPage` | Fill standard questions + upload general resume |
| `/student/allocation` | `AllocationResultPage` | View final allocation result |
| `/student/rules` | `RulesPage` | Display CCA selection rules (hardcoded business rules, see §6.5) |
| `/student/hostel` | `HostelDashboard` | Hostel election nomination landing page |
| `/student/hostel/apply` | `HostelApplyPage` | Browse and apply to hostel positions (same mechanics as CCA, filtered to type=hostel, limit=10) |

### 5.3 Committee Routes (protected, role=committee)

| Route | Component | Description |
|---|---|---|
| `/committee` | `CommitteeDashboard` | Stats (total applications), quick links |
| `/committee/form` | `FormEditorPage` | Add/edit up to 10 custom questions (rich text editor); set deadline, upload presentation |
| `/committee/applications` | `ApplicantListPage` | Table of all applicants; bulk select/reject/waitlist; assign tasks; download Excel; download resumes ZIP |
| `/committee/applications/:pgpid` | `ApplicantDetailPage` | Full student profile, answers, resume viewer |

### 5.4 Council Routes (protected, role=council)

| Route | Component | Description |
|---|---|---|
| `/council` | `CouncilDashboard` | Overview table: all committees, application counts, avg student rank, selection progress |
| `/council/committees/:login` | `CommitteeApplicationsPage` | View a specific committee's applicants and selections |
| `/council/applications` | `AllApplicationsPage` | View all applications across all committees, with filters |
| `/council/applications/:pgpid` | `StudentOverviewPage` | View a student's full profile and all their applications |
| `/council/allocate` | `AllocationPage` | Run allocation algorithm; view results; re-run option |
| `/council/export` | `ExportPage` | Download comprehensive Excel report (3-sheet and flat formats) |
| `/council/settings` | `AdminSettingsPage` | Toggle student/committee access, ranking phase, max applications, deadline grace period |
| `/council/common-questions` | `CommonQuestionsEditorPage` | Create/edit the global common questions all students answer |
| `/council/bulk-mail` | `BulkMailPage` | Send login credentials to all students who haven't been emailed yet |

### 5.5 Shared Components

| Component | Description |
|---|---|
| `Navbar` | Role-aware navigation bar with logout |
| `ProtectedRoute` | Route wrapper checking JWT + role |
| `RichTextEditor` | WYSIWYG editor for committee questions (use TipTap or React-Quill) |
| `FileUpload` | Resume/presentation upload with drag-and-drop |
| `DataTable` | Sortable, filterable table for applicant lists |
| `StatusBadge` | Color-coded status indicator (pending/selected/waitlisted/rejected) |
| `DragDropRanking` | Drag-and-drop list for student preference ranking (use @dnd-kit) |
| `ExcelExportButton` | Trigger server-side Excel generation and download |
| `PDFViewer` | Inline resume/presentation viewer |

---

## 6. Feature Specifications

### 6.1 Student Application Flow

1. Student logs in → redirected to `/student`
2. Student navigates to `/student/ccas` → sees all open CCAs with:
   - Name, type badge (Committee/Club/AIG), deadline countdown
   - "View Presentation" button (if uploaded)
   - "Apply" button (disabled if deadline passed or max 4 apps reached)
3. Student clicks "Apply" → `/student/ccas/:login/apply` shows:
   - Committee-specific questions (fetched from `committee_questions`)
   - Resume upload field (if `is_resume_required` is true)
   - Submit button
4. On submit: validate max 4 applications, validate committee-or-AIG exclusivity, upload resume, insert answers
5. Student views applications at `/student/applications` → status column shows current state
6. Student ranks at `/student/rankings` → drag-and-drop reordering → save

### 6.2 Committee Review Flow

1. Committee head logs in → redirected to `/committee`
2. Dashboard shows: total applications count
3. Navigate to `/committee/form` to set up:
   - Up to 10 custom questions (add/edit/delete with rich text)
   - Application deadline (date-time picker)
   - Presentation file upload
   - Max candidates to select
   - Whether resume is required
4. Navigate to `/committee/applications`:
   - Table: Student Name | Batch | Answers (expandable) | Resume (link) | Task | Selection Status
   - Actions per row: Select / Waitlist (enter rank) / Reject / Assign Task
   - Bulk actions: Select All / Export Excel / Download Resumes ZIP
5. Click a student → `/committee/applications/:pgpid` for full profile view

### 6.3 Council Allocation Flow

1. Council logs in → `/council` dashboard shows:
   - Table: Committee Name | Type | Applications Count | Avg Student Rank | Selected | Waitlisted
2. Navigate to `/council/allocate`:
   - "Run Allocation" button triggers the algorithm
   - Results table: Student | Allocated CCA | Student Rank | Committee Rank | Status (Allocated/Waitlisted)
   - "Clear & Re-run" option
3. Export: Download 3-sheet Excel report

### 6.4 Validation Rules

- **Max 4 applications per student**: Enforced at API level before inserting
- **Committee-or-AIG exclusivity**: A student who has applied to a Committee cannot apply to an AIG (and vice versa); Clubs are unrestricted
- **Deadline enforcement**: API checks `committees.deadline` before accepting applications
- **Max 10 questions per committee**: Enforced at API level
- **Unique rankings**: Each rank number used only once per student; each committee ranked only once
- **Ranking is mandatory** for all CCAs the student has applied to

### 6.5 Configurable Application Limits & Rules

The legacy app hardcodes different limits in different contexts. The new system should make these **configurable via `admin_settings`**:

| Setting | Default | Description |
|---|---|---|
| `max_applications` | 4 | Max CCA applications per student |
| `max_hostel_applications` | 10 | Max hostel election nominations per student |
| `deadline_grace_seconds` | 60 | Grace period added to deadlines |
| `ranking_enabled` | false | Whether the ranking feature is visible/accessible |
| `student_access_enabled` | true | Global kill-switch for student access |
| `committee_access_enabled` | true | Global kill-switch for committee access |

**Rules displayed on the student dashboard** (§5.2, `StudentDashboard`):
- "You can apply to a maximum of {max_applications} committees, clubs and AIGs in this phase"
- "A student can be part of either any Committee or any AIG but not both, however, he/she can be part of 2 clubs"
- "A student can be a part of any club in addition to the Committee/AIG"
- "You have to mandatorily rank the clubs/AIGs which you are applying for"

### 6.6 Hostel Election Flow

Hostel elections reuse the same application mechanics but with a **separate entry point and CCA type filter**:

1. Student navigates to `/student/hostel` → sees hostel nomination instructions
2. Clicks "File Nomination" → `/student/hostel/apply` shows CCAs filtered to `type = 'hostel'`
3. Same application form (committee-specific questions + resume upload)
4. Application limit is **10** (separate from the main CCA limit of 4)
5. Students can view hostel nominations alongside regular applications
6. The regular CCA listing (`/student/ccas`) filters **out** hostel entries (`type != 'hostel'`)

### 6.7 Global Access Control Toggles

Council/Admin can toggle platform access:

- **`student_access_enabled = false`**: Students are blocked at login with message "Access is currently closed for students"
- **`committee_access_enabled = false`**: Committees are blocked at login with message "Access is currently closed for committees"
- **`ranking_enabled = false`**: The ranking link/page is hidden from students; API rejects ranking submissions

These are managed from `/council/settings` (AdminSettingsPage).

### 6.8 Application Edit & Re-upload

After submitting an application, students can **edit their answers and re-upload their resume** as long as the deadline has not passed:

1. Student views application at `/student/applications/:login`
2. If deadline not passed: all answer fields are editable textareas, resume can be re-uploaded
3. If deadline passed: read-only view
4. Student can also **withdraw/delete** the application (sets `is_active = false` and deletes answers)
5. Both single-application delete (from detail view) and **bulk delete** (checkboxes on list view) are supported

### 6.9 External System Integration (Etrigan)

The legacy app links to an external student profile system called **Etrigan** in several places:
- Committee applicant detail view links to `https://team-synapse-iiml.app/etrigan/profile/{pgpid}`
- Council search links to a relative Etrigan path

**Migration approach**: Add a configurable `EXTERNAL_PROFILE_URL` environment variable (e.g., `https://team-synapse-iiml.app/etrigan/profile/`). When set, the applicant detail pages (committee and council views) show a "View Full Profile" link pointing to `{EXTERNAL_PROFILE_URL}{pgpid}`. When not set, the link is hidden.

---

## 7. Authentication & Authorization

### 7.1 Authentication

- **Method**: JWT (JSON Web Tokens)
- **Password hashing**: bcrypt (replace legacy MD5)
- **Login flow**:
  1. Client POSTs `{ loginId, password }` to `/api/auth/login`
  2. Server determines role from loginId pattern (see §2.4)
  3. Server queries the appropriate table (users / committees / council_users)
  4. Server compares bcrypt hash
  5. On success: returns `{ token, role, name, loginId }`
  6. Client stores JWT in httpOnly cookie or localStorage
  7. All subsequent requests include `Authorization: Bearer <token>`

### 7.2 JWT Payload

```json
{
  "loginId": "pgp25001",
  "role": "student",
  "name": "John Doe",
  "iat": 1695000000,
  "exp": 1695086400
}
```

### 7.3 Authorization Middleware

```
authMiddleware(req, res, next)     → verifies JWT, attaches req.user
roleGuard("student")               → checks req.user.role === "student"
roleGuard("committee")             → checks req.user.role === "committee"
roleGuard("council")               → checks req.user.role === "council"
```

### 7.4 Password Recovery

1. Student enters pgpid at `/forgot-password`
2. Server generates random 8-char password
3. Server hashes with bcrypt and updates DB
4. Server emails new password to student's registered email
5. Student logs in with new password

---

## 8. Allocation Algorithm

The allocation runs in `/api/council/allocate` and implements a preference-based matching:

### Phase 1: Primary Allocation

```
for rank = 1 to maxRank:
  for each student who has ranked any CCA:
    if student is already allocated → skip
    committeeAtThisRank = student's ranking where rank = current rank
    if no committee at this rank → skip
    committeeDecision = applications.committee_rank for (student, committee)
    if committeeDecision == 0 (selected):
      INSERT allocation (student, committee, studentRank=rank, committeeRank=0, isWaitlist=false)
    else if committeeDecision > 0 (waitlisted):
      INSERT allocation (student, committee, studentRank=rank, committeeRank=decision, isWaitlist=true)
    else:
      skip (rejected)
```

### Phase 2: Waitlist Resolution

```
for each student in allocations where isWaitlist = true:
  currentCommittee = their allocated committee
  currentStudentRank = their student_rank for that committee

  for nextRank = (currentStudentRank + 1) to totalRankedByStudent:
    seatsSelected = count of applications where committee_rank = 0 for currentCommittee
    seatsAllocated = count of allocations where isWaitlist = false for currentCommittee

    if seatsAllocated == seatsSelected (committee is full):
      nextCommittee = student's ranking at nextRank
      nextCommitteeDecision = applications.committee_rank for (student, nextCommittee)

      if nextCommitteeDecision == 0:
        UPDATE allocation → set committee=nextCommittee, isWaitlist=false, ranks updated
        break (student is allocated)
      else if nextCommitteeDecision > 0:
        UPDATE allocation → set committee=nextCommittee, isWaitlist=true, ranks updated
        currentCommittee = nextCommittee (continue checking)
      else:
        skip (rejected by this committee too)
```

### Implementation Notes

- Clear the `allocations` table before re-running
- Return the full results after completion
- Log each step for audit purposes
- The algorithm should run as a single database transaction

---

## 9. File Uploads

### Resume Upload

- **Accepted format**: PDF only
- **Storage path**: `uploads/resumes/<committeeLogin>/<pgpid>.pdf`
- **Max size**: 5MB
- **When**: During application submission
- **Access**: Committee heads and council can view/download

### Presentation Upload

- **Accepted formats**: PDF, PPTX
- **Storage path**: `uploads/presentations/<committeeLogin>.<ext>`
- **Max size**: 20MB
- **When**: Committee sets up their form
- **Access**: All students can view/download

### Implementation

- Use `multer` middleware for file upload handling
- Serve uploaded files via a static route with auth middleware
- Store file paths in the database, not the files themselves

---

## 10. Excel Export

Use the `exceljs` npm package to generate `.xlsx` files server-side.

### Committee Export — Full Applicant Data (GET `/api/committee/applications/export/excel`)

Single sheet with columns:
- Student ID | Name | Batch | Email | Phone | Answer 1..N | Task | Selection Status | Committee Rank

### Committee Export — Contact Info (GET `/api/committee/applications/export/contacts`)

Single sheet with columns:
- PGP ID | Name | Room No | Mobile

### Council Export — Comprehensive (GET `/api/council/export/excel`)

Three sheets:

**Sheet 1 — "Selected Applications"**:
- S.No | PGP ID | Name | Committee | Rank by Student | Rank by Committee
- Filter: all active applications with committee_rank > -1, grouped by committee then student

**Sheet 2 — "Students who have ranked"**:
- PGP ID | Name | Committee 1 | Student Rank 1 | Committee Rank 1 | Committee 2 | Student Rank 2 | Committee Rank 2 | ... (up to 5 committees per row)
- Filter: only students who are selected (is_selected=1) and have rankings
- Pivoted: one row per student, columns for each ranked CCA

**Sheet 3 — "Applications grouped by student"**:
- PGP ID | Name | Committee 1 | Student Rank 1 | Committee Rank 1 | Committee 2 | ... (up to 5 committees per row)
- Filter: ALL active applications (not just selected), one row per student

### Council Export — Flat (GET `/api/council/export/flat-excel`)

Single sheet with columns:
- PGP ID | Name | Committee | Rank by Student | Rank by Committee

---

## 11. Email System

Use `nodemailer` with SMTP transport.

### Emails Sent

| Trigger | Recipient | Content |
|---|---|---|
| Password reset | Student | New password |
| Bulk credential mail (council action) | All students where `credential_sent = false` | Login ID + initial password + instructions about common questions and resume upload |

### Bulk Credential Mailing

- Triggered from `/council/bulk-mail` (council only)
- Queries all students where `credential_sent = false`
- Sends HTML email with: PGP ID, password, instructions to fill common questions and upload resume
- On successful send, sets `credential_sent = true` for that student
- Processes sequentially (one email at a time) to avoid SMTP rate limits

### Configuration

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=synapse@iiml.ac.in
SMTP_PASS=<app_password>
SMTP_FROM="Team SynapsE <synapse@iiml.ac.in>"
```

---

## 12. Project Structure

```
calvin-platform/
├── client/                          # React Vite frontend
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   ├── public/
│   │   └── calvin-logo.png
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── api/
│       │   └── axios.js              # Axios instance with interceptors
│       ├── context/
│       │   └── AuthContext.jsx        # Auth state + JWT management
│       ├── components/
│       │   ├── Navbar.jsx
│       │   ├── ProtectedRoute.jsx
│       │   ├── DataTable.jsx
│       │   ├── StatusBadge.jsx
│       │   ├── FileUpload.jsx
│       │   ├── RichTextEditor.jsx
│       │   ├── DragDropRanking.jsx
│       │   └── ExcelExportButton.jsx
│       ├── pages/
│       │   ├── LoginPage.jsx
│       │   ├── ForgotPasswordPage.jsx
│       │   ├── student/
│       │   │   ├── StudentDashboard.jsx
│       │   │   ├── CCAListPage.jsx
│       │   │   ├── ApplicationFormPage.jsx
│       │   │   ├── MyApplicationsPage.jsx
│       │   │   ├── ApplicationDetailPage.jsx
│       │   │   ├── RankingsPage.jsx
│       │   │   ├── CommonQuestionsPage.jsx
│       │   │   ├── AllocationResultPage.jsx
│       │   │   ├── RulesPage.jsx
│       │   │   ├── HostelDashboard.jsx
│       │   │   └── HostelApplyPage.jsx
│       │   ├── committee/
│       │   │   ├── CommitteeDashboard.jsx
│       │   │   ├── FormEditorPage.jsx
│       │   │   ├── ApplicantListPage.jsx
│       │   │   └── ApplicantDetailPage.jsx
│       │   └── council/
│       │       ├── CouncilDashboard.jsx
│       │       ├── CommitteeApplicationsPage.jsx
│       │       ├── AllApplicationsPage.jsx
│       │       ├── StudentOverviewPage.jsx
│       │       ├── AllocationPage.jsx
│       │       ├── ExportPage.jsx
│       │       ├── AdminSettingsPage.jsx
│       │       ├── CommonQuestionsEditorPage.jsx
│       │       └── BulkMailPage.jsx
│       └── utils/
│           ├── roleUtils.js           # Role detection from loginId
│           └── formatters.js          # Date, status formatters
│
├── server/                           # Node.js Express backend
│   ├── package.json
│   ├── src/
│   │   ├── index.js                  # Entry point, app.listen
│   │   ├── app.js                    # Express app setup, middleware
│   │   ├── config/
│   │   │   └── db.js                 # PostgreSQL connection (pg pool)
│   │   ├── middleware/
│   │   │   ├── auth.js               # JWT verification
│   │   │   ├── roleGuard.js          # Role-based access control
│   │   │   └── upload.js             # Multer config
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── student.routes.js
│   │   │   ├── committee.routes.js
│   │   │   └── council.routes.js
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── student.controller.js
│   │   │   ├── committee.controller.js
│   │   │   └── council.controller.js
│   │   ├── services/
│   │   │   ├── allocation.service.js  # Allocation algorithm
│   │   │   ├── excel.service.js       # Excel generation
│   │   │   └── email.service.js       # Nodemailer
│   │   └── utils/
│   │       └── roleDetector.js        # Determine role from loginId
│   └── uploads/                      # File upload directory
│       ├── resumes/
│       └── presentations/
│
├── database/
│   ├── schema.sql                    # All CREATE TABLE statements from §3
│   ├── seed.sql                      # Initial committee + council data
│   └── migrate-from-legacy.sql       # Migration script from old MySQL data
│
├── .env.example
├── docker-compose.yml                # PostgreSQL + app containers (optional)
└── README.md
```

---

## 13. Environment Configuration

### `.env.example`

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=calvin
DB_USER=calvin_user
DB_PASSWORD=

# JWT
JWT_SECRET=
JWT_EXPIRES_IN=24h

# Server
PORT=5000
NODE_ENV=development

# SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM="Team SynapsE <synapse@iiml.ac.in>"

# Client URL (for CORS)
CLIENT_URL=http://localhost:5173

# Upload limits
MAX_RESUME_SIZE_MB=5
MAX_PRESENTATION_SIZE_MB=20

# External profile system (optional — leave empty to hide the link)
EXTERNAL_PROFILE_URL=https://team-synapse-iiml.app/etrigan/profile/
```

---

## 14. Setup & Run Instructions

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- npm or yarn

### Backend Setup

```bash
cd server
npm install
cp .env.example .env        # Fill in DB credentials, JWT secret, SMTP config
npm run db:create            # Create database
npm run db:migrate           # Run schema.sql
npm run db:seed              # Run seed.sql (committees + council accounts)
npm start                    # Starts on PORT from .env (default 5000)
```

### Frontend Setup

```bash
cd client
npm install
npm run dev                  # Starts Vite dev server on http://localhost:5173
```

### Key Dependencies

**Server:**
- `express` — HTTP framework
- `pg` — PostgreSQL client
- `bcrypt` — Password hashing
- `jsonwebtoken` — JWT auth
- `multer` — File uploads
- `exceljs` — Excel export
- `nodemailer` — Email sending
- `cors` — Cross-origin requests
- `dotenv` — Environment config
- `express-validator` — Input validation

**Client:**
- `react` + `react-dom` — UI framework
- `react-router-dom` — Routing
- `axios` — HTTP client
- `@dnd-kit/core` + `@dnd-kit/sortable` — Drag-and-drop ranking
- `@tiptap/react` or `react-quill` — Rich text editor for committee questions
- `tailwindcss` — Styling (or Material UI / Ant Design)
- `react-hot-toast` — Notifications
- `dayjs` — Date formatting
- `react-icons` — Icon library

---

## Appendix: Legacy-to-New Field Mapping

| Legacy (PHP/MySQL) | New (Node/PostgreSQL) |
|---|---|
| `$_SESSION['login']` | JWT `loginId` claim |
| `$_SESSION['group']` | JWT `role` claim |
| `$_SESSION['password']` | Not stored in session |
| `md5($password)` | `bcrypt.hash(password, 10)` |
| `$gStudentTable` (student) | `users` table |
| `$gCommitteeTable` (committees) | `committees` table |
| `$gApplicationTable` (application) | `committee_questions` table |
| `$gApplyTable` (apply) | `application_answers` table |
| `$gStudentApplyTable` (student) | `applications` table |
| `$gRankingTable` (rankings) | `rankings` table |
| `$gAllocationTable` (allocation) | `allocations` table |
| `isClub` (0/1/2/3) | `type` enum ('committee'/'club'/'aig'/'hostel') |
| Raw SQL string concatenation | Parameterized queries (`$1, $2...`) |
| `$gForStudent` / `$gForCommittee` / `$gRank_open` | `admin_settings` table |
| `$gSynapseTime` (60s grace) | `admin_settings.deadline_grace_seconds` |
| `committees/exceldownload.php` | `GET /api/committee/applications/export/excel` |
| `committees/PGP1.php` | `GET /api/committee/applications/export/contacts` |
| `council/allocate.php` | `POST /api/council/allocate` |
| `council/PGP_senate.php` | `GET /api/council/export/flat-excel` |
| `council/openform.php` | `PUT /api/council/common-questions` |
| `mailuserpassword.php` | `POST /api/council/bulk-mail-credentials` |
| `students/hostel_index.php` + `apply_hostel.php` | `/student/hostel` + `/student/hostel/apply` routes |
| Etrigan profile links | Configurable `EXTERNAL_PROFILE_URL` env var |
