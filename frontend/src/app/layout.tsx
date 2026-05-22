import type { Metadata } from 'next';
import { ThemeProvider } from '@/contexts/ThemeContext';
import ThemeToggle from '@/components/ThemeToggle';
import '@/styles/theme.css';

export const metadata: Metadata = {
  title: 'CaloScanAi — AI 每日卡路里追蹤',
  description: '用 AI 拍照辨識食物，輕鬆追蹤每日卡路里攝取',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW" suppressHydrationWarning>
      <head>
        {/* Inline theme script to prevent flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('caloscan-theme')||'system';var r=t==='system'?window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light':t;document.documentElement.setAttribute('data-theme',r);})();`,
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <header style={{ position: 'fixed', top: 16, right: 16, zIndex: 100 }}>
            <ThemeToggle />
          </header>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}