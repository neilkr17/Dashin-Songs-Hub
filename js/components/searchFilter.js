/**
 * Search & Multi-Dimensional Filter Component
 * Supports real-time text query, singer select, region chips, era pills, mood filters, and sorting.
 */

import { REGIONS, ERAS, GENRES, MOODS } from '../data/songs.js';
import { store } from '../store.js';

export class SearchFilterManager {
  constructor(onFilterChange) {
    this.onFilterChange = onFilterChange;
    this.filters = {
      searchQuery: '',
      singer: 'all',
      region: 'all',
      era: 'all',
      genre: 'all',
      mood: 'all',
      sortBy: 'popular' // 'popular' | 'rating' | 'newest' | 'oldest' | 'title'
    };
  }

  getAvailableSingers() {
    const singerSet = new Set();
    store.state.songs.forEach(song => {
      if (song.singers) {
        song.singers.forEach(s => singerSet.add(s));
      } else {
        singerSet.add(song.artistEn || song.artist);
      }
    });
    return Array.from(singerSet).sort();
  }

  renderFilterControls(container) {
    const singers = this.getAvailableSingers();

    container.innerHTML = `
      <div class="search-filter-panel">
        <!-- Search Input Bar -->
        <div class="search-bar-wrap">
          <div class="search-input-box">
            <span class="search-icon">🔍</span>
            <input 
              type="text" 
              id="songSearchInput" 
              placeholder="Search by song title, singer, lyrics (e.g. Malshree, Sugam, चङ्गा, पिङ)..." 
              value="${this.filters.searchQuery}"
              aria-label="Search Dashain songs"
            />
            ${this.filters.searchQuery ? '<button id="clearSearchBtn" class="clear-btn">&times;</button>' : ''}
          </div>
          
          <div class="sort-dropdown-wrap">
            <label for="sortBySelect" class="sort-label">क्रमबद्ध (Sort):</label>
            <select id="sortBySelect" class="custom-select">
              <option value="popular" ${this.filters.sortBy === 'popular' ? 'selected' : ''}>🔥 Most Popular</option>
              <option value="rating" ${this.filters.sortBy === 'rating' ? 'selected' : ''}>⭐ Highest Rated</option>
              <option value="newest" ${this.filters.sortBy === 'newest' ? 'selected' : ''}>📅 Newest First</option>
              <option value="oldest" ${this.filters.sortBy === 'oldest' ? 'selected' : ''}>📻 Golden Classics First</option>
              <option value="title" ${this.filters.sortBy === 'title' ? 'selected' : ''}>🔤 Title (A - Z)</option>
            </select>
          </div>
        </div>

        <!-- Filter Row 1: Singer & Era Selectors -->
        <div class="filter-row-secondary">
          <div class="filter-group">
            <label for="singerSelect" class="filter-label">🎤 गायक / गायिका (Singer):</label>
            <select id="singerSelect" class="custom-select">
              <option value="all">सबै गायकहरू (All Singers)</option>
              ${singers.map(s => `<option value="${s}" ${this.filters.singer === s ? 'selected' : ''}>${s}</option>`).join('')}
            </select>
          </div>

          <div class="filter-group">
            <label for="eraSelect" class="filter-label">⏳ कालखण्ड (Era):</label>
            <select id="eraSelect" class="custom-select">
              ${ERAS.map(era => `<option value="${era.id}" ${this.filters.era === era.id ? 'selected' : ''}>${era.name}</option>`).join('')}
            </select>
          </div>

          <div class="filter-group">
            <label for="moodSelect" class="filter-label">✨ मुड (Vibe):</label>
            <select id="moodSelect" class="custom-select">
              ${MOODS.map(m => `<option value="${m.id}" ${this.filters.mood === m.id ? 'selected' : ''}>${m.name}</option>`).join('')}
            </select>
          </div>

          <button id="resetFiltersBtn" class="btn btn-outline btn-sm reset-btn" title="Reset all filters">
            🔄 Reset
          </button>
        </div>

        <!-- Filter Row 2: Regional Scrollable Chips -->
        <div class="region-chips-container">
          <span class="chips-label">📍 क्षेत्र (Region):</span>
          <div class="chips-scroll">
            ${REGIONS.map(reg => `
              <button 
                class="chip-btn ${this.filters.region === reg.id ? 'active' : ''}" 
                data-region="${reg.id}">
                ${reg.icon} ${reg.name}
              </button>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    this.bindEvents(container);
  }

