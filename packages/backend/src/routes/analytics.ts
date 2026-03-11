import { Router } from 'express';
import { getDb } from '../db/connection.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();
router.use(requireAdmin);

router.get('/dashboard', (_req, res) => {
  const db = getDb();
  const totalProducts = (db.prepare("SELECT COUNT(*) as c FROM products WHERE status = 'active'").get() as any).c;
  const totalOrders = (db.prepare('SELECT COUNT(*) as c FROM orders').get() as any).c;
  const totalUsers = (db.prepare('SELECT COUNT(*) as c FROM users').get() as any).c;
  const totalRevenue = (db.prepare("SELECT COALESCE(SUM(total), 0) as s FROM orders WHERE payment_status = 'paid'").get() as any).s;

  const recentOrders = db.prepare(`SELECT o.*, u.name as customer_name FROM orders o JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC LIMIT 5`).all();

  const ordersByStatus = db.prepare(`SELECT status, COUNT(*) as count FROM orders GROUP BY status`).all();

  const topProducts = db.prepare(`
    SELECT p.name, p.images, SUM(oi.quantity) as total_sold, SUM(oi.total) as total_revenue
    FROM order_items oi JOIN products p ON oi.product_id = p.id
    GROUP BY oi.product_id ORDER BY total_sold DESC LIMIT 5
  `).all();

  const lowStock = db.prepare("SELECT id, name, stock, images FROM products WHERE stock < 10 AND status = 'active' ORDER BY stock ASC LIMIT 10").all();

  res.json({ totalProducts, totalOrders, totalUsers, totalRevenue, recentOrders, ordersByStatus, topProducts, lowStock });
});

export default router;
