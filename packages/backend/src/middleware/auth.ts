import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { CONFIG } from '../config.js';
import { getDb } from '../db/connection.js';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Authentication required' });

  try {
    const payload = jwt.verify(header.slice(7), CONFIG.jwtSecret) as any;
    const user = getDb().prepare('SELECT id, email, name, role FROM users WHERE id = ?').get(payload.userId) as AuthUser | undefined;
    if (!user) return res.status(401).json({ error: 'User not found' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    next();
  });
}

export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return next();
  try {
    const payload = jwt.verify(header.slice(7), CONFIG.jwtSecret) as any;
    const user = getDb().prepare('SELECT id, email, name, role FROM users WHERE id = ?').get(payload.userId) as AuthUser | undefined;
    if (user) req.user = user;
  } catch {}
  next();
}
