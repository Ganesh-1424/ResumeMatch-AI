const { pool, testConnection } = require('./config/db');
const bcrypt = require('bcryptjs');

async function inspect() {
  const status = await testConnection();
  console.log('=== DB CONNECTION ===');
  console.log('Connected:', status.connected);
  console.log('Database:', status.database);
  console.log('Host:', status.host);

  const conn = await pool.getConnection();
  try {
    console.log('\n=== USERS TABLE STRUCTURE ===');
    const [cols] = await conn.execute('DESCRIBE users');
    cols.forEach(c => console.log(`${c.Field} (${c.Type}) - Null: ${c.Null}, Key: ${c.Key}, Default: ${c.Default}`));

    console.log('\n=== USERS TABLE INDEXES ===');
    const [indexes] = await conn.execute('SHOW INDEX FROM users');
    indexes.forEach(i => console.log(`Index: ${i.Key_name}, Column: ${i.Column_name}, Non_unique: ${i.Non_unique}`));

    console.log('\n=== USER RECORDS FOR kaganesh04@gmail.com ===');
    const [users] = await conn.execute(
      'SELECT id, name, email, auth_provider, google_id, LENGTH(password_hash) as pw_hash_len, LENGTH(previous_password_hash) as prev_pw_hash_len, created_at, updated_at FROM users WHERE LOWER(TRIM(email)) = ?',
      ['kaganesh04@gmail.com']
    );
    console.log('Matching user records count:', users.length);
    users.forEach(u => console.log(JSON.stringify(u, null, 2)));

    console.log('\n=== CHECK DUPLICATE EMAILS IN USERS ===');
    const [dupes] = await conn.execute(
      'SELECT LOWER(TRIM(email)) as norm_email, COUNT(*) as cnt FROM users GROUP BY norm_email HAVING cnt > 1'
    );
    console.log('Duplicate emails:', dupes);

    console.log('\n=== RESUME ANALYSES FOR USER ID 1 ===');
    const [analyses] = await conn.execute(
      'SELECT id, user_id, resume_filename, match_score, ats_score, created_at FROM resume_analyses WHERE user_id = 1'
    );
    console.log(`Found ${analyses.length} resume analyses for user 1:`);
    analyses.forEach(a => console.log(`- ID: ${a.id}, File: ${a.resume_filename}, Score: ${a.match_score}, ATS: ${a.ats_score}`));

    console.log('\n=== SAVED RESUMES (BUILDER) FOR USER ID 1 ===');
    const [saved] = await conn.execute(
      'SELECT id, user_id, title, updated_at FROM saved_resumes WHERE user_id = 1'
    );
    console.log(`Found ${saved.length} saved builder resumes for user 1:`);
    saved.forEach(s => console.log(`- ID: ${s.id}, Title: ${s.title}`));

    // Test bcrypt compare against candidate passwords WITHOUT printing hashes or passwords
    const [userWithHash] = await conn.execute(
      'SELECT id, password_hash, previous_password_hash FROM users WHERE id = 1'
    );
    if (userWithHash.length > 0) {
      const u = userWithHash[0];
      const testPasswords = [
        'Ganesh@123',
        'OriginalPassword123!',
        'NewSecurePassword2026!',
        'Password123!'
      ];
      console.log('\n=== PASSWORD HASH COMPATIBILITY CHECK ===');
      for (const p of testPasswords) {
        const matchesCurrent = u.password_hash ? await bcrypt.compare(p, u.password_hash) : false;
        const matchesPrev = u.previous_password_hash ? await bcrypt.compare(p, u.previous_password_hash) : false;
        console.log(`Password [${p === 'Ganesh@123' ? 'User typed (Ganesh@123)' : p}]: Matches current hash? ${matchesCurrent} | Matches prev hash? ${matchesPrev}`);
      }
    }
  } finally {
    conn.release();
    process.exit(0);
  }
}

inspect().catch(err => {
  console.error(err);
  process.exit(1);
});
