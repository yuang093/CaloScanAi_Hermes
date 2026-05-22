'use client';

import { useState } from 'react';
import { apiPost } from '@/lib/api';
import { FeedbackCreate } from '@/lib/types/feedback';
import styles from './feedback.module.css';

type FeedbackType = 'feature' | 'bug' | 'general';

const STAR_LABELS = ['非常不滿意', '不滿意', '普通', '滿意', '非常滿意'];

export default function FeedbackPage() {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('general');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError('請選擇評分');
      return;
    }
    if (message.trim().length === 0) {
      setError('請填寫回饋內容');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const data: FeedbackCreate = {
        rating,
        feedback_type: feedbackType,
        message: message.trim(),
      };
      await apiPost('/api/feedback', data);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '提交失敗，請稍後再試');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setRating(0);
    setHoverRating(0);
    setFeedbackType('general');
    setMessage('');
    setSubmitted(false);
    setError(null);
  };

  if (submitted) {
    return (
      <div className={styles.container}>
        <div className={styles.successCard}>
          <div className={styles.successIcon}>🎉</div>
          <h1>感謝您的回饋！</h1>
          <p>您的意見對我們非常寶貴，將幫助我們做得更好。</p>
          <button className={styles.btnPrimary} onClick={handleReset}>
            再填寫一次
          </button>
          <a href="/dashboard" className={styles.backLink}>
            返回首頁
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <a href="/dashboard" className={styles.backLink}>
          ← 返回
        </a>
        <h1>💬 回饋與建議</h1>
        <p>告訴我們您對 CaloScanAI 的想法</p>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        {/* 評分區塊 */}
        <div className={styles.section}>
          <label className={styles.label}>滿意程度 *</label>
          <div className={styles.stars}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className={`${styles.starBtn} ${(hoverRating || rating) >= star ? styles.starActive : ''}`}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
              >
                ★
              </button>
            ))}
          </div>
          <span className={styles.starLabel}>
            {rating > 0 ? STAR_LABELS[rating - 1] : '請點擊評分'}
          </span>
        </div>

        {/* 回饋類型 */}
        <div className={styles.section}>
          <label className={styles.label}>回饋類型</label>
          <div className={styles.typeGroup}>
            {(['feature', 'bug', 'general'] as const).map((type) => (
              <label key={type} className={styles.radioLabel}>
                <input
                  type="radio"
                  name="feedbackType"
                  value={type}
                  checked={feedbackType === type}
                  onChange={() => setFeedbackType(type)}
                  className={styles.radioInput}
                />
                <span className={styles.radioCustom} />
                <span>
                  {type === 'feature' && '✨ 功能建議'}
                  {type === 'bug' && '🐛 問題回報'}
                  {type === 'general' && '💬 一般回饋'}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* 文字輸入 */}
        <div className={styles.section}>
          <label className={styles.label} htmlFor="message">
            回饋內容 *
          </label>
          <textarea
            id="message"
            className={styles.textarea}
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, 500))}
            placeholder="請描述您的建議或問題... (最多 500 字)"
            rows={6}
            maxLength={500}
          />
          <div className={styles.charCount}>{message.length} / 500</div>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <button
          type="submit"
          className={styles.btnSubmit}
          disabled={submitting}
        >
          {submitting ? '提交中...' : '送出回饋'}
        </button>
      </form>
    </div>
  );
}