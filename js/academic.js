/**
 * ThaparPulse - Academic PYQ & Notes Vault
 * Handles branch/semester filtered previous year papers, topper notes, lecture PPTs, and Word docs
 */

const AcademicModule = {
  vaultItems: [],
  typeFilter: 'all',
  branchFilter: 'all',
  searchQuery: '',
  currentPreviewItem: null,
  currentPreviewPage: 0,
  selectedUploadFile: null,

  init() {
    this.vaultItems = [...window.THAPAR_DATA.academicVault];
    this.render();
    this.bindEvents();
    this.bindDropzone();
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
      // Format / Type Filter
      if (this.typeFilter !== 'all') {
        const itemType = (item.type || '').toLowerCase();
        const itemFormat = (item.format || '').toLowerCase();
        const tf = this.typeFilter.toLowerCase();
        if (tf === 'pdf' && itemFormat !== 'pdf' && itemType !== 'pdf') return false;
        if (tf === 'ppt' && itemFormat !== 'ppt' && itemType !== 'ppt') return false;
        if ((tf === 'doc' || tf === 'word') && itemFormat !== 'doc' && itemType !== 'doc') return false;
        if (tf === 'mst' && itemType !== 'mst') return false;
        if (tf === 'est' && itemType !== 'est') return false;
        if (tf === 'notes' && itemType !== 'notes') return false;
      }

      // Branch Filter
      if (this.branchFilter !== 'all') {
        const itemBranch = (item.branch || '').toLowerCase();
        const bf = this.branchFilter.toLowerCase();
        if (bf === 'cs' && !itemBranch.includes('computer') && !itemBranch.includes('coe') && !itemBranch.includes('copc') && !itemBranch.includes('cobs') && !itemBranch.includes('aiml')) return false;
        if (bf === 'ec' && !itemBranch.includes('electronics') && !itemBranch.includes('ece') && !itemBranch.includes('enc') && !itemBranch.includes('ee') && !itemBranch.includes('eic')) return false;
        if (bf === 'me' && !itemBranch.includes('mech') && !itemBranch.includes('civil') && !itemBranch.includes('mechatronics')) return false;
        if (bf === 'che' && !itemBranch.includes('chem') && !itemBranch.includes('biotech') && !itemBranch.includes('bme')) return false;
        if (bf === 'common' && !itemBranch.includes('common') && !itemBranch.includes('1st') && !itemBranch.includes('all')) return false;
      }

      // Search Query
      if (this.searchQuery) {
        const matchesCode = (item.courseCode || '').toLowerCase().includes(this.searchQuery);
        const matchesTitle = (item.title || '').toLowerCase().includes(this.searchQuery);
        const matchesTag = (item.tags || []).some(t => t.toLowerCase().includes(this.searchQuery));
        if (!matchesCode && !matchesTitle && !matchesTag) return false;
      }

      return true;
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 3rem; background: var(--bg-surface-elevated); border-radius: var(--radius-lg);">
          <p style="font-size: 1.1rem; color: var(--text-primary); margin-bottom: 0.5rem;">📚 No study materials found</p>
          <p style="font-size: 0.85rem; color: var(--text-muted);">Try clearing the filters or searching for course codes like <strong>UCS415</strong>, <strong>UCS303</strong>, <strong>UMA010</strong>, or <strong>UTA018</strong>.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(item => {
      const format = (item.format || item.type || 'PDF').toUpperCase();
      const formatClass = format.toLowerCase();
      let formatBadgeText = `${format} • Sem ${item.semester || 4}`;
      if (item.type && item.type !== format) {
        formatBadgeText = `${item.type} (${format}) • Sem ${item.semester || 4}`;
      }

      let icon = '📄';
      if (format === 'PPT') icon = '📊';
      if (format === 'DOC' || format === 'WORD') icon = '📝';

      return `
        <div class="paper-card">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.6rem;">
              <span class="subject-code">${item.courseCode}</span>
              <span class="paper-type-tag ${formatClass}">${formatBadgeText}</span>
            </div>

            <h3 style="font-size: 1.05rem; font-weight: 700; margin-bottom: 0.4rem; line-height: 1.3;">${item.title}</h3>
            
            <p style="font-size: 0.76rem; color: var(--text-muted); margin-bottom: 0.5rem;">
              🏛️ ${item.branch}
            </p>

            <div style="display: flex; flex-wrap: wrap; gap: 0.35rem; margin: 0.6rem 0;">
              ${(item.tags || []).map(t => `<span style="font-size: 0.7rem; background: rgba(255,255,255,0.05); padding: 0.15rem 0.45rem; border-radius: 4px; color: var(--text-secondary);">${t}</span>`).join('')}
            </div>
          </div>

          <div>
            <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.75rem; border-top: 1px solid var(--border-subtle); padding-top: 0.5rem;">
              <span>👤 ${item.uploader}</span>
              <span>⭐ ${item.rating || 5.0} (${item.downloads || 0} dl)</span>
            </div>

            <div class="paper-actions">
              <button class="btn-download-pyq" onclick="AcademicModule.downloadItem('${item.id}', '${item.title}')">
                <span>📥</span> Download (${item.fileSize || '3.2 MB'})
              </button>
              <button class="header-action-btn" onclick="AcademicModule.previewItem('${item.id}')" style="padding: 0.5rem 0.8rem; font-size: 0.82rem;">
                <span>👁️</span> Preview
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  previewItem(id) {
    const item = this.vaultItems.find(i => i.id === id);
    if (!item) return;

    this.currentPreviewItem = item;
    this.currentPreviewPage = 0;

    const modal = document.getElementById('modal-preview-doc');
    const titleEl = document.getElementById('doc-viewer-title');
    const metaEl = document.getElementById('doc-viewer-meta');
    const badgeEl = document.getElementById('doc-viewer-format-badge');
    const downloadBtn = document.getElementById('doc-viewer-download-btn');

    const format = (item.format || item.type || 'PDF').toUpperCase();

    if (titleEl) titleEl.innerText = `${item.courseCode} — ${item.title}`;
    if (metaEl) metaEl.innerText = `${item.branch} • Sem ${item.semester || 4} • ${item.fileSize || '3.2 MB'} • Uploaded by ${item.uploader}`;
    
    if (badgeEl) {
      badgeEl.innerText = format;
      badgeEl.className = `paper-type-tag ${format.toLowerCase()}`;
    }

    if (downloadBtn) {
      downloadBtn.onclick = () => this.downloadItem(item.id, item.title);
    }

    this.renderPreviewPage();

    if (modal) modal.classList.add('active');
  },

  renderPreviewPage() {
    const item = this.currentPreviewItem;
    const bodyEl = document.getElementById('doc-viewer-body');
    const indicatorEl = document.getElementById('doc-viewer-page-indicator');
    const prevBtn = document.getElementById('doc-prev-page-btn');
    const nextBtn = document.getElementById('doc-next-page-btn');

    if (!item || !bodyEl) return;

    const pages = item.pages && item.pages.length > 0 ? item.pages : [
      {
        heading: `${item.title} Overview`,
        content: `Document Summary & Highlights:\n\n• Course Code: ${item.courseCode}\n• Branch / Department: ${item.branch}\n• Academic Year: ${item.year || '2025-26'}\n• Semester: Semester ${item.semester || 4}\n• Key Topics: ${(item.tags || []).join(', ')}\n\nThis material contains verified questions, step-by-step mathematical proofs, solved numerical problems, and exam tips reviewed by TIET faculty toppers.`
      }
    ];

    const totalPages = pages.length;
    const currentPage = Math.min(this.currentPreviewPage, totalPages - 1);
    const pageData = pages[currentPage];
    const format = (item.format || item.type || 'PDF').toUpperCase();

    if (indicatorEl) {
      indicatorEl.innerText = format === 'PPT' ? `Slide ${currentPage + 1} of ${totalPages}` : `Page ${currentPage + 1} of ${totalPages}`;
    }

    if (prevBtn) prevBtn.disabled = currentPage === 0;
    if (nextBtn) nextBtn.disabled = currentPage === totalPages - 1;

    let visualLayout = '';
    if (format === 'PPT') {
      visualLayout = `
        <div style="background: linear-gradient(135deg, #1e293b, #0f172a); border: 2px solid rgba(249, 115, 22, 0.4); border-radius: var(--radius-lg); padding: 2rem; min-height: 380px; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 0.75rem;">
              <span style="font-size: 0.8rem; font-weight: 700; color: #fb923c; text-transform: uppercase; letter-spacing: 0.05em;">📊 PowerPoint Slide #${currentPage + 1}</span>
              <span style="font-size: 0.75rem; color: var(--text-muted);">${item.courseCode} TIET Lecture</span>
            </div>
            <h3 style="font-size: 1.4rem; font-weight: 800; color: #fff; margin-bottom: 1.25rem;">${pageData.heading}</h3>
            <div style="font-size: 1.02rem; line-height: 1.8; color: #e2e8f0; white-space: pre-wrap; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">${pageData.content}</div>
          </div>
          <div style="margin-top: 1.5rem; font-size: 0.75rem; color: var(--text-muted); text-align: right;">
            Thapar Institute of Engineering & Technology • Academic Vault
          </div>
        </div>
      `;
    } else if (format === 'DOC' || format === 'WORD') {
      visualLayout = `
        <div style="background: #ffffff; color: #1e293b; border-radius: var(--radius-md); padding: 2.5rem 3rem; min-height: 420px; box-shadow: 0 8px 30px rgba(0,0,0,0.4); font-family: 'Segoe UI', Calibri, sans-serif;">
          <div style="border-bottom: 2px solid #2563eb; padding-bottom: 0.8rem; margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <h2 style="font-size: 1.3rem; font-weight: 800; color: #1e3a8a; margin: 0;">${item.title}</h2>
              <p style="font-size: 0.8rem; color: #64748b; margin: 0.2rem 0 0;">Department of ${item.branch} • Semester ${item.semester || 4}</p>
            </div>
            <span style="background: #dbeafe; color: #1d4ed8; font-weight: 700; font-size: 0.75rem; padding: 0.2rem 0.6rem; border-radius: 4px;">Word Document</span>
          </div>
          <h3 style="font-size: 1.15rem; font-weight: 700; color: #0f172a; margin-bottom: 1rem;">${pageData.heading}</h3>
          <div style="font-size: 0.95rem; line-height: 1.7; color: #334155; white-space: pre-wrap; background: #f8fafc; padding: 1.25rem; border-radius: 6px; border-left: 4px solid #3b82f6;">${pageData.content}</div>
        </div>
      `;
    } else {
      // PDF Exam / Notes Format
      visualLayout = `
        <div style="background: #131826; border: 1px solid var(--border-medium); border-radius: var(--radius-lg); padding: 2.5rem; min-height: 420px; box-shadow: 0 8px 30px rgba(0,0,0,0.5);">
          <div style="border-bottom: 1px solid var(--border-subtle); padding-bottom: 1rem; margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <span style="font-size: 0.78rem; text-transform: uppercase; color: var(--tiet-gold); font-weight: 700;">TIET Examination Section & Academic Vault</span>
              <h2 style="font-size: 1.25rem; font-weight: 800; color: #fff; margin-top: 0.2rem;">${item.courseCode}: ${item.title}</h2>
            </div>
            <span class="paper-type-tag pdf" style="font-size: 0.8rem;">PDF • ${pageData.heading.split(':')[0] || 'Paper'}</span>
          </div>

          <h3 style="font-size: 1.1rem; font-weight: 700; color: var(--text-primary); margin-bottom: 1rem; color: #38bdf8;">${pageData.heading}</h3>
          <div style="font-size: 0.95rem; line-height: 1.75; color: #cbd5e1; white-space: pre-wrap; background: rgba(0,0,0,0.25); padding: 1.25rem; border-radius: 8px; border-left: 4px solid var(--tiet-crimson);">${pageData.content}</div>
        </div>
      `;
    }

    bodyEl.innerHTML = visualLayout;
  },

  nextPreviewPage() {
    if (!this.currentPreviewItem) return;
    const pages = this.currentPreviewItem.pages || [];
    if (this.currentPreviewPage < pages.length - 1) {
      this.currentPreviewPage++;
      this.renderPreviewPage();
    }
  },

  prevPreviewPage() {
    if (this.currentPreviewPage > 0) {
      this.currentPreviewPage--;
      this.renderPreviewPage();
    }
  },

  closePreview() {
    const modal = document.getElementById('modal-preview-doc');
    if (modal) modal.classList.remove('active');
    this.currentPreviewItem = null;
  },

  downloadItem(id, title) {
    const item = this.vaultItems.find(i => i.id === id);
    if (!item) return;

    item.downloads = (item.downloads || 0) + 1;
    this.render();

    // Determine extension and mime type
    const format = (item.format || item.type || 'PDF').toUpperCase();
    let ext = 'pdf';
    let mimeType = 'application/pdf';

    if (format === 'PPT') {
      ext = 'pptx';
      mimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    } else if (format === 'DOC' || format === 'WORD') {
      ext = 'docx';
      mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    }

    // Build real text/markdown document content
    const documentContent = `
================================================================================
THAPAR INSTITUTE OF ENGINEERING & TECHNOLOGY (TIET), PATIALA
ACADEMIC VAULT — ${item.courseCode}
================================================================================
Document Title : ${item.title}
Material Type  : ${item.type || format} (${format})
Department     : ${item.branch}
Semester       : Semester ${item.semester || 4}
Academic Year  : ${item.year || '2025-26'}
File Size      : ${item.fileSize || '3.2 MB'}
Contributed by : ${item.uploader}
Rating         : ⭐ ${item.rating || 5.0}

--------------------------------------------------------------------------------
KEY SYLLABUS & TOPICS COVERED:
${(item.tags || []).map(t => `  • ${t}`).join('\n')}
--------------------------------------------------------------------------------

DETAILED DOCUMENT CONTENT / SOLUTIONS / LECTURE NOTES:

${(item.pages || []).map((p, idx) => `[SECTION / SLIDE ${idx + 1}]: ${p.heading}\n\n${p.content}\n\n--------------------------------------------------------------------------------\n`).join('\n')}

Verified by TIET Student Academic Community.
Downloaded from ThaparPulse Academic Portal.
================================================================================
`;

    const blob = new Blob([documentContent], { type: mimeType });
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    const cleanName = (item.courseCode + '_' + item.title).replace(/[^a-zA-Z0-9_-]/g, '_');
    link.download = `${cleanName}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);

    window.App.showToast(`Downloaded: ${item.title} (${item.fileSize || '3.2 MB'}) 🎉`, 'success');
  },

  bindDropzone() {
    const dropzone = document.getElementById('pyq-dropzone');
    const fileInput = document.getElementById('pyq-file-input');

    if (!dropzone || !fileInput) return;

    // File input change
    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        this.handleFileSelected(e.target.files[0]);
      }
    });

    // Drag and Drop
    ['dragenter', 'dragover'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add('dragover');
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('dragover');
      }, false);
    });

    dropzone.addEventListener('drop', (e) => {
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        this.handleFileSelected(e.dataTransfer.files[0]);
      }
    });
  },

  handleFileSelected(file) {
    this.selectedUploadFile = file;

    const name = file.name;
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    const ext = name.split('.').pop().toLowerCase();

    let icon = '📄';
    let detectedFormat = 'PDF';

    if (ext === 'ppt' || ext === 'pptx') {
      icon = '📊';
      detectedFormat = 'PPT';
    } else if (ext === 'doc' || ext === 'docx') {
      icon = '📝';
      detectedFormat = 'DOC';
    } else if (ext === 'pdf') {
      icon = '📄';
      detectedFormat = 'PDF';
    }

    const previewContainer = document.getElementById('file-preview-container');
    const nameEl = document.getElementById('preview-file-name');
    const sizeEl = document.getElementById('preview-file-size');
    const iconEl = document.getElementById('preview-file-icon');
    const dropzoneText = document.getElementById('dropzone-text');
    const typeSelect = document.getElementById('pyq-type-input');
    const titleInput = document.getElementById('pyq-title-input');

    if (previewContainer) previewContainer.style.display = 'flex';
    if (nameEl) nameEl.innerText = name;
    if (sizeEl) sizeEl.innerText = `${sizeMB} MB • ${detectedFormat} Format`;
    if (iconEl) iconEl.innerText = icon;
    if (dropzoneText) dropzoneText.innerText = `File Selected: ${name}`;

    if (typeSelect && detectedFormat !== 'PDF') {
      typeSelect.value = detectedFormat;
    }

    if (titleInput && !titleInput.value) {
      titleInput.value = name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
    }

    window.App.showToast(`File selected: ${name} (${sizeMB} MB)`, 'info');
  },

  clearSelectedFile() {
    this.selectedUploadFile = null;
    const fileInput = document.getElementById('pyq-file-input');
    const previewContainer = document.getElementById('file-preview-container');
    const dropzoneText = document.getElementById('dropzone-text');

    if (fileInput) fileInput.value = '';
    if (previewContainer) previewContainer.style.display = 'none';
    if (dropzoneText) dropzoneText.innerText = 'Click or drag & drop file to upload';
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

    // Modal preview page buttons
    const prevBtn = document.getElementById('doc-prev-page-btn');
    const nextBtn = document.getElementById('doc-next-page-btn');
    if (prevBtn) prevBtn.addEventListener('click', () => this.prevPreviewPage());
    if (nextBtn) nextBtn.addEventListener('click', () => this.nextPreviewPage());

    const contribForm = document.getElementById('form-contrib-pyq');
    if (contribForm) {
      contribForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const code = document.getElementById('pyq-code-input').value.trim();
        const title = document.getElementById('pyq-title-input').value.trim();
        const type = document.getElementById('pyq-type-input').value;
        const branch = document.getElementById('pyq-branch-input').value;
        const semester = parseInt(document.getElementById('pyq-sem-input').value, 10) || 4;
        const tagsInput = document.getElementById('pyq-tags-input').value;
        const tags = tagsInput.split(',').map(s => s.trim()).filter(Boolean);

        if (!code || !title) {
          window.App.showToast('Please specify subject code and title', 'error');
          return;
        }

        let format = 'PDF';
        if (type === 'PPT') format = 'PPT';
        else if (type === 'DOC') format = 'DOC';
        else if (this.selectedUploadFile) {
          const ext = this.selectedUploadFile.name.split('.').pop().toLowerCase();
          if (ext === 'ppt' || ext === 'pptx') format = 'PPT';
          else if (ext === 'doc' || ext === 'docx') format = 'DOC';
        }

        const sizeStr = this.selectedUploadFile ? `${(this.selectedUploadFile.size / (1024 * 1024)).toFixed(1)} MB` : "3.1 MB";

        this.addContribution({
          courseCode: code.toUpperCase(),
          title,
          type,
          format,
          branch,
          semester,
          year: "2026",
          fileSize: sizeStr,
          uploader: window.THAPAR_DATA.userProfile.name + ` (${window.THAPAR_DATA.userProfile.branch.split(' ')[0]})`,
          tags: tags.length > 0 ? tags : ["Uploaded Notes", "TIET Verified"],
          pages: [
            {
              heading: `${title} — Key Highlights & Contents`,
              content: `Uploaded Study Document for ${code.toUpperCase()} (${branch}):\n\n• Course: ${code.toUpperCase()}\n• Target Semester: Semester ${semester}\n• Material Category: ${type} (${format})\n• Topics: ${(tags.length > 0 ? tags : ["Lecture Notes", "Important Questions"]).join(', ')}\n\nThis document was contributed by ${window.THAPAR_DATA.userProfile.name} to help TIET peers prepare for MST/EST exams.`
            }
          ]
        });

        contribForm.reset();
        this.clearSelectedFile();
        window.App.closeModal('modal-contrib-pyq');
      });
    }
  }
};

window.AcademicModule = AcademicModule;
