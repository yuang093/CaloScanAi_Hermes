'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiGet, apiDelete, FoodLogResponse } from '@/lib/api';
import styles from './history.module.css';

export default function HistoryPage() {
  // ── State ─────────────────────────────────────────────────────────────────────
  const [logs, setLogs] = useState<FoodLogResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 搜尋條件
  const [keyword, setKeyword] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searching, setSearching] = useState(false);

  // 刪除狀態
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ── Fetch ────────────────────────────────────────────────────────────────────
  const fetchLogs = useCallback(async (params?: { keyword?: string; start_date?: string; end_date?: string }) => {
    setLoading(true);
    setError(null);
    try {
      const searchParams = new URLSearchParams();
      if (params?.keyword) searchParams.set('keyword', params.keyword);
      if (params?.start_date) searchParams.set('start_date', params.start_date);
      if (params?.end_date) searchParams.set('end_date', params.end_date);

      const query = searchParams.toString();
      const path = `/api/food-logs${query ? `?${query}` : ''}`;
      const data = await apiGet<FoodLogResponse[]>(path);
      setLogs(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '載入失敗');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // ── 搜尋 ────────────────────────────────────────────────────────────────────
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearching(true);
    fetchLogs({
      keyword: keyword || undefined,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
    }).finally(() => setSearching(false));
  };

  const handleClear = () => {
    setKeyword('');
    setStartDate('');
    setEndDate('');
    fetchLogs();
  };

  // ── 刪除 ────────────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!confirm('確定要刪除這筆記錄嗎？')) return;
    setDeletingId(id);
    try {
      await apiDelete(`/api/food-logs/${id}`);
      setLogs((prev) => prev.filter((log) => log.id !== id));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : '刪除失敗');
    } finally {
      setDeletingId(null);
    }
  };

  // ── format ──────────────────────────────────────────────────────────────────
  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  return (
    <div className={styles.container}>
      {/* ── 頁首 ───────────────────────────────────────────────── */}
      <div className={styles.header}>
        <h1 className={styles.pageTitle}>歷史記錄</h1>
        <a href="/dashboard" className={styles.backLink}>← 返回首頁</a>
      </div>

      {/* ── 搜尋表單 ─────────────────────────────────────────────── */}
      <form className={styles.searchForm} onSubmit={handleSearch}>
        <div className={styles.searchRow}>
          <input
            type="text"
            placeholder="搜尋食物名稱…"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className={styles.searchInput}
          />
          <button type="submit" className={styles.btnSearch} disabled={searching}>
            {searching ? '搜尋中…' : '🔍 搜尋'}
          </button>
          <button type="button" className={styles.btnClear} onClick={handleClear}>
            清除
          </button>
        </div>
        <div className={styles.dateRow}>
          <label>
            起始日期
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={styles.dateInput}
            />
          </label>
          <label>
            結束日期
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={styles.dateInput}
            />
          </label>
        </div>
      </form>

      {/* ── 載入/錯誤 ─────────────────────────────────────────────── */}
      {loading && <div className={styles.skeleton} />}
      {error && <p className={styles.errorMsg}>{error}</p>}

      {/* ── 列表 ─────────────────────────────────────────────────── */}
      {!loading && !error && (
        <>
          {logs.length === 0 ? (
            <p className={styles.empty}>找不到符合條件的記錄</p>
          ) : (
            <>
              <p className={styles.resultCount}>共 {logs.length} 筆記錄</p>
              <ul className={styles.logList}>
                {logs.map((log) => (
                  <li key={log.id} className={styles.logItem}>
                    <div className={styles.logMain}>
                      <div className={styles.logInfo}>
                        <span className={styles.logFood}>{log.food_name}</span>
                        <span className={styles.logMeta}>
                          {formatDate(log.log_date)} · {log.calories} kcal
                          {log.protein_g !== undefined && (
                            <> · 蛋白質 {log.protein_g}g</>
                          )}
                        </span>
                      </div>
                      <span className={`${styles.logSource} ${styles[log.source] || ''}`}>
                        {log.source}
                      </span>
                    </div>
                    <button
                      className={styles.btnDelete}
                      onClick={() => handleDelete(log.id)}
                      disabled={deletingId === log.id}
                      title="刪除"
                    >
                      {deletingId === log.id ? '...' : '🗑️'}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </div>
  );
}