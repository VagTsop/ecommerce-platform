import { getDb } from './connection.js';
import { v4 as uuid } from 'uuid';
import bcrypt from 'bcryptjs';

export function initSchema() {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'customer',
      avatar TEXT,
      phone TEXT,
      address_line1 TEXT,
      address_line2 TEXT,
      city TEXT,
      state TEXT,
      zip TEXT,
      country TEXT DEFAULT 'US',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      image TEXT,
      parent_id TEXT REFERENCES categories(id),
      sort_order INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      compare_price REAL,
      cost REAL,
      sku TEXT UNIQUE,
      stock INTEGER NOT NULL DEFAULT 0,
      category_id TEXT REFERENCES categories(id),
      images TEXT DEFAULT '[]',
      featured INTEGER DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'active',
      rating_avg REAL DEFAULT 0,
      rating_count INTEGER DEFAULT 0,
      tags TEXT DEFAULT '[]',
      weight REAL,
      dimensions TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      status TEXT NOT NULL DEFAULT 'pending',
      subtotal REAL NOT NULL,
      tax REAL NOT NULL DEFAULT 0,
      shipping REAL NOT NULL DEFAULT 0,
      total REAL NOT NULL,
      shipping_name TEXT,
      shipping_line1 TEXT,
      shipping_line2 TEXT,
      shipping_city TEXT,
      shipping_state TEXT,
      shipping_zip TEXT,
      shipping_country TEXT DEFAULT 'US',
      payment_intent_id TEXT,
      payment_status TEXT DEFAULT 'unpaid',
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL REFERENCES products(id),
      product_name TEXT NOT NULL,
      product_image TEXT,
      price REAL NOT NULL,
      quantity INTEGER NOT NULL,
      total REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cart_items (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      quantity INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, product_id)
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      title TEXT,
      comment TEXT,
      verified_purchase INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, product_id)
    );

    CREATE TABLE IF NOT EXISTS wishlist (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, product_id)
    );

    CREATE TABLE IF NOT EXISTS coupons (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      type TEXT NOT NULL DEFAULT 'percentage',
      value REAL NOT NULL,
      min_order REAL DEFAULT 0,
      max_uses INTEGER,
      used_count INTEGER DEFAULT 0,
      expires_at TEXT,
      active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
    CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
    CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured);
    CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
    CREATE INDEX IF NOT EXISTS idx_cart_items_user ON cart_items(user_id);
    CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
    CREATE INDEX IF NOT EXISTS idx_wishlist_user ON wishlist(user_id);
  `);

  seedData();
}

function seedData() {
  const db = getDb();

  // Check if already seeded
  const userCount = (db.prepare('SELECT COUNT(*) as c FROM users').get() as any).c;
  if (userCount > 0) return;

  // Seed users
  const adminId = uuid();
  const customerId = uuid();
  const customer2Id = uuid();
  const hash = bcrypt.hashSync('password123', 10);

  db.prepare('INSERT INTO users (id, email, password, name, role) VALUES (?, ?, ?, ?, ?)').run(adminId, 'admin@shophub.com', hash, 'Admin User', 'admin');
  db.prepare('INSERT INTO users (id, email, password, name, role, address_line1, city, state, zip) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(customerId, 'demo@shophub.com', hash, 'Demo Customer', 'customer', '123 Main St', 'New York', 'NY', '10001');
  db.prepare('INSERT INTO users (id, email, password, name, role) VALUES (?, ?, ?, ?, ?)').run(customer2Id, 'jane@shophub.com', hash, 'Jane Smith', 'customer');

  // Seed categories
  const categories = [
    { name: 'Electronics', slug: 'electronics', desc: 'Smartphones, laptops, gadgets and more', img: 'https://picsum.photos/seed/electronics/400/300' },
    { name: 'Clothing', slug: 'clothing', desc: 'Fashion for men, women and kids', img: 'https://picsum.photos/seed/clothing/400/300' },
    { name: 'Home & Garden', slug: 'home-garden', desc: 'Furniture, decor and garden essentials', img: 'https://picsum.photos/seed/homegarden/400/300' },
    { name: 'Sports & Outdoors', slug: 'sports-outdoors', desc: 'Equipment for every sport and adventure', img: 'https://picsum.photos/seed/sports/400/300' },
    { name: 'Books', slug: 'books', desc: 'Bestsellers, fiction, non-fiction and more', img: 'https://picsum.photos/seed/books/400/300' },
    { name: 'Beauty & Health', slug: 'beauty-health', desc: 'Skincare, wellness and personal care', img: 'https://picsum.photos/seed/beauty/400/300' },
  ];

  const catIds: Record<string, string> = {};
  for (const cat of categories) {
    const id = uuid();
    catIds[cat.slug] = id;
    db.prepare('INSERT INTO categories (id, name, slug, description, image) VALUES (?, ?, ?, ?, ?)').run(id, cat.name, cat.slug, cat.desc, cat.img);
  }

  // Seed products (30 products across categories)
  const products = [
    // Electronics
    { name: 'Wireless Noise-Canceling Headphones', slug: 'wireless-nc-headphones', desc: 'Premium over-ear headphones with active noise cancellation, 30-hour battery life, and Hi-Res audio support. Perfect for music lovers and commuters.', price: 249.99, compare: 349.99, stock: 45, cat: 'electronics', featured: 1, tags: ['wireless', 'audio', 'noise-canceling'], img: 101 },
    { name: 'Ultra-Slim Laptop 15"', slug: 'ultra-slim-laptop-15', desc: 'Powerful and lightweight laptop with M-series chip, 16GB RAM, 512GB SSD, and stunning Retina display. Ideal for professionals.', price: 1299.99, compare: 1499.99, stock: 20, cat: 'electronics', featured: 1, tags: ['laptop', 'computer', 'portable'], img: 102 },
    { name: 'Smart Watch Pro', slug: 'smart-watch-pro', desc: 'Advanced smartwatch with health monitoring, GPS, always-on display, and 5-day battery life. Water resistant to 50m.', price: 399.99, compare: null, stock: 60, cat: 'electronics', featured: 1, tags: ['wearable', 'fitness', 'smart'], img: 103 },
    { name: '4K Webcam with Ring Light', slug: '4k-webcam-ring-light', desc: 'Professional-grade webcam with built-in ring light, auto-focus, and noise-reducing microphone. Perfect for streaming and video calls.', price: 89.99, compare: 129.99, stock: 100, cat: 'electronics', featured: 0, tags: ['webcam', 'streaming', 'video'], img: 104 },
    { name: 'Portable Bluetooth Speaker', slug: 'portable-bt-speaker', desc: 'Waterproof portable speaker with 360° sound, 20-hour battery, and built-in power bank. Take your music anywhere.', price: 79.99, compare: null, stock: 150, cat: 'electronics', featured: 0, tags: ['speaker', 'bluetooth', 'portable'], img: 105 },

    // Clothing
    { name: 'Premium Cotton T-Shirt', slug: 'premium-cotton-tshirt', desc: 'Ultra-soft 100% organic cotton t-shirt with a relaxed fit. Pre-shrunk and fade-resistant. Available in 12 colors.', price: 34.99, compare: null, stock: 200, cat: 'clothing', featured: 1, tags: ['cotton', 'casual', 'basics'], img: 201 },
    { name: 'Slim Fit Chino Pants', slug: 'slim-fit-chinos', desc: 'Classic chino pants with a modern slim fit. Stretch fabric for all-day comfort. Perfect for work or weekend.', price: 59.99, compare: 79.99, stock: 120, cat: 'clothing', featured: 0, tags: ['pants', 'casual', 'work'], img: 202 },
    { name: 'Waterproof Winter Jacket', slug: 'waterproof-winter-jacket', desc: 'Insulated winter jacket with waterproof shell, sealed seams, and adjustable hood. Rated for -20°F temperatures.', price: 189.99, compare: 249.99, stock: 40, cat: 'clothing', featured: 1, tags: ['jacket', 'winter', 'waterproof'], img: 203 },
    { name: 'Running Shoes Ultra', slug: 'running-shoes-ultra', desc: 'Lightweight running shoes with responsive cushioning, breathable mesh upper, and rubber outsole. Designed for long-distance runners.', price: 129.99, compare: null, stock: 80, cat: 'clothing', featured: 0, tags: ['shoes', 'running', 'athletic'], img: 204 },
    { name: 'Merino Wool Sweater', slug: 'merino-wool-sweater', desc: 'Premium merino wool crew neck sweater. Naturally temperature-regulating, breathable, and odor-resistant.', price: 89.99, compare: 119.99, stock: 65, cat: 'clothing', featured: 0, tags: ['sweater', 'wool', 'winter'], img: 205 },

    // Home & Garden
    { name: 'Ergonomic Office Chair', slug: 'ergonomic-office-chair', desc: 'Fully adjustable ergonomic chair with lumbar support, breathable mesh back, and 4D armrests. Supports up to 300 lbs.', price: 449.99, compare: 599.99, stock: 25, cat: 'home-garden', featured: 1, tags: ['furniture', 'office', 'ergonomic'], img: 301 },
    { name: 'Smart LED Light Bulbs (4-Pack)', slug: 'smart-led-bulbs-4pack', desc: 'WiFi-enabled color-changing LED bulbs. Control with your voice or app. 16 million colors and schedules.', price: 39.99, compare: null, stock: 200, cat: 'home-garden', featured: 0, tags: ['smart-home', 'lighting', 'led'], img: 302 },
    { name: 'Stainless Steel Cookware Set', slug: 'stainless-cookware-set', desc: '10-piece professional cookware set with tri-ply stainless steel construction. Oven-safe to 500°F. Dishwasher safe.', price: 299.99, compare: 449.99, stock: 30, cat: 'home-garden', featured: 1, tags: ['kitchen', 'cookware', 'stainless'], img: 303 },
    { name: 'Robot Vacuum Cleaner', slug: 'robot-vacuum-cleaner', desc: 'Smart robot vacuum with LiDAR navigation, auto-empty base, and mopping function. Works with Alexa and Google Home.', price: 349.99, compare: null, stock: 35, cat: 'home-garden', featured: 0, tags: ['cleaning', 'smart-home', 'robot'], img: 304 },
    { name: 'Indoor Herb Garden Kit', slug: 'indoor-herb-garden-kit', desc: 'Hydroponic indoor garden with LED grow lights. Grow 6 herbs simultaneously. Seeds and nutrients included.', price: 69.99, compare: 89.99, stock: 90, cat: 'home-garden', featured: 0, tags: ['garden', 'herbs', 'indoor'], img: 305 },

    // Sports & Outdoors
    { name: 'Yoga Mat Premium', slug: 'yoga-mat-premium', desc: 'Extra thick 6mm yoga mat with alignment lines. Non-slip surface, eco-friendly TPE material. Includes carrying strap.', price: 49.99, compare: null, stock: 150, cat: 'sports-outdoors', featured: 0, tags: ['yoga', 'fitness', 'mat'], img: 401 },
    { name: 'Adjustable Dumbbell Set', slug: 'adjustable-dumbbell-set', desc: 'Space-saving adjustable dumbbells from 5-52.5 lbs each. Quick-change weight system. Replaces 15 pairs of dumbbells.', price: 349.99, compare: 449.99, stock: 20, cat: 'sports-outdoors', featured: 1, tags: ['weights', 'fitness', 'strength'], img: 402 },
    { name: 'Ultralight Camping Tent', slug: 'ultralight-camping-tent', desc: '2-person backpacking tent weighing only 3.5 lbs. Waterproof, wind-resistant, and sets up in under 5 minutes.', price: 199.99, compare: null, stock: 40, cat: 'sports-outdoors', featured: 1, tags: ['camping', 'tent', 'outdoor'], img: 403 },
    { name: 'Cycling Computer GPS', slug: 'cycling-computer-gps', desc: 'Advanced bike computer with color display, GPS/GLONASS, heart rate monitor, and power meter compatibility.', price: 249.99, compare: 299.99, stock: 55, cat: 'sports-outdoors', featured: 0, tags: ['cycling', 'gps', 'fitness'], img: 404 },
    { name: 'Resistance Bands Set', slug: 'resistance-bands-set', desc: 'Complete set of 5 resistance bands with handles, door anchor, and ankle straps. Perfect for home workouts.', price: 29.99, compare: null, stock: 300, cat: 'sports-outdoors', featured: 0, tags: ['fitness', 'bands', 'home-workout'], img: 405 },

    // Books
    { name: 'The Art of Clean Code', slug: 'art-of-clean-code', desc: 'A practical guide to writing maintainable, readable, and efficient code. Covers design patterns, refactoring, and best practices.', price: 39.99, compare: null, stock: 100, cat: 'books', featured: 1, tags: ['programming', 'software', 'coding'], img: 501 },
    { name: 'Startup Playbook', slug: 'startup-playbook', desc: 'From idea to IPO - a comprehensive guide to building and scaling startups. Includes case studies from 50+ successful founders.', price: 29.99, compare: null, stock: 80, cat: 'books', featured: 0, tags: ['business', 'startup', 'entrepreneurship'], img: 502 },
    { name: 'Mindful Leadership', slug: 'mindful-leadership', desc: 'Transform your leadership style with mindfulness techniques. Backed by neuroscience research and real-world examples.', price: 24.99, compare: 34.99, stock: 60, cat: 'books', featured: 0, tags: ['leadership', 'mindfulness', 'business'], img: 503 },
    { name: 'The Galaxy Beyond', slug: 'the-galaxy-beyond', desc: 'A gripping sci-fi novel about humanity\'s first contact with an alien civilization. Award-winning author\'s latest masterpiece.', price: 16.99, compare: null, stock: 200, cat: 'books', featured: 1, tags: ['fiction', 'sci-fi', 'novel'], img: 504 },
    { name: 'Cooking for Engineers', slug: 'cooking-for-engineers', desc: 'A systematic approach to cooking with precise measurements, temperatures, and timing. 200+ recipes explained with science.', price: 34.99, compare: 44.99, stock: 70, cat: 'books', featured: 0, tags: ['cooking', 'food', 'science'], img: 505 },

    // Beauty & Health
    { name: 'Vitamin C Serum', slug: 'vitamin-c-serum', desc: 'Professional-grade 20% Vitamin C serum with hyaluronic acid and Vitamin E. Brightens, firms, and protects skin.', price: 28.99, compare: null, stock: 180, cat: 'beauty-health', featured: 1, tags: ['skincare', 'serum', 'anti-aging'], img: 601 },
    { name: 'Electric Toothbrush Pro', slug: 'electric-toothbrush-pro', desc: 'Sonic toothbrush with 5 cleaning modes, pressure sensor, smart timer, and 30-day battery. Includes 4 brush heads.', price: 79.99, compare: 99.99, stock: 100, cat: 'beauty-health', featured: 0, tags: ['dental', 'electric', 'hygiene'], img: 602 },
    { name: 'Organic Essential Oils Set', slug: 'organic-essential-oils-set', desc: 'Set of 8 USDA certified organic essential oils. Includes lavender, peppermint, eucalyptus, tea tree, and more.', price: 44.99, compare: null, stock: 120, cat: 'beauty-health', featured: 0, tags: ['aromatherapy', 'organic', 'wellness'], img: 603 },
    { name: 'Hair Dryer with Ionic Technology', slug: 'ionic-hair-dryer', desc: 'Professional salon hair dryer with ionic technology for faster drying and reduced frizz. 3 heat settings and cold shot.', price: 59.99, compare: 89.99, stock: 75, cat: 'beauty-health', featured: 1, tags: ['hair', 'styling', 'salon'], img: 604 },
    { name: 'Fitness Tracker Band', slug: 'fitness-tracker-band', desc: 'Slim fitness tracker with heart rate, sleep tracking, SpO2 sensor, and 14-day battery life. Water resistant.', price: 49.99, compare: null, stock: 200, cat: 'beauty-health', featured: 0, tags: ['fitness', 'tracker', 'health'], img: 605 },
  ];

  const insertProduct = db.prepare(`
    INSERT INTO products (id, name, slug, description, price, compare_price, stock, category_id, images, featured, tags, sku)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const productIds: string[] = [];
  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const id = uuid();
    productIds.push(id);
    const images = JSON.stringify([
      `https://picsum.photos/seed/product${p.img}/600/600`,
      `https://picsum.photos/seed/product${p.img}b/600/600`,
      `https://picsum.photos/seed/product${p.img}c/600/600`,
    ]);
    const sku = `SKU-${String(i + 1).padStart(4, '0')}`;
    insertProduct.run(id, p.name, p.slug, p.desc, p.price, p.compare, p.stock, catIds[p.cat], images, p.featured ? 1 : 0, JSON.stringify(p.tags), sku);
  }

  // Seed some reviews
  const insertReview = db.prepare('INSERT INTO reviews (id, user_id, product_id, rating, title, comment, verified_purchase) VALUES (?, ?, ?, ?, ?, ?, ?)');
  const reviewData = [
    { pi: 0, user: customerId, rating: 5, title: 'Best headphones ever!', comment: 'Amazing sound quality and the noise cancellation is top-notch. Battery lasts forever.', verified: 1 },
    { pi: 0, user: customer2Id, rating: 4, title: 'Great but pricey', comment: 'Excellent quality but wish they were a bit cheaper. Comfortable for long sessions.', verified: 1 },
    { pi: 1, user: customerId, rating: 5, title: 'Perfect for work', comment: 'Fast, lightweight, and the screen is gorgeous. Best laptop I have owned.', verified: 1 },
    { pi: 2, user: customer2Id, rating: 4, title: 'Love the health features', comment: 'The health tracking is very accurate. Only wish the screen was a bit bigger.', verified: 1 },
    { pi: 5, user: customerId, rating: 5, title: 'Super comfortable', comment: 'Softest t-shirt I own. Washes well and hasn\'t faded after many washes.', verified: 1 },
    { pi: 10, user: customerId, rating: 5, title: 'Life-changing for my back', comment: 'After switching to this chair, my back pain is gone. Worth every penny.', verified: 1 },
    { pi: 10, user: customer2Id, rating: 4, title: 'Great chair, minor assembly issues', comment: 'The chair itself is fantastic but the assembly instructions could be clearer.', verified: 0 },
    { pi: 20, user: customerId, rating: 5, title: 'Must-read for developers', comment: 'Changed how I think about writing code. Every developer should read this.', verified: 1 },
    { pi: 25, user: customer2Id, rating: 5, title: 'Skin is glowing!', comment: 'Noticed visible improvement in just 2 weeks. My skin feels smoother and brighter.', verified: 1 },
    { pi: 17, user: customerId, rating: 5, title: 'Best tent for backpacking', comment: 'Incredibly light yet sturdy. Survived a rainstorm without any leaks.', verified: 1 },
  ];

  for (const r of reviewData) {
    insertReview.run(uuid(), r.user, productIds[r.pi], r.rating, r.title, r.comment, r.verified);
  }

  // Update rating averages
  db.exec(`
    UPDATE products SET
      rating_avg = COALESCE((SELECT AVG(rating) FROM reviews WHERE reviews.product_id = products.id), 0),
      rating_count = (SELECT COUNT(*) FROM reviews WHERE reviews.product_id = products.id)
  `);

  // Seed coupons
  db.prepare('INSERT INTO coupons (id, code, type, value, min_order, max_uses) VALUES (?, ?, ?, ?, ?, ?)').run(uuid(), 'WELCOME10', 'percentage', 10, 50, 1000);
  db.prepare('INSERT INTO coupons (id, code, type, value, min_order, max_uses) VALUES (?, ?, ?, ?, ?, ?)').run(uuid(), 'SAVE20', 'fixed', 20, 100, 500);

  // Seed a demo order
  const orderId = uuid();
  db.prepare(`INSERT INTO orders (id, user_id, status, subtotal, tax, shipping, total, shipping_name, shipping_line1, shipping_city, shipping_state, shipping_zip, payment_status)
    VALUES (?, ?, 'delivered', 289.98, 23.20, 0, 313.18, 'Demo Customer', '123 Main St', 'New York', 'NY', '10001', 'paid')`).run(orderId, customerId);
  db.prepare('INSERT INTO order_items (id, order_id, product_id, product_name, product_image, price, quantity, total) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
    uuid(), orderId, productIds[0], 'Wireless Noise-Canceling Headphones', `https://picsum.photos/seed/product101/600/600`, 249.99, 1, 249.99
  );
  db.prepare('INSERT INTO order_items (id, order_id, product_id, product_name, product_image, price, quantity, total) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
    uuid(), orderId, productIds[5], 'Premium Cotton T-Shirt', `https://picsum.photos/seed/product201/600/600`, 34.99, 1, 34.99
  );

  // Seed wishlist items
  db.prepare('INSERT INTO wishlist (id, user_id, product_id) VALUES (?, ?, ?)').run(uuid(), customerId, productIds[1]);
  db.prepare('INSERT INTO wishlist (id, user_id, product_id) VALUES (?, ?, ?)').run(uuid(), customerId, productIds[7]);
  db.prepare('INSERT INTO wishlist (id, user_id, product_id) VALUES (?, ?, ?)').run(uuid(), customerId, productIds[17]);

  console.log('Database seeded with demo data');
}
