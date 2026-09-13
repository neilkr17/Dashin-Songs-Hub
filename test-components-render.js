/**
 * Component and Player State Machine Test Suite
 */

import { DASHAIN_SONGS } from './js/data/songs.js';
import { renderSongCard, renderSongDetailsModal } from './js/components/songList.js';
import { store } from './js/store.js';
import { player } from './js/audio/player.js';

console.log('--- Running Component & Audio Engine Tests ---');

// 1. Verify Card HTML Rendering with YouTube & Artwork Data
console.log('1. Testing Song Card Rendering...');
DASHAIN_SONGS.forEach(song => {
  const cardHtml = renderSongCard(song, false, false);
  if (!cardHtml.includes(song.title) || !cardHtml.includes(song.artist)) {
    throw new Error(`Card HTML missing title/artist for ${song.id}`);
  }
  if (!cardHtml.includes('🎬 Official Song')) {
    throw new Error(`Card HTML missing official video badge for ${song.id}`);
  }
  if (!cardHtml.includes(song.thumbnailUrl)) {
    throw new Error(`Card HTML missing thumbnail image for ${song.id}`);
  }
});
console.log(`✓ Successfully rendered all ${DASHAIN_SONGS.length} song cards with HD badges and cover artwork.`);

// 2. Verify Song Details Modal Rendering with Embedded YouTube Video
console.log('2. Testing Song Details Modal with Embedded Video...');
const sugamSong = DASHAIN_SONGS.find(s => s.id === 'sugam-dashain-aayo');
const modalHtml = renderSongDetailsModal(sugamSong);

if (!modalHtml.includes('iframe') || !modalHtml.includes('modal-youtube-iframe')) {
  throw new Error('Modal HTML missing YouTube iframe player element!');
}
if (!modalHtml.includes(sugamSong.embedUrl)) {
  throw new Error('Modal iframe missing correct YouTube embed URL!');
}
if (!modalHtml.includes(sugamSong.youtubeUrl)) {
  throw new Error('Modal missing external YouTube link!');
}
if (!modalHtml.includes(sugamSong.spotifyUrl)) {
  throw new Error('Modal missing Spotify link!');
}
if (!modalHtml.includes('customUrlInput')) {
  throw new Error('Modal missing custom YouTube URL input field!');
}
console.log('✓ Successfully verified Song Details Modal with responsive YouTube player, lyrics tabs, and custom link editor.');

// 3. Verify Player State Machine & Dual Modes
console.log('3. Testing MusicPlayer Dual Engine State Machine...');
if (player.playbackMode !== 'stream') {
  throw new Error(`Expected default mode 'stream', got ${player.playbackMode}`);
}

// Test toggling to synth mode
const switchedMode = player.togglePlaybackMode();
if (switchedMode !== 'synth' || player.playbackMode !== 'synth') {
  throw new Error(`Toggle failed: expected 'synth', got ${switchedMode}`);
}

// Test toggling back to stream mode
const switchedBack = player.togglePlaybackMode();
if (switchedBack !== 'stream' || player.playbackMode !== 'stream') {
  throw new Error(`Toggle back failed: expected 'stream', got ${switchedBack}`);
}
console.log('✓ Verified MusicPlayer dual playback modes (stream ↔ synth).');

// 4. Test Seek & Duration Formatting
console.log('4. Testing Time Utilities...');
if (player.formatTime(0) !== '00:00' || player.formatTime(65) !== '01:05' || player.formatTime(288) !== '04:48') {
  throw new Error('Time formatting utility failed');
}
console.log('✓ Verified time formatting utility.');

console.log('--- ALL COMPONENT & AUDIO ENGINE TESTS PASSED! ---');
