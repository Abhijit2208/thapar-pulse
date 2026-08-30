const TimetableModule = {
  data: null,
  allGroups: [],
  selectedGroup: '',

  TIME_SLOTS: ['08:00 AM','08:50 AM','09:40 AM','10:30 AM','11:20 AM','12:10 PM','01:00 PM','01:50 PM','02:40 PM','03:30 PM','04:20 PM'],
  DAYS: ['Monday','Tuesday','Wednesday','Thursday','Friday'],

  async init() {
    this.bindEvents();
    try {
      await this.fetchData();
      document.getElementById('tt-loading-state').style.display = 'none';
      
      const p = window.THAPAR_DATA?.userProfile;
      const cs = window.THAPAR_DATA?.counsellingStatus;
      const defaultGroup = (p && p.group) || (cs && cs.classGroup) || '1B44';

      if (this.allGroups.includes(defaultGroup)) {
        this.selectGroup(defaultGroup);
      } else if (this.allGroups.length > 0) {
        const found = this.allGroups.find(g => g.toUpperCase() === defaultGroup.toUpperCase()) || this.allGroups[0];
        this.selectGroup(found);
      }
    } catch (err) {
      console.error(err);
      document.getElementById('tt-loading-state').style.display = 'none';
      document.getElementById('tt-error-state').style.display = 'block';
    }
  },

  async fetchData() {
    // If running locally, this might fail due to CORS depending on tiet.pages.dev config, but we try anyway.
    const res = await fetch('https://tiet.pages.dev/timetable.json');
    if (!res.ok) throw new Error('Failed to load timetable');
    this.data = await res.json();
    this.allGroups = Object.keys(this.data).sort();
  },

  bindEvents() {
    const input = document.getElementById('tt-group-search');
    const resultsBox = document.getElementById('tt-search-results');
    
    if (input) {
      input.addEventListener('input', () => {
        this.renderResults(input.value);
      });
    }

    document.addEventListener('click', (e) => {
      if (!e.target.closest('#timetable-search-form') && resultsBox) {
        resultsBox.style.display = 'none';
      }
    });
  },

  yearLabel(code) {
    const y = code[0];
    return y === '1' ? 'First Year' : y === '2' ? 'Second Year' : y === '3' ? 'Third Year' : y === '4' ? 'Fourth Year' : `Year ${y}`;
  },

  renderResults(query) {
    const resultsBox = document.getElementById('tt-search-results');
    if (!resultsBox) return;
    resultsBox.innerHTML = '';
    const q = query.trim().toLowerCase();
    
    if (!q) {
      resultsBox.style.display = 'none';
      return;
    }

    const matches = this.allGroups.filter(g => g.toLowerCase().includes(q)).slice(0, 50);

    if (matches.length === 0) {
      resultsBox.innerHTML = '<div style="padding: 1rem; text-align: center; color: var(--text-muted); font-size: 0.85rem;">No matching groups found</div>';
      resultsBox.style.display = 'block';
      return;
    }

    matches.forEach(g => {
      const div = document.createElement('div');
      div.className = 'tt-search-item';
      div.innerHTML = `
        <span style="font-weight: 700; color: var(--text-primary);">${g}</span>
        <span style="font-size: 0.72rem; color: var(--text-muted); background: rgba(255,255,255,0.05); padding: 2px 8px; border-radius: 20px; border: 1px solid var(--border-subtle); margin-left: auto;">${this.yearLabel(g)}</span>
      `;
      div.addEventListener('click', () => {
        this.selectGroup(g);
      });
      resultsBox.appendChild(div);
    });
    
    resultsBox.style.display = 'block';
  },

  selectGroup(groupName) {
    this.selectedGroup = groupName;
    const input = document.getElementById('tt-group-search');
    const resultsBox = document.getElementById('tt-search-results');
    if (input) input.value = groupName;
    if (resultsBox) resultsBox.style.display = 'none';
    
    const display = document.getElementById('tt-selected-display');
    if (display) {
      display.innerHTML = `
        <span class="selected-badge" style="display: inline-flex; align-items: center; gap: 6px; background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 6px; padding: 4px 10px; font-size: 0.78rem; font-weight: 600; color: var(--safe-emerald);">
          ✓ Allotted Group: ${groupName} • ${this.yearLabel(groupName)} (UG 2026-27 Odd)
        </span>
      `;
    }

    const titleEl = document.getElementById('tt-allotted-title');
    const subEl = document.getElementById('tt-allotted-sub');
    if (titleEl) titleEl.innerText = `Live Schedule — Class Group ${groupName}`;
    if (subEl) subEl.innerText = `Allotted Weekly Schedule (${this.yearLabel(groupName)}) • Session 2026-27 Odd`;

    this.renderTable(groupName);
  },

  formatTime(t) {
    return t.replace(/^0/, '').replace(' ', '').toLowerCase();
  },

  typeToClass(type) {
    if (!type) return 'tt-cell-empty';
    const t = type.toLowerCase();
    if (t === 'lecture') return 'tt-cell-l';
    if (t === 'practical') return 'tt-cell-p';
    if (t === 'tutorial') return 'tt-cell-t';
    return 'tt-cell-empty';
  },

  getSelections(batchId) {
    try {
      const raw = localStorage.getItem('tt_electives_' + batchId);
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  },

  saveSelections(batchId, selections) {
    try { localStorage.setItem('tt_electives_' + batchId, JSON.stringify(selections)); } catch {}
  },

  renderTable(groupName) {
    const tableEl = document.getElementById('tt-native-table');
    const containerEl = document.getElementById('tt-grid-container');
    const batchData = this.data[groupName];

    if (!batchData) return;

    const selections = this.getSelections(groupName);

    tableEl.innerHTML = '';
    
    // Header Row
    const headTr = document.createElement('tr');
    const timeTh = document.createElement('th');
    timeTh.className = 'tt-header-col';
    timeTh.textContent = 'Time';
    headTr.appendChild(timeTh);
    
    this.DAYS.forEach(day => {
      const th = document.createElement('th');
      th.className = 'tt-header-col';
      th.textContent = day.slice(0, 3).toUpperCase();
      headTr.appendChild(th);
    });
    tableEl.appendChild(headTr);

    // Data Rows
    this.TIME_SLOTS.forEach(time => {
      const tr = document.createElement('tr');
      
      const timeTd = document.createElement('td');
      timeTd.className = 'tt-time-col';
      timeTd.textContent = this.formatTime(time);
      tr.appendChild(timeTd);

      this.DAYS.forEach(day => {
        const slot = batchData[day]?.[time] ?? null;
        const selKey = `${day}|${time}`;
        const td = this.buildCell(slot, selKey, groupName, selections);
        tr.appendChild(td);
      });

      tableEl.appendChild(tr);
    });

    containerEl.style.display = 'block';
  },

  buildCell(slot, selKey, batchId, selections) {
    const td = document.createElement('td');

    if (!slot) {
      td.className = 'tt-cell-empty';
      return td;
    }

    const [code, room, name, type, week, electives] = slot;
    const isElective = type === 'Elective' && electives && electives.length > 0;

    if (isElective) {
      return this.buildElectiveCell(td, slot, selKey, batchId, selections);
    }

    const typeClass = this.typeToClass(type);
    td.className = `tt-cell-filled ${typeClass}`;
    
    let innerHTML = `<div class="tt-cell-code">${code} ${room ? '<br><span style="opacity:0.7">'+room+'</span>' : ''}</div>`;
    if (name) innerHTML += `<div class="tt-cell-name">${name}</div>`;
    if (week === 1 || week === 2) innerHTML += `<div class="tt-cell-week">Week ${week}</div>`;
    
    td.innerHTML = innerHTML;
    return td;
  },

  buildElectiveCell(td, slot, selKey, batchId, selections) {
    const [, , , , , electives] = slot;
    const selIdx = selections[selKey] ?? null;
    const chosen = selIdx !== null ? electives[selIdx] : null;

    if (chosen) {
      const typeClass = this.typeToClass(chosen.type);
      td.className = `tt-cell-filled ${typeClass} tt-cell-elective-chosen`;
      td.style.cursor = 'pointer';
      
      let innerHTML = `<div class="tt-cell-code">${chosen.subject_code} <br><span style="opacity:0.7">${chosen.place}</span></div>`;
      innerHTML += `<div class="tt-cell-name">${chosen.subject_name}</div>`;
      innerHTML += `<div class="tt-cell-edit">✎ change</div>`;
      
      td.innerHTML = innerHTML;
      td.addEventListener('click', () => this.openElectiveModal(slot, selKey, batchId, selections));
    } else {
      td.className = 'tt-cell-elective-unset';
      td.innerHTML = `
        <div style="font-size: 0.7rem; color: var(--text-muted); margin-bottom: 4px; text-transform: uppercase;">Elective</div>
        <button class="header-action-btn primary" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; width: 100%; justify-content: center;">SELECT</button>
      `;
      td.querySelector('button').addEventListener('click', () => this.openElectiveModal(slot, selKey, batchId, selections));
    }
    return td;
  },

  openElectiveModal(slot, selKey, batchId, selections) {
    const [, , , , , electives] = slot;
    const selIdx = selections[selKey] ?? null;
    const [dayStr, timeStr] = selKey.split('|');
    const timeLabel = this.formatTime(timeStr).toUpperCase();

    // Re-using ThaparPulse Modal structure natively
    const modalId = 'modal-elective-' + Date.now();
    
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop active';
    backdrop.id = modalId;
    backdrop.style.display = 'flex';

    let optionsHtml = '<option value="-1">-- Choose elective subject --</option>';
    electives.forEach((e, i) => {
      optionsHtml += `<option value="${i}" ${i === selIdx ? 'selected' : ''}>${e.subject_code} - ${e.subject_name} (${e.place})</option>`;
    });

    backdrop.innerHTML = `
      <div class="modal-card">
        <button class="modal-close-btn" onclick="document.getElementById('${modalId}').remove()">✕</button>
        <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 0.2rem;">Edit Class Slot</h3>
        <p style="font-size: 0.82rem; color: var(--tiet-gold); margin-bottom: 1.25rem; font-weight: 600;">${dayStr.toUpperCase()} AT ${timeLabel}</p>

        <div class="form-group">
          <label class="form-label">Select Elective Subject</label>
          <select id="${modalId}-select" class="form-control">
            ${optionsHtml}
          </select>
        </div>

        <div style="display: flex; gap: 0.75rem; margin-top: 1.5rem;">
          <button class="header-action-btn" style="color: var(--danger-rose); border-color: var(--danger-rose-glow);" onclick="TimetableModule.removeElective('${selKey}', '${batchId}', '${modalId}')">
            🗑 Remove
          </button>
          <div style="flex: 1;"></div>
          <button class="header-action-btn" onclick="document.getElementById('${modalId}').remove()">Cancel</button>
          <button class="header-action-btn primary" onclick="TimetableModule.saveElective('${selKey}', '${batchId}', '${modalId}')">Save</button>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);
  },

  removeElective(selKey, batchId, modalId) {
    const selections = this.getSelections(batchId);
    delete selections[selKey];
    this.saveSelections(batchId, selections);
    document.getElementById(modalId).remove();
    this.renderTable(batchId);
  },

  saveElective(selKey, batchId, modalId) {
    const val = parseInt(document.getElementById(`${modalId}-select`).value);
    if (val >= 0) {
      const selections = this.getSelections(batchId);
      selections[selKey] = val;
      this.saveSelections(batchId, selections);
      document.getElementById(modalId).remove();
      this.renderTable(batchId);
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('tab-timetable')) {
    TimetableModule.init();
  }
});
