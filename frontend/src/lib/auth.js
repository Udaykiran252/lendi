import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'lendi-secret-key-2025';

export function verifyToken(request) {
  const auth = request.headers.get('authorization') || '';
  const token = auth.replace('Bearer ', '').trim();
  if (!token) return null;
  try { return jwt.verify(token, JWT_SECRET); } catch { return null; }
}

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}
