"""
CaloScanAi — MiniMax AI Vision 食物辨識 API
"""

import os
import base64
import httpx
from fastapi import HTTPException

MINIMAX_API_KEY = os.getenv("MINIMAX_API_KEY")
MINIMAX_BASE_URL = "https://api.minimax.io/v1"  # 全球版
MINIMAX_VLM_ENDPOINT = f"{MINIMAX_BASE_URL}/coding_plan/vlm"
MINIMAX_VL_MODEL = "MiniMax-VL-01"

FOOD_SYSTEM_PROMPT = """你是一個專業的營養師。請分析這張食物圖片，並嚴格按照以下 JSON 格式回傳。只輸出 JSON，不要其他任何文字解釋。

預期回傳格式：
{
  "food_name": "食物名稱",
  "calories": 數字（單位：大卡）,
  "protein_g": 數字（單位：公克）,
  "carbs_g": 數字（單位：公克）,
  "fat_g": 數字（單位：公克）,
  "confidence": 0到1之間的小數,
  "unit": "每100公克" 或 "每份"
}

請根據圖片中食物的實際份量估算熱量。"""


def _extract_json(text: str) -> dict:
    """Strip markdown fences and parse JSON."""
    import json as _json
    text = text.strip()
    if text.startswith("```"):
        parts = text.split("```")
        if len(parts) >= 2:
            text = parts[1]
            if text.startswith("json"):
                text = text[4:]
            text = text.strip()
    return _json.loads(text)


async def analyze_food_image(image_base64: str) -> dict:
    """
    發送圖片到 MiniMax AI Vision（MiniMax-VL-01），解析食物名稱、熱量、巨量營養素。
    返回結構：{ food_name, calories, protein_g, carbs_g, fat_g, confidence, unit }
    """
    if not MINIMAX_API_KEY:
        raise HTTPException(status_code=500, detail="MINIMAX_API_KEY 未設定")

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                MINIMAX_VLM_ENDPOINT,
                headers={
                    "Authorization": f"Bearer {MINIMAX_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": MINIMAX_VL_MODEL,
                    "prompt": FOOD_SYSTEM_PROMPT,
                    "image_url": f"data:image/jpeg;base64,{image_base64}",
                },
            )
            response.raise_for_status()
            result = response.json()

            text = result.get("content", "")
            if not text:
                raise HTTPException(status_code=502, detail="MiniMax 回應空白")

            parsed = _extract_json(text)
            return {
                "food_name": parsed.get("food_name", "未知食物"),
                "calories": int(parsed.get("calories", 0)),
                "protein_g": float(parsed.get("protein_g", 0)),
                "carbs_g": float(parsed.get("carbs_g", 0)),
                "fat_g": float(parsed.get("fat_g", 0)),
                "confidence": float(parsed.get("confidence", 0.5)),
                "unit": parsed.get("unit", "每100公克"),
            }

    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="MiniMax API 連線逾時")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"MiniMax API 錯誤：{str(e)}")


async def analyze_food_image_url(image_url: str) -> dict:
    """
    從 URL 下載圖片後發送給 MiniMax AI 分析。
    """
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.get(image_url)
            resp.raise_for_status()
            image_b64 = base64.b64encode(resp.content).decode("utf-8")
            return await analyze_food_image(image_b64)
    except httpx.HTTPError as e:
        raise HTTPException(status_code=400, detail=f"圖片下載失敗：{str(e)}")