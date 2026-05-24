'use client';

import Link from 'next/link';
import { useStyle } from '@/contexts/StyleContext';

export default function HomePage() {
  const { style } = useStyle();

  const features = [
    { icon: '📸', title: 'AI 拍照辨識', desc: '瞬間看懂每一口的熱量' },
    { icon: '📊', title: '每日追蹤', desc: '視覺化熱量攝取圖表' },
    { icon: '🎯', title: '個人化建議', desc: '根據目標調整飲食' },
  ];

  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      background: 'var(--bg-primary)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background decoration */}
      <div style={{
        position: 'absolute',
        top: '-20%',
        left: '-10%',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
        borderRadius: '50%',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-10%',
        right: '-5%',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(236, 72, 153, 0.1) 0%, transparent 70%)',
        borderRadius: '50%',
        pointerEvents: 'none',
      }} />

      {/* Logo */}
      <div style={{
        width: '80px',
        height: '80px',
        borderRadius: '24px',
        background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '32px',
        boxShadow: '0 8px 32px rgba(139, 92, 246, 0.3)',
      }}>
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <circle cx="20" cy="20" r="12" stroke="#fff" strokeWidth="2.5"/>
          <path d="M20 8 C14 16, 14 24, 20 32 C26 24, 26 16, 20 8Z" fill="#fff" opacity="0.5"/>
          <circle cx="20" cy="20" r="4" fill="#fff"/>
        </svg>
      </div>

      {/* Brand */}
      <h1 style={{
        fontSize: '42px',
        fontWeight: '700',
        letterSpacing: '-0.02em',
        marginBottom: '12px',
        background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }}>
        CaloScanAI
      </h1>
      <p style={{
        fontSize: '16px',
        color: 'var(--text-secondary)',
        marginBottom: '48px',
        textAlign: 'center',
        maxWidth: '360px',
        lineHeight: 1.6,
      }}>
        用 AI 攝影鏡頭，瞬間看懂每一口的熱量<br/>
        優雅、簡單、每一天
      </p>

      {/* Features */}
      <div style={{
        display: 'flex',
        gap: '16px',
        marginBottom: '48px',
        flexWrap: 'wrap',
        justifyContent: 'center',
        maxWidth: '600px',
      }}>
        {features.map((f) => (
          <div key={f.title} style={{
            padding: '20px 24px',
            background: 'var(--bg-secondary)',
            borderRadius: '16px',
            border: '1px solid var(--border)',
            textAlign: 'center',
            minWidth: '140px',
            flex: 1,
          }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>{f.icon}</div>
            <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>{f.title}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{f.desc}</div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <Link href="/login" style={{
          padding: '14px 32px',
          background: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
          color: '#fff',
          borderRadius: '12px',
          fontWeight: '600',
          fontSize: '15px',
          textDecoration: 'none',
          boxShadow: '0 4px 16px rgba(139, 92, 246, 0.3)',
        }}>
          登入
        </Link>
        <Link href="/register" style={{
          padding: '14px 32px',
          background: 'var(--bg-secondary)',
          color: 'var(--text-primary)',
          borderRadius: '12px',
          fontWeight: '600',
          fontSize: '15px',
          border: '1px solid var(--border)',
          textDecoration: 'none',
        }}>
          註冊新帳號
        </Link>
      </div>

      <p style={{ marginTop: '48px', fontSize: '13px', color: 'var(--text-muted)' }}>
        用熱情戰勝每一天 💪
      </p>
    </main>
  );
}