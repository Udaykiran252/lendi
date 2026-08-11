# Implementation Plan: PostgreSQL Migration for Lendi College Portal

This document outlines the complete architectural analysis and step-by-step migration strategy to move the Lendi College Portal from local file-based SQLite (`better-sqlite3`) to a production-ready PostgreSQL database suitable for cloud deployment (e.g., Render, Railway, Supabase, AWS RDS, Neon).

---

## 1. Project Analysis & Audit Findings

### A. Current Database Architecture & Setup
- **Database File**: `backend/lendi.db` (SQLite 3 WAL mode)
- **Database Driver**: `better-sqlite3` (Synchronous C-based Node driver)
- **Connection Wrapper**: `backend/lib/db.js` (Exports `getDb()`)
- **Schema & Seeding**: Table creation statements (`CREATE TABLE IF NOT EXISTS`) and auto-seeding logic reside directly inside `backend/lib/db.js`.
- **Frontend DB File**: `frontend/src/lib/db.js` exists as an unused leftover file from earlier experimentation. The frontend (`Next.js`) communicates strictly via HTTP API calls (`/api/...`) rewritten to `http://localhost:5000/api/...` via `frontend/next.config.mjs`.

### B. SQLite Usage Across Route Handlers
Every single database interaction in the backend currently uses `better-sqlite3`'s synchronous API (`db.prepare()`, `.get()`, `.all()`, `.run()`, `.transaction()`):

| Route File | Target Entities | SQLite Operations Used |
| :--- | :--- | :--- |
| `backend/lib/db.js` | Schema & Seeds | `db.exec()`, `db.pragma()`, `db.prepare().get()`, `db.prepare().run()` |
| `backend/routes/auth.js` | `users`, `students`, `authorized_emails` | `db.prepare().get()`, `db.prepare().run()` |
| `backend/routes/admin.js` | `users`, `students`, `notifications` | `db.prepare().all()`, `db.prepare().get()`, `db.prepare().run()`, `db.transaction()` |
| `backend/routes/outpass.js` | `outpasses`, `users`, `students`, `notifications` | `db.prepare().all()`, `db.prepare().get()`, `db.prepare().run()` |
| `backend/routes/teacher.js` | `outpasses`, `users`, `students` | `db.prepare().all()`, `db.prepare().get()`, SQL string concatenation |
| `backend/routes/hod.js` | `users`, `students`, `outpasses`, `attendance`, `staff_attendance` | `db.prepare().all()`, `db.prepare().get()`, SQLite date functions (`date('now')`) |
| `backend/routes/attendance.js` | `students`, `attendance`, `subjects` | `db.prepare().get()`, `db.prepare().all()` |
| `backend/routes/security.js` | `outpasses`, `users`, `students`, `notifications` | `db.prepare().all()`, `db.prepare().get()`, `db.prepare().run()`, date filtering with `LIKE` |
| `backend/routes/staff.js` | `outpasses`, `users`, `notifications` | `db.prepare().get()`, `db.prepare().run()` |
| `backend/routes/notifications.js` | `notifications` | `db.prepare().all()`, `db.prepare().run()` |

---

## 2. Key Technical Differences & Migration Requirements

1. **Synchronous vs Asynchronous Driver Execution**:
   - `better-sqlite3` queries run synchronously (blocking event loop).
   - PostgreSQL (`pg` module) queries are non-blocking and return `Promises`.
   - **Requirement**: All Express route handlers using `db.prepare(...).all() / .get() / .run()` must be updated to `async (req, res)` using `await db.query(...)`.

2. **Parameter Placeholders**:
   - SQLite uses `?` for bind parameters.
   - PostgreSQL uses `$1`, `$2`, `$3`, etc.

3. **Auto-Increment & Primary Key Insertion**:
   - SQLite uses `INTEGER PRIMARY KEY AUTOINCREMENT` and `result.lastInsertRowid`.
   - PostgreSQL uses `SERIAL PRIMARY KEY` and `RETURNING id` (or `RETURNING *`). `result.rows[0].id` is used to fetch inserted IDs.

