'use client';
import { useStyle } from '@/contexts/StyleContext';

const styles = [
  {
    id: 'v1' as const,
    name: 'V1 樱花极简',
    swatch: 'linear-gradient(135deg, #f8c8d4, #c97d8e)',
    font: "'Zen Maru Gothic', sans-serif",
  },
  {
    id: 'v3' as const,
    name: 'V3 温暖编辑',
    swatch: 'linear-gradient(135deg, #e8d5cc, #c45c3a)',
    font: "'Playfair Display', serif",
  },
  {
    id: 'v5' as const,
    name: 'V5 新粗野主义',
    swatch: 'linear-gradient(135deg, #ff6b35, #f7c545)',
    font: "'Nunito', sans-serif",
  },
];

export default function StylePicker() {
  const { style, setStyle } = useStyle();

  return (
    <div style={{
      display: 'flex',
      gap: '12px',
      marginBottom: '32px',
      justifyContent: 'center',
    }}>
      {styles.map((s) => (
        <button
          key={s.id}
          onClick={() => setStyle(s.id)}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px',
            padding: '10px 16px',
            border: style === s.id ? '2px solid #c97d8e' : '2px solid #e8e2db',
            borderRadius: '12px',
            background: 'transparent',
            cursor: 'pointer',
            transition: 'all 0.2s',
            fontFamily: s.font,
          }}
        >
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: s.swatch,
          }} />
          <span style={{
            fontSize: '11px',
            color: style === s.id ? '#c97d8e' : '#8a8279',
            letterSpacing: '0.05em',
          }}>
            {s.name}
          </span>
        </button>
      ))}
    </div>
  );
}