/**
 * Push Notifications & Dashain Countdown Center
 * Manages Web Notifications API, in-app notification drawer, and festival countdown alerts.
 */

export class NotificationManager {
  constructor() {
    this.notifications = [
      {
        id: 'dashain-countdown',
        type: 'countdown',
        icon: '🪔',
        title: 'बडा दशैं २०८३ नजिकिँदै छ!',
        message: 'घटस्थापना सुरु हुन केही दिन मात्र बाँकी! मालश्री धुन सुन्दै तयारी सुरु गरौं।',
        timestamp: 'Just now',
        read: false
      },
      {
        id: 'new-song-alert',
        type: 'new_song',
        icon: '🎵',
        title: 'नयाँ गीत थपियो (New Song Added)',
        message: '"Naya Dashain Vibes 2026" - Sarangi & Fusion Beats अब उपलब्ध छ!',
        timestamp: '2 hours ago',
        read: false
      },
      {
        id: 'card-wish',
        type: 'greeting',
        icon: '🌸',
        title: 'दशैं शुभकामना कार्ड (Gift Cards)',
        message: 'आफ्ना आफन्त र साथीभाइलाई परम्परागत नेपाली दशैं कार्ड पठाउनुहोस्!',
        timestamp: '1 day ago',
        read: true
      }
    ];
  }

  async requestPermission() {
    if (!('Notification' in window)) {
      alert('यस ब्राउजरमा Push Notification उपलब्ध छैन (Notifications not supported in this browser).');
      return false;
    }

    if (Notification.permission === 'granted') {
      this.sendLocalNotification('बडा दशैं धुन र गीत', 'तपाईंले नयाँ गीत र दशैं शुभकामनाको सूचना प्राप्त गर्नुहुनेछ!');
      return true;
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      this.sendLocalNotification('सूचना सक्रिय भयो! 🎉', 'दशैं सम्बन्धी नयाँ गीत र ताजा अपडेट अब सिधै पाउनुहुनेछ।');
      return true;
    }
    return false;
  }

  sendLocalNotification(title, body, icon = '🪔') {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🪔</text></svg>'
        });
      } catch (e) {
        console.warn('Native notification failed:', e);
      }
    }
  }

  getUnreadCount() {
    return this.notifications.filter(n => !n.read).length;
  }

  markAllAsRead() {
    this.notifications.forEach(n => n.read = true);
  }

  renderDrawer(container) {
    const unread = this.getUnreadCount();

    container.innerHTML = `
      <div class="notifications-drawer">
        <div class="drawer-header">
          <div class="drawer-title-wrap">
            <span class="drawer-icon">🔔</span>
            <h3>दशैं सूचना केन्द्र (Notifications)</h3>
          </div>
          <button id="markAllReadBtn" class="btn btn-outline btn-xs">सबै पढियो (Mark Read)</button>
        </div>

        <div class="push-permission-banner">
          <div class="push-info">
            <strong>🔔 Real-Time Festival Alerts</strong>
            <p>Get instant updates on Dashain countdown, new song drops, and community wishes.</p>
          </div>
          <button id="enablePushBtn" class="btn btn-primary btn-sm">
            सक्रिय गर्नुहोस् (Enable)
          </button>
        </div>

        <div class="notifications-list">
          ${this.notifications.map(n => `
            <div class="notification-item ${n.read ? 'read' : 'unread'}">
              <span class="noti-icon">${n.icon}</span>
              <div class="noti-content">
                <h4>${n.title}</h4>
                <p>${n.message}</p>
                <span class="noti-time">${n.timestamp}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    const enableBtn = container.querySelector('#enablePushBtn');
    if (enableBtn) {
      enableBtn.addEventListener('click', async () => {
        const ok = await this.requestPermission();
        if (ok) {
          enableBtn.textContent = 'सक्रिय भयो (Enabled ✓)';
          enableBtn.disabled = true;
        }
      });
    }

    const markReadBtn = container.querySelector('#markAllReadBtn');
    if (markReadBtn) {
      markReadBtn.addEventListener('click', () => {
        this.markAllAsRead();
        this.renderDrawer(container);
        const badge = document.querySelector('#notificationBadge');
        if (badge) badge.style.display = 'none';
      });
    }
  }
}

export const notificationManager = new NotificationManager();
