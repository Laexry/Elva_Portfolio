// scripts/migrate-case-studies.mjs
// NON-DESTRUCTIVE: adds case-study tables + media, site images, analyst skills,
// and links projects to their case studies. Safe to run many times (upserts).
// Usage: npm run db:case-studies
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

// =====================================================================
// Site-wide images (nothing image-related is hardcoded in the HTML)
// =====================================================================
const SITE_IMAGES = {
  favicon: 'images/folder.png',
  hero_folder: 'images/folder.png',
  hero_photo: 'images/per_photo.png',
  about_photo: 'images/prof_photo.png',
  project_fallback: 'images/folder.png',
};

// Profile copy repositioned for System / IT Analyst roles (merged into existing profile)
const PROFILE_PATCH = {
  role: 'BNSP-Certified System Analyst',
  tagline: 'I turn business needs into clear requirements, process models and system designs — and I can build them too.',
  about: [
    'Hi! I’m Elvaretta Alexandra, an Information Systems IUP (International Undergraduate Program) graduate from Telkom University and a BNSP-certified System Analyst. I enjoy the space between people and technology: understanding what users actually need, then translating it into requirements, process flows and data models a team can build from.',
    'My development background (Laravel, React/TypeScript, PostgreSQL) keeps my analysis grounded in what is feasible, and my UI/UX experience helps me validate requirements through prototypes. I have documented multi-role systems end-to-end with use case, activity, sequence, ERD and deployment diagrams.'
  ],
};

const ANALYSIS_SKILLS = [
  'Requirements Engineering: Stakeholder analysis, functional & non-functional requirements, business rules, user stories',
  'System Modelling: UML use case, activity, sequence & deployment diagrams, ERD, process flows',
  'Data & Reporting: Relational data modelling, SQL (MySQL, PostgreSQL), dashboard metric design',
  'Tools: Visual Paradigm, draw.io, Figma, GitHub',
];

const DOCS_BASE = 'system documentation';

