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

import { CONFIG } from './config.js?v=2686ed8-mwwcza31';

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

const providers = { test: testProvider, wayforpay: wayforpayProvider };

export const payment = providers[CONFIG.paymentProvider] || testProvider;

export function newOrderId(sid) {
  return `st-${sid}-${Date.now().toString(36)}`;
}
