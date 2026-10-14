import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getDb, enrichUser } from './db';
import { User, UserRole } from './types';

const JWT_SECRET = process.env.JWT_SECRET || 'buildrex-super-secure-enterprise-jwt-key-2026';
const TOKEN_EXPIRY = '7d';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export function generateToken(user: User): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      employee_code: user.employee_code,
    },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
}

export function verifyToken(token: string): { id: string; email: string; role: UserRole } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: UserRole };
  } catch {
    return null;
  }
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  let token = req.cookies?.buildrex_token;

  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      token = parts[1];
    }
  }

  if (!token) {
    res.status(401).json({ success: false, message: 'Authentication required. Please sign in.' });
    return;
  }

  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ success: false, message: 'Invalid or expired session. Please sign in again.' });
    return;
  }

  const db = getDb();
  const user = db.users.find((u) => u.id === payload.id);

  if (!user || user.status === 'inactive') {
    res.status(401).json({ success: false, message: 'User account is inactive or not found.' });
    return;
  }

  req.user = enrichUser(user);
  next();
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized. Sign in required.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Forbidden. You do not have permissions to access this administrative resource.`,
      });
      return;
    }

    next();
  };
}
