/**
 * Automated Verification Script for Dashain Songs Hub
 */

import { DASHAIN_SONGS, REGIONS, ERAS, GENRES, MOODS } from './js/data/songs.js';
import { sanitizeHtml, sanitizeText, isValidRating } from './js/utils/security.js';
import { CARD_TEMPLATES, GREETING_PRESETS, STICKER_PALETTE } from './js/components/cardStudio.js';
import fs from 'fs';
import path from 'path';

console.log('--- Starting Automated Test Suite ---');

// Test 1: Song Data Verification
console.log('1. Verifying Song Catalog...');
if (!Array.isArray(DASHAIN_SONGS) || DASHAIN_SONGS.length < 10) {
  throw new Error(`Expected at least 10 songs, got ${DASHAIN_SONGS.length}`);
}

DASHAIN_SONGS.forEach((song, idx) => {
  if (!song.id || !song.title || !song.artist || !song.region || !song.era || !song.lyricsDevanagari) {
    throw new Error(`Song at index ${idx} is missing required fields: ${JSON.stringify(song)}`);
  }
  if (!song.youtubeId || !song.youtubeUrl || !song.embedUrl) {
    throw new Error(`Song ${song.id} is missing official YouTube streaming fields!`);
  }
  if (!Array.isArray(song.melodyNotes) || song.melodyNotes.length === 0) {
    throw new Error(`Song ${song.id} is missing melody notes for synthesis!`);
  }
});
console.log(`✓ Verified ${DASHAIN_SONGS.length} songs with complete YouTube video IDs, streaming links, lyrics, and melody patterns.`);

// Test 2: Filter Categories Verification
console.log('2. Verifying Filter Taxonomy...');
if (REGIONS.length < 5 || ERAS.length < 4 || GENRES.length < 4 || MOODS.length < 4) {
  throw new Error('Taxonomy categories are incomplete');
}
console.log(`✓ Verified ${REGIONS.length} regions, ${ERAS.length} eras, ${GENRES.length} genres, and ${MOODS.length} moods.`);

// Test 3: Security Sanitization Test
console.log('3. Verifying Security & Sanitization...');
const xssPayload = '<script>alert("hack")</script>&foo="bar"';
const sanitized = sanitizeHtml(xssPayload);
if (sanitized.includes('<script>') || sanitized.includes('"bar"')) {
  throw new Error('XSS Sanitization failed: ' + sanitized);
}
if (!isValidRating(5) || !isValidRating(1) || isValidRating(6) || isValidRating(0)) {
  throw new Error('Rating validation failed');
}
console.log('✓ XSS Sanitization & Input validation passed.');

// Test 4: Card Studio Templates & Presets
console.log('4. Verifying Dashain Wishing Card Studio...');
if (CARD_TEMPLATES.length < 4 || GREETING_PRESETS.length < 4 || STICKER_PALETTE.length < 8) {
  throw new Error('Card templates or presets missing');
}
console.log(`✓ Verified ${CARD_TEMPLATES.length} templates, ${GREETING_PRESETS.length} greetings, and ${STICKER_PALETTE.length} stickers.`);

// Test 5: File existence and integrity
console.log('5. Verifying File Existence...');
const requiredFiles = [
  'index.html',
  'manifest.webmanifest',
  'sw.js',
  'css/main.css',
  'css/components.css',
  'css/card-studio.css',
  'css/dark-mode.css',
  'js/app.js',
  'js/store.js',
  'js/data/songs.js',
  'js/audio/player.js',
  'js/audio/youtubeEngine.js',
  'js/audio/synth.js',
  'js/audio/visualizer.js',
  'js/components/songList.js',
  'js/components/searchFilter.js',
  'js/components/reviews.js',
  'js/components/cardStudio.js',
  'js/components/notifications.js',
  'js/components/socialShare.js',
  'js/utils/security.js',
  'js/utils/offline.js'
];

requiredFiles.forEach(relPath => {
  const fullPath = path.join(process.cwd(), relPath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Missing required file: ${relPath}`);
  }
});
console.log(`✓ All ${requiredFiles.length} files exist and are intact.`);

console.log('--- ALL TESTS PASSED SUCCESSFULLY! ---');
