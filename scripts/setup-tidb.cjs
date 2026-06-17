'use strict';

const mysql = require('mysql2/promise');
const fs    = require('fs');
const path  = require('path');

const DB_CONFIG = {
  host:    'gateway01.ap-southeast-1.prod.alicloud.tidbcloud.com',
  port:    4000,
  user:    'eFB3KMf2qdor1dt.root',
  password:'dZzUtLyDt3dIcTvP',
  ssl:     { rejectUnauthorized: true },
};

// Split SQL into individual statements (handles multi-line ENUMs etc.)
function splitStatements(sql) {
  const stmts = [];
  let current = '';
  let inString = false;
  let stringChar = '';
  let i = 0;

  // Strip -- line comments
  sql = sql.replace(/--[^\n]*/g, '');

  while (i < sql.length) {
    const ch = sql[i];

    if (!inString && (ch === "'" || ch === '"' || ch === '`')) {
      inString = true;
      stringChar = ch;
      current += ch;
    } else if (inString && ch === stringChar && sql[i - 1] !== '\\') {
      inString = false;
      current += ch;
    } else if (!inString && ch === ';') {
      const stmt = current.trim();
      if (stmt.length > 0) stmts.push(stmt);
      current = '';
    } else {
      current += ch;
    }
    i++;
  }
  const last = current.trim();
  if (last.length > 0) stmts.push(last);
  return stmts;
}

async function setup() {
  let conn;

  console.log('🔌 Connecting to TiDB Cloud...');
  conn = await mysql.createConnection(DB_CONFIG);
  console.log('✅ Connected to TiDB!');

  // Create & select database
  await conn.execute('CREATE DATABASE IF NOT EXISTS cargo_warehouse CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
  await conn.execute('USE cargo_warehouse');
  console.log('✅ Database cargo_warehouse selected');

  // Read schema
  const schemaFile = path.join(__dirname, '..', 'backend', 'config', 'schema.sql');
  let schema = fs.readFileSync(schemaFile, 'utf8');
  // Remove DB creation/use lines — we already handled those
  schema = schema.replace(/CREATE DATABASE[^;]+;/gi, '');
  schema = schema.replace(/USE\s+\w+\s*;/gi, '');

  const schemaStmts = splitStatements(schema);
  console.log(`\n📋 Running ${schemaStmts.length} schema statements...`);

  for (let i = 0; i < schemaStmts.length; i++) {
    const stmt = schemaStmts[i];
    try {
      await conn.execute(stmt);
      const name = stmt.match(/TABLE\s+(?:IF NOT EXISTS\s+)?(\w+)/i)?.[1]
                || stmt.match(/INDEX\s+(\w+)/i)?.[1]
                || 'statement';
      console.log(`  ✅ [${i + 1}/${schemaStmts.length}] ${name}`);
    } catch (err) {
      if (err.code === 'ER_TABLE_EXISTS_ERROR' || err.errno === 1050) {
        console.log(`  ⚠️  [${i + 1}] Table already exists, skipping`);
      } else if (err.code === 'ER_DUP_KEYNAME' || err.errno === 1061) {
        console.log(`  ⚠️  [${i + 1}] Index already exists, skipping`);
      } else {
        console.error(`  ❌ [${i + 1}] Failed: ${err.message}`);
        console.error('  Statement:', stmt.substring(0, 120));
        throw err;
      }
    }
  }
  console.log('✅ Schema complete!');

  // Read seed
  const seedFile = path.join(__dirname, '..', 'backend', 'config', 'seed.sql');
  let seed = fs.readFileSync(seedFile, 'utf8');
  seed = seed.replace(/CREATE DATABASE[^;]+;/gi, '');
  seed = seed.replace(/USE\s+\w+\s*;/gi, '');

  const seedStmts = splitStatements(seed);
  console.log(`\n🌱 Running ${seedStmts.length} seed statements...`);

  for (let i = 0; i < seedStmts.length; i++) {
    const stmt = seedStmts[i];
    try {
      await conn.execute(stmt);
      console.log(`  ✅ [${i + 1}/${seedStmts.length}] Seeded`);
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY' || err.errno === 1062) {
        console.log(`  ⚠️  [${i + 1}] Duplicate entry, skipping`);
      } else {
        console.error(`  ❌ [${i + 1}] Failed: ${err.message}`);
        throw err;
      }
    }
  }
  console.log('✅ Seed complete!');

  // Verify
  const [users]  = await conn.execute('SELECT COUNT(*) AS c FROM users');
  const [cargo]  = await conn.execute('SELECT COUNT(*) AS c FROM cargo');
  const [zones]  = await conn.execute('SELECT COUNT(*) AS c FROM warehouse_zones');
  console.log(`\n🎉 Done! users=${users[0].c}, cargo=${cargo[0].c}, zones=${zones[0].c}`);

  await conn.end();
}

setup().catch(err => {
  console.error('\n❌ Setup failed:', err.message);
  process.exit(1);
});
