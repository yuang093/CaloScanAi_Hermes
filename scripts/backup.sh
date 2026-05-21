#!/bin/bash
# CaloScanAi 備份腳本
# 用法：./backup.sh

set -e

DATE=$(date +%Y-%m-%d_%H%M%S)
BACKUP_DIR="$(dirname "$0")/../backups"
PROJECT_DIR="$(dirname "$0")/.."

mkdir -p "$BACKUP_DIR"

echo "📦 開始備份 CaloScanAi..."

# 1. 備份資料庫
echo "  → 備份 PostgreSQL..."
docker exec caloscan_postgres pg_dump -U caloscan caloscan > "$BACKUP_DIR/caloscan_db_$DATE.sql"
echo "     ✅ 資料庫備份完成：caloscan_db_$DATE.sql"

# 2. 備份上傳檔案
echo "  → 備份上傳檔案..."
tar -czf "$BACKUP_DIR/caloscan_uploads_$DATE.tar.gz" -C "$PROJECT_DIR/volumes" uploads
echo "     ✅ 圖片備份完成：caloscan_uploads_$DATE.tar.gz"

# 3. 清理舊備份（保留最近 30 天）
echo "  → 清理 30 天前舊備份..."
find "$BACKUP_DIR" -name "caloscan_*" -mtime +30 -delete
echo "     ✅ 清理完成"

echo ""
echo "📋 備份總結："
ls -lh "$BACKUP_DIR"/caloscan_db_$DATE.sql "$BACKUP_DIR"/caloscan_uploads_$DATE.tar.gz
echo ""
echo "✅ 備份完成！"