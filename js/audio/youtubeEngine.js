/**
 * YouTube Audio/Video Streaming Engine (YouTube IFrame Player API Wrapper)
 * Powers authentic, exact song streaming directly inside the Dashain Songs Hub.
 */

export class YouTubeAudioEngine {
  constructor() {
    this.player = null;
    this.isReady = false;
    this.isPlaying = false;
    this.currentSong = null;
    this.containerId = 'ytPlayerHost';
    this.progressInterval = null;
    this.listeners = new Map();
    this.volume = 0.8;
    this.pendingSong = null;
    this.initApi();
  }

  initApi() {
    if (typeof window === 'undefined') return;

    // Check if script already injected
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        this.initPlayerInstance();
      };
    } else if (window.YT && window.YT.Player) {
      this.initPlayerInstance();
    }
  }

  initPlayerInstance() {
    const container = document.getElementById(this.containerId);
    if (!container) {
      setTimeout(() => this.initPlayerInstance(), 200);
      return;
    }

    try {
      this.player = new window.YT.Player(this.containerId, {
        height: '100%',
        width: '100%',
        videoId: 'jT21kIqy1oA',
        playerVars: {
          autoplay: 0,
          controls: 0,
          rel: 0,
          playsinline: 1,
          enablejsapi: 1,
          origin: window.location.origin || window.location.href,
          iv_load_policy: 3,
          modestbranding: 1
        },
        events: {
          onReady: (e) => this.onPlayerReady(e),
          onStateChange: (e) => this.onPlayerStateChange(e),
          onError: (e) => this.onPlayerError(e)
        }
      });
    } catch (err) {
      console.warn('YouTube Player initialization warning:', err);
    }
  }

  onPlayerReady(event) {
    this.isReady = true;
    this.setVolume(this.volume);
    this.emit('ready', { isReady: true });

    if (this.pendingSong) {
      const song = this.pendingSong;
      this.pendingSong = null;
      this.playSong(song);
    }
  }

  onPlayerStateChange(event) {
    // YT.PlayerState: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (video cued)
    if (event.data === window.YT.PlayerState.PLAYING) {
      this.isPlaying = true;
      this.startProgressTicker();
      this.emit('stateChange', {
        isPlaying: true,
        duration: this.getDuration(),
        currentTime: this.getCurrentTime()
      });
    } else if (event.data === window.YT.PlayerState.PAUSED) {
      this.isPlaying = false;
      this.stopProgressTicker();
      this.emit('stateChange', {
        isPlaying: false,
        duration: this.getDuration(),
        currentTime: this.getCurrentTime()
      });
    } else if (event.data === window.YT.PlayerState.ENDED) {
      this.isPlaying = false;
      this.stopProgressTicker();
      this.emit('ended', { song: this.currentSong });
    } else if (event.data === window.YT.PlayerState.BUFFERING) {
      this.emit('buffering', { isBuffering: true });
    }
  }

  onPlayerError(error) {
    console.warn('YouTube Player playback notice:', error);
    this.emit('error', { error, song: this.currentSong });
  }

  playSong(song) {
    if (!song) return;
    this.currentSong = song;

    if (!this.isReady || !this.player || !this.player.loadVideoById) {
      this.pendingSong = song;
      return;
    }

    const videoId = song.youtubeId || 'jT21kIqy1oA';
    try {
      this.player.loadVideoById({
        videoId: videoId,
        startSeconds: 0
      });
      this.isPlaying = true;
      this.setVolume(this.volume);
      this.startProgressTicker();
    } catch (err) {
      console.warn('Error loading video by ID:', err);
    }
  }

  play() {
    if (this.player && this.player.playVideo && this.isReady) {
      try {
        this.player.playVideo();
        this.isPlaying = true;
        this.startProgressTicker();
      } catch (e) {}
    }
  }

  pause() {
    if (this.player && this.player.pauseVideo && this.isReady) {
      try {
        this.player.pauseVideo();
        this.isPlaying = false;
        this.stopProgressTicker();
      } catch (e) {}
    }
  }

  togglePlayPause() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  seekTo(seconds) {
    if (this.player && this.player.seekTo && this.isReady) {
      try {
        this.player.seekTo(seconds, true);
      } catch (e) {}
    }
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.player && this.player.setVolume && this.isReady) {
      try {
        this.player.setVolume(Math.round(this.volume * 100));
      } catch (e) {}
    }
  }

  getCurrentTime() {
    if (this.player && this.player.getCurrentTime && this.isReady) {
      try {
        return Math.floor(this.player.getCurrentTime() || 0);
      } catch (e) {
        return 0;
      }
    }
    return 0;
  }

  getDuration() {
    if (this.player && this.player.getDuration && this.isReady) {
      try {
        const d = Math.floor(this.player.getDuration() || 0);
        if (d > 0) return d;
      } catch (e) {}
    }
    if (this.currentSong && this.currentSong.duration) {
      const parts = this.currentSong.duration.split(':');
      return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
    }
    return 240;
  }

  startProgressTicker() {
    this.stopProgressTicker();
    this.progressInterval = setInterval(() => {
      if (this.isPlaying && this.player && this.isReady) {
        const cur = this.getCurrentTime();
        const dur = this.getDuration();
        this.emit('timeUpdate', {
          currentTime: cur,
          duration: dur,
          percent: dur > 0 ? (cur / dur) * 100 : 0
        });
      }
    }, 500);
  }

  stopProgressTicker() {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }

  stop() {
    this.pause();
    if (this.player && this.player.stopVideo && this.isReady) {
      try {
        this.player.stopVideo();
      } catch (e) {}
    }
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

export const youtubeEngine = new YouTubeAudioEngine();
