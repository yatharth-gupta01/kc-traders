require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { initDB } = require('./database');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const app = express();

// Initialize Razorpay Client
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || '',
    key_secret: process.env.RAZORPAY_KEY_SECRET || ''
});
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_fallback_key_48372648';

// Middleware for high-level security (configured for local multi-port development)
app.use(helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: false
})); 
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
        await db.query(
            `INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)`,
            [name, email, hashedPassword, safeRole]
        );
        res.status(201).json({ message: 'User registered successfully securely.' });
    } catch (err) {
        if (err.message && err.message.includes('UNIQUE')) {
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
        const userRes = await db.query(`SELECT * FROM users WHERE email = $1`, [email]);
        const user = userRes.rows[0];
        
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
        
        await db.query(
            `INSERT INTO orders (id, user_id, address_data, items_data, total_amount, payment_method) 
             VALUES ($1, $2, $3, $4, $5, $6)`,
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
            const ordersRes = await db.query(`
                SELECT o.*, u.name as "userName", u.email as "userEmail" 
                FROM orders o 
                JOIN users u ON o.user_id = u.id 
                ORDER BY o.created_at DESC
            `);
            orders = ordersRes.rows;
        } else {
            // Secure restriction: Users can strictly only pull their own data.
            const ordersRes = await db.query(`
                SELECT * FROM orders 
                WHERE user_id = $1 
                ORDER BY created_at DESC
            `, [req.user.id]);
            orders = ordersRes.rows;
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
        const orderRes = await db.query(`SELECT status, items_data FROM orders WHERE id = $1`, [req.params.id]);
        const order = orderRes.rows[0];
        if (!order) {
            return res.status(404).json({ error: 'Order not found.' });
        }

        // Deduct stock only when order transitions to 'Accepted' and was not previously accepted
        if (status === 'Accepted' && order.status !== 'Accepted' && order.status !== 'Verified') {
            const items = JSON.parse(order.items_data);
            
            // Fetch all available daily production categories dynamically from the database
            const stockRowsRes = await db.query(`SELECT product_name FROM stock`);
            const stockRows = stockRowsRes.rows;
            
            // 1. Calculate total required liters for each stock type in this order
            const requiredStock = {};
            for (const item of items) {
                let stockType = null;
                const nameLower = item.name.toLowerCase();
                
                // Dynamically match any registered stock category that is a substring of the ordered item name
                for (const row of stockRows) {
                    if (nameLower.includes(row.product_name.toLowerCase())) {
                        stockType = row.product_name;
                        break;
                    }
                }
                
                // Secure fallback matching logic for current catalog IDs
                if (!stockType) {
                    if (item.id === 'kcm-01' || item.id === 'kcm-03') {
                        stockType = 'Kacchi Ghani';
                    } else if (item.id === 'kcm-02' || item.id === 'kcm-04') {
                        stockType = 'Premium Filtered';
                    } else if (item.id === 'kcm-05' || item.id === 'kcm-06') {
                        stockType = 'Yellow Mustard';
                    }
                }
                
                if (stockType) {
                    let volumeLiters = 1;
                    let volumeStr = item.volume || "";
                    if (!volumeStr) {
                        const volumeMatch = item.name.match(/(\d+(?:\.\d+)?)\s*(L|ml)/i);
                        if (volumeMatch) {
                            volumeStr = volumeMatch[0];
                        }
                    }

                    if (volumeStr) {
                        const parsedVolume = parseFloat(volumeStr.replace(/[^\d.]/g, ''));
                        if (!isNaN(parsedVolume)) {
                            if (volumeStr.toLowerCase().includes('ml')) {
                                volumeLiters = parsedVolume / 1000;
                            } else {
                                volumeLiters = parsedVolume;
                            }
                        }
                    }

                    const totalLiters = volumeLiters * item.quantity;
                    requiredStock[stockType] = (requiredStock[stockType] || 0) + totalLiters;
                }
            }

            // 2. Validate stock levels in database prior to accepting
            for (const [stockType, requiredLiters] of Object.entries(requiredStock)) {
                const stockRowRes = await db.query(`SELECT available_liters FROM stock WHERE product_name = $1`, [stockType]);
                const stockRow = stockRowRes.rows[0];
                const available = stockRow ? stockRow.available_liters : 0;
                
                if (available < requiredLiters) {
                    return res.status(400).json({ 
                        error: `Insufficient stock for ${stockType}. Required: ${requiredLiters}L, Available: ${available}L.` 
                    });
                }
            }

            // 3. Deduct stock securely
            for (const [stockType, deductionLiters] of Object.entries(requiredStock)) {
                await db.query(
                    `UPDATE stock 
                     SET available_liters = available_liters - $1, last_updated = CURRENT_TIMESTAMP 
                     WHERE product_name = $2`,
                    [deductionLiters, stockType]
                );
            }
        }

        await db.query(`UPDATE orders SET status = $1 WHERE id = $2`, [status, req.params.id]);
        res.json({ message: `Order marked as ${status} successfully and stock deducted accordingly.` });
    } catch (err) {
        console.error("Order verification error:", err);
        res.status(500).json({ error: 'Failed to update order status.' });
    }
});

// ============================================
// STOCK MANAGEMENT API (Admin Only)
// ============================================

