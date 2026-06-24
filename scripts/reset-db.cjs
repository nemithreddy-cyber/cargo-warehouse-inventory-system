'use strict';

const path = require('path');
const fs = require('fs');
const db = require('../backend/config/db');

function splitStatements(sql) {
  let clean = sql.replace(/\/\*[\s\S]*?\*\//g, '');
  clean = clean.split('\n')
    .map(line => {
      const idx = line.indexOf('--');
      return idx >= 0 ? line.substring(0, idx) : line;
    })
    .join('\n');
    
  return clean
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('USE'));
}

async function main() {
  console.log('🔄 Starting database reset and re-seed...');
  
  await db.ensureDbReady();
  const isMysql = db.getClientType() === 'mysql';
  if (isMysql) {
    await db.query('SET FOREIGN_KEY_CHECKS = 0');
  } else {
    await db.query('PRAGMA foreign_keys = OFF');
  }

  const tables = [
    'route_options',
    'customs_checklists',
    'claims',
    'complaints',
    'payments',
    'invoices',
    'airway_bills',
    'quotations',
    'dispatch_records',
    'cargo',
    'storage_locations',
    'warehouse_zones',
    'users'
  ];

  for (const table of tables) {
    try {
      console.log(`Clearing table: ${table}`);
      await db.query(`DELETE FROM ${table}`);
    } catch (err) {
      console.warn(`Warning clearing table ${table}:`, err.message);
    }
  }

  // Enable foreign key checks back
  if (isMysql) {
    await db.query('SET FOREIGN_KEY_CHECKS = 1');
  } else {
    await db.query('PRAGMA foreign_keys = ON');
  }

  // Load and apply seed.sql
  const seedPath = path.join(__dirname, '..', 'backend', 'config', 'seed.sql');
  const seedSql = fs.readFileSync(seedPath, 'utf8');
  const statements = splitStatements(seedSql);

  console.log(`Applying ${statements.length} seed statements...`);
  for (const stmt of statements) {
    try {
      await db.query(stmt);
    } catch (err) {
      console.error(`Error executing statement:`, stmt);
      console.error(err.message);
    }
  }

  console.log('✅ Database reset and re-seed completed successfully!');
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Reset failed:', err);
  process.exit(1);
});
