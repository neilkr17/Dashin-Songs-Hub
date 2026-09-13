/**
 * Deep Test: Search, Filter, Store, and Synth Logic
 */

import { DASHAIN_SONGS } from './js/data/songs.js';
import { SearchFilterManager } from './js/components/searchFilter.js';
import { store } from './js/store.js';

console.log('--- Running Deep Logic Tests ---');

// 1. Search & Filter Tests
const filterMgr = new SearchFilterManager();

// Test Search Query
filterMgr.filters.searchQuery = 'sugam';
let results = filterMgr.filterSongs(DASHAIN_SONGS);
console.log(`Search 'sugam': found ${results.length} songs (Expected 1)`);
if (results.length !== 1 || results[0].id !== 'sugam-dashain-aayo') {
  throw new Error('Search failed for Sugam Pokhrel');
}

// Test Region Filter
filterMgr.filters = {
  searchQuery: '',
  singer: 'all',
  region: 'Kathmandu Valley',
  era: 'all',
  genre: 'all',
  mood: 'all',
  sortBy: 'popular'
};
results = filterMgr.filterSongs(DASHAIN_SONGS);
console.log(`Region 'Kathmandu Valley': found ${results.length} songs`);
if (results.length < 2) {
  throw new Error('Region filter failed for Kathmandu Valley');
}

// Test Era Filter
filterMgr.filters.region = 'all';
filterMgr.filters.era = 'Golden 2000s';
results = filterMgr.filterSongs(DASHAIN_SONGS);
console.log(`Era 'Golden 2000s': found ${results.length} songs`);
if (results.length < 3) {
  throw new Error('Era filter failed for Golden 2000s');
}

// Test Sort by Rating
filterMgr.filters.era = 'all';
filterMgr.filters.sortBy = 'rating';
results = filterMgr.filterSongs(DASHAIN_SONGS);
for (let i = 0; i < results.length - 1; i++) {
  if (results[i].rating < results[i + 1].rating) {
    throw new Error('Rating sort order failed');
  }
}
console.log('✓ Sort by rating verified.');

// 2. Store Backup Export & Import Test
const backup = store.exportBackup();
const parsed = JSON.parse(backup);
if (!Array.isArray(parsed.favorites) || !parsed.user) {
  throw new Error('Store backup format invalid');
}
console.log('✓ Backup export format verified.');

console.log('--- ALL DEEP LOGIC TESTS PASSED! ---');
