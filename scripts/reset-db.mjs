// scripts/reset-db.mjs
// Drops all portfolio tables and recreates them fresh, with retry on cold-start.
// Usage: node --env-file=.env.local scripts/reset-db.mjs
import { neon } from '@neondatabase/serverless';

async function connectWithRetry(retries = 5, delayMs = 1500) {
  for (let i = 1; i <= retries; i++) {
    try {
      const sql = neon(process.env.DATABASE_URL);
      await sql`SELECT 1`;
      return sql;
    } catch (err) {
      if (i === retries) throw err;
      console.log(`  Connection attempt ${i} failed, retrying in ${delayMs}ms…`);
      await new Promise(r => setTimeout(r, delayMs));
      delayMs *= 1.5;
    }
  }
}

console.log('Connecting to Neon…');
const sql = await connectWithRetry();
console.log('Connected. Resetting database tables…');

try {
  await sql`DROP TABLE IF EXISTS project_links    CASCADE`;
  await sql`DROP TABLE IF EXISTS project_tools    CASCADE`;
  await sql`DROP TABLE IF EXISTS projects         CASCADE`;
  await sql`DROP TABLE IF EXISTS skills           CASCADE`;
  await sql`DROP TABLE IF EXISTS certifications   CASCADE`;

  await sql`
    CREATE TABLE projects (
      id             SERIAL PRIMARY KEY,
      title          TEXT        NOT NULL,
      description    TEXT,
      image_url      TEXT,
      category       TEXT        NOT NULL DEFAULT 'development',
      github_url     TEXT,
      live_url       TEXT,
      year           TEXT,
      badge_label    TEXT,
      display_order  INTEGER     NOT NULL DEFAULT 0,
      created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE project_tools (
      id          SERIAL PRIMARY KEY,
      project_id  INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      name        TEXT    NOT NULL
    )
  `;
  await sql`
    CREATE TABLE project_links (
      id          SERIAL PRIMARY KEY,
      project_id  INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      label       TEXT    NOT NULL,
      url         TEXT    NOT NULL
    )
  `;
  await sql`
    CREATE TABLE skills (
      id        SERIAL PRIMARY KEY,
      name      TEXT NOT NULL,
      category  TEXT NOT NULL DEFAULT 'technical'
    )
  `;
  await sql`
    CREATE TABLE certifications (
      id             SERIAL PRIMARY KEY,
      title          TEXT        NOT NULL,
      issuer         TEXT,
      issue_date     DATE,
      credential_url TEXT,
      image_url      TEXT,
      pdf_file       TEXT,
      display_order  INTEGER     NOT NULL DEFAULT 0,
      created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  console.log('✓ All tables reset successfully.');
} catch (err) {
  console.error('✗ Reset failed:', err.message);
  process.exit(1);
}