4. **Transactions**:
   - SQLite: `db.transaction(() => { ... })()`.
   - PostgreSQL: Connection client checkout from pool (`const client = await pool.connect()`), followed by `BEGIN`, `COMMIT`, `ROLLBACK`, and `client.release()`.

5. **SQL Functions & Date Handling**:
   - SQLite: `date('now')` and string pattern matching `exit_time LIKE '2026-08-11%'`.
   - PostgreSQL: `CURRENT_DATE`, `hod_action_at::date = CURRENT_DATE`, and `exit_time::date = $1::date`.

6. **UPSERT / Insert Ignore Syntax**:
   - SQLite: `INSERT OR IGNORE INTO authorized_emails ...`
   - PostgreSQL: `INSERT INTO authorized_emails ... ON CONFLICT (email) DO NOTHING`.

7. **Count Aggregations returning Strings in `pg` Driver**:
   - In Node `pg` client, `COUNT(*)` returns a string (e.g. `'5'`) to prevent 64-bit integer precision loss.
   - We will cast counts in PostgreSQL queries as `COUNT(*)::int` to preserve proper JSON numeric formatting for the frontend.

---

## 3. Required PostgreSQL Schema

```sql
-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  department VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Students Table
CREATE TABLE IF NOT EXISTS students (
  id SERIAL PRIMARY KEY,
  user_id INT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  roll_no VARCHAR(50) UNIQUE NOT NULL,
  year INT NOT NULL,
  semester INT NOT NULL,
  section VARCHAR(10) DEFAULT 'A'
);

-- Outpasses Table
CREATE TABLE IF NOT EXISTS outpasses (
  id SERIAL PRIMARY KEY,
  student_id INT REFERENCES students(id) ON DELETE SET NULL,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  destination TEXT NOT NULL,
  from_date VARCHAR(50) NOT NULL,
  to_date VARCHAR(50) NOT NULL,
  from_time VARCHAR(50),
  to_time VARCHAR(50),
  status VARCHAR(50) DEFAULT 'pending_teacher',
  teacher_status VARCHAR(50) DEFAULT 'pending',
  teacher_remarks TEXT,
  teacher_action_at TIMESTAMPTZ,
  hod_status VARCHAR(50) DEFAULT 'pending',
  hod_remarks TEXT,
  hod_action_at TIMESTAMPTZ,
  principal_status VARCHAR(50) DEFAULT 'pending',
  principal_remarks TEXT,
  principal_action_at TIMESTAMPTZ,
  exit_time TIMESTAMPTZ,
  entry_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info',
  outpass_id INT,
  read INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Subjects Table
CREATE TABLE IF NOT EXISTS subjects (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  faculty_name VARCHAR(255),
  department VARCHAR(50) NOT NULL,
  year INT,
  semester INT
);

-- Attendance Table
CREATE TABLE IF NOT EXISTS attendance (
  id SERIAL PRIMARY KEY,
  student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject_id INT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  date VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK(status IN ('present', 'absent')),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Authorized Emails Table
CREATE TABLE IF NOT EXISTS authorized_emails (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  roll_no VARCHAR(50) UNIQUE,
  name VARCHAR(255) NOT NULL,
  department VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Staff Attendance Table
CREATE TABLE IF NOT EXISTS staff_attendance (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK(status IN ('present', 'absent', 'leave')),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

---

## 4. Summary of Required Modifications

### A. Packages to Install
In `backend/package.json`:
- `pg` (`^8.13.0` or latest) - PostgreSQL client pool driver for Node.js.

### B. Environment Variables Required
In `backend/.env` (and cloud environment variables for production):
```env
# Database Connection Options
# Option 1: Full Connection String (Recommended for Supabase, Neon, Render, Railway, etc.)
DATABASE_URL=postgres://postgres:password@localhost:5432/lendi_db

