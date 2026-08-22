/**
 * ThaparPulse - Academic PYQ & Notes Vault
 * Handles branch/semester filtered previous year papers, topper notes, and instant search
 */

const AcademicModule = {
  vaultItems: [],
  typeFilter: 'all',
  branchFilter: 'all',
  searchQuery: '',

  init() {
    this.vaultItems = [...window.THAPAR_DATA.academicVault];
    this.render();
    this.bindEvents();
  },

  setTypeFilter(type) {
    this.typeFilter = type;
    document.querySelectorAll('.vault-type-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.type === type);
    });
    this.render();
  },

  setBranchFilter(branch) {
    this.branchFilter = branch;
    document.querySelectorAll('.vault-branch-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.branch === branch);
    });
    this.render();
  },

  setSearchQuery(q) {
    this.searchQuery = q.toLowerCase().trim();
    this.render();
  },

  render() {
    const container = document.getElementById('academic-vault-grid');
    if (!container) return;

    const filtered = this.vaultItems.filter(item => {
      // Type Filter
      if (this.typeFilter !== 'all' && item.type.toLowerCase() !== this.typeFilter.toLowerCase()) {
        return false;
      }

      // Branch Filter
      if (this.branchFilter !== 'all') {
        const itemBranch = item.branch.toLowerCase();
        if (this.branchFilter === 'coe' && !itemBranch.includes('coe') && !itemBranch.includes('copc')) return false;
        if (this.branchFilter === 'common' && !itemBranch.includes('common') && !itemBranch.includes('1st')) return false;
      }

      // Search Query
      if (this.searchQuery) {
        const matchesCode = item.courseCode.toLowerCase().includes(this.searchQuery);
        const matchesTitle = item.title.toLowerCase().includes(this.searchQuery);
        const matchesTag = item.tags.some(t => t.toLowerCase().includes(this.searchQuery));
        if (!matchesCode && !matchesTitle && !matchesTag) return false;
      }

      return true;
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 3rem; background: var(--bg-surface-elevated); border-radius: var(--radius-lg);">
          <p style="font-size: 1.1rem; color: var(--text-primary); margin-bottom: 0.5rem;">📚 No study materials found</p>
          <p style="font-size: 0.85rem; color: var(--text-muted);">Try clearing the filters or searching for course codes like <strong>UCS415</strong>, <strong>UMA010</strong>, or <strong>UTA018</strong>.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(item => `
      <div class="paper-card">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.6rem;">
            <span class="subject-code">${item.courseCode}</span>
            <span class="paper-type-tag ${item.type.toLowerCase()}">${item.type} • Sem ${item.semester}</span>
          </div>

          <h3 style="font-size: 1.05rem; font-weight: 700; margin-bottom: 0.4rem; line-height: 1.3;">${item.title}</h3>
          
          <div style="display: flex; flex-wrap: wrap; gap: 0.35rem; margin: 0.6rem 0;">
            ${item.tags.map(t => `<span style="font-size: 0.7rem; background: rgba(255,255,255,0.05); padding: 0.15rem 0.45rem; border-radius: 4px; color: var(--text-secondary);">${t}</span>`).join('')}
          </div>
        </div>

        <div>
          <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.75rem; border-top: 1px solid var(--border-subtle); padding-top: 0.5rem;">
            <span>👤 ${item.uploader}</span>
            <span>⭐ ${item.rating} (${item.downloads} dl)</span>
          </div>

          <div class="paper-actions">
            <button class="btn-download-pyq" onclick="AcademicModule.downloadItem('${item.id}', '${item.title}')">
              <span>📥</span> Download (${item.fileSize})
            </button>
            <button class="header-action-btn" onclick="AcademicModule.previewItem('${item.id}')" style="padding: 0.5rem 0.8rem; font-size: 0.82rem;">
              <span>👁️</span> Preview
            </button>
          </div>
        </div>
      </div>
    `).join('');
  },

  downloadItem(id, title) {
    const item = this.vaultItems.find(i => i.id === id);
    if (item) item.downloads += 1;
    this.render();
    window.App.showToast(`Downloading: ${title}`, 'success');
  },

  previewItem(id) {
    const item = this.vaultItems.find(i => i.id === id);
    if (!item) return;
    
    alert(`[Academic Vault Preview]\n\nCourse: ${item.courseCode} - ${item.title}\nBranch: ${item.branch}\nYear: ${item.year}\nKey Topics Covered: ${item.tags.join(', ')}\n\nUploader: ${item.uploader}`);
  },

  addContribution(newItem) {
    this.vaultItems.unshift({
      id: 'pyq-' + Date.now(),
      rating: 5.0,
      downloads: 1,
      ...newItem
    });
    this.render();
    window.App.showToast('Thank you for contributing to TIET Academic Vault! 🎉', 'success');
  },

  bindEvents() {
    const searchInput = document.getElementById('vault-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.setSearchQuery(e.target.value);
      });
    }

    const contribForm = document.getElementById('form-contrib-pyq');
    if (contribForm) {
      contribForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const code = document.getElementById('pyq-code-input').value;
        const title = document.getElementById('pyq-title-input').value;
        const type = document.getElementById('pyq-type-input').value;
        const branch = document.getElementById('pyq-branch-input').value;
        const semester = parseInt(document.getElementById('pyq-sem-input').value, 10) || 4;
        const tags = document.getElementById('pyq-tags-input').value.split(',').map(s => s.trim()).filter(Boolean);

        if (!code || !title) {
          window.App.showToast('Please specify subject code and title', 'error');
          return;
        }

        this.addContribution({
          courseCode: code.toUpperCase(),
          title,
          type,
          branch,
          semester,
          year: "2026",
          fileSize: "2.8 MB",
          uploader: window.THAPAR_DATA.userProfile.name,
          tags: tags.length > 0 ? tags : ["Lecture Notes", "Exam PYQ"]
        });

        contribForm.reset();
        window.App.closeModal('modal-contrib-pyq');
      });
    }
  }
};

window.AcademicModule = AcademicModule;
