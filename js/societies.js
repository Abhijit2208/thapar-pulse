/**
 * ThaparPulse - Societies & Events Radar
 * Directory of TIET Student Chapters, recruitment rounds, and Saturnalia/Urja updates
 */

const SocietiesModule = {
  societies: [],
  categoryFilter: 'all',

  init() {
    this.societies = [...window.THAPAR_DATA.societies];
    this.render();
  },

  setCategory(cat) {
    this.categoryFilter = cat;
    document.querySelectorAll('.soc-cat-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.cat === cat);
    });
    this.render();
  },

  render() {
    const container = document.getElementById('societies-radar-grid');
    if (!container) return;

    const filtered = this.societies.filter(soc => {
      if (this.categoryFilter !== 'all') {
        const catLower = soc.category.toLowerCase();
        if (this.categoryFilter === 'tech' && !catLower.includes('coding') && !catLower.includes('tech') && !catLower.includes('cyber')) return false;
        if (this.categoryFilter === 'cultural' && !catLower.includes('cultural') && !catLower.includes('induction') && !catLower.includes('events')) return false;
      }
      return true;
    });

    container.innerHTML = filtered.map(soc => `
      <div class="society-card">
        <div>
          <div class="society-badge-row">
            <div class="society-logo-icon">
              <span>${soc.logoEmoji}</span>
            </div>
            <span class="society-recruitment-status ${soc.recruitmentStatus.includes('Open') ? 'active' : 'upcoming'}">
              ${soc.recruitmentStatus}
            </span>
          </div>

          <div style="margin-top: 1rem;">
            <h3 style="font-size: 1.15rem; font-weight: 800;">${soc.name}</h3>
            <p style="font-size: 0.78rem; color: var(--tiet-gold); font-weight: 600; margin-top: 0.15rem;">${soc.category} • ${soc.instaHandle}</p>
          </div>

          <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5; margin: 0.75rem 0;">
            ${soc.description}
          </p>

          <div style="margin: 0.75rem 0;">
            <span style="font-size: 0.72rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">Open Roles / Verticals:</span>
            <div style="display: flex; flex-wrap: wrap; gap: 0.35rem; margin-top: 0.35rem;">
              ${soc.roles.map(r => `<span style="font-size: 0.72rem; background: rgba(255, 255, 255, 0.05); padding: 0.15rem 0.5rem; border-radius: 4px; color: var(--text-primary);">${r}</span>`).join('')}
            </div>
          </div>
        </div>

        <div style="border-top: 1px solid var(--border-subtle); padding-top: 0.85rem; display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 0.78rem; color: var(--danger-rose); font-weight: 600;">⏰ Closes: ${soc.deadline}</span>
          <a href="${soc.registrationLink}" target="_blank" rel="noopener noreferrer" class="btn-download-pyq" style="padding: 0.45rem 0.9rem; font-size: 0.82rem;">
            Apply Now ➔
          </a>
        </div>
      </div>
    `).join('');
  }
};

window.SocietiesModule = SocietiesModule;
