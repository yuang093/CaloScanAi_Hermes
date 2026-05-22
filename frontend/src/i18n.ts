/**
 * CaloScanAi — i18n 設定
 * 繁體中文（預設）與英文
 */
import { initReactI18next } from 'react-i18next';
import i18nextHttpBackend from 'i18next-http-backend';
import i18n from 'i18next';

i18n
  .use(i18nextHttpBackend)
  .use(initReactI18next)
  .init({
    fallbackLng: 'zh-TW',
    defaultNS: 'common',
    ns: ['common'],
    interpolation: {
      escapeValue: false,
    },
    lng: 'zh-TW', // 預設語言
  });

export default i18n;