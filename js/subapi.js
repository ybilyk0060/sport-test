// Подписка на сервере (функция Supabase sport-test-sub). Включается CONFIG.subServer после деплоя.
// Без сервера всё работает как раньше — на устройстве.
import { CONFIG } from './config.js?v=3ac479c-mx0jviv6';

const call = async (body) => {
  const r = await fetch(CONFIG.subFn, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(j.error || `HTTP ${r.status}`), { status: r.status });
  return j;
};
export const subOn = () => !!CONFIG.subServer;
export const siteUrl = () => `${location.origin}${location.pathname}`;
export const activate = (p) => call({ action: 'activate', returnTo: siteUrl(), ...p });
export const status = (token) => call({ action: 'status', token });
export const cancel = (token) => call({ action: 'cancel', token });
export const resume = (token) => call({ action: 'resume', token });
export const sync = (token, workouts) => call({ action: 'sync', token, workouts }).catch(() => null);
// Расторжение без входа, по email оплаты (§ 312k BGB, art. L215-1-1 C. conso.). Ответ сервера одинаковый, есть подписка или нет.
export const cancelReq = (email, lang) => call({ action: 'cancelreq', email, lang, returnTo: siteUrl() });
export const restore = (email, lang) => call({ action: 'restore', email, lang, returnTo: siteUrl() });
// «Ребёнка нет рядом»: письмо со ссылкой продолжить тест (ответы анкеты в ссылке, s=…)
export const sendLink = (email, s, lang) => call({ action: 'sendlink', email, s, lang, returnTo: siteUrl() });

// Серверная подписка → вид, который хранит страница
export const fromServer = (s) => ({ status: s.status, startedAt: s.startedAt, paidUntil: s.paidUntil, cancelledAt: s.cancelledAt, test: s.mode !== 'live', server: true });
