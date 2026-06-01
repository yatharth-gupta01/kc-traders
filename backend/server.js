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
        const order = await db.get(`SELECT status, items_data FROM orders WHERE id = ?`, [req.params.id]);
        if (!order) {
            return res.status(404).json({ error: 'Order not found.' });
        }

        // Deduct stock only when order transitions to 'Accepted' and was not previously accepted
        if (status === 'Accepted' && order.status !== 'Accepted' && order.status !== 'Verified') {
            const items = JSON.parse(order.items_data);
            
            // Fetch all available daily production categories dynamically from the database
            const stockRows = await db.all(`SELECT product_name FROM stock`);
            
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
                const stockRow = await db.get(`SELECT available_liters FROM stock WHERE product_name = ?`, [stockType]);
                const available = stockRow ? stockRow.available_liters : 0;
                
                if (available < requiredLiters) {
                    return res.status(400).json({ 
                        error: `Insufficient stock for ${stockType}. Required: ${requiredLiters}L, Available: ${available}L.` 
                    });
                }
            }

            // 3. Deduct stock securely
            for (const [stockType, deductionLiters] of Object.entries(requiredStock)) {
                await db.run(
                    `UPDATE stock 
                     SET available_liters = available_liters - ?, last_updated = CURRENT_TIMESTAMP 
                     WHERE product_name = ?`,
                    [deductionLiters, stockType]
                );
            }
        }

        await db.run(`UPDATE orders SET status = ? WHERE id = ?`, [status, req.params.id]);
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

// ============================================
// USER MANAGEMENT API (Admin Only)
// ============================================
app.get('/api/users', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized. Factory Admin only.' });
    }
    try {
        const users = await db.all(`SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC`);
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
        const addresses = await db.all(
            `SELECT * FROM addresses WHERE user_id = ? ORDER BY created_at DESC`,
            [req.user.id]
        );
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
        const existing = await db.get(
            `SELECT id FROM addresses 
             WHERE user_id = ? AND name = ? AND phone = ? AND pincode = ? AND state = ? AND city = ? AND address = ?`,
            [req.user.id, name, phone, pincode, state, city, address]
        );

        if (existing) {
            return res.json({ message: 'Address already exists in Address Book.', addressId: existing.id });
        }

        const result = await db.run(
            `INSERT INTO addresses (user_id, name, phone, pincode, state, city, address) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [req.user.id, name, phone, pincode, state, city, address]
        );

        res.status(201).json({ message: 'Address saved successfully.', addressId: result.lastID });
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
        const wishlist = await db.all(
            `SELECT * FROM wishlist WHERE user_id = ? ORDER BY created_at DESC`,
            [req.user.id]
        );
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
        await db.run(
            `INSERT OR IGNORE INTO wishlist (user_id, product_id, variant_id) VALUES (?, ?, ?)`,
            [req.user.id, product_id, variant_id]
        );
        res.status(201).json({ message: 'Added to wishlist.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to add to wishlist.' });
    }
});

app.delete('/api/wishlist/:variantId', authenticateToken, async (req, res) => {
    try {
        await db.run(
            `DELETE FROM wishlist WHERE user_id = ? AND variant_id = ?`,
            [req.user.id, req.params.variantId]
        );
        res.json({ message: 'Removed from wishlist.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to remove from wishlist.' });
    }
});

// ============================================
// RAZORPAY PAYMENT API INTEGRATION
// ============================================
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_5Wq2bK6fKTraders';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'KCTradersSecretDummyKeyXYZ789';

let razorpayInstance = null;
try {
    if (RAZORPAY_KEY_ID && !RAZORPAY_KEY_ID.includes('KTraders')) {
        const Razorpay = require('razorpay');
        razorpayInstance = new Razorpay({
            key_id: RAZORPAY_KEY_ID,
            key_secret: RAZORPAY_KEY_SECRET
        });
        console.log("Secure Razorpay SDK initialized successfully.");
    } else {
        console.log("Razorpay running in premium Simulation Mode.");
    }
} catch (e) {
    console.error("Razorpay SDK initialization failed:", e);
}

// 1. Create a payment order (Secure server-side)
app.post('/api/payments/order', authenticateToken, async (req, res) => {
    const { amount } = req.body;
    
    if (!amount || isNaN(amount)) {
        return res.status(400).json({ error: 'Valid payment amount is required.' });
    }

    const amountInPaise = Math.round(amount * 100); 
    const receiptId = `rcpt_${Math.floor(Math.random() * 900000) + 100000}`;

    if (!razorpayInstance) {
        return res.json({
            isSimulation: true,
            id: `order_sim_${Math.floor(Math.random() * 9000000) + 1000000}`,
            amount: amountInPaise,
            currency: 'INR',
            key: RAZORPAY_KEY_ID
        });
    }

    try {
        const order = await razorpayInstance.orders.create({
            amount: amountInPaise,
            currency: 'INR',
            receipt: receiptId
        });
        
        res.json({
            isSimulation: false,
            id: order.id,
            amount: order.amount,
            currency: order.currency,
            key: RAZORPAY_KEY_ID
        });
    } catch (err) {
        console.error("Razorpay order creation failed:", err);
        res.status(500).json({ error: 'Payment gateway order creation failed.' });
    }
});

// 2. Verify payment signature
app.post('/api/payments/verify', authenticateToken, async (req, res) => {
    const { 
        razorpay_order_id, 
        razorpay_payment_id, 
        razorpay_signature, 
        address, 
        items, 
        total,
        isSimulation 
    } = req.body;

    try {
        let isPaymentValid = false;

        if (isSimulation) {
            isPaymentValid = true;
            console.log("Verified simulation checkout for order:", razorpay_order_id);
        } else {
            const crypto = require('crypto');
            const hmac = crypto.createHmac('sha256', RAZORPAY_KEY_SECRET);
            hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
            const generated_signature = hmac.digest('hex');

            if (generated_signature === razorpay_signature) {
                isPaymentValid = true;
                console.log("Cryptographic signature matches. Payment is fully verified!");
            }
        }

        if (isPaymentValid) {
            const orderId = `ORD-KCT-${Math.floor(Math.random() * 90000) + 10000}`;
            const itemsData = JSON.stringify(items);
            
            await db.run(
                `INSERT INTO orders (id, user_id, address_data, items_data, total_amount, payment_method, status) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [orderId, req.user.id, address, itemsData, total, 'online', 'Paid']
            );

            res.status(201).json({ 
                success: true, 
                message: 'Payment verified and order created successfully.', 
                orderId 
            });
        } else {
            res.status(400).json({ success: false, error: 'Cryptographic validation failed. Threat detected.' });
        }
    } catch (err) {
        console.error("Payment verification failed:", err);
        res.status(500).json({ error: 'Internal system verification failure.' });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Backend vault locked. Server running on security port ${PORT}`);
});

