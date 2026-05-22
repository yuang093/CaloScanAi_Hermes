# CaloScanAi — AI 熱量追蹤助手

> **不挨餓、不焦慮，用 AI 幫你記錄每一口食物。**

CaloScanAi 是一款基於 AI 的熱量追蹤工具，透過拍照或條碼掃描，自動辨識食物熱量與巨量營養素，讓你輕鬆掌握每日飲食。

---

## ✨ 功能特色

### 🍽️ AI 食物辨識
- **拍照上傳**：每餐拍一張照片，AI 自動分析食物種類、熱量、蛋白質、碳水、脂肪
- **條碼掃描**：支援營養標示條碼一掃即得
- **手動新增**：快速新增未帶包裝的食物

### 📊 每日儀表板
- 即時熱量進度條（今日攝取 / 目標）
- 每餐統計：早餐、午餐、晚餐、點心
- 7 日趨勢圖：了解長期飲食模式

### 🎯 個人化設定
- 自訂每日熱量目標（預設 2000 kcal）
- 支援 Dark / Light 雙主題
- 365 句每日鼓勵語錄陪伴你

### 🔐 會員系統
- JWT 登入 / 註冊
- 資料跨裝置同步
- 管理員儀表板（用戶統計、TOP 食物排行）

---

## 🛠️ 技術架構

| 層 | 技術 |
|---|---|
| 前端 | React（Preact）、CSS Variables 主題系統 |
| 後端 | FastAPI（Python 3.11+）|
| 資料庫 | PostgreSQL 16 |
| AI | MiniMax Vision API（食物辨識）|
| 部署 | Docker Compose（Mac Mini 自Host）|
| 外部 | Cloudflare Tunnel（暴露至公共 URL）|

---

## 📁 專案結構

```
CaloScanAi/
├── backend/
│   └── app/
│       ├── api/          # API Routes
│       │   ├── admin.py  # 管理員 API
│       │   ├── account.py# 帳號管理 API
│       │   └── food_logs.py
│       ├── core/         # 設定檔、資料庫連線
│       ├── models/       # SQLAlchemy ORM Models
│       ├── schemas/      # Pydantic Schemas
│       └── services/     # 商業邏輯
│           ├── vision.py          # MiniMax AI
│           ├── image_processor.py # 圖片壓縮
│           └── barcode.py         # 條碼掃描
├── frontend/
│   └── src/
│       ├── components/   # UI 元件
│       ├── styles/       # CSS 主題
│       └── utils/        # 主題切換工具
├── scripts/
│   ├── backup.sh         # 每日備份腳本
│   └── init-db.sql      # 資料庫初始化（含 365 語錄）
├── docs/
│   ├── architecture.md
│   └── backup_strategy.md
└── docker-compose.yml
```

---

## 🚀 快速啟動（本地開發）

### 前置需求
- Docker & Docker Compose
- Python 3.11+（如需直接跑後端）
- Node.js 18+（如需直接跑前端）

### 1. 複製並進入專案
```bash
git clone https://github.com/yuang093/CaloScanAi.git
cd CaloScanAi
```

### 2. 設定環境變數
```bash
cp .env.example .env
# 編輯 .env，填入：
# DATABASE_URL=postgresql+asyncpg://caloscan:caloscan@localhost:5432/caloscan
# JWT_SECRET=your-secret-key
# MINIMAX_API_KEY=your-minimax-key
```

### 3. 啟動所有服務（Docker）
```bash
docker compose up -d
```

### 4. 初始化資料庫
```bash
docker compose exec backend python -c "
import asyncio; from app.core.database import engine, Base; 
from app.models import user, food_log, barcode
asyncio.run(Base.metadata.create_all(engine))
"
```

### 5. 開啟應用
| 服務 | URL |
|---|---|
| 前端（本地）| http://localhost:3000 |
| 後端 API | http://localhost:8000 |
| API 文件 | http://localhost:8000/docs |

---

## 🐳 Docker 服務說明

| 容器 | 說明 |
|---|---|
| `postgres` | PostgreSQL 16 資料庫 |
| `backend` | FastAPI 後端（Port 8000）|
| `frontend` | React 前端（Port 3000）|
| `cloudflared` | Cloudflare Tunnel 代理 |

---

## 📌 環境變數（.env）

```env
# 資料庫
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/caloscan

# JWT
JWT_SECRET=your-256-bit-secret

# MiniMax AI（https://api.minimax.chat）
MINIMAX_API_KEY=your-api-key

# 管理員預設密碼（建議上線後修改）
ADMIN_DEFAULT_PASSWORD=changeme

# Cloudflare Tunnel Token（可選）
CLOUDFLARED_TUNNEL_TOKEN=your-token
```

---

## 🔑 主要 API 端點

| Method | Endpoint | 說明 |
|---|---|---|
| `POST` | `/api/auth/register` | 註冊 |
| `POST` | `/api/auth/login` | 登入 |
| `GET` | `/api/users/me` | 取得個人資料 |
| `PUT` | `/api/account/password` | 變更密碼 |
| `PUT` | `/api/account/profile` | 更新個人資料 |
| `POST` | `/api/food-logs` | 新增飲食記錄 |
| `GET` | `/api/food-logs` | 列出飲食記錄（可篩選日期）|
| `POST` | `/api/food-logs/analyze` | AI 分析圖片 |
| `GET` | `/api/food-logs/summary` | 今日熱量摘要 |
| `GET` | `/api/admin/stats` | 管理員儀表板統計 |
| `GET` | `/api/admin/users` | 管理員列出所有用戶 |
| `GET` | `/api/daily-quote` | 取得今日鼓勵語 |

---

## 🗄️ 備份與還原

### 自動備份（每日凌晨 03:00）
```bash
# 在 Mac Mini 上執行
./scripts/backup.sh
```

### 手動還原
```bash
# 停止服務
docker compose down

# 還原資料庫
docker exec -i caloscan_postgres psql -U caloscan caloscan < backups/daily/caloscan_YYYYMMDD.sql

# 重啟
docker compose up -d
```

---

## 🎨 主題切換

CaloScanAi 支援三種主題模式，儲存於瀏覽器 `localStorage`：

- **Light**：明亮白底主題
- **Dark**：深色護眼主題
- **System**：跟隨作業系統設定

CSS Variables 設計，支援任意客製化顏色。

---

## 📄 License

MIT License — 可自由使用、修改與散佈。

---

## 🙏 致謝

- [MiniMax](https://api.minimax.chat) — 提供強大的視覺 AI 辨識能力
- [Cloudflare](https://cloudflare.com) — 提供免費 Tunnel 服務
- 所有開源貢獻者