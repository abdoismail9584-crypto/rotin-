/* ============================================================
   HAYATI — API Client & Core Utilities
   ============================================================ */

const API_BASE = 'http://localhost:5000/api';

// ─── Storage helpers ───────────────────────────────────────
const storage = {
  get: (key) => { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } },
  set: (key, val) => localStorage.setItem(key, JSON.stringify(val)),
  remove: (key) => localStorage.removeItem(key)
};

// ─── Auth State ────────────────────────────────────────────
const auth = {
  getToken: () => storage.get('hayati_token'),
  getUser:  () => storage.get('hayati_user'),
  isLoggedIn: () => !!storage.get('hayati_token'),
  setSession: (token, user) => { storage.set('hayati_token', token); storage.set('hayati_user', user); },
  clearSession: () => { storage.remove('hayati_token'); storage.remove('hayati_user'); },
  redirectIfNeeded: () => {
    const publicPages = ['login.html', 'register.html', 'index.html'];
    const currentPage = location.pathname.split('/').pop() || 'index.html';
    const isPublic = publicPages.includes(currentPage);
    if (!auth.isLoggedIn() && !isPublic) {
      location.href = '/login.html';
      return false;
    }
    if (auth.isLoggedIn() && (currentPage === 'login.html' || currentPage === 'register.html')) {
      location.href = '/dashboard.html';
      return false;
    }
    return true;
  }
};

// ─── API Client ────────────────────────────────────────────
const api = {
  async request(method, endpoint, body = null) {
    const headers = { 'Content-Type': 'application/json' };
    const token = auth.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, opts);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'حدث خطأ');
      return data;
    } catch (err) {
      if (err.message === 'Failed to fetch') throw new Error('تعذر الاتصال بالخادم');
      throw err;
    }
  },
  get:    (endpoint)       => api.request('GET',    endpoint),
  post:   (endpoint, body) => api.request('POST',   endpoint, body),
  put:    (endpoint, body) => api.request('PUT',    endpoint, body),
  delete: (endpoint)       => api.request('DELETE', endpoint),
};

// ─── Toast Notifications ───────────────────────────────────
const toast = {
  container: null,
  init() {
    this.container = document.createElement('div');
    this.container.className = 'toast-container';
    document.body.appendChild(this.container);
  },
  show(message, type = 'info', duration = 3000) {
    if (!this.container) this.init();
    const icons = { success: '✓', error: '✕', info: 'ℹ' };
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = `<span>${icons[type]}</span><span>${message}</span>`;
    this.container.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity 0.3s'; setTimeout(() => t.remove(), 300); }, duration);
  },
  success: (msg) => toast.show(msg, 'success'),
  error:   (msg) => toast.show(msg, 'error'),
  info:    (msg) => toast.show(msg, 'info'),
};
toast.init();

// ─── Date Utilities ────────────────────────────────────────
const dateUtils = {
  today: () => new Date().toISOString().split('T')[0],
  formatArabic: (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  },
  formatShort: (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
  },
  currentMonth: () => new Date().toISOString().slice(0, 7),
  getGreeting: () => {
    const h = new Date().getHours();
    if (h < 5)  return 'طاب ليلك 🌙';
    if (h < 12) return 'صباح النور ☀️';
    if (h < 17) return 'طاب نهارك 🌤️';
    if (h < 20) return 'طاب مساؤك 🌅';
    return 'طاب ليلك 🌙';
  }
};

// ─── Modal Manager ─────────────────────────────────────────
const modal = {
  open(id) {
    const el = document.getElementById(id);
    if (el) { el.classList.add('open'); document.body.style.overflow = 'hidden'; }
  },
  close(id) {
    const el = document.getElementById(id);
    if (el) { el.classList.remove('open'); document.body.style.overflow = ''; }
  },
  init() {
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.classList.remove('open');
      });
    });
    document.querySelectorAll('.modal-close, [data-modal-close]').forEach(btn => {
      btn.addEventListener('click', () => {
        const overlay = btn.closest('.modal-overlay');
        if (overlay) overlay.classList.remove('open');
      });
    });
  }
};

// ─── Loading State ─────────────────────────────────────────
const ui = {
  setLoading(btn, state) {
    if (!btn) return;
    btn.disabled = state;
    btn.classList.toggle('loading', state);
  },
  skeleton(container, count = 3) {
    container.innerHTML = Array(count).fill('').map(() =>
      `<div class="skeleton" style="height:60px;margin-bottom:8px;border-radius:12px;"></div>`
    ).join('');
  }
};

// ─── Navigation Active State ───────────────────────────────
function setActiveNav() {
  const current = location.pathname.split('/').pop() || 'dashboard.html';
  document.querySelectorAll('[data-page]').forEach(link => {
    link.classList.toggle('active', link.dataset.page === current);
  });
}

// ─── Render User Info ──────────────────────────────────────
function renderUserInfo() {
  const user = auth.getUser();
  if (!user) return;
  document.querySelectorAll('.user-name').forEach(el => el.textContent = user.name);
  document.querySelectorAll('.user-email').forEach(el => el.textContent = user.email);
  document.querySelectorAll('.user-avatar').forEach(el => el.textContent = user.name?.[0] || '؟');
}

// ─── Logout ────────────────────────────────────────────────
function logout() {
  auth.clearSession();
  location.href = '/login.html';
}

// ─── Monthly Reminder Check ────────────────────────────────
async function checkMonthlyReminders() {
  try {
    const month = dateUtils.currentMonth();
    const data = await api.get(`/tasks/monthly?month=${month}`);
    const pending = data.tasks?.filter(t => !t.completed) || [];
    if (pending.length > 0) {
      const container = document.getElementById('monthly-reminders');
      if (container) {
        container.innerHTML = pending.map(t => `
          <div class="monthly-reminder">
            <div class="reminder-icon">📅</div>
            <div>
              <div class="reminder-text">${t.title}</div>
              <div class="text-sm text-muted">${t.dueDate ? dateUtils.formatShort(t.dueDate) : 'هذا الشهر'}</div>
            </div>
          </div>
        `).join('');
        container.classList.remove('hidden');
      }
    }
  } catch (e) { /* silent */ }
}

// ─── Init ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  if (!auth.redirectIfNeeded()) return;
  modal.init();
  setActiveNav();
  renderUserInfo();

  // Logout buttons
  document.querySelectorAll('[data-action="logout"]').forEach(btn =>
    btn.addEventListener('click', logout)
  );
});
