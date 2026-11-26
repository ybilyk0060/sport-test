// Главный файл: путь пользователя от первого экрана до полного отчёта.

import { T } from './i18n/index.js?v=06eab8d-mwxgd5ih';
import { CONFIG } from './config.js?v=06eab8d-mwxgd5ih';
import { money, PRICE, CUR, fmtDate, } from './locale.js?v=06eab8d-mwxgd5ih';
import { LANG, LOCALES } from './i18n/index.js?v=06eab8d-mwxgd5ih';
import { state, setState, resetState, track, importHandoff, store } from './store.js?v=06eab8d-mwxgd5ih';
import { detectEnv } from './env.js?v=06eab8d-mwxgd5ih';
import { prefetchPose } from './pose.js?v=06eab8d-mwxgd5ih';
import { unlockAudio } from './audio.js?v=06eab8d-mwxgd5ih';
import { startStage, startFallback, toast } from './stage.js?v=06eab8d-mwxgd5ih';
import { buildReport, QUALITIES, qualitiesOf, bodyBuild } from './scoring.js?v=06eab8d-mwxgd5ih';
import { payment, newOrderId, loadPaddle } from './payment.js?v=06eab8d-mwxgd5ih';
import { ART } from './art.js?v=06eab8d-mwxgd5ih';
import { initDebug } from './debug.js?v=06eab8d-mwxgd5ih';
import { initConsent } from './analytics.js?v=06eab8d-mwxgd5ih';
import * as subapi from './subapi.js?v=06eab8d-mwxgd5ih';
import { drawShareCard } from './sharecard.js?v=06eab8d-mwxgd5ih';
import { buildProgram, nextWorkout, currentMonth, WEEKS, PER_WEEK } from './program.js?v=06eab8d-mwxgd5ih';

const env = detectEnv();
const app = document.getElementById('app');
const params = new URLSearchParams(location.search);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const paywallMode = ['teaser', 'hard'].includes(params.get('paywall')) ? params.get('paywall') : CONFIG.paywallMode;
const QUIZ = ['age', 'sex', 'body', 'now', 'likes', 'temper', 'goal', 'screen'];
const SUB = CONFIG.subscription;
const privacyUrl = LANG === 'uk' ? 'privacy.html' : `privacy-${LANG}.html`;
// Юридические ссылки: рядом с кнопкой оплаты и внизу страниц
const LEGAL = { uk: ['oferta.html', 'povernennya.html', 'kontakty.html', 'ciny.html'], en: ['terms-en.html', 'refund-en.html', 'contact-en.html', 'pricing-en.html'], de: ['agb-de.html', 'refund-de.html', 'impressum-de.html', 'pricing-de.html'] }[LANG] || ['terms-en.html', 'refund-en.html', 'contact-en.html', 'pricing-en.html'];
const legalLinks = () => `<nav class="legal-links"><a href="${LEGAL[3]}">${esc(T.common.pricing)}</a><a href="${LEGAL[0]}">${esc(T.common.offer)}</a><a href="${LEGAL[1]}">${esc(T.common.refund)}</a><a href="${privacyUrl}">${esc(T.common.privacy)}</a><a href="${LEGAL[2]}">${esc(T.common.contacts)}</a></nav>`;
const DAY = 86400000;

document.title = T.meta.title;
document.documentElement.lang = T.meta.lang;

function screen(html, handlers = {}) {
  clearInterval(offerTimer);
  app.innerHTML = `<section class="screen">${html}</section>`;
  window.scrollTo(0, 0);
  app.onclick = (e) => {
    const a = e.target.closest('[data-act]'); if (!a) return;
    const fn = handlers[a.dataset.act]; if (fn) fn(a, e);
  };
}
const cleanUrl = () => { try { history.replaceState(null, '', location.pathname + (params.get('debug') ? '?debug=1' : '')); } catch { /* не критично */ } };

// ---------- 1. Первый экран ----------
function landing() {
  setState({ step: 'landing' });
  screen(`<div class="hero"><div class="hero-art">${ART.hero}</div><h1>${esc(T.landing.title)}</h1><p class="promise">${esc(T.landing.promise)}</p></div>
    <ul class="points">${T.landing.points.map((p) => `<li>${esc(p)}</li>`).join('')}</ul><div class="trust-box"><span class="tb-ic" aria-hidden="true">🏅</span><span>${esc(T.landing.trustShort)}</span></div><div class="grow"></div>
    <button class="btn" data-act="start">${esc(T.landing.cta)}</button><p class="small muted center land-note">${esc(T.landing.note)} ${esc(T.result.shortNote)}</p><p class="small muted center land-note">${esc(T.landing.trustNote)}</p>
    ${Object.keys(LOCALES).length > 1 ? `<div class="langs">${Object.entries({ en: 'English', de: 'Deutsch', uk: 'Українська' }).filter(([k]) => LOCALES[k] && (k === LANG || !(CONFIG.linkOnlyLanguages || []).includes(k))).map(([k, v]) => `<a href="?lang=${k}" class="${k === LANG ? 'on' : ''}">${v}</a>`).join('')}</div>` : ''}
    ${subapi.subOn() ? `<button class="link center" data-act="restore">${esc(T.paywall.restore)}</button>` : ''}
    ${legalLinks()}`, {
    restore: async () => {
      const email = (prompt(T.paywall.restoreAsk) || '').trim();
      if (!email) return;
      try { await subapi.restore(email, LANG); } catch { /* ответ одинаковый */ }
      track('sub_restore_asked'); toast(T.paywall.restoreSent);
    },
    start: () => { unlockAudio(); track('quiz_start', { lang: LANG }); prefetchPose(); quiz(0); },
  });
}

