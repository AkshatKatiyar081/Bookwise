const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

// Maintain a singleton connection promise
let dbPromise = null;

async function getDb() {
  if (!dbPromise) {
    dbPromise = open({
      filename: path.join(__dirname, '..', 'library.sqlite'),
      driver: sqlite3.Database
    }).then(async (db) => {
      console.log('SQLite database connected');
      // Enable foreign keys
      await db.run('PRAGMA foreign_keys = ON');
      return db;
    }).catch(err => {
      console.error('SQLite connection failed:', err);
      process.exit(1);
    });
  }
  return dbPromise;
}

// Helper: run a query that returns rows (SELECT)
async function query(sqlQuery, params = []) {
  const db = await getDb();
  return db.all(sqlQuery, params);
}

// Helper: run a query that executes an action (INSERT, UPDATE, DELETE)
// Returns the result object { lastID, changes }
async function execute(sqlQuery, params = []) {
  const db = await getDb();
  return db.run(sqlQuery, params);
}

module.exports = { getDb, query, execute };
