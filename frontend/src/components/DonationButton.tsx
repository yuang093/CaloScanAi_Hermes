'use client';

/**
 * CaloScanAi 斗內（Donation）按鈕元件（React 版本）
 *
 * 支援平台：
 * - Ko-fi（無手續費，適合國際贊助）
 * - Buy Me a Coffee（簡單易用）
 *
 * 環境變數：
 *   NEXT_PUBLIC_KOFI_URL  — Ko-fi 頁面網址
 *   NEXT_PUBLIC_BMC_URL   — Buy Me a Coffee 頁面網址
 */

import { useState } from 'react';
import styles from './DonationButton.module.css';

const KOFI_URL = process.env.NEXT_PUBLIC_KOFI_URL || 'https://ko-fi.com/caloscanai';
const BMC_URL  = process.env.NEXT_PUBLIC_BMC_URL  || 'https://www.buymeacoffee.com/caloscanai';

function DonationModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className={styles.overlay}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={styles.modal}>
        <h2 className={styles.modalTitle}>☕ 支持 CaloScanAi</h2>
        <p className={styles.modalDesc}>
          如果這個專案對你有幫助，歡迎用一杯咖啡支持開發者繼續營運與維護。
        </p>

        <div className={styles.platformList}>
          <a
            href={KOFI_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.kofiBtn}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M18.93 5.64a10.02 10.02 0 0 1 3.07 3.5c.2.4.2.88.02 1.28l-1.12 2.46a1.5 1.5 0 0 1-1.2.79 1.5 1.5 0 0 1-1.27-.6 6.03 6.03 0 0 0-2.24-2.07 1.5 1.5 0 0 0-1.95.64L13.1 13.2a1.5 1.5 0 0 1-2.1.2 9.98 9.98 0 0 1-3.73-4.1 1.5 1.5 0 0 1 .98-2.05l2.45-.8a6.05 6.05 0 0 0 2.57-1.6 1.5 1.5 0 0 1 1.78-.08l1.88 1.47a1.5 1.5 0 0 0 1.97-.21z"/>
            </svg>
            在 Ko-fi 上支持
          </a>

          <a
            href={BMC_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.bmcBtn}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
            </svg>
            在 Buy Me a Coffee 上支持
          </a>
        </div>

        <button className={styles.laterBtn} onClick={onClose}>
          先不用，婉拒了 🙏
        </button>
      </div>
    </div>
  );
}

interface DonationButtonProps {
  /** 內嵌模式（用在設定頁等） */
  inline?: boolean;
}

export default function DonationButton({ inline = false }: DonationButtonProps) {
  const [open, setOpen] = useState(false);

  if (inline) {
    return (
      <div>
        <button className={styles.inlineBtn} onClick={() => setOpen(true)}>
          ☕ 斗內支持
        </button>
        {open && <DonationModal onClose={() => setOpen(false)} />}
      </div>
    );
  }

  return (
    <div>
      <button
        className={styles.fab}
        onClick={() => setOpen(true)}
        title="支持 CaloScanAi"
        aria-label="打開斗內贊助選項"
      >
        ☕
      </button>
      {open && <DonationModal onClose={() => setOpen(false)} />}
    </div>
  );
}