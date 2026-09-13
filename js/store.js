/**
 * State Management & IndexedDB Persistence Layer
 * Provides robust offline data storage and seamless synchronization.
 */

import { DASHAIN_SONGS } from './data/songs.js';
import { sanitizeText, isValidRating } from './utils/security.js';

const DB_NAME = 'DashainSongsHubDB';
const DB_VERSION = 1;

class Store {
  constructor() {
    this.db = null;
    this.isReady = false;
    this.listeners = new Map();
    this.state = {
      songs: [...DASHAIN_SONGS],
      favorites: new Set(),
      reviews: {},
      customCards: [],
      playlists: [
        { id: 'all-time-hits', name: 'सर्वकालीन लोकप्रिय (All-Time Hits)', songIds: ['malshree-dhun-timeless', 'sugam-dashain-aayo', 'narayan-gopal-bada-dashain', 'prakash-shrestha-dashain-nai-ho'] },
        { id: 'nostalgic-pardeshi', name: 'परदेशी सम्झना (Pardeshi Nostalgia)', songIds: ['narayan-gopal-bada-dashain', 'udit-deepa-pardeshi-dashain', 'kulendra-pardeshi-dai'] },
        { id: 'festive-dance', name: 'रमाईलो नाचगान (Festive Dance & Beats)', songIds: ['nima-rumba-changa-chet', 'eleena-khem-linge-ping', 'sushant-kc-aashis-dashain', 'sarangi-beats-naya-dashain'] }
      ],
      currentPlaylist: 'all-time-hits',
      theme: typeof localStorage !== 'undefined' ? (localStorage.getItem('dashain_theme') || 'dark') : 'dark',
      notifications: [],
      user: {
        name: typeof localStorage !== 'undefined' ? (localStorage.getItem('dashain_user_name') || 'Dashain Lover (दशैं प्रेमी)') : 'Dashain Lover (दशैं प्रेमी)',
        avatar: typeof localStorage !== 'undefined' ? (localStorage.getItem('dashain_user_avatar') || '🪔') : '🪔'
      }
    };
  }

  async init() {
    try {
      await this.openIndexedDB();
      await this.loadPersistedData();
      this.initDefaultReviews();
      this.isReady = true;
      this.emit('ready', this.state);
    } catch (err) {
      console.warn('IndexedDB unavailable, falling back to LocalStorage:', err);
      this.loadLocalStorageFallback();
      this.isReady = true;
      this.emit('ready', this.state);
    }
  }

