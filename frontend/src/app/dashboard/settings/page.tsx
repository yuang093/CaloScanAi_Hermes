'use client';

import { useState, useEffect } from 'react';
import { apiGet, apiPut } from '@/lib/api';
import styles from './settings.module.css';

interface AccountProfile {
  username: string;
  email: string;
  daily_calorie_limit: number;
  created_at: string;
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [calorieLimit, setCalorieLimit] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await apiGet<AccountProfile>('/api/account/me');
      setProfile(data);
      setCalorieLimit(String(data.daily_calorie_limit));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '載入失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    const limit = parseInt(calorieLimit, 10);
    if (isNaN(limit) || limit < 500 || limit > 10000) {
      setError('熱量目標需介於 500 ~ 10000 kcal');
      setSaving(false);
      return;
    }

    try {
      await apiPut('/api/account/profile', { daily_calorie_limit: limit });
      setSuccess(true);
      // Refresh profile data
      fetchProfile();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '儲存失敗');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.skeleton} />
        <div className={styles.skeleton} style={{ height: 120 }} />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>⚙️ 設定</h1>

      {/* 熱量目標設定 */}
      <section className={styles.card}>
        <h2 className={styles.cardTitle}>🎯 每日熱量目標</h2>
        <p className={styles.cardDesc}>
          設定您的每日熱量攝取上限，超過時儀表板會顯示提醒。
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="calorieLimit" className={styles.label}>
              熱量目標 (kcal)
            </label>
            <input
              id="calorieLimit"
              type="number"
              min={500}
              max={10000}
              step={50}
              value={calorieLimit}
              onChange={(e) => setCalorieLimit(e.target.value)}
              className="input"
              placeholder="例如：2000"
            />
            <span className={styles.hint}>建議範圍：500 ~ 10000 kcal</span>
          </div>

          {error && <p className={styles.error}>{error}</p>}
          {success && <p className={styles.successMsg}>✅ 設定已儲存</p>}

          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? '儲存中…' : '儲存設定'}
          </button>
        </form>
      </section>

      {/* 帳戶資訊（唯讀） */}
      {profile && (
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>👤 帳戶資訊</h2>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>使用者名稱</span>
              <span className={styles.infoValue}>{profile.username}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>電子郵件</span>
              <span className={styles.infoValue}>{profile.email}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>目前熱量目標</span>
              <span className={styles.infoValue}>{profile.daily_calorie_limit} kcal</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>註冊日期</span>
              <span className={styles.infoValue}>
                {new Date(profile.created_at).toLocaleDateString('zh-TW')}
              </span>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}