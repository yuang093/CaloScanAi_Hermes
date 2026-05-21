# 開發日誌 (Daily Progress Log)

## 2026-05-21
- **Added**: 建立專案基礎文件 (`CLAUDE.md`, `AGENTS.md`, `PROJECT_BRIEF.md`, `PROJECT_CONTEXT.md` 等)。
- **Decision**: 確定專案名稱為 `CaloScanAi`。
- **Decision**: 暫緩決定最終 UI/UX 與儀表板版面，改為先由 AI 生成 6 個 HTML 原型後再做決策。
- **Decision**: 基礎設施三項決策（2026-05-21）：
  1. 部署：Mac Mini Docker（與 SmartCard DB 同模式）
  2. 資料庫：PostgreSQL，備份格式 `.sql` + `.tar.gz`
  3. 圖片：Mac Mini 本地 volume
- **Added**: 建立「任務優先序決策器」HTML 原型，上傳到 `Hermes_HTML` repo
- **Completed（依優先序執行）**：
  1. ✅ 建立 Docker Compose 架構（backend + frontend + postgres + cloudflared）
  2. ✅ 建立資料庫 Schema（Users, FoodLogs, BarcodeDictionary, DailyQuotes）
  3. ✅ 設計登入流程（註冊、JWT、bcrypt）
  4. ✅ 完成 365 句鼓勵語錄 seed data
  5. ✅ 撰寫備份腳本 `scripts/backup.sh`
- **Todo Next**: 資料庫備份策略分析（第二優先）