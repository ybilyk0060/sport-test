// Тест «Как думает ваш ребёнок» (страница /mind): анкета родителя → тип мышления → подписка → полный отчёт и «Задание дня».
// Общие с тестом спорта: настройки и цены (config.js), оплата Paddle (payment.js), подписка на сервере (subapi.js),
// аналитика и согласие на cookie (analytics.js). Состояние этого теста хранится отдельно (mindtest.v1.state), sid посетителя общий.
// Имя ребёнка никуда не отправляется: оно остаётся в localStorage и подставляется в текст на устройстве.
// События аналитики идут с префиксом mind_ (воронка теста спорта не смешивается), см. analytics.js.

import { CONFIG } from '../config.js?v=7a4e716-mx078zpq';
import { payment, newOrderId, loadPaddle } from '../payment.js?v=7a4e716-mx078zpq';
import { track as trackRaw, state as visitor } from '../store.js?v=7a4e716-mx078zpq';
import { initConsent, sendLead } from '../analytics.js?v=7a4e716-mx078zpq';
import * as subapi from '../subapi.js?v=7a4e716-mx078zpq';
import { UI } from './texts.js?v=7a4e716-mx078zpq';
import { score, dailyPlan, dayNumber, streak } from './scoring.js?v=7a4e716-mx078zpq';

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
const loadData = () => (LANG === 'de' ? import('./data-de.js?v=7a4e716-mx078zpq') : LANG === 'fr' ? import('./data-fr.js?v=7a4e716-mx078zpq') : LANG === 'ru' ? import('./data-ru.js?v=7a4e716-mx078zpq') : import('./data-en.js?v=7a4e716-mx078zpq')).then((m) => m.default);
let D = null;

// --- Валюта и цены: en → USD, de и fr → EUR. Проверка: ?cur=USD|EUR ---
const CUR = SUB.prices[params.get('cur')] && params.get('cur') !== 'UAH' ? params.get('cur') : { de: 'EUR', fr: 'EUR' }[LANG] || 'USD';
const PRICE = SUB.prices[CUR];
const LOC = { en: 'en-US', de: 'de-DE', fr: 'fr-FR', ru: 'ru-RU' }[LANG];
const money = (n) => new Intl.NumberFormat(LOC, { style: 'currency', currency: CUR, minimumFractionDigits: Number.isInteger(n) ? 0 : 2 }).format(n);
const fmtDate = (t) => new Date(t).toLocaleDateString(LOC, { day: 'numeric', month: 'long' });
const LEGAL = LANG === 'de'
  ? { pricing: 'pricing-de.html', terms: 'agb-de.html', refund: 'refund-de.html', privacy: 'privacy-de.html', contact: 'impressum-de.html' }
  : { pricing: 'pricing-en.html', terms: 'terms-en.html', refund: 'refund-en.html', privacy: 'privacy-en.html', contact: 'contact-en.html' };
const legalLinks = () => `<nav class="legal-links">${Object.keys(LEGAL).map((k) => `<a href="${LEGAL[k]}">${esc(T.legal[k])}</a>`).join('')}</nav>`;

// --- Состояние ---
const KEY = 'mindtest.v1.state';
const fresh = () => ({ step: 'landing', i: 0, intro: {}, name: '', answers: {}, sliders: {}, goal: null, result: null, email: '', orderId: null, sub: null, subToken: null, done: {}, startedAt: Date.now() });
let st = fresh();
try { const v = JSON.parse(localStorage.getItem(KEY) || 'null'); if (v && typeof v === 'object') st = { ...fresh(), ...v }; } catch { /* нет доступа */ }
const set = (patch) => { Object.assign(st, patch); try { localStorage.setItem(KEY, JSON.stringify(st)); } catch { /* нет доступа */ } return st; };
const track = (name, props = {}) => trackRaw(`mind_${name}`, { app: 'mind', lang: LANG, ...props });

