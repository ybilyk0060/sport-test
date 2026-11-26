// Валюта, цены и даты по языку. en → USD, de → EUR, uk → UAH. Переопределение для проверки: ?cur=USD|EUR|UAH.
import { LANG } from './i18n/index.js?v=96d96ab-mwxqemy6';
import { CONFIG } from './config.js?v=96d96ab-mwxqemy6';

const BY_LANG = { en: 'USD', de: 'EUR', uk: 'UAH' };
let q = null;
try { q = new URLSearchParams(location.search).get('cur'); } catch { /* тесты */ }
export const CUR = CONFIG.subscription.prices[q] ? q : BY_LANG[LANG] || 'USD';
export const PRICE = CONFIG.subscription.prices[CUR];
const LOC = { en: 'en-US', de: 'de-DE', uk: 'uk-UA' }[LANG] || 'en-US';

// 14.99 → «$14.99» / «14,99 €» / «629 грн»
export function money(n) {
  if (CUR === 'UAH') return `${Math.round(n)} грн`;
  return new Intl.NumberFormat(LOC, { style: 'currency', currency: CUR, minimumFractionDigits: Number.isInteger(n) ? 0 : 2 }).format(n);
}
export const fmtDate = (t) => new Date(t).toLocaleDateString(LOC, { day: 'numeric', month: 'long' });
