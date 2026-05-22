import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import Link from 'next/link';

export default async function HomePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  // 已登入 → 導向 dashboard
  if (token) {
    redirect('/dashboard');
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 gradient-bg">
      <div className="card max-w-md w-full text-center">
        <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-primary)' }}>
          CaloScanAi
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '15px' }}>
          AI 拍照辨識食物，輕鬆追蹤每日卡路里攝取
        </p>

        {/* 快速功能展示 */}
        <div style={{ display: 'grid', gap: '12px', marginBottom: '32px', textAlign: 'left' }}>
          {[
            '📸 拍照上傳，AI 自動辨識食物',
            '📊 每日熱量攝取視覺化圖表',
            '🎯 個人化營養建議',
          ].map((item) => (
            <div
              key={item}
              style={{
                padding: '12px 16px',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)',
                fontSize: '14px',
                color: 'var(--text-primary)',
              }}
            >
              {item}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Link href="/login" className="btn btn-primary" style={{ textDecoration: 'none', display: 'flex', justifyContent: 'center' }}>
            登入
          </Link>
          <Link href="/register" className="btn btn-secondary" style={{ textDecoration: 'none', display: 'flex', justifyContent: 'center' }}>
            註冊新帳號
          </Link>
        </div>
      </div>

      {/* 每日語錄（未來可改用元件） */}
      <div style={{ marginTop: '24px', fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
        用熱情戰勝每一天 💪
      </div>
    </main>
  );
}