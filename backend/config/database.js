'use strict';

const path = require('path');
const fs   = require('fs');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// ─── @libsql/client: pure-JS SQLite, works on Vercel Lambda (no native binaries)
// On Vercel: file:/tmp/cargo_inventory.db (writable ephemeral storage)
// Locally  : file:backend/database/cargo_inventory.db
// Turso    : set TURSO_DATABASE_URL + TURSO_AUTH_TOKEN env vars

let db = null;           // libsql client
let mysqlPool = null;
let dbClient  = 'sqlite';

const dbPath = process.env.VERCEL
  ? '/tmp/cargo_inventory.db'
  : path.join(__dirname, '..', 'database', 'cargo_inventory.db');

// Ensure local dir exists
if (!process.env.VERCEL) {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) try { fs.mkdirSync(dir, { recursive: true }); } catch (_) {}
}

// ─── SQL translation (MySQL → SQLite dialect) ────────────────────────────────
function translateSql(sql) {
  let t = sql;
  t = t.replace(/CREATE DATABASE IF NOT EXISTS \w+[^;]*;/gi, '');
  t = t.replace(/USE \w+;/gi, '');
  t = t.replace(/SUBSTRING\(/gi, 'SUBSTR(');
  t = t.replace(/GREATEST\(/gi, 'MAX(');
  t = t.replace(/AS UNSIGNED/gi, 'AS INTEGER');
  t = t.replace(/INT UNSIGNED AUTO_INCREMENT PRIMARY KEY/gi, 'INTEGER PRIMARY KEY AUTOINCREMENT');
  t = t.replace(/INT UNSIGNED/gi, 'INTEGER');
  t = t.replace(/DECIMAL\(\d+,\s*\d+\)/gi, 'REAL');
  t = t.replace(/TINYINT\(\d+\)/gi, 'INTEGER');
  t = t.replace(/ENUM\([^)]+\)/gi, 'TEXT');
  t = t.replace(/ON UPDATE CURRENT_TIMESTAMP/gi, '');
  t = t.replace(/TIMESTAMP/gi, 'DATETIME');
  t = t.replace(/ENGINE\s*=\s*InnoDB/gi, '');
  t = t.replace(/CHARACTER SET \w+/gi, '');
  t = t.replace(/COLLATE \w+/gi, '');
  t = t.replace(/DEFAULT CHARACTER SET \w+/gi, '');
  t = t.replace(/DEFAULT COLLATE \w+/gi, '');
  t = t.replace(/COMMENT\s*'[^']+'/gi, '');
  t = t.replace(/INSERT IGNORE INTO/gi, 'INSERT OR IGNORE INTO');
  return t;
}

function getSqlContent() {
  try {
    return {
      schemaSql: fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'),
      seedSql:   fs.readFileSync(path.join(__dirname, 'seed.sql'),   'utf8'),
    };
  } catch (_) {
    const { SCHEMA_SQL, SEED_SQL } = require('./dbInitData');
    return { schemaSql: SCHEMA_SQL, seedSql: SEED_SQL };
  }
}

// ─── Split multi-statement SQL into individual statements ────────────────────
function splitStatements(sql) {
  return sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
}

// ─── libsql initializer ──────────────────────────────────────────────────────
async function initLibSql() {
  const { createClient } = require('@libsql/client');

  // Turso cloud DB if env vars present, otherwise local file
  const url = process.env.TURSO_DATABASE_URL
    ? process.env.TURSO_DATABASE_URL
    : `file:${dbPath}`;

  const config = { url };
  if (process.env.TURSO_AUTH_TOKEN) {
    config.authToken = process.env.TURSO_AUTH_TOKEN;
  }

  db = createClient(config);
  console.log('✅ libsql client created:', url);

  // Check if schema already applied
  try {
    await db.execute('SELECT 1 FROM users LIMIT 1');
    console.log('✅ libsql: existing schema detected, skipping init');
    return;
  } catch (_) {
    // Table doesn't exist yet — apply schema + seed
  }

  console.log('ℹ️ libsql: applying schema and seed...');
  const { schemaSql, seedSql } = getSqlContent();

  for (const stmt of splitStatements(translateSql(schemaSql))) {
    await db.execute(stmt);
  }
  console.log('✅ libsql: schema applied');

  for (const stmt of splitStatements(translateSql(seedSql))) {
    await db.execute(stmt);
  }
  console.log('✅ libsql: seed applied');
}

// ─── sqlite3 initializer (local fallback when @libsql/client not preferred) ──
function initSqlite3() {
  return new Promise((resolve, reject) => {
    const sqlite3 = require('sqlite3').verbose();
    const isNew   = !fs.existsSync(dbPath) || fs.statSync(dbPath).size === 0;
    const native  = new sqlite3.Database(dbPath, (err) => {
      if (err) return reject(err);
      console.log('✅ sqlite3 connected:', dbPath);
      if (!isNew) return resolve(native);

      const { schemaSql, seedSql } = getSqlContent();
      native.serialize(() => {
        native.exec(translateSql(schemaSql), (e) => {
          if (e) return reject(e);
          native.exec(translateSql(seedSql), (e2) => {
            if (e2) return reject(e2);
            resolve(native);
          });
        });
      });
    });
  });
}

// ─── DB initialization ───────────────────────────────────────────────────────
let dbReadyPromise = null;

async function initializeDb() {
  // MySQL (explicit config, non-Vercel)
  if (process.env.DB_CLIENT === 'mysql' && !process.env.VERCEL) {
    try {
      const mysql = require('mysql2/promise');
      mysqlPool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'cargo_warehouse',
        waitForConnections: true, connectionLimit: 10, queueLimit: 0, timezone: '+00:00',
      });
      const c = await mysqlPool.getConnection();
      console.log('✅ MySQL connected');
      c.release();
      dbClient = 'mysql';
      return;
    } catch (err) {
      console.warn('⚠️ MySQL failed, falling back to libsql:', err.message);
    }
  }

  dbClient = 'sqlite';
  await initLibSql();
}

