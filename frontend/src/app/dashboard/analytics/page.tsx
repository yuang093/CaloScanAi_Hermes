'use client';

/**
 * CaloScanAi — 7日飲食趨勢分析頁
 * GET /api/food-logs?start_date=7days_ago&end_date=today
 * 熱量柱狀圖（7根柱）+ 蛋白質/碳水/脂肪堆疊區域圖
 */

import { useCallback, useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, AreaChart, Area,
} from 'recharts';
import { apiGet, FoodLogResponse } from '@/lib/api';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import styles from './analytics.module.css';

interface DailyData {
  date: string;
  dateLabel: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface ApiLogEntry {
  id: string;
  food_name: string;
  calories: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  log_date: string;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
}

function getDateLabel(dateStr: string, locale: string = 'zh-TW'): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function aggregateLogs(logs: ApiLogEntry[]): DailyData[] {
  const map: Record<string, DailyData> = {};
  for (const log of logs) {
    const day = log.log_date.split('T')[0];
    if (!map[day]) {
      map[day] = { date: day, dateLabel: getDateLabel(day), calories: 0, protein: 0, carbs: 0, fat: 0 };
    }
    map[day].calories += log.calories;
    map[day].protein  += log.protein_g ?? 0;
    map[day].carbs    += log.carbs_g  ?? 0;
    map[day].fat      += log.fat_g   ?? 0;
  }
  return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
}

export default function AnalyticsPage() {
  const [data, setData] = useState<DailyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [calorieLimit, setCalorieLimit] = useState(2000);

  const fetchData = useCallback(async () => {
    try {
      const end   = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 6);

      const params = new URLSearchParams({
        start_date: formatDate(start),
        end_date:   formatDate(end),
      });
      const logs = await apiGet<ApiLogEntry[]>(`/api/food-logs?${params}`);

      // 若後端有傳使用者 limit，從 summary 端取
      try {
        const summary = await apiGet<{ limit: number }>('/api/food-logs/summary');
        if (summary?.limit) setCalorieLimit(summary.limit);
      } catch { /* ignore */ }

      setData(aggregateLogs(logs));
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const macroMax = Math.max(
    ...data.map((d) => d.protein + d.carbs + d.fat),
    1,
  );

  return (
    <div className={styles.page}>
      {/* ── Header ─────────────────────────────────────────── */}
      <div className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <a href="/dashboard" className={styles.backBtn}>← 返回</a>
          <h1 className={styles.pageTitle}>📊 分析</h1>
        </div>
        <LanguageSwitcher />
      </div>

      <div className={styles.container}>
        {loading ? (
          <div className={styles.skeleton} />
        ) : data.length === 0 ? (
          <div className={styles.empty}>
            <p>近7日尚無資料</p>
            <a href="/dashboard" className={styles.emptyLink}>開始記錄 →</a>
          </div>
        ) : (
          <>
            {/* ── 熱量柱狀圖 ───────────────────────────────── */}
            <section className={styles.chartCard}>
              <h2 className={styles.chartTitle}>每日熱量</h2>
              <div className={styles.chartWrapper}>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis
                      dataKey="dateLabel"
                      tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }}
                      axisLine={{ stroke: 'var(--color-border)' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius)',
                        fontSize: 13,
                      }}
                      formatter={(value: unknown) => [`${Number(value)} kcal`, '熱量']}
                    />
                    <ReferenceLine
                      y={calorieLimit}
                      stroke="var(--color-danger)"
                      strokeDasharray="4 4"
                      label={{ value: '目標', fill: 'var(--color-danger)', fontSize: 11, position: 'insideTopRight' }}
                    />
                    <Bar dataKey="calories" fill="var(--color-primary)" radius={[4, 4, 0, 0]} name="熱量" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* ── 三大營養素堆疊圖 ─────────────────────────── */}
            <section className={styles.chartCard}>
              <h2 className={styles.chartTitle}>蛋白質 / 碳水 / 脂肪 (g)</h2>
              <div className={styles.chartWrapper}>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis
                      dataKey="dateLabel"
                      tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }}
                      axisLine={{ stroke: 'var(--color-border)' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius)',
                        fontSize: 13,
                      }}
                      formatter={(value: unknown, name: unknown) => [`${Number(value).toFixed(1)} g`, String(name)]}
                    />
                    <Area
                      type="monotone"
                      dataKey="protein"
                      stackId="1"
                      stroke="#4ade80"
                      fill="#4ade80"
                      fillOpacity={0.7}
                      name="蛋白質"
                    />
                    <Area
                      type="monotone"
                      dataKey="carbs"
                      stackId="1"
                      stroke="#60a5fa"
                      fill="#60a5fa"
                      fillOpacity={0.7}
                      name="碳水"
                    />
                    <Area
                      type="monotone"
                      dataKey="fat"
                      stackId="1"
                      stroke="#f87171"
                      fill="#f87171"
                      fillOpacity={0.7}
                      name="脂肪"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className={styles.legend}>
                <span className={styles.legendItem}><i style={{ background: '#4ade80' }} />蛋白質</span>
                <span className={styles.legendItem}><i style={{ background: '#60a5fa' }} />碳水</span>
                <span className={styles.legendItem}><i style={{ background: '#f87171' }} />脂肪</span>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}