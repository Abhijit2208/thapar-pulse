/**
 * ThaparPulse - Anonymous Campus Feed & Senior Advice
 * Student forum, placement hacks, hostel advice, upvotes and comments
 */

const FeedModule = {
  posts: [],
  currentTag: 'all',
  upvotedSet: new Set(),

  init() {
    this.loadState();
    this.render();
    this.bindEvents();
  },

  loadState() {
    const saved = localStorage.getItem('thapar_feed_posts');
    if (saved) {
      try { this.posts = JSON.parse(saved); } catch (e) { this.posts = [...window.THAPAR_DATA.feedPosts]; }
    } else {
      this.posts = [...window.THAPAR_DATA.feedPosts];
    }

    const savedUpvotes = localStorage.getItem('thapar_feed_upvotes');
    if (savedUpvotes) {
      try { this.upvotedSet = new Set(JSON.parse(savedUpvotes)); } catch (e) { this.upvotedSet = new Set(); }
    }
  },

  saveState() {
    localStorage.setItem('thapar_feed_posts', JSON.stringify(this.posts));
    localStorage.setItem('thapar_feed_upvotes', JSON.stringify(Array.from(this.upvotedSet)));
  },

  setTag(tag) {
    this.currentTag = tag;
    document.querySelectorAll('.feed-tag-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tag === tag);
    });
    this.render();
  },

  toggleUpvote(postId) {
    const post = this.posts.find(p => p.id === postId);
    if (!post) return;

    if (this.upvotedSet.has(postId)) {
      this.upvotedSet.delete(postId);
      post.upvotes -= 1;
    } else {
      this.upvotedSet.add(postId);
      post.upvotes += 1;
      window.App.showToast('Upvoted!', 'success');
    }

    this.saveState();
    this.render();
  },

  addComment(postId, commentText) {
    if (!commentText.trim()) return;
    const post = this.posts.find(p => p.id === postId);
    if (!post) return;

    if (!post.comments) post.comments = [];
    post.comments.push({
      author: window.THAPAR_DATA.userProfile.branch || 'TIET Student',
      text: commentText.trim()
    });

    this.saveState();
    this.render();
    window.App.showToast('Comment added!', 'success');
  },

  render() {
    const container = document.getElementById('campus-feed-posts-list');
    if (!container) return;

    let filtered = this.posts.filter(post => {
      if (this.currentTag !== 'all' && post.tag.toLowerCase() !== this.currentTag.toLowerCase()) {
        return false;
      }
      return true;
    });

    container.innerHTML = filtered.map(post => {
      const isUpvoted = this.upvotedSet.has(post.id);

      return `
        <div class="feed-post-card">
          <div class="post-header">
            <div class="post-author">
              <div class="post-avatar-anon">🎓</div>
              <div>
                <h4 style="font-size: 0.92rem; font-weight: 700;">${post.authorAlias}</h4>
                <p style="font-size: 0.72rem; color: var(--text-muted);">${post.branch} • ${post.timestamp}</p>
              </div>
            </div>

            <span class="post-tag">${post.tag}</span>
          </div>

          <p class="post-text">${post.content}</p>

          <div class="post-footer-actions">
            <button class="btn-post-action ${isUpvoted ? 'upvoted' : ''}" onclick="FeedModule.toggleUpvote('${post.id}')">
              <span>▲</span> Upvote (${post.upvotes})
            </button>
            <button class="btn-post-action" onclick="document.getElementById('comments-section-${post.id}').style.display = document.getElementById('comments-section-${post.id}').style.display === 'none' ? 'block' : 'none'">
              <span>💬</span> Comments (${post.comments ? post.comments.length : 0})
            </button>
          </div>

          <!-- Comments Subsection -->
          <div id="comments-section-${post.id}" style="display: none; background: rgba(0,0,0,0.25); border-radius: var(--radius-md); padding: 1rem; margin-top: 0.5rem;">
            <div style="display: flex; flex-direction: column; gap: 0.6rem; margin-bottom: 0.75rem;">
              ${(post.comments && post.comments.length > 0) ? post.comments.map(c => `
                <div style="font-size: 0.82rem; border-left: 2px solid var(--tiet-crimson); padding-left: 0.6rem;">
                  <strong style="color: var(--tiet-gold); font-size: 0.75rem;">${c.author}:</strong>
                  <p style="color: var(--text-primary); margin-top: 0.1rem;">${c.text}</p>
                </div>
              `).join('') : '<p style="font-size: 0.78rem; color: var(--text-muted);">No replies yet. Be the first!</p>'}
            </div>

            <div style="display: flex; gap: 0.5rem;">
              <input type="text" id="comment-input-${post.id}" placeholder="Write a reply..." class="form-control" style="font-size: 0.8rem; padding: 0.45rem 0.75rem;">
              <button class="header-action-btn primary" onclick="FeedModule.submitComment('${post.id}')" style="padding: 0.45rem 0.85rem; font-size: 0.78rem;">Reply</button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  submitComment(postId) {
    const input = document.getElementById(`comment-input-${postId}`);
    if (input) {
      this.addComment(postId, input.value);
      input.value = '';
    }
  },

  addPost(newPost) {
    this.posts.unshift({
      id: 'post-' + Date.now(),
      timestamp: 'Just now',
      upvotes: 1,
      comments: [],
      ...newPost
    });
    this.upvotedSet.add(this.posts[0].id);
    this.saveState();
    this.render();
    window.App.showToast('Post shared with TIET community!', 'success');
  },

  bindEvents() {
    const postForm = document.getElementById('form-create-post');
    if (postForm) {
      postForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const content = document.getElementById('post-content-input').value;
        const tag = document.getElementById('post-tag-input').value;
        const alias = document.getElementById('post-alias-input').value;

        if (!content.trim()) {
          window.App.showToast('Post cannot be empty', 'error');
          return;
        }

        this.addPost({
          authorAlias: alias || 'Anonymous Thaparian',
          branch: window.THAPAR_DATA.userProfile.branch || "COE '26",
          tag,
          content: content.trim()
        });

        document.getElementById('post-content-input').value = '';
        window.App.closeModal('modal-create-post');
      });
    }
  }
};

window.FeedModule = FeedModule;
