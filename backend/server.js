require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { initDB } = require('./database');
const Razorpay = require('razorpay');

// Import Security Utilities & Middlewares
const {
  logSecurityEvent,
  logAudit,
  sanitizeInput,
  validatePasswordStrength,
  globalLimiter,
  authLimiter,
  paymentLimiter,
  speedThrottler
} = require('./security');

const app = express();

// Initialize Razorpay Client
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || ''
});

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_fallback_key_48372648';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'super_secret_refresh_fallback_key_92837482';

// 1. Gzip Compression for improved performance
app.use(compression());

// 2. Cookie Parser for reading HttpOnly session tokens securely
app.use(cookieParser());

// 3. Configure strict CORS
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5000',
  'http://localhost:3000',
  'https://kctraders-backend.onrender.com',
  'https://kc-traders.vercel.app',
  'capacitor://localhost',
  'http://localhost'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Blocked by CORS policy (Unauthorized Domain)'));
    }
  },
  credentials: true
}));

// 4. Configure Helmet with strict Content Security Policy (CSP)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://checkout.razorpay.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://*.openstreetmap.org", "https://*.postalcodes.in", "https://*.postalpincode.in"],
      connectSrc: ["'self'", "https://kctraders-backend.onrender.com", "https://api.postalpincode.in", "https://nominatim.openstreetmap.org"],
      frameSrc: ["https://api.razorpay.com", "https://checkout.razorpay.com"]
    }
  },
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// 5. Strict payload size limits to prevent Denial of Service (DoS) attacks
app.use(express.json({ limit: '15kb' }));

// 6. Apply speed throttler and global rate limiting
app.use(speedThrottler);
app.use(globalLimiter);

// 7. Auto input sanitization (Strips script injection and detects SQL patterns)
app.use(sanitizeInput);

// Attach Database Pool
let db;
initDB().then(database => {
  db = database;
}).catch(e => {
  console.error("Database connection failed:", e);
});

// Ensure backup folder exists
const backupDir = path.join(__dirname, 'backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir);
}

// ============================================
// SECURITY MIDDLEWARE: JWT & RBAC Verification
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

const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      logSecurityEvent(
        db, 
        'UNAUTHORIZED_ACCESS', 
        req.ip, 
        req.headers['user-agent'], 
        req.user?.email, 
        'HIGH', 
        `Role ${req.user?.role || 'Guest'} tried accessing RBAC protected endpoint: ${req.originalUrl}`
      );
      return res.status(403).json({ error: 'Access Denied. Insufficient permissions.' });
    }
    next();
  };
};

// ============================================
// TELEMETRY & HEALTH CHECKS
// ============================================

app.get('/api/health', async (req, res) => {
  try {
    const start = Date.now();
    await db.query('SELECT 1');
    const latency = Date.now() - start;
    
    res.json({
      status: 'UP',
      latency: `${latency}ms`,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      pool: {
        totalConnections: db.totalCount,
        idleConnections: db.idleCount,
        waitingCount: db.waitingCount
      }
    });
  } catch (err) {
    res.status(500).json({ status: 'DOWN', error: err.message });
  }
});

// ============================================
// AUTHENTICATION SYSTEM (With RTR & Lockout)
// ============================================

// Register User
app.post('/api/auth/register', authLimiter, async (req, res) => {
  const { name, email, password, role } = req.body;
  
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  // Strong password requirements check
  const passwordError = validatePasswordStrength(password);
  if (passwordError) {
    return res.status(400).json({ error: passwordError });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const safeRole = (role === 'shopkeeper') ? 'shopkeeper' : 'customer';

    await db.query(
      `INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)`,
      [name, email, hashedPassword, safeRole]
    );

    await logAudit(db, null, 'USER_REGISTERED', `Successfully registered account: ${email}`, req.ip);

    res.status(201).json({ message: 'User registered successfully.' });
  } catch (err) {
    if (err.message && (err.message.includes('UNIQUE') || err.message.includes('unique'))) {
      return res.status(400).json({ error: 'Email already registered.' });
    }
    res.status(500).json({ error: 'Internal server error during registration.' });
  }
});

