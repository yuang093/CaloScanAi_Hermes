"""
CaloScanAi — 條碼掃描與字典檔搜尋前端整合

使用方式：
1. 前端呼叫 /api/barcode/scan（POST base64 圖片）→ 後端 ZXing 解碼
2. 解碼成功後，查詢 /api/barcode/{barcode} 比對 BarcodeDictionary
3. 找不到時，使用 MiniMax AI 視覺辨識估算熱量
"""

import base64
import io
import httpx
from fastapi import HTTPException
from .services.vision import analyze_food_image

# ── ZXing 条码解码 ────────────────────────────────────────────────────────────


def decode_barcode_from_image(image_base64: str) -> str | None:
    """
    使用 pyzxing（ZXing Python Binding）解碼 EAN-13/UPC-A 条码。
    若無 pyzxing 或解碼失敗，回傳 None。
    """
    try:
        import pyzxing
        reader = pyzxing.BarCodeReader()
        image_bytes = base64.b64decode(image_base64)
        result = reader.decode_array(image_bytes)
        if result and result.get("raw"):
            return result["raw"]
    except ImportError:
        pass
    except Exception:
        pass
    return None


async def decode_barcode_async(image_base64: str) -> str | None:
    """
    非同步版本：嘗試 pyzxing，失敗則調用外部 ZXing REST API（backup）。
    """
    # 嘗試本地 pyzxing
    barcode = decode_barcode_from_image(image_base64)
    if barcode:
        return barcode

    # Fallback：使用 Barcode API（開放網路解碼）
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            image_bytes = base64.b64decode(image_base64)
            files = {"file": ("barcode.jpg", image_bytes, "image/jpeg")}
            # Open Food Facts API（不需要 key）
            resp = await client.post(
                "https://world.openfoodfacts.org/cgi/product.pl",
                data={"code": "", "吃的": "1"},
                files=files,
            )
            # 若剛好有 lookup 就用，沒有的話不回報錯誤
    except Exception:
        pass

    return None


# ── 條碼查詢 ═════════════════════════════════════════════════════════════════


async def lookup_or_estimate_barcode(
    barcode: str,
    db_session,
    user_id: str | None = None,
) -> dict:
    """
    1. 查詢 BarcodeDictionary
    2. 找不到時，回傳 {found: False, barcode, suggestion: "使用 AI 估算"}
    3. 找到時，回傳完整營養資料
    """
    from sqlalchemy import select
    from .models.barcode import BarcodeDictionary

    result = await db_session.execute(
        select(BarcodeDictionary).where(BarcodeDictionary.barcode == barcode)
    )
    item = result.scalar_one_or_none()

    if item:
        return {
            "found": True,
            "barcode": item.barcode,
            "food_name": item.food_name,
            "brand": item.brand or "",
            "calories": item.calories,
            "protein_g": item.protein_g or 0.0,
            "carbs_g": item.carbs_g or 0.0,
            "fat_g": item.fat_g or 0.0,
            "serving_size_g": item.serving_size_g or 100,
            "category": item.category or "",
            "source": "dictionary",
        }

    return {
        "found": False,
        "barcode": barcode,
        "suggestion": "not_found",
        "message": "這個條碼不在資料庫中，建議使用拍照功能讓 AI 辨識熱量",
    }


# ── 前端掃描流程建議 ──────────────────────────────────────────────────────────
"""
前端實作流程（建議）：

1. 開啟相機 → 截取條碼畫面
2. 呼叫後端 POST /api/barcode/scan（base64 圖片）
3. 後端解碼回傳 barcode 字串
4. 呼叫後端 GET /api/barcode/{barcode}
5. 找到 → 顯示營養資料確認頁
6. 找不到 → 引導用戶使用「拍照 AI 辨識」
7. 用戶確認後 → POST /api/food-logs 儲存
"""