// ---------- 2. Квиз: 7 вопросов, один на экран, ответ одним нажатием ----------
function quiz(i) {
  if (i >= QUIZ.length) return prep();
  setState({ step: 'quiz', quizIndex: i });
  const id = QUIZ[i], q = T.quiz.q[id];
  track('quiz_view', { q: id, n: i + 1 });
  if (id === 'body') return bodyStep(i, q);
  // ph-no-capture: тексты ответов не попадают в автозахват/тепловые карты (шаг и номер вопроса идут событиями quiz_view/quiz_answer)
  const opts = Object.entries(q.options);
  const two = id === 'age';
  // пол: только лёгкий сдвиг среди подходящих видов (см. SEX_RULES в scoring.js), можно не указывать
  screen(`<div class="qhead"><button class="back" data-act="back" aria-label="${esc(T.common.back)}">←</button><div class="progress"><i style="width:${Math.round(((i + 1) / QUIZ.length) * 100)}%"></i></div></div>
    <p class="small muted">${esc(T.quiz.progress(i + 1, QUIZ.length))}</p><h1 class="qtitle">${esc(q.title)}</h1>
    <div class="opts ph-no-capture ${two ? 'two' : ''}">${opts.map(([v, label]) => `<button class="opt ${state.quiz[id] === v ? 'sel' : ''}" data-act="pick" data-v="${esc(v)}">${esc(label)}</button>`).join('')}</div>`, {
    back: () => (i === 0 ? landing() : quiz(i - 1)),
    pick: (a) => {
      setState({ quiz: { ...state.quiz, [id]: a.dataset.v } });
      track('quiz_answer', { q: id, n: i + 1, a: a.dataset.v });
      a.classList.add('sel');
      setTimeout(() => quiz(i + 1), 140);
    },
  });
}

// Рост и вес: два поля, см/кг или ft/lb. Числа остаются только в этом браузере (state.body);
// в анкету (сервер, перенос в другой браузер) попадает лишь итог build: std / soft / gentle. В аналитику — только «заполнено / пропущено».
function bodyStep(i, q) {
  const b = state.body || {};
  const imperial = b.unit ? b.unit === 'imperial' : /-(US|LR|MM)$/i.test(navigator.language || '') && LANG === 'en';
  const num = (v) => (v == null || v === '' ? '' : String(v));
  const inp = (el, ph, val, w = '') => `<input class="field${w}" data-el="${el}" type="text" inputmode="decimal" autocomplete="off" placeholder="${ph}" value="${esc(num(val))}" maxlength="5">`;
  const ftIn = b.cm ? { ft: Math.floor(b.cm / 30.48), in: Math.round((b.cm / 2.54) % 12) } : {};
  screen(`<div class="qhead"><button class="back" data-act="back" aria-label="${esc(T.common.back)}">←</button><div class="progress"><i style="width:${Math.round(((i + 1) / QUIZ.length) * 100)}%"></i></div></div>
    <p class="small muted">${esc(T.quiz.progress(i + 1, QUIZ.length))}</p><h1 class="qtitle">${esc(q.title)}</h1>
    <p class="small muted">${esc(q.hint)}</p>
    <div class="units"><button class="unit ${imperial ? '' : 'sel'}" data-act="unit" data-v="metric">${esc(q.metric)}</button><button class="unit ${imperial ? 'sel' : ''}" data-act="unit" data-v="imperial">${esc(q.imperial)}</button></div>
    <div class="body-grid ph-no-capture">
      <label><span class="small">${esc(q.height)}</span>${imperial ? `<span class="pair">${inp('ft', 'ft', ftIn.ft)}${inp('in', 'in', ftIn.in)}</span>` : inp('cm', 'cm', b.cm ? Math.round(b.cm) : '')}</label>
      <label><span class="small">${esc(q.weight)}</span>${inp(imperial ? 'lb' : 'kg', imperial ? 'lb' : 'kg', b.kg ? (imperial ? Math.round(b.kg * 2.2046) : Math.round(b.kg * 10) / 10) : '')}</label>
    </div>
    <p class="small bad" data-el="bad" hidden>${esc(q.bad)}</p>
    <button class="btn" data-act="next">${esc(q.next)}</button>
    <button class="btn ghost" data-act="skip">${esc(q.skip)}</button>`, {
    back: () => quiz(i - 1),
    unit: (a) => { setState({ body: { ...readBody(), unit: a.dataset.v } }); bodyStep(i, q); },
    next: () => {
      const v = readBody();
      const build = bodyBuild({ cm: v.cm, kg: v.kg, sex: state.quiz.sex, age: state.quiz.age });
      if (!build) { app.querySelector('[data-el=bad]').hidden = false; return; }
      setState({ body: v, quiz: { ...state.quiz, build } });
      track('quiz_answer', { q: 'body', n: i + 1, step: 'filled' });
      quiz(i + 1);
    },
    skip: () => {
      const { build, ...rest } = state.quiz; // eslint-disable-line no-unused-vars
      setState({ body: null, quiz: rest });
      track('quiz_answer', { q: 'body', n: i + 1, step: 'skip' });
      quiz(i + 1);
    },
  });
  function readBody() {
    const f = (k) => { const el = app.querySelector(`[data-el=${k}]`); const n = el ? parseFloat(String(el.value).replace(',', '.')) : NaN; return Number.isFinite(n) ? n : null; };
    const unit = app.querySelector('.unit.sel')?.dataset.v || 'metric';
    if (unit === 'imperial') {
      const ft = f('ft'), inch = f('in') || 0, lb = f('lb');
      return { unit, cm: ft != null ? Math.round((ft * 12 + inch) * 2.54 * 10) / 10 : null, kg: lb != null ? Math.round((lb / 2.2046) * 10) / 10 : null };
    }
    return { unit, cm: f('cm'), kg: f('kg') };
  }
}

