import { Router } from 'express';
import { getDb } from '../db/connection.js';
import { v4 as uuid } from 'uuid';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', (_req, res) => {
  const categories = getDb().prepare(`
    SELECT c.*, COUNT(p.id) as product_count
    FROM categories c
    LEFT JOIN products p ON p.category_id = c.id AND p.status = 'active'
    GROUP BY c.id
    ORDER BY c.sort_order ASC, c.name ASC
  `).all();
  res.json(categories);
});

router.get('/:slug', (req, res) => {
  const category = getDb().prepare('SELECT * FROM categories WHERE slug = ?').get(req.params.slug);
  if (!category) return res.status(404).json({ error: 'Category not found' });
  res.json(category);
});

router.post('/', requireAdmin, (req, res) => {
  const { name, slug, description, image } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  const id = uuid();
  const catSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  getDb().prepare('INSERT INTO categories (id, name, slug, description, image) VALUES (?, ?, ?, ?, ?)').run(id, name, catSlug, description || '', image || null);
  res.status(201).json(getDb().prepare('SELECT * FROM categories WHERE id = ?').get(id));
});

router.put('/:id', requireAdmin, (req, res) => {
  const { name, description, image } = req.body;
  getDb().prepare('UPDATE categories SET name=COALESCE(?,name), description=COALESCE(?,description), image=COALESCE(?,image) WHERE id=?').run(name, description, image, req.params.id);
  res.json(getDb().prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id));
});

router.delete('/:id', requireAdmin, (req, res) => {
  getDb().prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

export default router;
