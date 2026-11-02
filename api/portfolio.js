// api/portfolio.js
// Public read-only endpoint: GET /api/portfolio
import { getDb } from './_lib/db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const sql = await getDb();

    const projects = await sql`
      SELECT id, title, description, image_url, category, live_url, github_url, year, badge_label, display_order
      FROM projects
      ORDER BY display_order ASC, id ASC
    `;

    const projectIds = projects.map(p => p.id);
    let tools = [];

    if (projectIds.length > 0) {
      tools = await sql`
        SELECT project_id, name
        FROM project_tools
        WHERE project_id = ANY(${projectIds})
        ORDER BY project_id, id
      `;
    }

    const toolsMap = {};
    tools.forEach(t => {
      if (!toolsMap[t.project_id]) toolsMap[t.project_id] = [];
      toolsMap[t.project_id].push(t.name);
    });

    const enrichedProjects = projects.map(p => ({
      ...p,
      tools: toolsMap[p.id] || [],
    }));

    const skills = await sql`
      SELECT id, name, category FROM skills ORDER BY category, id
    `;

    const certifications = await sql`
      SELECT *
      FROM certifications
      ORDER BY display_order ASC, id ASC
    `;

    // Optional content tables (created by `npm run db:content`)
    const optional = async (query, fallback) => {
      try { return await query(); } catch { return fallback; }
    };
    const profileRows = await optional(() => sql`SELECT value FROM site_settings WHERE key = 'profile'`, []);
    const contacts    = await optional(() => sql`SELECT type, label, url, icon FROM contacts ORDER BY display_order, id`, []);
    const certGroups  = await optional(() => sql`SELECT * FROM cert_groups`, []);

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return res.status(200).json({
      profile: profileRows[0]?.value || null,
      contacts,
      certGroups,
      projects: enrichedProjects,
      skills,
      certifications,
    });
  } catch (err) {
    console.error('Portfolio API error:', err);
    return res.status(500).json({ error: 'Failed to load portfolio data.' });
  }
}
