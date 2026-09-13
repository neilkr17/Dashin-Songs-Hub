/**
 * Offline Connectivity & Service Worker Manager
 * Handles network changes, offline caching, and PWA resilience.
 */

export class OfflineManager {
  constructor() {
    this.isOnline = navigator.onLine;
    this.listeners = [];
  }

  init() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyStatus(true);
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyStatus(false);
    });

    this.registerServiceWorker();
  }

  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.register('./sw.js');
        console.log('Dashain PWA ServiceWorker registered with scope:', reg.scope);
      } catch (err) {
        console.warn('ServiceWorker registration error:', err);
      }
    }
  }

  notifyStatus(isOnline) {
    const banner = document.getElementById('offlineBanner');
    if (banner) {
      if (!isOnline) {
        banner.classList.add('visible');
        banner.innerHTML = `
          <span class="offline-icon">📡</span>
          <span>तपाईं अफलाइन हुनुहुन्छ (You are Offline) — Caching active. गीतहरू र कार्डहरू निर्वाध रूपमा चल्नेछन्!</span>
        `;
      } else {
        banner.classList.add('back-online');
        banner.innerHTML = `
          <span class="offline-icon">🟢</span>
          <span>इन्टरनेट पुनः जोडिएको छ (Back Online)! Data synced.</span>
        `;
        setTimeout(() => {
          banner.classList.remove('visible', 'back-online');
        }, 3000);
      }
    }

    const badge = document.getElementById('connectionStatusBadge');
    if (badge) {
      badge.className = `status-badge ${isOnline ? 'online' : 'offline'}`;
      badge.textContent = isOnline ? '🟢 Online' : '📡 Offline Ready';
    }
  }
}

export const offlineManager = new OfflineManager();
