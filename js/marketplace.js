/**
 * ThaparPulse - Campus Bazaar & Lost-Found
 * Buy/sell cycles, dorm appliances, drafters + campus lost item tracker
 */

const MarketplaceModule = {
  items: [],
  lostFoundItems: [],
  currentTab: 'market', // 'market' | 'lostfound'
  categoryFilter: 'all',

  init() {
    this.loadState();
    this.render();
    this.bindEvents();
  },

  loadState() {
    const savedMarket = localStorage.getItem('thapar_bazaar_items');
    if (savedMarket) {
      try { this.items = JSON.parse(savedMarket); } catch (e) { this.items = [...window.THAPAR_DATA.marketplaceItems]; }
    } else {
      this.items = [...window.THAPAR_DATA.marketplaceItems];
    }

    const savedLF = localStorage.getItem('thapar_lostfound_items');
    if (savedLF) {
      try { this.lostFoundItems = JSON.parse(savedLF); } catch (e) { this.lostFoundItems = [...window.THAPAR_DATA.lostAndFound]; }
    } else {
      this.lostFoundItems = [...window.THAPAR_DATA.lostAndFound];
    }
  },

  saveState() {
    localStorage.setItem('thapar_bazaar_items', JSON.stringify(this.items));
    localStorage.setItem('thapar_lostfound_items', JSON.stringify(this.lostFoundItems));
  },

  setTab(tab) {
    this.currentTab = tab;
    document.querySelectorAll('.bazaar-main-tab').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    
    document.getElementById('bazaar-market-view').style.display = tab === 'market' ? 'block' : 'none';
    document.getElementById('bazaar-lostfound-view').style.display = tab === 'lostfound' ? 'block' : 'none';
    
    this.render();
  },

  setCategory(category) {
    this.categoryFilter = category;
    document.querySelectorAll('.bazaar-cat-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.cat === category);
    });
    this.render();
  },

  render() {
    if (this.currentTab === 'market') {
      this.renderMarket();
    } else {
      this.renderLostFound();
    }
  },

  renderMarket() {
    const container = document.getElementById('bazaar-items-grid');
    if (!container) return;

    let filtered = this.items.filter(item => {
      if (this.categoryFilter !== 'all' && item.category !== this.categoryFilter) {
        return false;
      }
      return true;
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 3rem; background: var(--bg-surface-elevated); border-radius: var(--radius-lg);">
          <p style="font-size: 1.1rem; color: var(--text-primary); margin-bottom: 0.5rem;">🛍️ No items found in this category</p>
          <button class="header-action-btn primary" onclick="App.openModal('modal-post-bazaar')">+ List an Item for Sale</button>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(item => {
      const whatsappMsg = encodeURIComponent(
        `Hi ${item.sellerName}, I am interested in buying your "${item.title}" listed on ThaparPulse for ₹${item.price}. Is it still available for pickup at ${item.sellerHostel}?`
      );
      const whatsappUrl = `https://api.whatsapp.com/send?phone=+91${item.sellerPhone.replace(/\D/g, '')}&text=${whatsappMsg}`;

      return `
        <div class="item-card">
          <div class="item-img-placeholder">
            <span>${item.iconEmoji || '📦'}</span>
            <span class="item-price-tag">₹${item.price}</span>
          </div>

          <div class="item-body">
            <div>
              <div style="display: flex; justify-content: space-between; font-size: 0.72rem; color: var(--text-muted); margin-bottom: 0.25rem;">
                <span>${item.category}</span>
                <span>${item.postedDate}</span>
              </div>
              <h3 class="item-title">${item.title}</h3>
              <p style="font-size: 0.78rem; color: var(--safe-emerald); font-weight: 600; margin-top: 0.2rem;">✨ Condition: ${item.condition}</p>
            </div>

            <p style="font-size: 0.82rem; color: var(--text-secondary); line-height: 1.4; margin: 0.35rem 0;">
              ${item.description}
            </p>

            <div style="margin-top: auto; border-top: 1px solid var(--border-subtle); padding-top: 0.75rem;">
              <div class="item-seller-info">
                <span>📍 ${item.sellerHostel}</span>
                <span>•</span>
                <span>👤 ${item.sellerName}</span>
              </div>

              <div style="margin-top: 0.75rem;">
                <a href="${whatsappUrl}" target="_blank" rel="noopener noreferrer" class="btn-whatsapp-join" style="width: 100%; justify-content: center;">
                  <span>💬</span> Contact Seller on WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  renderLostFound() {
    const container = document.getElementById('lostfound-items-grid');
    if (!container) return;

    if (this.lostFoundItems.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 3rem; background: var(--bg-surface-elevated); border-radius: var(--radius-lg);">
          <p>No lost or found items reported right now.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = this.lostFoundItems.map(item => `
      <div class="card" style="display: flex; flex-direction: column; justify-content: space-between; gap: 0.75rem;">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <span class="spot-status ${item.type === 'Found' ? 'open' : 'crowded'}" style="font-size: 0.75rem;">
              ${item.type === 'Found' ? '🟢 Found Item' : '🚨 Lost Item'}
            </span>
            <span style="font-size: 0.75rem; color: var(--text-muted);">${item.date}</span>
          </div>

          <h3 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 0.4rem;">${item.title}</h3>
          <p style="font-size: 0.8rem; color: var(--tiet-gold); font-weight: 600;">📍 Location: ${item.location}</p>
          <p style="font-size: 0.84rem; color: var(--text-secondary); margin-top: 0.5rem; line-height: 1.4;">${item.details}</p>
        </div>

        <div style="border-top: 1px solid var(--border-subtle); padding-top: 0.75rem; display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 0.78rem; color: var(--text-muted);">Contact: <strong>${item.contactPerson}</strong></span>
          <button class="header-action-btn" onclick="MarketplaceModule.claimLostItem('${item.id}')" style="padding: 0.35rem 0.75rem; font-size: 0.78rem;">
            <span>🛡️</span> ${item.type === 'Found' ? 'Claim This' : 'Found It?'}
          </button>
        </div>
      </div>
    `).join('');
  },

  claimLostItem(id) {
    const item = this.lostFoundItems.find(i => i.id === id);
    if (!item) return;
    alert(`Please reach out to ${item.contactPerson} to verify ownership and collect your item!`);
  },

  addItem(newItem) {
    this.items.unshift({
      id: 'item-' + Date.now(),
      postedDate: 'Just now',
      ...newItem
    });
    this.saveState();
    this.render();
    window.App.showToast('Item listed on Campus Bazaar!', 'success');
  },

  addLostFound(newLF) {
    this.lostFoundItems.unshift({
      id: 'lf-' + Date.now(),
      status: 'Active',
      ...newLF
    });
    this.saveState();
    this.render();
    window.App.showToast('Lost & Found notice published!', 'success');
  },

  bindEvents() {
    const bazaarForm = document.getElementById('form-post-bazaar');
    if (bazaarForm) {
      bazaarForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('bazaar-title-input').value;
        const category = document.getElementById('bazaar-cat-input').value;
        const price = parseInt(document.getElementById('bazaar-price-input').value, 10) || 500;
        const condition = document.getElementById('bazaar-cond-input').value;
        const hostel = document.getElementById('bazaar-hostel-input').value;
        const phone = document.getElementById('bazaar-phone-input').value;
        const desc = document.getElementById('bazaar-desc-input').value;

        if (!title || !price || !phone) {
          window.App.showToast('Please fill all required item details', 'error');
          return;
        }

        let iconEmoji = '📦';
        if (category.includes('Bicycles')) iconEmoji = '🚲';
        else if (category.includes('Tools')) iconEmoji = '📐';
        else if (category.includes('Appliances')) iconEmoji = '🫖';
        else if (category.includes('Books')) iconEmoji = '📚';

        this.addItem({
          title,
          category,
          price,
          originalPrice: price * 2,
          condition,
          sellerName: window.THAPAR_DATA.userProfile.name,
          sellerHostel: hostel || 'Hostel J',
          sellerPhone: phone,
          description: desc || 'Available for immediate campus pickup.',
          iconEmoji
        });

        bazaarForm.reset();
        window.App.closeModal('modal-post-bazaar');
      });
    }

    const lfForm = document.getElementById('form-post-lostfound');
    if (lfForm) {
      lfForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const type = document.getElementById('lf-type-input').value;
        const title = document.getElementById('lf-title-input').value;
        const location = document.getElementById('lf-loc-input').value;
        const details = document.getElementById('lf-details-input').value;
        const contact = document.getElementById('lf-contact-input').value;

        if (!title || !location) {
          window.App.showToast('Please fill title and location', 'error');
          return;
        }

        this.addLostFound({
          type,
          title,
          location,
          date: new Date().toISOString().split('T')[0],
          contactPerson: contact || window.THAPAR_DATA.userProfile.name,
          details: details || 'Please get in touch to collect.'
        });

        lfForm.reset();
        window.App.closeModal('modal-post-lostfound');
      });
    }
  }
};

window.MarketplaceModule = MarketplaceModule;
