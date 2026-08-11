const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { getSqliteDb, getPool, initPostgresDb } = require('../lib/db');

async function migrateData() {
  console.log('🚀 Starting SQLite → PostgreSQL Data Migration...');

  let sqliteDb;
  let pool;
  try {
    sqliteDb = getSqliteDb();
    pool = getPool();
  } catch (err) {
    console.error('❌ Failed to initialize database connections:', err.message);
    process.exit(1);
  }

  try {
    console.log('📦 Initializing PostgreSQL Schema...');
    await initPostgresDb(pool);

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 1. Migrate Authorized Emails
      const authEmails = sqliteDb.prepare('SELECT * FROM authorized_emails').all();
      console.log(`📧 Migrating ${authEmails.length} authorized_emails...`);
      for (const row of authEmails) {
        await client.query(`
          INSERT INTO authorized_emails (id, email, roll_no, name, department, created_at)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            roll_no = EXCLUDED.roll_no,
            name = EXCLUDED.name,
            department = EXCLUDED.department
        `, [row.id, row.email, row.roll_no, row.name, row.department, row.created_at || new Date().toISOString()]);
      }

      // 2. Migrate Users
      const users = sqliteDb.prepare('SELECT * FROM users').all();
      console.log(`👤 Migrating ${users.length} users...`);
      for (const row of users) {
        await client.query(`
          INSERT INTO users (id, email, password, name, role, department, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            password = EXCLUDED.password,
            name = EXCLUDED.name,
            role = EXCLUDED.role,
            department = EXCLUDED.department
        `, [row.id, row.email, row.password, row.name, row.role, row.department, row.created_at || new Date().toISOString()]);
      }

      // 3. Migrate Students
      const students = sqliteDb.prepare('SELECT * FROM students').all();
      console.log(`🎓 Migrating ${students.length} students...`);
      for (const row of students) {
        await client.query(`
          INSERT INTO students (id, user_id, roll_no, year, semester, section)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (id) DO UPDATE SET
            user_id = EXCLUDED.user_id,
            roll_no = EXCLUDED.roll_no,
            year = EXCLUDED.year,
            semester = EXCLUDED.semester,
            section = EXCLUDED.section
        `, [row.id, row.user_id, row.roll_no, row.year, row.semester, row.section]);
      }

      // 4. Migrate Subjects
      let subjects = [];
      try { subjects = sqliteDb.prepare('SELECT * FROM subjects').all(); } catch {}
      console.log(`📚 Migrating ${subjects.length} subjects...`);
      for (const row of subjects) {
        await client.query(`
          INSERT INTO subjects (id, code, name, faculty_name, department, year, semester)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (id) DO UPDATE SET
            code = EXCLUDED.code,
            name = EXCLUDED.name,
            faculty_name = EXCLUDED.faculty_name,
            department = EXCLUDED.department,
            year = EXCLUDED.year,
            semester = EXCLUDED.semester
        `, [row.id, row.code, row.name, row.faculty_name, row.department, row.year, row.semester]);
      }

      // 5. Migrate Attendance
      let attendance = [];
      try { attendance = sqliteDb.prepare('SELECT * FROM attendance').all(); } catch {}
      console.log(`📋 Migrating ${attendance.length} attendance records...`);
      for (const row of attendance) {
        await client.query(`
          INSERT INTO attendance (id, student_id, subject_id, date, status, created_at)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (id) DO NOTHING
        `, [row.id, row.student_id, row.subject_id, row.date, row.status, row.created_at || new Date().toISOString()]);
      }

      // 6. Migrate Outpasses
      const outpasses = sqliteDb.prepare('SELECT * FROM outpasses').all();
      console.log(`🎫 Migrating ${outpasses.length} outpasses...`);
      for (const row of outpasses) {
        await client.query(`
          INSERT INTO outpasses (
            id, student_id, user_id, reason, destination, from_date, to_date, from_time, to_time,
            status, teacher_status, teacher_remarks, teacher_action_at,
            hod_status, hod_remarks, hod_action_at,
            principal_status, principal_remarks, principal_action_at,
            exit_time, entry_time, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
          ON CONFLICT (id) DO UPDATE SET
            status = EXCLUDED.status,
            teacher_status = EXCLUDED.teacher_status,
            hod_status = EXCLUDED.hod_status,
            principal_status = EXCLUDED.principal_status,
            exit_time = EXCLUDED.exit_time,
            entry_time = EXCLUDED.entry_time
        `, [
          row.id, row.student_id, row.user_id, row.reason, row.destination, row.from_date, row.to_date, row.from_time, row.to_time,
          row.status, row.teacher_status, row.teacher_remarks, row.teacher_action_at,
          row.hod_status, row.hod_remarks, row.hod_action_at,
          row.principal_status, row.principal_remarks, row.principal_action_at,
          row.exit_time, row.entry_time, row.created_at || new Date().toISOString()
        ]);
      }

      // 7. Migrate Notifications
      const notifications = sqliteDb.prepare('SELECT * FROM notifications').all();
      console.log(`🔔 Migrating ${notifications.length} notifications...`);
      for (const row of notifications) {
        await client.query(`
          INSERT INTO notifications (id, user_id, title, message, type, outpass_id, read, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (id) DO NOTHING
        `, [row.id, row.user_id, row.title, row.message, row.type, row.outpass_id, row.read, row.created_at || new Date().toISOString()]);
      }

      // 8. Migrate Staff Attendance if any
      let staffAtt = [];
      try { staffAtt = sqliteDb.prepare('SELECT * FROM staff_attendance').all(); } catch {}
      if (staffAtt.length > 0) {
        console.log(`👨‍🏫 Migrating ${staffAtt.length} staff attendance records...`);
        for (const row of staffAtt) {
          await client.query(`
            INSERT INTO staff_attendance (id, user_id, date, status, created_at)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (id) DO NOTHING
          `, [row.id, row.user_id, row.date, row.status, row.created_at || new Date().toISOString()]);
        }
      }

      // Sync Auto-Increment Sequences
      console.log('🔄 Synchronizing PostgreSQL auto-increment sequences...');
      const tables = ['users', 'students', 'outpasses', 'notifications', 'subjects', 'attendance', 'authorized_emails', 'staff_attendance'];
      for (const t of tables) {
        await client.query(`
          SELECT setval(pg_get_serial_sequence('${t}', 'id'), COALESCE((SELECT MAX(id) FROM ${t}), 1));
        `);
      }

      await client.query('COMMIT');
      console.log('✅ Migration committed successfully!');

      // Summary verification count
      console.log('\n📊 Migration Verification Summary:');
      for (const t of tables) {
        const pgCountRes = await client.query(`SELECT COUNT(*)::int as cnt FROM ${t}`);
        console.log(`  • Table '${t}': ${pgCountRes.rows[0].cnt} records in PostgreSQL`);
      }

    } catch (err) {
      await client.query('ROLLBACK');
      console.error('❌ Data migration failed:', err.message);
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Fatal migration error:', err);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

migrateData();
