/**
 * Audio Spectrum & Festive Waveform Visualizer
 * Renders pulsating festive waveforms and golden sparkles synced with Web Audio Analyser.
 */

import { synthEngine } from './synth.js';

export class AudioVisualizer {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = canvasElement ? canvasElement.getContext('2d') : null;
    this.animationId = null;
    this.particles = [];
    this.initParticles();
  }

  setCanvas(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = canvasElement ? canvasElement.getContext('2d') : null;
  }

  initParticles() {
    this.particles = [];
    for (let i = 0; i < 25; i++) {
      this.particles.push({
        x: Math.random() * 300,
        y: Math.random() * 80,
        radius: Math.random() * 2.5 + 1,
        vx: (Math.random() - 0.5) * 0.8,
        vy: -Math.random() * 1.2 - 0.3,
        color: ['#f59e0b', '#ef4444', '#10b981', '#fbbf24', '#f43f5e'][Math.floor(Math.random() * 5)],
        alpha: Math.random() * 0.8 + 0.2
      });
    }
  }

  start() {
    if (!this.canvas || !this.ctx) return;
    this.stop();
    this.render();
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  render() {
    if (!this.canvas || !this.ctx) return;

    const width = this.canvas.width;
    const height = this.canvas.height;
    this.ctx.clearRect(0, 0, width, height);

    const analyser = synthEngine.analyser;
    const isPlaying = synthEngine.isPlaying;

    if (analyser && isPlaying) {
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(dataArray);

      const barCount = 32;
      const barWidth = (width / barCount) - 2;

      // Draw frequency spectrum bars
      for (let i = 0; i < barCount; i++) {
        const index = Math.floor((i / barCount) * (bufferLength / 2));
        const val = dataArray[index] || (Math.sin(Date.now() / 200 + i) * 20 + 20);
        const barHeight = Math.max(4, (val / 255) * (height - 8));

        const x = i * (barWidth + 2);
        const y = height - barHeight;

        // Gradient for Dashain festive colors (Marigold Yellow -> Auspicious Crimson)
        const grad = this.ctx.createLinearGradient(0, y, 0, height);
        grad.addColorStop(0, '#fbbf24');
        grad.addColorStop(0.5, '#f59e0b');
        grad.addColorStop(1, '#dc2626');

        this.ctx.fillStyle = grad;
        this.ctx.beginPath();
        if (this.ctx.roundRect) {
          this.ctx.roundRect(x, y, barWidth, barHeight, [3, 3, 0, 0]);
        } else {
          this.ctx.rect(x, y, barWidth, barHeight);
        }
        this.ctx.fill();
      }

      // Draw floating festive sparks / marigold petals
      this.particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < 0) {
          p.y = height;
          p.x = Math.random() * width;
        }
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;

        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = p.color;
        this.ctx.globalAlpha = p.alpha;
        this.ctx.fill();
        this.ctx.globalAlpha = 1.0;
      });
    } else {
      // Idle wave
      this.ctx.beginPath();
      this.ctx.moveTo(0, height / 2);
      for (let x = 0; x < width; x += 5) {
        const y = height / 2 + Math.sin((x + Date.now() / 40) / 20) * 4;
        this.ctx.lineTo(x, y);
      }
      this.ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    }

    this.animationId = requestAnimationFrame(() => this.render());
  }
}
