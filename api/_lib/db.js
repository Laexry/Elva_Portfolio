// api/_lib/db.js
// Shared Neon Serverless PostgreSQL client with connect-phase retry.
import { neon } from '@neondatabase/serverless';

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 300;

/**
 * Returns a tagged-template SQL executor connected to the Neon database.
 * Retries transient connection errors up to MAX_RETRIES times with
 * exponential back-off so cold-start latency on Neon's free tier doesn't
 * surface as hard failures.
 */
export async function getDb() {
  let lastErr;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const sql = neon(process.env.DATABASE_URL);
      // Ping to verify the connection is live before returning.
      await sql`SELECT 1`;
      return sql;
    } catch (err) {
      lastErr = err;
      if (attempt < MAX_RETRIES) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
  throw lastErr;
}
