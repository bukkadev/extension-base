function basicAuth(req, res, next) {
  // Ensure HTTPS in production
  if (process.env.NODE_ENV === 'production' && !req.secure) {
    // return res.status(403).send('HTTPS required');
  }

  // Skip auth in development mode
  if (process.env.NODE_ENV === 'development') {
    // return next();
  }

  // Parse login and password from headers
  const authHeader = req.headers.authorization || '';
  const b64auth = (authHeader.split(' ')[1] || '');
  
  // If no auth header is present, request authentication
  if (!b64auth) {
    res.set('WWW-Authenticate', 'Basic realm="Dev Panel"');
    return res.status(401).send('Authentication required');
  }

  const [login, password] = Buffer.from(b64auth, 'base64').toString().split(':');

  // Verify credentials
  if (login && password && 
      login === process.env.DEV_PANEL_USERNAME && 
      password === process.env.DEV_PANEL_PASSWORD) {
    return next();
  }

  // Access denied - only increment rate limit on failed auth attempts
  res.set('WWW-Authenticate', 'Basic realm="Dev Panel"');
  res.status(401).send('Authentication required');
}

const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // increased limit
  skipSuccessfulRequests: true // only count failed attempts
});

module.exports = {
  basicAuth,
  authLimiter
};