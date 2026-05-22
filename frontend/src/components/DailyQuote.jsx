/**
 * CaloScanAi — 365 鼓勵語錄輪播元件
 * 從後端 GET /api/daily-quote 抓取今日語錄，滑動呈現。
 *
 * 使用方式：
 *   <DailyQuoteCarousel />
 */

import { h } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

/**
 * 勵語卡片：支援淡入淡出，可點擊複製。
 */
function QuoteCard({ quote, author }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`"${quote}" — ${author}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API not available
    }
  };

  return (
    <div
      onClick={handleCopy}
      style={{
        padding: '20px 24px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        cursor: 'pointer',
        transition: 'all 0.2s',
        textAlign: 'center',
        position: 'relative',
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
      title="點擊複製語錄"
    >
      <div style={{
        fontSize: '28px',
        lineHeight: '1.4',
        color: 'var(--text-primary)',
        fontWeight: '500',
        marginBottom: '12px',
        fontStyle: 'italic',
      }}>
        「{quote}」
      </div>
      <div style={{
        fontSize: '13px',
        color: 'var(--text-muted)',
      }}>
        — {author}
      </div>
      {copied && (
        <span style={{
          position: 'absolute',
          top: '8px',
          right: '12px',
          fontSize: '12px',
          color: 'var(--success)',
          fontWeight: '600',
        }}>
          ✓ 已複製
        </span>
      )}
    </div>
  );
}

/**
 * 輪播主元件
 * 每 8 秒自動滑到下一句，也可手動左右切換。
 */
export function DailyQuoteCarousel() {
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fade, setFade] = useState(true);
  const timerRef = useRef(null);

  const fetchQuote = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/daily-quote`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setQuote({ quote: data.quote, author: data.author });
      setError(null);
    } catch (err) {
      setError('載入語錄失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuote();
  }, []);

  // 每 10 秒刷新語錄（換句）
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        fetchQuote();
        setFade(true);
      }, 300);
    }, 10000);
    return () => clearInterval(timerRef.current);
  }, []);

  if (loading) {
    return (
      <div style={{
        padding: '20px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontSize: '14px',
      }}>
        載入鼓勵語...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: '20px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontSize: '14px',
      }}>
        {error}
        <button
          onClick={fetchQuote}
          style={{
            display: 'block',
            margin: '8px auto 0',
            background: 'none',
            border: 'none',
            color: 'var(--accent)',
            cursor: 'pointer',
            fontSize: '13px',
          }}
        >
          重試
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        opacity: fade ? 1 : 0,
        transition: 'opacity 0.3s ease',
      }}
    >
      <QuoteCard quote={quote.quote} author={quote.author} />
    </div>
  );
}

/**
 * 迷你版本（適合放在首頁側邊欄或底部）
 */
export function MiniQuote() {
  const [quote, setQuote] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/daily-quote`)
      .then((r) => r.json())
      .then((d) => setQuote(d.quote));
  }, []);

  if (!quote) return null;

  return (
    <div style={{
      fontSize: '13px',
      color: 'var(--text-muted)',
      fontStyle: 'italic',
      textAlign: 'center',
      padding: '8px 0',
    }}>
      {quote}
    </div>
  );
}

export default DailyQuoteCarousel;