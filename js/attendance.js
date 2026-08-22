/**
 * ThaparPulse - Smart Attendance & Bunk Predictor
 * Implements TIET 75% attendance rule logic & safe bunks algorithm
 */

const AttendanceModule = {
  subjects: [],
  targetPercentage: 75,

  init() {
    this.loadState();
    this.render();
    this.bindEvents();
  },

  loadState() {
    const saved = localStorage.getItem('thapar_attendance_subjects');
    if (saved) {
      try {
        this.subjects = JSON.parse(saved);
      } catch (e) {
        this.subjects = [...window.THAPAR_DATA.attendanceSubjects];
      }
    } else {
      this.subjects = [...window.THAPAR_DATA.attendanceSubjects];
    }

    const savedTarget = localStorage.getItem('thapar_attendance_target');
    if (savedTarget) {
      this.targetPercentage = parseInt(savedTarget, 10) || 75;
    }
  },

  saveState() {
    localStorage.setItem('thapar_attendance_subjects', JSON.stringify(this.subjects));
    localStorage.setItem('thapar_attendance_target', this.targetPercentage.toString());
  },

  calculateBunkMetrics(attended, total, targetPct = this.targetPercentage) {
    const currentPct = total > 0 ? (attended / total) * 100 : 100;
    
    // Formula for safe bunks: floor((attended - (targetPct/100)*total) / (targetPct/100))
    // Formula for required streak to reach targetPct: ceil(((targetPct/100)*total - attended) / (1 - (targetPct/100)))
    const targetDecimal = targetPct / 100;
    
    let safeBunks = 0;
    let requiredClasses = 0;
    let status = 'safe'; // 'safe' | 'warning' | 'danger'

    if (currentPct >= targetPct) {
      safeBunks = Math.floor((attended - targetDecimal * total) / targetDecimal);
      if (safeBunks < 0) safeBunks = 0;
      status = currentPct < targetPct + 5 ? 'warning' : 'safe';
    } else {
      requiredClasses = Math.ceil((targetDecimal * total - attended) / (1 - targetDecimal));
      status = 'danger';
    }

    return {
      currentPct: currentPct.toFixed(1),
      safeBunks,
      requiredClasses,
      status
    };
  },

  getOverallMetrics() {
    let totalClasses = 0;
    let attendedClasses = 0;

    this.subjects.forEach(sub => {
      totalClasses += sub.totalClasses;
      attendedClasses += sub.attendedClasses;
    });

    const overallPct = totalClasses > 0 ? ((attendedClasses / totalClasses) * 100).toFixed(1) : "100.0";
    const status = overallPct >= this.targetPercentage ? (overallPct < this.targetPercentage + 5 ? 'warning' : 'safe') : 'danger';

    let safeSubjectsCount = 0;
    let criticalSubjectsCount = 0;

    this.subjects.forEach(sub => {
      const metric = this.calculateBunkMetrics(sub.attendedClasses, sub.totalClasses);
      if (metric.status === 'safe' || metric.status === 'warning') safeSubjectsCount++;
      else criticalSubjectsCount++;
    });

    return {
      totalClasses,
      attendedClasses,
      overallPct: parseFloat(overallPct),
      status,
      safeSubjectsCount,
      criticalSubjectsCount
    };
  },

  render() {
    this.renderOverview();
    this.renderSubjectCards();
  },

  renderOverview() {
    const metrics = this.getOverallMetrics();
    
    // Update summary metrics in DOM
    const overallPctEl = document.getElementById('metric-overall-pct');
    const attendedFractionEl = document.getElementById('metric-attended-fraction');
    const safeCountEl = document.getElementById('metric-safe-count');
    const criticalCountEl = document.getElementById('metric-critical-count');
    const ringCircle = document.getElementById('attendance-ring-progress');
    const ringText = document.getElementById('attendance-ring-text');

    if (overallPctEl) {
      overallPctEl.innerText = `${metrics.overallPct}%`;
      overallPctEl.className = `metric-value ${metrics.status}`;
    }

    if (attendedFractionEl) {
      attendedFractionEl.innerText = `${metrics.attendedClasses} / ${metrics.totalClasses}`;
    }

    if (safeCountEl) {
      safeCountEl.innerText = metrics.safeSubjectsCount;
    }

    if (criticalCountEl) {
      criticalCountEl.innerText = metrics.criticalSubjectsCount;
      criticalCountEl.className = `metric-value ${metrics.criticalSubjectsCount > 0 ? 'danger' : 'safe'}`;
    }

    if (ringCircle && ringText) {
      const radius = 50;
      const circumference = 2 * Math.PI * radius;
      ringCircle.style.strokeDasharray = `${circumference} ${circumference}`;
      
      const offset = circumference - (metrics.overallPct / 100) * circumference;
      ringCircle.style.strokeDashoffset = offset;
      
      ringCircle.style.stroke = metrics.status === 'safe' ? 'var(--safe-emerald)' : (metrics.status === 'warning' ? 'var(--warning-amber)' : 'var(--danger-rose)');
      ringText.innerText = `${metrics.overallPct}%`;
      ringText.style.color = metrics.status === 'safe' ? 'var(--safe-emerald)' : (metrics.status === 'warning' ? 'var(--warning-amber)' : 'var(--danger-rose)');
    }
  },

  renderSubjectCards() {
    const grid = document.getElementById('attendance-subjects-grid');
    if (!grid) return;

    if (this.subjects.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 3rem; background: var(--bg-surface-elevated); border-radius: var(--radius-lg);">
          <p>No subjects tracked yet. Click <strong>+ Add Subject</strong> to start forecasting!</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = this.subjects.map(sub => {
      const metric = this.calculateBunkMetrics(sub.attendedClasses, sub.totalClasses);
      let statusBadge = '';

      if (metric.status === 'safe') {
        statusBadge = `
          <div class="bunk-status-badge safe">
            <span>🛡️</span>
            <span>You can safely bunk <strong>${metric.safeBunks}</strong> class${metric.safeBunks === 1 ? '' : 'es'}</span>
          </div>
        `;
      } else if (metric.status === 'warning') {
        statusBadge = `
          <div class="bunk-status-badge warning">
            <span>⚠️</span>
            <span>Borderline! <strong>${metric.safeBunks}</strong> bunk left before falling below ${this.targetPercentage}%</span>
          </div>
        `;
      } else {
        statusBadge = `
          <div class="bunk-status-badge danger">
            <span>🚨</span>
            <span>Need <strong>${metric.requiredClasses}</strong> consecutive classes to reach ${this.targetPercentage}%</span>
          </div>
        `;
      }

      return `
        <div class="subject-card is-${metric.status}" data-id="${sub.id}">
          <div class="subject-head">
            <div>
              <span class="subject-code">${sub.code}</span>
              <h3 class="subject-name">${sub.name}</h3>
              <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.15rem;">👨‍🏫 ${sub.faculty || 'TIET Faculty'}</p>
            </div>
            <button class="header-action-btn" onclick="AttendanceModule.deleteSubject('${sub.id}')" title="Remove Subject" style="padding: 0.3rem 0.6rem; font-size: 0.75rem; background: transparent; border: none; color: var(--text-muted);">✕</button>
          </div>

          <div class="subject-stats-bar">
            <div>
              <span class="subject-pct" style="color: ${metric.status === 'safe' ? 'var(--safe-emerald)' : (metric.status === 'warning' ? 'var(--warning-amber)' : 'var(--danger-rose)')};">
                ${metric.currentPct}%
              </span>
            </div>
            <span class="subject-fraction">${sub.attendedClasses} / ${sub.totalClasses} Classes</span>
          </div>

          ${statusBadge}

          <div class="attendance-actions">
            <button class="btn-attend" onclick="AttendanceModule.markClass('${sub.id}', true)">
              <span>✓</span> Attended (+1)
            </button>
            <button class="btn-miss" onclick="AttendanceModule.markClass('${sub.id}', false)">
              <span>✕</span> Missed (+0)
            </button>
          </div>
        </div>
      `;
    }).join('');
  },

  markClass(subjectId, attended) {
    const sub = this.subjects.find(s => s.id === subjectId);
    if (!sub) return;

    sub.totalClasses += 1;
    if (attended) {
      sub.attendedClasses += 1;
      window.App.showToast(`Marked attended for ${sub.code}`, 'success');
    } else {
      window.App.showToast(`Marked missed for ${sub.code}`, 'error');
    }

    this.saveState();
    this.render();
  },

  addSubject(code, name, faculty, attended, total, credits = 3.5) {
    const newSubject = {
      id: 'sub-' + Date.now(),
      code: code.toUpperCase().trim(),
      name: name.trim(),
      faculty: faculty.trim() || 'TIET Faculty',
      attendedClasses: parseInt(attended, 10) || 0,
      totalClasses: parseInt(total, 10) || 0,
      credits: parseFloat(credits) || 3.5
    };

    this.subjects.push(newSubject);
    this.saveState();
    this.render();
    window.App.showToast(`Subject ${newSubject.code} added successfully!`, 'success');
  },

  deleteSubject(id) {
    this.subjects = this.subjects.filter(s => s.id !== id);
    this.saveState();
    this.render();
    window.App.showToast('Subject removed', 'info');
  },

  setTarget(newTarget) {
    this.targetPercentage = newTarget;
    this.saveState();
    this.render();
    window.App.showToast(`Target attendance set to ${newTarget}%`, 'info');
  },

  resetDefaults() {
    this.subjects = [...window.THAPAR_DATA.attendanceSubjects];
    this.saveState();
    this.render();
    window.App.showToast('Reset attendance to TIET 4th Sem default subjects', 'info');
  },

  bindEvents() {
    // Add subject modal submit
    const addSubForm = document.getElementById('form-add-subject');
    if (addSubForm) {
      addSubForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const code = document.getElementById('sub-code-input').value;
        const name = document.getElementById('sub-name-input').value;
        const faculty = document.getElementById('sub-faculty-input').value;
        const attended = document.getElementById('sub-attended-input').value;
        const total = document.getElementById('sub-total-input').value;
        
        if (!code || !name) {
          window.App.showToast('Please fill course code and name', 'error');
          return;
        }

        this.addSubject(code, name, faculty, attended, total);
        addSubForm.reset();
        window.App.closeModal('modal-add-subject');
      });
    }
  }
};

window.AttendanceModule = AttendanceModule;
