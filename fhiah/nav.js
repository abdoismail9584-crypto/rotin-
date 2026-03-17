/* ============================================================
   HAYATI — Navigation Builder
   Call buildNav() on every protected page
   ============================================================ */

function buildNav() {
  const navLinks = [
    { page: 'dashboard.html', icon: '🏠', label: 'الرئيسية' },
    { page: 'tasks.html',     icon: '✅', label: 'المهام' },
    { page: 'prayers.html',   icon: '🤲', label: 'الصلوات' },
    { page: 'journal.html',   icon: '📓', label: 'يومياتي' },
    { page: 'debts.html',     icon: '💰', label: 'الديون' },
    { page: 'habits.html',    icon: '⭐', label: 'العادات' },
  ];

  const current = location.pathname.split('/').pop() || 'dashboard.html';
  const user = auth.getUser() || {};

  // ── Sidebar ────────────────────────────────────────────────
  const sidebar = document.createElement('aside');
  sidebar.className = 'sidebar';
  sidebar.innerHTML = `
    <div class="sidebar-logo">
      <div class="sidebar-logo-icon">🌙</div>
      <div>
        <div class="sidebar-logo-text">حياتي</div>
        <div class="sidebar-logo-sub">إدارة حياتك اليومية</div>
      </div>
    </div>
    <nav class="sidebar-nav">
      ${navLinks.map(l => `
        <a href="/${l.page}" data-page="${l.page}" class="${current === l.page ? 'active' : ''}">
          <span class="nav-icon">${l.icon}</span>
          <span>${l.label}</span>
        </a>
      `).join('')}
    </nav>
    <div class="sidebar-footer">
      <div class="user-card">
        <div class="user-avatar">${user.name?.[0] || '؟'}</div>
        <div style="flex:1;min-width:0;">
          <div class="user-name">${user.name || ''}</div>
          <div class="user-email" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${user.email || ''}</div>
        </div>
      </div>
      <button class="btn btn-ghost btn-block mt-sm" style="justify-content:flex-start;gap:8px;" data-action="logout">
        <span>🚪</span> تسجيل الخروج
      </button>
    </div>
  `;

  // ── Bottom Nav (mobile) ────────────────────────────────────
  const bottomNav = document.createElement('nav');
  bottomNav.className = 'bottom-nav';
  // Show only 5 items on mobile
  const mobileLinks = [
    { page: 'dashboard.html', icon: '🏠', label: 'الرئيسية' },
    { page: 'tasks.html',     icon: '✅', label: 'المهام' },
    { page: 'prayers.html',   icon: '🤲', label: 'الصلوات' },
    { page: 'journal.html',   icon: '📓', label: 'يومياتي' },
    { page: 'debts.html',     icon: '💰', label: 'الديون' },
  ];
  bottomNav.innerHTML = mobileLinks.map(l => `
    <a href="/${l.page}" data-page="${l.page}" class="${current === l.page ? 'active' : ''}">
      <span class="nav-icon">${l.icon}</span>
      <span class="nav-label">${l.label}</span>
      ${current === l.page ? '<span class="nav-dot"></span>' : ''}
    </a>
  `).join('');

  const layout = document.querySelector('.app-layout');
  if (layout) {
    layout.insertBefore(sidebar, layout.firstChild);
    document.body.appendChild(bottomNav);
  }

  // Re-bind logout
  document.querySelectorAll('[data-action="logout"]').forEach(btn =>
    btn.addEventListener('click', logout)
  );
}
