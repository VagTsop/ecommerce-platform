# E-Commerce Platform

Full-stack e-commerce store with product catalog, shopping cart, checkout flow, order management, admin dashboard, wishlist, reviews, coupons, and dark mode.

## Live Demo

**Frontend:** https://ecommerce-platform-livid.vercel.app
**Backend:** Hosted on Railway

### Demo Accounts
- `alex@demo.com` / `password123` (customer)
- `sarah@demo.com` / `password123` (customer)
- `admin@demo.com` / `password123` (admin)

## Tech Stack

- **Frontend:** React, TypeScript, Material UI (MUI v6), Vite
- **Backend:** Node.js, Express, TypeScript, SQLite (better-sqlite3)
- **Auth:** JWT with Bearer tokens

## Features

- Product catalog with categories, search & filters
- Shopping cart with quantity management
- Complete checkout flow
- Order management & history
- Admin dashboard with analytics
- Wishlist
- Product reviews & ratings
- Coupon system
- Dark/Light mode
- Responsive design
- JWT authentication with role-based access

## Project Structure

```
packages/
├── backend/          # Express API server
│   └── src/
│       ├── db/       # SQLite connection & schema
│       ├── middleware/# Auth middleware
│       ├── routes/   # API routes (products, cart, orders, reviews, coupons, admin)
│       └── index.ts  # Server entry point
└── frontend/         # React + Vite + MUI app
    └── src/
        ├── api/      # API client
        ├── components/# UI components
        ├── pages/    # Page components
        └── stores/   # Zustand state management
```

## Getting Started

```bash
# Install dependencies
npm install
cd packages/backend && npm install
cd ../frontend && npm install

# Start development (from root)
npm run dev
```

Backend runs on `http://localhost:3003`, frontend on `http://localhost:5173`.

## Deployment

- **Frontend:** Vercel (static build)
- **Backend:** Railway (Node.js)
