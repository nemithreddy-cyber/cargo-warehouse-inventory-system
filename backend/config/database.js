const mysql = require('mysql2/promise');
const sqlite3 = require('sqlite3');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

let dbClient = 'mysql';
let mysqlPool = null;
let sqliteDb = null;

const dbPath = process.env.VERCEL
  ? '/tmp/cargo_inventory.db'
  : path.join(__dirname, '..', 'database', 'cargo_inventory.db');

// Ensure database folder exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
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
  
  // Translate schema DDL if running schema.sql
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
    const isNew = !fs.existsSync(dbPath) || fs.statSync(dbPath).size === 0;
    
    sqliteDb = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('❌ Failed to open SQLite database:', err.message);
        return reject(err);
      }
      
      console.log('✅ SQLite database connected successfully');
      
      if (isNew) {
        console.log('ℹ️ SQLite database is empty. Initializing schema and seed data...');
        try {
          let schemaSql, seedSql;
          try {
            schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
            seedSql = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');
          } catch (fileReadErr) {
            console.log('ℹ️ File read failed, using serverless fallback dbInitData.js');
            const dbInitData = require('./dbInitData');
            schemaSql = dbInitData.SCHEMA_SQL;
            seedSql = dbInitData.SEED_SQL;
          }
          
          const translatedSchema = translateSql(schemaSql);
          const translatedSeed = translateSql(seedSql);
          
          sqliteDb.serialize(() => {
            sqliteDb.exec(translatedSchema, (err) => {
              if (err) {
                console.error('❌ SQLite Schema init failed:', err.message);
                return reject(err);
              }
              console.log('✅ SQLite Schema initialized');
              
              sqliteDb.exec(translatedSeed, (err) => {
                if (err) {
                  console.error('❌ SQLite Seed failed:', err.message);
                  return reject(err);
                }
                console.log('✅ SQLite Seed data loaded successfully');
                resolve();
              });
            });
          });
        } catch (fileErr) {
          console.error('❌ Failed to read schema/seed files:', fileErr.message);
          reject(fileErr);
        }
      } else {
        resolve();
      }
    });
  });
};

const query = async (sql, params = []) => {
  if (dbClient === 'mysql') {
    return mysqlPool.query(sql, params);
  } else {
    return new Promise((resolve, reject) => {
      const translatedSql = translateSql(sql);
      const isSelect = translatedSql.trim().match(/^(select|show|describe|pragma)/i);
      
      if (isSelect) {
        sqliteDb.all(translatedSql, params, (err, rows) => {
          if (err) return reject(err);
          resolve([rows]);
        });
      } else {
        sqliteDb.run(translatedSql, params, function(err) {
          if (err) return reject(err);
          resolve([{ insertId: this.lastID, affectedRows: this.changes }]);
        });
      }
    });
  }
};

const testConnection = async () => {
  if (process.env.DB_CLIENT === 'sqlite') {
    dbClient = 'sqlite';
    await initializeSqlite();
    return;
  }

  try {
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
    console.warn('⚠️ MySQL connection failed:', err.message);
    console.log('ℹ️ Falling back to local SQLite database...');
    dbClient = 'sqlite';
    await initializeSqlite();
  }
};

testConnection();

module.exports = {
  query,
  getClientType: () => dbClient
};