  openIndexedDB() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        return reject(new Error('IndexedDB not supported'));
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('reviews')) {
          db.createObjectStore('reviews', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('favorites')) {
          db.createObjectStore('favorites', { keyPath: 'songId' });
        }
        if (!db.objectStoreNames.contains('cards')) {
          db.createObjectStore('cards', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('customPlaylists')) {
          db.createObjectStore('customPlaylists', { keyPath: 'id' });
        }
      };

      request.onsuccess = (e) => {
        this.db = e.target.result;
        resolve(this.db);
      };

      request.onerror = (e) => {
        reject(e.target.error);
      };
    });
  }

  async loadPersistedData() {
    if (!this.db) return;

    // Load Favorites
    const favs = await this.getAllFromStore('favorites');
    favs.forEach(f => this.state.favorites.add(f.songId));

    // Load Reviews
    const reviews = await this.getAllFromStore('reviews');
    reviews.forEach(r => {
      if (!this.state.reviews[r.songId]) this.state.reviews[r.songId] = [];
      this.state.reviews[r.songId].push(r);
    });

    // Load Cards
    const cards = await this.getAllFromStore('cards');
    if (cards && cards.length > 0) {
      this.state.customCards = cards;
    }

    // Recalculate average ratings
    this.updateComputedRatings();
  }

  getAllFromStore(storeName) {
    return new Promise((resolve, reject) => {
      if (!this.db) return resolve([]);
      try {
        const tx = this.db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      } catch (err) {
        resolve([]);
      }
    });
  }

  putInStore(storeName, item) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        this.saveLocalStorageFallback();
        return resolve(item);
      }
      try {
        const tx = this.db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.put(item);
        req.onsuccess = () => resolve(item);
        req.onerror = () => reject(req.error);
      } catch (err) {
        this.saveLocalStorageFallback();
        resolve(item);
      }
    });
  }

  deleteFromStore(storeName, key) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        this.saveLocalStorageFallback();
        return resolve();
      }
      try {
        const tx = this.db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.delete(key);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      } catch (err) {
        resolve();
      }
    });
  }

  initDefaultReviews() {
    const defaultData = {
      'malshree-dhun-timeless': [
        { id: 'rev-m1', songId: 'malshree-dhun-timeless', userName: 'Aayush Sharma', avatar: '🌸', rating: 5, comment: 'रेडियो नेपालमा यो धुन बज्नासाथ दशैंको रौनकता मनभरि छाउँछ। जय माँ दुर्गा!', helpfulVotes: 24, timestamp: '२०८१ असोज १५' },
        { id: 'rev-m2', songId: 'malshree-dhun-timeless', userName: 'Sunita Gurung', avatar: '🪔', rating: 5, comment: 'Listening from Sydney. Brings pure tears of joy and memories of Pokhara home!', helpfulVotes: 18, timestamp: '२०८१ असोज १८' }
      ],
      'sugam-dashain-aayo': [
        { id: 'rev-s1', songId: 'sugam-dashain-aayo', userName: 'Bibek Thapa', avatar: '🪁', rating: 5, comment: 'No Dashain is complete without Sugam Pokhrel voice echoing through every speaker!', helpfulVotes: 45, timestamp: '२०८२ असोज १०' },
        { id: 'rev-s2', songId: 'sugam-dashain-aayo', userName: 'Prashna Shrestha', avatar: '🌾', rating: 5, comment: 'दशैंको लिङ्गे पिङ र चङ्गा चेटको सम्झना दिलाउने नम्बर १ गीत!', helpfulVotes: 32, timestamp: '२०८२ असोज १२' }
      ],
      'narayan-gopal-bada-dashain': [
        { id: 'rev-n1', songId: 'narayan-gopal-bada-dashain', userName: 'Ganesh KC', avatar: '🏮', rating: 5, comment: 'स्वर्गिय स्वर सम्राटको यो कालजयी आवाज सुन्दा परदेशमा रहेका सबै नेपालीको आँखा रसाउँछ।', helpfulVotes: 38, timestamp: '२०८० असोज २२' }
      ]
    };

    Object.keys(defaultData).forEach(songId => {
      if (!this.state.reviews[songId] || this.state.reviews[songId].length === 0) {
        this.state.reviews[songId] = defaultData[songId];
        defaultData[songId].forEach(rev => this.putInStore('reviews', rev));
      }
    });

    this.updateComputedRatings();
  }

  updateComputedRatings() {
    this.state.songs.forEach(song => {
      const songReviews = this.state.reviews[song.id] || [];
      if (songReviews.length > 0) {
        const total = songReviews.reduce((sum, r) => sum + r.rating, 0);
        song.rating = parseFloat((total / songReviews.length).toFixed(2));
        song.reviewsCount = songReviews.length;
      }
    });
  }

  // --- Actions ---

  toggleFavorite(songId) {
    if (this.state.favorites.has(songId)) {
      this.state.favorites.delete(songId);
      this.deleteFromStore('favorites', songId);
    } else {
      this.state.favorites.add(songId);
      this.putInStore('favorites', { songId, addedAt: new Date().toISOString() });
    }
    this.emit('favoritesChanged', Array.from(this.state.favorites));
    return this.state.favorites.has(songId);
  }

  isFavorite(songId) {
    return this.state.favorites.has(songId);
  }

  async addReview(songId, { userName, avatar, rating, comment, memoryTag }) {
    if (!isValidRating(rating)) throw new Error('Invalid rating (must be 1-5)');
    const cleanComment = sanitizeText(comment, 600);
    const cleanUser = sanitizeText(userName, 50) || this.state.user.name;

    const newRev = {
      id: `rev_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      songId,
      userName: cleanUser,
      avatar: avatar || '🪔',
      rating: Number(rating),
      comment: cleanComment,
      memoryTag: sanitizeText(memoryTag, 40),
      helpfulVotes: 0,
      timestamp: new Date().toLocaleDateString('ne-NP', { year: 'numeric', month: 'short', day: 'numeric' }) || 'Just now'
    };

    if (!this.state.reviews[songId]) {
      this.state.reviews[songId] = [];
    }
    this.state.reviews[songId].unshift(newRev);
    await this.putInStore('reviews', newRev);
    this.updateComputedRatings();
    this.emit('reviewAdded', { songId, review: newRev, song: this.getSongById(songId) });
    return newRev;
  }

  async upvoteReview(songId, reviewId) {
    const songReviews = this.state.reviews[songId] || [];
    const rev = songReviews.find(r => r.id === reviewId);
    if (rev) {
      rev.helpfulVotes = (rev.helpfulVotes || 0) + 1;
      await this.putInStore('reviews', rev);
      this.emit('reviewUpdated', { songId, review: rev });
    }
  }

  getSongById(id) {
    return this.state.songs.find(s => s.id === id);
  }

  async saveCustomCard(cardData) {
    const card = {
      id: cardData.id || `card_${Date.now()}`,
      title: sanitizeText(cardData.title, 100),
      recipient: sanitizeText(cardData.recipient, 60),
      sender: sanitizeText(cardData.sender, 60),
      message: sanitizeText(cardData.message, 500),
      templateId: cardData.templateId || 'rato-tika',
      songId: cardData.songId || 'malshree-dhun-timeless',
      stickers: cardData.stickers || [],
      imageDataUrl: cardData.imageDataUrl || '',
      createdAt: new Date().toISOString()
    };

    const existingIndex = this.state.customCards.findIndex(c => c.id === card.id);
    if (existingIndex >= 0) {
      this.state.customCards[existingIndex] = card;
    } else {
      this.state.customCards.unshift(card);
    }

    await this.putInStore('cards', card);
    this.emit('cardSaved', card);
    return card;
  }

  async deleteCard(cardId) {
    this.state.customCards = this.state.customCards.filter(c => c.id !== cardId);
    await this.deleteFromStore('cards', cardId);
    this.emit('cardDeleted', cardId);
  }

  setTheme(theme) {
    this.state.theme = theme;
    if (typeof localStorage !== 'undefined') localStorage.setItem('dashain_theme', theme);
    if (typeof document !== 'undefined') document.documentElement.setAttribute('data-theme', theme);
    this.emit('themeChanged', theme);
  }

  updateUserProfile(name, avatar) {
    this.state.user.name = sanitizeText(name, 50);
    this.state.user.avatar = avatar;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('dashain_user_name', this.state.user.name);
      localStorage.setItem('dashain_user_avatar', avatar);
    }
    this.emit('userUpdated', this.state.user);
  }

  // Event Emitter
  on(event, callback) {
    if (!this.listeners.has(event)) this.listeners.set(event, []);
    this.listeners.get(event).push(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    const arr = this.listeners.get(event);
    if (arr) {
      this.listeners.set(event, arr.filter(cb => cb !== callback));
    }
  }

  emit(event, data) {
    const arr = this.listeners.get(event);
    if (arr) {
      arr.forEach(cb => {
        try { cb(data); } catch (e) { console.error(e); }
      });
    }
  }

  // Fallback LocalStorage
  loadLocalStorageFallback() {
    if (typeof localStorage === 'undefined') return;
    try {
      const favs = JSON.parse(localStorage.getItem('dashain_favs') || '[]');
      favs.forEach(f => this.state.favorites.add(f));

      const revs = JSON.parse(localStorage.getItem('dashain_reviews') || '{}');
      this.state.reviews = revs;

      const cards = JSON.parse(localStorage.getItem('dashain_cards') || '[]');
      this.state.customCards = cards;
    } catch (e) {
      console.error(e);
    }
  }

  saveLocalStorageFallback() {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem('dashain_favs', JSON.stringify(Array.from(this.state.favorites)));
      localStorage.setItem('dashain_reviews', JSON.stringify(this.state.reviews));
      localStorage.setItem('dashain_cards', JSON.stringify(this.state.customCards));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }

  exportBackup() {
    const data = {
      favorites: Array.from(this.state.favorites),
      reviews: this.state.reviews,
      cards: this.state.customCards,
      user: this.state.user,
      version: 1,
      exportedAt: new Date().toISOString()
    };
    return JSON.stringify(data, null, 2);
  }

  async importBackup(jsonStr) {
    try {
      const data = JSON.parse(jsonStr);
      if (Array.isArray(data.favorites)) {
        this.state.favorites = new Set(data.favorites);
      }
      if (data.reviews) {
        this.state.reviews = data.reviews;
      }
      if (Array.isArray(data.cards)) {
        this.state.customCards = data.cards;
      }
      if (data.user) {
        this.updateUserProfile(data.user.name, data.user.avatar);
      }
      this.saveLocalStorageFallback();
      this.updateComputedRatings();
      this.emit('backupRestored', this.state);
      return true;
    } catch (err) {
      console.error('Import error:', err);
      return false;
    }
  }
}

export const store = new Store();
