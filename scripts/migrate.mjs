// scripts/migrate.mjs
// Creates / updates all required tables in Neon (safe to run multiple times).
// Uses ALTER TABLE … ADD COLUMN IF NOT EXISTS to handle schema upgrades.
// Usage: node --env-file=.env.local scripts/migrate.mjs
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

console.log('Running migration…');
try {
  // --- Core tables ---
  await sql`
    CREATE TABLE IF NOT EXISTS projects (
      id             SERIAL PRIMARY KEY,
      title          TEXT        NOT NULL,
      description    TEXT,
      image_url      TEXT,
      category       TEXT        NOT NULL DEFAULT 'development',
      github_url     TEXT,
      live_url       TEXT,
      display_order  INTEGER     NOT NULL DEFAULT 0,
      created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  // Add columns that may be missing from older schema versions
  await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS github_url TEXT`;
  await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS live_url   TEXT`;
  await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 0`;

  await sql`
    CREATE TABLE IF NOT EXISTS project_tools (
      id          SERIAL PRIMARY KEY,
      project_id  INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      name        TEXT    NOT NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS project_links (
      id          SERIAL PRIMARY KEY,
      project_id  INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      label       TEXT    NOT NULL,
      url         TEXT    NOT NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS skills (
      id        SERIAL PRIMARY KEY,
      name      TEXT NOT NULL,
      category  TEXT NOT NULL DEFAULT 'technical'
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS certifications (
      id             SERIAL PRIMARY KEY,
      title          TEXT        NOT NULL,
      issuer         TEXT,
      issue_date     DATE,
      credential_url TEXT,
      image_url      TEXT,
      display_order  INTEGER     NOT NULL DEFAULT 0,
      created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`ALTER TABLE certifications ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 0`;

  console.log('✓ Migration complete.');
} catch (err) {
  console.error('✗ Migration failed:', err.message);
  process.exit(1);
}
