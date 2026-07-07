import { pool, closePool } from '../config/db.js';
import { env } from '../config/env.js';

// DEV-ONLY: wipe the entire public schema so migrations can re-run from scratch.
async function run() {
  if (env.isProd) {
    throw new Error('Refusing to reset the database in production.');
  }
  await pool.query('DROP SCHEMA public CASCADE;');
  await pool.query('CREATE SCHEMA public;');
  console.log('Public schema dropped and recreated. Run `npm run migrate` next.');
}

run()
  .then(() => closePool())
  .catch(async (err) => {
    console.error(err);
    await closePool();
    process.exit(1);
  });
