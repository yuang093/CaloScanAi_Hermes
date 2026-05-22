"""
CaloScanAi — 圖片壓縮模組
將上傳圖片壓縮至 300KB 以內，最大邊 1200px，JPEG 品質逐步遞減。
"""

import io
import os
from PIL import Image
from fastapi import UploadFile, HTTPException


MAX_SIZE_PX = 1200
MAX_SIZE_KB = 300
INITIAL_QUALITY = 85
MIN_QUALITY = 40


def resize_image(img: Image.Image) -> Image.Image:
    """等比縮圖，只在圖片超過 MAX_SIZE_PX 時才縮。"""
    width, height = img.size
    if width <= MAX_SIZE_PX and height <= MAX_SIZE_PX:
        return img

    if width > height:
        new_width = MAX_SIZE_PX
        new_height = int(height * MAX_SIZE_PX / width)
    else:
        new_height = MAX_SIZE_PX
        new_width = int(width * MAX_SIZE_PX / height)

    return img.resize((new_width, new_height), Image.LANCZOS)


async def compress_image(file: UploadFile) -> bytes:
    """
    讀取上傳檔案，逐步壓縮直到小於 MAX_SIZE_KB。
    返回壓縮後的 JPEG 位元組。
    """
    try:
        content = await file.read()
        img = Image.open(io.BytesIO(content))

        # 轉 RGB（去除 RGBA 之類的問題）
        if img.mode in ("RGBA", "P", "LA"):
            img = img.convert("RGB")

        img = resize_image(img)

        quality = INITIAL_QUALITY
        output = io.BytesIO()

        while quality >= MIN_QUALITY:
            output.seek(0)
            output.truncate()
            img.save(output, format="JPEG", quality=quality, optimize=True)
            size_kb = len(output.getvalue()) / 1024

            if size_kb <= MAX_SIZE_KB:
                return output.getvalue()

            quality -= 10

        # 到達最低品質仍未達標，直接返回（避免无限循环）
        output.seek(0)
        return output.getvalue()

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"圖片處理失敗：{str(e)}")


def compress_bytes(content: bytes) -> bytes:
    """
    直接對 JPEG 位元組進行壓縮（不改尺寸，只降品質）。
    """
    try:
        img = Image.open(io.BytesIO(content))
        if img.mode in ("RGBA", "P", "LA"):
            img = img.convert("RGB")

        quality = INITIAL_QUALITY
        output = io.BytesIO()

        while quality >= MIN_QUALITY:
            output.seek(0)
            output.truncate()
            img.save(output, format="JPEG", quality=quality, optimize=True)
            size_kb = len(output.getvalue()) / 1024

            if size_kb <= MAX_SIZE_KB:
                return output.getvalue()

            quality -= 10

        return output.getvalue()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"圖片壓縮失敗：{str(e)}")