/**
 * CaloScanAi — next.config.js
 * PWA 已停用（Build 時與 Next.js App Router 衝突）
 * 如需啟用 PWA：將 withPWA 那幾行註解移除即可
 */

// PWA 暫時停用，排查 build error
const nextConfig = {
  output: 'standalone',
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  },
};

module.exports = nextConfig;