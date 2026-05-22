"""
CaloScanAi — MiniMax AI Vision 食物辨識 API
"""

import os
import base64
import httpx
from fastapi import HTTPException

MINIMAX_API_KEY = os.getenv("MINIMAX_API_KEY")
MINIMAX_BASE_URL = "https://api.minimax.chat/v1"


async def analyze_food_image(image_base64: str) -> dict:
    """
    發送圖片到 MiniMax AI，解析食物名稱、熱量、巨量營養素。
    返回結構：{ food_name, calories, protein_g, carbs_g, fat_g, confidence }
    """
    if not MINIMAX_API_KEY:
        raise HTTPException(status_code=500, detail="MINIMAX_API_KEY 未設定")

    prompt = """你是一個專業的營養師。請分析這張食物圖片，回傳以下 JSON 格式（只回 JSON，不要其他文字）：

{
  "food_name": "食物名稱",
  "calories": 數字（單位：大卡）,
  "protein_g": 數字（單位：公克）,
  "carbs_g": 數字（單位：公克）,
  "fat_g": 數字（單位：公克）,
  "confidence": 0到1之間的小數,
  "unit": "每100公克" 或 "每份"
}

請根據圖片中食物的實際份量估算熱量，不要只給每100公克的數值。"""

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{MINIMAX_BASE_URL}/text/chatcompletion_v2",
                headers={
                    "Authorization": f"Bearer {MINIMAX_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "MiniMax-Text-01",
                    "messages": [
                        {
                            "role": "user",
                            "content": [
                                {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_base64}"}},
                                {"type": "text", "text": prompt},
                            ],
                        }
                    ],
                    "max_tokens": 512,
                },
            )
            result = response.json()

            if "choices" not in result or len(result["choices"]) == 0:
                raise HTTPException(status_code=502, detail=f"MiniMax 回應異常：{result}")

            raw = result["choices"][0]["message"]["content"]
            import json as _json
            data = _json.loads(raw.strip())
            return {
                "food_name": data.get("food_name", "未知食物"),
                "calories": int(data.get("calories", 0)),
                "protein_g": float(data.get("protein_g", 0)),
                "carbs_g": float(data.get("carbs_g", 0)),
                "fat_g": float(data.get("fat_g", 0)),
                "confidence": float(data.get("confidence", 0.5)),
                "unit": data.get("unit", "每100公克"),
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