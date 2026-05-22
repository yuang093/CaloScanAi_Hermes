/**
 * CaloScanAi 斗內（Donation）按鈕元件
 *
 * 支援平台：
 * - Ko-fi（無手續費，適合國際贊助）
 * - Buy Me a Coffee（簡單易用）
 *
 * 使用方式：
 *   <DonationButton />          // 預設：浮動按鈕在右下角
 *   <DonationButton inline />   // 內嵌模式（用在設定頁等）
 */

import { h } from 'preact';
import { useState } from 'preact/hooks';

const KOFI_URL = 'https://ko-fi.com/caloscanai';
const BMC_URL  = 'https://www.buymeacoffee.com/caloscanai';

// 平台的 SVG 品牌色
const platformMeta = {
  kofi: {
    label: 'Ko-fi',
    bg: '#ff5e5b',
    hover: '#ff3f3b',
    color: '#ffffff',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.93 5.64a10.02 10.02 0 0 1 3.07 3.5c.2.4.2.88.02 1.28l-1.12 2.46a1.5 1.5 0 0 1-1.2.79 1.5 1.5 0 0 1-1.27-.6 6.03 6.03 0 0 0-2.24-2.07 1.5 1.5 0 0 0-1.95.64L13.1 13.2a1.5 1.5 0 0 1-2.1.2 9.98 9.98 0 0 1-3.73-4.1 1.5 1.5 0 0 1 .98-2.05l2.45-.8a6.05 6.05 0 0 0 2.57-1.6 1.5 1.5 0 0 1 1.78-.08l1.88 1.47a1.5 1.5 0 0 0 1.97-.21z"/>
      </svg>
    ),
  },
  bmc: {
    label: 'Buy Me a Coffee',
    bg: '#FFDD00',
    hover: '#f5c800',
    color: '#000000',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM8 17.5Q7.625 17.5 7.312 17.188Q7 16.875 7 16.5 7 16.125 7.312 15.812 7.625 15.5 8 15.5h.5v-2H8q-.425 0-.712.288Q7 14.075 7 14.5q0 .425.288.712Q7.575 16 8 16h.5v-1H8q-.425 0-.712.288Q7 15.875 7 15.5q0-.425.288-.713Q7.575 14.5 8 14.5h1v-2H8q-.425 0-.712.287Q7 13.075 7 13.5t.288.713Q7.575 14.5 8 14.5h.5v1.5H8q-.425 0-.712.287Q7 16.575 7 17t.288.712Q7.575 18 8 18h1v-.5zm8 0H13v-7h3q.425 0 .713.288Q17 11.575 17 12t-.287.712Q16.425 13 16 13h-2v4z"/>
      </svg>
    ),
  },
};

function DonationModal({ onClose }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(4px)',
    }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: 'var(--surface)',
        borderRadius: 'var(--radius-lg)',
        padding: '32px',
        maxWidth: '380px',
        width: '90%',
        boxShadow: 'var(--shadow-lg)',
        textAlign: 'center',
      }}>
        <h2 style={{ marginBottom: '8px', color: 'var(--text-primary)' }}>
          ☕ 支持 CaloScanAi
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
          如果這個專案對你有幫助，歡迎用一杯咖啡支持開發者繼續營運與維護。
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <a
            href={KOFI_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              padding: '14px 20px',
              background: platformMeta.kofi.bg,
              color: platformMeta.kofi.color,
              borderRadius: 'var(--radius-md)',
              textDecoration: 'none',
              fontWeight: '600',
              fontSize: '15px',
              transition: 'opacity 0.2s',
            }}
            onMouseOver={(e) => e.target.style.opacity = '0.85'}
            onMouseOut={(e) => e.target.style.opacity = '1'}
          >
            {platformMeta.kofi.icon}
            在 Ko-fi 上支持
          </a>

          <a
            href={BMC_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              padding: '14px 20px',
              background: platformMeta.bmc.bg,
              color: platformMeta.bmc.color,
              borderRadius: 'var(--radius-md)',
              textDecoration: 'none',
              fontWeight: '600',
              fontSize: '15px',
              transition: 'opacity 0.2s',
            }}
            onMouseOver={(e) => e.target.style.opacity = '0.85'}
            onMouseOut={(e) => e.target.style.opacity = '1'}
          >
            {platformMeta.bmc.icon}
            在 Buy Me a Coffee 上支持
          </a>
        </div>

        <button
          onClick={onClose}
          style={{
            marginTop: '20px',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '13px',
          }}
        >
          先不用，婉拒了 🙏
        </button>
      </div>
    </div>
  );
}

export function DonationButton({ inline = false }) {
  const [open, setOpen] = useState(false);

  if (inline) {
    return (
      <div>
        <button class="btn btn-secondary" onClick={() => setOpen(true)}>
          ☕ 斗內支持
        </button>
        {open && <DonationModal onClose={() => setOpen(false)} />}
      </div>
    );
  }

  return (
    <div>
      {/* 浮動按鈕 */}
      <button
        onClick={() => setOpen(true)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'var(--accent)',
          color: '#fff',
          border: 'none',
          cursor: 'pointer',
          boxShadow: 'var(--shadow-lg)',
          fontSize: '22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
        onMouseOver={(e) => {
          e.target.style.transform = 'scale(1.1)';
          e.target.style.boxShadow = '0 8px 20px rgba(79,70,229,0.4)';
        }}
        onMouseOut={(e) => {
          e.target.style.transform = 'scale(1)';
          e.target.style.boxShadow = 'var(--shadow-lg)';
        }}
        title="支持 CaloScanAi"
      >
        ☕
      </button>

      {open && <DonationModal onClose={() => setOpen(false)} />}
    </div>
  );
}

export default DonationButton;