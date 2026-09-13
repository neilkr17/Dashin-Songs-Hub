/**
 * Nepali Dashain Wishing Gift Card Studio ("दशैं शुभकामना कार्ड")
 * High-performance HTML5 Canvas 2D engine for generating authentic, customizable Dashain cards.
 */

import { DASHAIN_SONGS } from '../data/songs.js';
import { store } from '../store.js';
import { sanitizeText } from '../utils/security.js';
import { player } from '../audio/player.js';

export const CARD_TEMPLATES = [
  {
    id: 'rato-tika',
    name: 'रातो टीका र जमरा (Auspicious Tika)',
    bgColors: ['#7f1d1d', '#991b1b', '#450a0a'],
    accentColor: '#fbbf24',
    textColor: '#fef3c7',
    subTextColor: '#fde68a',
    borderPattern: 'goldMandala',
    defaultStickers: [{ type: '🌾', x: 80, y: 110, size: 48 }, { type: '🔴', x: 250, y: 110, size: 52 }, { type: '🪔', x: 420, y: 110, size: 44 }]
  },
  {
    id: 'linge-ping',
    name: 'लिङ्गे पिङ र पहाड (Linge Ping & Hills)',
    bgColors: ['#065f46', '#047857', '#022c22'],
    accentColor: '#fde047',
    textColor: '#f0fdf4',
    subTextColor: '#dcfce7',
    borderPattern: 'bambooFrame',
    defaultStickers: [{ type: '🎋', x: 100, y: 105, size: 54 }, { type: '🏔️', x: 250, y: 105, size: 50 }, { type: '🪁', x: 400, y: 105, size: 48 }]
  },
  {
    id: 'changa-chet',
    name: 'काठमाडौं साँझ र चङ्गा (Kathmandu Sunset Kites)',
    bgColors: ['#312e81', '#4338ca', '#1e1b4b'],
    accentColor: '#38bdf8',
    textColor: '#f8fafc',
    subTextColor: '#bae6fd',
    borderPattern: 'starSky',
    defaultStickers: [{ type: '🪁', x: 90, y: 110, size: 52 }, { type: '🛕', x: 250, y: 110, size: 50 }, { type: '✨', x: 410, y: 110, size: 44 }]
  },
  {
    id: 'malshree-temple',
    name: 'मन्दिर र दियो (Temple & Diyas)',
    bgColors: ['#78350f', '#92400e', '#451a03'],
    accentColor: '#fef08a',
    textColor: '#fffbeb',
    subTextColor: '#fef9c3',
    borderPattern: 'diyaGarland',
    defaultStickers: [{ type: '🪔', x: 80, y: 110, size: 46 }, { type: '🌸', x: 250, y: 110, size: 50 }, { type: '🪔', x: 420, y: 110, size: 46 }]
  }
];

export const GREETING_PRESETS = [
  "विजया दशमी तथा बडा दशैंको पावन अवसरमा हार्दिक मंगलमय शुभकामना!",
  "निधारमा रातो टीका, कानमा पहेँलो जमरा, जीवनमा सदा सुख र समृद्धिको बासना रहोस्!",
  "दशैंको लिङ्गे पिङ जस्तै तपाईंको जीवनले पनि सधैं नयाँ उचाइ चुमिरहोस्!",
  "परदेशबाट मनभरिको माया र विजया दशमीको न्यानो आशीर्वाद पठाएको छु!",
  "सुख, शान्ति, सुस्वास्थ्य अनि उत्तरोत्तर प्रगतिको अनन्त शुभकामना!"
];

export const STICKER_PALETTE = [
  { icon: '🌾', label: 'Jamara' },
  { icon: '🔴', label: 'Rato Tika' },
  { icon: '🪔', label: 'Diya' },
  { icon: '🪁', label: 'Changa' },
  { icon: '🎋', label: 'Linge Ping' },
  { icon: '🌸', label: 'Sayapatri' },
  { icon: '💵', label: 'Dakshina' },
  { icon: '🛕', label: 'Mandir' },
  { icon: '✨', label: 'Shine' },
  { icon: '🏮', label: 'Lantern' }
];