const ensureDbReady = () => {
  if (!dbReadyPromise) {
    dbReadyPromise = initializeDb().catch((err) => {
      console.error('❌ DB init failed:', err.message);
      dbReadyPromise = null;
      throw err;
    });
  }
  return dbReadyPromise;
};

// Kick off initialization immediately
dbReadyPromise = initializeDb().catch((err) => {
  console.error('❌ DB init failed:', err.message);
  console.error('❌ DB init stack:', err.stack);
  dbReadyPromise = null;
});

// ─── Exported query function ─────────────────────────────────────────────────
const query = async (sql, params = []) => {
  await ensureDbReady();

  if (dbClient === 'mysql') {
    return mysqlPool.query(sql, params);
  }

  // libsql
  const translated = translateSql(sql);

  // Convert positional ? params to named :p1, :p2, ... that libsql expects
  let i = 0;
  const namedSql    = translated.replace(/\?/g, () => `:p${++i}`);
  const namedParams = {};
  params.forEach((v, idx) => { namedParams[`p${idx + 1}`] = v; });

  const result = await db.execute({ sql: namedSql, args: namedParams });

  const isSelect = /^\s*(select|show|describe|pragma)/i.test(translated.trim());
  if (isSelect) {
    // Convert libsql ResultSet rows to plain objects
    const rows = result.rows.map(row => {
      const obj = {};
      result.columns.forEach((col, ci) => { obj[col] = row[ci]; });
      return obj;
    });
    return [rows];
  } else {
    return [{ insertId: Number(result.lastInsertRowid ?? 0), affectedRows: result.rowsAffected ?? 0 }];
  }
};

module.exports = { query, getClientType: () => dbClient, ensureDbReady };
