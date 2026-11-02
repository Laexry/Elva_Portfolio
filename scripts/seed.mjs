// scripts/seed.mjs
// Seeds the Neon database with Elva's REAL portfolio data.
// Usage: node --env-file=.env.local scripts/seed.mjs
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

console.log('Connecting to Neon…');
const sql = await connectWithRetry();
console.log('Seeding database with real data…');

try {
  // ---- Clear existing data (in dependency order) ----
  await sql`DELETE FROM project_links`;
  await sql`DELETE FROM project_tools`;
  await sql`DELETE FROM projects`;
  await sql`DELETE FROM skills`;
  await sql`DELETE FROM certifications`;

  // ---- Projects ----
  const projects = [
    // === DEVELOPMENT ===
    {
      title: 'YooGa GenG',
      year: '2024',
      badge_label: null,
      description: "Designed and developed a responsive landing page for a yoga platform during Generation Girl's Summer Club Explorer 2024. Integrated external REST APIs to dynamically fetch, filter, and render distinct yoga categories and routines, delivering a clean and interactive user experience.",
      image_url: 'projects/yooga-geng.jpg',
      category: 'development',
      github_url: 'https://github.com/Laexry/YoogaGenG',
      live_url: 'https://laexry.github.io/YoogaGenG/',
      display_order: 1,
      tools: ['HTML', 'CSS', 'JavaScript', 'REST API'],
    },
    {
      title: 'Telkomedika',
      year: '2024 - 2025',
      badge_label: null,
      description: 'Designed and developed an end-to-end appointment booking platform for Telkomedika Clinic using Laravel and MySQL. Implemented full CRUD functionality across user registration, authentication, patient profiles, and medical appointment management, along with a dedicated administrator dashboard to manage schedules, patients, and clinic operations.',
      image_url: 'projects/Telkomedika.png',
      category: 'development',
      github_url: 'https://github.com/ijapi/WAD-X-MANPROSI-FINAL-PROJECT',
      live_url: 'https://youtu.be/gsVmhueutP0',
      display_order: 2,
      tools: ['Laravel', 'PHP', 'MySQL', 'JavaScript', 'CSS'],
    },
    {
      title: 'Budayana v1.0',
      year: '2026',
      badge_label: null,
      description: 'Designed and developed a multi-portal educational platform designed to improve elementary school literacy through gamified Indonesian folklore. Engineered a hybrid storytelling architecture featuring dual reading modes (static text and visual with embedded mini-quizzes) paired with a pre-test and post-test workflow to evaluate student comprehension. Built role-based access portals for students, teachers (class score tracking and analytics), and parents (individual student progress monitoring).',
      image_url: 'projects/budayana.png',
      category: 'development',
      github_url: 'https://github.com/maeylavv/budayana-full',
      live_url: 'https://budayana-app.vercel.app/',
      display_order: 3,
      tools: ['JavaScript XML', 'CSS', 'TypeScript', 'Prisma', 'PostgreSQL'],
    },
    {
      title: 'Cerita Budayana',
      year: '2026',
      badge_label: null,
      description: 'Developed an accessible early-literacy web application tailored for kindergarten students, offering a streamlined version of the Budayana platform. Implemented voice-assisted audio playback on every story slide to aid early readers, combined with interactive folktales and embedded micro-quizzes to foster active listening and engagement without assessment overhead.',
      image_url: 'projects/cerita-budayana.png',
      category: 'development',
      github_url: 'https://github.com/maeylavv/budayana-tk',
      live_url: 'https://www.cerita-budayana.com/',
      display_order: 4,
      tools: ['JavaScript XML', 'CSS', 'TypeScript', 'Prisma', 'PostgreSQL'],
    },
    // === DESIGN ===
    {
      title: 'SeedFund',
      year: '2023',
      badge_label: 'Mobile UI/UX',
      description: 'Created a high-fidelity mobile app prototype for SeedFund, a tree donation platform, using Figma. Focused on user-centered design principles as part of a UI/UX course project.',
      image_url: 'projects/SeedFund.png',
      category: 'design',
      github_url: null,
      live_url: 'https://www.figma.com/proto/AHCNLtoE5uMd9Ne30Poi4B/SeedFunds-Prototype?node-id=903-6563&starting-point-node-id=903%3A6563&t=kqKnHG0pDHvhXsB6-1',
      display_order: 1,
      tools: ['Figma', 'UI/UX', 'Prototyping'],
    },
    {
      title: 'QCTrack',
      year: '2023 - 2024',
      badge_label: 'Web UI/UX',
      description: 'Designed a high-fidelity web app prototype called QCTrack for a beauty company, aimed at managing and tracking product development processes. Created as part of an Interaction Design course.',
      image_url: 'projects/QCTrack.png',
      category: 'design',
      github_url: null,
      live_url: 'https://www.figma.com/proto/Art118Asc0rrDThjiywnvr/QCTrack?node-id=125-5&starting-point-node-id=125%3A5&t=EJmJupjocs93z9wK-1',
      display_order: 2,
      tools: ['Figma', 'Interaction Design', 'Dashboard'],
    },
  ];

  for (const p of projects) {
    const [inserted] = await sql`
      INSERT INTO projects (title, description, image_url, category, github_url, live_url, year, badge_label, display_order)
      VALUES (${p.title}, ${p.description}, ${p.image_url}, ${p.category}, ${p.github_url}, ${p.live_url}, ${p.year}, ${p.badge_label ?? null}, ${p.display_order})
      RETURNING id
    `;
    for (const tool of p.tools) {
      await sql`INSERT INTO project_tools (project_id, name) VALUES (${inserted.id}, ${tool})`;
    }
  }

  // ---- Skills (exactly as in original GitHub portfolio) ----
  const skills = [
    // Technical — stored as "Label: Value" so the JS can bold the label
    { name: 'Programming Languages: HTML, CSS, JavaScript, Python, PHP, Java', category: 'technical' },
    { name: 'Frameworks & Tools: Laravel, MySQL, GitHub', category: 'technical' },
    { name: 'Development Focus: Full-stack web development, responsive design, database integration', category: 'technical' },
    // Design
    { name: 'UI/UX Design: Prototyping, wireframing, user-centered design principles', category: 'design' },
    { name: 'Tools: Figma, Canva', category: 'design' },
    { name: 'Visual Design: Poster design, digital graphics, layout composition', category: 'design' },
  ];

  for (const s of skills) {
    await sql`INSERT INTO skills (name, category) VALUES (${s.name}, ${s.category})`;
  }

  // ---- Certifications (real BNSP PDFs from /certification folder) ----
  const certs = [
    {
      title: 'Sertifikat Kompetensi – System Analyst',
      issuer: 'BNSP (Badan Nasional Sertifikasi Profesi)',
      issue_date: '2024-01-01',
      credential_url: null,
      image_url: null,
      pdf_file: 'certification/bnsp-system-analyst.pdf',
      display_order: 1,
    },
    {
      title: 'Certificate of Completion',
      issuer: 'BNSP (Badan Nasional Sertifikasi Profesi)',
      issue_date: '2024-01-01',
      credential_url: null,
      image_url: null,
      pdf_file: 'certification/bnsp-certificate-of-completion.pdf',
      display_order: 2,
    },
    {
      title: 'Surat Keterangan Hasil Asesmen',
      issuer: 'BNSP (Badan Nasional Sertifikasi Profesi)',
      issue_date: '2024-01-01',
      credential_url: null,
      image_url: null,
      pdf_file: 'certification/bnsp-assessment-result.pdf',
      display_order: 3,
    },
  ];

  for (const c of certs) {
    await sql`
      INSERT INTO certifications (title, issuer, issue_date, credential_url, image_url, pdf_file, display_order)
      VALUES (${c.title}, ${c.issuer}, ${c.issue_date}, ${c.credential_url}, ${c.image_url}, ${c.pdf_file}, ${c.display_order})
    `;
  }

  console.log(`✓ Seeded ${projects.length} projects, ${skills.length} skills, ${certs.length} certifications.`);
} catch (err) {
  console.error('✗ Seeding failed:', err.message);
  process.exit(1);
}
