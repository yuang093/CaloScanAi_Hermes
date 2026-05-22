/**
 * 主題切換工具
 * 初始化、監聽系統偏好、儲存用戶選擇到 localStorage
 */

const THEME_KEY = 'caloscan-theme';
const VALID_THEMES = ['light', 'dark', 'system'];

/**
 * 初始化主題：
 * 1. 讀取 localStorage 的用戶選擇
 * 2. 若為 'system'，監聽 prefers-color-scheme 變化
 * 3. 套用正確的主題到 <html> 的 data-theme 屬性
 */
export function initTheme() {
  const saved = localStorage.getItem(THEME_KEY) || 'system';
  applyTheme(saved);

  // 監聽系統偏好變化（當用戶選擇 system 時）
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  mq.addEventListener('change', () => {
    const current = localStorage.getItem(THEME_KEY) || 'system';
    if (current === 'system') applyTheme('system');
  });
}

/**
 * 切換主題
 * @param {'light' | 'dark' | 'system'} theme
 */
export function setTheme(theme) {
  if (!VALID_THEMES.includes(theme)) return;
  localStorage.setItem(THEME_KEY, theme);
  applyTheme(theme);
}

/**
 * 獲取目前 theme 切換按鈕應顯示的圖示 label
 */
export function getThemeIconLabel(theme) {
  if (theme === 'dark') return '🌙';
  if (theme === 'light') return '☀️';
  return '💡';
}

function applyTheme(theme) {
  let resolved;

  if (theme === 'system') {
    resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } else {
    resolved = theme;
  }

  document.documentElement.setAttribute('data-theme', resolved);

  // 廣播變化讓其他元件可以響應
  window.dispatchEvent(new CustomEvent('theme-change', { detail: { theme, resolved } }));
}

// 初始化
initTheme();