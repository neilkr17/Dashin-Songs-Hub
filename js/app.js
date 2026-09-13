/**
 * Main Application Bootstrap & Router
 * Ties together audio player, search filters, card studio, notifications, and store.
 */

import { store } from './store.js';
import { player } from './audio/player.js';
import { SearchFilterManager } from './components/searchFilter.js';
import { renderSongCard, renderSongDetailsModal } from './components/songList.js';
import { renderReviewModal, bindReviewModalEvents } from './components/reviews.js';
import { renderShareModal, bindShareModalEvents } from './components/socialShare.js';
import { DashainCardStudio } from './components/cardStudio.js';
import { notificationManager } from './components/notifications.js';
import { offlineManager } from './utils/offline.js';

class DashainApp {
  constructor() {
    this.currentView = 'songs';
    this.searchFilterManager = null;
    this.cardStudio = null;
    this.modalContainer = null;
  }

  async init() {
    // 1. Initialize IndexedDB & Store
    await store.init();

    // 2. Set Theme
    document.documentElement.setAttribute('data-theme', store.state.theme);

    // 3. Initialize Offline & PWA
    offlineManager.init();

    // 4. Cache DOM Elements
    this.modalContainer = document.getElementById('modalContainer');
    const visualizerCanvas = document.getElementById('playerVisualizerCanvas');

    // 5. Initialize Music Player
    player.init(visualizerCanvas);

    // 6. Initialize Card Studio
    const cardStudioContainer = document.getElementById('cardStudioContainer');
    if (cardStudioContainer) {
      this.cardStudio = new DashainCardStudio(cardStudioContainer);
      this.cardStudio.render();
    }

    // 7. Initialize Search & Multi-Filter
    const filterContainer = document.getElementById('filterContainer');
    if (filterContainer) {
      this.searchFilterManager = new SearchFilterManager(() => {
        this.renderSongsList();
      });
      this.searchFilterManager.renderFilterControls(filterContainer);
    }

    // 8. Render Initial Songs
    this.renderSongsList();

    // 9. Bind Global UI Events & Countdown
    this.bindNavigation();
    this.bindPlayerDock();
    this.bindGlobalActions();
    this.startDashainCountdown();
    this.checkDeepLinkParams();

    // 10. Listen to store changes
    store.on('favoritesChanged', () => this.renderSongsList());
    store.on('reviewAdded', () => this.renderSongsList());
    store.on('themeChanged', (theme) => {
      document.documentElement.setAttribute('data-theme', theme);
      const themeBtn = document.getElementById('themeToggleBtn');
      if (themeBtn) themeBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
    });
  }

