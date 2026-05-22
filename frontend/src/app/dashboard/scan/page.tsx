'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import BarcodeScanner, { BarcodeResult } from '@/components/BarcodeScanner';
import { apiPost, apiPostForm } from '@/lib/api';
import styles from './scan.module.css';

export default function ScanPage() {
  const router = useRouter();
  const [lookupResult, setLookupResult] = useState<BarcodeResult | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleBarcodeResult = useCallback((result: BarcodeResult) => {
    setLookupResult(result);
    setLookupError(null);
    setSaved(false);
  }, []);

  const handleBarcodeError = useCallback((error: string) => {
    setLookupError(error);
    setLookupResult(null);
  }, []);

  const handleConfirmSave = async () => {
    if (!lookupResult) return;
    setSaving(true);

    try {
      const formData = new FormData();
      formData.append('food_name', lookupResult.food_name);
      formData.append('calories', String(lookupResult.calories));
      if (lookupResult.protein_g !== undefined) {
        formData.append('protein_g', String(lookupResult.protein_g));
      }
      if (lookupResult.carbs_g !== undefined) {
        formData.append('carbs_g', String(lookupResult.carbs_g));
      }
      if (lookupResult.fat_g !== undefined) {
        formData.append('fat_g', String(lookupResult.fat_g));
      }
      if (lookupResult.brand) {
        formData.append('brand', lookupResult.brand);
      }

      await apiPostForm('/api/food-logs', formData);
      setSaved(true);
      setLookupResult(null);

      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch {
      setLookupError('儲存失敗，請稍後再試');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setLookupResult(null);
    setLookupError(null);
    setSaved(false);
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <a href="/dashboard" className={styles.backBtn}>← 返回</a>
        <h1 className={styles.title}>📷 條碼掃描</h1>
      </div>

      {/* Scanner */}
      <BarcodeScanner
        onResult={handleBarcodeResult}
        onError={handleBarcodeError}
      />

      {/* Result card */}
      {lookupResult && (
        <div className={styles.resultCard}>
          <div className={styles.resultHeader}>
            <h2>{lookupResult.food_name}</h2>
            {lookupResult.brand && (
              <span className={styles.brand}>{lookupResult.brand}</span>
            )}
          </div>

          <div className={styles.macros}>
            <div className={styles.macroItem}>
              <span className={styles.macroVal}>{lookupResult.calories}</span>
              <span className={styles.macroLabel}>kcal</span>
            </div>
            {lookupResult.protein_g !== undefined && (
              <div className={styles.macroItem}>
                <span className={styles.macroVal}>{lookupResult.protein_g}g</span>
                <span className={styles.macroLabel}>蛋白質</span>
              </div>
            )}
            {lookupResult.carbs_g !== undefined && (
              <div className={styles.macroItem}>
                <span className={styles.macroVal}>{lookupResult.carbs_g}g</span>
                <span className={styles.macroLabel}>碳水</span>
              </div>
            )}
            {lookupResult.fat_g !== undefined && (
              <div className={styles.macroItem}>
                <span className={styles.macroVal}>{lookupResult.fat_g}g</span>
                <span className={styles.macroLabel}>脂肪</span>
              </div>
            )}
          </div>

          {saved ? (
            <div className={styles.successMsg}>✅ 已儲存，即將跳轉...</div>
          ) : (
            <div className={styles.actions}>
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
      )}

      {lookupError && (
        <div className={styles.errorBox}>
          <p>{lookupError}</p>
        </div>
      )}

      {/* Manual entry shortcut */}
      <div className={styles.tip}>
        <p>💡 掃描不到？試著靠近光線充足的地方，或用手動輸入條碼。</p>
      </div>
    </div>
  );
}