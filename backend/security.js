const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');

// Helper to log security events into the database
async function logSecurityEvent(db, eventType, ip, userAgent, email, severity, details) {
  try {
    if (!db) return;
    await db.query(
      `INSERT INTO security_events (event_type, ip_address, user_agent, email, severity, details) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [eventType, ip, userAgent, email || null, severity, details]
    );
  } catch (err) {
    console.error("Failed to log security event:", err);
  }
}

// Helper to log administrative audits into the database
async function logAudit(db, userId, action, details, ip) {
  try {
    if (!db) return;
    await db.query(
      `INSERT INTO audit_logs (user_id, action, details, ip_address) 
       VALUES ($1, $2, $3, $4)`,
      [userId || null, action, details, ip]
    );
  } catch (err) {
    console.error("Failed to log audit event:", err);
  }
}

// Input sanitization middleware: strips HTML/JS tags and checks for dangerous SQL keywords
const sanitizeInput = (req, res, next) => {
  const checkValue = (val) => {
    if (typeof val === 'string') {
      // 1. Strip HTML and script tags
      let clean = val.replace(/<[^>]*>?/gm, '');
      // Remove inline event handlers (onerror, onload, onclick)
      clean = clean.replace(/on\w+\s*=/gi, '');
      // Remove javascript: pseudo-protocol
      clean = clean.replace(/javascript:/gi, '');
      
      // 2. Block SQL injection signatures (detect patterns like OR '1'='1, UNION SELECT, etc.)
      const sqlInjectionPatterns = [
        /UNION\s+SELECT/i,
        /UNION\s+ALL\s+SELECT/i,
        /SELECT\s+.*\s+FROM/i,
        /INSERT\s+INTO/i,
        /DELETE\s+FROM/i,
        /DROP\s+TABLE/i,
        /UPDATE\s+.*\s+SET/i,
        /OR\s+['"]?\d+['"]?\s*=\s*['"]?\d+['"]?/i
      ];
      
      for (const pattern of sqlInjectionPatterns) {
        if (pattern.test(val)) {
          throw new Error("Potential malicious input detected (SQL injection/XSS).");
        }
      }
      return clean;
    } else if (typeof val === 'object' && val !== null) {
      for (const key in val) {
        val[key] = checkValue(val[key]);
      }
    }
    return val;
  };

  try {
    if (req.body) req.body = checkValue(req.body);
    if (req.query) req.query = checkValue(req.query);
    if (req.params) req.params = checkValue(req.params);
    next();
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

// Password complexity rules validator
const validatePasswordStrength = (password) => {
  if (password.length < 8) {
    return "Password must be at least 8 characters long.";
  }
  if (!/[a-z]/.test(password)) {
    return "Password must contain at least one lowercase letter.";
  }
  if (!/[A-Z]/.test(password)) {
    return "Password must contain at least one uppercase letter.";
  }
  if (!/\d/.test(password)) {
    return "Password must contain at least one number.";
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return "Password must contain at least one special character.";
  }
  return null;
};

// --- RATE LIMITERS ---

// General endpoint rate limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again after 15 minutes." }
});

// Authentication rate limiter (brute force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 authentication requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many authentication attempts. Please try again after 15 minutes." }
});

// Payment rate limiter
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many payment operations. Please try again later." }
});

// --- REQUEST THROTTLER ---
// Gradually slows down responses if an IP makes more than 50 requests in 15 minutes
const speedThrottler = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 50,
  delayMs: (hits) => (hits - 50) * 500, // Add 500ms delay per request above 50
  maxDelayMs: 5000
});

module.exports = {
  logSecurityEvent,
  logAudit,
  sanitizeInput,
  validatePasswordStrength,
  globalLimiter,
  authLimiter,
  paymentLimiter,
  speedThrottler
};
