'use strict';

const mysql = require('mysql2/promise');

const DB_CONFIG = {
  host:    'gateway01.ap-southeast-1.prod.alicloud.tidbcloud.com',
  port:    4000,
  user:    'eFB3KMf2qdor1dt.root',
  password:'dZzUtLyDt3dIcTvP',
  database:'cargo_warehouse',
  ssl:     { rejectUnauthorized: true },
};

async function migrate() {
  console.log('🔌 Connecting to TiDB Cloud for migration...');
  const conn = await mysql.createConnection(DB_CONFIG);
  console.log('✅ Connected!');

  // Check if username column already exists
  const [columns] = await conn.execute("SHOW COLUMNS FROM users LIKE 'username'");
  if (columns.length > 0) {
    console.log('ℹ️ Column "username" already exists in "users" table.');
  } else {
    console.log('Adding "username" column...');
    await conn.execute("ALTER TABLE users ADD COLUMN username VARCHAR(100) NULL");
    console.log('✅ Column added successfully!');

    // Backfill username values based on email
    console.log('Backfilling usernames...');
    const [users] = await conn.execute("SELECT id, email FROM users");
    for (const user of users) {
      const parts = user.email.split('@');
      const baseUsername = parts[0];
      await conn.execute("UPDATE users SET username = ? WHERE id = ?", [baseUsername, user.id]);
      console.log(`  Set username for ${user.email} to: ${baseUsername}`);
    }

    // Alter column to be NOT NULL
    console.log('Setting username column to NOT NULL...');
    await conn.execute("ALTER TABLE users MODIFY COLUMN username VARCHAR(100) NOT NULL");

    // Add UNIQUE constraint
    console.log('Adding UNIQUE constraint to username...');
    await conn.execute("ALTER TABLE users ADD UNIQUE INDEX idx_users_username (username)");
    console.log('✅ Migration complete!');
  }

  await conn.end();
}

migrate().catch(err => {
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
});