// --- Экран ---
let timer = 0;
function screen(html, handlers = {}) {
  clearInterval(timer);
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
const childName = () => st.name || T.child;
const typeName = (k) => (girl() ? D.types[k].nameF : D.types[k].name);
const shadeTag = (r) => (r.shade ? `<span class="tag">${esc(girl() ? D.shade[r.shade].f : D.shade[r.shade].m)}</span>` : '');
const subActive = () => !!(st.sub && Date.now() < st.sub.paidUntil);

// --- Первый экран ---
function landing() {
  set({ step: 'landing' });
  screen(`<div class="hero"><span class="tag">${esc(T.land.kicker)}</span><h1>${esc(T.land.h1)}</h1><p class="promise">${esc(T.land.sub)}</p></div>
    <ul class="points">${T.land.points.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>
    <div class="type-chips">${Object.keys(D.types).map((k) => `<span>${esc(D.types[k].name)}</span>`).join('')}</div>
    <div class="grow"></div>
    <button class="btn" data-act="start">${esc(T.land.cta)}</button>
    <p class="small muted center">${esc(T.land.note)}</p>
    <button class="link center" data-act="restore">${esc(T.pay.restore)}</button>
    ${legalLinks()}`, {
    start: () => { track('quiz_start'); set({ step: 'quiz', i: 0 }); quiz(); },
    restore: () => restore(),
  });
}

// --- Анкета: возраст, пол, имя, 16 вопросов, 6 утверждений, цель = 26 шагов ---
const steps = () => ['age', 'gender', 'name', ...D.questions.map((q) => q.id), ...D.sliders.items.map((s) => 's:' + s.id), 'goal'];
function quiz() {
  const all = steps(), i = Math.min(st.i || 0, all.length - 1), id = all[i];
  const head = `<div class="qhead"><button class="back" data-act="back" aria-label="${esc(T.common.back)}">←</button><div class="progress"><i style="width:${Math.round(((i + 1) / all.length) * 100)}%"></i></div><span class="small muted">${esc(T.quiz.count(i + 1, all.length))}</span></div>`;
  const next = () => {
    track('quiz_answer', { q: i + 1 });
    if (i + 1 >= all.length) return finish();
    set({ i: i + 1 }); quiz();
  };
  const back = () => { if (i === 0) return landing(); set({ i: i - 1 }); quiz(); };
  const opts = (list, sel, cls = '') => `<div class="opts ${cls}">${list.map((x, n) => `<button class="opt${sel === n ? ' sel' : ''}" data-act="pick" data-n="${n}">${esc(x)}</button>`).join('')}</div>`;
  if (id === 'name') {
    screen(`${head}<h1 class="qtitle">${esc(T.intro.nameQ)}</h1>
      <input class="field" data-el="name" maxlength="20" autocomplete="off" autocapitalize="words" placeholder="${esc(T.intro.namePh)}" value="${esc(st.name)}">
      <p class="small muted">${esc(T.intro.nameNote)}</p><div class="grow"></div>
      <button class="btn" data-act="ok">${esc(T.common.next)}</button><button class="btn ghost" data-act="skip">${esc(T.common.skip)}</button>`, {
      back,
      ok: () => { set({ name: app.querySelector('[data-el=name]').value.replace(/[<>{}]/g, '').trim().slice(0, 20) }); next(); },
      skip: () => { set({ name: '' }); next(); },
    });
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
    pick: (b) => { save(Number(b.dataset.n)); b.classList.add('sel'); setTimeout(next, 120); },
  });
}
function finish() {
  const result = score(st.answers, st.sliders);
  set({ result, step: 'result' });
  track('quiz_done');
  sendLead(visitor.sid + '-m'); // «анкета завершена» для обучения рекламы; отдельный ключ, чтобы не склеиваться с тестом спорта
  screen(`<div class="center calc"><div class="spinner"></div><h2>${esc(T.calc)}</h2></div>`);
  setTimeout(result_, 1800);
}

