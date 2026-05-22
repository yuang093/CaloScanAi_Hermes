"""
Backup / Restore API
手動備份 + 自動備份（cron 觸發） + 還原 + 下載備份檔
"""

import os
import shutil
import subprocess
import gzip
from datetime import datetime
from urllib.parse import urlparse

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer
from pydantic import BaseModel
from sqlalchemy import select
from uuid import UUID

from ..core.config import get_settings
from ..core.database import get_db
from ..models.user import User
from ..services.auth import decode_token

router = APIRouter(prefix="/api/admin/backup", tags=["Admin", "Backup"])
security = HTTPBearer()
settings = get_settings()

BACKUP_DIR = os.getenv("BACKUP_DIR", "/tmp/backups")
os.makedirs(BACKUP_DIR, exist_ok=True)


# ── Helpers ───────────────────────────────────────────────────────────────────

def parse_pg_url(url: str) -> dict:
    """解析 postgresql://user:pass@host:port/db → dict"""
    u = urlparse(url.replace("postgresql+asyncpg://", "postgresql://"))
    return {
        "user": u.username or "postgres",
        "pass": u.password or "",
        "host": u.hostname or "localhost",
        "port": u.port or 5432,
        "db": u.path.lstrip("/") or "caloscan",
    }


def run_pg(cmd: str, sql_path: str | None = None) -> subprocess.CompletedProcess:
    """包裝 pg_dump / psql 指令"""
    pg = parse_pg_url(settings.database_url)
    env = os.environ.copy()
    env["PGPASSWORD"] = pg["pass"]

    full_cmd = [cmd, "-U", pg["user"], "-h", pg["host"], "-p", str(pg["port"]), "-d", pg["db"]]
    if sql_path:
        full_cmd += ["-f", sql_path]

    return subprocess.run(full_cmd, env=env, capture_output=True, text=True)


# ── Auth Dependency ────────────────────────────────────────────────────────────

async def get_admin_user(
    credentials: HTTPBearer = Depends(security),
    db=Depends(get_db),
) -> User:
    """驗證 JWT 並確認 admin 角色"""
    try:
        payload = decode_token(credentials.credentials)
        user_id = UUID(payload["sub"])
    except Exception:
        raise HTTPException(status_code=401, detail="無效的 Token")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user or user.role != "admin":
        raise HTTPException(status_code=403, detail="需要管理員權限")
    return user


# ── Schemas ───────────────────────────────────────────────────────────────────

class BackupFile(BaseModel):
    filename: str
    size_bytes: int
    created_at: str


class BackupListResponse(BaseModel):
    backups: list[BackupFile]


class ManualBackupResponse(BaseModel):
    success: bool
    filename: str
    size_bytes: int
    message: str


class RestoreRequest(BaseModel):
    filename: str  # e.g. "caloscanai_20250601_093000.sql.gz"


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("/", response_model=BackupListResponse)
async def list_backups():
    """列出所有可用備份檔（.sql.gz）"""
    try:
        files = []
        for fname in sorted(os.listdir(BACKUP_DIR)):
            if fname.endswith(".sql.gz"):
                fpath = os.path.join(BACKUP_DIR, fname)
                size = os.path.getsize(fpath)
                ts = datetime.fromtimestamp(os.path.getmtime(fpath)).isoformat()
                files.append(BackupFile(filename=fname, size_bytes=size, created_at=ts))
        return BackupListResponse(backups=files)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/", response_model=ManualBackupResponse)
async def trigger_backup(admin: User = Depends(get_admin_user)):
    """手動觸發一次資料庫備份（管理員限定）"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    sql_path = os.path.join(BACKUP_DIR, f"caloscanai_{timestamp}.sql")
    gz_path = os.path.join(BACKUP_DIR, f"caloscanai_{timestamp}.sql.gz")

    try:
        result = run_pg("pg_dump", sql_path)
        if result.returncode != 0:
            raise HTTPException(status_code=500, detail=f"pg_dump failed: {result.stderr}")

        with open(sql_path, "rb") as f_in:
            with gzip.open(gz_path, "wb", compresslevel=6) as f_out:
                shutil.copyfileobj(f_in, f_out)
        os.remove(sql_path)

        size = os.path.getsize(gz_path)
        return ManualBackupResponse(
            success=True,
            filename=os.path.basename(gz_path),
            size_bytes=size,
            message=f"備份成功：{os.path.basename(gz_path)}（{size:,} bytes）"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/restore")
async def restore_backup(req: RestoreRequest, admin: User = Depends(get_admin_user)):
    """還原指定備份檔（管理員限定）"""
    gz_path = os.path.join(BACKUP_DIR, req.filename)
    if not os.path.exists(gz_path):
        raise HTTPException(status_code=404, detail=f"找不到備份檔：{req.filename}")

    sql_path = gz_path.replace(".gz", "")

    try:
        with gzip.open(gz_path, "rb") as f_in:
            with open(sql_path, "wb") as f_out:
                shutil.copyfileobj(f_in, f_out)

        result = run_pg("psql", sql_path)
        os.remove(sql_path)

        if result.returncode != 0:
            raise HTTPException(status_code=500, detail=f"psql restore failed: {result.stderr}")

        return {"success": True, "message": f"已還原：{req.filename}"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/download/{filename}")
async def download_backup(filename: str, admin: User = Depends(get_admin_user)):
    """下載備份檔（管理員限定）"""
    from fastapi.responses import FileResponse

    gz_path = os.path.join(BACKUP_DIR, filename)
    if not os.path.exists(gz_path):
        raise HTTPException(status_code=404, detail=f"找不到備份檔：{filename}")
    return FileResponse(gz_path, filename=filename, media_type="application/gzip")