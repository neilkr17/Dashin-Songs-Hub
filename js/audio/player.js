/**
 * In-Browser Universal Music Player Controller
 * Coordinates Real YouTube Stream / Audio Engine and Offline Web Audio Synthesizer,
 * playlists, queue, synchronized lyrics, visualizer, and player dock UI.
 */

import { youtubeEngine } from './youtubeEngine.js';
import { synthEngine } from './synth.js';
import { AudioVisualizer } from './visualizer.js';
import { store } from '../store.js';

export class MusicPlayer {
  constructor() {
    this.currentSong = null;
    this.isPlaying = false;
    this.playbackMode = 'stream'; // 'stream' (Real Official Song / YouTube) | 'synth' (Offline Flute Synth)
    this.queue = [];
    this.queueIndex = -1;
    this.repeatMode = 'all'; // 'off' | 'all' | 'one'
    this.isShuffle = false;
    this.volume = 0.8;
    this.currentTimeSec = 0;
    this.durationSec = 240;
    this.progressInterval = null;
    this.visualizer = null;
    this.listeners = new Map();
  }

  init(visualizerCanvas) {
    this.visualizer = new AudioVisualizer(visualizerCanvas);
    this.queue = [...store.state.songs];
    this.queueIndex = 0;
    this.currentSong = this.queue[0];

    // Store updates
    store.on('ready', () => {
      this.queue = [...store.state.songs];
      if (!this.currentSong && this.queue.length > 0) {
        this.currentSong = this.queue[0];
      }
    });

    // YouTube Engine event listeners
    youtubeEngine.on('timeUpdate', ({ currentTime, duration, percent }) => {
      if (this.playbackMode === 'stream' && this.isPlaying) {
        this.currentTimeSec = currentTime;
        if (duration > 0) this.durationSec = duration;
        this.emit('timeUpdate', {
          currentTime: this.currentTimeSec,
          duration: this.durationSec,
          percent: (this.currentTimeSec / this.durationSec) * 100
        });
      }
    });

    youtubeEngine.on('stateChange', ({ isPlaying, duration }) => {
      if (this.playbackMode === 'stream') {
        this.isPlaying = isPlaying;
        if (duration > 0) this.durationSec = duration;
        if (isPlaying && this.visualizer) {
          this.visualizer.start();
        } else if (!isPlaying && this.visualizer) {
          this.visualizer.stop();
        }
        this.emit('stateChange', {
          isPlaying: this.isPlaying,
          song: this.currentSong,
          currentTime: this.currentTimeSec,
          duration: this.durationSec,
          mode: this.playbackMode
        });
      }
    });

    youtubeEngine.on('ended', () => {
      if (this.playbackMode === 'stream') {
        if (this.repeatMode === 'one') {
          this.seek(0);
          this.resume();
        } else if (this.repeatMode === 'all' || this.queueIndex < this.queue.length - 1) {
          this.next();
        } else {
          this.pause();
        }
      }
    });

    youtubeEngine.on('error', () => {
      console.warn('Stream notice: Falling back to synth audio if offline.');
    });
  }

  setPlaybackMode(mode) {
    if (this.playbackMode === mode) return;
    const wasPlaying = this.isPlaying;
    this.pause();
    this.playbackMode = mode;
    this.emit('modeChange', this.playbackMode);

    if (wasPlaying && this.currentSong) {
      this.playSong(this.currentSong);
    }
  }

  togglePlaybackMode() {
    const nextMode = this.playbackMode === 'stream' ? 'synth' : 'stream';
    this.setPlaybackMode(nextMode);
    return nextMode;
  }

  playSong(song) {
    if (!song) return;
    this.currentSong = song;
    this.queueIndex = this.queue.findIndex(s => s.id === song.id);
    if (this.queueIndex === -1) {
      this.queue.push(song);
      this.queueIndex = this.queue.length - 1;
    }

    this.isPlaying = true;
    this.currentTimeSec = 0;

    // Parse duration string "04:15"
    const parts = (song.duration || '04:00').split(':');
    this.durationSec = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);

    if (this.playbackMode === 'stream') {
      // 1. Play exact official song via YouTube Engine
      synthEngine.stop();
      youtubeEngine.playSong(song);
    } else {
      // 2. Play via traditional Web Audio Synthesizer
      youtubeEngine.pause();
      synthEngine.playSong(song, (progress) => {
        this.emit('synthProgress', progress);
      });
      this.startProgressTicker();
    }

    if (this.visualizer) {
      this.visualizer.start();
    }

