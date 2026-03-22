const jwt = require('jsonwebtoken');

// Verify JWT token from Authorization header
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1]; // "Bearer <token>"
  if (!token) {
    return res.status(401).json({ error: 'Access denied. Invalid token format.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role, email }
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }
}

// Restrict to admin/librarian only
function adminOnly(req, res, next) {
  if (req.user.role !== 'admin' && req.user.role !== 'librarian') {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  next();
}

// Restrict to specific roles
function roleCheck(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions.' });
    }
    next();
  };
}

module.exports = { verifyToken, adminOnly, roleCheck };
