import type { Metadata } from 'next';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { StyleProvider } from '@/contexts/StyleContext';
import ThemeToggle from '@/components/ThemeToggle';
import '@/styles/theme.css';

export const metadata: Metadata = {
  title: 'CaloScanAi — AI 每日卡路里追蹤',
  description: '用 AI 拍照辨識食物，輕鬆追蹤每日卡路里攝取',
  manifest: '/manifest.json',
  themeColor: '#4f46e5',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'CaloScanAi',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
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
        {/* PWA meta */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="CaloScanAi" />
      </head>
      <body>
        <ThemeProvider>
          <StyleProvider>
            <header style={{ position: 'fixed', top: 16, right: 16, zIndex: 100 }}>
              <ThemeToggle />
            </header>
            {children}
          </StyleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}