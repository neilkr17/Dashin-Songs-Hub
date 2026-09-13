/**
 * Song List Component
 * Renders high-appeal festive song cards with exact streaming support,
 * authentic YouTube video previews, lyrics, and interactive modals.
 */

import { store } from '../store.js';
import { player } from '../audio/player.js';

export function renderSongCard(song, isPlaying = false, isFav = false) {
  const starsHtml = renderStarRating(song.rating);
  const isStreamingMode = player.playbackMode === 'stream';

  return `
    <article class="song-card ${isPlaying ? 'is-playing' : ''}" data-song-id="${song.id}">
      <div class="song-card-header">
        <div class="song-cover-badge">
          <img src="${song.thumbnailUrl}" class="song-cover-img" alt="${song.title}" loading="lazy" onerror="this.style.display='none'" />
          <div class="cover-overlay-gradient"></div>
          <span class="cover-icon">${getGenreIcon(song.genre)}</span>
          <button class="play-btn-circle" title="${isPlaying ? 'Pause' : 'Play Official Song'}" aria-label="Play ${song.title}">
            <span class="play-icon">${isPlaying ? '⏸' : '▶'}</span>
          </button>
          <span class="video-hd-badge" title="Official YouTube Video Stream">🎬 Official Song</span>
        </div>
        <div class="song-header-meta">
          <span class="era-tag">${song.originalYear} • ${song.era.split(' ')[0]}</span>
          <button class="fav-btn ${isFav ? 'active' : ''}" title="Favorite" aria-label="Toggle favorite">
            <span class="fav-icon">${isFav ? '❤️' : '🤍'}</span>
          </button>
        </div>
      </div>

      <div class="song-card-body">
        <h3 class="song-title" title="${song.titleEn}">${song.title}</h3>
        <p class="song-artist">${song.artist}</p>

        <div class="song-tags">
          <span class="badge region-badge" title="Region">📍 ${song.region}</span>
          <span class="badge mood-badge" title="Mood">✨ ${song.mood}</span>
        </div>

        <div class="song-lyrics-preview">
          <span class="quote-icon">“</span>
          <p class="lyrics-excerpt">${song.lyricsDevanagari.split('\n')[0]}</p>
        </div>
      </div>

      <div class="song-card-footer">
        <div class="rating-display" title="${song.rating} / 5 stars (${song.reviewsCount} reviews)">
          <span class="stars">${starsHtml}</span>
          <span class="rating-score">${song.rating.toFixed(1)}</span>
          <span class="rating-count">(${song.reviewsCount})</span>
        </div>

        <div class="card-actions">
          <button class="action-btn lyrics-btn" title="View Full Video, Lyrics & Trivia">
            📜 Video & Lyrics
          </button>
          <button class="action-btn review-btn" title="Write a Review & Rate">
            ⭐ Review
          </button>
          <button class="action-btn share-btn" title="Share Song">
            🔗 Share
          </button>
        </div>
      </div>
    </article>
  `;
}

export function renderStarRating(rating) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.4;
  let stars = '';
  for (let i = 1; i <= 5; i++) {
    if (i <= fullStars) {
      stars += '<span class="star filled">★</span>';
    } else if (i === fullStars + 1 && hasHalf) {
      stars += '<span class="star half">★</span>';
    } else {
      stars += '<span class="star empty">☆</span>';
    }
  }
  return stars;
}

export function getGenreIcon(genre) {
  switch (genre) {
    case 'Malshree Classical': return '🛕';
    case 'Evergreen Pop': return '📻';
    case 'Folk / Lok Dohori': return '🪘';
    case 'Rock / Fusion': return '🎸';
    case 'Devotional / Bhajan': return '🪔';
    default: return '🎵';
  }
}

