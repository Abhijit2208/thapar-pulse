/**
 * ThaparPulse - Hostel Mess & Campus Food Hub
 * Handles hostel mess menus, daily meal breakdowns, live community dish ratings, and late night food spots
 */

const MessModule = {
  currentHostel: 'Hostel J',
  currentDay: 'Monday',
  userVotes: {},

  init() {
    this.detectToday();
    this.loadVotes();
    this.render();
    this.renderFoodSpots();
  },

  detectToday() {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayIndex = new Date().getDay();
    this.currentDay = days[todayIndex] || 'Monday';
  },

  loadVotes() {
    const saved = localStorage.getItem('thapar_mess_votes');
    if (saved) {
      try {
        this.userVotes = JSON.parse(saved);
      } catch (e) {
        this.userVotes = {};
      }
    }
  },

  saveVotes() {
    localStorage.setItem('thapar_mess_votes', JSON.stringify(this.userVotes));
  },

  setHostel(hostelName) {
    this.currentHostel = hostelName;
    
    // Update active UI tab
    document.querySelectorAll('.hostel-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.hostel === hostelName);
    });

    this.render();
  },

  setDay(dayName) {
    this.currentDay = dayName;
    document.querySelectorAll('.day-pill-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.day === dayName);
    });
    this.render();
  },

  voteMeal(mealKey, type) {
    const currentVote = this.userVotes[mealKey];
    if (currentVote === type) {
      delete this.userVotes[mealKey];
      window.App.showToast('Vote removed', 'info');
    } else {
      this.userVotes[mealKey] = type;
      window.App.showToast(type === 'up' ? 'Voted: Eating in Mess 🔥' : 'Voted: Skipping to COS 🏃', 'success');
    }
    this.saveVotes();
    this.render();
  },

  render() {
    const container = document.getElementById('mess-meals-container');
    if (!container) return;

    const hostelMenu = window.THAPAR_DATA.messMenus[this.currentHostel] || window.THAPAR_DATA.messMenus["Hostel J"];
    const dayMenu = hostelMenu[this.currentDay] || hostelMenu["Monday"] || {
      breakfast: ["Paratha with Curd", "Tea & Coffee"],
      lunch: ["Rajma Chawal", "Salad", "Roti"],
      snacks: ["Samosa & Chai"],
      dinner: ["Paneer Gravy", "Dal", "Rice", "Gulab Jamun"]
    };

    const mealCategories = [
      { key: 'breakfast', title: '🍳 Breakfast', time: '7:30 AM - 9:30 AM', items: dayMenu.breakfast || [] },
      { key: 'lunch', title: '🍲 Lunch', time: '12:30 PM - 2:30 PM', items: dayMenu.lunch || [] },
      { key: 'snacks', title: '☕ Evening Snacks', time: '5:00 PM - 6:00 PM', items: dayMenu.snacks || [] },
      { key: 'dinner', title: '🍛 Dinner & Dessert', time: '7:45 PM - 9:45 PM', items: dayMenu.dinner || [] }
    ];

    container.innerHTML = mealCategories.map(cat => {
      const voteKey = `${this.currentHostel}_${this.currentDay}_${cat.key}`;
      const userVote = this.userVotes[voteKey];

      return `
        <div class="meal-card">
          <div class="meal-card-title">
            <h3 style="font-size: 1.1rem; font-weight: 700;">${cat.title}</h3>
            <span class="meal-time-badge">${cat.time}</span>
          </div>

          <ul class="meal-items-list">
            ${cat.items.map(item => `<li>${item}</li>`).join('')}
          </ul>

          <div class="mess-rating-actions">
            <button class="btn-vote ${userVote === 'up' ? 'active-up' : ''}" onclick="MessModule.voteMeal('${voteKey}', 'up')">
              <span>🔥</span> ${userVote === 'up' ? 'Eating Here ✓' : 'Edible / Eating (18)'}
            </button>
            <button class="btn-vote ${userVote === 'down' ? 'active-down' : ''}" onclick="MessModule.voteMeal('${voteKey}', 'down')">
              <span>🏃</span> ${userVote === 'down' ? 'Skipping to COS ✓' : 'Skip to COS (12)'}
            </button>
          </div>
        </div>
      `;
    }).join('');
  },

  renderFoodSpots() {
    const container = document.getElementById('food-spots-container');
    if (!container) return;

    container.innerHTML = window.THAPAR_DATA.foodSpots.map(spot => `
      <div class="spot-card">
        <div>
          <div class="spot-header">
            <h4 class="spot-name">${spot.name}</h4>
            <span class="spot-status ${spot.crowdLevel.includes('High') ? 'crowded' : 'open'}">
              ${spot.crowdLevel.includes('High') ? '⚠️ High Rush' : '🟢 Open Now'}
            </span>
          </div>
          <p style="font-size: 0.78rem; color: var(--tiet-gold); font-weight: 600; margin-bottom: 0.4rem;">📍 ${spot.location}</p>
          <p style="font-size: 0.82rem; color: var(--text-secondary); margin-bottom: 0.75rem;">🌟 <strong>Must Try:</strong> ${spot.famousFor}</p>
          <p style="font-size: 0.75rem; color: var(--text-muted);"><span style="color: var(--text-secondary);">⏰ Timings:</span> ${spot.timings}</p>
        </div>

        <div style="margin-top: 1rem; padding-top: 0.75rem; border-top: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 0.85rem; font-weight: 700; color: var(--tiet-gold);">⭐ ${spot.rating} / 5.0</span>
          <a href="tel:${spot.deliveryNumber}" class="header-action-btn" style="padding: 0.35rem 0.75rem; font-size: 0.78rem;">
            <span>📞</span> Call / Order
          </a>
        </div>
      </div>
    `).join('');
  }
};

window.MessModule = MessModule;