  renderSongsList() {
    const grid = document.getElementById('songsGrid');
    if (!grid || !this.searchFilterManager) return;

    let songsToDisplay = this.searchFilterManager.filterSongs(store.state.songs);

    // If on favorites tab, only show favorites
    if (this.currentView === 'favorites') {
      songsToDisplay = songsToDisplay.filter(s => store.isFavorite(s.id));
    }

    if (songsToDisplay.length === 0) {
      grid.innerHTML = `
        <div class="empty-songs-state card-surface" style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem;">
          <span style="font-size: 3rem;">🪔</span>
          <h3 style="margin: 0.5rem 0; font-weight: 700;">कुनै गीत फेला परेन (No Songs Found)</h3>
          <p style="color: var(--text-muted); font-size: 0.9rem;">कृपया खोज वा फिल्टर परिवर्तन गर्नुहोस् वा सबै फिल्टर रिसेट गर्नुहोस्।</p>
          <button id="resetFromEmptyBtn" class="btn btn-primary btn-sm" style="margin-top: 1rem;">🔄 सबै गीतहरू देखाउनुहोस् (Reset Filters)</button>
        </div>
      `;
      const resetBtn = grid.querySelector('#resetFromEmptyBtn');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          const filterContainer = document.getElementById('filterContainer');
          this.searchFilterManager.filters = {
            searchQuery: '',
            singer: 'all',
            region: 'all',
            era: 'all',
            genre: 'all',
            mood: 'all',
            sortBy: 'popular'
          };
          this.searchFilterManager.renderFilterControls(filterContainer);
          this.renderSongsList();
        });
      }
      return;
    }

    grid.innerHTML = songsToDisplay.map(song => {
      const isPlaying = player.isPlaying && player.currentSong && player.currentSong.id === song.id;
      const isFav = store.isFavorite(song.id);
      return renderSongCard(song, isPlaying, isFav);
    }).join('');

    this.bindSongCardActions(grid);
  }

  bindSongCardActions(container) {
    container.querySelectorAll('.song-card').forEach(card => {
      const songId = card.getAttribute('data-song-id');
      const song = store.getSongById(songId);
      if (!song) return;

      // Play / Pause Button
      const playBtn = card.querySelector('.play-btn-circle');
      if (playBtn) {
        playBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (player.currentSong && player.currentSong.id === song.id) {
            player.togglePlayPause();
          } else {
            player.playSong(song);
          }
        });
      }

      // Favorite Button
      const favBtn = card.querySelector('.fav-btn');
      if (favBtn) {
        favBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const isNowFav = store.toggleFavorite(song.id);
          favBtn.classList.toggle('active', isNowFav);
          favBtn.querySelector('.fav-icon').textContent = isNowFav ? '❤️' : '🤍';
        });
      }

      // Details / Lyrics Button
      const lyricsBtn = card.querySelector('.lyrics-btn');
      if (lyricsBtn) {
        lyricsBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.openSongDetailsModal(song);
        });
      }

      // Review Button
      const reviewBtn = card.querySelector('.review-btn');
      if (reviewBtn) {
        reviewBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.openReviewModal(song);
        });
      }

      // Share Button
      const shareBtn = card.querySelector('.share-btn');
      if (shareBtn) {
        shareBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.openShareModal(song);
        });
      }
    });
  }

  bindNavigation() {
    const navTabs = document.querySelectorAll('.nav-tab-btn, .mobile-nav-item');
    const sections = document.querySelectorAll('.main-view-section');

    const switchView = (targetView) => {
      this.currentView = targetView;
      navTabs.forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-view') === targetView);
      });
      sections.forEach(sec => {
        sec.classList.toggle('active', sec.id === `view-${targetView}`);
      });

      if (targetView === 'songs' || targetView === 'favorites') {
        this.renderSongsList();
      } else if (targetView === 'notifications') {
        const notiContainer = document.getElementById('notificationsContainer');
        if (notiContainer) notificationManager.renderDrawer(notiContainer);
      } else if (targetView === 'backup') {
        this.renderBackupSection();
      }
    };

    navTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const view = tab.getAttribute('data-view');
        switchView(view);
      });
    });
  }

  bindPlayerDock() {
    const playPauseBtn = document.getElementById('playerPlayPauseBtn');
    const nextBtn = document.getElementById('playerNextBtn');
    const prevBtn = document.getElementById('playerPrevBtn');
    const rewindBtn = document.getElementById('playerRewind10Btn');
    const forwardBtn = document.getElementById('playerForward10Btn');
    const shuffleBtn = document.getElementById('playerShuffleBtn');
    const repeatBtn = document.getElementById('playerRepeatBtn');
    const seekBar = document.getElementById('playerSeekBar');
    const volumeSlider = document.getElementById('playerVolumeSlider');
    const muteBtn = document.getElementById('playerMuteBtn');
    const modeToggleBtn = document.getElementById('playerModeToggleBtn');
    const expandVideoBtn = document.getElementById('playerExpandVideoBtn');

    playPauseBtn.addEventListener('click', () => player.togglePlayPause());
    nextBtn.addEventListener('click', () => player.next());
    prevBtn.addEventListener('click', () => player.prev());
    rewindBtn.addEventListener('click', () => player.seekBy(-10));
    forwardBtn.addEventListener('click', () => player.seekBy(10));

    shuffleBtn.addEventListener('click', () => {
      const isShuffled = player.toggleShuffle();
      shuffleBtn.classList.toggle('active', isShuffled);
    });

    repeatBtn.addEventListener('click', () => {
      const mode = player.toggleRepeat();
      repeatBtn.textContent = mode === 'one' ? '🔂' : '🔁';
      repeatBtn.classList.toggle('active', mode !== 'off');
    });

    seekBar.addEventListener('input', (e) => {
      const percent = parseFloat(e.target.value);
      const targetSec = (percent / 100) * player.durationSec;
      player.seek(targetSec);
    });

    volumeSlider.addEventListener('input', (e) => {
      player.setVolume(parseFloat(e.target.value));
    });

    muteBtn.addEventListener('click', () => {
      player.toggleMute();
      muteBtn.textContent = player.volume === 0 ? '🔇' : '🔊';
      volumeSlider.value = player.volume;
    });

    if (modeToggleBtn) {
      modeToggleBtn.addEventListener('click', () => {
        const nextMode = player.togglePlaybackMode();
        const isStream = nextMode === 'stream';
        const iconEl = document.getElementById('playerModeIcon');
        const labelEl = document.getElementById('playerModeLabel');
        const tagEl = document.getElementById('playerModeTag');
        if (iconEl) iconEl.textContent = isStream ? '🎧' : '🪈';
        if (labelEl) labelEl.textContent = isStream ? 'Original Song' : 'Flute Synth';
        if (tagEl) {
          tagEl.textContent = isStream ? 'HD Stream' : 'Flute Synth';
          tagEl.classList.toggle('synth', !isStream);
        }
      });
    }

    if (expandVideoBtn) {
      expandVideoBtn.addEventListener('click', () => {
        if (player.currentSong) {
          this.openSongDetailsModal(player.currentSong);
        }
      });
    }

    // Player Events
    player.on('stateChange', ({ isPlaying, song, currentTime, duration, mode }) => {
      playPauseBtn.innerHTML = isPlaying ? '⏸' : '▶';
      if (song) {
        document.getElementById('playerTrackTitle').textContent = song.title;
        document.getElementById('playerTrackArtist').textContent = `${song.artist} • ${song.originalYear}`;
        document.getElementById('playerTotalTime').textContent = player.formatTime(duration);
        
        const artworkEl = document.getElementById('playerArtwork');
        if (artworkEl && song.thumbnailUrl) {
          artworkEl.innerHTML = `<img src="${song.thumbnailUrl}" alt="${song.title}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 10px;" />`;
        }

        const tagEl = document.getElementById('playerModeTag');
        if (tagEl) {
          const isStream = (mode || player.playbackMode) === 'stream';
          tagEl.textContent = isStream ? 'HD Stream' : 'Flute Synth';
          tagEl.classList.toggle('synth', !isStream);
        }
      }
      this.renderSongsList(); // updates card playing indicators
    });

    player.on('modeChange', (newMode) => {
      const isStream = newMode === 'stream';
      const iconEl = document.getElementById('playerModeIcon');
      const labelEl = document.getElementById('playerModeLabel');
      const tagEl = document.getElementById('playerModeTag');
      if (iconEl) iconEl.textContent = isStream ? '🎧' : '🪈';
      if (labelEl) labelEl.textContent = isStream ? 'Original Song' : 'Flute Synth';
      if (tagEl) {
        tagEl.textContent = isStream ? 'HD Stream' : 'Flute Synth';
        tagEl.classList.toggle('synth', !isStream);
      }
    });

    player.on('timeUpdate', ({ currentTime, duration, percent }) => {
      document.getElementById('playerCurrentTime').textContent = player.formatTime(currentTime);
      seekBar.value = percent;
    });
  }

  bindGlobalActions() {
    // Theme Toggle
    const themeBtn = document.getElementById('themeToggleBtn');
    themeBtn.textContent = store.state.theme === 'dark' ? '☀️' : '🌙';
    themeBtn.addEventListener('click', () => {
      const newTheme = store.state.theme === 'dark' ? 'light' : 'dark';
      store.setTheme(newTheme);
    });

    // Notifications Nav Button
    const notiNavBtn = document.getElementById('navNotificationBtn');
    if (notiNavBtn) {
      notiNavBtn.addEventListener('click', () => {
        const notiTab = document.querySelector('[data-view="notifications"]');
        if (notiTab) notiTab.click();
      });
    }

    // Keyboard Shortcuts (Space, M, Arrow Keys)
    window.addEventListener('keydown', (e) => {
      if (['input', 'textarea', 'select'].includes(e.target.tagName.toLowerCase())) return;
      if (e.code === 'Space') {
        e.preventDefault();
        player.togglePlayPause();
      } else if (e.code === 'ArrowRight') {
        player.seekBy(5);
      } else if (e.code === 'ArrowLeft') {
        player.seekBy(-5);
      } else if (e.key.toLowerCase() === 'm') {
        player.toggleMute();
      }
    });
  }

  openSongDetailsModal(song) {
    this.modalContainer.innerHTML = renderSongDetailsModal(song);
    const modal = this.modalContainer.querySelector('#songDetailsModal');

    // Tab switcher between Nepali and Romanized lyrics
    const tabs = modal.querySelectorAll('.tab-btn');
    const devanagariContent = modal.querySelector('#lyricsContentDevanagari');
    const romanizedContent = modal.querySelector('#lyricsContentRomanized');

    tabs.forEach(t => {
      t.addEventListener('click', () => {
        tabs.forEach(btn => btn.classList.remove('active'));
        t.classList.add('active');
        const isDev = t.getAttribute('data-tab') === 'devanagari';
        devanagariContent.classList.toggle('hidden', !isDev);
        romanizedContent.classList.toggle('hidden', isDev);
      });
    });

    modal.querySelector('.close-modal-btn').addEventListener('click', () => {
      modal.remove();
    });

    modal.querySelector('.modal-play-btn').addEventListener('click', () => {
      player.playSong(song);
    });

    // Custom YouTube URL update option
    const saveCustomBtn = modal.querySelector('#saveCustomUrlBtn');
    const customUrlInput = modal.querySelector('#customUrlInput');
    if (saveCustomBtn && customUrlInput) {
      saveCustomBtn.addEventListener('click', () => {
        const url = customUrlInput.value.trim();
        if (!url) return;
        let ytId = url;
        const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
        if (match) {
          ytId = match[1];
        }
        song.youtubeId = ytId;
        song.youtubeUrl = url.startsWith('http') ? url : `https://www.youtube.com/watch?v=${ytId}`;
        song.embedUrl = `https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&enablejsapi=1&rel=0`;

        const iframe = modal.querySelector('.modal-youtube-iframe');
        if (iframe) {
          iframe.src = song.embedUrl;
        }
        player.playSong(song);
      });
    }

    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  }

  openReviewModal(song) {
    this.modalContainer.innerHTML = renderReviewModal(song);
    const modal = this.modalContainer.querySelector('#reviewModal');
    bindReviewModalEvents(modal, song);

    modal.querySelector('.close-modal-btn').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  }

  openShareModal(song) {
    this.modalContainer.innerHTML = renderShareModal(song);
    const modal = this.modalContainer.querySelector('#shareModal');
    bindShareModalEvents(modal);

    modal.querySelector('.close-modal-btn').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  }

  startDashainCountdown() {
    // Dashain 2083 / Autumn festival target date
    const targetDate = new Date('2026-10-15T00:00:00+05:45').getTime();

    const updateCountdown = () => {
      const now = new Date().getTime();
      const diff = Math.max(0, targetDate - now);

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      const daysEl = document.getElementById('cdDays');
      const hoursEl = document.getElementById('cdHours');
      const minsEl = document.getElementById('cdMins');
      const secsEl = document.getElementById('cdSecs');

      if (daysEl) daysEl.textContent = days.toString().padStart(2, '0');
      if (hoursEl) hoursEl.textContent = hours.toString().padStart(2, '0');
      if (minsEl) minsEl.textContent = mins.toString().padStart(2, '0');
      if (secsEl) secsEl.textContent = secs.toString().padStart(2, '0');
    };

    updateCountdown();
    setInterval(updateCountdown, 1000);
  }

  checkDeepLinkParams() {
    const params = new URLSearchParams(window.location.search);
    const songId = params.get('song');
    if (songId) {
      const song = store.getSongById(songId);
      if (song) {
        setTimeout(() => {
          player.playSong(song);
          this.openSongDetailsModal(song);
        }, 500);
      }
    }
  }

  renderBackupSection() {
    const backupContainer = document.getElementById('backupContainer');
    if (!backupContainer) return;

    backupContainer.innerHTML = `
      <div class="card-surface" style="padding: 1.8rem; max-width: 650px; margin: 0 auto;">
        <h3 style="color: var(--crimson-primary); margin-bottom: 0.5rem;">💾 डाटा सुरक्षा र ब्याकअप (Data Backup & Sync)</h3>
        <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 1.5rem;">
          तपाईंले मनपराएका गीतहरू (Favorites), लेखिएका समीक्षाहरू (Reviews), र बनाइएका दशैं कार्डहरू (Custom Cards) सुरक्षित राख्नुहोस् वा नयाँ उपकरणमा स्थानान्तरण गर्नुहोस्।
        </p>

        <div style="display: flex; flex-direction: column; gap: 1.25rem;">
          <div style="background: var(--bg-secondary); padding: 1.2rem; border-radius: 14px; border: 1px solid var(--border-color);">
            <h4 style="font-size: 0.95rem; margin-bottom: 0.35rem;">१. डाटा डाउनलोड गर्नुहोस् (Export JSON Backup)</h4>
            <p style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 0.8rem;">
              आफ्नो सबै व्यक्तिगत डाटा JSON फाइलको रूपमा सुरक्षित गर्नुहोस्।
            </p>
            <button id="exportBackupBtn" class="btn btn-primary btn-sm">📥 Export Backup (.json)</button>
          </div>

          <div style="background: var(--bg-secondary); padding: 1.2rem; border-radius: 14px; border: 1px solid var(--border-color);">
            <h4 style="font-size: 0.95rem; margin-bottom: 0.35rem;">२. डाटा पुनः लोड गर्नुहोस् (Restore Backup)</h4>
            <p style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 0.8rem;">
              पहिले डाउनलोड गरिएको ब्याकअप फाइल छान्नुहोस्।
            </p>
            <input type="file" id="importBackupFileInput" accept=".json" style="display: none;" />
            <button id="importBackupBtn" class="btn btn-secondary btn-sm">📤 Import Backup File</button>
          </div>
        </div>
      </div>
    `;

    backupContainer.querySelector('#exportBackupBtn').addEventListener('click', () => {
      const dataStr = store.exportBackup();
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Dashain_Geet_Backup_${Date.now()}.json`;
      a.click();
    });

    const fileInput = backupContainer.querySelector('#importBackupFileInput');
    backupContainer.querySelector('#importBackupBtn').addEventListener('click', () => {
      fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (event) => {
        const ok = await store.importBackup(event.target.result);
        if (ok) {
          alert('सफलतापूर्वक डाटा पुनः लोड भयो! (Data restored successfully)');
          this.renderSongsList();
        } else {
          alert('अमान्य ब्याकअप फाइल (Invalid backup file)');
        }
      };
      reader.readAsText(file);
    });
  }
}

// Bootstrap on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new DashainApp();
  app.init();
});
