import { Router } from 'express';
import { getDb } from '../db/connection.js';
import { v4 as uuid } from 'uuid';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { CONFIG } from '../config.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.post('/register', (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) return res.status(400).json({ error: 'email, password, and name required' });

  const existing = getDb().prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.status(409).json({ error: 'Email already registered' });

  const id = uuid();
  const hash = bcrypt.hashSync(password, 10);
  getDb().prepare('INSERT INTO users (id, email, password, name) VALUES (?, ?, ?, ?)').run(id, email, hash, name);

  const token = jwt.sign({ userId: id }, CONFIG.jwtSecret, { expiresIn: CONFIG.jwtExpiresIn });
  const user = getDb().prepare('SELECT id, email, name, role, created_at FROM users WHERE id = ?').get(id);
  res.status(201).json({ token, user });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });

  const user = getDb().prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ userId: user.id }, CONFIG.jwtSecret, { expiresIn: CONFIG.jwtExpiresIn });
  const { password: _, ...safeUser } = user;
  res.json({ token, user: safeUser });
});

router.get('/me', requireAuth, (req, res) => {
  const user = getDb().prepare('SELECT id, email, name, role, phone, address_line1, address_line2, city, state, zip, country, avatar, created_at FROM users WHERE id = ?').get(req.user!.id);
  res.json(user);
});

router.put('/me', requireAuth, (req, res) => {
  const { name, phone, address_line1, address_line2, city, state, zip, country } = req.body;
  getDb().prepare(`UPDATE users SET name=COALESCE(?,name), phone=COALESCE(?,phone), address_line1=COALESCE(?,address_line1),
    address_line2=COALESCE(?,address_line2), city=COALESCE(?,city), state=COALESCE(?,state), zip=COALESCE(?,zip),
    country=COALESCE(?,country), updated_at=datetime('now') WHERE id=?`).run(name, phone, address_line1, address_line2, city, state, zip, country, req.user!.id);
  const user = getDb().prepare('SELECT id, email, name, role, phone, address_line1, address_line2, city, state, zip, country, avatar, created_at FROM users WHERE id = ?').get(req.user!.id);
  res.json(user);
});

// Admin: list users
router.get('/users', requireAdmin, (_req, res) => {
  const users = getDb().prepare('SELECT id, email, name, role, created_at FROM users ORDER BY created_at DESC').all();
  res.json(users);
});

// Admin: update user role
router.put('/users/:id/role', requireAdmin, (req, res) => {
  const { role } = req.body;
  if (!['customer', 'admin'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
  getDb().prepare('UPDATE users SET role = ?, updated_at = datetime(\'now\') WHERE id = ?').run(role, req.params.id);
  res.json({ success: true });
});

export default router;
