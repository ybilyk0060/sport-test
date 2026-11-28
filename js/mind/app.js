// Тест «Как думает ваш ребёнок» (страница /mind): анкета родителя → тип мышления → подписка → полный отчёт и «Задание дня».
// Общие с тестом спорта: настройки и цены (config.js), оплата Paddle (payment.js), подписка на сервере (subapi.js),
// аналитика и согласие на cookie (analytics.js). Состояние этого теста хранится отдельно (mindtest.v1.state), sid посетителя общий.
// Имя ребёнка никуда не отправляется: оно остаётся в localStorage и подставляется в текст на устройстве.
// События аналитики идут с префиксом mind_ (воронка теста спорта не смешивается), см. analytics.js.

import { CONFIG } from '../config.js?v=79e9bda-mx0ku0rq';
import { payment, newOrderId, loadPaddle } from '../payment.js?v=79e9bda-mx0ku0rq';
import { track as trackRaw, state as visitor } from '../store.js?v=79e9bda-mx0ku0rq';
import { initConsent, sendLead, screenView } from '../analytics.js?v=79e9bda-mx0ku0rq';
import * as subapi from '../subapi.js?v=79e9bda-mx0ku0rq';
import { UI } from './texts.js?v=79e9bda-mx0ku0rq';
import { score, dailyPlan, dayNumber, streak } from './scoring.js?v=79e9bda-mx0ku0rq';

const app = document.getElementById('app');
const params = new URLSearchParams(location.search);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const DAY = 86400000;
const SUB = CONFIG.subscription;
const LOCAL = ['localhost', '127.0.0.1'].includes(location.hostname);

// --- Язык: ?lang=en|de|fr|ru (запоминается), иначе язык браузера (de, fr), иначе en. Русский только по ссылке. ---
const LANGS = ['en', 'de', 'fr', 'ru'];
function pickLang() {
  const q = params.get('lang');
  if (LANGS.includes(q)) { try { localStorage.setItem('mindtest.lang', q); } catch { /* нет доступа */ } return q; }
  try { const s = localStorage.getItem('mindtest.lang'); if (LANGS.includes(s)) return s; } catch { /* нет доступа */ }
  for (const l of navigator.languages || [navigator.language]) {
    const c = String(l || '').slice(0, 2).toLowerCase();
    if (c === 'de' || c === 'fr' || c === 'en') return c;
  }
  return 'en';
}
const LANG = pickLang();
const T = UI[LANG];
const loadData = () => (LANG === 'de' ? import('./data-de.js?v=79e9bda-mx0ku0rq') : LANG === 'fr' ? import('./data-fr.js?v=79e9bda-mx0ku0rq') : LANG === 'ru' ? import('./data-ru.js?v=79e9bda-mx0ku0rq') : import('./data-en.js?v=79e9bda-mx0ku0rq')).then((m) => m.default);
let D = null;

