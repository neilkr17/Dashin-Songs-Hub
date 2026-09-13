/**
 * Traditional Nepali Festive Audio Synthesizer (Web Audio API)
 * Synthesizes authentic Bansuri (Bamboo Flute), Sarangi, and Malshree chimes
 * enabling 100% offline, smooth and continuous music streaming.
 */

const NOTE_FREQS = {
  'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'F3': 174.61, 'G3': 196.00, 'A3': 220.00, 'B3': 246.94,
  'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63, 'F4': 349.23, 'F#4': 369.99,
  'G4': 392.00, 'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
  'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'E5': 659.25, 'F5': 698.46, 'F#5': 739.99,
  'G5': 783.99, 'G#5': 830.61, 'A5': 880.00, 'A#5': 932.33, 'B5': 987.77,
  'C6': 1046.50
};

export class NepaliAudioSynth {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.analyser = null;
    this.isPlaying = false;
    this.currentLoopTimeout = null;
    this.currentStep = 0;
    this.activeNodes = [];
    this.currentSong = null;
  }

  ensureContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.7;

      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 256;

      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playSong(song, onProgress) {
    this.ensureContext();
    this.stop();
    this.isPlaying = true;
    this.currentSong = song;
    this.currentStep = 0;

    const notes = song.melodyNotes || [
      { note: 'G4', dur: 0.5 }, { note: 'C5', dur: 0.8 }, { note: 'D5', dur: 0.5 },
      { note: 'E5', dur: 0.8 }, { note: 'G5', dur: 0.6 }, { note: 'C5', dur: 1.0 }
    ];

    const tempoFactor = 60 / (song.tempo || 90);

    const playLoop = () => {
      if (!this.isPlaying) return;

      const currentItem = notes[this.currentStep % notes.length];
      const freq = NOTE_FREQS[currentItem.note] || 440;
      const duration = currentItem.dur * tempoFactor;

      // Play melody voice (Bansuri / Sarangi tone)
      this.playFluteNote(freq, duration, song.scaleType || 'bilawal');

      // Play soft festive Madal / Bell rhythm on beats
      if (this.currentStep % 2 === 0) {
        this.playFestivalChime(freq * 2, duration * 0.3);
      }
      if (this.currentStep % 4 === 0) {
        this.playMadalBass(duration * 0.6);
      }

      if (onProgress) {
        onProgress({
          step: this.currentStep,
          totalSteps: notes.length,
          note: currentItem.note,
          percent: ((this.currentStep % notes.length) / notes.length) * 100
        });
      }

      this.currentStep++;
      this.currentLoopTimeout = setTimeout(playLoop, duration * 1000);
    };

    playLoop();
  }

  playFluteNote(freq, duration, style) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const subOsc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    // Bansuri flute / Sarangi waveform blend
    osc.type = style === 'dancePop' ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(freq, now);

    // Subtle pitch vibrato for traditional Nepali expression
    const vibrato = this.ctx.createOscillator();
    const vibratoGain = this.ctx.createGain();
    vibrato.frequency.setValueAtTime(5.5, now); // 5.5 Hz Indian/Nepali classical vibrato
    vibratoGain.gain.setValueAtTime(freq * 0.015, now);
    vibrato.connect(osc.frequency);
    vibrato.start(now);
    vibrato.stop(now + duration);

    // Warm harmonics
    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(freq * 2, now);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(freq * 3.5, now);
    filter.Q.setValueAtTime(2.0, now);

    // Envelope (soft flute attack & gentle decay)
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.28, now + Math.min(0.08, duration * 0.2));
    gain.gain.exponentialRampToValueAtTime(0.18, now + duration * 0.7);
    gain.gain.linearRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    subOsc.connect(gain);
    gain.connect(filter);
    filter.connect(this.masterGain);

    osc.start(now);
    subOsc.start(now);
    osc.stop(now + duration);
    subOsc.stop(now + duration);

    this.activeNodes.push(osc, subOsc, gain, vibrato, vibratoGain);
  }

  playFestivalChime(freq, duration) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + duration);
  }

  playMadalBass(duration) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + duration);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + duration);
  }

  setVolume(val) {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, val));
    }
  }

  stop() {
    this.isPlaying = false;
    if (this.currentLoopTimeout) {
      clearTimeout(this.currentLoopTimeout);
      this.currentLoopTimeout = null;
    }
    this.activeNodes.forEach(node => {
      try {
        if (node.stop) node.stop();
        if (node.disconnect) node.disconnect();
      } catch (e) { }
    });
    this.activeNodes = [];
  }

  pause() {
    this.stop();
  }

  resume(onProgress) {
    if (this.currentSong) {
      this.playSong(this.currentSong, onProgress);
    }
  }
}

export const synthEngine = new NepaliAudioSynth();
