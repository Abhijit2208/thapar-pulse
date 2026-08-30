/**
 * ThaparPulse - Core Application Controller
 * Handles routing, modals, toasts, global command palette, and profile state
 */

const App = {
  currentTab: 'dashboard',
  tickerInterval: null,

  init() {
    this.initImmersiveBackground();
    this.initAuth();
    this.initProfile();
    this.initNavigation();
    this.initCommandPalette();
    this.initModals();
    this.initTicker();
    this.initTheme();

    // Initialize all sub-modules
    if (window.AttendanceModule) window.AttendanceModule.init();
    if (window.RideshareModule) window.RideshareModule.init();
    if (window.MessModule) window.MessModule.init();
    if (window.AcademicModule) window.AcademicModule.init();
    if (window.MarketplaceModule) window.MarketplaceModule.init();
    if (window.SocietiesModule) window.SocietiesModule.init();
    if (window.FeedModule) window.FeedModule.init();

    // Show initial welcome toast if authenticated
    if (localStorage.getItem('thapar_is_authenticated') === 'true') {
      setTimeout(() => {
        this.showToast(`Welcome back, ${window.THAPAR_DATA.userProfile.name} ⚡`, 'info');
      }, 600);
    }
  },

  // Immersive animated background: floating particles + mouse-tracking card glow
  initImmersiveBackground() {
    const canvas = document.getElementById('lock-particles-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId = null;
    let particles = [];
    const PARTICLE_COUNT = 60;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Create particles
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 2 + 0.5,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.3,
        alpha: Math.random() * 0.5 + 0.15,
        color: Math.random() > 0.6 ? '225,29,72' : Math.random() > 0.3 ? '245,158,11' : '139,92,246'
      });
    }

    const drawParticles = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color},${p.alpha})`;
        ctx.fill();

        // Draw connecting lines between nearby particles
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(255,255,255,${0.04 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      });

      animId = requestAnimationFrame(drawParticles);
    };

    drawParticles();

    // Mouse-tracking glow on the lock card
    const lockCard = document.querySelector('.lock-card');
    if (lockCard) {
      lockCard.addEventListener('mousemove', (e) => {
        const rect = lockCard.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        lockCard.style.setProperty('--mouse-x', x + '%');
        lockCard.style.setProperty('--mouse-y', y + '%');
      });
    }

    // Stop animation when lock screen is hidden
    const observer = new MutationObserver(() => {
      const lockScreen = document.getElementById('lock-screen');
      if (lockScreen && lockScreen.classList.contains('unlocked')) {
        if (animId) cancelAnimationFrame(animId);
      }
    });
    const lockScreen = document.getElementById('lock-screen');
    if (lockScreen) {
      observer.observe(lockScreen, { attributes: true, attributeFilter: ['class'] });
    }
  },

  initAuth() {
    const isAuth = localStorage.getItem('thapar_is_authenticated');
    const lockScreen = document.getElementById('lock-screen');
    const lockForm = document.getElementById('form-lock-login');
    const otpForm = document.getElementById('form-lock-otp');
    const demoBtn = document.getElementById('btn-quick-demo');

    // Populate lock screen inputs if existing profile exists
    const p = window.THAPAR_DATA.userProfile;
    const emailInput = document.getElementById('lock-email-input');
    const pwdInput = document.getElementById('lock-password-input');
    const otpInput = document.getElementById('lock-otp-input');
    const batchHint = document.getElementById('lock-batch-hint');
    const matchHint = document.getElementById('lock-match-hint');
    const emailHint = document.getElementById('lock-email-hint');
    const togglePwdBtn = document.getElementById('toggle-pwd-btn');
    const autofillBtn = document.getElementById('btn-autofill-otp');
    const resendOtpBtn = document.getElementById('btn-resend-otp');
    const backToCredsBtn = document.getElementById('btn-back-to-creds');

    if (emailInput && p.email) emailInput.value = p.email;
    if (pwdInput && p.rollNumber) pwdInput.value = p.rollNumber;

    // Show / Hide Password Toggle
    if (togglePwdBtn && pwdInput) {
      togglePwdBtn.addEventListener('click', () => {
        if (pwdInput.type === 'password') {
          pwdInput.type = 'text';
          togglePwdBtn.innerText = '🔒 Hide';
        } else {
          pwdInput.type = 'password';
          togglePwdBtn.innerText = '👁️ Show';
        }
      });
    }

    // Real-time batch decoding & Email-Roll binding validation
    const updateRealtimeValidation = () => {
      const email = emailInput ? emailInput.value.trim() : '';
      const roll = pwdInput ? pwdInput.value.trim() : '';

      // 1. Batch & Branch decoder on roll
      if (pwdInput && batchHint) {
        const decoded = window.THAPAR_DATA.decodeRollNumber(roll);
        if (decoded && roll.length >= 6) {
          batchHint.innerText = `✓ Verified TIET: ${decoded.batchString} (${decoded.yearName}) • ${decoded.branchCode} (${decoded.branchName}) • Sem ${decoded.semester}`;
          batchHint.style.display = 'block';
        } else {
          batchHint.innerText = '';
          batchHint.style.display = 'none';
        }
      }

      // 2. Strict Email <-> Roll connection check
      if (email && roll.length >= 6 && matchHint) {
        const check = window.THAPAR_DATA.verifyEmailRollMatch(email, roll);
        if (check.valid) {
          matchHint.innerText = `✓ Verified Match: Email is registered to Roll ${check.roll} (${check.student.name || 'Student'})`;
          matchHint.style.color = 'var(--safe-emerald)';
          matchHint.style.display = 'block';
        } else {
          matchHint.innerText = `⚠ ${check.reason}`;
          matchHint.style.color = 'var(--danger-rose)';
          matchHint.style.display = 'block';
        }
      } else if (matchHint) {
        matchHint.style.display = 'none';
      }
    };

    if (pwdInput) pwdInput.addEventListener('input', updateRealtimeValidation);
    if (emailInput) emailInput.addEventListener('input', updateRealtimeValidation);
    updateRealtimeValidation();

    let generatedOtp = null;
    let otpTimerInterval = null;
    let pendingUserData = null;

    const startOtpTimer = () => {
      let secondsLeft = 60;
      const countEl = document.getElementById('otp-timer-count');
      const timerText = document.getElementById('otp-timer-text');
      if (resendOtpBtn) resendOtpBtn.style.display = 'none';
      if (timerText) timerText.style.display = 'inline';

      if (otpTimerInterval) clearInterval(otpTimerInterval);
      otpTimerInterval = setInterval(() => {
        secondsLeft--;
        if (countEl) countEl.innerText = `${secondsLeft}s`;
        if (secondsLeft <= 0) {
          clearInterval(otpTimerInterval);
          if (timerText) timerText.style.display = 'none';
          if (resendOtpBtn) resendOtpBtn.style.display = 'inline';
        }
      }, 1000);
    };

    const sendOtp = (email, roll, studentData = null) => {
      generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const decoded = window.THAPAR_DATA.decodeRollNumber(roll);
      const cs = window.THAPAR_DATA.counsellingStatus;

      let name = studentData?.name || "Abhijit Tathgir";
      let branch = studentData?.branch || "Civil Engineering (IEP - Univ of Queensland)";
      let sem = studentData?.semester || 1;
      let group = studentData?.group || "1B44";

      if (roll === cs.enrollmentNumber || roll === '1026020074') {
        name = cs.applicantName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
        branch = cs.allottedBranch;
        sem = cs.semester;
        group = cs.classGroup;
      }

      pendingUserData = {
        name,
        email,
        roll,
        group,
        branch,
        semester: sem,
        hostel: "Hostel J (Tower 3)"
      };

      // Switch to OTP Form
      if (lockForm) lockForm.style.display = 'none';
      if (otpForm) otpForm.style.display = 'flex';
      
      const targetEmailEl = document.getElementById('otp-target-email');
      const displayCodeEl = document.getElementById('otp-display-code');
      if (targetEmailEl) targetEmailEl.innerText = email;
      if (displayCodeEl) displayCodeEl.innerText = generatedOtp;

      startOtpTimer();
      this.showToast(`📩 Live OTP sent to ${email}: [ ${generatedOtp} ]`, 'success');

      if (otpInput) {
        otpInput.value = '';
        setTimeout(() => otpInput.focus(), 200);
      }
    };

    // Step 1: Request OTP Form (Strict Verification)
    if (lockForm) {
      lockForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = emailInput ? emailInput.value.trim() : '';
        const roll = pwdInput ? pwdInput.value.trim() : '';

        if (!email || !roll) {
          this.showToast('Please enter both TIET Registered Email and Roll Number', 'error');
          return;
        }

        if (roll.length < 6) {
          this.showToast('Roll Number must be at least 6 digits', 'error');
          return;
        }

        // STRICT VERIFICATION: Email must be mapped to Roll Number
        const check = window.THAPAR_DATA.verifyEmailRollMatch(email, roll);
        if (!check.valid) {
          this.showToast(`❌ Access Declined: ${check.reason}`, 'error');
          if (matchHint) {
            matchHint.innerText = `❌ ${check.reason}`;
            matchHint.style.color = 'var(--danger-rose)';
            matchHint.style.display = 'block';
          }
          return;
        }

        sendOtp(email, roll, check.student);
      });
    }

    // Step 2: Auto-Fill OTP Button
    if (autofillBtn && otpInput) {
      autofillBtn.addEventListener('click', () => {
        if (generatedOtp) {
          otpInput.value = generatedOtp;
          this.showToast('✓ OTP Auto-filled', 'info');
          otpInput.focus();
        }
      });
    }

    // Step 2: Resend OTP
    if (resendOtpBtn) {
      resendOtpBtn.addEventListener('click', () => {
        if (pendingUserData) {
          sendOtp(pendingUserData.email, pendingUserData.roll);
          this.showToast('🔄 New Live OTP Generated', 'info');
        }
      });
    }

    // Step 2: Back to Credentials
    if (backToCredsBtn) {
      backToCredsBtn.addEventListener('click', () => {
        if (otpTimerInterval) clearInterval(otpTimerInterval);
        if (otpForm) otpForm.style.display = 'none';
        if (lockForm) lockForm.style.display = 'flex';
      });
    }

    // Step 2: Verify OTP and Unlock
    if (otpForm) {
      otpForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const enteredOtp = otpInput ? otpInput.value.trim() : '';

        if (!enteredOtp) {
          this.showToast('Please enter the 6-digit verification code', 'error');
          return;
        }

        if (enteredOtp !== generatedOtp) {
          this.showToast('❌ Invalid OTP Code. Please check the code above.', 'error');
          return;
        }

        if (pendingUserData) {
          this.unlockPortal(
            pendingUserData.name,
            pendingUserData.roll,
            pendingUserData.branch,
            pendingUserData.hostel,
            pendingUserData.semester,
            pendingUserData.group
          );
        }
      });
    }

    if (isAuth === 'true' && lockScreen) {
      lockScreen.classList.add('unlocked');
    } else if (lockScreen) {
      lockScreen.classList.remove('unlocked');
    }

    // Demo Login Preset (Abhijit Tathgir)
    if (demoBtn) {
      demoBtn.addEventListener('click', () => {
        if (emailInput) emailInput.value = 'abhijit.tathgir@gmail.com';
        if (pwdInput) pwdInput.value = '1026020074';
        updateRealtimeValidation();
        sendOtp('abhijit.tathgir@gmail.com', '1026020074');
        setTimeout(() => {
          if (otpInput && generatedOtp) {
            otpInput.value = generatedOtp;
          }
        }, 300);
      });
    }
  },

  unlockPortal(name, roll, branch, hostel, semester = 1, group = '1B44') {
    const lockScreen = document.getElementById('lock-screen');
    
    // Create and attach dynamic shockwave ripple for cinematic unlock
    const shockwave = document.createElement('div');
    shockwave.className = 'unlock-shockwave';
    document.body.appendChild(shockwave);
    setTimeout(() => shockwave.remove(), 1000);

    // Save to user profile
    this.saveProfile({
      name,
      rollNumber: roll,
      branch,
      hostel,
      semester,
      group
    });

    // Detect and switch attendance courses according to batch
    if (window.AttendanceModule) {
      window.AttendanceModule.detectBatchFromRoll(roll);
      window.AttendanceModule.switchSemester(semester);
    }

    // Auto-select Class Group in Timetable
    if (window.TimetableModule && group) {
      setTimeout(() => {
        window.TimetableModule.selectGroup(group);
      }, 500);
    }

    localStorage.setItem('thapar_is_authenticated', 'true');

    if (lockScreen) {
      lockScreen.classList.add('unlocked');
    }

    // Trigger dashboard cascade entrance animations
    const dashboard = document.getElementById('tab-dashboard');
    if (dashboard) {
      dashboard.classList.remove('active');
      void dashboard.offsetWidth; // trigger DOM reflow
      dashboard.classList.add('active');
    }

    // Animate overall attendance percentage counter
    this.animateNumberCounter('metric-overall-pct', 0, 82.4, '%', 1200);

    this.showToast(`Welcome, ${name}! ThaparPulse is unlocked for Semester ${semester} ⚡`, 'success');
  },

  animateNumberCounter(elementId, startVal, endVal, suffix = '', duration = 1000) {
    const el = document.getElementById(elementId);
    if (!el) return;
    const startTime = performance.now();
    const isFloat = endVal % 1 !== 0;

    const update = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = startVal + (endVal - startVal) * ease;
      el.innerText = (isFloat ? current.toFixed(1) : Math.round(current)) + suffix;
      if (progress < 1) {
        requestAnimationFrame(update);
      }
    };
    requestAnimationFrame(update);
  },

  lockPortal() {
    const lockScreen = document.getElementById('lock-screen');
    localStorage.setItem('thapar_is_authenticated', 'false');

    if (lockScreen) {
      lockScreen.classList.remove('unlocked');
    }

    const nameInput = document.getElementById('lock-name-input');
    if (nameInput) setTimeout(() => nameInput.focus(), 200);

    this.showToast('Campus portal locked. Please login to enter.', 'info');
  },

  initProfile() {
    const savedProfile = localStorage.getItem('thapar_user_profile');
    if (savedProfile) {
      try {
        window.THAPAR_DATA.userProfile = JSON.parse(savedProfile);
      } catch (e) {}
    }

    this.updateProfileUI();
  },

  updateProfileUI() {
    const p = window.THAPAR_DATA.userProfile;
    const nameEls = document.querySelectorAll('.profile-name-val');
    const rollEls = document.querySelectorAll('.profile-roll-val');
    const hostelEls = document.querySelectorAll('.profile-hostel-val');
    const avatarEl = document.getElementById('sidebar-avatar');

    const decoded = window.THAPAR_DATA.decodeRollNumber(p.rollNumber);
    const branchDisplay = decoded ? decoded.branchShort : (p.branch ? p.branch.split(' ')[0] : 'COE');

    nameEls.forEach(el => el.innerText = p.name);
    rollEls.forEach(el => el.innerText = `${p.rollNumber} • ${branchDisplay}`);
    hostelEls.forEach(el => el.innerText = p.hostel);

    if (avatarEl && p.name) {
      const initials = p.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
      avatarEl.innerText = initials || 'TP';
    }

    // Sync profile form values if modal open
    const nameInput = document.getElementById('profile-name-input');
    const rollInput = document.getElementById('profile-roll-input');
    const branchInput = document.getElementById('profile-branch-input');
    const hostelInput = document.getElementById('profile-hostel-input');
    const semInput = document.getElementById('profile-sem-input');
    const targetInput = document.getElementById('profile-target-input');

    if (nameInput) nameInput.value = p.name;
    if (rollInput) rollInput.value = p.rollNumber;
    if (branchInput) branchInput.value = p.branch;
    if (hostelInput) hostelInput.value = p.hostel;
    if (semInput) semInput.value = p.semester || 1;
    if (targetInput) targetInput.value = p.targetAttendance || 75;

    // Sync Counselling Status modal card fields
    const cs = window.THAPAR_DATA.counsellingStatus || {};
    const counsRoll = document.getElementById('couns-card-roll');
    const counsName = document.getElementById('couns-card-name');
    const counsGroup = document.getElementById('couns-card-group');
    const counsBranch = document.getElementById('couns-card-branch');
    const counsSem = document.getElementById('couns-card-sem');

    if (counsRoll) counsRoll.innerText = p.rollNumber || cs.enrollmentNumber || '1026020074';
    if (counsName) counsName.innerText = (p.name || cs.applicantName || 'ABHIJIT TATHGIR').toUpperCase();
    if (counsGroup) counsGroup.innerText = p.group || cs.classGroup || '1B44';
    if (counsBranch) counsBranch.innerText = p.branch || cs.allottedBranch || 'IEP (CIVIL ENGINEERING)';
    if (counsSem) counsSem.innerText = p.semester || cs.semester || 1;
  },

  saveProfile(updated) {
    const decoded = window.THAPAR_DATA.decodeRollNumber(updated.rollNumber || window.THAPAR_DATA.userProfile.rollNumber);
    
    window.THAPAR_DATA.userProfile = {
      ...window.THAPAR_DATA.userProfile,
      ...updated,
      branch: (decoded && (!updated.branch || updated.branch.includes('COE (Computer Engg)'))) ? decoded.branchName : (updated.branch || window.THAPAR_DATA.userProfile.branch)
    };
    
    localStorage.setItem('thapar_user_profile', JSON.stringify(window.THAPAR_DATA.userProfile));
    this.updateProfileUI();

    if (updated.semester && window.AttendanceModule) {
      window.AttendanceModule.switchSemester(parseInt(updated.semester, 10));
    } else if (updated.rollNumber && window.AttendanceModule) {
      window.AttendanceModule.detectBatchFromRoll(updated.rollNumber);
      window.AttendanceModule.render();
    }

    if (updated.targetAttendance && window.AttendanceModule) {
      window.AttendanceModule.setTarget(parseInt(updated.targetAttendance, 10));
    }

    this.showToast('Profile updated successfully!', 'success');
  },

  initNavigation() {
    // Desktop & Mobile Tab click handlers
    document.querySelectorAll('[data-tab-target]').forEach(el => {
      el.addEventListener('click', (e) => {
        const target = el.dataset.tabTarget;
        this.switchTab(target);
        
        // Close mobile drawer if open
        document.querySelector('.app-sidebar').classList.remove('open');
      });
    });

    // Mobile sidebar toggle button
    const menuBtn = document.getElementById('mobile-menu-btn');
    if (menuBtn) {
      menuBtn.addEventListener('click', () => {
        document.querySelector('.app-sidebar').classList.toggle('open');
      });
    }
  },

  switchTab(tabId) {
    this.currentTab = tabId;

    // Update active nav items
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.tabTarget === tabId);
    });

    document.querySelectorAll('.mobile-nav-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tabTarget === tabId);
    });

    // Update active view content
    document.querySelectorAll('.tab-view').forEach(view => {
      view.classList.toggle('active', view.id === `tab-${tabId}`);
    });

    // Update header title
    const titles = {
      dashboard: { title: "Attendance & Safe Bunk Forecaster", sub: "The 75% Rule Protector for Webkiosk" },
      rideshare: { title: "Thapar RideShare & Cab Matcher", sub: "Split travel to Rajpura, Chandigarh & Delhi" },
      mess: { title: "Hostel Mess & Campus Food Court", sub: "Live daily menus, edible votes & COS spots" },
      vault: { title: "Academic Vault (PYQs & Notes)", sub: "MST / EST previous year papers & study cheat sheets" },
      timetable: { title: "Live Section Timetable", sub: "Powered by tiet.pages.dev" },
      bazaar: { title: "TIET Campus Bazaar & Lost-Found", sub: "Buy/sell cycles, appliances, drafters & report items" },
      societies: { title: "Societies & Events Radar", sub: "CCS, OWASP, MLSC, Frosh recruitments & Saturnalia" },
      feed: { title: "Anonymous Campus Feed & Senior Advice", sub: "Peer wisdom, placement hacks & hostel banter" },
      cgpa: { title: "Target CGPA & Relative Grade Simulator", sub: "Simulate EST/MST scores to reach your dream CGPA" }
    };

    const headerTitleEl = document.getElementById('page-header-title');
    const headerSubEl = document.getElementById('page-header-sub');

    if (headerTitleEl && titles[tabId]) {
      headerTitleEl.innerText = titles[tabId].title;
    }
    if (headerSubEl && titles[tabId]) {
      headerSubEl.innerText = titles[tabId].sub;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  initCommandPalette() {
    // Listen for Ctrl+K or Cmd+K
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        this.openModal('modal-command-palette');
        const input = document.getElementById('cmd-search-input');
        if (input) setTimeout(() => input.focus(), 100);
      }
    });

    const cmdInput = document.getElementById('cmd-search-input');
    if (cmdInput) {
      cmdInput.addEventListener('input', (e) => {
        this.filterCommandPalette(e.target.value);
      });
    }

    const headerSearchTrigger = document.getElementById('global-search-trigger');
    if (headerSearchTrigger) {
      headerSearchTrigger.addEventListener('click', () => {
        this.openModal('modal-command-palette');
        const input = document.getElementById('cmd-search-input');
        if (input) setTimeout(() => input.focus(), 100);
      });
    }
  },

  filterCommandPalette(query) {
    const list = document.getElementById('cmd-results-list');
    if (!list) return;

    const q = query.toLowerCase().trim();
    const actions = [
      { name: "Attendance & Safe Bunk Forecaster", tab: "dashboard", icon: "📊", desc: "Check if you can bunk tomorrow's 8 AM lab" },
      { name: "Find / Post Cab to Rajpura Station", tab: "rideshare", icon: "🚗", desc: "Split taxi fare for Vande Bharat / Shatabdi" },
      { name: "Find Cab to Chandigarh / Airport", tab: "rideshare", icon: "✈️", desc: "Weekend trips to Elante Mall or IXC Airport" },
      { name: "Hostel J / M / H Mess Menu", tab: "mess", icon: "🍛", desc: "Check today's lunch/dinner & vote if it's edible" },
      { name: "COS / Nirvana Food Kiosks Numbers", tab: "mess", icon: "🍔", desc: "Late night Maggi, Rolls Nation & Frappe" },
      { name: "Download MST / EST PYQs", tab: "vault", icon: "📚", desc: "UCS415, UMA010, UTA018 question papers" },
      { name: "Buy / Sell Cycles (Hero Sprint)", tab: "bazaar", icon: "🚲", desc: "Campus bicycle resale & ED drafters" },
      { name: "Lost & Found Items Board", tab: "bazaar", icon: "🔍", desc: "Report or claim lost earphones / Casio calculators" },
      { name: "CCS / OWASP / MLSC Recruitments", tab: "societies", icon: "⚡", desc: "Society test rounds & Saturnalia volunteer drive" },
      { name: "Senior Advice on Placements", tab: "feed", icon: "💡", desc: "Placement & DSA interview roadmaps" },
      { name: "Target CGPA Simulator", tab: "cgpa", icon: "🎯", desc: "Calculate MST/EST marks for 8.5+ CGPA" }
    ];

    const filtered = actions.filter(a => a.name.toLowerCase().includes(q) || a.desc.toLowerCase().includes(q));

    list.innerHTML = filtered.map(a => `
      <div class="user-quick-profile" onclick="App.executeCommand('${a.tab}')" style="margin-bottom: 0.5rem; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <span style="font-size: 1.25rem;">${a.icon}</span>
          <div>
            <h4 style="font-size: 0.9rem; font-weight: 700;">${a.name}</h4>
            <p style="font-size: 0.75rem; color: var(--text-muted);">${a.desc}</p>
          </div>
        </div>
        <span class="search-kbd">Enter ➔</span>
      </div>
    `).join('');
  },

  executeCommand(tabId) {
    this.closeModal('modal-command-palette');
    this.switchTab(tabId);
  },

  initModals() {
    // Backdrop click close
    document.querySelectorAll('.modal-backdrop').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.remove('active');
        }
      });
    });

    // Close buttons
    document.querySelectorAll('.modal-close-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const modal = btn.closest('.modal-backdrop');
        if (modal) modal.classList.remove('active');
      });
    });

    // Escape key
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-backdrop.active').forEach(m => m.classList.remove('active'));
      }
    });

    // Profile form listener
    const profileForm = document.getElementById('form-user-profile');
    if (profileForm) {
      profileForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const semEl = document.getElementById('profile-sem-input');
        this.saveProfile({
          name: document.getElementById('profile-name-input').value,
          rollNumber: document.getElementById('profile-roll-input').value,
          branch: document.getElementById('profile-branch-input').value,
          hostel: document.getElementById('profile-hostel-input').value,
          semester: semEl ? parseInt(semEl.value, 10) : 4,
          targetAttendance: parseInt(document.getElementById('profile-target-input').value, 10) || 75
        });
        this.closeModal('modal-user-profile');
      });
    }
  },

  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
  },

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
  },

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '🚨';

    toast.innerHTML = `
      <span>${icon}</span>
      <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3800);
  },

  initTicker() {
    const tickerEl = document.getElementById('campus-ticker-content');
    if (!tickerEl) return;

    const alerts = [
      "🔥 <strong>CCS HackTU Registrations</strong> are now live for 2026!",
      "🚨 <strong>Webkiosk Attendance Warning:</strong> Ensure all subjects are >=75% before MST-1 hall tickets release.",
      "🚗 <strong>Cab Pool Alert:</strong> 3 seats open for Rajpura Junction (Sunday Vande Bharat connection).",
      "🍛 <strong>Hostel J Mess Special:</strong> Friday slow-cooked Dal Makhani & Gulab Jamun tonight!",
      "📚 <strong>Academic Vault:</strong> Added 2025 Solved UCS415 (Algorithms) EST Paper with full solutions."
    ];

    let current = 0;
    setInterval(() => {
      current = (current + 1) % alerts.length;
      tickerEl.style.opacity = '0';
      setTimeout(() => {
        tickerEl.innerHTML = alerts[current];
        tickerEl.style.opacity = '1';
      }, 300);
    }, 6000);
  },

  initTheme() {
    const savedTheme = localStorage.getItem('thapar_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);

    const toggleBtn = document.getElementById('theme-toggle-btn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        const curr = document.documentElement.getAttribute('data-theme');
        const next = curr === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('thapar_theme', next);
        this.showToast(`Switched to ${next} mode`, 'info');
      });
    }
  },

  // CGPA & Target Grade Simulator Logic
  calculateTargetCGPA() {
    const currCgpa = parseFloat(document.getElementById('cgpa-curr-input').value) || 7.5;
    const completedCredits = parseFloat(document.getElementById('cgpa-credits-input').value) || 60;
    const semCredits = parseFloat(document.getElementById('cgpa-sem-credits-input').value) || 20;
    const targetCgpa = parseFloat(document.getElementById('cgpa-target-input').value) || 8.5;

    // Formula: Required SGPA = (TargetCGPA * (completed + sem) - (CurrCGPA * completed)) / sem
    const requiredSgpa = ((targetCgpa * (completedCredits + semCredits)) - (currCgpa * completedCredits)) / semCredits;
    const resultBox = document.getElementById('cgpa-result-display');

    if (!resultBox) return;

    if (requiredSgpa > 10.0) {
      resultBox.innerHTML = `
        <div style="background: rgba(244, 63, 94, 0.15); border: 1px solid var(--danger-rose); border-radius: var(--radius-md); padding: 1.25rem; text-align: center;">
          <h3 style="color: #fb7185; font-size: 1.2rem;">Mathematically Impossible in 1 Semester</h3>
          <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.35rem;">You need a SGPA of <strong>${requiredSgpa.toFixed(2)}</strong> (Max is 10.0). Try spreading your target CGPA over 2-3 semesters!</p>
        </div>
      `;
    } else if (requiredSgpa <= 0) {
      resultBox.innerHTML = `
        <div style="background: rgba(16, 185, 129, 0.15); border: 1px solid var(--safe-emerald); border-radius: var(--radius-md); padding: 1.25rem; text-align: center;">
          <h3 style="color: #34d399; font-size: 1.2rem;">You're Already Above Target! 🎉</h3>
          <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.35rem;">Keep steady and you'll easily graduate above ${targetCgpa} CGPA.</p>
        </div>
      `;
    } else {
      resultBox.innerHTML = `
        <div style="background: rgba(16, 185, 129, 0.15); border: 1px solid var(--safe-emerald); border-radius: var(--radius-md); padding: 1.25rem; text-align: center;">
          <span style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Required Semester SGPA</span>
          <h2 style="font-size: 2.2rem; color: #34d399; font-family: var(--font-heading); margin: 0.25rem 0;">${requiredSgpa.toFixed(2)} SGPA</h2>
          <p style="font-size: 0.85rem; color: var(--text-secondary);">To elevate your cumulative CGPA from <strong>${currCgpa}</strong> to <strong>${targetCgpa}</strong> this semester.</p>
          <div style="margin-top: 0.75rem; font-size: 0.78rem; color: var(--tiet-gold);">
            💡 Target at least ${Math.ceil(requiredSgpa >= 9.0 ? semCredits * 0.7 : semCredits * 0.5)} credits in 'A' / 'A+' grades in EST examinations.
          </div>
        </div>
      `;
    }
  }
};

window.App = App;

// Bootstrap on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