    this.emit('stateChange', {
      isPlaying: this.isPlaying,
      song: this.currentSong,
      currentTime: this.currentTimeSec,
      duration: this.durationSec,
      mode: this.playbackMode
    });
  }

  togglePlayPause() {
    if (!this.currentSong && this.queue.length > 0) {
      this.playSong(this.queue[0]);
      return;
    }

    if (this.isPlaying) {
      this.pause();
    } else {
      this.resume();
    }
  }

  pause() {
    this.isPlaying = false;
    if (this.playbackMode === 'stream') {
      youtubeEngine.pause();
    } else {
      synthEngine.pause();
      this.stopProgressTicker();
    }

    if (this.visualizer) {
      this.visualizer.stop();
    }

    this.emit('stateChange', {
      isPlaying: this.isPlaying,
      song: this.currentSong,
      currentTime: this.currentTimeSec,
      duration: this.durationSec,
      mode: this.playbackMode
    });
  }

  resume() {
    if (!this.currentSong) return;
    this.isPlaying = true;

    if (this.playbackMode === 'stream') {
      synthEngine.stop();
      youtubeEngine.play();
    } else {
      youtubeEngine.pause();
      synthEngine.resume((progress) => {
        this.emit('synthProgress', progress);
      });
      this.startProgressTicker();
    }

    if (this.visualizer) {
      this.visualizer.start();
    }

    this.emit('stateChange', {
      isPlaying: this.isPlaying,
      song: this.currentSong,
      currentTime: this.currentTimeSec,
      duration: this.durationSec,
      mode: this.playbackMode
    });
  }

  next() {
    if (this.queue.length === 0) return;

    if (this.isShuffle) {
      this.queueIndex = Math.floor(Math.random() * this.queue.length);
    } else {
      this.queueIndex = (this.queueIndex + 1) % this.queue.length;
    }

    this.playSong(this.queue[this.queueIndex]);
  }

  prev() {
    if (this.queue.length === 0) return;

    if (this.currentTimeSec > 5) {
      this.seek(0);
      return;
    }

    this.queueIndex = (this.queueIndex - 1 + this.queue.length) % this.queue.length;
    this.playSong(this.queue[this.queueIndex]);
  }

  seek(seconds) {
    this.currentTimeSec = Math.max(0, Math.min(this.durationSec, seconds));

    if (this.playbackMode === 'stream') {
      youtubeEngine.seekTo(this.currentTimeSec);
    }

    this.emit('timeUpdate', {
      currentTime: this.currentTimeSec,
      duration: this.durationSec,
      percent: (this.currentTimeSec / this.durationSec) * 100
    });
  }

  seekBy(deltaSeconds) {
    this.seek(this.currentTimeSec + deltaSeconds);
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    youtubeEngine.setVolume(this.volume);
    synthEngine.setVolume(this.volume);
    this.emit('volumeChange', this.volume);
  }

  toggleMute() {
    if (this.volume > 0) {
      this.prevVolume = this.volume;
      this.setVolume(0);
    } else {
      this.setVolume(this.prevVolume || 0.8);
    }
  }

  toggleRepeat() {
    const modes = ['off', 'all', 'one'];
    const idx = modes.indexOf(this.repeatMode);
    this.repeatMode = modes[(idx + 1) % modes.length];
    this.emit('repeatChange', this.repeatMode);
    return this.repeatMode;
  }

  toggleShuffle() {
    this.isShuffle = !this.isShuffle;
    this.emit('shuffleChange', this.isShuffle);
    return this.isShuffle;
  }

  startProgressTicker() {
    this.stopProgressTicker();
    this.progressInterval = setInterval(() => {
      if (this.isPlaying && this.playbackMode === 'synth') {
        this.currentTimeSec += 1;
        if (this.currentTimeSec >= this.durationSec) {
          if (this.repeatMode === 'one') {
            this.seek(0);
          } else if (this.repeatMode === 'all' || this.queueIndex < this.queue.length - 1) {
            this.next();
          } else {
            this.pause();
          }
        } else {
          this.emit('timeUpdate', {
            currentTime: this.currentTimeSec,
            duration: this.durationSec,
            percent: (this.currentTimeSec / this.durationSec) * 100
          });
        }
      }
    }, 1000);
  }

  stopProgressTicker() {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }

  formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  on(event, cb) {
    if (!this.listeners.has(event)) this.listeners.set(event, []);
    this.listeners.get(event).push(cb);
    return () => {
      const arr = this.listeners.get(event);
      if (arr) this.listeners.set(event, arr.filter(c => c !== cb));
    };
  }

  emit(event, data) {
    const arr = this.listeners.get(event);
    if (arr) arr.forEach(cb => cb(data));
  }
}

export const player = new MusicPlayer();
