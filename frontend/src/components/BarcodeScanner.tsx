'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { apiPost } from '@/lib/api';
import styles from './BarcodeScanner.module.css';

export interface BarcodeResult {
  food_name: string;
  calories: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  brand?: string;
}

interface BarcodeScannerProps {
  onResult: (result: BarcodeResult) => void;
  onError?: (error: string) => void;
}

export default function BarcodeScanner({ onResult, onError }: BarcodeScannerProps) {
  const [manualCode, setManualCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [lookingUp, setLookingUp] = useState(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const scannerRef = useRef<{ stop: () => void } | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const stopScanner = useCallback(() => {
    if (scannerRef.current) {
      scannerRef.current.stop();
      scannerRef.current = null;
    }
    setScanning(false);
  }, []);

  const lookupBarcode = useCallback(async (barcode: string) => {
    if (lookingUp) return;
    setLookingUp(true);
    try {
      const result = await apiPost<BarcodeResult>('/api/barcode/lookup', { barcode });
      onResult(result);
      setLastScanned(barcode);
    } catch {
      onError?.('條碼資料庫中無此商品，請手動輸入');
    } finally {
      setLookingUp(false);
    }
  }, [lookingUp, onResult, onError]);

  useEffect(() => {
    let html5QrCode: import('html5-qrcode').Html5Qrcode | null = null;

    const startScanner = async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        html5QrCode = new Html5Qrcode('barcode-reader');

        await html5QrCode.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 280, height: 150 },
          },
          (decodedText) => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
            if (decodedText === lastScanned) return;

            debounceRef.current = setTimeout(() => {
              lookupBarcode(decodedText);
            }, 500);
          },
          () => {}
        );

        scannerRef.current = html5QrCode;
        setScanning(true);
        setCameraError(null);
      } catch (err) {
        setCameraError('無法啟動相機，請確保已授權相機權限');
        console.error(err);
      }
    };

    startScanner();

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (html5QrCode) {
        html5QrCode.stop().catch(() => {});
      }
    };
  }, [lookupBarcode, lastScanned]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = manualCode.trim();
    if (!code) return;
    lookupBarcode(code);
    setManualCode('');
  };

  return (
    <div className={styles.scanner}>
      {/* 相機視圖 */}
      <div className={styles.cameraBox}>
        <div id="barcode-reader" className={styles.reader} />
        {scanning && (
          <div className={styles.scanOverlay}>
            <div className={styles.scanFrame} />
            <p className={styles.hint}>將條碼对准框內</p>
          </div>
        )}
        {cameraError && (
          <div className={styles.errorBox}>
            <p>{cameraError}</p>
          </div>
        )}
        {lookingUp && (
          <div className={styles.lookingUp}>
            <span>🔍 查詢中...</span>
          </div>
        )}
      </div>

      {/* 手動輸入 */}
      <form onSubmit={handleManualSubmit} className={styles.manualForm}>
        <input
          type="text"
          value={manualCode}
          onChange={(e) => setManualCode(e.target.value)}
          placeholder="或手動輸入條碼..."
          className={styles.manualInput}
        />
        <button type="submit" className={styles.manualBtn}>
          查詢
        </button>
      </form>
    </div>
  );
}