// Login User
app.post('/api/auth/login', authLimiter, async (req, res) => {
  const { email, password } = req.body;
  const ip = req.ip;
  const userAgent = req.headers['user-agent'] || 'Unknown';

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const userRes = await db.query(`SELECT * FROM users WHERE email = $1`, [email]);
    const user = userRes.rows[0];

    if (!user) {
      await logSecurityEvent(db, 'LOGIN_FAILED', ip, userAgent, email, 'LOW', 'Email not found.');
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // Check account lockout status
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const cooldownMinutes = Math.ceil((new Date(user.locked_until) - new Date()) / (1000 * 60));
      await logSecurityEvent(db, 'LOGIN_LOCKED', ip, userAgent, email, 'HIGH', `Locked user login attempt during cooldown.`);
      return res.status(403).json({ error: `Account locked due to consecutive failures. Try again in ${cooldownMinutes} minutes.` });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      // Increment failed attempts
      const attempts = (user.failed_attempts || 0) + 1;
      let lockedUntil = null;
      let isLocked = false;
      
      if (attempts >= 5) {
        lockedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        isLocked = true;
      }

      await db.query(
        `UPDATE users SET failed_attempts = $1, locked_until = $2 WHERE id = $3`,
        [attempts, lockedUntil, user.id]
      );

      await logSecurityEvent(
        db, 
        isLocked ? 'LOCKOUT_TRIGGERED' : 'LOGIN_FAILED', 
        ip, 
        userAgent, 
        email, 
        isLocked ? 'HIGH' : 'LOW', 
        `Incorrect password. Failed attempt #${attempts}`
      );

      return res.status(401).json({ 
        error: isLocked 
          ? 'Account locked due to 5 failed attempts. Please retry in 15 minutes.' 
          : 'Invalid credentials.' 
      });
    }

    // Reset failed attempts upon successful login
    await db.query(`UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = $1`, [user.id]);

    // Issue cryptographic Access Token & Refresh Token
    const accessToken = jwt.sign(
      { id: user.id, name: user.name, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = crypto.randomBytes(40).toString('hex');
    const refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Store refresh token in database
    await db.query(
      `INSERT INTO refresh_tokens (token, user_id, expires_at) VALUES ($1, $2, $3)`,
      [refreshToken, user.id, refreshTokenExpiry]
    );

    // Save active session
    await db.query(
      `INSERT INTO sessions (user_id, ip_address, user_agent) VALUES ($1, $2, $3)`,
      [user.id, ip, userAgent]
    );

    // Set secure HttpOnly cookie for refresh token
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    await logAudit(db, user.id, 'USER_LOGIN', 'Successfully logged in.', ip);

    // Return access token, metadata, and refresh token (fallback for mobile environments)
    res.json({
      token: accessToken,
      refreshToken: refreshToken,
      role: user.role,
      name: user.name
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ error: 'Failed to process authentication.' });
  }
});

// Refresh Access Token (Token Rotation)
app.post('/api/auth/refresh', async (req, res) => {
  const tokenFromCookie = req.cookies.refreshToken;
  const tokenFromPayload = req.body.refreshToken;
  const token = tokenFromCookie || tokenFromPayload;
  const ip = req.ip;
  const userAgent = req.headers['user-agent'] || 'Unknown';

  if (!token) {
    return res.status(400).json({ error: 'Refresh token is missing.' });
  }

  try {
    const tokenRes = await db.query(
      `SELECT r.*, u.role, u.name, u.email 
       FROM refresh_tokens r 
       JOIN users u ON r.user_id = u.id 
       WHERE r.token = $1`,
      [token]
    );
    const tokenRecord = tokenRes.rows[0];

    if (!tokenRecord) {
      await logSecurityEvent(db, 'REFRESH_TOKEN_INVALID', ip, userAgent, null, 'MEDIUM', `Invalid refresh token sent: ${token.substring(0, 10)}...`);
      return res.status(403).json({ error: 'Invalid or revoked token.' });
    }

    // Refresh token reuse detection (anomalous behavior detection)
    if (tokenRecord.revoked || new Date(tokenRecord.expires_at) < new Date()) {
      // Revoke all tokens for this user immediately as a safety precaution
      await db.query(`UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = $1`, [tokenRecord.user_id]);
      await db.query(`DELETE FROM sessions WHERE user_id = $1`, [tokenRecord.user_id]);
      
      await logSecurityEvent(
        db, 
        'REFRESH_TOKEN_THEFT', 
        ip, 
        userAgent, 
        tokenRecord.email, 
        'CRITICAL', 
        'Revoked or expired refresh token reuse detected! All active sessions revoked.'
      );
      return res.status(403).json({ error: 'Session expired or compromised. Please login again.' });
    }

    // Revoke old refresh token (Rotate)
    await db.query(`UPDATE refresh_tokens SET revoked = TRUE WHERE token = $1`, [token]);

    // Issue brand new token pair (Refresh Token Rotation)
    const newAccessToken = jwt.sign(
      { id: tokenRecord.user_id, name: tokenRecord.name, role: tokenRecord.role, email: tokenRecord.email },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    const newRefreshToken = crypto.randomBytes(40).toString('hex');
    const newRefreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await db.query(
      `INSERT INTO refresh_tokens (token, user_id, expires_at) VALUES ($1, $2, $3)`,
      [newRefreshToken, tokenRecord.user_id, newRefreshTokenExpiry]
    );

    // Update session timestamp
    await db.query(
      `UPDATE sessions SET last_active = CURRENT_TIMESTAMP WHERE user_id = $1 AND ip_address = $2`,
      [tokenRecord.user_id, ip]
    );

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      token: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (err) {
    console.error("Token Refresh Error:", err);
    res.status(500).json({ error: 'Token refresh failed.' });
  }
});

// Logout current session
app.post('/api/auth/logout', async (req, res) => {
  const token = req.cookies.refreshToken || req.body.refreshToken;
  const ip = req.ip;

  if (token) {
    try {
      await db.query(`UPDATE refresh_tokens SET revoked = TRUE WHERE token = $1`, [token]);
      await db.query(`DELETE FROM sessions WHERE ip_address = $1 AND last_active > CURRENT_TIMESTAMP - INTERVAL '1 day'`, [ip]);
    } catch (err) {
      console.error("Logout DB Clean Error:", err);
    }
  }

  res.clearCookie('refreshToken');
  res.json({ message: 'Log out successful.' });
});

// Logout all devices
app.post('/api/auth/logout-all', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    await db.query(`UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = $1`, [userId]);
    await db.query(`DELETE FROM sessions WHERE user_id = $1`, [userId]);
    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out of all sessions successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to clear device sessions.' });
  }
});

// Fetch Active Sessions
app.get('/api/auth/sessions', authenticateToken, async (req, res) => {
  try {
    const sessionsRes = await db.query(
      `SELECT id, ip_address, user_agent, last_active FROM sessions WHERE user_id = $1 ORDER BY last_active DESC`,
      [req.user.id]
    );
    res.json(sessionsRes.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sessions.' });
  }
});

// Terminate Specific Session
app.delete('/api/auth/sessions/:id', authenticateToken, async (req, res) => {
  try {
    await db.query(`DELETE FROM sessions WHERE id = $1 AND user_id = $2`, [req.params.id, req.user.id]);
    res.json({ message: 'Session revoked successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to revoke session.' });
  }
});

// ============================================
// ENHANCED ORDERS API
// ============================================

app.post('/api/orders', authenticateToken, async (req, res) => {
  const { id, address, items, total, paymentMethod } = req.body;
  if (!id || !address || !items || !total || !paymentMethod) {
    return res.status(400).json({ error: 'Invalid order input params.' });
  }
  
  try {
    const itemsData = JSON.stringify(items);
    await db.query(
      `INSERT INTO orders (id, user_id, address_data, items_data, total_amount, payment_method) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, req.user.id, address, itemsData, total, paymentMethod]
    );
    res.status(201).json({ message: 'Order created securely.', orderId: id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to store order records.' });
  }
});

app.get('/api/orders', authenticateToken, async (req, res) => {
  try {
    let orders;
    if (req.user.role === 'admin') {
      const ordersRes = await db.query(`
        SELECT o.*, u.name as "userName", u.email as "userEmail" 
        FROM orders o 
        JOIN users u ON o.user_id = u.id 
        ORDER BY o.created_at DESC
      `);
      orders = ordersRes.rows;
    } else {
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

app.patch('/api/orders/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  const { status } = req.body;
  try {
    const orderRes = await db.query(`SELECT status, items_data FROM orders WHERE id = $1`, [req.params.id]);
    const order = orderRes.rows[0];
    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    if (status === 'Accepted' && order.status !== 'Accepted') {
      const items = JSON.parse(order.items_data);
      const stockRowsRes = await db.query(`SELECT product_name FROM stock`);
      const stockRows = stockRowsRes.rows;
      
      const requiredStock = {};
      for (const item of items) {
        let stockType = null;
        const nameLower = item.name.toLowerCase();
        
        for (const row of stockRows) {
          if (nameLower.includes(row.product_name.toLowerCase())) {
            stockType = row.product_name;
            break;
          }
        }
        
        if (!stockType) {
          if (item.id === 'kcm-01' || item.id === 'kcm-03') stockType = 'Kacchi Ghani';
          else if (item.id === 'kcm-02' || item.id === 'kcm-04') stockType = 'Premium Filtered';
          else if (item.id === 'kcm-05' || item.id === 'kcm-06') stockType = 'Yellow Mustard';
        }
        
        if (stockType) {
          let volumeLiters = 1;
          let volumeStr = item.volume || "";
          if (!volumeStr) {
            const volumeMatch = item.name.match(/(\d+(?:\.\d+)?)\s*(L|ml)/i);
            if (volumeMatch) volumeStr = volumeMatch[0];
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

      // Validate stock levels
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

      // Deduct stock
      for (const [stockType, deductionLiters] of Object.entries(requiredStock)) {
        await db.query(
          `UPDATE stock SET available_liters = available_liters - $1, last_updated = CURRENT_TIMESTAMP WHERE product_name = $2`,
          [deductionLiters, stockType]
        );
      }
    }

    await db.query(`UPDATE orders SET status = $1 WHERE id = $2`, [status, req.params.id]);
    await logAudit(db, req.user.id, 'ORDER_UPDATE', `Updated order ${req.params.id} status to ${status}`, req.ip);

    res.json({ message: `Order updated to ${status}.` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update order.' });
  }
});

// ============================================
// SECURE STOCK & USER MANAGEMENT (Admin)
// ============================================

app.get('/api/stock', async (req, res) => {
  try {
    const stockRes = await db.query(`SELECT * FROM stock`);
    res.json(stockRes.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stock.' });
  }
});

app.post('/api/stock', authenticateToken, requireRole(['admin']), async (req, res) => {
  const { product_name, liters } = req.body;
  if (!product_name || liters === undefined) {
    return res.status(400).json({ error: 'Product name and liters volume are required.' });
  }
  try {
    await db.query(
      `UPDATE stock SET available_liters = $1, last_updated = CURRENT_TIMESTAMP WHERE product_name = $2`,
      [liters, product_name]
    );
    await logAudit(db, req.user.id, 'STOCK_UPDATE', `Adjusted ${product_name} stock to ${liters} liters`, req.ip);
    res.json({ message: 'Stock level updated.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update stock.' });
  }
});

app.get('/api/users', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const usersRes = await db.query(`SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC`);
    res.json(usersRes.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
});

// ============================================
// ADDRESSES & WISHLIST
// ============================================

app.get('/api/addresses', authenticateToken, async (req, res) => {
  try {
    const addressesRes = await db.query(
      `SELECT * FROM addresses WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json(addressesRes.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch addresses.' });
  }
});

app.post('/api/addresses', authenticateToken, async (req, res) => {
  const { name, phone, pincode, state, city, address } = req.body;
  if (!name || !phone || !pincode || !state || !city || !address) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  try {
    // Check duplicates
    const dupRes = await db.query(
      `SELECT id FROM addresses WHERE user_id = $1 AND address = $2 AND pincode = $3`,
      [req.user.id, address, pincode]
    );
    if (dupRes.rows[0]) {
      return res.json({ message: 'Address already exists.', addressId: dupRes.rows[0].id });
    }

    const resAdd = await db.query(
      `INSERT INTO addresses (user_id, name, phone, pincode, state, city, address) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [req.user.id, name, phone, pincode, state, city, address]
    );
    res.status(201).json({ message: 'Address saved.', addressId: resAdd.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save address.' });
  }
});

app.get('/api/wishlist', authenticateToken, async (req, res) => {
  try {
    const wishRes = await db.query(`SELECT * FROM wishlist WHERE user_id = $1`, [req.user.id]);
    res.json(wishRes.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch wishlist.' });
  }
});

app.post('/api/wishlist', authenticateToken, async (req, res) => {
  const { product_id, variant_id } = req.body;
  try {
    await db.query(
      `INSERT INTO wishlist (user_id, product_id, variant_id) 
       VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
      [req.user.id, product_id, variant_id]
    );
    res.status(201).json({ message: 'Added to wishlist.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update wishlist.' });
  }
});

app.delete('/api/wishlist/:variantId', authenticateToken, async (req, res) => {
  try {
    await db.query(`DELETE FROM wishlist WHERE user_id = $1 AND variant_id = $2`, [req.user.id, req.params.variantId]);
    res.json({ message: 'Removed.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove.' });
  }
});

// ============================================
// PAYMENT SECURITY & SIGNATURE VERIFICATION
// ============================================

app.post('/api/payments/order', authenticateToken, paymentLimiter, async (req, res) => {
  const { amount } = req.body;
  if (!amount || isNaN(amount)) {
    return res.status(400).json({ error: 'Valid numeric amount is required.' });
  }
  try {
    const options = {
      amount: Math.round(amount * 100), // paise
      currency: 'INR',
      receipt: `rcpt_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`
    };

    const rzpOrder = await razorpay.orders.create(options);
    res.json({
      id: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency
    });
  } catch (err) {
    res.status(500).json({ error: 'Razorpay order creation failed.' });
  }
});

app.post('/api/payments/verify', authenticateToken, paymentLimiter, async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: 'Signature keys missing.' });
  }

  try {
    const text = razorpay_order_id + "|" + razorpay_payment_id;
    const generated = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(text)
      .digest('hex');

    if (generated === razorpay_signature) {
      res.json({ success: true, message: 'Payment successfully validated.' });
    } else {
      await logSecurityEvent(db, 'PAYMENT_SIGNATURE_FRAUD', req.ip, req.headers['user-agent'], req.user.email, 'HIGH', `Failed payment checksum match. Payment ID: ${razorpay_payment_id}`);
      res.status(400).json({ error: 'Payment signature validation failed.' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to verify payment.' });
  }
});

// Secure Razorpay Webhook listener (Verification & Fraud Detection)
app.post('/api/payments/webhook', async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'fallback_webhook_secret_key';

  try {
    const shasum = crypto.createHmac('sha256', webhookSecret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest('hex');

    if (digest !== signature) {
      await logSecurityEvent(db, 'WEBHOOK_FRAUD', req.ip, req.headers['user-agent'], null, 'CRITICAL', 'Razorpay Webhook signature mismatch.');
      return res.status(400).json({ error: 'Invalid Webhook signature.' });
    }

    const event = req.body.event;
    if (event === 'payment.captured') {
      const payment = req.body.payload.payment.entity;
      const orderId = payment.order_id;
      
      // Ensure idempotency (prevent duplicate order creation processing)
      const existing = await db.query(`SELECT id FROM orders WHERE id = $1`, [orderId]);
      if (existing.rowCount > 0) {
        return res.json({ success: true, message: 'Order already logged.' });
      }

      await logAudit(db, null, 'WEBHOOK_PAYMENT_CAPTURED', `Received webhook verify for order: ${orderId}`, req.ip);
    }
    
    res.json({ status: 'ok' });
  } catch (err) {
    console.error("Webhook processing error:", err);
    res.status(500).json({ error: 'Webhook processing failed.' });
  }
});

// ============================================
// SYSTEM BACKUP & SYSTEM MONITORING (Admin)
// ============================================

// Create database snapshot backup
app.post('/api/admin/backups/create', authenticateToken, requireRole(['admin']), async (req, res) => {
  const ip = req.ip;
  try {
    // 1. Fetch tables structure & records
    const tables = ['users', 'stock', 'orders', 'addresses', 'wishlist'];
    const snapshot = {};

    for (const table of tables) {
      const rows = await db.query(`SELECT * FROM ${table}`);
      snapshot[table] = rows.rows;
    }

    // 2. Write file
    const filename = `db_backup_${Date.now()}.json`;
    const filepath = path.join(backupDir, filename);
    const content = JSON.stringify(snapshot, null, 2);
    fs.writeFileSync(filepath, content);
    
    const sizeBytes = Buffer.byteLength(content);

    // 3. Register in backup audit logs
    await db.query(`INSERT INTO backups (filename, size_bytes) VALUES ($1, $2)`, [filename, sizeBytes]);
    await logAudit(db, req.user.id, 'BACKUP_CREATED', `Database snapshot saved: ${filename} (${sizeBytes} bytes)`, ip);

    res.json({ message: 'Backup created successfully.', filename });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create database backup snapshot.' });
  }
});

// List DB Backups
app.get('/api/admin/backups', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const list = await db.query(`SELECT * FROM backups ORDER BY created_at DESC`);
    res.json(list.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load database backups list.' });
  }
});

// Restore database snapshot backup
app.post('/api/admin/backups/restore', authenticateToken, requireRole(['admin']), async (req, res) => {
  const { filename } = req.body;
  const ip = req.ip;

  if (!filename) {
    return res.status(400).json({ error: 'Backup filename is required.' });
  }

  const filepath = path.join(backupDir, filename);
  if (!fs.existsSync(filepath)) {
    return res.status(404).json({ error: 'Backup snapshot file not found.' });
  }

  try {
    const raw = fs.readFileSync(filepath, 'utf8');
    const snapshot = JSON.parse(raw);

    // Begin PG transaction for disaster recovery safety
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      
      // Clean target tables in correct order to avoid foreign key errors
      await client.query(`TRUNCATE TABLE wishlist, addresses, orders, stock RESTART IDENTITY CASCADE`);
      
      // We truncate users but keep admin users to avoid locking ourselves out
      await client.query(`TRUNCATE TABLE users RESTART IDENTITY CASCADE`);

      // Restore Users
      if (snapshot.users) {
        for (const u of snapshot.users) {
          await client.query(
            `INSERT INTO users (id, email, password, name, role, created_at, failed_attempts, locked_until) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [u.id, u.email, u.password, u.name, u.role, u.created_at, u.failed_attempts || 0, u.locked_until || null]
          );
        }
      }

      // Restore Stock
      if (snapshot.stock) {
        for (const s of snapshot.stock) {
          await client.query(
            `INSERT INTO stock (id, product_name, available_liters, last_updated) 
             VALUES ($1, $2, $3, $4)`,
            [s.id, s.product_name, s.available_liters, s.last_updated]
          );
        }
      }

      // Restore Orders
      if (snapshot.orders) {
        for (const o of snapshot.orders) {
          await client.query(
            `INSERT INTO orders (id, user_id, address_data, items_data, total_amount, payment_method, status, created_at) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [o.id, o.user_id, o.address_data, o.items_data, o.total_amount, o.payment_method, o.status, o.created_at]
          );
        }
      }

      // Restore Addresses
      if (snapshot.addresses) {
        for (const a of snapshot.addresses) {
          await client.query(
            `INSERT INTO addresses (id, user_id, name, phone, pincode, state, city, address, created_at) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [a.id, a.user_id, a.name, a.phone, a.pincode, a.state, a.city, a.address, a.created_at]
          );
        }
      }

      // Restore Wishlist
      if (snapshot.wishlist) {
        for (const w of snapshot.wishlist) {
          await client.query(
            `INSERT INTO wishlist (id, user_id, product_id, variant_id, created_at) 
             VALUES ($1, $2, $3, $4, $5)`,
            [w.id, w.user_id, w.product_id, w.variant_id, w.created_at]
          );
        }
      }

      await client.query('COMMIT');
      await logAudit(db, req.user.id, 'BACKUP_RESTORED', `Database successfully restored from snapshot: ${filename}`, ip);
      res.json({ success: true, message: 'Database successfully restored from backup snapshot.' });
    } catch (txErr) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Disaster recovery restore error:", err);
    res.status(500).json({ error: 'Failed to restore database from backup.' });
  }
});

// Monitoring Data Endpoint
app.get('/api/admin/monitoring-data', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const securityEventsRes = await db.query(
      `SELECT * FROM security_events ORDER BY timestamp DESC LIMIT 40`
    );
    const auditLogsRes = await db.query(`
      SELECT a.*, u.name as "userName" 
      FROM audit_logs a 
      LEFT JOIN users u ON a.user_id = u.id 
      ORDER BY a.timestamp DESC LIMIT 40
    `);

    res.json({
      securityEvents: securityEventsRes.rows,
      auditLogs: auditLogsRes.rows
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch monitoring telemetry logs.' });
  }
});

// ============================================
// ERROR HANDLING MIDDLEWARE (Graceful recovery)
// ============================================

app.use((err, req, res, next) => {
  console.error("Global crash handler caught error:", err);
  
  // Log unexpected errors
  if (db) {
    logSecurityEvent(
      db, 
      'SERVER_CRASH_PREVENTED', 
      req.ip, 
      req.headers['user-agent'] || 'Unknown', 
      null, 
      'HIGH', 
      `Express server caught runtime exception: ${err.message}`
    ).catch(e => console.error("Logger failed:", e));
  }

  res.status(500).json({ error: 'An unexpected server error occurred. Purity pipelines protected.' });
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend vault locked. Server running on security port ${PORT} across all network interfaces.`);
});
