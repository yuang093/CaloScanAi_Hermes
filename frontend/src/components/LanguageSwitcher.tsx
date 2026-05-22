'use client';

import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './LanguageSwitcher.module.css';

const languages = [
  { code: 'zh-TW', label: '中', full: '繁體中文' },
  { code: 'en', label: 'EN', full: 'English' },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const switchLang = useCallback(
    (code: string) => {
      i18n.changeLanguage(code);
    },
    [i18n]
  );

  const current = i18n.language;

  return (
    <div className={styles.switcher} title={languages.find((l) => l.code === current)?.full}>
      {languages.map((lang) => (
        <button
          key={lang.code}
          className={`${styles.btn} ${current === lang.code ? styles.active : ''}`}
          onClick={() => switchLang(lang.code)}
          aria-label={`Switch to ${lang.full}`}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
}