// ---------- 4. Подготовка к камере ----------
function prep() {
  setState({ step: 'prep' });
  prefetchPose();
  const P = T.prep;
  screen(`<div class="qhead"><button class="back" data-act="back" aria-label="${esc(T.common.back)}">←</button><div class="progress"><i style="width:100%"></i></div></div><h1 class="qtitle">${esc(P.title)}</h1>
    <div class="cards">${P.cards.map((c, i) => `<div class="pcard">${ART.prep[i]}<div><b>${esc(c.t)}</b><span>${esc(c.d)}</span></div></div>`).join('')}</div>
    <p class="privacy-line">${esc(P.privacy)}</p><div class="grow"></div>
    <button class="btn" data-act="cam">${esc(P.cta)}</button><button class="link center" data-act="alt">${esc(P.alt)}</button>`, {
    cam: () => { app.onclick = null; startStage({ done: testDone, exit: prep }); },
    back: () => quiz(QUIZ.length - 1),
    alt: () => { app.onclick = null; startFallback({ done: testDone, exit: prep }); },
  });
  track('prep_shown');
}

// ---------- 6. «Рахуємо результат» ----------
function testDone(results, mode) {
  const report = buildReport(results, state.quiz);
  // Сохраняем только итоговые числа: счёт, время, уровни. Видео и точек тела здесь нет.
  setState({ step: 'calc', results, profile: report.profile, mode, finishedAt: Date.now() });
  track('test_done', { mode, done: results.map((r) => `${r.key}:${r.skipped ? 'skip' : r.done}`).join(',') });
  const S = T.calc.steps;
  screen(`<div class="grow"></div><div class="spinner"></div><h1 class="qtitle center">${esc(T.calc.title)}</h1><ul>${S.map((s) => `<li>${esc(s)}</li>`).join('')}</ul><div class="grow"></div>`);
  app.firstElementChild.classList.add('calc');
  const lis = app.querySelectorAll('li');
  lis.forEach((li, i) => setTimeout(() => li.classList.add('on'), (CONFIG.calcMs / (S.length + 1)) * (i + 1)));
  setTimeout(result, CONFIG.calcMs);
}

// ---------- 7. Результат и пейвол ----------
const qRow = (q, data) => `<div class="qrow"><div class="top"><b>${esc(T.result.qualities[q].name)}</b><span class="lvl l${data.level}">${esc(T.result.levels[data.level])}</span></div><div class="dots l${data.level}"><i></i><i></i><i></i></div><p class="small muted">${esc(T.result.qualities[q].d)}</p></div>`;
// Для закрытых строк настоящие значения в страницу не кладём — только заглушка под размытием.
const qRowLocked = (q) => `<div class="qrow" aria-hidden="true"><div class="top"><b>${esc(T.result.qualities[q].name)}</b><span class="lvl l0">●●●●●●●</span></div><div class="dots l2"><i></i><i></i><i></i></div><p class="small muted">${esc(T.result.qualities[q].d)}</p></div>`;

function factLines(results) {
  const F = T.result.facts;
  return results.map((r) => (r.skipped ? F.skipped(T.ex[r.key].name) : F[r.key](r.done, r.target, Math.round(r.elapsedSec))));
}

