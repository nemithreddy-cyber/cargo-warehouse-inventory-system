'use strict';

const path = require('path');
const fs = require('fs');

// Only try to load mysql2 if needed
let mysql = null;

// sqlite3 loaded lazily
let sqlite3Module = null;

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

let dbClient = 'sqlite'; // Default to sqlite for Vercel
let mysqlPool = null;
let sqliteDb = null;

const dbPath = process.env.VERCEL
  ? '/tmp/cargo_inventory.db'
  : path.join(__dirname, '..', 'database', 'cargo_inventory.db');

// Ensure database folder exists (not needed for /tmp but safe locally)
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  try { fs.mkdirSync(dbDir, { recursive: true }); } catch (_) {}
}

function translateSql(sql) {
  let translated = sql;

  // Strip MySQL database creation statements
  translated = translated.replace(/CREATE DATABASE IF NOT EXISTS \w+[^;]*;/gi, '');
  translated = translated.replace(/USE \w+;/gi, '');

  // Translate functions
  translated = translated.replace(/SUBSTRING\(/gi, 'SUBSTR(');
  translated = translated.replace(/GREATEST\(/gi, 'MAX(');
  translated = translated.replace(/AS UNSIGNED/gi, 'AS INTEGER');

  // Translate schema DDL
  translated = translated.replace(/INT UNSIGNED AUTO_INCREMENT PRIMARY KEY/gi, 'INTEGER PRIMARY KEY AUTOINCREMENT');
  translated = translated.replace(/INT UNSIGNED/gi, 'INTEGER');
  translated = translated.replace(/DECIMAL\(\d+,\s*\d+\)/gi, 'REAL');
  translated = translated.replace(/TINYINT\(\d+\)/gi, 'INTEGER');
  translated = translated.replace(/ENUM\([^)]+\)/gi, 'TEXT');
  translated = translated.replace(/ON UPDATE CURRENT_TIMESTAMP/gi, '');
  translated = translated.replace(/TIMESTAMP/gi, 'DATETIME');
  translated = translated.replace(/ENGINE\s*=\s*InnoDB/gi, '');
  translated = translated.replace(/CHARACTER SET \w+/gi, '');
  translated = translated.replace(/COLLATE \w+/gi, '');
  translated = translated.replace(/DEFAULT CHARACTER SET \w+/gi, '');
  translated = translated.replace(/DEFAULT COLLATE \w+/gi, '');
  translated = translated.replace(/COMMENT\s*'[^']+'/gi, '');
  translated = translated.replace(/INSERT IGNORE INTO/gi, 'INSERT OR IGNORE INTO');

  return translated;
}

const initializeSqlite = () => {
  return new Promise((resolve, reject) => {
    if (!sqlite3Module) {
      sqlite3Module = require('sqlite3').verbose();
    }

    const isNew = !fs.existsSync(dbPath) || fs.statSync(dbPath).size === 0;

    sqliteDb = new sqlite3Module.Database(dbPath, (err) => {
      if (err) {
        console.error('❌ Failed to open SQLite database:', err.message);
        return reject(err);
      }

      console.log('✅ SQLite database connected at:', dbPath);

      if (isNew) {
        console.log('ℹ️ New database. Initializing schema and seed data...');

        let schemaSql, seedSql;
        try {
          // Try local file first
          schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
          seedSql = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');
          console.log('✅ Loaded schema/seed from SQL files');
        } catch (_) {
          console.log('ℹ️ Using bundled dbInitData.js for schema/seed');
          const dbInitData = require('./dbInitData');
          schemaSql = dbInitData.SCHEMA_SQL;
          seedSql = dbInitData.SEED_SQL;
        }

        const translatedSchema = translateSql(schemaSql);
        const translatedSeed = translateSql(seedSql);

        sqliteDb.serialize(() => {
          sqliteDb.exec(translatedSchema, (schemaErr) => {
            if (schemaErr) {
              console.error('❌ Schema init failed:', schemaErr.message);
              return reject(schemaErr);
            }
            console.log('✅ Schema initialized');

            sqliteDb.exec(translatedSeed, (seedErr) => {
              if (seedErr) {
                console.error('❌ Seed failed:', seedErr.message);
                return reject(seedErr);
              }
              console.log('✅ Seed data loaded');
              resolve();
            });
          });
        });
      } else {
        console.log('✅ Existing database found. Skipping initialization.');
        resolve();
      }
    });
  });
};

// Promise that resolves when DB is ready
let dbReadyPromise = null;

const ensureDbReady = () => {
  if (!dbReadyPromise) {
    dbReadyPromise = initializeDb();
  }
  return dbReadyPromise;
};

const initializeDb = async () => {
  // Force SQLite on Vercel or when DB_CLIENT=sqlite
  if (process.env.VERCEL || process.env.DB_CLIENT === 'sqlite') {
    dbClient = 'sqlite';
    await initializeSqlite();
    return;
  }

  try {
    if (!mysql) mysql = require('mysql2/promise');
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

    const connection = await mysqlPool.getConnection();
    console.log('✅ MySQL connected successfully');
    connection.release();
    dbClient = 'mysql';
  } catch (err) {
    console.warn('⚠️ MySQL failed:', err.message, '— falling back to SQLite');
    dbClient = 'sqlite';
    await initializeSqlite();
  }
};

const query = async (sql, params = []) => {
  await ensureDbReady();

  if (dbClient === 'mysql') {
    return mysqlPool.query(sql, params);
  }

  return new Promise((resolve, reject) => {
    const translatedSql = translateSql(sql);
    const isSelect = /^\s*(select|show|describe|pragma)/i.test(translatedSql);

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

// Start initialization immediately (non-blocking)
dbReadyPromise = initializeDb().catch((err) => {
  console.error('❌ Database initialization failed:', err.message);
  // Reset so next query attempt retries
  dbReadyPromise = null;
});

module.exports = {
  query,
  getClientType: () => dbClient,
  ensureDbReady,
};