// --- Честный таймер скидки: один отсчёт на посетителя, обновление страницы его не перезапускает ---
const OFFER = 'mindtest.v1.offer';
function offerDeadline(start = false) {
  let d = null;
  try { d = JSON.parse(localStorage.getItem(OFFER) || 'null'); } catch { /* нет */ }
  if (!d && start) { d = { deadline: Date.now() + SUB.offerMinutes * 60000 }; try { localStorage.setItem(OFFER, JSON.stringify(d)); } catch { /* нет */ } }
  return d ? d.deadline : 0;
}
const discountOn = () => { const d = offerDeadline(); return !!d && Date.now() < d; };
const firstPrice = () => (discountOn() ? PRICE.first : PRICE.regular);
const pct = () => Math.round((1 - PRICE.first / PRICE.regular) * 100);
const mmss = (ms) => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; };
// Согласие на немедленный доступ (право отказа): ЕС и Великобритания, по часовому поясу или языку
function needWithdrawal() {
  if (LANG === 'de' || LANG === 'fr') return true;
  try { return /^Europe\//.test(Intl.DateTimeFormat().resolvedOptions().timeZone || ''); } catch { return false; }
}

const bar = (k, p, locked = false) => `<div class="mbar${locked ? ' locked' : ''}"><span>${esc(typeName(k))}</span><i><b style="width:${locked ? 60 : Math.max(4, p)}%"></b></i><em>${locked ? '🔒' : p + '%'}</em></div>`;
function typeCard(r) {
  return `<div class="strong mind-type"><small>${esc(T.result.kicker(st.name))}</small><b>${esc(typeName(r.primary))}</b><span>${esc(D.types[r.primary].tagline)}</span>${shadeTag(r)}</div>
    <p class="second"><span class="muted">${esc(T.result.second)}${LANG === 'fr' ? '\u00a0' : ''}:</span> <b>${esc(typeName(r.secondary))}</b></p>`;
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
    <h2 class="sec-title">${esc(T.result.top)}</h2>
    <div class="mbars">${r.order.slice(0, 3).map((k) => bar(k, r.percent[k])).join('')}${r.order.slice(3).map((k) => bar(k, 0, true)).join('')}</div>
    <div class="paywall" id="paywall"><h2>${esc(P.title)}</h2>${note ? `<p class="err">${esc(note)}</p>` : ''}
    <div class="price-card${on ? '' : ' no-disc'}">${on ? `<span class="disc">${esc(P.discount(pct()))}</span><div class="timer" data-el="offer-timer">${esc(P.timer(mmss(d - Date.now())))}</div>` : `<div class="timer over">${esc(P.timerOver)}</div>`}
      <div class="pc-row"><div><b>${esc(P.firstLabel(SUB.periodDays))}</b><small>${esc(P.perDay(money(Math.round((first / SUB.periodDays) * 100) / 100)))}</small></div>
      <div class="pc-price">${on ? `<s>${esc(money(PRICE.regular))}</s>` : ''}<b>${esc(money(first))}</b></div></div>
      <p class="renew">${esc(P.renew(money(PRICE.regular), SUB.periodDays, fmtDate(renewAt)))}</p>
      <label class="email-field"><span class="small">${esc(P.emailLabel)}</span><input class="field" type="email" inputmode="email" autocomplete="email" data-el="email" value="${esc(st.email || '')}" maxlength="120" placeholder="${esc(P.emailPh)}"></label>
      ${needWithdrawal() ? `<label class="check small"><input type="checkbox" data-el="withdrawal"><span>${esc(P.withdrawal)} <a href="${LEGAL.refund}" target="_blank" rel="noopener">${esc(P.withdrawalLink)}</a></span></label>` : ''}
      <button class="btn" data-act="pay">${esc(P.cta(money(first)))}</button>
      <p class="trust small center">🔒 ${esc(P.trust)}</p></div>
    <h3>${esc(T.result.lockedTitle)}</h3><ul class="points checks-list">${T.result.locked.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
    <h3>${esc(P.inside)}</h3><ul class="points checks-list">${P.items.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
    <p class="fine">${esc(P.fine(money(first), money(PRICE.regular), SUB.periodDays))}</p>
    <p class="fine">${esc(D.disclaimer)}</p>
    ${legalLinks()}</div>
    <button class="btn line" data-act="share">${esc(T.result.share)}</button>
    <button class="link center" data-act="restore">${esc(P.restore)}</button>
    <button class="link center" data-act="again">${esc(T.result.again)}</button>`, {
    pay: () => {
      const box = app.querySelector('[data-el=withdrawal]');
      if (box && !box.checked) { toast(P.withdrawalNeeded); box.scrollIntoView({ block: 'center' }); return; }
      const emailEl = app.querySelector('[data-el=email]');
      const email = emailEl.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { emailEl.focus(); emailEl.scrollIntoView({ block: 'center' }); toast(P.emailBad); return; }
      const orderId = newOrderId(visitor.sid);
      set({ email, orderId });
      const amount = firstPrice();
      track('pay_click', { provider: payment.name, amount, discount: amount < PRICE.regular, plan: 'sub', currency: CUR });
      const ret = new URL(location.href); ret.search = ''; ret.hash = '';
      Promise.resolve(payment.startCheckout({ orderId, amount, currency: CUR, lang: LANG, email, discount: amount < PRICE.regular, description: T.title, returnUrl: ret.toString() }))
        .catch(() => { track('pay_error', { provider: payment.name }); toast(P.payError); });
    },
    share: () => share(r),
    restore: () => restore(),
    again: () => { const keep = { sub: st.sub, subToken: st.subToken, email: st.email, done: st.done }; st = fresh(); set(keep); track('restart'); landing(); },
  });
  if (on) timer = setInterval(() => {
    const left = d - Date.now();
    const el = app.querySelector('[data-el=offer-timer]');
    if (el) el.textContent = P.timer(mmss(left));
    if (left <= 0) { clearInterval(timer); track('offer_timer_end'); if (st.step === 'result') result_(); }
  }, 1000);
  if (!st.shown) { track('result_shown'); track('paywall_shown', { amount: first, currency: CUR }); set({ shown: true }); }
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
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { toast(T.pay.emailBad); return; }
      b.disabled = true;
      try { await subapi.restore(email, LANG); } catch { /* ответ одинаковый: по нему нельзя узнать, есть ли подписка */ }
      track('sub_restore_asked'); toast(T.pay.restoreSent); route();
    },
  });
}

// --- После оплаты ---
function startSub(orderId) {
  const now = Date.now(), first = firstPrice(), test = !!payment.isTest;
  set({ orderId, sub: { status: 'active', startedAt: now, paidUntil: now + SUB.periodDays * DAY, orderId, test }, shown: false });
  track('paid', { provider: payment.name, amount: first, currency: CUR, plan: 'sub', test, order: orderId });
  if (subapi.subOn() && st.email) {
    // Имя ребёнка на сервер не уходит: только ответы анкеты и итог
    subapi.activate({ orderRef: orderId, email: st.email, currency: CUR, first, regular: PRICE.regular, test, lang: LANG,
      quiz: { product: 'mind', intro: st.intro, answers: st.answers, sliders: st.sliders, goal: st.goal },
      results: { product: 'mind', primary: st.result.primary, secondary: st.result.secondary, percent: st.result.percent } })
      .then((r) => { set({ subToken: r.token, sub: { ...subapi.fromServer(r.sub), orderId } }); track('sub_server', { ok: true }); })
      .catch(() => track('sub_server', { ok: false }));
  }
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
  screen(`<span class="badge">${esc(R.badge)}</span>${typeCard(r)}
    <p class="lead">${esc(fill(x.about))}</p>
    <div class="box daily-cta"><b>${esc(R.daily)}</b><span class="small muted">${esc(R.dailyLead)}</span><button class="btn" data-act="daily">${esc(R.dailyCta)}</button></div>
    ${sec(R.scales, `<div class="mbars">${r.order.map((k) => bar(k, r.percent[k])).join('')}</div>`)}
    ${sec(R.hooks, `<p>${esc(x.hooks)}</p>`)}
    ${sec(R.strengths, `<ul class="points">${x.strengths.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>`)}
    ${sec(R.grow, `<p>${esc(x.grow)}</p>`)}
    ${sec(R.say, `<div class="says">${x.say.map((s) => `<p>${esc(s)}</p>`).join('')}</div>`)}
    ${sec(R.acts(age), `<p>${esc(x.ages[age])}</p>`)}
    ${sec(R.fields, `<p>${esc(D.types[r.primary].careers)}</p><p class="small muted">${esc(R.fieldsNote)}</p>`)}
    ${sec(R.plan, `<ol class="plan">${x.plan.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>`)}
    ${CONFIG.appAccess === 'soon' ? `<p class="box small">${esc(R.appsSoon)}</p>` : ''}
    <p class="fine">${esc(D.disclaimer)}</p>
    <p class="small">${esc(subLine())}</p>
    <button class="btn line" data-act="manage">${esc(T.sub.manage)}</button>
    <button class="link center" data-act="share">${esc(T.result.share)}</button>
    ${legalLinks()}`, {
    daily: () => daily(),
    manage: () => manage(),
    share: () => share(r),
  });
  if (!st.reportShown) { track('report_shown'); set({ reportShown: true }); }
}

// --- Задание дня ---
function daily(showDay = 0) {
  if (!subActive() || !st.result) return route();
  set({ step: 'daily' });
  const plan = dailyPlan(st.result.order);
  const today = dayNumber(st.sub.startedAt);
  const day = showDay && showDay <= today ? showDay : today;
  const card = D.cards.find((c) => c.id === plan[(day - 1) % plan.length]);
  const age = st.intro.age || '6-8';
  const doneDays = Object.keys(st.done).map(Number);
  const isDone = !!st.done[day];
  const earlier = [];
  for (let n = today; n >= Math.max(1, today - 6); n--) if (n !== day) earlier.push(n);
  screen(`<div class="qhead"><button class="back" data-act="back" aria-label="${esc(T.daily.back)}">←</button><b>${esc(T.report.daily)}</b></div>
    <div class="dcard"><div class="row"><span class="tag">${esc(T.daily.title(day))}</span><span class="tag-ok">${esc(T.daily.forAge(age))}</span></div>
      <h1 class="qtitle">${esc(card.title)}</h1><p class="task">${esc(card.task[age])}</p><p class="small muted">${esc(D.safety)}</p></div>
    ${isDone ? `<p class="box center"><b>✓ ${esc(T.daily.doneMsg)}</b></p>` : `<button class="btn" data-act="done">${esc(T.daily.done)}</button>`}
    <div class="row stats"><span>🔥 ${esc(T.daily.streak(streak(doneDays, today)))}</span><span>${esc(T.daily.total(doneDays.length))}</span></div>
    ${today > plan.length ? `<p class="small muted">${esc(T.daily.finished)}</p>` : ''}
    ${earlier.length ? `<h2 class="sec-title">${esc(T.daily.earlier)}</h2><div class="days">${earlier.map((n) => { const c = D.cards.find((y) => y.id === plan[(n - 1) % plan.length]); return `<button class="day" data-act="open" data-n="${n}"><span>${esc(T.daily.title(n))}</span><b>${esc(c.title)}</b><em>${st.done[n] ? '✓' : esc(T.daily.missed)}</em></button>`; }).join('')}</div>` : ''}
    <div class="grow"></div><button class="btn ghost" data-act="back">${esc(T.daily.back)}</button>`, {
    back: () => report(),
    done: () => { set({ done: { ...st.done, [day]: card.id } }); track('daily_done', { n: day, key: card.id }); daily(day); },
    open: (b) => daily(Number(b.dataset.n)),
  });
  track('daily_open', { n: day, key: card.id });
}

// --- Моя подписка ---
function manage(confirm = false) {
  const S = T.sub, sub = st.sub;
  if (!sub) return route();
  set({ step: 'manage' });
  const row = (k, v) => `<div class="rowline"><span class="muted">${esc(k)}</span><b>${esc(v)}</b></div>`;
  const change = async (action) => {
    if (st.subToken) {
      try { const r = await subapi[action](st.subToken); set({ sub: { ...st.sub, ...subapi.fromServer(r.sub) } }); } catch { toast(S.error); return false; }
    } else set({ sub: { ...st.sub, status: action === 'cancel' ? 'cancelled' : 'active' } });
    return true;
  };
  screen(`<div class="qhead"><button class="back" data-act="back" aria-label="${esc(T.common.back)}">←</button></div><h1 class="rtitle">${esc(S.manage)}</h1>
    <div class="box">${row(S.status, sub.status === 'active' ? S.active : S.cancelledS)}${row(S.paidUntil, fmtDate(sub.paidUntil))}${sub.status === 'active' ? row(S.price, S.perPeriod(money(PRICE.regular), SUB.periodDays)) : ''}</div>
    <p class="small">${esc(subLine())}</p><div class="grow"></div>
    ${sub.status === 'active' ? (confirm ? `<p><b>${esc(S.cancelAsk)}</b></p><button class="btn" data-act="yes">${esc(S.cancelYes)}</button><button class="btn ghost" data-act="no">${esc(S.cancelNo)}</button>`
      : `<button class="btn line" data-act="cancel">${esc(S.cancel)}</button>`) : `<button class="btn" data-act="resume">${esc(S.resume)}</button>`}`, {
    back: () => report(),
    cancel: () => manage(true),
    no: () => manage(),
    yes: async () => { if (await change('cancel')) { track('sub_cancelled', { test: !!sub.test }); toast(S.cancelDone); manage(); } },
    resume: async () => { if (await change('resume')) { track('sub_resumed'); toast(S.resumeDone); manage(); } },
  });
}

function route() {
  if (subActive()) return st.step === 'daily' ? daily() : st.step === 'manage' ? manage() : report();
  if (st.step === 'quiz') return quiz();
  if (st.step === 'result' && st.result) return result_();
  return landing();
}

// Баннер согласия на cookie рисует общий модуль на языке сайта (en/de); для fr и ru подставляем свои тексты
function localizeConsent() {
  const el = document.querySelector('.consent');
  if (!el || !T.consent) return;
  const a = el.querySelector('a'), p = el.querySelector('p'), bs = el.querySelectorAll('button');
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
    cleanUrl();
    try {
      const s = (await subapi.status(token)).sub;
      const patch = { subToken: token, sub: subapi.fromServer(s) };
      if (s.quiz && s.quiz.product === 'mind' && s.quiz.answers) {
        Object.assign(patch, { intro: s.quiz.intro || {}, answers: s.quiz.answers, sliders: s.quiz.sliders || {}, goal: s.quiz.goal || null });
        patch.result = score(patch.answers, patch.sliders);
      }
      set(patch); track('sub_restored');
      return report();
    } catch { return route(); }
  }
  // Статус подписки с сервера (отмена на другом устройстве или из письма)
  if (st.subToken && subapi.subOn()) subapi.status(st.subToken).then((r) => set({ sub: { ...st.sub, ...subapi.fromServer(r.sub) } })).catch(() => {});
  // Ссылка оплаты из Paddle (?_ptxn=…): Paddle.js сам откроет окно оплаты
  if (params.get('_ptxn') && CONFIG.paddleCheckout) loadPaddle().catch(() => {});
  // Возврат после оплаты: доступ открывается только после подтверждения сервером
  const ret = payment.readReturn(location.href);
  if (ret.status === 'check') {
    cleanUrl();
    const orderId = ret.orderId || st.orderId;
    screen(`<div class="center calc"><div class="spinner"></div><h2>${esc(T.pay.checking)}</h2></div>`);
    const paid = await payment.verify(orderId);
    if (paid && st.result) { startSub(orderId); return report(); }
    track('pay_cancelled', { provider: payment.name });
    return st.result ? result_(T.pay.cancelled) : landing();
  }
  track('open', { ref: document.referrer ? new URL(document.referrer).hostname : '', utm: params.get('utm_source') || '' });
  route();
}
boot();
