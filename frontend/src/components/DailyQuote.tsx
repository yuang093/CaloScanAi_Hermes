/**
 * CaloScanAi — 365 鼓勵語錄輪播元件 (React TypeScript)
 * 從後端 GET /api/daily-quote 抓取今日語錄，滑動呈現。
 * 每日自動換新語錄（localStorage 記錄日期）。
 *
 * 使用方式：
 *   <DailyQuoteCarousel />
 *   <MiniQuote />
 */

import { useState, useEffect, useRef, CSSProperties } from 'react';
import { apiGet } from '@/lib/api';

// API base - 使用 8002 port
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8002';

// ── Types ─────────────────────────────────────────────────────────────────────

interface QuoteData {
  quote: string;
  author: string;
}

// ── Styles ────────────────────────────────────────────────────────────────────

const quoteCardStyle: CSSProperties = {
  padding: '20px 24px',
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  cursor: 'pointer',
  transition: 'all 0.2s',
  textAlign: 'center',
  position: 'relative',
};

const quoteTextStyle: CSSProperties = {
  fontSize: '28px',
  lineHeight: '1.4',
  color: 'var(--color-text)',
  fontWeight: '500',
  marginBottom: '12px',
  fontStyle: 'italic',
};

const authorStyle: CSSProperties = {
  fontSize: '13px',
  color: 'var(--color-text-secondary)',
};

const copiedBadgeStyle: CSSProperties = {
  position: 'absolute',
  top: '8px',
  right: '12px',
  fontSize: '12px',
  color: 'var(--color-success)',
  fontWeight: '600',
};

const loadingStyle: CSSProperties = {
  padding: '20px',
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  textAlign: 'center',
  color: 'var(--color-text-secondary)',
  fontSize: '14px',
};

// ── QuoteCard Component ───────────────────────────────────────────────────────

interface QuoteCardProps {
  quote: string;
  author: string;
}

function QuoteCard({ quote, author }: QuoteCardProps) {
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
      style={quoteCardStyle}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
      title="點擊複製語錄"
    >
      <div style={quoteTextStyle}>「{quote}」</div>
      <div style={authorStyle}>— {author}</div>
      {copied && <span style={copiedBadgeStyle}>✓ 已複製</span>}
    </div>
  );
}

// ── DailyQuoteCarousel (主元件) ───────────────────────────────────────────────

const QUOTE_STORAGE_KEY = 'caloscan_daily_quote_date';
const QUOTE_DATA_KEY = 'caloscan_daily_quote_data';
const REFRESH_INTERVAL = 10000; // 10 秒換句

export function DailyQuoteCarousel() {
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fade, setFade] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchQuote = async () => {
    try {
      const data = await apiGet<QuoteData>('/api/daily-quote');
      setQuote({ quote: data.quote, author: data.author });
      setError(null);
    } catch {
      setError('載入語錄失敗');
    } finally {
      setLoading(false);
    }
  };

  // 檢查是否需要每日刷新
  const checkDailyRefresh = () => {
    const today = new Date().toISOString().split('T')[0];
    const storedDate = localStorage.getItem(QUOTE_STORAGE_KEY);

    if (storedDate !== today) {
      // 新的一天，重新抓取
      localStorage.setItem(QUOTE_STORAGE_KEY, today);
      fetchQuote();
    } else {
      // 读取缓存数据
      const cached = localStorage.getItem(QUOTE_DATA_KEY);
      if (cached) {
        try {
          setQuote(JSON.parse(cached));
          setLoading(false);
        } catch {
          fetchQuote();
        }
      } else {
        fetchQuote();
      }
    }
  };

  useEffect(() => {
    checkDailyRefresh();
  }, []);

  // 每 10 秒刷新語錄（換句）
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        fetchQuote();
        setFade(true);
      }, 300);
    }, REFRESH_INTERVAL);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // 緩存數據
  useEffect(() => {
    if (quote) {
      localStorage.setItem(QUOTE_DATA_KEY, JSON.stringify(quote));
    }
  }, [quote]);

  if (loading) {
    return <div style={loadingStyle}>載入鼓勵語...</div>;
  }

  if (error) {
    return (
      <div style={loadingStyle}>
        {error}
        <button
          onClick={fetchQuote}
          style={{
            display: 'block',
            margin: '8px auto 0',
            background: 'none',
            border: 'none',
            color: 'var(--color-primary)',
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
      <QuoteCard quote={quote!.quote} author={quote!.author} />
    </div>
  );
}

// ── MiniQuote (迷你版本) ──────────────────────────────────────────────────────

export function MiniQuote() {
  const [quote, setQuote] = useState<string | null>(null);

  useEffect(() => {
    apiGet<QuoteData>('/api/daily-quote')
      .then((data) => setQuote(data.quote))
      .catch(() => {
        // ignore
      });
  }, []);

  if (!quote) return null;

  return (
    <div
      style={{
        fontSize: '13px',
        color: 'var(--color-text-secondary)',
        fontStyle: 'italic',
        textAlign: 'center',
        padding: '8px 0',
      }}
    >
      {quote}
    </div>
  );
}

export default DailyQuoteCarousel;