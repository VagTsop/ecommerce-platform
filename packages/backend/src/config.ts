import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export const CONFIG = {
  port: Number(process.env.PORT) || 3003,
  dbPath: process.env.DB_PATH || path.resolve(__dirname, '../data/ecommerce.db'),
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-prod',
  jwtExpiresIn: '7d',
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
};
