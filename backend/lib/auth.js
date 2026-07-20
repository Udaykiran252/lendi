const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'lendi-secret-key-2025';

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

function verifyToken(authHeader) {
  const token = (authHeader || '').replace('Bearer ', '').trim();
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

function authenticateToken(req, res, next) {
  const user = verifyToken(req.headers['authorization']);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  req.user = user;
  next();
}

module.exports = {
  signToken,
  verifyToken,
  authenticateToken,
};
