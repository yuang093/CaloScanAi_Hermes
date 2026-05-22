/**
 * CaloScanAi — API 統一封裝
 * 所有對後端的 HTTP 請求都透過這裡，
 * 自動附加 JWT cookie、解析回應、拋出錯誤。
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * 解析回應為 JSON，錯誤時拋出具體訊息
 */
async function parseResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body = await res.json().catch(() => ({}));
      message = body.detail || body.message || message;
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

/**
 * GET 請求
 * @param path — 例如 '/auth/me'
 * @param options — 可選 fetch 參數
 */
export async function apiGet<T = unknown>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: 'include', // 攜帶 cookie
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  return parseResponse<T>(res);
}

/**
 * POST 請求（自動將 body 轉 JSON）
 */
export async function apiPost<T = unknown>(
  path: string,
  body: unknown,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    body: JSON.stringify(body),
  });
  return parseResponse<T>(res);
}

/**
 * POST 請求（FormData — 用於檔案上傳）
 * 不设 Content-Type，让浏览器自动添加 boundary
 */
export async function apiPostForm<T = unknown>(
  path: string,
  formData: FormData,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    credentials: 'include',
    ...options,
    body: formData,
  });
  return parseResponse<T>(res);
}

/**
 * DELETE 請求
 */
export async function apiDelete<T = unknown>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  return parseResponse<T>(res);
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface FoodLogResponse {
  id: string;
  user_id: string;
  image_url: string | null;
  food_name: string;
  calories: number;
  source: string;
  log_date: string;
  created_at: string;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
}

export interface DailySummary {
  date: string;
  total_calories: number;
  limit: number;
  remaining: number;
  percentage: number;
}

export interface AnalyzeResult {
  food_name: string;
  calories: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  confidence?: number;
  message?: string;
}