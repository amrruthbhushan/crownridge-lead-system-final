import jwt from 'jsonwebtoken';
import prisma from '../services/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'crownridge-super-secret-security-key-2026';

/**
 * Authentication check middleware
 */
export async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Fetch user from DB to verify they still exist and check latest role
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'User no longer exists' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('JWT Verification Error:', error);
    return res.status(403).json({ error: 'Invalid or expired access token' });
  }
}

/**
 * Role authorization guard middleware
 */
export function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: User authentication required' });
    }

    const hasRole = allowedRoles.includes(req.user.role);
    if (!hasRole) {
      return res.status(403).json({ 
        error: `Forbidden: This resource requires one of the following roles: [${allowedRoles.join(', ')}]. Current role: ${req.user.role}` 
      });
    }

    next();
  };
}
