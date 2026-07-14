import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load backend/.env regardless of the current working directory.
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function required(name) {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(`Missing required environment variable: ${name}. Copy backend/.env.example to backend/.env.`);
  }
  return value;
}

function optional(name, fallback = '') {
  const value = process.env[name];
  return value === undefined || value === '' ? fallback : value;
}

const NODE_ENV = optional('NODE_ENV', 'development');

export const env = {
  NODE_ENV,
  isProd: NODE_ENV === 'production',
  PORT: Number(optional('PORT', '4000')),
  CORS_ORIGIN: optional('CORS_ORIGIN', 'http://localhost:3000'),
  // Public base URL the ID-card QR codes point at (member form pages).
  PUBLIC_SITE_URL: optional('PUBLIC_SITE_URL', 'http://localhost:3000'),

  DATABASE_URL: required('DATABASE_URL'),

  JWT_SECRET: required('JWT_SECRET'),
  JWT_EXPIRES_IN: optional('JWT_EXPIRES_IN', '7d'),
  BCRYPT_ROUNDS: Number(optional('BCRYPT_ROUNDS', '12')),

  COOKIE_NAME: optional('COOKIE_NAME', 'nba_token'),
  COOKIE_SECURE: optional('COOKIE_SECURE', 'false') === 'true',
  COOKIE_SAMESITE: optional('COOKIE_SAMESITE', 'lax'),
  COOKIE_MAX_AGE_MS: Number(optional('COOKIE_MAX_AGE_MS', String(7 * 24 * 60 * 60 * 1000))),

  CLOUDINARY_CLOUD_NAME: optional('CLOUDINARY_CLOUD_NAME'),
  CLOUDINARY_API_KEY: optional('CLOUDINARY_API_KEY'),
  CLOUDINARY_API_SECRET: optional('CLOUDINARY_API_SECRET'),
  CLOUDINARY_UPLOAD_FOLDER: optional('CLOUDINARY_UPLOAD_FOLDER', 'nangalkot-bazar'),

  SEED_ADMIN_NAME: optional('SEED_ADMIN_NAME', 'প্রশাসক'),
  SEED_ADMIN_EMAIL: optional('SEED_ADMIN_EMAIL', 'admin@nangalkotbazar.test'),
  SEED_ADMIN_PASSWORD: optional('SEED_ADMIN_PASSWORD', 'Admin@12345'),
};

export const isCloudinaryConfigured = Boolean(
  env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET,
);
