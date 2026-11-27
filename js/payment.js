// Оплата за одним интерфейсом. Данные карт на нашей странице НЕ вводятся никогда:
// провайдер = «куда перейти» + «как понять, что оплата прошла».
//
// Интерфейс провайдера:
//   startCheckout({ orderId, amountUah, description, returnUrl }) -> переход на страницу платёжной системы
//   readReturn(url) -> { status: 'paid' | 'cancelled' | null, orderId }
//
// Чтобы подключить настоящего провайдера (WayForPay / LiqPay / monobank):
//   1) добавить объект с этими двумя методами; подпись запроса делается на сервере провайдера или в функции-посреднике,
//      секретный ключ в браузер не кладётся;
//   2) подтверждение оплаты брать из серверного callback провайдера, а не из адреса возврата;
//   3) поменять CONFIG.paymentProvider.

import { CONFIG } from './config.js?v=924356b-mwz4glfn';
import { track } from './store.js?v=924356b-mwz4glfn';
import { adContext } from './analytics.js?v=924356b-mwz4glfn';

const testProvider = {
  name: 'test',
  isTest: true,
  startCheckout({ orderId, amount, currency = 'UAH', lang, description, returnUrl }) {
    const u = new URL('pay-test.html', location.href);
    u.searchParams.set('order', orderId);
    u.searchParams.set('amount', String(amount));
    u.searchParams.set('cur', currency);
    if (lang) u.searchParams.set('lang', lang);
    u.searchParams.set('desc', description);
    u.searchParams.set('return', returnUrl);
    location.href = u.toString();
  },
  readReturn(url) {
    const p = new URL(url).searchParams;
    const s = p.get('pay');
    if (s !== 'paid' && s !== 'cancelled') return { status: null, orderId: null };
    return { status: s, orderId: p.get('order') };
  },
};

// WayForPay через функцию Supabase sport-test-pay: подпись и секрет — на сервере,
// оплата подтверждается сервером (callback WayForPay + CHECK_STATUS), а не адресом возврата.
// Без секретов функция работает на публичном тестовом мерчанте WayForPay (деньги не списываются).
const wayforpayProvider = {
  name: 'wayforpay',
  isTest: true, // уточняется ответом сервера (mode)
  async mode() {
    try { const r = await fetch(CONFIG.payFn).then((x) => x.json()); this.isTest = r.mode !== 'live'; return r.mode; } catch { return null; }
  },
  async startCheckout({ orderId, returnUrl }) {
    const r = await fetch(CONFIG.payFn, { method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'create', orderRef: orderId, sid: orderId.split('-')[1] || '', returnTo: returnUrl }) }).then((x) => x.json());
    if (!r.payUrl) throw new Error(r.error || 'checkout failed');
    const f = document.createElement('form'); f.method = 'POST'; f.action = r.payUrl; f.acceptCharset = 'utf-8';
    for (const [k, v] of Object.entries(r.fields)) { const i = document.createElement('input'); i.type = 'hidden'; i.name = k; i.value = v; f.appendChild(i); }
    document.body.appendChild(f); f.submit();
  },
  readReturn(url) {
    const p = new URL(url).searchParams;
    return p.get('pay') === 'check' ? { status: 'check', orderId: p.get('order') } : { status: null, orderId: null };
  },
  // Ждём подтверждения до ~20 секунд (callback иногда приходит чуть позже возврата).
  async verify(orderId) {
    for (let i = 0; i < 10; i++) {
      try {
        const r = await fetch(CONFIG.payFn, { method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ action: 'status', orderRef: orderId }) }).then((x) => x.json());
        if (r.paid) return true;
        if (['Declined', 'Expired', 'Refunded', 'Voided'].includes(r.status) && i >= 2) return false;
      } catch { /* повтор */ }
      await new Promise((res) => setTimeout(res, 2000));
    }
    return false;
  },
};

