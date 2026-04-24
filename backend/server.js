require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { initDB } = require('./database');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_fallback_key_48372648';

// Middleware for high-level security
app.use(helmet()); 
app.use(cors());
app.use(express.json()); // Parses strictly JSON payloads

// Attach Database
let db;
initDB().then(database => {
    db = database;
}).catch(e => console.error("Database connection failed:", e));

// ============================================
// SECURITY MIDDLEWARE: JWT Verification
// ============================================
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) return res.status(401).json({ error: 'Access Denied. No Token Provided.' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid or Expired Token.' });
        req.user = user;
        next();
    });
};

// ============================================
// AUTHENTICATION API (Registration & Login)
// ============================================

// Register
app.post('/api/auth/register', async (req, res) => {
    const { name, email, password, role } = req.body;
    
    if (!name || !email || !password) {
        return res.status(400).json({ error: 'All fields are required.' });
    }

    try {
        // Hash password securely (Salting & Hashing)
        const hashedPassword = await bcrypt.hash(password, 10);
        const safeRole = (role === 'shopkeeper') ? 'shopkeeper' : 'customer';

        // Parameterized Query absolutely blocks SQL injections
        await db.run(
            `INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`,
            [name, email, hashedPassword, safeRole]
        );
        res.status(201).json({ message: 'User registered successfully securely.' });
    } catch (err) {
        if (err.message.includes('UNIQUE')) {
            return res.status(400).json({ error: 'Email already highly protected/used.' });
        }
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    
    try {
        // Parameterized Query 
        const user = await db.get(`SELECT * FROM users WHERE email = ?`, [email]);
        
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        // Compare hashed passwords
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        // Issue cryptographically signed token
        const token = jwt.sign(
            { id: user.id, name: user.name, role: user.role, email: user.email }, 
            JWT_SECRET, 
            { expiresIn: '24h' }
        );

        res.json({ token, role: user.role, name: user.name });
    } catch (err) {
        res.status(500).json({ error: 'Authentication failed severely.' });
    }
});

// ============================================
// SECURE ORDERS API
// ============================================

// Create Order (Requires Authentication)
app.post('/api/orders', authenticateToken, async (req, res) => {
    const { id, address, items, total, paymentMethod } = req.body;
    
    try {
        // Prepare items as secure string
        const itemsData = JSON.stringify(items);
        
        await db.run(
            `INSERT INTO orders (id, user_id, address_data, items_data, total_amount, payment_method) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [id, req.user.id, address, itemsData, total, paymentMethod]
        );
        
        res.status(201).json({ message: 'Order created securely.', orderId: id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to process order securely.' });
    }
});

// Fetch Orders (Admins see all, Users see their own)
app.get('/api/orders', authenticateToken, async (req, res) => {
    try {
        let orders;
        if (req.user.role === 'admin') {
            // Admin sees all orders joined with user emails
            orders = await db.all(`
                SELECT o.*, u.name as userName, u.email as userEmail 
                FROM orders o 
                JOIN users u ON o.user_id = u.id 
                ORDER BY o.created_at DESC
            `);
        } else {
            // Secure restriction: Users can strictly only pull their own data.
            orders = await db.all(`
                SELECT * FROM orders 
                WHERE user_id = ? 
                ORDER BY created_at DESC
            `, [req.user.id]);
        }
        
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch orders.' });
    }
});

// Update Order Status (Admin Only)
app.patch('/api/orders/:id', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized. Factory Admin only.' });
    }
    
    const { status } = req.body;
    try {
        await db.run(`UPDATE orders SET status = ? WHERE id = ?`, [status, req.params.id]);
        res.json({ message: `Order marked as ${status} successfully.` });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update order status.' });
    }
});

// ============================================
// STOCK MANAGEMENT API (Admin Only)
// ============================================

app.get('/api/stock', authenticateToken, async (req, res) => {
    try {
        const stock = await db.all(`SELECT * FROM stock`);
        res.json(stock);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch stock.' });
    }
});

app.post('/api/stock', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized. Factory Admin only.' });
    }

    const { product_name, liters } = req.body;
    try {
        await db.run(
            `UPDATE stock SET available_liters = ?, last_updated = CURRENT_TIMESTAMP WHERE product_name = ?`,
            [liters, product_name]
        );
        res.json({ message: 'Stock updated successfully.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update stock.' });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Backend vault locked. Server running on security port ${PORT}`);
});
