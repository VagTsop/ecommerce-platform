import { Router } from 'express';
import { getDb } from '../db/connection.js';
import { v4 as uuid } from 'uuid';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Get reviews for a product
router.get('/product/:productId', (req, res) => {
  const reviews = getDb().prepare(`
    SELECT r.*, u.name as user_name
    FROM reviews r JOIN users u ON r.user_id = u.id
    WHERE r.product_id = ?
    ORDER BY r.created_at DESC
  `).all(req.params.productId);
  res.json(reviews);
});

// Create review
router.post('/', requireAuth, (req, res) => {
  const { product_id, rating, title, comment } = req.body;
  if (!product_id || !rating) return res.status(400).json({ error: 'product_id and rating required' });
  if (rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating must be 1-5' });

  // Check if already reviewed
  const existing = getDb().prepare('SELECT id FROM reviews WHERE user_id = ? AND product_id = ?').get(req.user!.id, product_id);
  if (existing) return res.status(409).json({ error: 'You already reviewed this product' });

  // Check if purchased
  const purchased = getDb().prepare(`
    SELECT 1 FROM orders o JOIN order_items oi ON o.id = oi.order_id
    WHERE o.user_id = ? AND oi.product_id = ? AND o.status IN ('delivered', 'shipped')
  `).get(req.user!.id, product_id);

  const id = uuid();
  getDb().prepare('INSERT INTO reviews (id, user_id, product_id, rating, title, comment, verified_purchase) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
    id, req.user!.id, product_id, rating, title || '', comment || '', purchased ? 1 : 0
  );

  // Update product rating
  getDb().prepare(`UPDATE products SET
    rating_avg = (SELECT AVG(rating) FROM reviews WHERE product_id = ?),
    rating_count = (SELECT COUNT(*) FROM reviews WHERE product_id = ?)
    WHERE id = ?`).run(product_id, product_id, product_id);

  const review = getDb().prepare('SELECT r.*, u.name as user_name FROM reviews r JOIN users u ON r.user_id = u.id WHERE r.id = ?').get(id);
  res.status(201).json(review);
});

// Delete own review
router.delete('/:id', requireAuth, (req, res) => {
  const review = getDb().prepare('SELECT * FROM reviews WHERE id = ? AND user_id = ?').get(req.params.id, req.user!.id) as any;
  if (!review) return res.status(404).json({ error: 'Review not found' });

  getDb().prepare('DELETE FROM reviews WHERE id = ?').run(req.params.id);

  // Update product rating
  getDb().prepare(`UPDATE products SET
    rating_avg = COALESCE((SELECT AVG(rating) FROM reviews WHERE product_id = ?), 0),
    rating_count = (SELECT COUNT(*) FROM reviews WHERE product_id = ?)
    WHERE id = ?`).run(review.product_id, review.product_id, review.product_id);

  res.status(204).end();
});

export default router;
