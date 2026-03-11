import { Router } from 'express';
import { getDb } from '../db/connection.js';
import { v4 as uuid } from 'uuid';
import { requireAdmin, optionalAuth } from '../middleware/auth.js';

const router = Router();

// Public: list products with filtering, sorting, pagination
router.get('/', optionalAuth, (req, res) => {
  const { category, search, sort, order, page = '1', limit = '12', featured, min_price, max_price } = req.query;
  let where = "WHERE p.status = 'active'";
  const params: any[] = [];

  if (category) { where += ' AND c.slug = ?'; params.push(category); }
  if (search) { where += ' AND (p.name LIKE ? OR p.description LIKE ? OR p.tags LIKE ?)'; const s = `%${search}%`; params.push(s, s, s); }
  if (featured === '1') { where += ' AND p.featured = 1'; }
  if (min_price) { where += ' AND p.price >= ?'; params.push(Number(min_price)); }
  if (max_price) { where += ' AND p.price <= ?'; params.push(Number(max_price)); }

  const sortMap: Record<string, string> = {
    price: 'p.price', price_desc: 'p.price', name: 'p.name', newest: 'p.created_at', rating: 'p.rating_avg', popular: 'p.rating_count',
  };
  const sortCol = sortMap[sort as string] || 'p.created_at';
  const sortDir = sort === 'price' ? 'ASC' : sort === 'price_desc' ? 'DESC' : order === 'asc' ? 'ASC' : 'DESC';
  const lim = Math.min(Number(limit) || 12, 50);
  const offset = (Math.max(Number(page) || 1, 1) - 1) * lim;

  const countSql = `SELECT COUNT(*) as total FROM products p LEFT JOIN categories c ON p.category_id = c.id ${where}`;
  const total = (getDb().prepare(countSql).get(...params) as any).total;

  const sql = `SELECT p.*, c.name as category_name, c.slug as category_slug FROM products p LEFT JOIN categories c ON p.category_id = c.id ${where} ORDER BY ${sortCol} ${sortDir} LIMIT ? OFFSET ?`;
  const products = getDb().prepare(sql).all(...params, lim, offset);

  res.json({ products, total, page: Number(page), pages: Math.ceil(total / lim) });
});

// Public: get single product
router.get('/:slug', optionalAuth, (req, res) => {
  const product = getDb().prepare('SELECT p.*, c.name as category_name, c.slug as category_slug FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.slug = ?').get(req.params.slug);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const reviews = getDb().prepare(`SELECT r.*, u.name as user_name FROM reviews r JOIN users u ON r.user_id = u.id WHERE r.product_id = ? ORDER BY r.created_at DESC`).all((product as any).id);
  const relatedProducts = getDb().prepare(`SELECT * FROM products WHERE category_id = ? AND id != ? AND status = 'active' ORDER BY rating_avg DESC LIMIT 4`).all((product as any).category_id, (product as any).id);

  res.json({ ...product as any, reviews, relatedProducts });
});

// Admin: create product
router.post('/', requireAdmin, (req, res) => {
  const { name, slug, description, price, compare_price, cost, sku, stock, category_id, images, featured, tags, weight, dimensions } = req.body;
  if (!name || !price) return res.status(400).json({ error: 'name and price required' });

  const id = uuid();
  const productSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  getDb().prepare(`INSERT INTO products (id, name, slug, description, price, compare_price, cost, sku, stock, category_id, images, featured, tags, weight, dimensions)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    id, name, productSlug, description || '', price, compare_price || null, cost || null, sku || `SKU-${Date.now()}`,
    stock || 0, category_id || null, JSON.stringify(images || []), featured ? 1 : 0, JSON.stringify(tags || []), weight || null, dimensions || null
  );
  res.status(201).json(getDb().prepare('SELECT * FROM products WHERE id = ?').get(id));
});

// Admin: update product
router.put('/:id', requireAdmin, (req, res) => {
  const { name, description, price, compare_price, cost, stock, category_id, images, featured, status, tags } = req.body;
  const product = getDb().prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  getDb().prepare(`UPDATE products SET name=COALESCE(?,name), description=COALESCE(?,description), price=COALESCE(?,price),
    compare_price=?, cost=?, stock=COALESCE(?,stock), category_id=COALESCE(?,category_id),
    images=COALESCE(?,images), featured=COALESCE(?,featured), status=COALESCE(?,status),
    tags=COALESCE(?,tags), updated_at=datetime('now') WHERE id=?`).run(
    name, description, price, compare_price ?? null, cost ?? null, stock, category_id, images ? JSON.stringify(images) : null,
    featured !== undefined ? (featured ? 1 : 0) : null, status, tags ? JSON.stringify(tags) : null, req.params.id
  );
  res.json(getDb().prepare('SELECT * FROM products WHERE id = ?').get(req.params.id));
});

// Admin: delete product
router.delete('/:id', requireAdmin, (req, res) => {
  getDb().prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

export default router;