// --- Валюта и цены: en → USD, de и fr → EUR. Проверка: ?cur=USD|EUR ---
const AMERICAS = /-(CA|US)$/i.test(navigator.language || '') && (() => { try { return /^America\//.test(Intl.DateTimeFormat().resolvedOptions().timeZone || ''); } catch { return false; } })(); // fr-CA: французский текст, но доллары и без европейской галочки
const CUR = Object.hasOwn(SUB.prices, params.get('cur') || '') && params.get('cur') !== 'UAH' ? params.get('cur') : (!AMERICAS && { de: 'EUR', fr: 'EUR' }[LANG]) || 'USD';
const PRICE = SUB.prices[CUR];
const LOC = { en: 'en-US', de: 'de-DE', fr: 'fr-FR', ru: 'ru-RU' }[LANG];
const money = (n) => new Intl.NumberFormat(LOC, { style: 'currency', currency: CUR, minimumFractionDigits: Number.isInteger(n) ? 0 : 2 }).format(n);
const fmtDate = (t) => new Date(t).toLocaleDateString(LOC, { day: 'numeric', month: 'long' });
// Юридические тексты этого теста: одна страница на язык с разделами (русская версия для вычитки ведёт на английскую)
const DOC = `legal-mind-${LANG === 'de' || LANG === 'fr' ? LANG : 'en'}.html`;
const LEGAL = { pricing: `${DOC}#pricing`, terms: `${DOC}#terms`, refund: `${DOC}#refund`, privacy: `${DOC}#privacy`, contact: `${DOC}#contact` };
// Последняя ссылка — расторжение без входа: доступна с любого экрана, где есть подвал
const legalLinks = () => `<nav class="legal-links">${Object.keys(LEGAL).map((k) => `<a href="${LEGAL[k]}">${esc(T.legal[k])}</a>`).join('')}<a href="?cancel=1">${esc(T.sub.cancelLink)}</a></nav>`;

// --- Состояние ---
const KEY = 'mindtest.v1.state';
const fresh = () => ({ step: 'landing', i: 0, intro: {}, name: '', answers: {}, sliders: {}, goal: null, result: null, email: '', orderId: null, payAmount: null, pending: null, pendingAt: 0, sub: null, subToken: null, done: {}, doneFor: 0, startedAt: Date.now() });
let st = fresh();
try { const v = JSON.parse(localStorage.getItem(KEY) || 'null'); if (v && typeof v === 'object') st = { ...fresh(), ...v }; } catch { /* нет доступа */ }
const set = (patch) => { Object.assign(st, patch); try { localStorage.setItem(KEY, JSON.stringify(st)); } catch { /* нет доступа */ } if (patch.step) screenView('mind', patch.step, LANG); return st; };
// У подписчика каждое событие несёт номер дня подписки: по нему видно удержание по дням и день отмены
const track = (name, props = {}) => trackRaw(`mind_${name}`, { app: 'mind', lang: LANG, ...(st && st.sub && st.sub.startedAt ? { day: dayNumber(st.sub.startedAt) } : {}), ...props });

// --- Экран ---
let timer = 0;
// Кнопка «назад» браузера (во встроенном браузере Facebook она главная): внутри анкеты ведёт на предыдущий вопрос, а не с сайта
let onBack = null;
window.addEventListener('popstate', () => { if (onBack) onBack(); });
// Картинка задания не загрузилась: остаётся плашка с эмодзи
document.addEventListener('error', (e) => { const el = e.target; if (el && el.matches && el.matches('.dart img')) { el.parentNode.classList.remove('pic'); el.remove(); } }, true);
const AGE_ART = { 'artist-7': { age: '3-5', en: 'Clay animal', de: 'Knet-Tier', fr: 'Un animal en pâte à modeler', ru: 'Зверь из пластилина' }, 'inventor-5': { age: '3-5' } };
function screen(html, handlers = {}) {
  clearInterval(timer);
  onBack = null;
  app.innerHTML = `<section class="screen mind">${html}</section>`;
  app.firstElementChild.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (b && handlers[b.dataset.act]) handlers[b.dataset.act](b, e);
  });
  window.scrollTo(0, 0);
}
function toast(text) {
  const el = document.createElement('div');
  el.className = 'toast'; el.textContent = text;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}
const cleanUrl = () => { try { history.replaceState(null, '', location.pathname); } catch { /* нет */ } };

// --- Имя и тип ---
const girl = () => st.intro.gender === 1;
const childName = () => T.child; // имя не спрашиваем: в тексте «Ваш ребёнок»
const typeName = (k) => (girl() ? D.types[k].nameF : D.types[k].name);
const shadeTag = (r) => (r.shade ? `<span class="tag">${esc(girl() ? D.shade[r.shade].f : D.shade[r.shade].m)}</span>` : '');
const ICON = { builder: '🧱', inventor: '💡', storyteller: '📖', artist: '🎨', explorer: '🧭', leader: '🚩', helper: '🤝', mover: '⚡' };
const subActive = () => !!(st.sub && Date.now() < st.sub.paidUntil);

// --- Первый экран ---
function landing() {
  set({ step: 'landing' });
  screen(`<div class="hero"><span class="tag">${esc(T.land.kicker)}</span><h1>${esc(T.land.h1)}</h1><p class="promise">${esc(T.land.sub)}</p></div>
    <ul class="points">${T.land.points.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>
    <div class="type-chips">${Object.keys(D.types).map((k) => `<span>${ICON[k]} ${esc(D.types[k].name)}</span>`).join('')}</div>
    <div class="grow"></div>
    <button class="btn" data-act="start">${esc(T.land.cta)}</button>
    <p class="small muted center">${esc(T.land.note)}</p>
    <button class="link center" data-act="restore">${esc(T.pay.restore)}</button>
    ${legalLinks()}`, {
    start: () => { track('quiz_start'); set({ step: 'quiz', i: 0 }); quiz(); },
    restore: () => restore(),
  });
}

// --- Анкета: возраст, пол, 16 вопросов, 6 утверждений, цель = 25 шагов. Имя ребёнка не спрашиваем. ---
const steps = () => ['age', 'gender', ...D.questions.map((q) => q.id), ...D.sliders.items.map((s) => 's:' + s.id), 'goal'];
function quiz() {
  const all = steps(), i = Math.min(st.i || 0, all.length - 1), id = all[i];
  const head = `<div class="qhead"><button class="back" data-act="back" aria-label="${esc(T.common.back)}">←</button><div class="progress"><i style="width:${Math.round(((i + 1) / all.length) * 100)}%"></i></div><span class="small muted">${esc(T.quiz.count(i + 1, all.length))}</span></div>`;
  const next = () => {
    track('quiz_answer', { q: i + 1 });
    if (i + 1 >= all.length) return finish();
    try { history.pushState(null, ''); } catch { /* нет */ }
    set({ i: i + 1 }); quiz();
  };
  const back = () => { if (i === 0) return landing(); set({ i: i - 1 }); quiz(); };
  const opts = (list, sel, cls = '') => `<div class="opts ph-no-capture ${cls}">${list.map((x, n) => `<button class="opt${sel === n ? ' sel' : ''}" data-act="pick" data-n="${n}">${esc(x)}</button>`).join('')}</div>`;
  if (id === 'name') {
    screen(`${head}<h1 class="qtitle">${esc(T.intro.nameQ)}</h1>
      <input class="field" data-el="name" maxlength="20" autocomplete="off" autocapitalize="words" placeholder="${esc(T.intro.namePh)}" value="${esc(st.name)}">
      <p class="small muted">${esc(T.intro.nameNote)}</p><div class="grow"></div>
      <button class="btn" data-act="ok">${esc(T.common.next)}</button><button class="btn ghost" data-act="skip">${esc(T.common.skip)}</button>`, {
      back,
      ok: () => { set({ name: app.querySelector('[data-el=name]').value.replace(/[<>{}]/g, '').trim().slice(0, 20) }); next(); },
      skip: () => { set({ name: '' }); next(); },
    });
    onBack = back;
    return;
  }
  let title, list, sel, save, lead = '', cls = '';
  if (id === 'age') { title = D.intro.ageQ; list = D.intro.ages; sel = D.intro.ages.indexOf(st.intro.age); save = (n) => set({ intro: { ...st.intro, age: D.intro.ages[n] } }); }
  else if (id === 'gender') { title = D.intro.genderQ; list = D.intro.genders; sel = st.intro.gender; cls = 'two'; save = (n) => set({ intro: { ...st.intro, gender: n } }); }
  else if (id === 'goal') { title = D.goal.text; list = D.goal.options.map((o) => o.text); sel = D.goal.options.findIndex((o) => o.id === st.goal); save = (n) => set({ goal: D.goal.options[n].id }); }
  else if (id.startsWith('s:')) { const k = id.slice(2); title = D.sliders.items.find((s) => s.id === k).text; lead = T.quiz.sliderLead; list = D.sliders.labels; sel = (st.sliders[k] || 0) - 1; cls = 'scale'; save = (n) => set({ sliders: { ...st.sliders, [k]: n + 1 } }); }
  else { const q = D.questions.find((x) => x.id === id); title = q.text; list = q.options.map((o) => o.text); sel = st.answers[id]; save = (n) => set({ answers: { ...st.answers, [id]: n } }); }
  screen(`${head}<h1 class="qtitle">${esc(title)}</h1>${lead ? `<p class="muted">${esc(lead)}</p>` : ''}${opts(list, sel, cls)}`, {
    back,
    pick: (b) => { const box = b.parentElement; if (box.dataset.busy) return; box.dataset.busy = '1'; save(Number(b.dataset.n)); b.classList.add('sel'); setTimeout(next, 120); },
  });
  onBack = back;
}
function finish() {
  const result = score(st.answers, st.sliders);
  set({ result, step: 'result' });
  track('quiz_done');
  sendLead(visitor.sid + '-m', 'mind_quiz_complete'); // «анкета завершена» для обучения рекламы; отдельный ключ, чтобы не склеиваться с тестом спорта
  screen(`<div class="center calc"><div class="spinner"></div><h2>${esc(T.calc)}</h2></div>`);
  setTimeout(result_, 1800);
}

// --- Честный таймер скидки: один отсчёт на посетителя, обновление страницы его не перезапускает ---
const OFFER = 'mindtest.v1.offer';
let offerMem = null; // если хранилище браузера недоступно, отсчёт живёт до закрытия страницы (иначе скидки не было бы вовсе)
function offerDeadline(start = false) {
  let d = offerMem;
  try { d = JSON.parse(localStorage.getItem(OFFER) || 'null') || d; } catch { /* нет */ }
  if (!d && start) { d = { deadline: Date.now() + SUB.offerMinutes * 60000 }; try { localStorage.setItem(OFFER, JSON.stringify(d)); } catch { /* нет */ } }
  if (d) offerMem = d;
  return d ? d.deadline : 0;
}
const discountOn = () => { const d = offerDeadline(); return !!d && Date.now() < d; };
const firstPrice = () => (discountOn() ? PRICE.first : PRICE.regular);
const pct = () => Math.round((1 - PRICE.first / PRICE.regular) * 100);
const mmss = (ms) => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; };
// Строка о немедленном доступе у кнопки оплаты (без галочки): ЕС и Великобритания, по часовому поясу или языку
function needWithdrawal() {
  if (AMERICAS) return false;
  if (LANG === 'de' || LANG === 'fr') return true;
  try { return /^Europe\//.test(Intl.DateTimeFormat().resolvedOptions().timeZone || ''); } catch { return false; }
}

const bar = (k, p, locked = false) => `<div class="mbar${locked ? ' locked' : ''}"><span>${esc(typeName(k))}</span><i><b style="width:${locked ? 30 : Math.max(6, p)}%"></b></i><em>${locked ? '🔒' : ''}</em></div>`;
// Две верхние шкалы разделяет не больше одного ответа: показываем их как равные, а не «главную» и «вторую»
const blend = (r) => !!(r.points && r.points[r.primary] - r.points[r.secondary] <= 2);
function typeCard(r) {
  return `<div class="strong mind-type ph-no-capture"><span class="ic" aria-hidden="true">${ICON[r.primary]}</span><small>${esc(T.result.kicker(''))}</small><b>${esc(typeName(r.primary))}</b><span>${esc(D.types[r.primary].tagline)}</span>${shadeTag(r)}</div>
    <p class="second ph-no-capture"><span class="muted">${esc(blend(r) ? T.result.blend : T.result.second)}${LANG === 'fr' ? '\u00a0' : ''}:</span> <b>${esc(typeName(r.secondary))}</b></p>`;
}

// --- Бесплатный результат и оплата ---
function result_(note = '') {
  const r = st.result;
  if (!r) return landing();
  if (subActive()) return report();
  set({ step: 'result' });
  offerDeadline(true);
  const P = T.pay, on = discountOn(), first = firstPrice(), d = offerDeadline();
  const renewAt = Date.now() + SUB.periodDays * DAY;
  screen(`${typeCard(r)}
    <p class="lead ph-no-capture">${esc(fill(D.report[r.primary].about))}</p>
    <h2 class="sec-title">${esc(T.result.top)}</h2>
    <div class="mbars ph-no-capture">${r.order.slice(0, 3).map((k) => bar(k, r.percent[k])).join('')}</div>
    <div class="type-chips locked-chips ph-no-capture">${r.order.slice(3).map((k) => `<span>🔒 ${esc(typeName(k))}</span>`).join('')}</div>
    <div class="paywall" id="paywall"><h2>${esc(P.title)}</h2>${note ? `<p class="err">${esc(note)}</p>` : ''}
    <ul class="points checks-list">${T.result.locked.filter((_, i) => [0, 1, 4, 5].includes(i)).map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
    <div class="price-card${on ? '' : ' no-disc'}">${on ? `<span class="disc">${esc(P.discount(pct()))}</span><div class="timer" data-el="offer-timer">${esc(P.timer(mmss(d - Date.now())))}</div>` : `<div class="timer over">${esc(P.timerOver)}</div>`}
      <div class="pc-row"><div><b>${esc(P.firstLabel(SUB.periodDays))}</b></div>
      <div class="pc-price">${on ? `<s>${esc(money(PRICE.regular))}</s>` : ''}<b>${esc(money(first))}</b></div></div>
      <p class="renew">${esc(P.renew(money(PRICE.regular), SUB.periodDays, fmtDate(renewAt)))}</p>
      <label class="email-field"><span class="small">${esc(P.emailLabel)}</span><input class="field" type="email" inputmode="email" autocomplete="email" data-el="email" value="${esc(st.email || '')}" maxlength="120" placeholder="${esc(P.emailPh)}"></label>
      <p class="fine consent-line">${esc(P.fine(money(first), money(PRICE.regular), SUB.periodDays))}${needWithdrawal() ? ' ' + esc(P.instant) : ''}</p>
      <button class="btn" data-act="pay">${esc(P.cta(money(first)))}</button>
      <p class="trust small center">🔒 ${esc(P.trust)}</p></div>
    <p class="fine">${esc(D.disclaimer)}</p>
    ${legalLinks()}</div>
    <button class="link center" data-act="share">${esc(T.result.share)}</button>
    <button class="link center" data-act="restore">${esc(P.restore)}</button>
    <button class="link center" data-act="again">${esc(T.result.again)}</button>`, {
    pay: (btn) => {
      const emailEl = app.querySelector('[data-el=email]');
      const email = emailEl.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { emailEl.focus(); emailEl.scrollIntoView({ block: 'center' }); toast(P.emailBad); return; }
      if (btn.disabled) return;
      btn.disabled = true; setTimeout(() => { btn.disabled = false; }, 4000); // двойное нажатие не создаёт два заказа
      const orderId = newOrderId(visitor.sid);
      const amount = firstPrice();
      set({ email, orderId, orderAt: Date.now(), payAmount: amount, waiver: needWithdrawal() }); // сумма фиксируется в момент нажатия: таймер может истечь, пока открыто окно оплаты
      track('pay_click', { provider: payment.name, amount, discount: amount < PRICE.regular, plan: 'sub', currency: CUR });
      const ret = new URL(location.href); ret.search = ''; ret.hash = '';
      Promise.resolve(payment.startCheckout({ orderId, amount, currency: CUR, lang: LANG, email, discount: amount < PRICE.regular, description: T.title, returnUrl: ret.toString(), product: 'mind', regular: PRICE.regular }))
        .catch(() => { track('pay_error', { provider: payment.name }); toast(P.payError); });
    },
    share: () => share(r),
    restore: () => restore(),
    again: () => retake(),
  });
  // Введённый email не пропадает, когда таймер перерисовывает экран
  const emailEl = app.querySelector('[data-el=email]');
  if (emailEl) emailEl.addEventListener('input', () => set({ email: emailEl.value.trim().slice(0, 120) }));
  // Цена ниже первого экрана: отдельно считаем тех, кто до неё долистал
  const pc = app.querySelector('.price-card');
  if (pc && !st.priceSeen && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { io.disconnect(); if (!st.priceSeen) { set({ priceSeen: true }); track('price_seen', { amount: first, currency: CUR }); } } }, { threshold: 0.5 });
    io.observe(pc);
  }
  if (on) timer = setInterval(() => {
    const left = d - Date.now();
    const el = app.querySelector('[data-el=offer-timer]');
    if (el) el.textContent = P.timer(mmss(left));
    if (left <= 0) { clearInterval(timer); track('offer_timer_end'); if (st.step === 'result') result_(); }
  }, 1000);
  if (!st.shown) { track('result_shown'); track('paywall_shown', { amount: first, currency: CUR }); set({ shown: true }); }
}
function retake() {
  const keep = { sub: st.sub, subToken: st.subToken, email: st.email, orderId: st.orderId, payAmount: st.payAmount, done: st.done, doneFor: st.doneFor,
    ...(subActive() ? { result: st.result, intro: st.intro, reportShown: st.reportShown } : {}) }; // у подписчика старый отчёт живёт, пока новый тест не пройден до конца
  st = fresh(); set(keep); track('restart'); set({ step: 'quiz', i: 0 }); quiz();
}
function share(r) {
  const url = location.origin + location.pathname, text = T.result.shareText(typeName(r.primary));
  track('share');
  if (navigator.share) { navigator.share({ text, url }).catch(() => {}); return; }
  try { navigator.clipboard.writeText(`${text} ${url}`).then(() => toast(T.result.copied)); } catch { /* нет доступа */ }
}
function restore() {
  screen(`<div class="qhead"><button class="back" data-act="back" aria-label="${esc(T.common.back)}">←</button></div>
    <h1 class="qtitle">${esc(T.pay.restore)}</h1>
    <input class="field" type="email" inputmode="email" autocomplete="email" data-el="email" maxlength="120" placeholder="${esc(T.pay.restoreAsk)}" value="${esc(st.email || '')}">
    <div class="grow"></div><button class="btn" data-act="send">${esc(T.pay.restoreSend)}</button>`, {
    back: () => route(),
    send: async (b) => {
      const email = app.querySelector('[data-el=email]').value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { toast(T.pay.emailPlain); return; }
      b.disabled = true;
      try { await subapi.restore(email, LANG); } catch { b.disabled = false; toast(T.sub.error); return; } // сеть не ответила: не обещаем письмо
      track('sub_restore_asked'); toast(T.pay.restoreSent); route();
    },
  });
}

