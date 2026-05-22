'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiGet, apiPostForm, FoodLogResponse, DailySummary, AnalyzeResult } from '@/lib/api';
import styles from './dashboard.module.css';

export default function DashboardPage() {
  // ── State ─────────────────────────────────────────────────────────────────────
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [todayLogs, setTodayLogs] = useState<FoodLogResponse[]>([]);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);

  // 上傳与分析状态
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeResult, setAnalyzeResult] = useState<AnalyzeResult | null>(null);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Fetch ────────────────────────────────────────────────────────────────────
  const fetchSummary = useCallback(async () => {
    try {
      const data = await apiGet<DailySummary>('/api/food-logs/summary');
      setSummary(data);
    } catch {
      // ignore
    } finally {
      setLoadingSummary(false);
    }
  }, []);

  const fetchTodayLogs = useCallback(async () => {
    try {
      const data = await apiGet<FoodLogResponse[]>('/api/food-logs/today');
      setTodayLogs(data);
    } catch {
      // ignore
    } finally {
      setLoadingLogs(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
    fetchTodayLogs();
  }, [fetchSummary, fetchTodayLogs]);

  // ── 圖片選擇 ────────────────────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setAnalyzeResult(null);
    setAnalyzeError(null);
    setSaveSuccess(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setAnalyzeResult(null);
      setAnalyzeError(null);
      setSaveSuccess(false);
    }
  };

  // ── 分析圖片 ──────────────────────────────────────────────────────────────
  const handleAnalyze = async () => {
    if (!selectedFile) return;
    setAnalyzing(true);
    setAnalyzeError(null);
    setAnalyzeResult(null);

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      const result = await apiPostForm<AnalyzeResult>('/api/food-logs/analyze', formData);
      setAnalyzeResult(result);
    } catch (err: unknown) {
      setAnalyzeError(err instanceof Error ? err.message : '分析失敗，請稍後再試');
    } finally {
      setAnalyzing(false);
    }
  };

  // ── 確認儲存 ──────────────────────────────────────────────────────────────
  const handleConfirmSave = async () => {
    if (!analyzeResult || !selectedFile) return;
    setSaving(true);

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('food_name', analyzeResult.food_name);
      formData.append('calories', String(analyzeResult.calories));
      if (analyzeResult.protein_g !== undefined) {
        formData.append('protein_g', String(analyzeResult.protein_g));
      }
      if (analyzeResult.carbs_g !== undefined) {
        formData.append('carbs_g', String(analyzeResult.carbs_g));
      }
      if (analyzeResult.fat_g !== undefined) {
        formData.append('fat_g', String(analyzeResult.fat_g));
      }

      await apiPostForm<FoodLogResponse>('/api/food-logs', formData);

      setSaveSuccess(true);
      setSelectedFile(null);
      setPreviewUrl(null);
      setAnalyzeResult(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      // 重新整理資料
      fetchSummary();
      fetchTodayLogs();
    } catch (err: unknown) {
      setAnalyzeError(err instanceof Error ? err.message : '儲存失敗');
    } finally {
      setSaving(false);
    }
  };

  // ── 取消 ────────────────────────────────────────────────────────────────────
  const handleCancel = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setAnalyzeResult(null);
    setAnalyzeError(null);
    setSaveSuccess(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── 進度條顏色 ────────────────────────────────────────────────────────────
  const getProgressColor = (pct: number) => {
    if (pct >= 100) return 'var(--color-danger)';
    if (pct >= 80) return 'var(--color-warning)';
    return 'var(--color-success)';
  };

  return (
    <div className={styles.container}>
      {/* ── 熱量進度條 ─────────────────────────────────────────────── */}
      <section className={styles.summaryCard}>
        <h2 className={styles.cardTitle}>今日熱量</h2>
        {loadingSummary ? (
          <div className={styles.skeleton} />
        ) : summary ? (
          <div className={styles.calorieBlock}>
            <div className={styles.calorieNumbers}>
              <span className={styles.eaten}>{summary.total_calories}</span>
              <span className={styles.sep}>/</span>
              <span className={styles.limit}>{summary.limit} kcal</span>
            </div>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{
                  width: `${Math.min(summary.percentage, 100)}%`,
                  backgroundColor: getProgressColor(summary.percentage),
                }}
              />
            </div>
            <div className={styles.remaining}>
              {summary.remaining >= 0 ? (
                <>還可攝取 <strong>{summary.remaining}</strong> kcal</>
              ) : (
                <span className={styles.over}>已超標 {Math.abs(summary.remaining)} kcal</span>
              )}
            </div>
          </div>
        ) : (
          <p className={styles.empty}>無法載入熱量摘要</p>
        )}
      </section>

      {/* ── 快速上傳區 ─────────────────────────────────────────────── */}
      <section className={styles.uploadCard}>
        <h2 className={styles.cardTitle}>拍照上傳分析</h2>

        {!selectedFile ? (
          <div
            className={styles.dropzone}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className={styles.dropzoneIcon}>📷</div>
            <p>點擊或拖曳圖片上傳</p>
            <span>支援 JPG / PNG / WEBP</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </div>
        ) : (
          <div className={styles.previewArea}>
            {/* 圖片預覽 */}
            {previewUrl && (
              <div className={styles.previewImage}>
                <img src={previewUrl} alt="預覽" />
              </div>
            )}

            {/* 分析結果或操作區 */}
            {analyzeResult ? (
              <div className={styles.resultBlock}>
                <h3>{analyzeResult.food_name}</h3>
                <div className={styles.resultMacros}>
                  <span>🔥 {analyzeResult.calories} kcal</span>
                  {analyzeResult.protein_g !== undefined && (
                    <span>蛋白質 {analyzeResult.protein_g}g</span>
                  )}
                  {analyzeResult.carbs_g !== undefined && (
                    <span>碳水 {analyzeResult.carbs_g}g</span>
                  )}
                  {analyzeResult.fat_g !== undefined && (
                    <span>脂肪 {analyzeResult.fat_g}g</span>
                  )}
                </div>
                {analyzeResult.confidence && (
                  <p className={styles.confidence}>置信度：{(analyzeResult.confidence * 100).toFixed(0)}%</p>
                )}
                {saveSuccess ? (
                  <div className={styles.successMsg}>✅ 已儲存至今日飲食記錄</div>
                ) : (
                  <div className={styles.actionRow}>
                    <button
                      className={styles.btnConfirm}
                      onClick={handleConfirmSave}
                      disabled={saving}
                    >
                      {saving ? '儲存中…' : '✅ 確認新增'}
                    </button>
                    <button className={styles.btnCancel} onClick={handleCancel}>
                      取消
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.actionRow}>
                <button
                  className={styles.btnAnalyze}
                  onClick={handleAnalyze}
                  disabled={analyzing}
                >
                  {analyzing ? '分析中…' : '🔍 AI 分析'}
                </button>
                <button className={styles.btnCancel} onClick={handleCancel}>
                  取消
                </button>
              </div>
            )}

            {analyzeError && <p className={styles.errorMsg}>{analyzeError}</p>}
          </div>
        )}
      </section>

      {/* ── 今日飲食記錄列表 ─────────────────────────────────────────── */}
      <section className={styles.logsCard}>
        <div className={styles.logsHeader}>
          <h2 className={styles.cardTitle}>今日飲食記錄</h2>
          <a href="/dashboard/history" className={styles.historyLink}>
            查看全部 →
          </a>
        </div>

        {loadingLogs ? (
          <div className={styles.skeleton} />
        ) : todayLogs.length === 0 ? (
          <p className={styles.empty}>今天還沒有記錄，試著上傳一張食物照片吧！</p>
        ) : (
          <ul className={styles.logList}>
            {todayLogs.map((log) => (
              <li key={log.id} className={styles.logItem}>
                <div className={styles.logInfo}>
                  <span className={styles.logFood}>{log.food_name}</span>
                  <span className={styles.logCalorie}>{log.calories} kcal</span>
                </div>
                <span className={styles.logSource}>{log.source}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}