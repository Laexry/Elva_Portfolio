/**
 * js/portfolio.js
 * Client-side loader — fetches /api/portfolio and populates the page.
 */
(function () {
  'use strict';

  function esc(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // All content comes from the database (see scripts/migrate-content.mjs).
  let CERT_GROUPS = [];

  function resolveImage(project) {
    return project.image_url || 'images/folder.png';
  }

  // Splits a description into paragraphs: first sentence, then the rest.
  function descriptionParagraphs(text) {
    const parts = String(text || '')
      .split(/(?<=[.!?])\s+(?=[A-Z])/)
      .map(s => s.trim())
      .filter(Boolean);
    if (parts.length <= 1) return parts;
    return [parts[0], parts.slice(1).join(' ')];
  }

  function groupCopy(issuer, items) {
    const g = CERT_GROUPS.find(x => x.issuer_key && issuer.toLowerCase().includes(x.issuer_key.toLowerCase()));
    const short = issuer.split('(')[0].trim();
    const seal = short.length <= 5
      ? short.toUpperCase()
      : short.split(/\s+/).map(w => w[0]).join('').slice(0, 4).toUpperCase();
    return {
      seal: (g && g.seal) || seal,
      eyebrow: (g && g.eyebrow) || 'Certified',
      headline: (g && g.headline) || (items.length === 1 ? (items[0].display_title || items[0].title) : short),
      blurb: (g && g.blurb) || '',
      chips: (g && g.chips) || []
    };
  }

  function fileCopy(cert) {
    return { title: cert.display_title || cert.title, sub: cert.subtitle || '' };
  }

  // ----------------------------------------------------------------
  // Profile / hero / about / contacts
  // ----------------------------------------------------------------
  function setText(selector, value) {
    if (!value) return;
    document.querySelectorAll(selector).forEach(el => { el.textContent = value; });
  }

  function renderProfile(p) {
    if (!p) return;
    setText('[data-content="name"]', p.name ? `{{ ${p.name} }}` : '');
    setText('[data-content="short-name"]', p.short_name ? `${p.short_name}'s` : '');
    setText('[data-content="greeting"]', p.greeting);
    setText('[data-content="role"]', p.role);
    setText('[data-content="tagline"]', p.tagline);

    const about = document.querySelector('[data-content="about"]');
    if (about && Array.isArray(p.about) && p.about.length) {
      about.innerHTML = p.about.map(t => `<p>${esc(t)}</p>`).join('');
    }
    if (p.name) {
      document.title = `${p.short_name || p.name}'s Portfolio`;
      document.querySelectorAll('[data-content-alt="name"]').forEach(img => {
        img.alt = `${img.dataset.altPrefix || ''}${p.name}`;
      });
    }
    if (p.email) document.body.dataset.email = p.email;
  }

  function renderContacts(contacts) {
    const box = document.querySelector('.contact_section');
    if (!box || !contacts || !contacts.length) return;
    box.innerHTML = contacts.map(c => {
      const external = /^https?:/i.test(c.url);
      return `
        <div class="link ${esc(c.type)}">
          ${c.icon ? `<img src="${esc(c.icon)}" alt="" aria-hidden="true" loading="lazy">` : ''}
          <a href="${esc(c.url)}"${external ? ' target="_blank" rel="noopener"' : ''}>${esc(c.label)}</a>
        </div>`;
    }).join('');
  }

  // ----------------------------------------------------------------
  // Project Card — uses original CSS classes from style.css
  // ----------------------------------------------------------------
  function buildProjectCard(project) {
    const isYouTube = project.live_url && project.live_url.includes('youtu');
    const isFigma   = project.live_url && project.live_url.includes('figma.com');

    // Badge (Mobile UI/UX, Web UI/UX, etc.)
    const badge = project.badge_label
      ? `<span class="card-badge">${esc(project.badge_label)}</span>`
      : '';

    // Year pill
    const yearPill = project.year
      ? `<span class="proj_year">${esc(project.year)}</span>`
      : '';

    // Tool badges
    const toolBadges = (project.tools || [])
      .map(t => `<span class="using">${esc(t)}</span>`)
      .join('');

    // Source Code button
    const codeBtn = project.github_url
      ? `<a class="code" href="${esc(project.github_url)}" target="_blank" rel="noopener">
           <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
             <path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.5-1.4-1.3-1.8-1.3-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2 0-.4-.5-1.6.2-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17 4.7 18 5 18 5c.7 1.6.2 2.8.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3"/>
           </svg>
           Source Code
         </a>`
      : '';

    // Live / Demo / Figma button
    let liveBtn = '';
    if (project.live_url) {
      if (isFigma) {
        liveBtn = `<a class="prototype" href="${esc(project.live_url)}" target="_blank" rel="noopener">
           <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
             <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
             <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
           </svg>
           View Figma Prototype
         </a>`;
      } else if (isYouTube) {
        liveBtn = `<a class="web" href="${esc(project.live_url)}" target="_blank" rel="noopener">
           <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
             <polygon points="5 3 19 12 5 21 5 3"/>
           </svg>
           Watch Demo
         </a>`;
      } else {
        liveBtn = `<a class="web" href="${esc(project.live_url)}" target="_blank" rel="noopener">
           <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
             <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
             <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
           </svg>
           Live Demo
         </a>`;
      }
    }

    const imgSrc = encodeURI(resolveImage(project));

    return `
      <div class="card" tabindex="0">
        <div class="card-img-wrapper">
          <img src="${esc(imgSrc)}" alt="${esc(project.title)} preview" loading="lazy" onerror="this.src='images/folder.png'">
          ${badge}
        </div>
        <div class="project_name">
          <div class="project-header">
            <h3>${esc(project.title)}</h3>
            ${yearPill}
          </div>
          <div class="proj_desc">
            ${descriptionParagraphs(project.description).map(p => `<p>${esc(p)}</p>`).join('')}
          </div>
          <div class="tools">${toolBadges}</div>
          <div class="sources">
            ${codeBtn}
            ${liveBtn}
          </div>
        </div>
      </div>
    `;
  }

  // ----------------------------------------------------------------
  // Skills — "Label: value" → <li><span>Label:</span> value</li>
  // ----------------------------------------------------------------
  function renderSkills(skills) {
    const technical = skills.filter(s => s.category === 'technical');
    const design    = skills.filter(s => s.category === 'design');

    function toListItem(s) {
      const colonIdx = s.name.indexOf(': ');
      if (colonIdx !== -1) {
        const label = s.name.slice(0, colonIdx);
        const value = s.name.slice(colonIdx + 2);
        return `<li><span>${esc(label)}:</span> ${esc(value)}</li>`;
      }
      return `<li>${esc(s.name)}</li>`;
    }

    const techList   = document.querySelector('.skill_title.tech ul');
    const designList = document.querySelector('.skill_title.design ul');

    if (techList   && technical.length) techList.innerHTML   = technical.map(toListItem).join('');
    if (designList && design.length)    designList.innerHTML = design.map(toListItem).join('');
  }

  // ----------------------------------------------------------------
  // Certifications — accordion / dropdown with PDF open buttons
  // ----------------------------------------------------------------
  function renderCertifications(certs) {
    if (!certs || certs.length === 0) return;

    const section    = document.getElementById('certifications');
    const navCerts   = document.getElementById('nav-certs');
    const accordion  = section ? section.querySelector('.cert-accordion') : null;

    if (section)  section.removeAttribute('hidden');
    if (navCerts) navCerts.removeAttribute('hidden');
    if (!accordion) return;

    // Build each accordion item
    const groups = {};
certs.forEach(c => {
  const key = c.issuer || 'Certificates';
  (groups[key] = groups[key] || []).push(c);
});

accordion.innerHTML = Object.entries(groups).map(([issuer, items], i) => {
  const g = groupCopy(issuer, items);
  const single = items.length === 1;
  const issuerShort = issuer.split('(')[0].trim();

  const buttons = cert => {
    const pdfPath = cert.pdf_file;
    const pdfBtn = pdfPath
      ? `<a class="cert-pdf-btn" href="${esc(encodeURI(pdfPath))}" target="_blank" rel="noopener">Open PDF</a>`
      : '';
    const credBtn = cert.credential_url
      ? `<a class="cert-cred-btn" href="${esc(cert.credential_url)}" target="_blank" rel="noopener">View Credential ↗</a>`
      : '';
    return pdfBtn + credBtn;
  };

  const files = items.map(cert => {
    const c = fileCopy(cert);
    return `
      <li class="cert-file">
        <div class="cert-file-info">
          <span class="cert-file-title">${esc(c.title)}</span>
          ${c.sub ? `<span class="cert-file-sub">${esc(c.sub)}</span>` : ''}
        </div>
        <div class="cert-actions">${buttons(cert)}</div>
      </li>`;
  }).join('');

  const chips = g.chips.map(x => `<span class="cert-chip">${esc(x)}</span>`).join('');

  return `
    <article class="cert-item" id="cert-item-${i}">
      <div class="cert-hero">
        <div class="cert-seal" aria-hidden="true">${esc(g.seal)}</div>
        <div class="cert-hero-text">
          <p class="cert-eyebrow">${esc(g.eyebrow)} · ${esc(issuerShort)}</p>
          <h3 class="cert-headline">${esc(g.headline)}</h3>
          ${g.blurb ? `<p class="cert-blurb">${esc(g.blurb)}</p>` : ''}
          ${chips ? `<div class="cert-chips">${chips}</div>` : ''}
          ${single ? `<div class="cert-actions cert-single-actions">${buttons(items[0])}</div>` : ''}
        </div>
      </div>
      ${single ? '' : `
      <button class="cert-toggle" aria-expanded="false" aria-controls="cert-body-${i}">
        <span class="cert-toggle-title">View ${items.length} documents</span>
        <svg class="cert-chevron" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      <div class="cert-body" id="cert-body-${i}" hidden>
        <ul class="cert-files">${files}</ul>
      </div>`}
    </article>`;
}).join('');

    // Wire up accordion toggles
    accordion.querySelectorAll('.cert-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const expanded = btn.getAttribute('aria-expanded') === 'true';
        const bodyId   = btn.getAttribute('aria-controls');
        const body     = document.getElementById(bodyId);
        const chevron  = btn.querySelector('.cert-chevron');

        // Collapse all others
        accordion.querySelectorAll('.cert-toggle').forEach(other => {
          if (other !== btn) {
            other.setAttribute('aria-expanded', 'false');
            const otherBody = document.getElementById(other.getAttribute('aria-controls'));
            if (otherBody) otherBody.hidden = true;
            const otherChevron = other.querySelector('.cert-chevron');
            if (otherChevron) otherChevron.style.transform = '';
          }
        });

        // Toggle this one
        btn.setAttribute('aria-expanded', String(!expanded));
        if (body) body.hidden = expanded;
        if (chevron) chevron.style.transform = expanded ? '' : 'rotate(180deg)';
      });
    });
  }

  // ----------------------------------------------------------------
  // Main loader
  // ----------------------------------------------------------------
  async function loadPortfolio() {
    const statusEl = document.getElementById('projects-status');
    const retryBtn = document.getElementById('projects-retry');

    async function fetchAndRender() {
      if (statusEl) statusEl.hidden = true;

      try {
        const res = await fetch('/api/portfolio');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        const { projects = [], skills = [], certifications = [], profile = null, contacts = [], certGroups = [] } = data;
        CERT_GROUPS = certGroups;
        renderProfile(profile);
        renderContacts(contacts);

        const devProjects    = projects.filter(p => p.category === 'development');
        const designProjects = projects.filter(p => p.category === 'design');

        const devTrack    = document.querySelector('#dev-projects .slider-track');
        const designTrack = document.querySelector('#design-projects .slider-track');

        if (devTrack) {
          devTrack.innerHTML = devProjects.length
            ? devProjects.map(buildProjectCard).join('')
            : '<p class="no-items">No development projects yet.</p>';
        }
        if (designTrack) {
          designTrack.innerHTML = designProjects.length
            ? designProjects.map(buildProjectCard).join('')
            : '<p class="no-items">No design projects yet.</p>';
        }

        if (typeof window.initProjectCarousels === 'function') {
          window.initProjectCarousels();
        }

        renderSkills(skills);
        renderCertifications(certifications);

      } catch (err) {
        console.error('Portfolio load error:', err);
        document.querySelectorAll('.card.skeleton').forEach(el => el.remove());
        if (statusEl) statusEl.hidden = false;
      }
    }

    if (retryBtn) retryBtn.addEventListener('click', fetchAndRender);
    await fetchAndRender();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadPortfolio);
  } else {
    loadPortfolio();
  }
})();
