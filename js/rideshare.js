/**
 * ThaparPulse - Cab Sharing & Travel Pooler
 * Handles rideshare listings, WhatsApp direct connections, and fare splitting
 */

const RideshareModule = {
  rides: [],
  currentFilter: 'all',
  femaleOnlyFilter: false,

  init() {
    this.loadState();
    this.render();
    this.bindEvents();
  },

  loadState() {
    const saved = localStorage.getItem('thapar_rideshare_listings');
    if (saved) {
      try {
        this.rides = JSON.parse(saved);
      } catch (e) {
        this.rides = [...window.THAPAR_DATA.rideshares];
      }
    } else {
      this.rides = [...window.THAPAR_DATA.rideshares];
    }
  },

  saveState() {
    localStorage.setItem('thapar_rideshare_listings', JSON.stringify(this.rides));
  },

  setFilter(filter) {
    this.currentFilter = filter;
    this.render();
  },

  toggleFemaleOnly(active) {
    this.femaleOnlyFilter = active;
    this.render();
  },

  render() {
    const container = document.getElementById('rideshare-listings-grid');
    if (!container) return;

    let filtered = this.rides.filter(ride => {
      // Destination filter
      if (this.currentFilter !== 'all') {
        const destLower = ride.toLocation.toLowerCase();
        if (this.currentFilter === 'rajpura' && !destLower.includes('rajpura')) return false;
        if (this.currentFilter === 'chandigarh' && !destLower.includes('chandigarh') && !destLower.includes('elante') && !destLower.includes('airport')) return false;
        if (this.currentFilter === 'delhi' && !destLower.includes('delhi') && !destLower.includes('kashmere')) return false;
        if (this.currentFilter === 'patiala' && !destLower.includes('patiala')) return false;
      }

      // Female only filter
      if (this.femaleOnlyFilter && !ride.femaleOnly) {
        return false;
      }

      return true;
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 3rem; background: var(--bg-surface-elevated); border-radius: var(--radius-lg);">
          <p style="font-size: 1.1rem; color: var(--text-primary); margin-bottom: 0.5rem;">🚗 No cab pools found for this route</p>
          <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1.25rem;">Be the first to post a cab pool and split the travel cost with fellow Thaparians!</p>
          <button class="header-action-btn primary" onclick="App.openModal('modal-post-ride')">+ Post a Cab Pool</button>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(ride => {
      const whatsappMsg = encodeURIComponent(
        `Hi ${ride.creatorName}, I saw your ThaparPulse ride listing from ${ride.fromLocation} to ${ride.toLocation} on ${ride.date} (${ride.departureTime}). Are seats still available?`
      );
      const whatsappUrl = `https://api.whatsapp.com/send?phone=+91${ride.creatorPhone.replace(/\D/g, '')}&text=${whatsappMsg}`;

      return `
        <div class="ride-card">
          <div>
            <div class="ride-route-header">
              <div class="route-dest">
                <span>📍 ${ride.fromLocation}</span>
                <span class="arrow">➔</span>
                <span style="color: #fff;">${ride.toLocation}</span>
              </div>
              ${ride.femaleOnly ? '<span class="ride-tag-female">👩 Female Co-passengers Only</span>' : ''}
            </div>

            <div class="ride-details-list" style="margin-top: 1rem;">
              <div class="ride-detail-item">
                <span class="ride-detail-label">📅 Date</span>
                <span class="ride-detail-val">${ride.date}</span>
              </div>
              <div class="ride-detail-item">
                <span class="ride-detail-label">⏰ Departure</span>
                <span class="ride-detail-val">${ride.departureTime}</span>
              </div>
              <div class="ride-detail-item">
                <span class="ride-detail-label">💺 Open Seats</span>
                <span class="ride-detail-val" style="color: var(--safe-emerald); font-weight: 700;">${ride.seatsAvailable} of ${ride.totalSeats} left</span>
              </div>
              <div class="ride-detail-item">
                <span class="ride-detail-label">🧳 Luggage</span>
                <span class="ride-detail-val">${ride.luggageAllowed}</span>
              </div>
            </div>

            ${ride.notes ? `<p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.75rem; background: rgba(255,255,255,0.03); padding: 0.5rem 0.75rem; border-radius: var(--radius-sm); border-left: 2px solid var(--tiet-crimson);">💬 "${ride.notes}"</p>` : ''}
          </div>

          <div class="ride-footer">
            <div class="fare-split-box">
              <span class="ride-detail-label">Approx Split / Seat</span>
              <span class="fare-amount">₹${ride.farePerHead}</span>
            </div>

            <div style="display: flex; gap: 0.5rem; align-items: center;">
              <a href="${whatsappUrl}" target="_blank" rel="noopener noreferrer" class="btn-whatsapp-join" title="Chat on WhatsApp">
                <span>💬</span> Join Pool
              </a>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  addRide(newRide) {
    this.rides.unshift({
      id: 'ride-' + Date.now(),
      ...newRide
    });
    this.saveState();
    this.render();
    window.App.showToast('Cab pool published to ThaparPulse community!', 'success');
  },

  bindEvents() {
    const postRideForm = document.getElementById('form-post-ride');
    if (postRideForm) {
      postRideForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const fromLocation = document.getElementById('ride-from-input').value;
        const toLocation = document.getElementById('ride-to-input').value;
        const date = document.getElementById('ride-date-input').value;
        const departureTime = document.getElementById('ride-time-input').value;
        const totalSeats = parseInt(document.getElementById('ride-seats-input').value, 10) || 4;
        const seatsAvailable = parseInt(document.getElementById('ride-avail-seats-input').value, 10) || 2;
        const totalFare = parseInt(document.getElementById('ride-fare-input').value, 10) || 600;
        const phone = document.getElementById('ride-phone-input').value;
        const luggage = document.getElementById('ride-luggage-input').value;
        const femaleOnly = document.getElementById('ride-female-only-input').checked;
        const notes = document.getElementById('ride-notes-input').value;

        if (!toLocation || !date || !departureTime || !phone) {
          window.App.showToast('Please fill all required travel fields', 'error');
          return;
        }

        const farePerHead = Math.round(totalFare / totalSeats);

        this.addRide({
          creatorName: window.THAPAR_DATA.userProfile.name,
          creatorRoll: window.THAPAR_DATA.userProfile.rollNumber,
          creatorPhone: phone,
          fromLocation,
          toLocation,
          date,
          departureTime,
          totalSeats,
          seatsAvailable,
          estimatedFareTotal: totalFare,
          farePerHead,
          luggageAllowed: luggage || 'Medium Bag',
          femaleOnly,
          notes
        });

        postRideForm.reset();
        window.App.closeModal('modal-post-ride');
      });
    }
  }
};

window.RideshareModule = RideshareModule;