// Согласие на немедленный доступ (право отказа) — только ЕС/UK (аудит 25.11): по часовому поясу или немецкой версии
function needWithdrawal() {
  if (!T.paywall.withdrawal) return false;
  if (LANG === 'de') return true;
  try { return /^Europe\//.test(Intl.DateTimeFormat().resolvedOptions().timeZone || ''); } catch { return false; }
}
const pct = () => Math.round((1 - PRICE.first / PRICE.regular) * 100);
// Таймер скидки: дедлайн ставится при первом показе пейвола и живёт отдельно от прохождения (resetState его не трогает).
const OFFER_KEY = 'sporttest.v1.offer';
function offerDeadline(start = false) {
  let d = null;
  try { d = JSON.parse(localStorage.getItem(OFFER_KEY) || 'null'); } catch { /* нет доступа */ }
  if (!d && start) { d = { deadline: Date.now() + SUB.offerMinutes * 60000 }; try { localStorage.setItem(OFFER_KEY, JSON.stringify(d)); } catch { /* нет доступа */ } track('offer_timer_start', { minutes: SUB.offerMinutes }); }
  return d ? d.deadline : null;
}
const discountOn = () => { const d = offerDeadline(); return !!d && Date.now() < d; };
const firstPrice = () => (discountOn() ? PRICE.first : PRICE.regular);
const mmss = (ms) => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; };
let offerTimer = 0;
function runOfferTimer() {
  clearInterval(offerTimer);
  const d = offerDeadline();
  if (!d || Date.now() >= d) return;
  offerTimer = setInterval(() => {
    const left = d - Date.now();
    document.querySelectorAll('[data-el=offer-timer]').forEach((el) => { el.textContent = T.paywall.timer(mmss(left)); });
    if (left <= 0) { clearInterval(offerTimer); track('offer_timer_end'); if (state.step === 'result') result(); }
  }, 1000);
}
// Топ-3 вида спорта до оплаты: только закрытые карточки. Названий видов спорта в разметке нет вообще (Юрий 25.11) —
// показываем, что совпадение найдено, и на каких реальных сильных сторонах ребёнка оно основано. Никаких процентов.
function sportsTeaser(profile) {
  if (!profile) return '';
  const P = T.paywall, R = T.result;
  const { sports } = buildReport(state.results, state.quiz);
  const why = (x) => { const qs = x.reasons.filter((k) => k.startsWith('q.')).slice(0, 2).map((k) => R.qualities[k.slice(2)].name); return qs.length ? qs.join(' + ') : P.basedInterests; };
  return `<div class="teaser"><h3>${esc(P.sportsTitle)}</h3><p class="small muted">${esc(P.sportsLead)}</p>
    ${sports.map((x, i) => `<div class="lock-card"><span class="lock-n">${i + 1}</span><div><b>${esc(P.match(i + 1))}</b><small>${esc(P.basedOn(why(x)))}</small></div><span class="lock-ic" aria-hidden="true">🔒</span></div>`).join('')}</div>`;
}
function paywallCard(note = '', profile = null) {
  const P = T.paywall, R = T.result;
  const renewAt = Date.now() + SUB.periodDays * DAY;
  const focus = T.program.focus[state.quiz.likes] || T.program.focus.none;
  offerDeadline(true);
  const on = discountOn(), first = firstPrice(), d = offerDeadline();
  const priceBox = (id) => `<div class="price-card${on ? '' : ' no-disc'}"${id ? ` id="${id}"` : ''}>${on ? `<span class="disc">${esc(P.discount(pct()))}</span><div class="timer" data-el="offer-timer">${esc(P.timer(mmss(d - Date.now())))}</div>` : `<div class="timer over">${esc(P.timerOver)}</div>`}
      <div class="pc-row"><div><b>${esc(P.firstLabel(SUB.periodDays))}</b><small>${esc(P.perDay(money(Math.round((first / SUB.periodDays) * 100) / 100)))}</small></div>
      <div class="pc-price">${on ? `<s>${esc(money(PRICE.regular))}</s>` : ''}<b>${esc(money(first))}</b></div></div>
      <p class="renew">${esc(P.renew(money(PRICE.regular), SUB.periodDays, fmtDate(renewAt)))}</p>
      ${id ? `<label class="email-field"><span class="small">${esc(P.emailLabel)}</span><input class="field" type="email" inputmode="email" autocomplete="email" data-el="email" value="${esc(state.email || '')}" maxlength="120" placeholder="name@example.com"></label>` : ''}
      ${needWithdrawal() ? `<label class="check small"><input type="checkbox" data-el="withdrawal"><span>${esc(P.withdrawal)}${P.withdrawalLink ? ` <a href="${P.withdrawalLink.href}" target="_blank" rel="noopener">${esc(P.withdrawalLink.text)}</a>` : ''}</span></label>` : ''}
      <button class="btn" data-act="pay">${esc(P.cta(money(first)))}</button>
      <p class="trust small center">🔒 ${esc(P.trust)}</p>
      <p class="small center testmode" hidden style="color:#b45309;font-weight:600">${esc(P.testMode)}</p></div>`;
  return `<div class="paywall" id="paywall"><h2>${esc(P.title)}</h2>${note ? `<p class="err">${esc(note)}</p>` : ''}
    <p>${esc(P.lead())}</p>
    ${sportsTeaser(profile)}
    <div class="focus-box"><small>${esc(P.focusTitle)}</small><b>${esc(focus)}</b></div>
    ${priceBox('price-top')}
    <h3>${esc(P.inside)}</h3><ul class="checks-list">${P.insideItems.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
    <div class="price-mini"><div><b>${esc(money(first))}</b>${on ? ` <s>${esc(money(PRICE.regular))}</s>` : ''}<small>${esc(P.firstLabel(SUB.periodDays))}</small></div><button class="btn" data-act="to-top">${esc(P.unlock)}</button></div>
    <p class="fine">${esc(P.fine(money(first), money(PRICE.regular), SUB.periodDays))}</p>
    ${legalLinks()}
    <button class="btn ghost" data-act="not-now">${esc(P.notNow)}</button></div>`;
}

