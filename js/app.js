// Главный файл: путь пользователя от первого экрана до полного отчёта.

import { T } from './i18n/index.js';
import { CONFIG, priceLabel } from './config.js';
import { state, setState, resetState, track, importHandoff, store } from './store.js';
import { detectEnv } from './env.js';
import { preloadPose } from './pose.js';
import { unlockAudio } from './audio.js';
import { startStage, startFallback, toast } from './stage.js';
import { buildReport, QUALITIES } from './scoring.js';
import { payment, newOrderId } from './payment.js';
import { ART } from './art.js';
import { initDebug } from './debug.js';
import { drawShareCard } from './sharecard.js';

const env = detectEnv();
const app = document.getElementById('app');
const params = new URLSearchParams(location.search);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const paywallMode = ['teaser', 'hard'].includes(params.get('paywall')) ? params.get('paywall') : CONFIG.paywallMode;
const QUIZ = ['age', 'now', 'likes', 'temper', 'goal', 'screen', 'city'];

document.title = T.meta.title;
document.documentElement.lang = T.meta.lang;

function screen(html, handlers = {}) {
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
    <ul class="points">${T.landing.points.map((p) => `<li>${esc(p)}</li>`).join('')}</ul><div class="grow"></div>
    <button class="btn" data-act="start">${esc(T.landing.cta)}</button><p class="small muted center">${esc(T.landing.note)}</p>
    <a class="link center" href="privacy.html">${esc(T.common.privacy)}</a>`, {
    start: () => { unlockAudio(); track('quiz_start'); preloadPose().catch(() => {}); quiz(0); },
  });
}

// ---------- 2. Квиз: 7 вопросов, один на экран, ответ одним нажатием ----------
function quiz(i) {
  if (i >= QUIZ.length) return contact();
  setState({ step: 'quiz', quizIndex: i });
  const id = QUIZ[i], q = T.quiz.q[id];
  const opts = id === 'city' ? [...CONFIG.cities.map((c) => [c, c]), ['other', q.other]] : Object.entries(q.options);
  const two = id === 'city' || id === 'age';
  screen(`<div class="qhead"><button class="back" data-act="back" aria-label="${esc(T.common.back)}">←</button><div class="progress"><i style="width:${Math.round(((i + 1) / QUIZ.length) * 100)}%"></i></div></div>
    <p class="small muted">${esc(T.quiz.progress(i + 1, QUIZ.length))}</p><h1 class="qtitle">${esc(q.title)}</h1>
    <div class="opts ${two ? 'two' : ''}">${opts.map(([v, label]) => `<button class="opt ${state.quiz[id] === v ? 'sel' : ''}" data-act="pick" data-v="${esc(v)}">${esc(label)}</button>`).join('')}</div>`, {
    back: () => (i === 0 ? landing() : quiz(i - 1)),
    pick: (a) => {
      setState({ quiz: { ...state.quiz, [id]: a.dataset.v } });
      track('quiz_answer', { q: id, n: i + 1, a: a.dataset.v });
      a.classList.add('sel');
      setTimeout(() => quiz(i + 1), 140);
    },
  });
}

// ---------- 3. Контакт (можно пропустить) ----------
function contact() {
  setState({ step: 'contact' });
  let channel = (state.contact && state.contact.channel) || 'telegram';
  const C = T.contact;
  const draw = (err = '') => {
    const val = document.querySelector('.field') ? document.querySelector('.field').value : (state.contact && state.contact.value) || '';
    const checked = document.querySelector('#consent') ? document.querySelector('#consent').checked : false;
    screen(`<div class="qhead"><button class="back" data-act="back" aria-label="${esc(T.common.back)}">←</button><div class="progress"><i style="width:100%"></i></div></div>
      <h1 class="qtitle">${esc(C.title)}</h1><p class="muted">${esc(C.lead)}</p>
      <div class="seg">${Object.entries(C.channels).map(([k, v]) => `<button data-act="ch" data-v="${k}" class="${k === channel ? 'sel' : ''}">${esc(v)}</button>`).join('')}</div>
      <input class="field" type="${channel === 'telegram' ? 'text' : 'tel'}" inputmode="${channel === 'telegram' ? 'text' : 'tel'}" autocomplete="${channel === 'telegram' ? 'off' : 'tel'}" placeholder="${esc(C.placeholder[channel])}" value="${esc(val)}" maxlength="64">
      <label class="check"><input type="checkbox" id="consent" ${checked ? 'checked' : ''}><span>${esc(C.consent)} <a href="privacy.html" target="_blank" rel="noopener">${esc(T.common.privacy)}</a></span></label>
      <p class="err">${esc(err)}</p><div class="grow"></div>
      <button class="btn" data-act="submit">${esc(C.submit)}</button><button class="btn ghost" data-act="skip">${esc(C.skip)}</button>`, {
      back: () => quiz(QUIZ.length - 1),
      ch: (a) => { channel = a.dataset.v; draw(); },
      skip: () => { setState({ contact: null }); track('contact_skipped'); prep(); },
      submit: () => {
        const v = document.querySelector('.field').value.trim();
        const ok = document.querySelector('#consent').checked;
        if (v.length < 3) return draw(C.errValue);
        if (!ok) return draw(C.errConsent);
        setState({ contact: { channel, value: v, consent: true, at: new Date().toISOString() } });
        track('contact_left', { channel }); // само значение контакта в события не пишем
        prep();
      },
    });
  };
  draw();
}

// ---------- 4. Подготовка к камере ----------
function prep() {
  setState({ step: 'prep' });
  preloadPose().catch(() => {});
  const P = T.prep;
  screen(`<h1 class="qtitle">${esc(P.title)}</h1>
    <div class="cards">${P.cards.map((c, i) => `<div class="pcard">${ART.prep[i]}<div><b>${esc(c.t)}</b><span>${esc(c.d)}</span></div></div>`).join('')}</div>
    <p class="privacy-line">${esc(P.privacy)}</p><div class="grow"></div>
    <button class="btn" data-act="cam">${esc(P.cta)}</button><button class="link center" data-act="alt">${esc(P.alt)}</button>`, {
    cam: () => { app.onclick = null; startStage({ done: testDone, exit: prep }); },
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

function paywallCard(note = '') {
  const P = T.paywall;
  return `<div class="paywall" id="paywall"><h2>${esc(P.title)}</h2>${note ? `<p class="err">${esc(note)}</p>` : ''}
    <ul>${T.result.lockedItems.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
    <button class="btn" data-act="pay">${esc(P.cta(priceLabel()))}</button>
    <p class="small muted center">${esc(P.usdNote(CONFIG.price.usd))}</p>
    <p class="terms">${esc(P.terms)}</p><p class="small muted center">${esc(P.how)}</p>
    <button class="btn ghost" data-act="not-now">${esc(P.notNow)}</button></div>`;
}

function result(note = '') {
  if (!state.results) return landing();
  if (state.paid) return fullReport();
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
      again: () => { const quizKeep = state.quiz, contactKeep = state.contact; resetState(); setState({ quiz: quizKeep, contact: contactKeep }); track('restart', { reason: 'no_data' }); prep(); },
    });
    if (!state.resultTracked) { track('result_shown', { summary: 'none', mode: paywallMode }); setState({ resultTracked: true }); }
    return;
  }
  if (hard) {
    body = `<span class="badge">${esc(R.badge)}</span><h1 class="rtitle">${esc(R.title)}</h1><p class="summary">${esc(T.paywall.hardLead)}</p>
      <div class="locked"><div class="locked-list">${QUALITIES.slice(0, 3).map(qRowLocked).join('')}</div></div>${paywallCard(note)}`;
  } else {
    const s = profile.strongest;
    body = `<span class="badge">${esc(R.badge)}</span><h1 class="rtitle">${esc(R.title)}</h1><p class="summary">${esc(R.summary[profile.summary])}</p>
      ${s ? `<div class="strong"><small>${esc(R.strongest)}</small><b>${esc(R.qualities[s].name)}</b><span>${esc(R.qualities[s].d)}</span><span><b style="font-size:16px">${esc(R.levels[profile.qualities[s].level])}</b></span></div>` : ''}
      <p class="small muted">${esc(R.prelimNote)}</p>
      <h2 class="sec-title">${esc(R.profile)}</h2>
      <div class="locked"><div class="locked-list">${QUALITIES.filter((q) => q !== s).map(qRowLocked).join('')}</div></div>
      ${dismissed ? `<div class="sticky-pay"><button class="btn" data-act="pay">${esc(T.paywall.cta(priceLabel()))}</button></div><p class="terms">${esc(T.paywall.terms)}</p>` : paywallCard(note)}
      <button class="link center" data-act="again">${esc(R.again)}</button>`;
  }
  screen(body, {
    pay: () => {
      const orderId = newOrderId(state.sid);
      setState({ orderId });
      track('pay_click', { provider: payment.name, amount: CONFIG.price.uah, mode: paywallMode });
      const ret = new URL(location.href); ret.search = ''; ret.hash = '';
      if (params.get('debug')) ret.searchParams.set('debug', '1');
      if (params.get('paywall')) ret.searchParams.set('paywall', params.get('paywall'));
      payment.startCheckout({ orderId, amountUah: CONFIG.price.uah, description: T.paywall.title, returnUrl: ret.toString() });
    },
    'not-now': () => { setState({ paywallDismissed: true }); track('paywall_dismissed', { mode: paywallMode }); result(); },
    again: () => { resetState(); track('restart'); landing(); },
  });
  if (!state.resultTracked) { track('result_shown', { summary: profile.summary, strongest: profile.strongest, mode: paywallMode }); track('paywall_shown', { mode: paywallMode, amount: CONFIG.price.uah }); setState({ resultTracked: true }); }
}

// ---------- 8. Полный отчёт (после оплаты) ----------
function fullReport(justPaid = false) {
  if (!state.results) return landing();
  setState({ step: 'report' });
  const { profile, sports, plan } = buildReport(state.results, state.quiz);
  const R = T.result, P = T.report;
  const city = state.quiz.city && state.quiz.city !== 'other' ? state.quiz.city : null;
  const unit = (u) => (u === 'sec' ? P.unitSec : P.unitReps);
  screen(`${justPaid ? `<p class="tip">${esc(P.paidOk)}</p>` : ''}<span class="badge">${esc(R.badge)}</span><h1 class="rtitle">${esc(P.title)}</h1>
    <p class="summary">${esc(R.summary[profile.summary])}</p><p class="small muted">${esc(R.prelimNote)}</p>
    <h2 class="sec-title">${esc(R.profile)}</h2>${QUALITIES.map((q) => qRow(q, profile.qualities[q])).join('')}
    <ul class="facts">${factLines(state.results).map((f) => `<li>${esc(f)}</li>`).join('')}</ul>
    <h2 class="sec-title">${esc(P.sportsTitle)}</h2>
    ${sports.map((s, i) => `<div class="sport"><div><span class="n">${i + 1}</span><b>${esc(P.sports[s.sport].name)}</b></div><span class="small muted">${esc(P.sports[s.sport].ex)}</span><span class="small"><b>${esc(P.why)}:</b></span><ul>${s.reasons.map((r) => `<li>${esc(P.reasons[r] || r)}</li>`).join('')}</ul></div>`).join('')}
    <p class="small muted">${esc(P.sportsNote)}${city ? ' ' + esc(P.cityNote(city)) : ''}</p>
    <h2 class="sec-title">${esc(P.planTitle)}</h2><p class="small muted">${esc(P.planNote)}</p>
    ${plan.weeks.map((w) => `<div class="plan-week"><b>${esc(P.week(w.week))}</b>${w.sessions.map((s) => `<div class="plan-s"><b>${esc(P.session(s.n))}</b>${s.items.map((it) => `${esc(P.planEx[it.key])} — ${it.amount} ${esc(unit(it.unit))}`).join('<br>')}</div>`).join('')}</div>`).join('')}
    ${plan.tips.map((t) => `<p class="tip">${esc(P[t])}</p>`).join('')}
    <h2 class="sec-title">${esc(P.cardTitle)}</h2><canvas class="sharecard" width="1080" height="1350"></canvas>
    <button class="btn" data-act="share">${esc(P.share)}</button><button class="btn line" data-act="download">${esc(P.download)}</button>
    <button class="link center" data-act="again">${esc(R.again)}</button><a class="link center" href="privacy.html">${esc(T.common.privacy)}</a>`, {
    share: async () => {
      track('card_share');
      const blob = await new Promise((r) => cv.toBlob(r, 'image/png'));
      const file = new File([blob], 'profile.png', { type: 'image/png' });
      try { if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], text: P.shareText }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
      download(blob);
    },
    download: async () => { track('card_download'); download(await new Promise((r) => cv.toBlob(r, 'image/png'))); },
    again: () => { resetState(); track('restart'); landing(); },
  });
  const cv = app.querySelector('canvas.sharecard');
  drawShareCard(cv, profile, T);
  function download(blob) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'profile.png'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 5000); }
  if (!state.reportTracked) { track('report_shown'); setState({ reportTracked: true }); }
}

// ---------- Запуск ----------
function boot() {
  initDebug({ paywallMode, restart: () => { resetState(); landing(); }, toast });
  // Перенос ответов из встроенного браузера («Відкрити в Chrome»): квиз заново не проходим.
  if (params.get('s')) {
    const ok = importHandoff(params.get('s'));
    cleanUrl();
    track('open', { via: 'handoff', ok });
    if (ok) return prep();
  }
  // Возврат со страницы оплаты
  const ret = payment.readReturn(location.href);
  if (ret.status) {
    cleanUrl();
    if (ret.status === 'paid' && state.orderId && ret.orderId === state.orderId && state.results) {
      setState({ paid: true, paidAt: Date.now() });
      track('paid', { provider: payment.name, amount: CONFIG.price.uah, test: !!payment.isTest });
      return fullReport(true);
    }
    track('pay_cancelled', { provider: payment.name });
    return result(T.paywall.cancelled);
  }
  track('open', { ref: document.referrer ? new URL(document.referrer).hostname : '', utm: params.get('utm_source') || '' });
  // Продолжаем с места остановки (обновление страницы, возврат из другого приложения)
  if (state.paid && state.results) return fullReport();
  if (state.results && ['calc', 'result', 'report'].includes(state.step)) return result();
  if (state.step === 'prep' && state.quiz.age) return prep();
  if (state.step === 'contact') return contact();
  if (state.step === 'quiz') return quiz(Math.min(state.quizIndex || 0, QUIZ.length - 1));
  landing();
}
boot();

// Для отладки из консоли
window.__sporttest = { state: () => state, events: () => store.events(), env };
