/**
 * Social Media Sharing Component
 * Deep-linking and rich sharing for Dashain songs and greeting cards.
 */

export function renderShareModal(song) {
  const shareUrl = window.location.href.split('#')[0] + `?song=${song.id}`;
  const shareText = `🎵 Dashain Song: "${song.title}" (${song.artist}) - Listen to timeless Nepali Dashain songs & Malshree dhuns:`;

  return `
    <div class="modal-backdrop" id="shareModal">
      <div class="modal-box share-modal-box">
        <div class="modal-header">
          <div class="modal-title-wrap">
            <span class="modal-badge">🔗 सामाजिक सञ्जालमा सेयर गर्नुहोस्</span>
            <h2>${song.title}</h2>
            <p class="modal-subtitle">Spread Dashain festive vibes with family & friends</p>
          </div>
          <button class="close-modal-btn" aria-label="Close">&times;</button>
        </div>

        <div class="share-modal-body">
          <div class="song-share-card-preview card-surface">
            <span class="preview-icon">🎶</span>
            <div class="preview-info">
              <h4>${song.title}</h4>
              <p>${song.artist} • ${song.originalYear}</p>
              <span class="preview-badge">✨ ${song.genre}</span>
            </div>
          </div>

          <div class="share-buttons-grid">
            <a 
              href="https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}" 
              target="_blank" 
              class="social-btn whatsapp" 
              rel="noopener">
              <span class="social-icon">💬</span>
              <span>WhatsApp</span>
            </a>

            <a 
              href="viber://forward?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}" 
              target="_blank" 
              class="social-btn viber" 
              rel="noopener">
              <span class="social-icon">🟣</span>
              <span>Viber</span>
            </a>

            <a 
              href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}" 
              target="_blank" 
              class="social-btn facebook" 
              rel="noopener">
              <span class="social-icon">🔵</span>
              <span>Facebook</span>
            </a>

            <a 
              href="https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}" 
              target="_blank" 
              class="social-btn twitter" 
              rel="noopener">
              <span class="social-icon">✖️</span>
              <span>Twitter / X</span>
            </a>

            <a 
              href="https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}" 
              target="_blank" 
              class="social-btn telegram" 
              rel="noopener">
              <span class="social-icon">✈️</span>
              <span>Telegram</span>
            </a>

            <button class="social-btn copy-link-btn" id="copyShareLinkBtn">
              <span class="social-icon">📋</span>
              <span id="copyBtnText">Copy Link</span>
            </button>
          </div>

          <div class="copy-input-wrap">
            <input type="text" readonly value="${shareUrl}" class="form-input share-url-field" id="shareUrlField" />
          </div>
        </div>
      </div>
    </div>
  `;
}

export function bindShareModalEvents(modalEl) {
  const copyBtn = modalEl.querySelector('#copyShareLinkBtn');
  const urlField = modalEl.querySelector('#shareUrlField');
  const copyText = modalEl.querySelector('#copyBtnText');

  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(urlField.value);
      copyText.textContent = 'Copied! ✓';
      copyBtn.classList.add('copied');
      setTimeout(() => {
        copyText.textContent = 'Copy Link';
        copyBtn.classList.remove('copied');
      }, 2500);
    } catch (e) {
      urlField.select();
      document.execCommand('copy');
      copyText.textContent = 'Copied! ✓';
    }
  });
}