export function renderSongDetailsModal(song) {
  const isFav = store.isFavorite(song.id);
  const reviews = store.state.reviews[song.id] || [];

  return `
    <div class="modal-backdrop" id="songDetailsModal">
      <div class="modal-box festival-modal large-modal">
        <div class="modal-header">
          <div class="modal-title-wrap">
            <div class="badge-row">
              <span class="modal-badge">${song.badge || 'Featured'}</span>
              <span class="modal-badge video-badge">🎬 Official Music Video</span>
            </div>
            <h2>${song.title}</h2>
            <p class="modal-subtitle">${song.titleEn} • ${song.artist}</p>
          </div>
          <button class="close-modal-btn" aria-label="Close modal">&times;</button>
        </div>

        <!-- Embedded Official YouTube Video Player -->
        <div class="modal-video-container card-surface">
          <iframe 
            class="modal-youtube-iframe" 
            src="${song.embedUrl}" 
            title="${song.title}" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
            allowfullscreen>
          </iframe>
        </div>

        <div class="modal-body-grid">
          <div class="modal-left-col">
            <div class="meta-section card-surface">
              <h4>📋 विवरण (Song Info)</h4>
              <ul class="info-list">
                <li><strong>गायक/गायिका (Artist):</strong> ${song.singers ? song.singers.join(', ') : song.artist}</li>
                <li><strong>वर्ष (Release Year):</strong> ${song.originalYear} (${song.era})</li>
                <li><strong>क्षेत्रीय भाका (Region):</strong> ${song.region}</li>
                <li><strong>विधा (Genre):</strong> ${song.genre}</li>
                <li><strong>मुड / भाव (Mood):</strong> ${song.mood}</li>
                <li><strong>अवधि (Duration):</strong> ${song.duration}</li>
              </ul>

              <div class="modal-action-buttons">
                <button class="btn btn-primary btn-block modal-play-btn" data-song-id="${song.id}">
                  ▶ Stream Full Song in Dock
                </button>
                <div class="external-links-row">
                  <a href="${song.youtubeUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-youtube" title="Watch on YouTube">
                    🔴 YouTube ↗
                  </a>
                  <a href="${song.spotifyUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-spotify" title="Find on Spotify">
                    🟢 Spotify ↗
                  </a>
                </div>
              </div>
            </div>

            <div class="trivia-section card-surface">
              <h4>🌺 सांस्कृतिक महत्व (Cultural Story)</h4>
              <p>${song.meaning}</p>
              <div class="cultural-trivia-box">
                <span class="trivia-icon">💡</span>
                <p><strong>Trivia:</strong> ${song.culturalTrivia}</p>
              </div>
            </div>
          </div>

          <div class="modal-right-col">
            <div class="lyrics-section card-surface">
              <div class="lyrics-header">
                <h4>📜 गीतका बोल (Lyrics)</h4>
                <div class="lyrics-tabs">
                  <button class="tab-btn active" data-tab="devanagari">नेपाली (Devanagari)</button>
                  <button class="tab-btn" data-tab="romanized">Romanized</button>
                </div>
              </div>
              <div class="lyrics-content" id="lyricsContentDevanagari">
                <pre class="lyrics-text">${song.lyricsDevanagari}</pre>
              </div>
              <div class="lyrics-content hidden" id="lyricsContentRomanized">
                <pre class="lyrics-text">${song.lyricsRomanized}</pre>
              </div>
            </div>

            <!-- Custom YouTube URL update option -->
            <div class="custom-url-editor card-surface" style="margin-top: 1rem; padding: 1rem;">
              <details>
                <summary style="cursor: pointer; font-weight: 600; font-size: 0.85rem; color: var(--gold-primary);">
                  ⚙️ आफ्नै युट्युब वा अडियो लिङ्क प्रयोग गर्नुहोस् (Custom Song URL)
                </summary>
                <div style="margin-top: 0.75rem; display: flex; gap: 0.5rem; flex-wrap: wrap;">
                  <input type="text" id="customUrlInput" class="custom-url-field" placeholder="Paste custom YouTube link or video ID..." value="${song.youtubeUrl}" style="flex: 1; padding: 0.5rem 0.75rem; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-secondary); color: var(--text-primary); font-size: 0.85rem;" />
                  <button id="saveCustomUrlBtn" class="btn btn-primary btn-sm">Save & Play</button>
                </div>
              </details>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}
