'use client';

import { useTheme } from '@/contexts/ThemeContext';

export default function ThemeToggle() {
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle"
      aria-label="切換主題"
      title={resolvedTheme === 'light' ? '切換到深色模式' : '切換到淺色模式'}
    >
      <span className="icon" aria-hidden="true">
        {resolvedTheme === 'light' ? '🌙' : '☀️'}
      </span>
    </button>
  );
}