export class DashainCardStudio {
  constructor(container) {
    this.container = container;
    this.cardState = {
      templateId: 'rato-tika',
      recipient: 'आदरणीय आमा-बुवा (Beloved Parents)',
      sender: 'तपाईंको छोरो / सानु (Your Loving Family)',
      title: 'बडा दशैंको मंगलमय शुभकामना',
      message: GREETING_PRESETS[0],
      songId: 'malshree-dhun-timeless',
      stickers: [{ type: '🌾', x: 80, y: 110, size: 48 }, { type: '🔴', x: 250, y: 110, size: 52 }, { type: '🪔', x: 420, y: 110, size: 44 }]
    };
    this.canvas = null;
    this.ctx = null;
  }

  render() {
    this.container.innerHTML = `
      <div class="card-studio-layout">
        <!-- Left: Controls Panel -->
        <div class="card-editor-panel card-surface">
          <div class="panel-header">
            <h3>🎨 दशैं शुभकामना कार्ड बनाउनुहोस्</h3>
            <p class="panel-subtitle">Create & customize traditional Nepali Dashain greeting cards</p>
          </div>

          <!-- Template Switcher -->
          <div class="form-group">
            <label class="control-label">१. थिम छान्नुहोस् (Choose Template):</label>
            <div class="template-chips-grid">
              ${CARD_TEMPLATES.map(t => `
                <button 
                  class="template-card-btn ${this.cardState.templateId === t.id ? 'active' : ''}" 
                  data-tpl="${t.id}"
                  style="background: linear-gradient(135deg, ${t.bgColors[0]}, ${t.bgColors[1]})">
                  <span>${t.name}</span>
                </button>
              `).join('')}
            </div>
          </div>

          <!-- Recipient & Sender -->
          <div class="form-row-compact">
            <div class="form-group flex-1">
              <label for="cardRecipientInput">२. कसलाई (Recipient Name):</label>
              <input type="text" id="cardRecipientInput" class="form-input" value="${this.cardState.recipient}" />
            </div>

            <div class="form-group flex-1">
              <label for="cardSenderInput">३. कसबाट (Sender Name):</label>
              <input type="text" id="cardSenderInput" class="form-input" value="${this.cardState.sender}" />
            </div>
          </div>

          <!-- Message Preset Dropdown & Textarea -->
          <div class="form-group">
            <label for="greetingPresetsSelect">४. शुभकामना सन्देश (Greeting Message):</label>
            <select id="greetingPresetsSelect" class="custom-select mb-2">
              <option value="">-- तयार सन्देश छान्नुहोस् (Select a Preset) --</option>
              ${GREETING_PRESETS.map((p, idx) => `<option value="${p}">${idx + 1}. ${p.slice(0, 45)}...</option>`).join('')}
            </select>
            <textarea id="cardMessageText" class="form-textarea" rows="3">${this.cardState.message}</textarea>
          </div>

          <!-- Stickers Palette -->
          <div class="form-group">
            <label class="control-label">५. दशैं स्टिकर थप्नुहोस् (Add Festival Stickers):</label>
            <div class="stickers-picker">
              ${STICKER_PALETTE.map(stk => `
                <button class="sticker-btn" data-sticker="${stk.icon}" title="${stk.label}">
                  <span class="sticker-icon">${stk.icon}</span>
                  <span class="sticker-name">${stk.label}</span>
                </button>
              `).join('')}
              <button id="clearStickersBtn" class="btn btn-outline btn-xs" title="Clear added stickers">
                🗑️ Clear
              </button>
            </div>
          </div>

          <!-- Song Soundtrack Attachment -->
          <div class="form-group">
            <label for="cardSongSelect">६. दशैंको धुन जोड्नुहोस् (Attach Background Music):</label>
            <select id="cardSongSelect" class="custom-select">
              ${DASHAIN_SONGS.map(s => `<option value="${s.id}" ${this.cardState.songId === s.id ? 'selected' : ''}>🎵 ${s.title} (${s.artist.split(' ')[0]})</option>`).join('')}
            </select>
          </div>
        </div>

        <!-- Right: Live Canvas Preview & Actions -->
        <div class="card-preview-panel card-surface">
          <div class="preview-header">
            <h4>🖼️ कार्डको प्रत्यक्ष रूप (Live Canvas Preview)</h4>
            <span class="canvas-dimensions">500 × 320 px (High-Res HD)</span>
          </div>

          <div class="canvas-wrapper">
            <canvas id="dashainCardCanvas" width="500" height="320"></canvas>
          </div>

          <div class="card-action-buttons">
            <button id="downloadCardBtn" class="btn btn-primary btn-lg" title="Download High Resolution PNG">
              📥 डाउनलोड गर्नुहोस् (Download PNG)
            </button>
            <button id="playCardMusicBtn" class="btn btn-secondary btn-lg" title="Listen to Attached Song">
              ▶ धुन बजाउनुहोस् (Play Attached Song)
            </button>
            <button id="saveCardDbBtn" class="btn btn-outline btn-lg" title="Save to My Cards collection">
              💾 संग्रहमा राख्नुहोस् (Save Card)
            </button>
          </div>

          <div class="social-share-card-row">
            <span class="share-title">तुरुन्त पठाउनुहोस् (Direct Share):</span>
            <button class="share-icon-btn whatsapp" id="shareCardWhatsapp" title="Share on WhatsApp">💬 WhatsApp</button>
            <button class="share-icon-btn viber" id="shareCardViber" title="Share on Viber">🟣 Viber</button>
            <button class="share-icon-btn facebook" id="shareCardFB" title="Share on Facebook">🔵 Facebook</button>
          </div>
        </div>
      </div>
    `;

    this.initCanvas();
    this.bindEvents();
    this.drawCard();
  }

