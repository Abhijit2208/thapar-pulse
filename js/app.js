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

    this.initHeroTextPressure();
    this.initHeroDust();
    this.initGhostCursor();

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
        this.triggerLogoEntrance();
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

    // Mouse-tracking glow + 3D tilt on the lock card
    const lockCard = document.querySelector('.lock-card');
    if (lockCard) {
      lockCard.addEventListener('mousemove', (e) => {
        const rect = lockCard.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        lockCard.style.setProperty('--mouse-x', x + '%');
        lockCard.style.setProperty('--mouse-y', y + '%');
        // 3D tilt: map mouse offset to -10..10 degrees
        const tiltX = ((e.clientY - rect.top) / rect.height - 0.5) * -14;
        const tiltY = ((e.clientX - rect.left) / rect.width - 0.5) * 14;
        lockCard.style.transform = `perspective(900px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(1.015, 1.015, 1.015)`;
      });
      lockCard.addEventListener('mouseleave', () => {
        lockCard.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)';
        lockCard.style.transition = 'transform 0.55s cubic-bezier(0.16, 1, 0.3, 1)';
        setTimeout(() => { lockCard.style.transition = ''; }, 560);
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
    const countdownOverlay = document.getElementById('countdown-overlay');

    // Store pending data for after countdown
    this._pendingUnlock = { name, roll, branch, hostel, semester, group };

    // Hide lock screen first
    if (lockScreen) {
      lockScreen.classList.add('unlocked');
    }

    // Show luxury minimalist countdown overlay
    if (countdownOverlay) {
      countdownOverlay.classList.remove('curtain-exit');
      countdownOverlay.classList.add('active');
      const centerContent = document.getElementById('loading-center-content');
      if (centerContent) centerContent.classList.remove('fade-out');
      this._startCountdown();
    } else {
      // Fallback: no overlay, just unlock directly
      this._finalizeUnlock();
    }
  },

  _startCountdown() {
    const numberEl = document.getElementById('countdown-number');
    const fillEl = document.getElementById('countdown-bar-fill');
    const centerContent = document.getElementById('loading-center-content');
    const overlay = document.getElementById('countdown-overlay');

    if (fillEl) fillEl.style.transform = 'scaleX(0)';
    if (numberEl) numberEl.textContent = '1';

    // Cinematic duration ~2.6 seconds (fluid, responsive, luxury feel)
    const duration = 2600;
    let startTime = null;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(1, elapsed / duration);

      // Smooth cubic easing (power2.inOut)
      const easedProgress = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      // Count up from 1 -> 100
      const currentNumber = Math.min(100, Math.max(1, Math.round(1 + 99 * easedProgress)));

      if (numberEl) {
        numberEl.textContent = String(currentNumber);
      }

      if (fillEl) {
        fillEl.style.transform = `scaleX(${easedProgress})`;
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Process complete at 100!
        if (numberEl) numberEl.textContent = '100';
        if (fillEl) fillEl.style.transform = 'scaleX(1)';

        // 1. Text elements translate slightly up & fade out
        setTimeout(() => {
          if (centerContent) centerContent.classList.add('fade-out');

          // 2. Stage curtain wipe lifts upward
          setTimeout(() => {
            if (overlay) {
              overlay.classList.add('curtain-exit');
            }

            // 3. Finalize unlock underneath the lifting curtain
            setTimeout(() => {
              this._finalizeUnlock();

              // Reset overlay after curtain exit transition finishes
              setTimeout(() => {
                if (overlay) {
                  overlay.classList.remove('active', 'curtain-exit');
                }
                if (centerContent) {
                  centerContent.classList.remove('fade-out');
                }
                if (fillEl) {
                  fillEl.style.transform = 'scaleX(0)';
                }
              }, 1200);
            }, 300);
          }, 300);
        }, 200);
      }
    };

    // Begin countdown
    requestAnimationFrame(animate);
  },

  _finalizeUnlock() {
    const data = this._pendingUnlock;
    if (!data) return;

    const { name, roll, branch, hostel, semester, group } = data;

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
    this._pendingUnlock = null;

    // Trigger elastic wave entrance across the Text Pressure hero logo
    setTimeout(() => {
      this.triggerLogoEntrance();
    }, 250);
  },

  initHeroDust() {
    const field = document.getElementById('hero-dust-field');
    if (!field || field.children.length > 0) return;

    // Generate floating dust particles inspired by the Instagram reel
    const DUST_COUNT = 22;
    for (let i = 0; i < DUST_COUNT; i++) {
      const p = document.createElement('div');
      p.className = 'hero-dust';
      const size = (Math.random() * 2.2 + 1.2).toFixed(1);
      const isCrimson = Math.random() > 0.45;
      const top = Math.random() * 90 + 5;
      const left = Math.random() * 92 + 4;
      const duration = (Math.random() * 3.5 + 5.5).toFixed(1);
      const delay = (Math.random() * 4).toFixed(1);

      p.style.width = `${size}px`;
      p.style.height = `${size}px`;
      p.style.background = isCrimson ? 'rgba(225, 29, 72, 0.7)' : 'rgba(255, 255, 255, 0.35)';
      p.style.top = `${top}%`;
      p.style.left = `${left}%`;
      p.style.animationDuration = `${duration}s`;
      p.style.animationDelay = `${delay}s`;
      field.appendChild(p);
    }
  },

  // ============================================================
  // GHOST CURSOR SYSTEM — glowing dot + lagging ring + canvas trail
  // Active on BOTH lock screen and home page
  // ============================================================
  initGhostCursor() {
    // Only on non-touch devices
    if (window.matchMedia('(hover: none)').matches) return;

    const container = document.getElementById('custom-cursor-container');
    const canvas = document.getElementById('cursor-ghost-canvas');
    const ring = document.getElementById('custom-cursor-ring');
    const dot = document.getElementById('custom-cursor-dot');
    if (!container || !canvas || !ring || !dot) return;

    document.body.classList.add('custom-cursor-enabled');

    const ctx = canvas.getContext('2d');
    let W = window.innerWidth, H = window.innerHeight;

    const resize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W;
      canvas.height = H;
    };
    resize();
    window.addEventListener('resize', resize);

    // ---- Trail particles ----
    const MAX_TRAIL = 30;
    const trail = [];

    // ---- Cursor state ----
    let mouseX = W / 2, mouseY = H / 2;
    let ringX = mouseX, ringY = mouseY;
    let isHovering = false;
    let isTextHovering = false;
    let isClicking = false;
    let cursorVisible = false;

    // Show cursor once mouse moves
    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      if (!cursorVisible) {
        cursorVisible = true;
        container.classList.add('cursor-active');
      }

      // Spawn trail particle
      trail.push({
        x: mouseX,
        y: mouseY,
        alpha: 0.75,
        radius: Math.random() * 2.8 + 1.2,
        color: Math.random() > 0.55 ? '225,29,72' : '245,158,11'
      });
      if (trail.length > MAX_TRAIL) trail.shift();

      // Position dot instantly
      dot.style.left = mouseX + 'px';
      dot.style.top = mouseY + 'px';
    }, { passive: true });

    // Hover detection
    const HOVER_SELECTORS = 'a, button, [role="button"], .nav-item, .header-action-btn, .bar-icon-btn, .hero-scroll-indicator, .hero-actions-row button, .lock-card .btn-unlock-portal, .lock-card .btn-quick-demo, .tab-view, .mobile-nav-btn, label[for]';
    const TEXT_SELECTORS = 'input, textarea, [contenteditable]';

    document.addEventListener('mouseover', (e) => {
      const target = e.target.closest(HOVER_SELECTORS);
      const textTarget = e.target.closest(TEXT_SELECTORS);
      if (textTarget) {
        isTextHovering = true;
        isHovering = false;
        ring.classList.add('cursor-text-hover');
        ring.classList.remove('cursor-hover');
        dot.classList.remove('cursor-hover');
      } else if (target) {
        isHovering = true;
        isTextHovering = false;
        ring.classList.add('cursor-hover');
        ring.classList.remove('cursor-text-hover');
        dot.classList.add('cursor-hover');
      }
    });

    document.addEventListener('mouseout', (e) => {
      const target = e.target.closest(HOVER_SELECTORS + ', ' + TEXT_SELECTORS);
      if (!e.relatedTarget || !e.relatedTarget.closest(HOVER_SELECTORS + ', ' + TEXT_SELECTORS)) {
        isHovering = false;
        isTextHovering = false;
        ring.classList.remove('cursor-hover', 'cursor-text-hover');
        dot.classList.remove('cursor-hover');
      }
    });

    // Click pulse
    document.addEventListener('mousedown', () => {
      isClicking = true;
      ring.classList.add('cursor-click');
    });
    document.addEventListener('mouseup', () => {
      isClicking = false;
      ring.classList.remove('cursor-click');
    });

    // Hide cursor when leaving window
    document.addEventListener('mouseleave', () => {
      container.classList.remove('cursor-active');
      cursorVisible = false;
    });
    document.addEventListener('mouseenter', () => {
      if (mouseX !== W / 2 || mouseY !== H / 2) {
        container.classList.add('cursor-active');
        cursorVisible = true;
      }
    });

    // ---- RAF loop: ring lerp + canvas trail ----
    const LERP = 0.115;
    const animate = () => {
      // Lerp ring position (magnetic lag)
      ringX += (mouseX - ringX) * LERP;
      ringY += (mouseY - ringY) * LERP;
      ring.style.left = ringX + 'px';
      ring.style.top = ringY + 'px';

      // Draw trail on canvas
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < trail.length; i++) {
        const p = trail[i];
        p.alpha -= 0.03;
        p.radius *= 0.96;
        if (p.alpha <= 0) continue;

        ctx.beginPath();
        const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 3);
        grd.addColorStop(0, `rgba(${p.color}, ${p.alpha})`);
        grd.addColorStop(1, `rgba(${p.color}, 0)`);
        ctx.arc(p.x, p.y, p.radius * 3, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();
      }
      // Remove fully faded particles
      for (let i = trail.length - 1; i >= 0; i--) {
        if (trail[i].alpha <= 0) trail.splice(i, 1);
      }

      requestAnimationFrame(animate);
    };
    animate();
  },

  initHeroTextPressure() {
    const wrap = document.getElementById('hero-logo-pressure');
    const title = document.getElementById('text-pressure-title');
    if (!wrap || !title) return;

    const spans = title.querySelectorAll('span[data-char]');
    if (!spans.length) return;

    let rafId = null;

    wrap.addEventListener('mousemove', (e) => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const mouseX = e.clientX;
        const mouseY = e.clientY;

        spans.forEach(span => {
          const rect = span.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          const dist = Math.hypot(mouseX - centerX, mouseY - centerY);
          const maxDist = 280;
          const factor = Math.max(0, 1 - dist / maxDist);

          // Variable font weight: 300 up to 1000
          const wght = Math.round(300 + factor * 700);
          // Variable font width: 80 up to 151
          const wdth = Math.round(80 + factor * 71);
          // Scale factor
          const scale = (1 + factor * 0.16).toFixed(3);

          span.style.fontVariationSettings = `'wght' ${wght}, 'wdth' ${wdth}`;
          span.style.transform = `scale(${scale})`;
        });
      });
    });

    wrap.addEventListener('mouseleave', () => {
      spans.forEach(span => {
        span.style.transition = 'transform 0.4s ease-out, font-variation-settings 0.4s ease-out';
        span.style.fontVariationSettings = "'wght' 800, 'wdth' 115";
        span.style.transform = 'scale(1)';
        setTimeout(() => {
          span.style.transition = '';
        }, 400);
      });
    });
  },

  triggerLogoEntrance() {
    const title = document.getElementById('text-pressure-title');
    if (!title) return;
    const spans = title.querySelectorAll('span[data-char]');
    if (!spans.length) return;

    // Sequential ripple wave cascade across characters: T-H-A-P-A-R P-U-L-S-E
    spans.forEach((span, i) => {
      setTimeout(() => {
        span.style.transition = 'transform 0.42s cubic-bezier(0.34, 1.56, 0.64, 1), font-variation-settings 0.35s ease';
        span.style.transform = 'scale(1.28) translateY(-12px)';
        span.style.fontVariationSettings = "'wght' 1000, 'wdth' 151";

        setTimeout(() => {
          span.style.transform = 'scale(1) translateY(0)';
          span.style.fontVariationSettings = "'wght' 800, 'wdth' 115";
          setTimeout(() => {
            span.style.transition = '';
          }, 450);
        }, 360);
      }, i * 65);
    });
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
    // Top Bar Click-to-Scroll handlers
    document.querySelectorAll('[data-tab-target]').forEach(el => {
      el.addEventListener('click', (e) => {
        const target = el.dataset.tabTarget;
        const targetId = `tab-${target}`;
        this.scrollToSection(targetId);
      });
    });

    // Initialize ScrollSpy to automatically highlight active tab as you scroll
    this.initScrollSpy();
  },

  scrollToSection(targetId) {
    const el = document.getElementById(targetId);
    if (!el) return;
    const yOffset = -85; 
    const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
    window.scrollTo({ top: y, behavior: 'smooth' });

    const tabId = targetId.replace('tab-', '');
    this.currentTab = tabId;
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.tabTarget === tabId);
    });
  },

  initScrollSpy() {
    const sections = document.querySelectorAll('.tab-view');
    if (!sections.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const tabId = entry.target.id.replace('tab-', '');
          this.currentTab = tabId;
          document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.tabTarget === tabId);
          });
        }
      });
    }, {
      rootMargin: '-15% 0px -65% 0px',
      threshold: 0.05
    });

    sections.forEach(sec => observer.observe(sec));
  },

  switchTab(tabId) {
    this.scrollToSection(`tab-${tabId}`);
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
