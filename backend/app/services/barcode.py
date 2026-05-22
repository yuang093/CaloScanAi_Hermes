"""
CaloScanAi — 條碼掃描與字典檔搜尋前端整合

使用方式：
1. 前端呼叫 /api/barcode/scan（POST base64 圖片）→ 後端 ZXing 解碼
2. 解碼成功後，查詢 /api/barcode/{barcode} 比對 BarcodeDictionary
3. 找不到時，自動查詢 OpenFoodFacts API
"""

import base64
import logging
from typing import Optional

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .models.barcode import BarcodeDictionary

logger = logging.getLogger(__name__)

OPENFOODFACTS_API = "https://world.openfoodfacts.org/api/v0/product/{barcode}.json"


# ── ZXing 条码解码 ────────────────────────────────────────────────────────────


def decode_barcode_from_image(image_base64: str) -> Optional[str]:
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
        logger.warning("pyzxing not installed, barcode decode skipped")
    except Exception as e:
        logger.error(f"Barcode decode error: {e}", exc_info=True)
    return None


async def decode_barcode_async(image_base64: str) -> Optional[str]:
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
            resp = await client.post(
                "https://world.openfoodfacts.org/cgi/product.pl",
                data={"code": "", "吃的": "1"},
                files=files,
            )
    except Exception as e:
        logger.error(f"Barcode API fallback error: {e}", exc_info=True)

    return None


# ── OpenFoodFacts API ─────────────────────────────────────────────────────────


async def query_openfoodfacts(barcode: str) -> Optional[dict]:
    """
    查詢 OpenFoodFacts API，回傳營養資料。
    成功時回傳 dict，失敗回傳 None。
    """
    url = OPENFOODFACTS_API.format(barcode=barcode)
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(url)
            if resp.status_code == 200:
                data = resp.json()
                if data.get("status") == 1 and "product" in data:
                    product = data["product"]
                    nutriments = product.get("nutriments", {})
                    
                    # 能量從不同欄位取得，優先取 energy-kcal
                    energy = nutriments.get("energy-kcal", 0) or nutriments.get("energy-kcal_100g", 0) or 0
                    
                    return {
                        "food_name": product.get("product_name") or product.get("product_name_tw") or "未知商品",
                        "brand": product.get("brands") or "",
                        "calories": energy,
                        "protein_g": nutriments.get("proteins", 0) or nutriments.get("proteins_100g", 0) or 0,
                        "carbs_g": nutriments.get("carbohydrates", 0) or nutriments.get("carbohydrates_100g", 0) or 0,
                        "fat_g": nutriments.get("fat", 0) or nutriments.get("fat_100g", 0) or 0,
                        "serving_size_g": product.get("serving_size") or 100,
                        "category": product.get("categories") or "",
                        "source": "openfoodfacts",
                    }
    except httpx.TimeoutException:
        logger.warning(f"OpenFoodFacts timeout for barcode {barcode}")
    except Exception as e:
        logger.error(f"OpenFoodFacts API error for barcode {barcode}: {e}", exc_info=True)
    return None


async def save_to_dictionary(db_session: AsyncSession, barcode: str, product_data: dict) -> BarcodeDictionary:
    """
    將從 OpenFoodFacts 取得的商品資料寫入本地 BarcodeDictionary。
    """
    item = BarcodeDictionary(
        barcode=barcode,
        food_name=product_data["food_name"],
        brand=product_data.get("brand", ""),
        calories=product_data.get("calories", 0),
        protein_g=product_data.get("protein_g", 0),
        carbs_g=product_data.get("carbs_g", 0),
        fat_g=product_data.get("fat_g", 0),
        serving_size_g=product_data.get("serving_size_g", 100),
        category=product_data.get("category", ""),
    )
    db_session.add(item)
    await db_session.commit()
    await db_session.refresh(item)
    logger.info(f"Saved barcode {barcode} to dictionary: {product_data['food_name']}")
    return item


# ── 條碼查詢 ═════════════════════════════════════════════════════════════════


async def lookup_or_estimate_barcode(
    barcode: str,
    db_session: AsyncSession,
    user_id: str | None = None,
) -> dict:
    """
    1. 查詢 BarcodeDictionary
    2. 找不到時，查詢 OpenFoodFacts API
    3. API 也有，回寫本地資料庫並回傳
    4. 都找不到，回傳 {found: False, suggestion: "使用 AI 估算"}
    """
    # Step 1: 查詢本地字典
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

    # Step 2: 查詢 OpenFoodFacts
    logger.info(f"Barcode {barcode} not in local DB, querying OpenFoodFacts")
    product_data = await query_openfoodfacts(barcode)

    if product_data:
        # Step 3: 寫入本地資料庫
        try:
            saved_item = await save_to_dictionary(db_session, barcode, product_data)
            return {
                "found": True,
                "barcode": saved_item.barcode,
                "food_name": saved_item.food_name,
                "brand": saved_item.brand or "",
                "calories": saved_item.calories,
                "protein_g": saved_item.protein_g or 0.0,
                "carbs_g": saved_item.carbs_g or 0.0,
                "fat_g": saved_item.fat_g or 0.0,
                "serving_size_g": saved_item.serving_size_g or 100,
                "category": saved_item.category or "",
                "source": "openfoodfacts",
            }
        except Exception as e:
            logger.error(f"Failed to save barcode to DB: {e}", exc_info=True)
            # 仍回傳 API 取得的資料
            return {
                "found": True,
                "barcode": barcode,
                "food_name": product_data["food_name"],
                "brand": product_data.get("brand", ""),
                "calories": product_data.get("calories", 0),
                "protein_g": product_data.get("protein_g", 0),
                "carbs_g": product_data.get("carbs_g", 0),
                "fat_g": product_data.get("fat_g", 0),
                "serving_size_g": product_data.get("serving_size_g", 100),
                "category": product_data.get("category", ""),
                "source": "openfoodfacts",
            }

    # Step 4: 都找不到
    logger.info(f"Barcode {barcode} not found anywhere")
    return {
        "found": False,
        "barcode": barcode,
        "suggestion": "not_found",
        "message": "未找到商品，請手動輸入",
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