function result(note = '') {
  if (!state.results) return landing();
  if (subActive()) return fullReport();
  setState({ step: 'result' });
  const report = buildReport(state.results, state.quiz);
  const { profile } = report;
  const R = T.result;
  const hard = paywallMode === 'hard';
  const dismissed = !!state.paywallDismissed;
  let body;
  if (profile.summary === 'none') {
    // Данных мало (упражнения пропущены) — отчёт не продаём, предлагаем пройти ещё раз.
    screen(`<span class="badge">${esc(R.badge)}</span><h1 class="rtitle">${esc(R.title)}</h1><p class="summary">${esc(R.summary.none)}</p><div class="grow"></div><button class="btn" data-act="again">${esc(R.again)}</button>`, {
      again: () => { const quizKeep = state.quiz; resetState(); setState({ quiz: quizKeep }); track('restart', { reason: 'no_data' }); prep(); },
    });
    if (!state.resultTracked) { track('result_shown', { summary: 'none', mode: paywallMode }); setState({ resultTracked: true }); }
    return;
  }
  if (hard) {
    body = `<span class="badge">${esc(R.badge)}</span><h1 class="rtitle">${esc(R.title)}</h1><p class="summary">${esc(T.paywall.hardLead)}</p>
      <div class="locked"><div class="locked-list">${QUALITIES.slice(0, 3).map(qRowLocked).join('')}</div></div>${paywallCard(note, profile)}`;
  } else {
    const s = profile.strongest;
    body = `<span class="badge">${esc(R.badge)}</span><h1 class="rtitle">${esc(R.title)}</h1><p class="summary">${esc(R.summary[profile.summary])}</p>
      ${s ? `<div class="strong"><small>${esc(R.strongest)}</small><b>${esc(R.qualities[s].name)}</b><span>${esc(R.qualities[s].d)}</span><span><b style="font-size:16px">${esc(R.levels[profile.qualities[s].level])}</b></span></div>` : ''}
      <p class="small muted">${esc(R.shortNote)}</p>
      <h2 class="sec-title">${esc(R.profile)}</h2>
      <div class="locked"><div class="locked-list">${qualitiesOf(state.results).filter((q) => q !== s).map(qRowLocked).join('')}</div></div>
      ${dismissed ? `<div class="sticky-pay"><button class="btn" data-act="pay">${esc(T.paywall.cta(money(firstPrice())))}</button></div><p class="renew">${esc(T.paywall.renew(money(PRICE.regular), SUB.periodDays, fmtDate(Date.now() + SUB.periodDays * DAY)))}</p><p class="terms">${esc(T.paywall.terms)}</p>` : paywallCard(note, profile)}
      <button class="link center" data-act="again">${esc(R.again)}</button>`;
  }
  screen(body, {
    pay: (btn) => {
      // ЕС (de): согласие на немедленный старт цифровой услуги — без него не оплачиваем
      if (needWithdrawal()) { const box = btn.closest('.price-card') && btn.closest('.price-card').querySelector('[data-el=withdrawal]'); if (!box) { setState({ paywallDismissed: false }); result(); return; } if (!box.checked) { toast(T.paywall.withdrawalNeeded); return; } }
      // Email на шаге оплаты: условия подписки и ссылка доступа на любом устройстве (аудит 25.11)
      const emailEl = app.querySelector('[data-el=email]');
      const email = (emailEl ? emailEl.value : state.email || '').trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { if (emailEl) { emailEl.focus(); emailEl.scrollIntoView({ block: 'center' }); } else { setState({ paywallDismissed: false }); result(); } toast(T.paywall.emailBad); return; }
      setState({ email });
      const orderId = newOrderId(state.sid);
      setState({ orderId });
      const amount = firstPrice();
      track('pay_click', { provider: payment.name, amount, discount: amount < PRICE.regular, plan: 'sub', currency: CUR, mode: paywallMode });
      const ret = new URL(location.href); ret.search = ''; ret.hash = '';
      if (params.get('debug')) ret.searchParams.set('debug', '1');
      if (params.get('paywall')) ret.searchParams.set('paywall', params.get('paywall'));
      Promise.resolve(payment.startCheckout({ orderId, amount, currency: CUR, lang: LANG, email, discount: amount < PRICE.regular, description: T.payTest.sub(money(amount), money(PRICE.regular), SUB.periodDays), returnUrl: ret.toString() }))
        .catch(() => { track('pay_error', { provider: payment.name }); toast(T.paywall.payError); });
    },
    'to-top': () => { const el = app.querySelector('#price-top'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); track('paywall_to_top'); },
    'not-now': () => { setState({ paywallDismissed: true }); track('paywall_dismissed', { mode: paywallMode }); result(); },
    again: () => { resetState(); track('restart'); landing(); },
  });
  if (payment.mode) payment.mode().then((m) => { if (m === 'test') app.querySelectorAll('.testmode').forEach((e) => { e.hidden = false; }); });
  runOfferTimer();
  if (!state.resultTracked) { track('result_shown', { summary: profile.summary, strongest: profile.strongest, mode: paywallMode }); track('paywall_shown', { mode: paywallMode, amount: firstPrice(), currency: CUR, regular: PRICE.regular }); setState({ resultTracked: true }); }
}

// ---------- Подписка (тестовая заглушка: состояние на устройстве) ----------
function subActive() { return !!(state.sub && Date.now() < state.sub.paidUntil); }
function startSub(orderId) {
  const now = Date.now();
  setState({ paid: true, paidAt: now, orderId, sub: { status: 'active', startedAt: now, paidUntil: now + SUB.periodDays * DAY, orderId, test: !!payment.isTest }, workouts: state.workouts || [] });
  track('paid', { provider: payment.name, amount: firstPrice(), currency: CUR, plan: 'sub', test: !!payment.isTest, order: orderId });
  if (subapi.subOn() && state.email) {
    subapi.activate({ orderRef: orderId, email: state.email, currency: CUR, first: firstPrice(), regular: PRICE.regular, quiz: state.quiz, results: state.results, test: !!payment.isTest, lang: LANG })
      .then((r) => { setState({ subToken: r.token, sub: { ...subapi.fromServer(r.sub), orderId } }); track('sub_server', { ok: true }); })
      .catch(() => track('sub_server', { ok: false }));
  }
}

function subLine() {
  const S = T.sub, sub = state.sub;
  return sub.status === 'active' ? S.nextCharge(fmtDate(sub.paidUntil), money(PRICE.regular)) : S.cancelledUntil(fmtDate(sub.paidUntil));
}