app.get('/api/stock', async (req, res) => {
    try {
        const stockRes = await db.query(`SELECT * FROM stock`);
        const stock = stockRes.rows;
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
        await db.query(
            `UPDATE stock SET available_liters = $1, last_updated = CURRENT_TIMESTAMP WHERE product_name = $2`,
            [liters, product_name]
        );
        res.json({ message: 'Stock updated successfully.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update stock.' });
    }
});

// ============================================
// USER MANAGEMENT API (Admin Only)
// ============================================
app.get('/api/users', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized. Factory Admin only.' });
    }
    try {
        const usersRes = await db.query(`SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC`);
        const users = usersRes.rows;
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch users.' });
    }
});

// ============================================
// ADDRESS BOOK API (Authenticated Users Only)
// ============================================

// Fetch saved addresses
app.get('/api/addresses', authenticateToken, async (req, res) => {
    try {
        const addressesRes = await db.query(
            `SELECT * FROM addresses WHERE user_id = $1 ORDER BY created_at DESC`,
            [req.user.id]
        );
        const addresses = addressesRes.rows;
        res.json(addresses);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch saved addresses.' });
    }
});

// Save a new address (Checks for exact duplicates to prevent spam)
app.post('/api/addresses', authenticateToken, async (req, res) => {
    const { name, phone, pincode, state, city, address } = req.body;
    
    if (!name || !phone || !pincode || !state || !city || !address) {
        return res.status(400).json({ error: 'All delivery address fields are required.' });
    }

    try {
        // Prevent duplicate addresses for the same user
        const existingRes = await db.query(
            `SELECT id FROM addresses 
             WHERE user_id = $1 AND name = $2 AND phone = $3 AND pincode = $4 AND state = $5 AND city = $6 AND address = $7`,
            [req.user.id, name, phone, pincode, state, city, address]
        );
        const existing = existingRes.rows[0];

        if (existing) {
            return res.json({ message: 'Address already exists in Address Book.', addressId: existing.id });
        }

        const result = await db.query(
            `INSERT INTO addresses (user_id, name, phone, pincode, state, city, address) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
            [req.user.id, name, phone, pincode, state, city, address]
        );

        res.status(201).json({ message: 'Address saved successfully.', addressId: result.rows[0].id });
    } catch (err) {
        console.error("Save address error:", err);
        res.status(500).json({ error: 'Failed to securely save address.' });
    }
});

// ============================================
// WISHLIST API (Authenticated Users Only)
// ============================================

app.get('/api/wishlist', authenticateToken, async (req, res) => {
    try {
        const wishlistRes = await db.query(
            `SELECT * FROM wishlist WHERE user_id = $1 ORDER BY created_at DESC`,
            [req.user.id]
        );
        const wishlist = wishlistRes.rows;
        res.json(wishlist);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch wishlist.' });
    }
});

app.post('/api/wishlist', authenticateToken, async (req, res) => {
    const { product_id, variant_id } = req.body;
    if (!product_id || !variant_id) {
        return res.status(400).json({ error: 'Product and Variant IDs are required.' });
    }

    try {
        await db.query(
            `INSERT INTO wishlist (user_id, product_id, variant_id) VALUES ($1, $2, $3) ON CONFLICT (user_id, variant_id) DO NOTHING`,
            [req.user.id, product_id, variant_id]
        );
        res.status(201).json({ message: 'Added to wishlist.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to add to wishlist.' });
    }
});

app.delete('/api/wishlist/:variantId', authenticateToken, async (req, res) => {
    try {
        await db.query(
            `DELETE FROM wishlist WHERE user_id = $1 AND variant_id = $2`,
            [req.user.id, req.params.variantId]
        );
        res.json({ message: 'Removed from wishlist.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to remove from wishlist.' });
    }
});

// ============================================
// RAZORPAY INTEGRATION ENDPOINTS
// ============================================

// Create a Razorpay Order
app.post('/api/payments/order', authenticateToken, async (req, res) => {
    const { amount } = req.body;
    if (!amount) {
        return res.status(400).json({ error: 'Amount is required.' });
    }

    try {
        const options = {
            amount: Math.round(amount * 100), // convert to paise
            currency: 'INR',
            receipt: `rcpt_${Date.now()}_${Math.floor(Math.random() * 1000)}`
        };

        const rzpOrder = await razorpay.orders.create(options);
        res.json({
            id: rzpOrder.id,
            amount: rzpOrder.amount,
            currency: rzpOrder.currency
        });
    } catch (err) {
        console.error("Razorpay Order Creation Error:", err);
        res.status(500).json({ error: 'Failed to create payment order.' });
    }
});

// Verify Payment Signature
app.post('/api/payments/verify', authenticateToken, async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ error: 'All payment verification fields are required.' });
    }

    try {
        const text = razorpay_order_id + "|" + razorpay_payment_id;
        const generated_signature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
            .update(text)
            .digest('hex');

        if (generated_signature === razorpay_signature) {
            res.json({ success: true, message: 'Payment signature verified successfully.' });
        } else {
            res.status(400).json({ error: 'Signature verification failed. Invalid payment details.' });
        }
    } catch (err) {
        console.error("Signature Verification Error:", err);
        res.status(500).json({ error: 'Internal server error during verification.' });
    }
});


// Start Server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend vault locked. Server running on security port ${PORT} across all network interfaces.`);
});

