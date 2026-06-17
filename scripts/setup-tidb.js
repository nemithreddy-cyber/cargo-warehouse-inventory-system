const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const config = {
  host: 'gateway01.ap-southeast-1.prod.alicloud.tidbcloud.com',
  port: 4000,
  user: 'eFB3KMf2qdor1dt.root',
  password: 'dZzUtLyDt3dIcTvP',
  ssl: { rejectUnauthorized: true },
  multipleStatements: true,
};

async function setup() {
  console.log('🔌 Connecting to TiDB Cloud...');
  let conn = await mysql.createConnection(config);
  console.log('✅ Connected!');

  // Create database
  console.log('📦 Creating database cargo_warehouse...');
  await conn.execute('CREATE DATABASE IF NOT EXISTS cargo_warehouse CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;');
  await conn.execute('USE cargo_warehouse;');
  console.log('✅ Database created!');

  // Read schema
  const schemaPath = path.join(__dirname, '..', 'backend', 'config', 'schema.sql');
  let schema = fs.readFileSync(schemaPath, 'utf8');
  
  // Remove CREATE DATABASE and USE statements (we already did those)
  schema = schema.replace(/CREATE DATABASE[^;]+;/gi, '');
  schema = schema.replace(/USE [^;]+;/gi, '');
  schema = schema.trim();

  console.log('📋 Running schema...');
  await conn.query(schema);
  console.log('✅ Schema applied!');

  // Read seed
  const seedPath = path.join(__dirname, '..', 'backend', 'config', 'seed.sql');
  let seed = fs.readFileSync(seedPath, 'utf8');
  seed = seed.replace(/CREATE DATABASE[^;]+;/gi, '');
  seed = seed.replace(/USE [^;]+;/gi, '');
  seed = seed.trim();

  console.log('🌱 Running seed data...');
  await conn.query(seed);
  console.log('✅ Seed data loaded!');

  // Verify
  const [users] = await conn.execute('SELECT COUNT(*) as count FROM users;');
  const [cargo] = await conn.execute('SELECT COUNT(*) as count FROM cargo;');
  console.log(`✅ Verification: ${users[0].count} users, ${cargo[0].count} cargo items`);

  await conn.end();
  console.log('🎉 TiDB setup complete!');
}

setup().catch(err => {
  console.error('❌ Setup failed:', err.message);
  process.exit(1);
});