// Paddle Billing (Merchant of Record для США и ЕС). Окно оплаты Paddle поверх страницы: карта вводится у Paddle, не у нас.
// Первые 30 дней по сниженной цене — скидка Paddle на первый период (discountId), дальше цена подписки (priceId).
// Доступ открывается только после вебхука Paddle на сервер (sport-test-paddle → sport_test_orders.status='paid'),
// а не по событию в браузере. CONFIG.paddleCheckout: { env: 'sandbox' | 'production', token, prices: { USD: { price, discount }, EUR: {...} } }.
let paddleReady = null;
let paddleHandler = null; // обработчик текущего окна оплаты: при повторном «Оплатить» — новый заказ, новый обработчик
export function loadPaddle(onEvent) {
  if (onEvent) paddleHandler = onEvent;
  if (paddleReady) return paddleReady;
  const C = CONFIG.paddleCheckout;
  paddleReady = new Promise((resolve, reject) => {
    const s = document.createElement('script'); s.src = 'https://cdn.paddle.com/paddle/v2/paddle.js'; s.async = true;
    s.onload = () => {
      try {
        if (C.env === 'sandbox') window.Paddle.Environment.set('sandbox');
        window.Paddle.Initialize({ token: C.token, eventCallback: (e) => paddleHandler && paddleHandler(e) });
        resolve(window.Paddle);
      } catch (e) { reject(e); }
    };
    s.onerror = () => { paddleReady = null; reject(new Error('paddle.js')); };
    document.head.appendChild(s);
  });
  return paddleReady;
}
async function sha256(s) {
  try { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join(''); } catch { return ''; }
}
// Страна покупателя для окна Paddle (чтобы не спрашивать отдельным шагом): из языка браузера (en-US → US) или часового пояса
function country() {
  try {
    const m = /-([A-Z]{2})$/i.exec(navigator.language || ''); if (m) return m[1].toUpperCase();
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    const map = { 'Europe/Berlin': 'DE', 'Europe/Vienna': 'AT', 'Europe/London': 'GB', 'Europe/Zurich': 'CH', 'Europe/Kyiv': 'UA', 'Europe/Kiev': 'UA' };
    return map[tz] || null;
  } catch { return null; }
}
// Промокод из ссылки (?code=KTQA25X9) запоминается на время визита: при оплате адрес уже может быть очищен
function promoCode() {
  try {
    const c = new URLSearchParams(location.search).get('code');
    if (c && /^[A-Za-z0-9_-]{3,32}$/.test(c)) sessionStorage.setItem('sporttest.code', c.toUpperCase());
    return sessionStorage.getItem('sporttest.code');
  } catch { return null; }
}
promoCode();
const paddleProvider = {
  name: 'paddle',
  get isTest() { return !CONFIG.paddleCheckout || CONFIG.paddleCheckout.env !== 'production'; },
  async mode() { return this.isTest ? 'test' : 'live'; },
  async startCheckout({ orderId, currency = 'USD', lang, email, discount, returnUrl }) {
    const C = CONFIG.paddleCheckout, pr = C && C.prices[currency];
    if (!pr || !pr.price) throw new Error('no paddle price for ' + currency);
    const done = new URL(returnUrl); done.searchParams.set('pay', 'check'); done.searchParams.set('order', orderId);
    let seenLoaded = false, codeFallback = false;
    const code = promoCode(), intro = discount && pr.discount ? { discountId: pr.discount } : {};
    const P = await loadPaddle((e) => {
      const n = e && e.name;
      // Код из ссылки не принят (исчерпан, истёк, опечатка): Paddle тогда открывает окно по полной цене. Покупателю обещана
      // цена первого месяца со страницы, поэтому закрываем окно и открываем заново с обычной скидкой первого платежа.
      if (n === 'checkout.loaded' && code && !codeFallback && !(e.data && e.data.discount)) {
        codeFallback = true; seenLoaded = true;
        track('checkout_code_rejected', { provider: 'paddle', order: orderId });
        try { sessionStorage.removeItem('sporttest.code'); } catch { /* нет доступа */ }
        P.Checkout.close();
        setTimeout(() => P.Checkout.open(opts(intro)), 400);
        return;
      }
      // Что происходит в окне Paddle (аналитика воронки): открылось, закрыли без оплаты, ошибка оплаты
      if (n === 'checkout.loaded' && !seenLoaded) { seenLoaded = true; track('checkout_open', { provider: 'paddle', order: orderId }); }
      if (n === 'checkout.closed') track('checkout_closed', { provider: 'paddle', order: orderId });
      if (n === 'checkout.payment.failed' || n === 'checkout.error') track('checkout_failed', { provider: 'paddle', order: orderId, reason: n, error: String((e.error && (e.error.code || e.error.type)) || (e.data && e.data.payment && e.data.payment.method_details && e.data.payment.method_details.type) || '').slice(0, 60) });
      if (n === 'checkout.completed') setTimeout(() => { location.href = done.toString(); }, 300);
    });
    const em = email ? await sha256(email.trim().toLowerCase()) : '';
    const opts = (disc) => ({
      items: [{ priceId: pr.price, quantity: 1 }],
      // ?code=КОД — промокод Paddle применяется сам (проверочная покупка, партнёрские коды); иначе скидка первого платежа, пока идёт таймер
      ...disc,
      ...(email ? { customer: { email, ...(country() ? { address: { countryCode: country() } } : {}) } } : {}),
      // order_ref — связь с заказом; остальное — для покупки в Meta с сервера (Conversions API), email только в виде хеша
      customData: { order_ref: orderId, ...adContext(), ...(em ? { em } : {}), ...(country() ? { country: country() } : {}) },
      settings: { displayMode: 'overlay', variant: 'one-page', theme: 'light', locale: lang || 'en', allowLogout: false, successUrl: done.toString() },
    });
    P.Checkout.open(opts(code ? { discountCode: code } : intro));
  },
  readReturn: wayforpayProvider.readReturn,
  // Ждём вебхук Paddle (обычно секунды): сервер отвечает, оплачен ли заказ
  async verify(orderId) {
    for (let i = 0; i < 15; i++) {
      try {
        const r = await fetch(CONFIG.subFn, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'order', orderRef: orderId }) }).then((x) => x.json());
        if (r.paid) return true;
      } catch { /* повтор */ }
      await new Promise((res) => setTimeout(res, 2000));
    }
    return false;
  },
};

const providers = { test: testProvider, wayforpay: wayforpayProvider, paddle: paddleProvider };

export const payment = providers[CONFIG.paymentProvider] || testProvider;

export function newOrderId(sid) {
  return `st-${sid}-${Date.now().toString(36)}`;
}