// Наши приложения: по возрасту ребёнка первым идёт подходящее. Подписчику — код на месяц.
function giftCode(app) {
  const codes = state.giftCodes || {};
  if (!codes[app]) { codes[app] = `TEST-${app.toUpperCase().slice(0, 3)}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`; setState({ giftCodes: codes }); }
  return codes[app];
}
function appsBlock() {
  const A = T.apps, age = parseInt(state.quiz.age, 10) || 7;
  const fits = (a) => age >= a.ages[0] && age <= a.ages[1];
  const order = Object.entries(CONFIG.apps).sort(([, a], [, b]) => fits(b) - fits(a));
  const codes = state.giftCodes || {};
  return `<p class="small muted">${esc(A.giftLead)}</p>
    ${order.map(([k, a]) => {
    const links = [a.ios.live && `<a class="pill-link" href="${esc(a.ios.url)}" target="_blank" rel="noopener" data-act="app" data-app="${k}">${esc(A.ios)}</a>`, a.android.live && `<a class="pill-link" href="${esc(a.android.url)}" target="_blank" rel="noopener" data-act="app" data-app="${k}">${esc(A.android)}</a>`].filter(Boolean).join('');
    const code = codes[k];
    return `<div class="app-card"><div><b>${esc(A[k].name)}</b>${fits(a) ? `<span class="tag-ok">${esc(A.forAge)}</span>` : ''}</div><span class="small muted">${esc(A[k].d)}</span>
      ${links ? `<div class="row-links">${links}</div>` : ''}${a.ios.live && a.android.live ? '' : `<span class="small muted">${esc(A.soon([!a.ios.live && A.ios, !a.android.live && A.android].filter(Boolean).join(' і ')))}</span>`}
      ${code ? `<div class="code-box"><small>${esc(A.giftCode)}</small><b>${esc(code)}</b><button class="link" data-act="copy-code" data-code="${esc(code)}">${esc(A.copy)}</button>
        <span class="small">${esc(A.giftHowIos)}</span><span class="small">${esc(A.giftHowAndroid)}</span>${CONFIG.promoMode === 'test' ? `<span class="small" style="color:#b45309;font-weight:600">${esc(A.giftTest)}</span>` : ''}</div>`
        : `<button class="btn line" data-act="gift" data-app="${k}">${esc(A.giftGet(A[k].name))}</button>`}</div>`;
  }).join('')}`;
}

function programBlock(program) {
  const G = T.program, done = state.workouts || [];
  const next = nextWorkout(program, done);
  const total = program.workouts.length;
  const doneIds = new Set(done.map((x) => x.id));
  const doneN = program.workouts.filter((w) => doneIds.has(w.id)).length;
  const unit = (key) => (CONFIG.exercises[key].goal === 'seconds' ? T.report.unitSec : T.report.unitReps);
  const list = (w) => w.items.map((it) => `${esc(T.report.planEx[it.key])} — ${it.target} ${esc(unit(it.key))}`).join('<br>');
  const card = next
    ? `<div class="next-w"><div class="nw-top"><small>${esc(G.today)} · ${esc(G.month(program.month))} · ${esc(G.workout(next.week, next.day))}</small><small>${esc(G.progress(doneN, total))}</small></div>
        <div class="prog-bar"><i style="width:${Math.round((doneN / total) * 100)}%"></i></div>
        <div class="small">${list(next)}</div><button class="btn" data-act="workout">${esc(G.start)}</button></div>`
    : `<div class="next-w"><b>${esc(G.allDone)}</b><button class="btn" data-act="retest">${esc(G.retest)}</button></div>`;
  const plan = `<details class="sec"><summary>${esc(G.title)} · ${esc(G.month(program.month))}</summary><p class="small muted">${esc(G.lead(G.focus[program.focus]))}</p><p class="small muted">${esc(String(state.quiz && state.quiz.age).startsWith('3') ? G.who34 : G.who)}</p>${[1, 2, 3, 4].map((wk) => `<div class="plan-week"><b>${esc(G.week(wk))}</b>${program.workouts.filter((w) => w.week === wk).map((w) => `<div class="plan-s"><b>${esc(T.report.session(w.day))}${doneIds.has(w.id) ? ` · ✓ ${esc(G.done)}` : ''}</b>${list(w)}</div>`).join('')}</div>`).join('')}</details>`;
  return { card, plan };
}

