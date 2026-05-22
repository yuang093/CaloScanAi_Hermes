/**
 * CaloScanAi — next-i18next 設定
 * 繁體中文（預設）與英文
 */
const path = require('path');

module.exports = {
  i18n: {
    defaultLocale: 'zh-TW',
    locales: ['zh-TW', 'en'],
  },
  localePath: path.resolve('./public/locales'),
 Ns: {},
  interpolation: {
    escapeValue: false,
  },
};