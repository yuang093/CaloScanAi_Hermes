# 專案總覽 (Project Overview)

- **專案名稱**：CaloScanAi
- **目前階段**：Phase 0 - 企劃與原型生成
- **當前狀態**：核心開發文件已建立，基礎設施決策已完成，準備進入視覺原型開發。

## 基礎設施決策（2026-05-21 確定）

### 1. 部署架構：Mac Mini Docker（與 SmartCard DB 同模式）
- 前端：Next.js（container: `caloscan_frontend`）
- 後端：FastAPI + Python（container: `caloscan_backend`）
- 資料庫：PostgreSQL 16（container: `caloscan_postgres`）
- 外部存取：Cloudflare Tunnel（container: `cloudflared`），與名片系統共用的 tunnel
- 所有服務透過 `docker compose` 管理，Mac Mini 24 小時開機

### 2. 資料庫：PostgreSQL
- 備份格式：
  - 資料庫本體：`.sql`（`pg_dump` 純文字格式）
  - 圖片資料：`.tar.gz`（`volumes/uploads/` 目錄）
- 還原方式：`psql -U user -d db < backup.sql`（直接 import）
- 備份腳本：參考 `scripts/backup.sh`

### 3. 圖片儲存：Mac Mini 本地
- 使用 Docker named volume：`./volumes/uploads:/app/uploads`
- 備份時 `tar -czf` 壓縮 uploads 目錄即可
- 不使用雲端儲存，成本最低

### 4. Vercel HTML 原型上傳
- Repo：`https://github.com/yuang093/Hermes_HTML`
- 使用方式：生成 HTML → commit + push → Vercel 自動部署
- 部署 URL：（待設定）

## 下一步 (Next Actions for Agents)
- [ ] 完成 Vercel 專案設定，確認 HTML 原型部署 URL
- **UI/UX 原型任務**：生成 6 個不同風格的 HTML/CSS/JS 首頁原型。
- **後台儀表板任務**：生成 6 個不同版面的 HTML 管理者儀表板原型。