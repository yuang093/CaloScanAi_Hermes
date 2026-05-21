# CaloScanAi 更新日誌

## [1.0.0] - 2026-05-21
### Added
- 初始專案架構（Phase 1 啟動）
- Docker Compose 部署設定（backend + frontend + postgres + cloudflared）
- 資料庫 Schema：`Users`、`FoodLogs`、`BarcodeDictionary`、`DailyQuotes`
- 會員系統：註冊、登入、JWT 認證
- API 端點：食物日誌 CRUD、每日熱量摘要、條碼查詢、鼓勵語錄
- 備份腳本：`scripts/backup.sh`
- 365 句鼓勵語錄 seed data

## 待完成
- 前端 Next.js 頁面（目前僅後端 API）
- AI 圖片分析串接（食物辨識 + 熱量估算）
- 影像壓縮模組
- 管理員儀表板
