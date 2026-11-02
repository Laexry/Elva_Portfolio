// scripts/fix-constraints.mjs
// Removes the old category CHECK constraint from projects table.
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

try {
  await sql`ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_category_check`;
  console.log('✓ Dropped projects_category_check constraint.');
} catch (err) {
  console.error('Error:', err.message);
  process.exit(1);
}