  initCanvas() {
    this.canvas = this.container.querySelector('#dashainCardCanvas');
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
    }
  }

  bindEvents() {
    const tplBtns = this.container.querySelectorAll('.template-card-btn');
    const recipientInput = this.container.querySelector('#cardRecipientInput');
    const senderInput = this.container.querySelector('#cardSenderInput');
    const presetsSelect = this.container.querySelector('#greetingPresetsSelect');
    const messageText = this.container.querySelector('#cardMessageText');
    const stickerBtns = this.container.querySelectorAll('.sticker-btn');
    const clearStickersBtn = this.container.querySelector('#clearStickersBtn');
    const songSelect = this.container.querySelector('#cardSongSelect');
    const downloadBtn = this.container.querySelector('#downloadCardBtn');
    const playMusicBtn = this.container.querySelector('#playCardMusicBtn');
    const saveCardDbBtn = this.container.querySelector('#saveCardDbBtn');

    // Template change
    tplBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tplId = btn.getAttribute('data-tpl');
        this.cardState.templateId = tplId;
        const tpl = CARD_TEMPLATES.find(t => t.id === tplId);
        if (tpl) {
          this.cardState.stickers = [...tpl.defaultStickers];
        }
        tplBtns.forEach(b => b.classList.toggle('active', b.getAttribute('data-tpl') === tplId));
        this.drawCard();
      });
    });

    recipientInput.addEventListener('input', (e) => {
      this.cardState.recipient = e.target.value;
      this.drawCard();
    });

    senderInput.addEventListener('input', (e) => {
      this.cardState.sender = e.target.value;
      this.drawCard();
    });

    presetsSelect.addEventListener('change', (e) => {
      if (e.target.value) {
        this.cardState.message = e.target.value;
        messageText.value = e.target.value;
        this.drawCard();
      }
    });

    messageText.addEventListener('input', (e) => {
      this.cardState.message = e.target.value;
      this.drawCard();
    });

    // Add sticker
    stickerBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const icon = btn.getAttribute('data-sticker');
        const x = Math.floor(Math.random() * 340) + 70;
        const y = Math.floor(Math.random() * 40) + 90;
        this.cardState.stickers.push({ type: icon, x, y, size: 44 });
        this.drawCard();
      });
    });

    clearStickersBtn.addEventListener('click', () => {
      this.cardState.stickers = [];
      this.drawCard();
    });

    songSelect.addEventListener('change', (e) => {
      this.cardState.songId = e.target.value;
    });

    // Download PNG
    downloadBtn.addEventListener('click', () => {
      this.downloadCanvasImage();
    });

    // Play attached song
    playMusicBtn.addEventListener('click', () => {
      const song = DASHAIN_SONGS.find(s => s.id === this.cardState.songId) || DASHAIN_SONGS[0];
      player.playSong(song);
    });

    // Save to store DB
    saveCardDbBtn.addEventListener('click', async () => {
      const dataUrl = this.canvas.toDataURL('image/png');
      const saved = await store.saveCustomCard({
        ...this.cardState,
        imageDataUrl: dataUrl
      });
      alert('बधाई छ! तपाईंको दशैं कार्ड संग्रहमा सुरक्षित भयो। (Card saved to collection!)');
    });

    // Share buttons
    this.container.querySelector('#shareCardWhatsapp').addEventListener('click', () => {
      const text = `🌸 ${this.cardState.title} 🌸\n\nTo: ${this.cardState.recipient}\n\n"${this.cardState.message}"\n\nFrom: ${this.cardState.sender}\n\nListen to Dashain Songs: ${window.location.href}`;
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    });

    this.container.querySelector('#shareCardViber').addEventListener('click', () => {
      const text = `🌸 ${this.cardState.title} 🌸\n\nTo: ${this.cardState.recipient}\n"${this.cardState.message}"\nFrom: ${this.cardState.sender}\n${window.location.href}`;
      window.open(`viber://forward?text=${encodeURIComponent(text)}`, '_blank');
    });

    this.container.querySelector('#shareCardFB').addEventListener('click', () => {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank');
    });
  }

  drawCard() {
    if (!this.canvas || !this.ctx) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const tpl = CARD_TEMPLATES.find(t => t.id === this.cardState.templateId) || CARD_TEMPLATES[0];

    // Background Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, w, h);
    bgGrad.addColorStop(0, tpl.bgColors[0]);
    bgGrad.addColorStop(0.6, tpl.bgColors[1]);
    bgGrad.addColorStop(1, tpl.bgColors[2] || '#000000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Auspicious Outer Gold Frame
    ctx.strokeStyle = tpl.accentColor;
    ctx.lineWidth = 4;
    ctx.strokeRect(12, 12, w - 24, h - 24);

    ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(18, 18, w - 36, h - 36);

    // Corner Ornaments
    this.drawCornerOrnament(ctx, 24, 24, tpl.accentColor);
    this.drawCornerOrnament(ctx, w - 24, 24, tpl.accentColor);
    this.drawCornerOrnament(ctx, 24, h - 24, tpl.accentColor);
    this.drawCornerOrnament(ctx, w - 24, h - 24, tpl.accentColor);

    // Header Title
    ctx.textAlign = 'center';
    ctx.fillStyle = tpl.accentColor;
    ctx.font = 'bold 22px "Mukta", "Inter", sans-serif';
    ctx.shadowColor = 'rgba(0,0,0,0.7)';
    ctx.shadowBlur = 6;
    ctx.fillText('✨ ' + (this.cardState.title || 'बडा दशैंको शुभकामना') + ' ✨', w / 2, 48);

    // Recipient line
    ctx.fillStyle = tpl.textColor;
    ctx.font = '600 15px "Mukta", "Inter", sans-serif';
    ctx.fillText(`सादर: ${this.cardState.recipient || ''}`, w / 2, 75);

    // Draw Stickers on Card
    this.cardState.stickers.forEach(stk => {
      ctx.font = `${stk.size || 44}px sans-serif`;
      ctx.shadowBlur = 4;
      ctx.fillText(stk.type, stk.x, stk.y);
    });

    // Message Body Box
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(36, 160, w - 72, 95, 10);
      ctx.fill();
    } else {
      ctx.fillRect(36, 160, w - 72, 95);
    }

    // Message Lines with text wrapping
    ctx.fillStyle = tpl.textColor;
    ctx.font = '500 14px "Mukta", "Inter", sans-serif';
    ctx.shadowBlur = 2;
    this.wrapText(ctx, `“${this.cardState.message}”`, w / 2, 190, w - 100, 22);

    // Sender / Signature line
    ctx.textAlign = 'right';
    ctx.fillStyle = tpl.subTextColor;
    ctx.font = 'italic 600 13px "Mukta", "Inter", sans-serif';
    ctx.fillText(`— ${this.cardState.sender || ''}`, w - 48, 285);

    // Bottom left festival emblem
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '11px sans-serif';
    ctx.fillText('🇳🇵 Dashain Geet Hub 2083', 44, 285);
  }

  drawCornerOrnament(ctx, x, y, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let currentY = y;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, x, currentY);
        line = words[n] + ' ';
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, currentY);
  }

  downloadCanvasImage() {
    if (!this.canvas) return;
    const link = document.createElement('a');
    link.download = `Dashain_Wishes_${Date.now()}.png`;
    link.href = this.canvas.toDataURL('image/png');
    link.click();
  }
}