// ---------- 8. Полный отчёт + программа (подписка активна) ----------
// Сверху главное: талант и профиль одним блоком, следующая тренировка. Остальное — в сворачиваемых разделах.
function fullReport(justPaid = false) {
  if (!state.results) return landing();
  if (!subActive()) return result();
  setState({ step: 'report' });
  const { profile, sports, plan: homePlan } = buildReport(state.results, state.quiz);
  const program = buildProgram(profile, state.quiz, state.results, { month: currentMonth(state.sub, state.workouts, Date.now(), SUB.periodDays), history: state.workouts || [] });
  const R = T.result, P = T.report;
  const pb = programBlock(program);
  const s = profile.strongest;
  const bars = qualitiesOf(state.results).map((q) => { const d = profile.qualities[q]; return `<div class="mini"><span>${esc(R.qualities[q].name)}</span><span class="dots l${d.level}"><i></i><i></i><i></i></span><em class="lvl l${d.level}">${esc(R.levels[d.level])}</em></div>`; }).join('');
  const tip = homePlan.tips[0];
  screen(`${justPaid ? `<p class="tip">${esc(P.paidOk)}</p>` : ''}
    <div class="rep-head">${s ? `<small>${esc(R.strongest)}</small><h1>${esc(R.qualities[s].name)}</h1>` : `<h1>${esc(R.title)}</h1>`}<p>${esc(R.summary[profile.summary])}</p>${bars}</div>
    ${pb.card}
    <div class="apps-block"><h2 class="sec-title">${esc(T.apps.giftTitle)}</h2>${appsBlock()}</div>
    <details class="sec"><summary>${esc(P.sportsTitle)}</summary>
      ${sports.map((x, i) => `<div class="sport-row"><span class="n">${i + 1}</span><div><b>${esc(P.sports[x.sport].name)}</b><span class="small muted">${esc(P.sports[x.sport].ex)}</span><span class="conf c-${x.confidence}">${esc(P.confidence[x.confidence])}</span><span class="small">${x.reasons.map((r) => esc(P.reasons[r] || r)).join(' · ')}</span></div></div>`).join('')}
      <p class="small muted">${esc(P.sportsNote)}</p>${tip ? `<p class="tip">${esc(P[tip])}</p>` : ''}</details>
    ${pb.plan}
    <details class="sec"><summary>${esc(P.resultsTitle)}</summary><ul class="facts">${factLines(state.results).map((f) => `<li>${esc(f)}</li>`).join('')}</ul><p class="small muted">${esc(R.shortNote)}</p></details>

    <details class="sec"><summary>${esc(P.cardTitle)}</summary><canvas class="sharecard" width="1080" height="1350"></canvas>
      <button class="btn" data-act="share">${esc(P.share)}</button><button class="btn line" data-act="download">${esc(P.download)}</button></details>
    <p class="small muted">${esc(T.report.howMeasured)} ${esc(T.landing.disclaimer)}${state.quiz && state.quiz.build ? ` ${esc(T.report.bodyNote)}` : ''}</p>
    <div class="foot-links"><span class="small muted">${esc(subLine())}</span><button class="link" data-act="manage">${esc(T.sub.manage)}</button><button class="link" data-act="again">${esc(R.again)}</button></div>${legalLinks()}`, {
    share: async () => {
      track('card_share');
      const blob = await new Promise((r) => cv.toBlob(r, 'image/png'));
      const file = new File([blob], 'profile.png', { type: 'image/png' });
      try { if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], text: P.shareText }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
      download(blob);
    },
    download: async () => { track('card_download'); download(await new Promise((r) => cv.toBlob(r, 'image/png'))); },
    manage: () => manageSub(),
    workout: () => startWorkout(program),
    retest: () => retest(),
    app: (a) => track('app_link', { app: a.dataset.app }),
    gift: (a) => { giftCode(a.dataset.app); track('gift_code', { app: a.dataset.app, mode: CONFIG.promoMode }); const y = window.scrollY; fullReport(); window.scrollTo(0, y); },
    'copy-code': async (a) => { try { await navigator.clipboard.writeText(a.dataset.code); } catch { /* нет доступа к буферу */ } toast(T.apps.copied); },
    again: () => retest(),
  });
  const cv = app.querySelector('canvas.sharecard');
  drawShareCard(cv, profile, T);
  function download(blob) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'profile.png'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 5000); }
  if (!state.reportTracked) { track('report_shown'); setState({ reportTracked: true }); }
}

// Повторный тест: подписка и выполненные тренировки сохраняются, квиз и результаты — заново
function retest() {
  const keep = { sub: state.sub, paid: state.paid, workouts: state.workouts, history: [...(state.history || []), state.results ? { at: state.finishedAt, results: state.results } : null].filter(Boolean) };
  resetState(); setState(keep); track('restart', { sub: !!keep.sub }); landing();
}

// ---------- 9. Тренировка по программе ----------
function startWorkout(program) {
  const w = nextWorkout(program, state.workouts || []);
  if (!w) return fullReport();
  track('workout_start', { id: w.id });
  app.onclick = null;
  startStage({ list: w.items, mode: 'workout', exit: fullReport, done: (results) => {
    const rec = { id: w.id, at: Date.now(), done: results.map((r) => ({ key: r.key, done: r.done, target: r.target, skipped: !!r.skipped })) };
    setState({ workouts: [...(state.workouts || []), rec] });
    if (state.subToken) subapi.sync(state.subToken, state.workouts);
    track('workout_done', { id: w.id, done: rec.done.map((r) => `${r.key}:${r.skipped ? 'skip' : r.done}`).join(',') });
    const G = T.program;
    screen(`<div class="grow"></div><h1 class="rtitle center">${esc(G.resultTitle)}</h1><p class="center">${esc(G.resultLead)}</p>
      <ul class="facts">${rec.done.map((r) => `<li>${esc(T.ex[r.key].name)}: ${r.skipped ? esc(T.result.facts.skipped('').replace(/^: /, '')) : `${r.done} / ${r.target}`}</li>`).join('')}</ul>
      <div class="grow"></div><button class="btn" data-act="back">${esc(G.toProgram)}</button>`, { back: () => fullReport() });
  } });
}

