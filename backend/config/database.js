'use strict';

const path = require('path');
const fs = require('fs');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

let dbClient = 'sqlite';
let mysqlPool = null;

// ─── sql.js (Vercel/serverless) vs sqlite3 (local) ─────────────────────────
// sql.js is pure WebAssembly — no native binaries, works on any platform.
// sqlite3 uses native binaries compiled for the host OS — fine locally,
// but fails on Vercel (Amazon Linux needs GLIBC_2.38 which isn't available).

let sqliteDb = null; // sqlite3 Database instance (local)
let sqlJs = null;    // sql.js Database instance (Vercel)
let usesSqlJs = false;

const dbPath = process.env.VERCEL
  ? '/tmp/cargo_inventory.db'
  : path.join(__dirname, '..', 'database', 'cargo_inventory.db');

// Ensure local database folder exists
if (!process.env.VERCEL) {
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    try { fs.mkdirSync(dbDir, { recursive: true }); } catch (_) {}
  }
}

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
  let schemaSql, seedSql;
  try {
    schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    seedSql   = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');
  } catch (_) {
    const dbInitData = require('./dbInitData');
    schemaSql = dbInitData.SCHEMA_SQL;
    seedSql   = dbInitData.SEED_SQL;
  }
  return { schemaSql, seedSql };
}

// ─── sql.js initializer (Vercel) ────────────────────────────────────────────
const initSqlJs = async () => {
  const initSqlJsLib = require('sql.js');
  const SQL = await initSqlJsLib();

  // Try to load existing DB from /tmp
  let db;
  if (fs.existsSync(dbPath) && fs.statSync(dbPath).size > 0) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
    console.log('✅ sql.js: Loaded existing DB from', dbPath);
  } else {
    db = new SQL.Database();
    console.log('✅ sql.js: Created new in-memory DB');

    const { schemaSql, seedSql } = getSqlContent();
    db.run(translateSql(schemaSql));
    db.run(translateSql(seedSql));
    console.log('✅ sql.js: Schema + seed applied');

    // Persist to /tmp so subsequent warm invocations reuse it
    try {
      const data = db.export();
      fs.writeFileSync(dbPath, Buffer.from(data));
      console.log('✅ sql.js: DB persisted to', dbPath);
    } catch (e) {
      console.warn('⚠️ sql.js: Could not persist DB:', e.message);
    }
  }

  sqlJs = db;
  usesSqlJs = true;
};

// ─── sqlite3 initializer (local) ────────────────────────────────────────────
const initSqlite3 = () => {
  return new Promise((resolve, reject) => {
    const sqlite3 = require('sqlite3').verbose();
    const isNew = !fs.existsSync(dbPath) || fs.statSync(dbPath).size === 0;

    sqliteDb = new sqlite3.Database(dbPath, (err) => {
      if (err) return reject(err);
      console.log('✅ sqlite3: Connected at', dbPath);

      if (!isNew) return resolve();

      const { schemaSql, seedSql } = getSqlContent();
      sqliteDb.serialize(() => {
        sqliteDb.exec(translateSql(schemaSql), (e1) => {
          if (e1) return reject(e1);
          sqliteDb.exec(translateSql(seedSql), (e2) => {
            if (e2) return reject(e2);
            console.log('✅ sqlite3: Schema + seed applied');
            resolve();
          });
        });
      });
    });
  });
};

// ─── Query helpers ──────────────────────────────────────────────────────────

// Run a query on sql.js and return [rows] or [{insertId, affectedRows}]
function runSqlJs(sql, params = []) {
  const isSelect = /^\s*(select|show|describe|pragma)/i.test(sql.trim());

  if (isSelect) {
    const stmt = sqlJs.prepare(sql);
    stmt.bind(params);
    const rows = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();
    return [rows];
  } else {
    sqlJs.run(sql, params);
    const insertId = sqlJs.exec('SELECT last_insert_rowid()')[0]?.values[0][0] || 0;
    const changes  = sqlJs.exec('SELECT changes()')[0]?.values[0][0] || 0;

    // Persist after writes so data survives across warm invocations
    try {
      const data = sqlJs.export();
      fs.writeFileSync(dbPath, Buffer.from(data));
    } catch (_) {}

    return [{ insertId, affectedRows: changes }];
  }
}

// ─── Promise that resolves when DB is ready ──────────────────────────────────
let dbReadyPromise = null;

const initializeDb = async () => {
  if (process.env.DB_CLIENT === 'mysql' && !process.env.VERCEL) {
    try {
      const mysql = require('mysql2/promise');
      mysqlPool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'cargo_warehouse',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        timezone: '+00:00',
      });
      const conn = await mysqlPool.getConnection();
      console.log('✅ MySQL connected');
      conn.release();
      dbClient = 'mysql';
      return;
    } catch (err) {
      console.warn('⚠️ MySQL failed, falling back to SQLite:', err.message);
    }
  }

  dbClient = 'sqlite';

  if (process.env.VERCEL) {
    await initSqlJs();
  } else {
    await initSqlite3();
  }
};

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

// Start init immediately (non-blocking)
dbReadyPromise = initializeDb().catch((err) => {
  console.error('❌ DB init failed:', err.message);
  dbReadyPromise = null;
});

// ─── Exported query function ─────────────────────────────────────────────────
const query = async (sql, params = []) => {
  await ensureDbReady();

  if (dbClient === 'mysql') {
    return mysqlPool.query(sql, params);
  }

  const translatedSql = translateSql(sql);

  if (usesSqlJs) {
    return runSqlJs(translatedSql, params);
  }

  // sqlite3 (local)
  return new Promise((resolve, reject) => {
    const isSelect = /^\s*(select|show|describe|pragma)/i.test(translatedSql.trim());
    if (isSelect) {
      sqliteDb.all(translatedSql, params, (err, rows) => {
        if (err) return reject(err);
        resolve([rows]);
      });
    } else {
      sqliteDb.run(translatedSql, params, function (err) {
        if (err) return reject(err);
        resolve([{ insertId: this.lastID, affectedRows: this.changes }]);
      });
    }
  });
};

module.exports = { query, getClientType: () => dbClient, ensureDbReady };
