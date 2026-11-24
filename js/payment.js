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

import { CONFIG } from './config.js';

const testProvider = {
  name: 'test',
  isTest: true,
  startCheckout({ orderId, amountUah, description, returnUrl }) {
    const u = new URL('pay-test.html', location.href);
    u.searchParams.set('order', orderId);
    u.searchParams.set('amount', String(amountUah));
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

const providers = { test: testProvider };

export const payment = providers[CONFIG.paymentProvider] || testProvider;

export function newOrderId(sid) {
  return `st-${sid}-${Date.now().toString(36)}`;
}
