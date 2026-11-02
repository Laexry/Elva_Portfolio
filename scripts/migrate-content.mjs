// scripts/migrate-content.mjs
// NON-DESTRUCTIVE: adds the tables/columns for site content and fills them in.
// Safe to run many times (uses IF NOT EXISTS + upserts). Your projects/skills stay intact.
// Usage: npm run db:content
import { neon } from '@neondatabase/serverless';

async function connectWithRetry(retries = 5, delayMs = 1500) {
  for (let i = 1; i <= retries; i++) {
    try {
      const sql = neon(process.env.DATABASE_URL);
      await sql`SELECT 1`;
      return sql;
    } catch (err) {
      if (i === retries) throw err;
      console.log(`  Attempt ${i} failed, retrying in ${delayMs}ms…`);
      await new Promise(r => setTimeout(r, delayMs));
      delayMs *= 1.5;
    }
  }
}

// ---------- Content (edit here, or later directly in Neon) ----------
const PROFILE = {
  name: 'Elvaretta Alexandra',
  short_name: 'Elva',
  greeting: 'Hi, I’m Elva 👋',
  role: 'Information Systems Graduate',
  tagline: 'Creating accessible web applications and bridging technology, design, and practical solutions.',
  about: [
    'Hi! I’m Elvaretta Alexandra, an Information Systems IUP (International Undergraduate Program) fresh graduate from Telkom University with a strong interest in software engineering and UI design. Passionate about developing user-focused applications, I enjoy blending technical functionality with clean, intuitive design.',
    'I have hands-on experience in both front-end and back-end technologies, building my skills through academic projects and independent learning. I thrive in team environments, collaborating to deliver high-quality results. I also have a keen eye for design and love creating engaging user experiences.'
  ],
  email: 'elvaretta2004@email.com',
};

const CONTACTS = [
  { type: 'email',    label: 'elvaretta2004@email.com',          url: 'mailto:elvaretta2004@email.com',               icon: 'images/emailLogo.png',    display_order: 1 },
  { type: 'github',   label: 'github.com/Laexry',                url: 'https://github.com/Laexry',                     icon: 'images/githubLogo.png',   display_order: 2 },
  { type: 'linkedin', label: 'linkedin.com/in/elvarettaalexandra', url: 'https://www.linkedin.com/in/elvarettaalexandra/', icon: 'images/linkedinLogo.png', display_order: 3 },
];

const CERT_GROUPS = [
  {
    issuer_key: 'bnsp',
    seal: 'BNSP',
    eyebrow: 'Nationally certified',
    headline: 'System Analyst',
    blurb: 'Assessed by Indonesia’s National Professional Certification Board and certified competent in analysing business needs and turning them into system requirements.',
    chips: ['Requirements analysis', 'System design', 'Process modelling'],
  },
];

// Matched by keyword in the existing title → fixes paths + friendly names
const CERT_FIXES = [
  ['%system analyst%', 'certification/bnsp-system-analyst.pdf',            'System Analyst Certificate of Competency', 'Sertifikat Kompetensi'],
  ['%completion%',     'certification/bnsp-certificate-of-completion.pdf', 'Certificate of Completion',                'Sertifikat Penyelesaian'],
  ['%asesmen%',        'certification/bnsp-assessment-result.pdf',         'Assessment Result Letter',                 'Surat Keterangan Hasil Asesmen'],
];

const IMAGE_FIXES = [
  ['%cerita%',      'projects/cerita-budayana.png'],
  ['budayana v%',   'projects/budayana.png'],
  ['%yooga%',       'projects/yooga-geng.jpg'],
  ['%qctrack%',     'projects/QCTrack.png'],
  ['%seedfund%',    'projects/SeedFund.png'],
  ['%telkomedika%', 'projects/Telkomedika.png'],
];

console.log('Connecting to Neon…');
const sql = await connectWithRetry();

try {
  // ---- Schema (additive only) ----
  await sql`CREATE TABLE IF NOT EXISTS site_settings (
    key   TEXT PRIMARY KEY,
    value JSONB NOT NULL
  )`;
  await sql`CREATE TABLE IF NOT EXISTS contacts (
    id            SERIAL PRIMARY KEY,
    type          TEXT NOT NULL,
    label         TEXT NOT NULL,
    url           TEXT NOT NULL,
    icon          TEXT,
    display_order INTEGER NOT NULL DEFAULT 0
  )`;
  await sql`CREATE TABLE IF NOT EXISTS cert_groups (
    issuer_key TEXT PRIMARY KEY,
    seal       TEXT,
    eyebrow    TEXT,
    headline   TEXT,
    blurb      TEXT,
    chips      TEXT[] NOT NULL DEFAULT '{}'
  )`;
  await sql`ALTER TABLE certifications ADD COLUMN IF NOT EXISTS display_title TEXT`;
  await sql`ALTER TABLE certifications ADD COLUMN IF NOT EXISTS subtitle TEXT`;

  // ---- Data ----
  await sql`
    INSERT INTO site_settings (key, value) VALUES ('profile', ${JSON.stringify(PROFILE)}::jsonb)
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`;

  await sql`DELETE FROM contacts`;
  for (const c of CONTACTS) {
    await sql`INSERT INTO contacts (type, label, url, icon, display_order)
              VALUES (${c.type}, ${c.label}, ${c.url}, ${c.icon}, ${c.display_order})`;
  }

  for (const g of CERT_GROUPS) {
    await sql`
      INSERT INTO cert_groups (issuer_key, seal, eyebrow, headline, blurb, chips)
      VALUES (${g.issuer_key}, ${g.seal}, ${g.eyebrow}, ${g.headline}, ${g.blurb}, ${g.chips})
      ON CONFLICT (issuer_key) DO UPDATE SET
        seal = EXCLUDED.seal, eyebrow = EXCLUDED.eyebrow, headline = EXCLUDED.headline,
        blurb = EXCLUDED.blurb, chips = EXCLUDED.chips`;
  }

  for (const [pattern, pdf, title, sub] of CERT_FIXES) {
    await sql`UPDATE certifications SET pdf_file = ${pdf}, display_title = ${title}, subtitle = ${sub}
              WHERE title ILIKE ${pattern}`;
  }

  for (const [pattern, img] of IMAGE_FIXES) {
    await sql`UPDATE projects SET image_url = ${img} WHERE title ILIKE ${pattern}`;
  }

  console.log('✓ Content migrated: profile, contacts, certificate groups, image & PDF paths.');
} catch (err) {
  console.error('✗ Content migration failed:', err.message);
  process.exit(1);
}