# Option 2: Individual Connection Parameters (Alternative)
PGHOST=localhost
PGUSER=postgres
PGPASSWORD=password
PGDATABASE=lendi_db
PGPORT=5432
PGSSLMODE=disable # Use 'require' for managed cloud databases with SSL
```

### C. Files Needing Modification
1. `backend/package.json` — Add `pg` dependency.
2. `backend/lib/db.js` — Rewrite to support PostgreSQL connection pooling (`pg.Pool`), dynamic parameter helper utilities, table auto-initialization, and auto-seeding in PostgreSQL.
3. `backend/routes/auth.js` — Update queries to `$1` syntax, `async/await`, `RETURNING id`, and `ON CONFLICT DO NOTHING`.
4. `backend/routes/admin.js` — Update user management queries, `async/await`, `$1` syntax, and wrap multi-table user creation/deletion in PostgreSQL client transactions (`BEGIN/COMMIT/ROLLBACK`).
5. `backend/routes/outpass.js` — Update outpass submission, status fetching, and 3-step approvals (Teacher -> HOD -> Principal) to use `$1` syntax, `async/await`, and `RETURNING id`.
6. `backend/routes/teacher.js` — Parameterize department filters, update to `$1` syntax and `async/await`.
7. `backend/routes/hod.js` — Parameterize department filters, update SQLite `date('now')` to Postgres `CURRENT_DATE`, cast `COUNT(*)::int`, update to `async/await`.
8. `backend/routes/attendance.js` — Update subject attendance queries to `$1` syntax and `async/await`.
9. `backend/routes/security.js` — Update active outpass lookup & gate entry/exit verification to `$1` syntax, `exit_time::date` date matching, and `async/await`.
10. `backend/routes/staff.js` — Update gate verification handler to `$1` syntax and `async/await`.
11. `backend/routes/notifications.js` — Update notification retrieval and mark-as-read queries to `$1` syntax and `async/await`.

### D. New Script Creation
- `backend/scripts/migrate-to-pg.js` — A standalone data migration utility script to migrate existing rows from SQLite (`backend/lendi.db`) into PostgreSQL while syncing primary key sequences (`setval`).

---

## 5. Migration & Data Transfer Plan

1. **Step 1: Code Prep & Package Installation**
   - Install `pg` in `backend/package.json`.
   - Keep `better-sqlite3` and `backend/lendi.db` intact.

2. **Step 2: Unified DB Module (`backend/lib/db.js`)**
   - Create a clean connection pool interface for PostgreSQL (`pg.Pool`).
   - Implement `query(text, params)` helper to execute parameterized queries asynchronously.
   - Maintain fallback or migration capabilities.

3. **Step 3: Route Refactoring**
   - Update all 9 backend routes to `async/await` and `$1` parameter binding.
   - Ensure all 3-level outpass workflow checks, security QR verification, authentication domain checks, notifications, and attendance features are preserved 100%.

4. **Step 4: Data Migration Execution**
   - Run `backend/scripts/migrate-to-pg.js` to transfer existing accounts, outpasses, attendance logs, and notifications from `backend/lendi.db` directly into the PostgreSQL database.
   - Execute sequence reset queries (`setval`) so auto-increment IDs match post-migration.

5. **Step 5: End-to-End Verification**
   - Test student login & registration with `@lendi.edu.in`.
   - Test outpass creation by Student.
   - Test Class Teacher review and approval.
   - Test HOD review and approval.
   - Test Principal final approval.
   - Test Security Guard QR verification, gate exit log, and gate entry log.
   - Test Admin user management.

---

## 6. Cloud Deployment Considerations

- **SSL Connection**: Managed cloud databases (Supabase, Neon, AWS RDS, Render Postgres) require SSL. `pg` configuration should handle `{ ssl: { rejectUnauthorized: false } }` when `DATABASE_URL` is set in production.
- **Connection Pooling**: Node `pg.Pool` handles connection pooling efficiently for Express applications. Max connection limit can be configured via environment variables.
- **Database Host Security**: Keep database credentials stored securely in environment variables; never commit credentials to source control.

---

## User Review & Approval Required

> [!IMPORTANT]
> No files have been modified yet in accordance with your instructions. Please review this migration plan and provide approval before code modifications begin.
