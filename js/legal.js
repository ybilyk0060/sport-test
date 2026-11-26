// Юридические страницы: подставляют реквизиты продавца и цены из js/config.js, чтобы они были в одном месте.
import { CONFIG } from './config.js?v=1e0af10-mwxrb399';
const U = CONFIG.subscription.prices.USD, E = CONFIG.subscription.prices.EUR;
const S = CONFIG.seller, P = CONFIG.subscription.prices.UAH, D = CONFIG.subscription.periodDays;
const en = document.documentElement.lang !== 'uk';
const val = { name: en ? S.nameEn : S.name, address: en ? S.addressEn : S.address, rnokpp: S.rnokpp, email: S.email, phone: S.phone, edr: S.edrRecord,
  first: `${P.first} грн`, regular: `${P.regular} грн`, days: String(D),
  usd: `$${U.first} → $${U.regular}`, eur: `${E.first} € → ${E.regular} €`,
  usdFirst: `$${U.first}`, usdRegular: `$${U.regular}`, eurFirst: `${E.first} €`, eurRegular: `${E.regular} €`,
};
// Абзацы про Paddle (EN/DE) показываются, только когда владелец решит подавать заявку в Paddle
if (CONFIG.paddle) document.querySelectorAll('[data-paddle]').forEach((el) => { el.hidden = false; });
document.querySelectorAll('[data-s]').forEach((el) => {
  const v = val[el.dataset.s];
  el.textContent = v || (en ? '—' : 'уточнюється');
  if (el.dataset.s === 'email' && v) { const a = document.createElement('a'); a.href = `mailto:${v}`; a.textContent = v; el.replaceChildren(a); }
});
