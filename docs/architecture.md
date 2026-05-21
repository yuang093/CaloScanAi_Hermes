# 系統架構藍圖 (System Architecture)

## 部署架構（Mac Mini Docker）

跟 SmartCard DB 完全相同的模式，Mac Mini 24 小時開機：

```
┌─────────────────────────────────────────────────────┐
│  Mac Mini (實體機器)                                │
│                                                     │
│  ┌──────────────┐  ┌──────────────┐               │
│  │ caloscan_    │  │ caloscan_    │               │
│  │ frontend     │  │ backend      │               │
│  │ (Next.js)    │  │ (FastAPI)    │               │
│  └──────┬───────┘  └──────┬───────┘               │
│         │                 │                        │
│         └────────┬─────────┘                        │
│                  ↓                                  │
│         ┌──────────────┐                           │
│         │ caloscan_    │                           │
│         │ postgres     │                           │
│         │ (PostgreSQL16)│                          │
│         └──────────────┘                           │
│                  │                                 │
│         ┌────────┴────────┐                        │
│         │ cloudflared    │ ←──→ Cloudflare Tunnel │
│         │ (Tunnel)       │    → 外部網域存取        │
│         └────────────────┘                        │
└─────────────────────────────────────────────────────┘
```

## 核心資料流 (Data Flow)
1. **使用者端 (Client)**
   - 拍照/上傳圖片 -> 觸發前端壓縮引擎 (`< 300KB`) -> 呼叫後端 API。
2. **後端服務 (API Layer)**
   - 接收圖片 -> 呼叫 AI Vision API 解析食物/熱量/條碼 -> 將結果回傳給前端確認。
3. **資料庫層 (Database)**
   - 寫入 `FoodLogs` -> 扣除 `Users.daily_calorie_limit` -> 更新今日剩餘額度。

## 模組劃分
- `Auth Module`: 處理註冊、登入、JWT 或 Session 驗證。
- `Vision/AI Module`: 封裝 AI API 的呼叫，負責 Prompt 組合與 JSON 結構化回應解析。
- `Admin Module`: 系統統計計算、手動/自動備份觸發器、全域帳號控管。
- `Daily Motivation Module`: 負責隨機抽取 `DailyQuotes`，確保使用者每次登入獲得不同體驗。