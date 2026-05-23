'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiPost } from '@/lib/api';
import { useStyle } from '@/contexts/StyleContext';
import StylePicker from '@/components/StylePicker';

// ─── V1: Sakura Minimal ────────────────────────────────────────────────────
function RegisterV1() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'login' | 'register'>('register');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { setError('兩次輸入的密碼不一致'); return; }
    if (form.password.length < 8) { setError('密碼長度至少 8 個字元'); return; }
    setError('');
    setLoading(true);
    try {
      await apiPost('/api/auth/register', { username: form.name, email: form.email, password: form.password, daily_calorie_limit: 2000 });
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '註冊失敗');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#faf8f5',
      fontFamily: "'Zen Maru Gothic', 'Noto Serif TC', sans-serif",
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@300;400;500&family=Noto+Serif+TC:wght@300;400;600&display=swap');`}</style>
      <div style={{ display: 'flex', gap: '80px', alignItems: 'center', maxWidth: '1100px', width: '100%' }}>
        <div style={{ flex: 1 }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'linear-gradient(135deg, #f8c8d4, #e8a0b0)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px', boxShadow: '0 4px 24px rgba(201,125,142,0.25)' }}>
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <circle cx="18" cy="18" r="10" stroke="#fff" strokeWidth="2"/>
              <path d="M18 8 C12 14, 12 22, 18 28 C24 22, 24 14, 18 8Z" fill="#fff" opacity="0.6"/>
              <circle cx="18" cy="18" r="3" fill="#fff"/>
            </svg>
          </div>
          <h1 style={{ fontFamily: "'Noto Serif TC', serif", fontSize: '48px', fontWeight: 300, letterSpacing: '0.08em', lineHeight: 1.2, marginBottom: '16px', color: '#2d2a26' }}>
            CaloScan<span style={{ color: '#c97d8e' }}>AI</span>
            <span style={{ display: 'block', fontSize: '14px', fontWeight: 400, letterSpacing: '0.3em', color: '#8a8279', marginTop: '8px' }}>C A L O R I E  T R A C K E R</span>
          </h1>
          <p style={{ fontSize: '15px', color: '#8a8279', lineHeight: 1.8, maxWidth: '320px' }}>
            用 AI 攝影鏡頭，瞬間看懂每一口的熱量。優雅、簡單、每一天。
          </p>
        </div>
        <div style={{ flex: 1, maxWidth: '420px', background: '#fff', borderRadius: '16px', padding: '48px 44px', boxShadow: '0 8px 40px rgba(45,42,38,0.06)', border: '1px solid #e8e2db' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid #e8e2db', marginBottom: '36px' }}>
            {['登入', '註冊'].map((t) => (
              <button key={t} onClick={() => setTab(t as 'login' | 'register')} style={{ flex: 1, padding: '12px 0', textAlign: 'center', fontSize: '14px', letterSpacing: '0.05em', color: tab === t ? '#2d2a26' : '#8a8279', borderBottom: tab === t ? '2px solid #c97d8e' : '2px solid transparent', background: 'none', border: 'none', cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit' }}>
                {t}
              </button>
            ))}
          </div>
          {tab === 'register' ? (
            <>
              {error && <div style={{ padding: '12px 16px', background: '#f3e8ec', color: '#c97d8e', borderRadius: '10px', marginBottom: '16px', fontSize: '14px' }}>{error}</div>}
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', letterSpacing: '0.15em', color: '#8a8279', marginBottom: '8px', textTransform: 'uppercase' }}>使用者名稱</label>
                  <input type="text" placeholder="使用者名稱" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required style={{ width: '100%', padding: '14px 16px', border: '1px solid #e8e2db', borderRadius: '10px', fontSize: '15px', fontFamily: 'inherit', background: '#faf8f5', color: '#2d2a26', outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s', boxSizing: 'border-box' }} onFocus={(e) => { e.target.style.borderColor = '#c97d8e'; e.target.style.boxShadow = '0 0 0 3px #f3e8ec'; }} onBlur={(e) => { e.target.style.borderColor = '#e8e2db'; e.target.style.boxShadow = 'none'; }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', letterSpacing: '0.15em', color: '#8a8279', marginBottom: '8px', textTransform: 'uppercase' }}>電子郵件</label>
                  <input type="email" placeholder="your@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required style={{ width: '100%', padding: '14px 16px', border: '1px solid #e8e2db', borderRadius: '10px', fontSize: '15px', fontFamily: 'inherit', background: '#faf8f5', color: '#2d2a26', outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s', boxSizing: 'border-box' }} onFocus={(e) => { e.target.style.borderColor = '#c97d8e'; e.target.style.boxShadow = '0 0 0 3px #f3e8ec'; }} onBlur={(e) => { e.target.style.borderColor = '#e8e2db'; e.target.style.boxShadow = 'none'; }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', letterSpacing: '0.15em', color: '#8a8279', marginBottom: '8px', textTransform: 'uppercase' }}>密碼</label>
                  <input type="password" placeholder="••••••••" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required style={{ width: '100%', padding: '14px 16px', border: '1px solid #e8e2db', borderRadius: '10px', fontSize: '15px', fontFamily: 'inherit', background: '#faf8f5', color: '#2d2a26', outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s', boxSizing: 'border-box' }} onFocus={(e) => { e.target.style.borderColor = '#c97d8e'; e.target.style.boxShadow = '0 0 0 3px #f3e8ec'; }} onBlur={(e) => { e.target.style.borderColor = '#e8e2db'; e.target.style.boxShadow = 'none'; }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', letterSpacing: '0.15em', color: '#8a8279', marginBottom: '8px', textTransform: 'uppercase' }}>確認密碼</label>
                  <input type="password" placeholder="••••••••" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} required style={{ width: '100%', padding: '14px 16px', border: '1px solid #e8e2db', borderRadius: '10px', fontSize: '15px', fontFamily: 'inherit', background: '#faf8f5', color: '#2d2a26', outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s', boxSizing: 'border-box' }} onFocus={(e) => { e.target.style.borderColor = '#c97d8e'; e.target.style.boxShadow = '0 0 0 3px #f3e8ec'; }} onBlur={(e) => { e.target.style.borderColor = '#e8e2db'; e.target.style.boxShadow = 'none'; }} />
                </div>
                <button type="submit" disabled={loading} style={{ width: '100%', padding: '16px', background: loading ? '#e8a0b0' : 'linear-gradient(135deg, #d4899c, #c97d8e)', color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontFamily: 'inherit', letterSpacing: '0.1em', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '8px', boxShadow: '0 4px 16px rgba(201,125,142,0.3)', transition: 'all 0.2s' }}>
                  {loading ? '註冊中...' : '註 冊'}
                </button>
              </form>
            </>
          ) : (
            <p style={{ textAlign: 'center', color: '#8a8279', padding: '40px 0' }}>
              <Link href="/login" style={{ color: '#c97d8e', textDecoration: 'none', fontWeight: '500', fontSize: '15px' }}>返回登入 →</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── V3: Editorial Warmth ────────────────────────────────────────────────────
function RegisterV3() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { setError('兩次輸入的密碼不一致'); return; }
    if (form.password.length < 8) { setError('密碼長度至少 8 個字元'); return; }
    setError('');
    setLoading(true);
    try {
      await apiPost('/api/auth/register', { username: form.name, email: form.email, password: form.password, daily_calorie_limit: 2000 });
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '註冊失敗');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f4efe8', fontFamily: "'Source Sans 3', 'Noto Sans TC', sans-serif", display: 'grid', gridTemplateColumns: '1fr 420px' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=Source+Sans+3:wght@300;400;600&family=Noto+Sans+TC:wght@300;400&display=swap');`}</style>
      <div style={{ padding: '80px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <div style={{ position: 'fixed', top: '40px', left: '40px', fontSize: '9px', letterSpacing: '0.4em', color: '#6b6560', textTransform: 'uppercase', writingMode: 'vertical-rl' }}>CaloScanAi / 飲食追蹤系統</div>
        <div style={{ fontStyle: 'italic', fontSize: '14px', color: '#c45c3a', marginBottom: '24px', letterSpacing: '0.05em', fontFamily: "'Playfair Display', serif" }}>AI Calorie Tracker · Since 2026</div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '72px', fontWeight: 400, lineHeight: 1.1, marginBottom: '32px', color: '#1c1917' }}>
          每一口<br />都值得<em style={{ fontStyle: 'italic', color: '#c45c3a' }}>被看見</em>
        </h1>
        <p style={{ fontSize: '16px', lineHeight: 1.9, color: '#6b6560', maxWidth: '420px', fontWeight: 300 }}>
          用相機記錄飲食，AI 即時分析熱量。從今天開始，用數據理解自己的身體。
        </p>
        <div style={{ marginTop: 'auto', paddingTop: '48px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '32px' }}>
          {[['365', '每日鼓勵語錄'], ['< 2s', 'AI 熱量分析'], ['100%', '本地隱私保護']].map(([num, label]) => (
            <div key={label} style={{ borderTop: '1px solid #ddd6ce', paddingTop: '16px' }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '40px', fontWeight: 600, color: '#1c1917' }}>{num}</div>
              <div style={{ fontSize: '11px', color: '#6b6560', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '4px' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding: '80px 56px', background: '#faf7f3', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '28px', fontWeight: 400, marginBottom: '8px', color: '#1c1917' }}>註冊帳號</h2>
        <p style={{ fontSize: '13px', color: '#6b6560', marginBottom: '36px' }}>已經有帳號了？<Link href="/login" style={{ color: '#c45c3a', textDecoration: 'none' }}>返回登入</Link></p>
        {error && <div style={{ padding: '12px 14px', background: '#e8d5cc', color: '#c45c3a', borderRadius: '2px', marginBottom: '20px', fontSize: '14px', borderLeft: '3px solid #c45c3a' }}>{error}</div>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', letterSpacing: '0.15em', color: '#6b6560', marginBottom: '8px', textTransform: 'uppercase' }}>使用者名稱</label>
            <input type="text" placeholder="使用者名稱" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required style={{ width: '100%', padding: '12px 14px', border: '1px solid #ddd6ce', background: '#f4efe8', color: '#1c1917', fontSize: '15px', fontFamily: 'inherit', outline: 'none', borderRadius: '2px', transition: 'border-color 0.2s', boxSizing: 'border-box' }} onFocus={(e) => { e.target.style.borderColor = '#c45c3a'; }} onBlur={(e) => { e.target.style.borderColor = '#ddd6ce'; }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '11px', letterSpacing: '0.15em', color: '#6b6560', marginBottom: '8px', textTransform: 'uppercase' }}>電子郵件</label>
            <input type="email" placeholder="your@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required style={{ width: '100%', padding: '12px 14px', border: '1px solid #ddd6ce', background: '#f4efe8', color: '#1c1917', fontSize: '15px', fontFamily: 'inherit', outline: 'none', borderRadius: '2px', transition: 'border-color 0.2s', boxSizing: 'border-box' }} onFocus={(e) => { e.target.style.borderColor = '#c45c3a'; }} onBlur={(e) => { e.target.style.borderColor = '#ddd6ce'; }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '11px', letterSpacing: '0.15em', color: '#6b6560', marginBottom: '8px', textTransform: 'uppercase' }}>密碼</label>
            <input type="password" placeholder="設定密碼" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required style={{ width: '100%', padding: '12px 14px', border: '1px solid #ddd6ce', background: '#f4efe8', color: '#1c1917', fontSize: '15px', fontFamily: 'inherit', outline: 'none', borderRadius: '2px', transition: 'border-color 0.2s', boxSizing: 'border-box' }} onFocus={(e) => { e.target.style.borderColor = '#c45c3a'; }} onBlur={(e) => { e.target.style.borderColor = '#ddd6ce'; }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '11px', letterSpacing: '0.15em', color: '#6b6560', marginBottom: '8px', textTransform: 'uppercase' }}>確認密碼</label>
            <input type="password" placeholder="再次輸入密碼" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} required style={{ width: '100%', padding: '12px 14px', border: '1px solid #ddd6ce', background: '#f4efe8', color: '#1c1917', fontSize: '15px', fontFamily: 'inherit', outline: 'none', borderRadius: '2px', transition: 'border-color 0.2s', boxSizing: 'border-box' }} onFocus={(e) => { e.target.style.borderColor = '#c45c3a'; }} onBlur={(e) => { e.target.style.borderColor = '#ddd6ce'; }} />
          </div>
          <button type="submit" disabled={loading} style={{ width: '100%', padding: '16px', background: '#1c1917', color: '#f4efe8', border: 'none', fontSize: '13px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '8px', borderRadius: '2px', transition: 'background 0.2s', fontFamily: 'inherit' }} onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = '#c45c3a'; }} onMouseLeave={(e) => { e.currentTarget.style.background = '#1c1917'; }}>
            {loading ? '註冊中...' : '註 冊'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── V5: Neo-Brutalist Playful ──────────────────────────────────────────────
function RegisterV5() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { setError('兩次輸入的密碼不一致'); return; }
    if (form.password.length < 8) { setError('密碼長度至少 8 個字元'); return; }
    setError('');
    setLoading(true);
    try {
      await apiPost('/api/auth/register', { username: form.name, email: form.email, password: form.password, daily_calorie_limit: 2000 });
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '註冊失敗');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#fef9f3', fontFamily: "'Nunito', 'Noto Sans TC', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;900&family=Noto+Sans+TC:wght@400;500;700&display=swap');`}</style>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', maxWidth: '900px', width: '100%', border: '3px solid #1a1208', boxShadow: '4px 4px 0px #1a1208' }}>
        <div style={{ padding: '56px 48px', background: '#ff6b35', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
              <div style={{ width: '48px', height: '48px', background: '#1a1208', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>📸</div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#1a1208', letterSpacing: '-0.02em' }}>CaloScan</div>
            </div>
            <h2 style={{ fontSize: '42px', fontWeight: 900, lineHeight: 1.05, color: '#1a1208', marginBottom: '16px' }}>
              吃什麼<br />AI 幫你看
            </h2>
            <p style={{ fontSize: '15px', color: 'rgba(26,18,8,0.7)', lineHeight: 1.6 }}>
              拍照上傳，馬上知道熱量。簡單三步，輕鬆掌握每日飲食。
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[['🔥 2秒分析', '#1a1208'], ['📊 數據視覺化', '#f7c545'], ['🔒 100% 隱私', '#5bc3eb']].map(([badge, bg]) => (
              <div key={badge} style={{ background: bg, color: '#1a1208', fontSize: '11px', fontWeight: 700, padding: '6px 12px', borderRadius: '100px', letterSpacing: '0.05em' }}>{badge}</div>
            ))}
          </div>
        </div>
        <div style={{ padding: '56px 48px', background: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: 900, marginBottom: '4px', letterSpacing: '-0.02em', color: '#1a1208' }}>建立帳號</div>
          <p style={{ fontSize: '13px', color: 'rgba(26,18,8,0.5)', marginBottom: '32px' }}>
            已經有帳號了？<Link href="/login" style={{ color: '#ff6b35', fontWeight: 700, textDecoration: 'none' }}>返回登入</Link>
          </p>
          {error && <div style={{ padding: '12px 14px', background: '#fef9f3', color: '#ff6b35', borderRadius: '8px', marginBottom: '16px', fontSize: '14px', border: '2px solid #ff6b35' }}>{error}</div>}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', marginBottom: '6px', textTransform: 'uppercase', color: '#1a1208' }}>使用者名稱</label>
              <input type="text" placeholder="使用者名稱" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required style={{ width: '100%', padding: '12px 14px', border: '2px solid #1a1208', borderRadius: '8px', fontSize: '15px', fontFamily: 'inherit', background: '#fef9f3', color: '#1a1208', outline: 'none', boxSizing: 'border-box', boxShadow: '4px 4px 0px #1a1208' }} onFocus={(e) => { e.target.style.boxShadow = '6px 6px 0px #1a1208'; e.target.style.transform = 'translate(-2px, -2px)'; }} onBlur={(e) => { e.target.style.boxShadow = '4px 4px 0px #1a1208'; e.target.style.transform = 'none'; }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', marginBottom: '6px', textTransform: 'uppercase', color: '#1a1208' }}>Email</label>
              <input type="email" placeholder="your@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required style={{ width: '100%', padding: '12px 14px', border: '2px solid #1a1208', borderRadius: '8px', fontSize: '15px', fontFamily: 'inherit', background: '#fef9f3', color: '#1a1208', outline: 'none', boxSizing: 'border-box', boxShadow: '4px 4px 0px #1a1208' }} onFocus={(e) => { e.target.style.boxShadow = '6px 6px 0px #1a1208'; e.target.style.transform = 'translate(-2px, -2px)'; }} onBlur={(e) => { e.target.style.boxShadow = '4px 4px 0px #1a1208'; e.target.style.transform = 'none'; }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', marginBottom: '6px', textTransform: 'uppercase', color: '#1a1208' }}>密碼</label>
              <input type="password" placeholder="設定密碼" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required style={{ width: '100%', padding: '12px 14px', border: '2px solid #1a1208', borderRadius: '8px', fontSize: '15px', fontFamily: 'inherit', background: '#fef9f3', color: '#1a1208', outline: 'none', boxSizing: 'border-box', boxShadow: '4px 4px 0px #1a1208' }} onFocus={(e) => { e.target.style.boxShadow = '6px 6px 0px #1a1208'; e.target.style.transform = 'translate(-2px, -2px)'; }} onBlur={(e) => { e.target.style.boxShadow = '4px 4px 0px #1a1208'; e.target.style.transform = 'none'; }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', marginBottom: '6px', textTransform: 'uppercase', color: '#1a1208' }}>確認密碼</label>
              <input type="password" placeholder="再次輸入密碼" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} required style={{ width: '100%', padding: '12px 14px', border: '2px solid #1a1208', borderRadius: '8px', fontSize: '15px', fontFamily: 'inherit', background: '#fef9f3', color: '#1a1208', outline: 'none', boxSizing: 'border-box', boxShadow: '4px 4px 0px #1a1208' }} onFocus={(e) => { e.target.style.boxShadow = '6px 6px 0px #1a1208'; e.target.style.transform = 'translate(-2px, -2px)'; }} onBlur={(e) => { e.target.style.boxShadow = '4px 4px 0px #1a1208'; e.target.style.transform = 'none'; }} />
            </div>
            <button type="submit" disabled={loading} style={{ width: '100%', padding: '16px', background: '#1a1208', color: 'white', border: '2px solid #1a1208', borderRadius: '8px', fontSize: '16px', fontWeight: 900, cursor: loading ? 'not-allowed' : 'pointer', marginTop: '8px', transition: 'all 0.15s', letterSpacing: '0.02em', fontFamily: 'inherit' }} onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.background = '#ff6b35'; e.currentTarget.style.borderColor = '#ff6b35'; e.currentTarget.style.transform = 'translate(-2px, -2px)'; e.currentTarget.style.boxShadow = '6px 6px 0px #1a1208'; }}} onMouseLeave={(e) => { e.currentTarget.style.background = '#1a1208'; e.currentTarget.style.borderColor = '#1a1208'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '4px 4px 0px #1a1208'; }}>
              {loading ? '註冊中...' : '註 冊'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function RegisterPage() {
  const { style } = useStyle();

  return (
    <>
      {style === 'v1' && <RegisterV1 />}
      {style === 'v3' && <RegisterV3 />}
      {style === 'v5' && <RegisterV5 />}
      <div style={{ position: 'fixed', top: '16px', right: '16px', zIndex: 999 }}>
        <StylePicker />
      </div>
    </>
  );
}