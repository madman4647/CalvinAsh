# Calvin CCA Platform

> **"Express your Interests...Online"**  
> Co-Curricular Activity Selection Platform for IIM Lucknow  
> Built by Team SynapsE

## Overview

Calvin is a web platform that manages the CCA (Co-Curricular Activity) selection process at IIM Lucknow. Students browse and apply to Committees, Clubs, and AIGs; Committee Heads review applicants; and the Council runs a preference-based matching algorithm.

## Tech Stack

- **Frontend**: React 18 (Vite) + Tailwind CSS
- **Backend**: Node.js / Express.js
- **Database**: PostgreSQL 15+
- **Auth**: JWT + bcrypt

## User Roles

| Role | Login Pattern | Example |
|---|---|---|
| Student | Starts with `pgp`, `abm`, or `fpm` | `pgp25001` |
| Committee Head | Committee alias | `placemen`, `km`, `manfest` |
| Council / Admin | Fixed IDs | `council`, `admin`, `senate` |

## Prerequisites

- Node.js 18+
- PostgreSQL 15+
- npm

## Setup

### 1. Database

```bash
# Create database and user
psql -U postgres
CREATE DATABASE calvin;
CREATE USER calvin_user WITH PASSWORD 'yourpassword';
GRANT ALL PRIVILEGES ON DATABASE calvin TO calvin_user;
\q

# Run schema and seed
psql -U calvin_user -d calvin -f database/schema.sql
psql -U calvin_user -d calvin -f database/seed.sql
```

### 2. Backend

```bash
cd server
npm install
cp .env.example .env
# Edit .env with your DB credentials and JWT secret
npm start          # production
# or
npm run dev        # development (auto-reload)
```

Server runs on `http://localhost:5000`.

### 3. Frontend

```bash
cd client
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`.

## Environment Variables (server/.env)

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=calvin
DB_USER=calvin_user
DB_PASSWORD=yourpassword
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h
PORT=5000
CLIENT_URL=http://localhost:5173
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## Default Credentials (from seed.sql)

All default passwords are `calvin123`.

| Login | Role |
|---|---|
| `council` | Council |
| `admin` | Council |
| `senate` | Council |
| `placemen` | Committee (Placement) |
| `km` | Committee (Knowledge Mgmt) |
| `manfest` | Club (Manfest) |
| `literary` | Club (Literary Club) |
| `financeaig` | AIG (Finance AIG) |
| `pgp25001` | Student (Test) |

**Change all passwords before going live.**

## Business Rules

- Max **4 applications** per student
- Student can join a **Committee or AIG** (not both) + up to **2 Clubs**
- Each committee can have up to **10 custom questions**
- Applications close at the committee deadline
- Allocation uses a preference-based stable matching algorithm

## API Reference

| Prefix | Role |
|---|---|
| `/api/auth` | Public — login, forgot password |
| `/api/student` | Students only |
| `/api/committee` | Committee heads only |
| `/api/council` | Council/Admin only |

## Project Structure

```
Calvin_2.0/
├── client/          # React Vite frontend
├── server/          # Express.js backend
│   └── uploads/     # Uploaded resumes & presentations
├── database/
│   ├── schema.sql   # All table definitions
│   └── seed.sql     # Initial data + test accounts
└── .env.example
```
