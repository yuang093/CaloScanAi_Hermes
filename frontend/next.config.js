/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  env: {
    // 在此暴露給客戶端的環境變數
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  },
};

module.exports = nextConfig;