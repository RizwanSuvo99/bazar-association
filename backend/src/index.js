import { createApp } from './app.js';
import { env } from './config/env.js';
import { closePool } from './config/db.js';

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`[nba-backend] API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
});

async function shutdown(signal) {
  console.log(`\n[nba-backend] ${signal} received, shutting down...`);
  server.close(async () => {
    await closePool();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