// --- После оплаты ---
// Подписка на сервере: письмо с условиями, ссылка доступа, отмена у Paddle. Если запрос не прошёл, повторяется при следующем открытии.
// Имя ребёнка на сервер не уходит: только ответы анкеты и итог.
function activateServer() {
  if (!subapi.subOn() || !st.email || !st.orderId) return Promise.resolve(false);
  const r0 = st.result;
  return subapi.activate({ orderRef: st.orderId, email: st.email, currency: CUR, first: st.payAmount ?? PRICE.first, regular: PRICE.regular, test: !!payment.isTest, lang: LANG,
    quiz: { product: 'mind', intro: st.intro, answers: st.answers, sliders: st.sliders, goal: st.goal, ...(st.waiver ? { waiver: true } : {}) },
    results: r0 ? { product: 'mind', primary: r0.primary, secondary: r0.secondary, percent: r0.percent } : { product: 'mind' } })
    .then((r) => { set({ subToken: r.token, sub: { ...subapi.fromServer(r.sub), orderId: st.orderId } }); track('sub_server', { ok: true }); return true; })
    .catch(() => { track('sub_server', { ok: false }); return false; });
}
function startSub(orderId) {
  const now = Date.now(), first = st.payAmount ?? firstPrice(), test = !!payment.isTest;
  set({ orderId, pending: null, subToken: null, sub: { status: 'active', startedAt: now, paidUntil: now + SUB.periodDays * DAY, orderId, test }, shown: false });
  track('paid', { provider: payment.name, amount: first, currency: CUR, plan: 'sub', test, order: orderId });
  activateServer();
}
// Возврат с оплаты в браузер, где нет этого заказа (другой браузер, очищенное хранилище): доступ выдаёт сервер по email оплаты
function claim(orderId) {
  screen(`<h1 class="qtitle">${esc(T.pay.claimTitle)}</h1><p class="muted">${esc(T.pay.claimLead)}</p>
    <input class="field" type="email" inputmode="email" autocomplete="email" data-el="email" maxlength="120" placeholder="${esc(T.pay.emailPh)}" value="${esc(st.email || '')}">
    <div class="grow"></div><button class="btn" data-act="send">${esc(T.pay.claimSend)}</button><button class="link center" data-act="skip">${esc(T.common.skip)}</button>`, {
    send: async (b) => {
      const email = app.querySelector('[data-el=email]').value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { toast(T.pay.emailPlain); return; }
      b.disabled = true;
      const paid = await payment.verify(orderId, 5);
      if (paid) { set({ email, orderId, payAmount: null }); if (await activateServer()) { track('paid_claimed'); return report(); } }
      set({ orderId: null, orderAt: 0 }); // чужой или неподтверждённый заказ не остаётся за этим устройством
      b.disabled = false; toast(T.pay.claimFail);
    },
    skip: () => route(),
  });
}
const fill = (s) => s.replace('{name}', childName());
function subLine() {
  const s = st.sub;
  return s.status === 'active' ? T.sub.nextCharge(fmtDate(s.paidUntil), money(PRICE.regular)) : T.sub.cancelledUntil(fmtDate(s.paidUntil));
}
function report() {
  if (!subActive()) return result_();
  const r = st.result;
  if (!r) { // подписка есть (например, оформлена на тесте спорта), а этот тест ещё не пройден
    set({ step: 'landing' });
    screen(`<div class="hero"><h1>${esc(T.land.h1)}</h1><p class="promise">${esc(T.report.needTest)}</p></div><div class="grow"></div><button class="btn" data-act="start">${esc(T.land.cta)}</button>`, {
      start: () => { track('quiz_start'); set({ step: 'quiz', i: 0 }); quiz(); },
    });
    return;
  }
  set({ step: 'report' });
  const R = T.report, x = D.report[r.primary], age = st.intro.age || '6-8';
  const sec = (title, body) => `<h2 class="sec-title">${esc(title)}</h2>${body}`;
  const fold = (title, body) => `<details class="fold"><summary>${esc(title)}</summary>${body}</details>`; // длинные разделы свёрнуты, чтобы отчёт читался за минуту
  const x2 = D.report[r.secondary];
  screen(`<span class="badge">${esc(R.badge)}</span><div class="ph-no-capture rep-body">${typeCard(r)}
    <p class="lead">${esc(fill(x.about))}</p>
    <div class="box daily-cta"><b>${esc(R.daily)}</b><span class="small muted">${esc(R.dailyLead)}</span><button class="btn" data-act="daily">${esc(R.dailyCta)}</button></div>
    ${sec(R.scales, `<div class="mbars">${r.order.map((k) => bar(k, r.percent[k])).join('')}</div>`)}
    ${sec(R.hooks, `<p>${esc(x.hooks)}</p>`)}
    ${sec(R.strengths, `<ul class="points">${x.strengths.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>`)}
    ${sec(R.grow, `<p>${esc(x.grow)}</p>`)}
    ${sec(R.say, `<div class="says">${((x.sayAge || {})[age] || x.say).map((s) => `<p>${esc(s)}</p>`).join('')}</div>`)}
    ${sec(R.acts(age), `<p>${esc(x.ages[age].charAt(0).toUpperCase() + x.ages[age].slice(1))}</p>`)}
    <details class="fold"><summary>${esc(R.plan)}</summary><ol class="plan">${((x.planAge || {})[age] || x.plan).map((s) => `<li>${esc(s)}</li>`).join('')}</ol></details>
    ${x2 ? fold(`${ICON[r.secondary]} ${typeName(r.secondary)}`, `<p>${esc(fill(x2.about))}</p><ul class="points">${x2.strengths.map((s) => `<li>${esc(s)}</li>`).join('')}</ul><p><b>${esc(R.acts(age))}:</b> ${esc(x2.ages[age])}</p>`) : ''}</div>
    <div class="box duo-cta"><b>${esc(R.duo)}</b><span class="small muted">${esc(R.duoLead)}</span><a class="btn line" href="duo.html">${esc(R.duoCta)}</a></div>
    ${CONFIG.appAccess === 'soon' ? `<p class="box small">${esc(R.appsSoon)}</p>` : ''}
    <p class="fine">${esc(D.disclaimer)}</p>
    <p class="small">${esc(subLine())}</p>
    <button class="btn line" data-act="manage">${esc(T.sub.manage)}</button>
    <button class="link center" data-act="share">${esc(T.result.share)}</button>
    <button class="link center" data-act="again">${esc(T.result.again)}</button>
    ${legalLinks()}`, {
    daily: () => daily(),
    manage: () => { track('sub_manage_open'); manage(); },
    share: () => share(r),
    again: () => retake(),
  });
  if (!st.reportShown) { track('report_shown'); set({ reportShown: true }); }
}

// --- Задание дня ---
function daily(showDay = 0, quiet = false) {
  if (!subActive() || !st.result) return route();
  set({ step: 'daily' });
  // Отметки «сделано» относятся к одной подписке: у новой подписки отсчёт дней начинается заново
  if (Math.abs((st.doneFor || 0) - st.sub.startedAt) > DAY) set({ done: st.doneFor ? {} : st.done, doneFor: st.sub.startedAt });
  const plan = dailyPlan(st.result.order);
  const today = dayNumber(st.sub.startedAt);
  const day = showDay && showDay <= today ? showDay : today;
  const card = D.cards.find((c) => c.id === plan[(day - 1) % plan.length]);
  const age = st.intro.age || '6-8';
  // У двух заданий вариант для 3–5 лет другой по сути: своя картинка и название
  const pic = AGE_ART[card.id] && AGE_ART[card.id].age === age ? `${card.id}-${age}` : card.id;
  const cardTitle = AGE_ART[card.id] && AGE_ART[card.id].age === age && AGE_ART[card.id][LANG] ? AGE_ART[card.id][LANG] : card.title;
  const doneDays = Object.keys(st.done).map(Number);
  const isDone = !!st.done[day];
  const earlier = [];
  for (let n = today; n >= Math.max(1, today - 6); n--) if (n !== day) earlier.push(n);
  screen(`<div class="qhead"><button class="back" data-act="back" aria-label="${esc(T.daily.back)}">←</button><b>${esc(T.report.daily)}</b></div>
    <div class="dcard"><div class="row"><span class="tag">${esc(T.daily.title(day))}</span><span class="tag-ok">${esc(T.daily.forAge(age))}</span></div>
      ${card.art ? `<div class="dart pic s-${card.scale}" aria-hidden="true"><img src="img/mind/cards/${esc(pic)}.webp" alt="" width="800" height="447" decoding="async">${[...new Intl.Segmenter().segment(card.art)].map((x) => `<span>${x.segment}</span>`).join('')}</div>` : ''}
      <h1 class="qtitle">${esc(cardTitle)}</h1>
      ${card.steps && card.steps[age] ? `${card.need && card.need[age] ? `<p class="need"><b>${esc(T.daily.need)}</b> ${esc(card.need[age])}</p>` : ''}
        <ol class="dsteps">${card.steps[age].map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
        ${card.why ? `<p class="dnote"><b>${esc(T.daily.why)}</b> ${esc(card.why)}</p>` : ''}${card.tip ? `<p class="dnote tip"><b>${esc(T.daily.tip)}</b> ${esc(card.tip)}</p>` : ''}`
      : `<p class="task">${esc((card.task || {})[age] || '')}</p>`}
      <p class="small muted">${esc(D.safety)}</p></div>
    ${isDone ? `<p class="box center" id="done-box"><b>✓ ${esc(day === today ? T.daily.doneMsg : T.daily.doneOld)}</b></p>` : `<button class="btn" data-act="done">${esc(T.daily.done)}</button>`}
    ${day !== today ? `<button class="btn line" data-act="today">${esc(T.daily.today)}</button>` : ''}
    ${doneDays.length ? `<div class="row stats"><span>🔥 ${esc(T.daily.streak(streak(doneDays, today)))}</span><span>${esc(T.daily.total(doneDays.length))}</span></div>` : ''}
    ${today > plan.length ? `<p class="small muted">${esc(T.daily.finished)}</p>` : ''}
    ${earlier.length ? `<h2 class="sec-title">${esc(T.daily.earlier)}</h2><div class="days">${earlier.map((n) => { const c = D.cards.find((y) => y.id === plan[(n - 1) % plan.length]); return `<button class="day" data-act="open" data-n="${n}"><span>${esc(T.daily.title(n))}</span><b>${esc(c.title)}</b><em>${st.done[n] ? '✓' : esc(T.daily.missed)}</em></button>`; }).join('')}</div>` : ''}
    <div class="grow"></div><button class="btn ghost" data-act="back">${esc(T.daily.back)}</button>`, {
    back: () => report(),
    done: () => { set({ done: { ...st.done, [day]: card.id } }); track('daily_done', { n: day, key: card.id, age, streak: streak([...doneDays, day], today) }); daily(day, true); const box = document.getElementById('done-box'); if (box) box.scrollIntoView({ block: 'center' }); },
    open: (b) => daily(Number(b.dataset.n)),
    today: () => daily(),
  });
  if (!quiet) track('daily_open', { n: day, key: card.id, age, src: day === today ? 'today' : 'earlier', done: isDone });
}

// --- Моя подписка ---
function manage(confirm = false) {
  const S = T.sub, sub = st.sub;
  if (!sub) return route();
  set({ step: 'manage' });
  const row = (k, v) => `<div class="rowline"><span class="muted">${esc(k)}</span><b>${esc(v)}</b></div>`;
  const change = async (action) => {
    // Настоящая подписка меняется только на сервере (он отменяет списания у Paddle). Без ответа сервера «отменено» не показываем.
    if (!st.subToken && !sub.test && subapi.subOn()) await activateServer();
    if (st.subToken) {
      try { const r = await subapi[action](st.subToken); set({ sub: { ...st.sub, ...subapi.fromServer(r.sub) } }); } catch { toast(S.error); return false; }
    } else if (sub.test || !subapi.subOn()) set({ sub: { ...st.sub, status: action === 'cancel' ? 'cancelled' : 'active' } });
    else { toast(S.error); return false; }
    return true;
  };
  screen(`<div class="qhead"><button class="back" data-act="back" aria-label="${esc(T.common.back)}">←</button></div><h1 class="rtitle">${esc(S.manage)}</h1>
    <div class="box">${row(S.status, sub.status === 'active' ? S.active : S.cancelledS)}${row(S.paidUntil, fmtDate(sub.paidUntil))}${sub.status === 'active' ? row(S.price, S.perPeriod(money(PRICE.regular), SUB.periodDays)) : ''}</div>
    <p class="small">${esc(subLine())}</p><div class="grow"></div>
    ${sub.status === 'active' ? (confirm ? `<p><b>${esc(S.cancelAsk)}</b></p><button class="btn" data-act="yes">${esc(S.cancelYes)}</button><button class="btn ghost" data-act="no">${esc(S.cancelNo)}</button>`
      : `<button class="btn line" data-act="cancel">${esc(S.cancel)}</button>`) : `<button class="btn" data-act="resume">${esc(S.resume)}</button>`}`, {
    back: () => report(),
    cancel: () => { track('sub_cancel_ask'); manage(true); },
    no: () => manage(),
    yes: async () => { if (await change('cancel')) { track('sub_cancelled', { test: !!sub.test }); toast(S.cancelDone); manage(); } },
    resume: async () => { if (await change('resume')) { track('sub_resumed'); toast(S.resumeDone); manage(); } },
  });
}

// Расторжение без входа: email оплаты и одна кнопка. Подтверждение приходит письмом.
function cancelForm() {
  const S = T.sub;
  screen(`<div class="qhead"><button class="back" data-act="back" aria-label="${esc(T.common.back)}">←</button></div>
    <h1 class="qtitle">${esc(S.cancelLink)}</h1><p class="muted">${esc(S.cancelReqLead)}</p>
    <input class="field" type="email" inputmode="email" autocomplete="email" data-el="email" maxlength="120" placeholder="${esc(T.pay.restoreAsk)}" value="${esc(st.email || '')}">
    <div class="grow"></div><button class="btn" data-act="send">${esc(S.cancelReqSend)}</button>`, {
    back: () => route(),
    send: async (b) => {
      const email = app.querySelector('[data-el=email]').value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { toast(T.pay.emailPlain); return; }
      b.disabled = true;
      try { await subapi.cancelReq(email, LANG); } catch { b.disabled = false; toast(S.error); return; }
      track('sub_cancel_form');
      if (st.sub && st.email && st.email.toLowerCase() === email.toLowerCase()) set({ sub: { ...st.sub, status: 'cancelled' } });
      screen(`<div class="hero"><h1>${esc(S.cancelReqDone)}</h1><p class="promise">${esc(S.cancelReqNote)}</p></div><div class="grow"></div><button class="btn line" data-act="ok">${esc(T.common.next)}</button>`, { ok: () => route() });
    },
  });
}
function route() {
  if (subActive()) return st.step === 'daily' ? daily() : st.step === 'manage' ? manage() : report();
  if (st.step === 'quiz') return quiz();
  if (st.result && st.step !== 'landing') return result_(); // в т.ч. подписка закончилась: показываем результат и оплату, а не первый экран
  return landing();
}

// Баннер согласия на cookie рисует общий модуль на языке сайта (en/de); для fr и ru подставляем свои тексты
function localizeConsent() {
  const el = document.querySelector('.consent');
  if (!el || !T.consent) return;
  const a = el.querySelector('a'), p = el.querySelector('p'), bs = el.querySelectorAll('button');
  if (a) a.href = LEGAL.privacy; // на своём домене общих privacy-страниц нет
  if (p && a) { p.firstChild.textContent = T.consent.text + ' '; a.textContent = T.consent.more; }
  if (bs[0]) bs[0].textContent = T.consent.decline;
  if (bs[1]) bs[1].textContent = T.consent.accept;
}

async function boot() {
  document.title = T.title;
  document.documentElement.lang = T.lang;
  screen('<div class="center calc"><div class="spinner"></div></div>');
  try { D = await loadData(); } catch { screen('<p class="center">Please reload the page.</p>'); return; }
  initConsent();
  localizeConsent();

  // Проверка экранов после оплаты без денег: только на localhost (?demo=paid)
  if (LOCAL && params.get('demo') === 'paid' && st.result) { const now = Date.now(); set({ sub: { status: 'active', startedAt: now - (Number(params.get('day')) || 0) * DAY, paidUntil: now + 30 * DAY, test: true } }); }

  // Ссылка доступа из письма (?sub=…): подписка и ответы приезжают с сервера, на любом устройстве
  if (params.get('sub') && subapi.subOn()) {
    const token = params.get('sub');
    try {
      const s = (await subapi.status(token)).sub;
      const patch = { subToken: token, sub: subapi.fromServer(s) };
      if (!st.result && s.quiz && s.quiz.product === 'mind' && s.quiz.answers) { // более свежий результат на этом устройстве не затираем
        Object.assign(patch, { intro: s.quiz.intro || {}, answers: s.quiz.answers, sliders: s.quiz.sliders || {}, goal: s.quiz.goal || null });
        patch.result = score(patch.answers, patch.sliders);
      }
      set(patch); cleanUrl(); track('sub_restored');
      return report();
    } catch { cleanUrl(); route(); toast(T.sub.error); return; }
  }
  // Статус подписки с сервера (отмена на другом устройстве или из письма)
  // Ждём ответ до 4 секунд: иначе продлившийся подписчик увидел бы экран продажи по устаревшей локальной дате.
  if (st.subToken && subapi.subOn()) await Promise.race([subapi.status(st.subToken).then((r) => { set({ sub: { ...st.sub, ...subapi.fromServer(r.sub) } }); if (subActive() && st.step === 'result' && app.querySelector('#paywall')) report(); }).catch(() => {}), new Promise((res) => setTimeout(res, 4000))]);
  // Активация на сервере не прошла в прошлый раз (сеть): повторяем
  if (st.sub && !st.subToken && !st.sub.test) activateServer();
  // Ссылка оплаты из Paddle (?_ptxn=…): Paddle.js сам откроет окно оплаты
  if (params.get('_ptxn') && CONFIG.paddleCheckout) loadPaddle().catch(() => {});
  // Возврат после оплаты: доступ открывается только после подтверждения сервером
  const ret = payment.readReturn(location.href);
  const back = ret.status === 'check';
  if (back) {
    cleanUrl();
    // Номер заказа из адреса принимаем, только если это заказ с этого устройства; чужой или неизвестный идёт через email и сервер
    if (ret.orderId && ret.orderId !== st.orderId) return claim(ret.orderId);
    if (st.orderId) set({ pending: st.orderId, pendingAt: Date.now() });
  }
  // Заказ ждёт подтверждения: проверяем при каждом открытии (перезагрузка во время проверки или медленный вебхук не теряют оплату)
  if (st.pending && (subActive() || Date.now() - (st.pendingAt || 0) > 2 * DAY)) set({ pending: null });
  if (st.pending) {
    screen(`<div class="center calc"><div class="spinner"></div><h2>${esc(T.pay.checking)}</h2></div>`);
    if (await payment.verify(st.pending, back ? 15 : 2)) { startSub(st.pending); return report(); }
    if (back) track('pay_unconfirmed', { provider: payment.name });
    if (back || st.result) return st.result ? result_(T.pay.pending) : landing(); // и после перезагрузки во время проверки предупреждаем не платить второй раз
  } else if (st.orderId && !subActive() && Date.now() - (st.orderAt || 0) < 2 * DAY) {
    // Оплата могла пройти, а возврата на сайт не было (закрыли вкладку или браузер соцсети): тихо проверяем последний заказ
    const oid = st.orderId;
    Promise.resolve(payment.verify(oid, 1)).then((ok) => { if (ok && !subActive() && st.orderId === oid) { startSub(oid); report(); } }).catch(() => {});
  }
  if (params.get('cancel')) { cleanUrl(); return cancelForm(); }
  track('open', { ref: document.referrer ? new URL(document.referrer).hostname : '', utm: params.get('utm_source') || '' });
  route();
}
boot();
