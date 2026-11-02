-- db/schema.sql
-- Portfolio database schema for Neon PostgreSQL.
-- Safe to run multiple times (uses CREATE TABLE IF NOT EXISTS).

CREATE TABLE IF NOT EXISTS projects (
  id             SERIAL PRIMARY KEY,
  title          TEXT        NOT NULL,
  description    TEXT,
  image_url      TEXT,
  category       TEXT        NOT NULL DEFAULT 'development',  -- 'development' | 'design'
  github_url     TEXT,
  live_url       TEXT,
  display_order  INTEGER     NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_tools (
  id          SERIAL PRIMARY KEY,
  project_id  INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name        TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS project_links (
  id          SERIAL PRIMARY KEY,
  project_id  INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  label       TEXT    NOT NULL,
  url         TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS skills (
  id        SERIAL PRIMARY KEY,
  name      TEXT NOT NULL,
  category  TEXT NOT NULL DEFAULT 'technical'  -- 'technical' | 'design'
);

CREATE TABLE IF NOT EXISTS certifications (
  id             SERIAL PRIMARY KEY,
  title          TEXT        NOT NULL,
  issuer         TEXT,
  issue_date     DATE,
  credential_url TEXT,
  image_url      TEXT,
  display_order  INTEGER     NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
