const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

let poolInstance = null;

async function initDB() {
  if (poolInstance) return poolInstance;

  // Use DATABASE_URL from environment
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is missing!");
  }

  const pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false // Required for Render and Neon PostgreSQL connections
    }
  });

  // Test the connection and initialize schemas
  const client = await pool.connect();
  try {
    // Create Users Table securely
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'customer' CHECK(role IN ('customer', 'shopkeeper', 'admin')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create Stock Table for Daily Management
    await client.query(`
      CREATE TABLE IF NOT EXISTS stock (
        id SERIAL PRIMARY KEY,
        product_name TEXT NOT NULL UNIQUE,
        available_liters REAL NOT NULL DEFAULT 0,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Initialize daily stock items if not exists
    await client.query(`
      INSERT INTO stock (product_name, available_liters) 
      VALUES ('Kacchi Ghani', 1000), 
             ('Premium Filtered', 1000), 
             ('Yellow Mustard', 1000)
      ON CONFLICT (product_name) DO NOTHING;
    `);

    // Create Orders Table securely with verification status
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        address_data TEXT NOT NULL,
        items_data TEXT NOT NULL,
        total_amount REAL NOT NULL,
        payment_method TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Pending Verification',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    // Create Addresses Table securely for Address Book
    await client.query(`
      CREATE TABLE IF NOT EXISTS addresses (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        pincode TEXT NOT NULL,
        state TEXT NOT NULL,
        city TEXT NOT NULL,
        address TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    // Create Wishlist Table securely
    await client.query(`
      CREATE TABLE IF NOT EXISTS wishlist (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        product_id TEXT NOT NULL,
        variant_id TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(user_id, variant_id)
      );
    `);

    console.log("Database initialized. Secured schema loaded.");

    // For testing, optionally create an admin immediately if none exists
    const adminRes = await client.query(`SELECT id FROM users WHERE role = 'admin' LIMIT 1`);
    if (adminRes.rowCount === 0) {
      const adminHash = await bcrypt.hash('admin123', 10);
      await client.query(
        `INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4)`,
        ['admin@kctraders.com', adminHash, 'System Administrator', 'admin']
      );
      console.log("Created default secure admin account: admin@kctraders.com / admin123");
    }

  } finally {
    client.release();
  }

  poolInstance = pool;
  return pool;
}

module.exports = { initDB };
