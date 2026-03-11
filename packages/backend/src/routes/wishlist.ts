import { Router } from 'express';
import { getDb } from '../db/connection.js';
import { v4 as uuid } from 'uuid';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', (req, res) => {
  const items = getDb().prepare(`
    SELECT w.id, w.created_at, p.id as product_id, p.name, p.slug, p.price, p.compare_price, p.images, p.stock, p.rating_avg, p.rating_count
    FROM wishlist w JOIN products p ON w.product_id = p.id
    WHERE w.user_id = ? AND p.status = 'active'
    ORDER BY w.created_at DESC
  `).all(req.user!.id);
  res.json(items);
});

router.post('/', (req, res) => {
  const { product_id } = req.body;
  if (!product_id) return res.status(400).json({ error: 'product_id required' });

  const existing = getDb().prepare('SELECT id FROM wishlist WHERE user_id = ? AND product_id = ?').get(req.user!.id, product_id);
  if (existing) return res.status(409).json({ error: 'Already in wishlist' });

  const id = uuid();
  getDb().prepare('INSERT INTO wishlist (id, user_id, product_id) VALUES (?, ?, ?)').run(id, req.user!.id, product_id);
  res.status(201).json({ id, product_id });
});

router.delete('/:productId', (req, res) => {
  getDb().prepare('DELETE FROM wishlist WHERE user_id = ? AND product_id = ?').run(req.user!.id, req.params.productId);
  res.status(204).end();
});

export default router;