  bindEvents(container) {
    const searchInput = container.querySelector('#songSearchInput');
    const sortBySelect = container.querySelector('#sortBySelect');
    const singerSelect = container.querySelector('#singerSelect');
    const eraSelect = container.querySelector('#eraSelect');
    const moodSelect = container.querySelector('#moodSelect');
    const resetBtn = container.querySelector('#resetFiltersBtn');
    const regionChips = container.querySelectorAll('.chip-btn');

    // Debounced search input
    let searchTimeout = null;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        this.filters.searchQuery = e.target.value.trim().toLowerCase();
        this.emitChange();
      }, 200);
    });

    sortBySelect.addEventListener('change', (e) => {
      this.filters.sortBy = e.target.value;
      this.emitChange();
    });

    singerSelect.addEventListener('change', (e) => {
      this.filters.singer = e.target.value;
      this.emitChange();
    });

    eraSelect.addEventListener('change', (e) => {
      this.filters.era = e.target.value;
      this.emitChange();
    });

    moodSelect.addEventListener('change', (e) => {
      this.filters.mood = e.target.value;
      this.emitChange();
    });

    regionChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const regionId = chip.getAttribute('data-region');
        this.filters.region = regionId;
        regionChips.forEach(c => c.classList.toggle('active', c.getAttribute('data-region') === regionId));
        this.emitChange();
      });
    });

    resetBtn.addEventListener('click', () => {
      this.filters = {
        searchQuery: '',
        singer: 'all',
        region: 'all',
        era: 'all',
        genre: 'all',
        mood: 'all',
        sortBy: 'popular'
      };
      this.renderFilterControls(container);
      this.emitChange();
    });
  }

  filterSongs(allSongs) {
    return allSongs.filter(song => {
      // 1. Search Query Filter
      if (this.filters.searchQuery) {
        const q = this.filters.searchQuery;
        const matchTitle = song.title.toLowerCase().includes(q) || song.titleEn.toLowerCase().includes(q);
        const matchArtist = song.artist.toLowerCase().includes(q) || (song.artistEn && song.artistEn.toLowerCase().includes(q));
        const matchLyrics = song.lyricsDevanagari.toLowerCase().includes(q) || song.lyricsRomanized.toLowerCase().includes(q);
        const matchTrivia = song.culturalTrivia && song.culturalTrivia.toLowerCase().includes(q);
        if (!matchTitle && !matchArtist && !matchLyrics && !matchTrivia) {
          return false;
        }
      }

      // 2. Singer Filter
      if (this.filters.singer !== 'all') {
        const hasSinger = (song.singers && song.singers.includes(this.filters.singer)) ||
          song.artist.includes(this.filters.singer) ||
          (song.artistEn && song.artistEn.includes(this.filters.singer));
        if (!hasSinger) return false;
      }

      // 3. Region Filter
      if (this.filters.region !== 'all' && song.region !== this.filters.region) {
        return false;
      }

      // 4. Era Filter
      if (this.filters.era !== 'all' && song.era !== this.filters.era) {
        return false;
      }

      // 5. Mood Filter
      if (this.filters.mood !== 'all' && song.mood !== this.filters.mood) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      switch (this.filters.sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'newest':
          return b.originalYear - a.originalYear;
        case 'oldest':
          return a.originalYear - b.originalYear;
        case 'title':
          return a.title.localeCompare(b.title);
        case 'popular':
        default:
          return (b.popular ? 1 : 0) - (a.popular ? 1 : 0) || (b.reviewsCount - a.reviewsCount);
      }
    });
  }

  emitChange() {
    if (this.onFilterChange) {
      this.onFilterChange(this.filters);
    }
  }
}
