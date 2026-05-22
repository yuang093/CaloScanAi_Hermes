'use client';

/**
 * CaloScanAi — Theme Init Script
 * 讀取 localStorage 的 dark_mode 設定，初始化 <html> data-theme 屬性
 * 避免閃屏（flash of unstyled content）
 */
(function () {
  const THEME_KEY = 'caloscan-theme';
  const VALID_THEMES = ['light', 'dark', 'system'];

  function getResolvedTheme(theme) {
    if (theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return VALID_THEMES.includes(theme) ? theme : 'light';
  }

  function applyTheme() {
    const saved = localStorage.getItem(THEME_KEY) || 'system';
    const resolved = getResolvedTheme(saved);
    document.documentElement.setAttribute('data-theme', resolved);
  }

  // Apply before React renders to avoid flash
  applyTheme();

  // Re-apply when storage changes (from other tabs)
  window.addEventListener('storage', (e) => {
    if (e.key === THEME_KEY) applyTheme();
  });

  // Listen for system preference changes when user uses 'system'
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  mq.addEventListener('change', () => {
    const saved = localStorage.getItem(THEME_KEY) || 'system';
    if (saved === 'system') applyTheme();
  });
})();