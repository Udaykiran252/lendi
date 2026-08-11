const { Pool } = require('pg');
const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, '..', 'lendi.db');
let pool;
let sqliteDb;

function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    const config = connectionString
      ? {
          connectionString,
          ssl: process.env.DB_SSL === 'true' || process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        }
      : {
          host: process.env.PGHOST || 'localhost',
          port: parseInt(process.env.PGPORT || '5432'),
          user: process.env.PGUSER || 'postgres',
          password: process.env.PGPASSWORD || 'postgres',
          database: process.env.PGDATABASE || 'lendi_db',
          ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
        };
    pool = new Pool(config);
  }
  return pool;
}

async function initPostgresDb(clientOrPool) {
  const query = (text, params) => clientOrPool.query(text, params);

  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL,
      department VARCHAR(50),
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS students (
      id SERIAL PRIMARY KEY,
      user_id INT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      roll_no VARCHAR(50) UNIQUE NOT NULL,
      year INT NOT NULL,
      semester INT NOT NULL,
      section VARCHAR(10) DEFAULT 'A'
    );

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

    CREATE TABLE IF NOT EXISTS subjects (
      id SERIAL PRIMARY KEY,
      code VARCHAR(50) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      faculty_name VARCHAR(255),
      department VARCHAR(50) NOT NULL,
      year INT,
      semester INT
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id SERIAL PRIMARY KEY,
      student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      subject_id INT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
      date VARCHAR(50) NOT NULL,
      status VARCHAR(20) NOT NULL CHECK(status IN ('present', 'absent')),
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS authorized_emails (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      roll_no VARCHAR(50) UNIQUE,
      name VARCHAR(255) NOT NULL,
      department VARCHAR(50) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS staff_attendance (
      id SERIAL PRIMARY KEY,
      user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      date VARCHAR(50) NOT NULL,
      status VARCHAR(20) NOT NULL CHECK(status IN ('present', 'absent', 'leave')),
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);
    CREATE INDEX IF NOT EXISTS idx_outpasses_user_id ON outpasses(user_id);
    CREATE INDEX IF NOT EXISTS idx_outpasses_student_id ON outpasses(student_id);
    CREATE INDEX IF NOT EXISTS idx_outpasses_status ON outpasses(status);
    CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
  `);

  // Seed Authorized Emails if empty
  const authRes = await query('SELECT COUNT(*)::int as count FROM authorized_emails');
  if ((authRes.rows[0]?.count || 0) === 0) {
    const insertAuth = 'INSERT INTO authorized_emails (email, roll_no, name, department) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING';
    await query(insertAuth, ['rahul.kumar@lendi.edu.in', '21KD1A0501', 'Rahul Kumar', 'CSE']);
    await query(insertAuth, ['priya.sharma@lendi.edu.in', '21KD1A0502', 'Priya Sharma', 'CSE']);
    await query(insertAuth, ['arun.reddy@lendi.edu.in', '21KD1A0401', 'Arun Reddy', 'ECE']);
    await query(insertAuth, ['sneha.patel@lendi.edu.in', '21KD1A0201', 'Sneha Patel', 'EEE']);
    await query(insertAuth, ['vikram.naidu@lendi.edu.in', '21KD1A0301', 'Vikram Naidu', 'MECH']);
    await query(insertAuth, ['teacher.cse@lendi.edu.in', null, 'Dr. Ramesh Babu', 'CSE']);
    await query(insertAuth, ['hod.cse@lendi.edu.in', null, 'Dr. Srinivasa Rao', 'CSE']);
    await query(insertAuth, ['principal@lendi.edu.in', null, 'Dr. V. V. Nageswara Rao', 'ADMIN']);
    await query(insertAuth, ['gate.security@lendi.edu.in', null, 'Main Gate Security', 'SECURITY']);
    await query(insertAuth, ['admin@lendi.edu.in', null, 'System Admin', 'ADMIN']);
  }

  // Seed Users if empty
  const userRes = await query('SELECT COUNT(*)::int as count FROM users');
  if ((userRes.rows[0]?.count || 0) === 0) {
    const pwdHash = bcrypt.hashSync('password123', 10);
    const adminHash = bcrypt.hashSync('admin123', 10);

    const insertUserSql = 'INSERT INTO users (name, email, password, role, department) VALUES ($1, $2, $3, $4, $5) RETURNING id';
    const insertStudentSql = 'INSERT INTO students (user_id, roll_no, year, semester, section) VALUES ($1, $2, $3, $4, $5)';

    const u1 = await query(insertUserSql, ['Rahul Kumar', 'rahul.kumar@lendi.edu.in', pwdHash, 'student', 'CSE']);
    await query(insertStudentSql, [u1.rows[0].id, '21KD1A0501', 3, 2, 'A']);

    const u2 = await query(insertUserSql, ['Priya Sharma', 'priya.sharma@lendi.edu.in', pwdHash, 'student', 'CSE']);
    await query(insertStudentSql, [u2.rows[0].id, '21KD1A0502', 3, 2, 'A']);

    const u3 = await query(insertUserSql, ['Arun Reddy', 'arun.reddy@lendi.edu.in', pwdHash, 'student', 'ECE']);
    await query(insertStudentSql, [u3.rows[0].id, '21KD1A0401', 3, 2, 'B']);

    const u4 = await query(insertUserSql, ['Sneha Patel', 'sneha.patel@lendi.edu.in', pwdHash, 'student', 'EEE']);
    await query(insertStudentSql, [u4.rows[0].id, '21KD1A0201', 3, 2, 'A']);

    const u5 = await query(insertUserSql, ['Vikram Naidu', 'vikram.naidu@lendi.edu.in', pwdHash, 'student', 'MECH']);
    await query(insertStudentSql, [u5.rows[0].id, '21KD1A0301', 3, 2, 'A']);

    await query(insertUserSql, ['Dr. Ramesh Babu', 'teacher.cse@lendi.edu.in', pwdHash, 'class_teacher', 'CSE']);
    await query(insertUserSql, ['Prof. Lakshmi Devi', 'teacher.ece@lendi.edu.in', pwdHash, 'class_teacher', 'ECE']);
    await query(insertUserSql, ['Prof. Suresh Kumar', 'teacher.eee@lendi.edu.in', pwdHash, 'class_teacher', 'EEE']);
    await query(insertUserSql, ['Prof. Rajesh Varma', 'teacher.mech@lendi.edu.in', pwdHash, 'class_teacher', 'MECH']);

    await query(insertUserSql, ['Dr. Srinivasa Rao', 'hod.cse@lendi.edu.in', pwdHash, 'hod', 'CSE']);
    await query(insertUserSql, ['Dr. Padmaja', 'hod.ece@lendi.edu.in', pwdHash, 'hod', 'ECE']);
    await query(insertUserSql, ['Dr. Venkat Rao', 'hod.eee@lendi.edu.in', pwdHash, 'hod', 'EEE']);
    await query(insertUserSql, ['Dr. Krishna Murthy', 'hod.mech@lendi.edu.in', pwdHash, 'hod', 'MECH']);

    await query(insertUserSql, ['Dr. V. V. Nageswara Rao', 'principal@lendi.edu.in', pwdHash, 'principal', null]);
    await query(insertUserSql, ['System Admin', 'admin@lendi.edu.in', adminHash, 'admin', null]);
    await query(insertUserSql, ['Main Gate Security', 'gate.security@lendi.edu.in', pwdHash, 'gate_staff', null]);
  }
}

let isInitialized = false;

function getDb() {
  const p = getPool();
  if (!isInitialized) {
    isInitialized = true;
    initPostgresDb(p).catch(err => {
      console.error('PostgreSQL DB initialization error:', err);
    });
  }
  return {
    query: (text, params) => p.query(text, params),
    getClient: () => p.connect(),
    pool: p
  };
}

function getSqliteDb() {
  if (!sqliteDb) {
    sqliteDb = new Database(DB_PATH);
    sqliteDb.pragma('journal_mode = WAL');
    sqliteDb.pragma('foreign_keys = ON');
  }
  return sqliteDb;
}

module.exports = { getDb, getPool, getSqliteDb, initPostgresDb };
