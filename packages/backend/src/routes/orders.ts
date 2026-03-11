import { Router } from 'express';
import { getDb } from '../db/connection.js';
import { v4 as uuid } from 'uuid';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Customer: list own orders
router.get('/', requireAuth, (req, res) => {
  const orders = getDb().prepare(`SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC`).all(req.user!.id);
  for (const order of orders as any[]) {
    order.items = getDb().prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
  }
  res.json(orders);
});

// Customer: get single order
router.get('/:id', requireAuth, (req, res) => {
  const order = getDb().prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(req.params.id, req.user!.id) as any;
  if (!order) return res.status(404).json({ error: 'Order not found' });
  order.items = getDb().prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
  res.json(order);
});

// Create order from cart (or direct checkout)
router.post('/', requireAuth, (req, res) => {
  const { shipping_name, shipping_line1, shipping_line2, shipping_city, shipping_state, shipping_zip, shipping_country, notes, coupon_code } = req.body;

  // Get cart items
  const cartItems = getDb().prepare(`
    SELECT ci.*, p.name, p.price, p.images, p.stock
    FROM cart_items ci JOIN products p ON ci.product_id = p.id
    WHERE ci.user_id = ? AND p.status = 'active'
  `).all(req.user!.id) as any[];

  if (cartItems.length === 0) return res.status(400).json({ error: 'Cart is empty' });

  // Validate stock
  for (const item of cartItems) {
    if (item.quantity > item.stock) {
      return res.status(400).json({ error: `Insufficient stock for ${item.name}` });
    }
  }

  const subtotal = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  let discount = 0;

  // Apply coupon
  if (coupon_code) {
    const coupon = getDb().prepare('SELECT * FROM coupons WHERE code = ? AND active = 1').get(coupon_code) as any;
    if (coupon && subtotal >= coupon.min_order && (!coupon.max_uses || coupon.used_count < coupon.max_uses)) {
      discount = coupon.type === 'percentage' ? subtotal * (coupon.value / 100) : coupon.value;
      getDb().prepare('UPDATE coupons SET used_count = used_count + 1 WHERE id = ?').run(coupon.id);
    }
  }

  const tax = Math.round((subtotal - discount) * 0.08 * 100) / 100; // 8% tax
  const shipping = subtotal >= 100 ? 0 : 9.99; // Free shipping over $100
  const total = Math.round((subtotal - discount + tax + shipping) * 100) / 100;

  const orderId = uuid();
  getDb().prepare(`INSERT INTO orders (id, user_id, status, subtotal, tax, shipping, total,
    shipping_name, shipping_line1, shipping_line2, shipping_city, shipping_state, shipping_zip, shipping_country, notes, payment_status)
    VALUES (?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'paid')`).run(
    orderId, req.user!.id, subtotal - discount, tax, shipping, total,
    shipping_name || '', shipping_line1 || '', shipping_line2 || '',
    shipping_city || '', shipping_state || '', shipping_zip || '', shipping_country || 'US', notes || ''
  );

  // Create order items and update stock
  const insertItem = getDb().prepare('INSERT INTO order_items (id, order_id, product_id, product_name, product_image, price, quantity, total) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  const updateStock = getDb().prepare('UPDATE products SET stock = stock - ? WHERE id = ?');

  for (const item of cartItems) {
    const images = JSON.parse(item.images || '[]');
    insertItem.run(uuid(), orderId, item.product_id, item.name, images[0] || '', item.price, item.quantity, item.price * item.quantity);
    updateStock.run(item.quantity, item.product_id);
  }

  // Clear cart
  getDb().prepare('DELETE FROM cart_items WHERE user_id = ?').run(req.user!.id);

  const order = getDb().prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as any;
  order.items = getDb().prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId);
  res.status(201).json(order);
});

// Admin: list all orders
router.get('/admin/all', requireAdmin, (req, res) => {
  const { status, page = '1', limit = '20' } = req.query;
  let where = '';
  const params: any[] = [];
  if (status) { where = 'WHERE o.status = ?'; params.push(status); }

  const lim = Number(limit) || 20;
  const offset = (Math.max(Number(page) || 1, 1) - 1) * lim;

  const total = (getDb().prepare(`SELECT COUNT(*) as c FROM orders o ${where}`).get(...params) as any).c;
  const orders = getDb().prepare(`SELECT o.*, u.name as customer_name, u.email as customer_email
    FROM orders o JOIN users u ON o.user_id = u.id ${where}
    ORDER BY o.created_at DESC LIMIT ? OFFSET ?`).all(...params, lim, offset);

  for (const order of orders as any[]) {
    order.items = getDb().prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
  }

  res.json({ orders, total, page: Number(page), pages: Math.ceil(total / lim) });
});

// Admin: update order status
router.put('/:id/status', requireAdmin, (req, res) => {
  const { status } = req.body;
  if (!['pending', 'processing', 'shipped', 'delivered', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  getDb().prepare("UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, req.params.id);
  const order = getDb().prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id) as any;
  if (order) order.items = getDb().prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
  res.json(order);
});

export default router;