// ---------- 10. Моя подписка ----------
function manageSub(confirm = false) {
  const S = T.sub, sub = state.sub;
  if (!sub) return result();
  setState({ step: 'manage' });
  track('manage_shown', { confirm: !!confirm });
  const row = (k, v) => `<div class="rowline"><span class="muted">${esc(k)}</span><b>${esc(v)}</b></div>`;
  screen(`<div class="qhead"><button class="back" data-act="back" aria-label="${esc(T.common.back)}">←</button></div><h1 class="rtitle">${esc(S.manageTitle)}</h1>
    <div class="box">${row(S.status, sub.status === 'active' ? S.statusActive : S.statusCancelled)}${row(S.started, fmtDate(sub.startedAt))}${row(S.paidUntil, fmtDate(sub.paidUntil))}${sub.status === 'active' ? row(S.price, S.perPeriod(money(PRICE.regular), SUB.periodDays)) : ''}</div>
    <p class="small">${esc(subLine())}</p>${sub.test ? `<p class="small" style="color:#b45309;font-weight:600">${esc(S.testNote)}</p>` : ''}
    <div class="grow"></div>
    ${sub.status === 'active' ? (confirm ? `<p><b>${esc(S.cancelAsk)}</b></p><button class="btn" data-act="cancel-yes">${esc(S.cancelYes)}</button><button class="btn ghost" data-act="cancel-no">${esc(S.cancelNo)}</button>`
      : `<button class="btn line" data-act="cancel">${esc(S.cancel)}</button>`) : `<button class="btn" data-act="resume">${esc(S.resume)}</button>`}
    <button class="btn ghost" data-act="back">${esc(S.back)}</button>`, {
    back: () => fullReport(),
    cancel: () => manageSub(true),
    'cancel-no': () => { track('cancel_kept'); manageSub(); },
    'cancel-yes': async () => {
      if (state.subToken) { try { const r = await subapi.cancel(state.subToken); setState({ sub: { ...state.sub, ...subapi.fromServer(r.sub) } }); } catch { toast(T.paywall.payError); return; } }
      else setState({ sub: { ...state.sub, status: 'cancelled', cancelledAt: Date.now() } });
      track('sub_cancelled', { test: !!sub.test }); toast(S.cancelDone); manageSub();
    },
    resume: async () => {
      if (state.subToken) { try { const r = await subapi.resume(state.subToken); setState({ sub: { ...state.sub, ...subapi.fromServer(r.sub) } }); } catch { toast(T.paywall.payError); return; } }
      else setState({ sub: { ...state.sub, status: 'active', cancelledAt: null } });
      track('sub_resumed'); toast(S.resumeDone); manageSub();
    },
  });
}

// ---------- Запуск ----------
function boot() {
  initDebug({ paywallMode, restart: () => { resetState(); landing(); }, toast });
  initConsent();
  // Файлы модели позы скачиваются в фоне после открытия (без компиляции — она блокирует нажатия)
  setTimeout(() => prefetchPose(), 1500);
  // Перенос ответов из встроенного браузера («Відкрити в Chrome»): квиз заново не проходим.
  // Ссылка доступа из письма (?sub=…): подписка, ответы и результаты приезжают с сервера — на любом устройстве
  if (params.get('sub') && subapi.subOn()) {
    const token = params.get('sub');
    cleanUrl();
    screen(`<div class="center" style="padding:48px 0"><div class="spinner"></div></div>`);
    subapi.status(token).then((r) => {
      const s = r.sub;
      setState({ subToken: token, sub: subapi.fromServer(s), paid: true, quiz: s.quiz || state.quiz, results: s.results || state.results, workouts: Array.isArray(s.workouts) && s.workouts.length ? s.workouts : (state.workouts || []), step: 'report' });
      track('sub_restored');
      return fullReport();
    }).catch(() => landing());
    return;
  }
  // Освежаем статус подписки с сервера (отмена с другого устройства)
  if (state.subToken && subapi.subOn()) subapi.status(state.subToken).then((r) => setState({ sub: { ...state.sub, ...subapi.fromServer(r.sub) } })).catch(() => {});
  if (params.get('s')) {
    const ok = importHandoff(params.get('s'));
    cleanUrl();
    track('open', { via: 'handoff', ok });
    if (ok) return prep();
  }
  // Ссылка оплаты из Paddle (?_ptxn=…): Paddle.js сам откроет окно оплаты
  if (params.get('_ptxn') && CONFIG.paddleCheckout) loadPaddle().catch(() => {});
  // Возврат со страницы оплаты
  const ret = payment.readReturn(location.href);
  if (ret.status === 'check') {
    cleanUrl();
    const orderId = ret.orderId || state.orderId;
    screen(`<div class="center" style="padding:48px 0"><h2>${esc(T.paywall.checking)}</h2></div>`);
    payment.verify(orderId).then((ok) => {
      if (ok && state.results) {
        startSub(orderId);
        return fullReport(true);
      }
      track('pay_cancelled', { provider: payment.name });
      return state.results ? result(T.paywall.cancelled) : landing();
    });
    return;
  }
  if (ret.status) {
    cleanUrl();
    if (ret.status === 'paid' && state.orderId && ret.orderId === state.orderId && state.results) {
      startSub(state.orderId);
      return fullReport(true);
    }
    track('pay_cancelled', { provider: payment.name });
    return result(T.paywall.cancelled);
  }
  track('open', { ref: document.referrer ? new URL(document.referrer).hostname : '', utm: params.get('utm_source') || '' });
  // Продолжаем с места остановки (обновление страницы, возврат из другого приложения)
  if (subActive() && state.results) return state.step === 'manage' ? manageSub() : fullReport();
  if (state.results && ['calc', 'result', 'report', 'manage'].includes(state.step)) return result();
  if (state.step === 'prep' && state.quiz.age) return prep();
  if (state.step === 'quiz') return quiz(Math.min(state.quizIndex || 0, QUIZ.length - 1));
  landing();
}
boot();

// Для отладки из консоли
window.__sporttest = { state: () => state, events: () => store.events(), env };
