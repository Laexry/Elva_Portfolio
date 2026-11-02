// scripts/check-db.mjs
// Verifies the DATABASE_URL in .env.local can reach Neon.
// Usage: node --env-file=.env.local scripts/check-db.mjs
import { neon } from '@neondatabase/serverless';

const url = process.env.DATABASE_URL;
if (!url || url.trim() === '') {
  console.error('✗ DATABASE_URL is not set in .env.local');
  process.exit(1);
}

console.log('Checking connection to Neon…');
try {
  const sql = neon(url);
  const [row] = await sql`SELECT version()`;
  console.log('✓ Connected!', row.version);
} catch (err) {
  console.error('✗ Could not connect:', err.message);
  console.error('  Check that the string is complete, is the full postgresql://... URL,');
  console.error('  and has no extra quotes or spaces.');
  process.exit(1);
}
