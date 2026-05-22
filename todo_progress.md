# 開發進度與任務清單

## 階段零：環境與基底架構
- [x] 決定專案中英文名稱與 UI/UX 風格。
- [x] 初始化 Git 與 `.gitignore` (排除 `.env`)。
- [x] 決定部署架構：Mac Mini Docker（與 SmartCard DB 同模式）
- [x] 決定資料庫：PostgreSQL，備份格式 `.sql` + `.tar.gz`
- [x] 決定圖片儲存：Mac Mini 本地 volume
- [x] 撰寫資料庫初始化腳本 (自動生成 Table)。

## 階段一：AI 工作流與基礎設施
- [x] 建立 Docker Compose 部署架構（backend + frontend + postgres + cloudflared）
- [x] 建立資料庫 Schema（Users, FoodLogs, BarcodeDictionary, DailyQuotes）
- [x] 實作會員登入/註冊機制（JWT, bcrypt）
- [x] 建立 Vercel HTML 專案，用於與 AI 溝通（優先序決策器已完成）
- [x] 產出 6 種版本提案供選擇（UI/UX 原型）。
- [x] 使用 AI 生成使用者調查問卷以萃取核心功能。

## 階段二：核心功能與 AI 辨識
- [x] 串接 MiniMax AI 分析食物照片與熱量（vision.py 已完成）。
- [x] 實作影像壓縮模組 (300KB, max 1200px, quality 0.85→0.4)。
- [x] 實作條碼掃描與字典檔搜尋服務（barcode.py、草稿）。
- [x] 制定資料庫備份策略文件（backup_strategy.md 已完成）。
- [ ] P2-4：條碼掃描實作（待有相機功能的前端配合）。

## 階段三：管理員與系統安全
- [x] 實作後台儀表板 (統計數據) — `admin.py` 完成。
- [x] 實作帳號管理 (改密碼、刪除、升級管理員) — `admin.py` 完成。
- [x] 資料庫備份策略文件已完成（`docs/backup_strategy.md`）。
- [ ] 實作資料庫手動/自動備份、還原、下載 API（需配合 cron）。

## 階段四：UI/UX 完善
- [x] 實作深色/亮色模式切換 — `frontend/src/styles/theme.css` + `utils/theme.js`。
- [x] 匯入 365 句鼓勵語錄至資料庫並實作首頁輪播 — `init-db.sql` 已有語錄，`DailyQuote.jsx` 完成。
- [x] 實作斗內 (Donation) 按鈕 — `DonationButton.jsx`（Ko-fi + Buy Me a Coffee，浮動+內嵌）。