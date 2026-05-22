# CaloScanAi 資料庫備份策略

## 現況

- **部署架構**：Mac Mini 24 小時開機，Docker Compose（PostgreSQL + Backend + Frontend + Cloudflared Tunnel）
- **外部 URL**：`http://calo_h.yuang093.cc/`（Cloudflare Tunnel）
- **資料庫**：PostgreSQL 16，資料掛在 `volumes/pg_data/`

---

## 備份頻率與方式

### 每日自動備份（建議 cron：凌晨 03:00）

```bash
# 備份資料庫（SQL 格式，可攜性高）
docker exec caloscan_postgres pg_dump -U caloscan caloscan > backups/daily/caloscan_$(date +%Y%m%d).sql

# 備份上傳檔案
tar -czf backups/daily/caloscan_uploads_$(date +%Y%m%d).tar.gz volumes/uploads/
```

### 每週完整備份（建議 cron：週日 04:00）

```bash
# 一次性完整備份（資料庫 + 檔案 + Docker Compose 配置）
tar -czf backups/weekly/caloscan_full_$(date +%Y%m%d).tar.gz \
  backups/daily/ \
  volumes/pg_data/ \
  volumes/uploads/ \
  docker-compose.yml \
  .env
```

### 資料庫多版本保留

| 保留策略 | 位置 |
|---|---|
| 每日備份：最近 7 天 | `backups/daily/` |
| 每週備份：最近 4 週 | `backups/weekly/` |
| 每月備份：最近 12 個月 | `backups/monthly/` |

---

## 異地備份（雲端上傳）

### GitHub（適用於小於 10GB）

```bash
# 每日深夜 commit 到專屬備份 repo（不在主專案 repo）
cd backups
git add .
git commit -m "backup: $(date +%Y%m%d)"
git push origin main
```

### Wasabi / Backblaze B2（推薦，冷備便宜 $0.007/GB）

```bash
# 安裝 rclone
brew install rclone

# 設定 rclone.conf（只需做一次）
rclone config
# Choose: s3 provider, Wasabi/Backblaze, endpoint, access_key, secret

# 上傳（每日）
rclone copy backups/daily/ wasabi:caloscan-backups/daily/ --quiet
rclone copy backups/weekly/ wasabi:caloscan-backups/weekly/ --quiet
```

### Vercel Postgres（若未來遷移到 Vercel）

Vercel 內建每日快照，但需注意：
- 免費版不保證最大保留天數
- 建議自行 `pg_dump` 拉出來備份

---

## 還原程序

### 從每日備份還原

```bash
# 停止服務
docker compose down

# 還原資料庫
docker exec -i caloscan_postgres psql -U caloscan caloscan < backups/daily/caloscan_YYYYMMDD.sql

# 還原檔案
tar -xzf backups/daily/caloscan_uploads_YYYYMMDD.tar.gz -C volumes/

# 重啟服務
docker compose up -d
```

### 從完整備份還原

```bash
docker compose down
tar -xzf backups/weekly/caloscan_full_YYYYMMDD.tar.gz
# 替換 volumes/pg_data/ 和 docker-compose.yml
docker compose up -d
```

---

## 災難復原計畫（DRP）

| 情境 | RTO（恢復時間目標）| RPO（資料丟失容忍）| 做法 |
|---|---|---|---|
| 硬碟損壞 | 4 小時 | 1 天 | 每週完整備份存在外接硬碟 |
| Mac Mini 不可抗力 | 24 小時 | 1 天 | 雲端備份（Wasabi）+ Vercel 緊急部署 |
| 資料庫誤刪 | 2 小時 | 1 小時 | 每小時增量備份（可選） |
| 駭客/勒索軟體 | 48 小時 | 1 天 | 離線備份（外接硬碟）+ 不可變備份（WORM） |

---

## 備份驗證（重要！）

每次備份後，自動驗證：

```bash
# 驗證 SQL 備份檔完整性
pg_restore --dbname=caloscan --check --quiet backups/daily/caloscan_latest.sql

# 驗證壓縮檔完整性
tar -tzf backups/daily/caloscan_uploads_latest.tar.gz > /dev/null

# 發送通知到 Telegram（可選）
curl -s "https://api.telegram.org/bot$TG_BOT_TOKEN/sendMessage" \
  -d "chat_id=$TG_CHAT_ID" \
  -d "text=✅ CaloScanAi 備份完成：$(date '+%Y-%m-%d %H:%M')"
```

---

## 自動化腳本

現有腳本：`scripts/backup.sh`（已具備每日備份 + 清理 30 天前舊檔）

建議改進方向：
1. 加入 `/backups/daily/` `/backups/weekly/` 分層
2. 加入 `pg_restore --check` 驗證
3. 加入 Telegram 通知鉤子
4. 加入 rclone 雲端上傳

---

## 總結

| 備份層 | 頻率 | 保留 | 位置 |
|---|---|---|---|
| 每日 SQL | 每天 03:00 | 7 天 | `backups/daily/` |
| 每週完整 | 週日 04:00 | 4 週 | `backups/weekly/` |
| 雲端 | 每天 | 30 天 | Wasabi / Backblaze B2 |
| 離線 | 每月 | 12 個月 | 外接硬碟 |

**最低需求**：每日 SQL 備份 + 雲端上傳，確保持續有新版本異地保存。