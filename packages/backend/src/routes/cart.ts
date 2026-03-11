import { Router } from 'express';
import { getDb } from '../db/connection.js';
import { v4 as uuid } from 'uuid';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

// Get cart with product details
router.get('/', (req, res) => {
  const items = getDb().prepare(`
    SELECT ci.*, p.name, p.slug, p.price, p.compare_price, p.images, p.stock, p.status
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.id
    WHERE ci.user_id = ?
    ORDER BY ci.created_at ASC
  `).all(req.user!.id);

  const subtotal = items.reduce((sum: number, i: any) => sum + i.price * i.quantity, 0);
  res.json({ items, subtotal, itemCount: items.reduce((c: number, i: any) => c + i.quantity, 0) });
});

// Add to cart
router.post('/', (req, res) => {
  const { product_id, quantity = 1 } = req.body;
  if (!product_id) return res.status(400).json({ error: 'product_id required' });

  const product = getDb().prepare('SELECT * FROM products WHERE id = ? AND status = ?').get(product_id, 'active') as any;
  if (!product) return res.status(404).json({ error: 'Product not found' });
  if (product.stock < quantity) return res.status(400).json({ error: 'Insufficient stock' });

  const existing = getDb().prepare('SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?').get(req.user!.id, product_id) as any;
  if (existing) {
    const newQty = existing.quantity + quantity;
    if (newQty > product.stock) return res.status(400).json({ error: 'Insufficient stock' });
    getDb().prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(newQty, existing.id);
  } else {
    getDb().prepare('INSERT INTO cart_items (id, user_id, product_id, quantity) VALUES (?, ?, ?, ?)').run(uuid(), req.user!.id, product_id, quantity);
  }

  res.json({ success: true });
});

// Update quantity
router.put('/:id', (req, res) => {
  const { quantity } = req.body;
  if (!quantity || quantity < 1) return res.status(400).json({ error: 'quantity must be >= 1' });

  const item = getDb().prepare('SELECT ci.*, p.stock FROM cart_items ci JOIN products p ON ci.product_id = p.id WHERE ci.id = ? AND ci.user_id = ?').get(req.params.id, req.user!.id) as any;
  if (!item) return res.status(404).json({ error: 'Cart item not found' });
  if (quantity > item.stock) return res.status(400).json({ error: 'Insufficient stock' });

  getDb().prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(quantity, req.params.id);
  res.json({ success: true });
});

// Remove from cart
router.delete('/:id', (req, res) => {
  getDb().prepare('DELETE FROM cart_items WHERE id = ? AND user_id = ?').run(req.params.id, req.user!.id);
  res.status(204).end();
});

// Clear cart
router.delete('/', (req, res) => {
  getDb().prepare('DELETE FROM cart_items WHERE user_id = ?').run(req.user!.id);
  res.status(204).end();
});

export default router;