// =====================================================================
// Case studies
// =====================================================================
const CASE_STUDIES = [
  // -------------------------------------------------------------------
  // BUDAYANA
  // -------------------------------------------------------------------
  {
    slug: 'budayana',
    project_match: 'budayana v%',
    title: 'Budayana: Cerita Rakyat Module',
    subtitle: 'Requirements, process and data modelling for a gamified folklore literacy platform used by students, teachers and parents.',
    role: 'System Analyst & Full-stack Developer',
    period: '2026',
    summary: 'Analysed and built the folklore (Cerita Rakyat) feature across three user portals, defining a measurable evaluation cycle and the dashboards that report on it.',
    cover_image: 'projects/budayana.png',
    docs_url: 'https://drive.google.com/drive/folders/1E3KUB6Uwht82p9-71lzblN5pr6du-6wl?usp=drive_link',
    video_url: null,
    live_url: 'https://budayana-app.vercel.app/',
    repo_url: 'https://github.com/maeylavv/budayana-full',
    display_order: 1,
    highlights: [
      { value: '3', label: 'user roles analysed' },
      { value: '13', label: 'entities modelled' },
      { value: '30+', label: 'UML diagrams in full docs' },
      { value: '8', label: 'island learning paths' },
    ],
    content: {
      meta: [
        { label: 'Role', value: 'System Analyst & Full-stack Developer' },
        { label: 'Scope', value: 'Cerita Rakyat (folklore) feature, end-to-end' },
        { label: 'Users', value: 'Students · Teachers · Parents' },
        { label: 'Stack', value: 'React, TypeScript, ElysiaJS (Bun), Prisma, PostgreSQL' },
      ],
      overview: {
        problem: 'Elementary students need engaging ways to build reading comprehension, while teachers and parents have little visibility into whether reading activities actually improve understanding.',
        solution: 'A gamified folklore module where every story is wrapped in a measurable evaluation cycle (pre-test → story → post-test), with monitoring dashboards for teachers (class level) and parents (child level).',
        my_role: [
          'Owned the Cerita Rakyat feature from requirements to implementation, across the student, teacher and parent portals.',
          'Modelled the evaluation cycle with use case, activity and sequence diagrams, and defined the XP and scoring business rules.',
          'Designed the data model for stories, slides, questions and multi-level attempt logging, so learning progress can be measured per student, class and child.',
          'Translated monitoring needs into dashboard metrics: learning gain, activity, level averages, island completion and time analysis.',
        ],
      },
      stakeholders: [
        {
          role: 'Student',
          goal: 'Read Indonesian folklore in a fun way and see their own progress.',
          needs: ['Pick an island and continue unfinished progress', 'Choose static or interactive reading', 'Instant feedback, XP and results'],
        },
        {
          role: 'Teacher',
          goal: 'Measure class comprehension and spot students who need help.',
          needs: ['Class dashboard filtered by class and gender', 'Search and sort the student list', 'Open individual results and essay answers', 'Manage student profiles'],
        },
        {
          role: 'Parent',
          goal: 'Follow their child’s learning progress at home.',
          needs: ['Switch between linked children', 'See sessions, XP and pre/post-test averages', 'See learning improvement and favourite stories'],
        },
      ],
      matrix: {
        columns: ['Student', 'Teacher', 'Parent'],
        rows: [
          { capability: 'Select island & continue progress', values: [true, false, false] },
          { capability: 'Complete evaluation cycle (pre-test → story → post-test)', values: [true, false, false] },
          { capability: 'Read static or interactive folklore', values: [true, false, false] },
          { capability: 'View student data dashboard', values: [true, true, true] },
          { capability: 'Open essay answers', values: [false, true, true] },
          { capability: 'View class data dashboard (filter by class / gender)', values: [false, true, false] },
          { capability: 'Search & sort student dashboard list', values: [false, true, false] },
          { capability: 'View, search & manage student profiles', values: [false, true, false] },
          { capability: 'Switch between children’s dashboards', values: [false, false, true] },
          { capability: 'View & manage own profile', values: [false, true, true] },
        ],
      },
      process: {
        title: 'The evaluation cycle',
        intro: 'The core flow I modelled. One cycle per story, shared by all three portals, so “progress” means the same thing to students, teachers and parents.',
        steps: [
          { actor: 'Student', title: 'Pre-test', detail: 'System opens a session log and timer, then loads 10 questions. Answers are scored and timestamped.' },
          { actor: 'System', title: 'Resolve story path', detail: 'Story configuration decides the path: Static (10 digitised pages) or Interactive (visual slides with checkpoints).' },
          { actor: 'Student', title: 'Static path', detail: '+10 XP is registered for every page turned, up to 100 XP.' },
          { actor: 'Student', title: 'Interactive path', detail: 'Checkpoint questions allow unlimited retries; only a first-attempt correct answer earns +10 XP. Every attempt is logged.' },
          { actor: 'Student', title: 'Essay reflection', detail: 'An open-ended answer is saved to the story attempt (0 XP) for teachers and parents to read.' },
          { actor: 'Student', title: 'Post-test', detail: '10 questions. System stops the timer, computes time spent, increments total XP and saves the cycle.' },
        ],
      },
      rules: [
        { id: 'BR-01', title: 'Fixed evaluation order', detail: 'Pre-test → Folklore → Post-test. Each stage records a completion timestamp.' },
        { id: 'BR-02', title: 'Static reading XP', detail: '+10 XP per page turned, capped at 100 XP per story attempt.' },
        { id: 'BR-03', title: 'Interactive checkpoint XP', detail: '+10 XP only for a correct first attempt. Retries are unlimited but award 0 XP.' },
        { id: 'BR-04', title: 'Attempt logging', detail: 'Every checkpoint answer is stored with attempt count, correctness and timestamp.' },
        { id: 'BR-05', title: 'Essay answers', detail: 'Saved as free text and reviewed by people, not auto-scored (0 XP).' },
        { id: 'BR-06', title: 'Island progression', detail: 'Islands have an unlock order and default lock state; completion, unlock and cycle count are tracked per student.' },
        { id: 'BR-07', title: 'Learning gain', detail: 'Improvement = post-test − pre-test score, aggregated per child (parent) and per class (teacher).' },
        { id: 'BR-08', title: 'Engagement time', detail: 'A session timer per cycle feeds time spent per stage and story into the teacher’s time analysis.' },
      ],
      requirements: {
        functional: [
          { id: 'FR-01', actor: 'Student', text: 'Select an unlocked island and continue unfinished progress.', priority: 'High' },
          { id: 'FR-02', actor: 'Student', text: 'Complete a 10-question pre-test before reading and see the result.', priority: 'High' },
          { id: 'FR-03', actor: 'Student', text: 'Read a story in static or interactive mode, as configured per story.', priority: 'High' },
          { id: 'FR-04', actor: 'Student', text: 'Answer interactive checkpoint questions with feedback and unlimited retries.', priority: 'High' },
          { id: 'FR-05', actor: 'Student', text: 'Submit an open-ended essay answer after the story.', priority: 'Medium' },
          { id: 'FR-06', actor: 'Student', text: 'Complete a 10-question post-test and see final XP and completion metrics.', priority: 'High' },
          { id: 'FR-07', actor: 'Teacher', text: 'View a class dashboard (average improvement, active vs inactive, level averages, island completion, time analysis) filtered by class and gender.', priority: 'High' },
          { id: 'FR-08', actor: 'Teacher', text: 'Search and sort the student list and open each student’s dashboard, including essay answers.', priority: 'High' },
          { id: 'FR-09', actor: 'Teacher', text: 'View, search and manage student profiles.', priority: 'Medium' },
          { id: 'FR-10', actor: 'Parent', text: 'Switch between linked children and view each child’s sessions, XP, pre/post averages, improvement and popular stories.', priority: 'High' },
          { id: 'FR-11', actor: 'Teacher, Parent', text: 'View and update their own profile.', priority: 'Low' },
        ],
        non_functional: [
          { id: 'NFR-01', category: 'Usability', text: 'Child-friendly interface with large controls and immediate feedback for elementary students.' },
          { id: 'NFR-02', category: 'Data integrity', text: 'Every attempt, score and timestamp is persisted per session so analytics are reproducible.' },
          { id: 'NFR-03', category: 'Security', text: 'Role-based access separates student, teacher and parent portals.' },
          { id: 'NFR-04', category: 'Availability', text: 'Served from Vercel’s CDN with a serverless API and managed Neon PostgreSQL.' },
        ],
      },
      data_model: {
        intro: '13 entities across three domains. Attempts are logged at three levels of detail (story → stage → question), so the same data powers the student’s XP, the parent’s child view and the teacher’s class analytics.',
        groups: [
          { name: 'Identity & access', entities: ['user', 'account', 'session'] },
          { name: 'Learning content', entities: ['islands', 'stories', 'static_slide', 'interactive_slide', 'questions', 'answer_option'] },
          { name: 'Progress & analytics', entities: ['user_progress', 'story_attempts', 'stage_attempts', 'question_attempts_logs'] },
        ],
      },
      architecture: {
        intro: 'Deployment modelled to agree on runtime boundaries early.',
        layers: [
          { name: 'Client', tech: 'React app in the browser', detail: 'Calls the API over HTTPS / REST' },
          { name: 'Frontend hosting', tech: 'Vercel CDN', detail: 'Static HTML, CSS and JS assets' },
          { name: 'API', tech: 'ElysiaJS on Bun runtime', detail: 'Business rules, scoring and XP' },
          { name: 'Data', tech: 'Neon PostgreSQL', detail: 'Accessed via Prisma Client over SSL' },
        ],
      },
      outcomes: [
        'One shared definition of the evaluation cycle, reused by all three portals, so there are no conflicting interpretations of “progress”.',
        'Every dashboard number traces back to a logged table, which made the metrics explainable to teachers and parents.',
        'Shipped and live at budayana-app.vercel.app, with a simplified kindergarten spin-off (Cerita Budayana).',
      ],
      reflection: [
        'Add a requirements traceability matrix linking each FR to its use case, screen and tables.',
        'Validate the dashboard metrics with teachers through usability testing to confirm they support real decisions.',
        'Make data-retention and privacy rules for minors’ data explicit as non-functional requirements.',
      ],
    },
    media: [
      { kind: 'diagram', notation: 'UML Use Case', title: 'Use case diagram', caption: 'All three actors and how their use cases relate through «include» and «extend».', image_url: `${DOCS_BASE}/budayana/use case.png`, audience: null, is_featured: true },
      { kind: 'diagram', notation: 'UML Activity (swimlane)', title: 'Activity diagram: evaluation cycle', caption: 'Student vs system responsibilities, including the static/interactive branch and the retry loop.', image_url: `${DOCS_BASE}/budayana/activity diagram_evaluation cycle.png`, audience: 'student', is_featured: true },
      { kind: 'diagram', notation: 'UML Sequence', title: 'Sequence diagram: evaluation cycle', caption: 'Messages between UI, system control and database, with alt/loop fragments for both story paths.', image_url: `${DOCS_BASE}/budayana/sequence diagram_evaluation cycle.png`, audience: 'student', is_featured: true },
      { kind: 'diagram', notation: 'ERD', title: 'Entity relationship diagram', caption: '13 entities covering identity, learning content and multi-level attempt logging.', image_url: `${DOCS_BASE}/budayana/erd.png`, audience: null, is_featured: true },
      { kind: 'diagram', notation: 'UML Deployment', title: 'Deployment diagram', caption: 'React client, Vercel CDN, ElysiaJS on Bun, and Neon PostgreSQL via Prisma.', image_url: `${DOCS_BASE}/budayana/deployment diagram.png`, audience: null, is_featured: true },

      { kind: 'screenshot', title: 'Cerita Rakyat island map', caption: 'Students pick an island; locked islands follow the unlock order.', image_url: `${DOCS_BASE}/budayana/screenshots/student_cerita rakyat map.png`, audience: 'student' },
      { kind: 'screenshot', title: 'Pre-test', caption: '10-question baseline before reading.', image_url: `${DOCS_BASE}/budayana/screenshots/student_pre-test.png`, audience: 'student' },
      { kind: 'screenshot', title: 'Static story', caption: 'Digitised text pages, +10 XP per page.', image_url: `${DOCS_BASE}/budayana/screenshots/student_static story.png`, audience: 'student' },
      { kind: 'screenshot', title: 'Interactive story', caption: 'Visual slides with embedded checkpoint questions.', image_url: `${DOCS_BASE}/budayana/screenshots/student_interactive story.png`, audience: 'student' },
      { kind: 'screenshot', title: 'Post-test', caption: 'Measures comprehension after the story.', image_url: `${DOCS_BASE}/budayana/screenshots/student_post-test.png`, audience: 'student' },
      { kind: 'screenshot', title: 'Teacher monitoring dashboard', caption: 'Average improvement, active vs inactive, level averages, island completion and time analysis.', image_url: `${DOCS_BASE}/budayana/screenshots/teacher_monitorning dashboard.png`, audience: 'teacher' },
      { kind: 'screenshot', title: 'Parent monitoring dashboard', caption: 'Child switcher, sessions, XP, pre/post averages and learning gain.', image_url: `${DOCS_BASE}/budayana/screenshots/parent_monitoring dashboard.png`, audience: 'parent' },
    ],
  },

  // -------------------------------------------------------------------
  // TELKOMEDIKA
  // -------------------------------------------------------------------
  {
    slug: 'telkomedika',
    project_match: '%telkomedika%',
    title: 'Telkomedika: Patient & Appointment Management',
    subtitle: 'Turning clinic appointment booking into a structured, self-service workflow for patients, with a matching admin side.',
    role: 'Developer & Analyst (Patient Account and Appointment modules)',
    period: '2024 – 2025',
    summary: 'Owned the patient account and appointment modules of a clinic platform, on both the patient and the admin side.',
    cover_image: 'projects/Telkomedika.png',
    docs_url: null,
    video_url: 'https://drive.google.com/file/d/1bPGbGH2NTh23OUemLXYe_uoBYenVL0mu/view?usp=sharing',
    live_url: null,
    repo_url: 'https://github.com/ijapi/WAD-X-MANPROSI-FINAL-PROJECT',
    display_order: 2,
    highlights: [
      { value: '2', label: 'modules owned' },
      { value: '2', label: 'sides: patient & admin' },
      { value: '4', label: 'step booking flow' },
      { value: '15', label: 'entities in system ERD' },
    ],
    content: {
      note: 'An early team project where documentation was kept light. The diagrams below cover the whole clinic system; this page focuses on the modules I owned and the analysis behind them.',
      meta: [
        { label: 'Role', value: 'Developer & Analyst' },
        { label: 'Scope', value: 'Patient accounts + appointment management' },
        { label: 'Users', value: 'Patients · Admins' },
        { label: 'Stack', value: 'Laravel, PHP, MySQL, JavaScript' },
      ],
      overview: {
        problem: 'The clinic needed an online alternative to manual appointment booking, and admins needed one place to manage patient records and appointments.',
        solution: 'A Laravel web platform where patients register, manage their profile and book appointments by specialist, doctor and time, while admins manage patients and appointments from a dashboard.',
        my_role: [
          'Built the patient account module: registration, login and profile management.',
          'Built the patient-side appointment flow: a 4-step booking wizard (Specialist → Time → Details → Finish).',
          'Built the admin side for managing patient records and appointments (full CRUD).',
          'Mapped the team’s use case diagram and ERD (Patient, Appointment, Schedule, Doctor, Specialization) onto forms, validation and relationships.',
        ],
      },
      stakeholders: [
        {
          role: 'Patient',
          goal: 'Book a clinic visit without calling or queueing.',
          needs: ['Register and manage a personal profile', 'Choose a specialist and doctor', 'Pick an available date and time'],
        },
        {
          role: 'Admin',
          goal: 'Keep patient and appointment records accurate.',
          needs: ['Create, view, update and delete patients', 'View and update appointments and their status'],
        },
      ],
      matrix: {
        columns: ['Patient', 'Admin'],
        rows: [
          { capability: 'Register an account', values: [true, false] },
          { capability: 'Log in / log out', values: [true, true] },
          { capability: 'View & update own profile', values: [true, false] },
          { capability: 'Book appointment by specialist, doctor & time', values: [true, false] },
          { capability: 'Create, view, update & delete patients', values: [false, true] },
          { capability: 'View & update appointments', values: [false, true] },
        ],
      },
      process: {
        title: 'Appointment booking flow',
        intro: 'The patient-side flow I implemented, matching the 4-step wizard in the UI.',
        steps: [
          { actor: 'Patient', title: 'Specialist', detail: 'Select a specialization, then a doctor filtered to that specialization.' },
          { actor: 'Patient', title: 'Time', detail: 'Choose a date and time slot from the doctor’s schedule.' },
          { actor: 'Patient', title: 'Details', detail: 'Review the patient details attached to the booking.' },
          { actor: 'System', title: 'Finish', detail: 'Appointment is stored with a status and appears in the admin’s appointment management.' },
        ],
      },
      rules: [
        { id: 'BR-01', title: 'Registered patients only', detail: 'Booking requires an authenticated patient account.' },
        { id: 'BR-02', title: 'Doctor ↔ specialization', detail: 'A doctor can only be chosen under the specialization they belong to.' },
        { id: 'BR-03', title: 'Schedule-bound booking', detail: 'Every appointment references an existing doctor schedule.' },
        { id: 'BR-04', title: 'Tracked status', detail: 'Each appointment carries a status so admins can follow it up.' },
      ],
      requirements: {
        functional: [
          { id: 'FR-01', actor: 'Patient', text: 'Register with personal data (name, date of birth, gender, phone, email, address, ID card).', priority: 'High' },
          { id: 'FR-02', actor: 'Patient, Admin', text: 'Log in and log out.', priority: 'High' },
          { id: 'FR-03', actor: 'Patient', text: 'View and update profile data.', priority: 'Medium' },
          { id: 'FR-04', actor: 'Patient', text: 'Book an appointment by selecting specialization, doctor, date and time.', priority: 'High' },
          { id: 'FR-05', actor: 'Admin', text: 'Create, view, update and delete patient records.', priority: 'High' },
          { id: 'FR-06', actor: 'Admin', text: 'View and update appointments and their status.', priority: 'High' },
        ],
        non_functional: [
          { id: 'NFR-01', category: 'Usability', text: 'Step indicator guides patients through booking in four short steps.' },
          { id: 'NFR-02', category: 'Data validation', text: 'Required fields and formats are validated before records are saved.' },
          { id: 'NFR-03', category: 'Security', text: 'Authenticated access with a separate admin area.' },
        ],
      },
      data_model: {
        intro: 'The team ERD has 15 entities. The five below are the ones my modules read and write.',
        groups: [
          { name: 'My scope', entities: ['Patient', 'Appointment', 'Schedule', 'Doctor', 'Specialization'] },
          { name: 'Rest of the system', entities: ['Medical Record', 'Prescription', 'Medicine', 'Medicine Cart', 'Medicine Payment', 'Feedback & Review', 'Symptoms', 'Specialization_Symptoms', 'Health Literacy', 'Admins'] },
        ],
      },
      outcomes: [
        'Working patient account and appointment modules on both sides, shown end-to-end in the demo video.',
        'This project is where I learned how much a clear ERD speeds up building forms and validation.',
      ],
      reflection: [
        'Document the booking flow with an activity diagram and acceptance criteria per step, as I later did for Budayana.',
        'Fix data types in the ERD: phone, ID card and password should be text, not integers.',
        'Model the appointment status lifecycle (requested → confirmed → completed / cancelled) as a state diagram.',
      ],
    },
    media: [
      { kind: 'diagram', notation: 'UML Use Case', title: 'Use case diagram (whole system)', caption: 'User, Doctor and Admin actors. My scope: Registration, Login, Patient Profiles, Clinic Appointment Booking, Patient Management and Appointment Management.', image_url: `${DOCS_BASE}/telkomedika/use case diagram.png`, audience: null, is_featured: true },
      { kind: 'diagram', notation: 'ERD', title: 'Entity relationship diagram', caption: '15 entities. My modules centre on Patient, Appointment, Schedule, Doctor and Specialization.', image_url: `${DOCS_BASE}/telkomedika/erd.png`, audience: null, is_featured: true },

      { kind: 'screenshot', title: 'Landing page', caption: 'Entry point for patients.', image_url: `${DOCS_BASE}/telkomedika/screenshots/landing_page.png`, audience: 'patient' },
      { kind: 'screenshot', title: 'Patient registration', caption: 'Captures the patient data defined in the ERD.', image_url: `${DOCS_BASE}/telkomedika/screenshots/patient_registration.png`, audience: 'patient' },
      { kind: 'screenshot', title: 'Book appointment', caption: '4-step wizard: Specialist → Time → Details → Finish.', image_url: `${DOCS_BASE}/telkomedika/screenshots/patient_book appointment.png`, audience: 'patient' },
      { kind: 'screenshot', title: 'Admin: patient management', caption: 'CRUD over patient records.', image_url: `${DOCS_BASE}/telkomedika/screenshots/admin_patient management.png`, audience: 'admin' },
    ],
  },
];

