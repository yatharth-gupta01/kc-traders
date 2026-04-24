const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');
const bcrypt = require('bcryptjs');

let dbInstance = null;

async function initDB() {
  if (dbInstance) return dbInstance;

  const db = await open({
    filename: path.join(__dirname, 'kctraders.db'),
    driver: sqlite3.Database
  });

  // Enable foreign keys
  await db.exec('PRAGMA foreign_keys = ON;');

  // Create Users Table securely
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'customer' CHECK(role IN ('customer', 'shopkeeper', 'admin')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create Stock Table for Daily Management
  await db.exec(`
    CREATE TABLE IF NOT EXISTS stock (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_name TEXT NOT NULL UNIQUE,
      available_liters REAL NOT NULL DEFAULT 0,
      last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Initialize daily stock items if not exists
  await db.run("INSERT OR IGNORE INTO stock (product_name, available_liters) VALUES ('Kacchi Ghani', 1000)");
  await db.run("INSERT OR IGNORE INTO stock (product_name, available_liters) VALUES ('Premium Filtered', 1000)");

  // Create Orders Table securely with verification status
  await db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      address_data TEXT NOT NULL,
      items_data TEXT NOT NULL,
      total_amount REAL NOT NULL,
      payment_method TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pending Verification',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  console.log("Database initialized. Secured schema loaded.");

  // For testing, optionally create an admin immediately if none exists
  const adminExists = await db.get(`SELECT id FROM users WHERE role = 'admin' LIMIT 1`);
  if (!adminExists) {
    const adminHash = await bcrypt.hash('admin123', 10);
    // USING PARAMETERIZED QUERY (PREVENTS INJECTION):
    await db.run(
      `INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)`,
      ['admin@kctraders.com', adminHash, 'System Administrator', 'admin']
    );
    console.log("Created default secure admin account: admin@kctraders.com / admin123");
  }

  dbInstance = db;
  return db;
}

module.exports = { initDB };
