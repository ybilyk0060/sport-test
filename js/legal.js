// Юридические страницы: подставляют реквизиты продавца и цены из js/config.js, чтобы они были в одном месте.
import { CONFIG } from './config.js';
const S = CONFIG.seller, P = CONFIG.subscription.prices.UAH, D = CONFIG.subscription.periodDays;
const val = { name: S.name, rnokpp: S.rnokpp, address: S.address, email: S.email, phone: S.phone, edr: S.edrRecord,
  first: `${P.first} грн`, regular: `${P.regular} грн`, days: String(D) };
document.querySelectorAll('[data-s]').forEach((el) => {
  const v = val[el.dataset.s];
  el.textContent = v || 'уточнюється';
  if (el.dataset.s === 'email' && v) { const a = document.createElement('a'); a.href = `mailto:${v}`; a.textContent = v; el.replaceChildren(a); }
});
