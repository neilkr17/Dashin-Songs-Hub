/**
 * Reviews & Community Ratings Component
 * Provides 5-star rating submission, helpful upvoting, and review list display.
 */

import { store } from '../store.js';
import { sanitizeText } from '../utils/security.js';

export function renderReviewModal(song) {
  const reviews = store.state.reviews[song.id] || [];
  const avgRating = song.rating ? song.rating.toFixed(1) : '5.0';

  return `
    <div class="modal-backdrop" id="reviewModal">
      <div class="modal-box review-modal-box">
        <div class="modal-header">
          <div class="modal-title-wrap">
            <span class="modal-badge">⭐ समीक्षा र मूल्याङ्कन</span>
            <h2>${song.title}</h2>
            <p class="modal-subtitle">Share your Dashain feelings & childhood festival memories</p>
          </div>
          <button class="close-modal-btn" aria-label="Close">&times;</button>
        </div>

        <div class="review-layout-grid">
          <!-- Left: Submit Review Form -->
          <div class="review-form-container card-surface">
            <h3>✍️ तपाईंको समीक्षा लेख्नुहोस्</h3>
            <form id="addReviewForm" class="review-form" data-song-id="${song.id}">
              <div class="form-group">
                <label>रेटिङ दिनुहोस् (Rating):</label>
                <div class="star-rating-input" id="starRatingInput">
                  <span class="star-input-btn active" data-val="1">★</span>
                  <span class="star-input-btn active" data-val="2">★</span>
                  <span class="star-input-btn active" data-val="3">★</span>
                  <span class="star-input-btn active" data-val="4">★</span>
                  <span class="star-input-btn active" data-val="5">★</span>
                  <input type="hidden" id="selectedRating" value="5" />
                </div>
              </div>

              <div class="form-row-compact">
                <div class="form-group flex-1">
                  <label for="reviewerName">तपाईंको नाम (Your Name):</label>
                  <input type="text" id="reviewerName" class="form-input" placeholder="e.g. Bipin KC" value="${store.state.user.name}" required />
                </div>

                <div class="form-group">
                  <label>अवतार (Avatar):</label>
                  <select id="reviewerAvatar" class="custom-select avatar-select">
                    <option value="🪔">🪔 Diya</option>
                    <option value="🪁">🪁 Changa</option>
                    <option value="🌾">🌾 Jamara</option>
                    <option value="🌸">🌸 Phool</option>
                    <option value="🏮">🏮 Lantern</option>
                    <option value="🛕">🛕 Temple</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label for="reviewMemoryTag">दशैंको मुख्य सम्झना (Memory Tag):</label>
                <input type="text" id="reviewMemoryTag" class="form-input" placeholder="e.g. लिङ्गे पिङ, रातो टीका, परदेशको दशैं..." />
              </div>

              <div class="form-group">
                <label for="reviewComment">समीक्षा / मनको कुरा (Your Review):</label>
                <textarea id="reviewComment" class="form-textarea" rows="3" placeholder="यो गीत सुन्दा तपाईंलाई कस्तो लाग्छ? दशैंको सम्झना बाँड्नुहोस्..." required></textarea>
              </div>

              <button type="submit" class="btn btn-primary btn-block">
                ✨ समीक्षा पोस्ट गर्नुहोस् (Submit Review)
              </button>
            </form>
          </div>

          <!-- Right: Community Reviews List -->
          <div class="reviews-list-container card-surface">
            <div class="reviews-header-bar">
              <div class="overall-rating-badge">
                <span class="big-score">${avgRating}</span>
                <div class="score-meta">
                  <span class="stars-gold">${'★'.repeat(Math.round(song.rating))}</span>
                  <span class="total-revs">${reviews.length} जनाको समीक्षा</span>
                </div>
              </div>
            </div>

            <div class="reviews-scroll-list" id="reviewsScrollList">
              ${reviews.length === 0 ? `
                <div class="empty-reviews-state">
                  <span class="empty-icon">🪔</span>
                  <p>पहिलो समीक्षा तपाईं नै लेख्नुहोस्!</p>
                </div>
              ` : reviews.map(r => renderSingleReviewItem(song.id, r)).join('')}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function renderSingleReviewItem(songId, r) {
  return `
    <div class="review-item" data-review-id="${r.id}">
      <div class="review-item-header">
        <div class="reviewer-meta">
          <span class="user-avatar-bubble">${r.avatar || '🪔'}</span>
          <div>
            <h4 class="reviewer-name">${r.userName}</h4>
            <span class="review-time">${r.timestamp || 'Recently'}</span>
          </div>
        </div>
        <div class="review-rating-stars">
          ${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}
        </div>
      </div>

      ${r.memoryTag ? `<span class="memory-tag">📌 ${r.memoryTag}</span>` : ''}

      <p class="review-text">${r.comment}</p>

      <div class="review-actions">
        <button class="upvote-btn" data-song-id="${songId}" data-review-id="${r.id}" title="Helpful review">
          👍 सहयोगी (${r.helpfulVotes || 0})
        </button>
      </div>
    </div>
  `;
}

export function bindReviewModalEvents(modalEl, song) {
  const stars = modalEl.querySelectorAll('.star-input-btn');
  const ratingInput = modalEl.querySelector('#selectedRating');
  const form = modalEl.querySelector('#addReviewForm');

  // Star rating selector
  stars.forEach(star => {
    star.addEventListener('click', () => {
      const val = parseInt(star.getAttribute('data-val'), 10);
      ratingInput.value = val;
      stars.forEach(s => {
        const sVal = parseInt(s.getAttribute('data-val'), 10);
        s.classList.toggle('active', sVal <= val);
      });
    });
  });

  // Handle Form Submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const userName = modalEl.querySelector('#reviewerName').value;
    const avatar = modalEl.querySelector('#reviewerAvatar').value;
    const memoryTag = modalEl.querySelector('#reviewMemoryTag').value;
    const comment = modalEl.querySelector('#reviewComment').value;
    const rating = parseInt(ratingInput.value, 10);

    try {
      const newRev = await store.addReview(song.id, { userName, avatar, rating, comment, memoryTag });
      
      // Update the user's name in profile
      store.updateUserProfile(userName, avatar);

      // Prepend to list
      const scrollList = modalEl.querySelector('#reviewsScrollList');
      const emptyState = scrollList.querySelector('.empty-reviews-state');
      if (emptyState) emptyState.remove();

      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = renderSingleReviewItem(song.id, newRev);
      scrollList.prepend(tempDiv.firstElementChild);

      // Reset comment field
      modalEl.querySelector('#reviewComment').value = '';
      modalEl.querySelector('#reviewMemoryTag').value = '';

      // Toast feedback
      alert('धन्यवाद! तपाईंको समीक्षा सुरक्षित भयो। (Review posted!)');
    } catch (err) {
      alert('Error submitting review: ' + err.message);
    }
  });

  // Handle Upvotes
  modalEl.addEventListener('click', async (e) => {
    const upvoteBtn = e.target.closest('.upvote-btn');
    if (upvoteBtn) {
      const sId = upvoteBtn.getAttribute('data-song-id');
      const rId = upvoteBtn.getAttribute('data-review-id');
      await store.upvoteReview(sId, rId);
      const songReviews = store.state.reviews[sId] || [];
      const updatedRev = songReviews.find(r => r.id === rId);
      if (updatedRev) {
        upvoteBtn.innerHTML = `👍 सहयोगी (${updatedRev.helpfulVotes})`;
        upvoteBtn.classList.add('voted');
      }
    }
  });
}
