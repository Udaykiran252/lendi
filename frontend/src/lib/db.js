import Database from 'better-sqlite3';
import path from 'path';
import bcrypt from 'bcryptjs';

const DB_PATH = path.join(process.cwd(), 'lendi.db');
let db;

function initDb(database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      department TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      roll_no TEXT UNIQUE NOT NULL,
      year INTEGER NOT NULL,
      semester INTEGER NOT NULL,
      section TEXT DEFAULT 'A',
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS outpasses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER,
      user_id INTEGER NOT NULL,
      reason TEXT NOT NULL,
      destination TEXT NOT NULL,
      from_date TEXT NOT NULL,
      to_date TEXT NOT NULL,
      from_time TEXT,
      to_time TEXT,
      status TEXT DEFAULT 'pending_teacher',
      teacher_status TEXT DEFAULT 'pending',
      teacher_remarks TEXT,
      teacher_action_at DATETIME,
      hod_status TEXT DEFAULT 'pending',
      hod_remarks TEXT,
      hod_action_at DATETIME,
      principal_status TEXT DEFAULT 'pending',
      principal_remarks TEXT,
      principal_action_at DATETIME,
      exit_time DATETIME,
      entry_time DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'info',
      outpass_id INTEGER,
      read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS subjects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      faculty_name TEXT,
      department TEXT NOT NULL,
      year INTEGER,
      semester INTEGER
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      subject_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('present', 'absent')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
    );
  `);

  // Ensure outpass_id exists on notifications
  try {
    database.exec(`ALTER TABLE notifications ADD COLUMN outpass_id INTEGER`);
  } catch {}

  // Check if users exist, seed defaults if empty
  const userCount = database.prepare('SELECT COUNT(*) as count FROM users').get()?.count || 0;
  if (userCount === 0) {
    const pwdHash = bcrypt.hashSync('password123', 10);
    const adminHash = bcrypt.hashSync('admin123', 10);

    const insertUser = database.prepare('INSERT INTO users (name, email, password, role, department) VALUES (?, ?, ?, ?, ?)');
    const insertStudent = database.prepare('INSERT INTO students (user_id, roll_no, year, semester, section) VALUES (?, ?, ?, ?, ?)');

    // Seed Users
    const u1 = insertUser.run('Rahul Kumar', 'rahul.kumar@lendi.edu.in', pwdHash, 'student', 'CSE');
    insertStudent.run(u1.lastInsertRowid, '21KD1A0501', 3, 2, 'A');

    const u2 = insertUser.run('Priya Sharma', 'priya.sharma@lendi.edu.in', pwdHash, 'student', 'CSE');
    insertStudent.run(u2.lastInsertRowid, '21KD1A0502', 3, 2, 'A');

    const u3 = insertUser.run('Arun Reddy', 'arun.reddy@lendi.edu.in', pwdHash, 'student', 'ECE');
    insertStudent.run(u3.lastInsertRowid, '21KD1A0401', 3, 2, 'B');

    const u4 = insertUser.run('Sneha Patel', 'sneha.patel@lendi.edu.in', pwdHash, 'student', 'EEE');
    insertStudent.run(u4.lastInsertRowid, '21KD1A0201', 3, 2, 'A');

    const u5 = insertUser.run('Vikram Naidu', 'vikram.naidu@lendi.edu.in', pwdHash, 'student', 'MECH');
    insertStudent.run(u5.lastInsertRowid, '21KD1A0301', 3, 2, 'A');

    // Teachers
    insertUser.run('Dr. Ramesh Babu', 'teacher.cse@lendi.edu.in', pwdHash, 'class_teacher', 'CSE');
    insertUser.run('Prof. Lakshmi Devi', 'teacher.ece@lendi.edu.in', pwdHash, 'class_teacher', 'ECE');
    insertUser.run('Prof. Suresh Kumar', 'teacher.eee@lendi.edu.in', pwdHash, 'class_teacher', 'EEE');
    insertUser.run('Prof. Rajesh Varma', 'teacher.mech@lendi.edu.in', pwdHash, 'class_teacher', 'MECH');

    // HODs
    insertUser.run('Dr. Srinivasa Rao', 'hod.cse@lendi.edu.in', pwdHash, 'hod', 'CSE');
    insertUser.run('Dr. Padmaja', 'hod.ece@lendi.edu.in', pwdHash, 'hod', 'ECE');
    insertUser.run('Dr. Venkat Rao', 'hod.eee@lendi.edu.in', pwdHash, 'hod', 'EEE');
    insertUser.run('Dr. Krishna Murthy', 'hod.mech@lendi.edu.in', pwdHash, 'hod', 'MECH');

    // Principal & Admin & Gate Security
    insertUser.run('Dr. V. V. Nageswara Rao', 'principal@lendi.edu.in', pwdHash, 'principal', null);
    insertUser.run('System Admin', 'admin@lendi.edu.in', adminHash, 'admin', null);
    insertUser.run('Main Gate Security', 'gate.security@lendi.edu.in', pwdHash, 'gate_staff', null);
  }
}

export function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initDb(db);
  }
  return db;
}

