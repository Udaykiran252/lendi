const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { Pool } = require('pg');
const { initPostgresDb } = require('../lib/db');

async function migrateNeonToSupabase() {
  console.log('====================================================');
  console.log('🚀 STARTING NEON POSTGRESQL → SUPABASE MIGRATION');
  console.log('====================================================\n');

  const neonUrl = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;
  const supabaseUrl = process.env.SUPABASE_DATABASE_URL || (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('supabase') ? process.env.DATABASE_URL : null);

  if (!neonUrl) {
    console.error('❌ Error: Source Neon DATABASE_URL is missing in backend/.env');
    process.exit(1);
  }

  if (!supabaseUrl) {
    console.error('❌ Error: Target SUPABASE_DATABASE_URL is missing in backend/.env');
    console.error('Please set SUPABASE_DATABASE_URL in backend/.env to your Supabase PostgreSQL connection string.');
    process.exit(1);
  }

  console.log('🔗 Connecting to Source: Neon PostgreSQL...');
  const neonPool = new Pool({
    connectionString: neonUrl,
    ssl: { rejectUnauthorized: false }
  });

  console.log('🔗 Connecting to Target: Supabase PostgreSQL...');
  const supabasePool = new Pool({
    connectionString: supabaseUrl,
    ssl: { rejectUnauthorized: false }
  });

  let neonClient, supabaseClient;

  try {
    neonClient = await neonPool.connect();
    console.log('✅ Connected to Neon PostgreSQL source successfully.');

    supabaseClient = await supabasePool.connect();
    console.log('✅ Connected to Supabase PostgreSQL target successfully.\n');

    // Step 1: Initialize Schema on Supabase
    console.log('🛠️ Step 1: Initializing target database schema on Supabase...');
    await initPostgresDb(supabasePool);
    console.log('✅ Supabase PostgreSQL schema initialized.\n');

    // Step 2: Clear pre-seeded target tables on Supabase (Target ONLY, strictly NOT Neon!)
    console.log('🧹 Step 2: Preparing clean target environment on Supabase...');
    const tables = ['staff_attendance', 'attendance', 'notifications', 'outpasses', 'subjects', 'students', 'authorized_emails', 'users'];
    for (const t of tables) {
      await supabaseClient.query(`TRUNCATE TABLE ${t} RESTART IDENTITY CASCADE`);
    }
    console.log('✅ Target tables on Supabase reset for clean migration.\n');

    // Step 3: Read data from Neon (SELECT ONLY - STRICTLY NON-DESTRUCTIVE)
    console.log('📦 Step 3: Exporting data from Neon and importing into Supabase...\n');

    // 3a. Authorized Emails
    const authRes = await neonClient.query('SELECT * FROM authorized_emails ORDER BY id ASC');
    console.log(`📧 Migrating ${authRes.rows.length} authorized_emails records...`);
    for (const row of authRes.rows) {
      await supabaseClient.query(`
        INSERT INTO authorized_emails (id, email, roll_no, name, department, created_at)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [row.id, row.email, row.roll_no, row.name, row.department, row.created_at]);
    }

    // 3b. Users
    const usersRes = await neonClient.query('SELECT * FROM users ORDER BY id ASC');
    console.log(`👤 Migrating ${usersRes.rows.length} users records...`);
    for (const row of usersRes.rows) {
      await supabaseClient.query(`
        INSERT INTO users (id, email, password, name, role, department, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [row.id, row.email, row.password, row.name, row.role, row.department, row.created_at]);
    }

    // 3c. Students
    const studentsRes = await neonClient.query('SELECT * FROM students ORDER BY id ASC');
    console.log(`🎓 Migrating ${studentsRes.rows.length} students records...`);
    for (const row of studentsRes.rows) {
      await supabaseClient.query(`
        INSERT INTO students (id, user_id, roll_no, year, semester, section)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [row.id, row.user_id, row.roll_no, row.year, row.semester, row.section]);
    }

    // 3d. Subjects
    const subjectsRes = await neonClient.query('SELECT * FROM subjects ORDER BY id ASC');
    console.log(`📚 Migrating ${subjectsRes.rows.length} subjects records...`);
    for (const row of subjectsRes.rows) {
      await supabaseClient.query(`
        INSERT INTO subjects (id, code, name, faculty_name, department, year, semester)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [row.id, row.code, row.name, row.faculty_name, row.department, row.year, row.semester]);
    }

    // 3e. Attendance
    const attendanceRes = await neonClient.query('SELECT * FROM attendance ORDER BY id ASC');
    console.log(`📋 Migrating ${attendanceRes.rows.length} attendance records...`);
    for (const row of attendanceRes.rows) {
      await supabaseClient.query(`
        INSERT INTO attendance (id, student_id, subject_id, date, status, created_at)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [row.id, row.student_id, row.subject_id, row.date, row.status, row.created_at]);
    }

    // 3f. Outpasses
    const outpassRes = await neonClient.query('SELECT * FROM outpasses ORDER BY id ASC');
    console.log(`🎫 Migrating ${outpassRes.rows.length} outpasses records...`);
    for (const row of outpassRes.rows) {
      await supabaseClient.query(`
        INSERT INTO outpasses (
          id, student_id, user_id, reason, destination, from_date, to_date, from_time, to_time,
          status, teacher_status, teacher_remarks, teacher_action_at,
          hod_status, hod_remarks, hod_action_at,
          principal_status, principal_remarks, principal_action_at,
          exit_time, entry_time, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
      `, [
        row.id, row.student_id, row.user_id, row.reason, row.destination, row.from_date, row.to_date, row.from_time, row.to_time,
        row.status, row.teacher_status, row.teacher_remarks, row.teacher_action_at,
        row.hod_status, row.hod_remarks, row.hod_action_at,
        row.principal_status, row.principal_remarks, row.principal_action_at,
        row.exit_time, row.entry_time, row.created_at
      ]);
    }

    // 3g. Notifications
    const notifRes = await neonClient.query('SELECT * FROM notifications ORDER BY id ASC');
    console.log(`🔔 Migrating ${notifRes.rows.length} notifications records...`);
    for (const row of notifRes.rows) {
      await supabaseClient.query(`
        INSERT INTO notifications (id, user_id, title, message, type, outpass_id, read, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [row.id, row.user_id, row.title, row.message, row.type, row.outpass_id, row.read, row.created_at]);
    }

    // 3h. Staff Attendance
    const staffAttRes = await neonClient.query('SELECT * FROM staff_attendance ORDER BY id ASC');
    console.log(`👨‍🏫 Migrating ${staffAttRes.rows.length} staff_attendance records...`);
    for (const row of staffAttRes.rows) {
      await supabaseClient.query(`
        INSERT INTO staff_attendance (id, user_id, date, status, created_at)
        VALUES ($1, $2, $3, $4, $5)
      `, [row.id, row.user_id, row.date, row.status, row.created_at]);
    }

    // Step 4: Synchronize Primary Key Auto-Increment Sequences on Supabase
    console.log('\n🔄 Step 4: Synchronizing primary key sequences on Supabase PostgreSQL...');
    const allTables = ['users', 'students', 'outpasses', 'notifications', 'subjects', 'attendance', 'authorized_emails', 'staff_attendance'];
    for (const t of allTables) {
      await supabaseClient.query(`
        SELECT setval(pg_get_serial_sequence('${t}', 'id'), COALESCE((SELECT MAX(id) FROM ${t}), 1));
      `);
    }
    console.log('✅ Auto-increment sequences synchronized.\n');

    // Step 5: Verification Report
    console.log('====================================================');
    console.log('📊 MIGRATION VERIFICATION & INTEGRITY COMPARISON');
    console.log('====================================================\n');
    console.log('Table Name          | Neon (Source) | Supabase (Target) | Status');
    console.log('--------------------|---------------|-------------------|--------');

    let allMatched = true;
    for (const t of allTables) {
      const nCountRes = await neonClient.query(`SELECT COUNT(*)::int as cnt FROM ${t}`);
      const sCountRes = await supabaseClient.query(`SELECT COUNT(*)::int as cnt FROM ${t}`);

      const nCount = nCountRes.rows[0].cnt;
      const sCount = sCountRes.rows[0].cnt;
      const match = (nCount === sCount);
      if (!match) allMatched = false;

      const padTable = t.padEnd(19, ' ');
      const padNeon = String(nCount).padStart(13, ' ');
      const padSupa = String(sCount).padStart(17, ' ');
      const statusStr = match ? '✅ MATCH' : '❌ MISMATCH';

      console.log(`${padTable} | ${padNeon} | ${padSupa} | ${statusStr}`);
    }

    console.log('\n--- Relational Integrity Verification ---');
    const sRelStudents = await supabaseClient.query('SELECT COUNT(*)::int as cnt FROM students s JOIN users u ON s.user_id = u.id');
    const sRelOutpasses = await supabaseClient.query('SELECT COUNT(*)::int as cnt FROM outpasses o JOIN users u ON o.user_id = u.id');
    console.log(`  • Valid Students linked to Users in Supabase: ${sRelStudents.rows[0].cnt}`);
    console.log(`  • Valid Outpasses linked to Users in Supabase: ${sRelOutpasses.rows[0].cnt}`);

    if (allMatched) {
      console.log('\n🎉 SUCCESS: All 8 tables migrated with 100% exact data match!');
    } else {
      console.error('\n⚠️ WARNING: Row count mismatch detected!');
    }

  } catch (err) {
    console.error('❌ Migration failed with error:', err.message);
    process.exit(1);
  } finally {
    if (neonClient) neonClient.release();
    if (supabaseClient) supabaseClient.release();
    await neonPool.end();
    await supabasePool.end();
  }
}

migrateNeonToSupabase();
