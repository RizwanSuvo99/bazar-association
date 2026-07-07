import pg from 'pg';
import { env } from './env.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
});

pool.on('error', (err) => {
  // Log unexpected errors on idle clients but keep the process alive.
  console.error('[db] unexpected pool error', err);
});

/** Run a single parameterized query. */
export function query(text, params) {
  return pool.query(text, params);
}

/**
 * Run a set of statements inside a single transaction.
 * The callback receives a dedicated client; commit/rollback are automatic.
 */
export async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function closePool() {
  await pool.end();
}