// =====================================================================
console.log('Connecting to Neon…');
const sql = await connectWithRetry();

try {
  // ---- Schema (additive only) ----
  await sql`CREATE TABLE IF NOT EXISTS site_settings (key TEXT PRIMARY KEY, value JSONB NOT NULL)`;
  await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS case_study_slug TEXT`;

  await sql`CREATE TABLE IF NOT EXISTS case_studies (
    slug          TEXT PRIMARY KEY,
    project_id    INTEGER REFERENCES projects(id) ON DELETE SET NULL,
    title         TEXT NOT NULL,
    subtitle      TEXT,
    role          TEXT,
    period        TEXT,
    summary       TEXT,
    cover_image   TEXT,
    docs_url      TEXT,
    video_url     TEXT,
    live_url      TEXT,
    repo_url      TEXT,
    highlights    JSONB NOT NULL DEFAULT '[]'::jsonb,
    content       JSONB NOT NULL DEFAULT '{}'::jsonb,
    display_order INTEGER NOT NULL DEFAULT 0
  )`;

  await sql`CREATE TABLE IF NOT EXISTS case_study_media (
    id              SERIAL PRIMARY KEY,
    case_study_slug TEXT NOT NULL REFERENCES case_studies(slug) ON DELETE CASCADE,
    kind            TEXT NOT NULL,           -- 'diagram' | 'screenshot'
    notation        TEXT,                    -- e.g. 'UML Sequence', 'ERD'
    title           TEXT NOT NULL,
    caption         TEXT,
    image_url       TEXT NOT NULL,
    audience        TEXT,                    -- 'student' | 'teacher' | 'parent' | 'patient' | 'admin'
    is_featured     BOOLEAN NOT NULL DEFAULT false,
    display_order   INTEGER NOT NULL DEFAULT 0
  )`;

  // ---- Site images + analyst profile copy ----
  await sql`
    INSERT INTO site_settings (key, value) VALUES ('images', ${JSON.stringify(SITE_IMAGES)}::jsonb)
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`;

  await sql`
    INSERT INTO site_settings (key, value) VALUES ('profile', ${JSON.stringify(PROFILE_PATCH)}::jsonb)
    ON CONFLICT (key) DO UPDATE SET value = site_settings.value || EXCLUDED.value`;

  // ---- Analysis skills ----
  await sql`DELETE FROM skills WHERE category = 'analysis'`;
  for (const name of ANALYSIS_SKILLS) {
    await sql`INSERT INTO skills (name, category) VALUES (${name}, 'analysis')`;
  }

  // ---- Telkomedika demo video moved to Google Drive ----
  await sql`UPDATE projects SET live_url = ${'https://drive.google.com/file/d/1bPGbGH2NTh23OUemLXYe_uoBYenVL0mu/view?usp=sharing'}
            WHERE title ILIKE '%telkomedika%'`;

  // ---- Case studies + media ----
  for (const cs of CASE_STUDIES) {
    const [project] = await sql`SELECT id FROM projects WHERE title ILIKE ${cs.project_match} ORDER BY id LIMIT 1`;
    const projectId = project?.id ?? null;

    await sql`
      INSERT INTO case_studies (slug, project_id, title, subtitle, role, period, summary, cover_image,
                                docs_url, video_url, live_url, repo_url, highlights, content, display_order)
      VALUES (${cs.slug}, ${projectId}, ${cs.title}, ${cs.subtitle}, ${cs.role}, ${cs.period}, ${cs.summary},
              ${cs.cover_image}, ${cs.docs_url}, ${cs.video_url}, ${cs.live_url}, ${cs.repo_url},
              ${JSON.stringify(cs.highlights)}::jsonb, ${JSON.stringify(cs.content)}::jsonb, ${cs.display_order})
      ON CONFLICT (slug) DO UPDATE SET
        project_id = EXCLUDED.project_id, title = EXCLUDED.title, subtitle = EXCLUDED.subtitle,
        role = EXCLUDED.role, period = EXCLUDED.period, summary = EXCLUDED.summary,
        cover_image = EXCLUDED.cover_image, docs_url = EXCLUDED.docs_url, video_url = EXCLUDED.video_url,
        live_url = EXCLUDED.live_url, repo_url = EXCLUDED.repo_url, highlights = EXCLUDED.highlights,
        content = EXCLUDED.content, display_order = EXCLUDED.display_order`;

    if (projectId) {
      await sql`UPDATE projects SET case_study_slug = ${cs.slug} WHERE id = ${projectId}`;
    }

    await sql`DELETE FROM case_study_media WHERE case_study_slug = ${cs.slug}`;
    let order = 1;
    for (const m of cs.media) {
      await sql`
        INSERT INTO case_study_media (case_study_slug, kind, notation, title, caption, image_url, audience, is_featured, display_order)
        VALUES (${cs.slug}, ${m.kind}, ${m.notation ?? null}, ${m.title}, ${m.caption ?? null}, ${m.image_url},
                ${m.audience ?? null}, ${m.is_featured ?? false}, ${order++})`;
    }
    console.log(`  ✓ ${cs.slug}: ${cs.media.length} media items${projectId ? `, linked to project #${projectId}` : ' (no matching project found)'}`);
  }

  console.log('✓ Case studies, site images, analyst profile & skills migrated.');
} catch (err) {
  console.error('✗ Case study migration failed:', err.message);
  process.exit(1);
}
