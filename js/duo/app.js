// Мини-тест «Ребёнок и вы» (страница /duo). Родитель отвечает о себе, результат сопоставляется с типом ребёнка
// из теста «Как думает ваш ребёнок» (читается с устройства: mindtest.v1.state). Полный результат открыт подписчикам;
// без подписки видны стиль родителя и общий вывод, остальное ведёт к тесту ребёнка. Своей оплаты здесь нет.
import { track as trackRaw } from '../store.js?v=ec06824-mx0kgt9k';
import { initConsent, screenView } from '../analytics.js?v=ec06824-mx0kgt9k';
import { LANGS, pick, QUESTIONS, STYLE, GIVE, WATCH, NEEDS, TOGETHER, UI } from './data.js?v=ec06824-mx0kgt9k';

const app = document.getElementById('app');
const params = new URLSearchParams(location.search);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// Язык общий с тестом ребёнка
function pickLang() {
  const q = params.get('lang');
  if (LANGS.includes(q)) { try { localStorage.setItem('mindtest.lang', q); } catch { /* нет доступа */ } return q; }
  try { const s = localStorage.getItem('mindtest.lang'); if (LANGS.includes(s)) return s; } catch { /* нет доступа */ }
  for (const l of navigator.languages || [navigator.language]) { const c = String(l || '').slice(0, 2).toLowerCase(); if (c === 'de' || c === 'fr' || c === 'en') return c; }
  return 'en';
}
const LANG = pickLang();
const t = (k, vars = {}) => pick(UI[k], LANG).replace(/\{(\w+)\}/g, (m, v) => vars[v] ?? m);
const p = (arr) => pick(arr, LANG);
const loadTypes = () => (LANG === 'de' ? import('../mind/data-de.js?v=ec06824-mx0kgt9k') : LANG === 'fr' ? import('../mind/data-fr.js?v=ec06824-mx0kgt9k') : LANG === 'ru' ? import('../mind/data-ru.js?v=ec06824-mx0kgt9k') : import('../mind/data-en.js?v=ec06824-mx0kgt9k')).then((m) => m.default.types);
let TYPES = null;
const ICON = { builder: '🧱', inventor: '💡', storyteller: '📖', artist: '🎨', explorer: '🧭', leader: '🚩', helper: '🤝', mover: '⚡' };

const readMind = () => { try { return JSON.parse(localStorage.getItem('mindtest.v1.state') || 'null') || {}; } catch { return {}; } };
const KEY = 'duotest.v1.state';
let st = { step: 'landing', i: 0, answers: [], child: null, parent: null };
try { const v = JSON.parse(localStorage.getItem(KEY) || 'null'); if (v && typeof v === 'object') st = { ...st, ...v }; } catch { /* нет доступа */ }
const set = (patch) => { Object.assign(st, patch); try { localStorage.setItem(KEY, JSON.stringify(st)); } catch { /* нет доступа */ } if (patch.step) screenView('duo', patch.step, LANG); };
const track = (name, props = {}) => trackRaw(`duo_${name}`, { app: 'duo', lang: LANG, ...props });

function screen(html, handlers = {}) {
  app.innerHTML = `<section class="screen duo">${html}</section>`;
  app.firstElementChild.addEventListener('click', (e) => { const b = e.target.closest('[data-act]'); if (b && handlers[b.dataset.act]) handlers[b.dataset.act](b); });
  window.scrollTo(0, 0);
}

// Стиль родителя: шкала с наибольшим числом ответов, при равенстве — выбранная раньше
export function parentStyle(answers) {
  const cnt = {}, first = {};
  answers.forEach((n, i) => { const s = QUESTIONS[i] && QUESTIONS[i].o[n] && QUESTIONS[i].o[n][0]; if (!s) return; cnt[s] = (cnt[s] || 0) + 1; if (!(s in first)) first[s] = i; });
  return Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a] || first[a] - first[b])[0] || null;
}
const childName = (k) => { const m = readMind(); return m.intro && m.intro.gender === 1 ? TYPES[k].nameF : TYPES[k].name; };
const subscribed = () => { const s = readMind().sub; return !!(s && Date.now() < s.paidUntil); };
const rings = '<div class="rings" aria-hidden="true"><i></i><i></i></div>';

function landing() {
  set({ step: 'landing' });
  screen(`${rings}<span class="tag">${esc(t('kicker'))}</span><h1>${esc(t('h1'))}</h1><p class="promise">${esc(t('sub'))}</p>
    <div class="grow"></div><button class="btn" data-act="start">${esc(t('cta'))}</button><p class="small muted center">${esc(t('note'))}</p>`, {
    start: () => { track('start'); set({ step: 'quiz', i: 0, answers: [] }); quiz(); },
  });
}
function quiz() {
  const i = Math.min(st.i, QUESTIONS.length - 1), q = QUESTIONS[i];
  screen(`<div class="qhead"><button class="back" data-act="back" aria-label="${esc(t('back'))}">←</button><div class="steps">${QUESTIONS.map((_, n) => `<i class="${n < i ? 'done' : n === i ? 'now' : ''}"></i>`).join('')}</div><span class="small muted">${esc(t('count', { n: i + 1, t: QUESTIONS.length }))}</span></div>
    <h1 class="qtitle">${esc(p(q.t))}</h1>
    <div class="opts ph-no-capture">${q.o.map((o, n) => `<button class="opt${st.answers[i] === n ? ' sel' : ''}" data-act="pick" data-n="${n}"><span class="let">${'ABCD'[n]}</span>${esc(p(o[1]))}</button>`).join('')}</div>`, {
    back: () => { if (i === 0) return landing(); set({ i: i - 1 }); quiz(); },
    pick: (b) => {
      if (b.parentElement.dataset.busy) return; b.parentElement.dataset.busy = '1';
      const a = [...st.answers]; a[i] = Number(b.dataset.n); b.classList.add('sel');
      setTimeout(() => {
        if (i + 1 < QUESTIONS.length) { set({ answers: a, i: i + 1 }); return quiz(); }
        set({ answers: a, parent: parentStyle(a) }); track('done');
        const m = readMind();
        if (m.result && m.result.primary) { set({ child: m.result.primary }); return result(); }
        child();
      }, 120);
    },
  });
}
function child() {
  set({ step: 'child' });
  screen(`${rings}<h1 class="qtitle">${esc(t('childQ'))}</h1>
    <div class="opts two ph-no-capture">${Object.keys(TYPES).map((k) => `<button class="opt" data-act="pick" data-k="${k}">${ICON[k]}<br>${esc(childName(k))}</button>`).join('')}</div>
    <a class="btn line" href="mind.html">${esc(t('childTest'))}</a>`, {
    pick: (b) => { set({ child: b.dataset.k }); result(); },
  });
}
function result() {
  if (!st.parent) return landing();
  if (!st.child) return child();
  set({ step: 'result' });
  const P = st.parent, C = st.child, open = subscribed();
  const card = (cls, title, body) => `<div class="dcard2 ${cls}"><small>${esc(title)}</small><p>${esc(body)}</p></div>`;
  screen(`<div class="pair ph-no-capture"><div class="who"><span class="ic">${ICON[P]}</span><small>${esc(t('yourStyle'))}</small><b>${esc(p(STYLE[P]))}</b></div>
      <div class="who"><span class="ic">${ICON[C]}</span><small>${esc(t('childStyle'))}</small><b>${esc(childName(C))}</b></div></div>
    <p class="lead">${esc(t(P === C ? 'same' : 'diff'))}</p>
    ${open ? `${card('c1', t('give'), p(GIVE[P]))}${card('c2', t('watch'), p(WATCH[P]))}${card('c3', t('needs'), p(NEEDS[C]))}${card('c4', t('together'), p(TOGETHER[C]))}
      <a class="btn" href="mind.html">${esc(t('toReport'))}</a>`
    : `<div class="locked2">${[t('give'), t('watch'), t('needs'), t('together')].map((x) => `<div class="dcard2 lock"><small>${esc(x)}</small><p>🔒</p></div>`).join('')}</div>
      <div class="dcard2 cta"><b>${esc(t('lockTitle'))}</b><p>${esc(t('lockLead'))}</p><a class="btn" href="mind.html">${esc(t('lockCta'))}</a></div>`}
    <button class="link center" data-act="again">${esc(t('again'))}</button>`, {
    again: () => { set({ step: 'landing', i: 0, answers: [], parent: null, child: null }); landing(); },
  });
  track('result', { key: `${P}-${C}`, ok: open });
}

async function boot() {
  document.title = t('title');
  document.documentElement.lang = LANG;
  try { TYPES = await loadTypes(); } catch { app.textContent = { de: 'Bitte laden Sie die Seite neu.', fr: 'Veuillez recharger la page.', ru: 'Обновите страницу.' }[LANG] || 'Please reload the page.'; return; }
  initConsent();
  { const a = document.querySelector('.consent a'); if (a) a.href = `legal-mind-${['de', 'fr'].includes(document.documentElement.lang) ? document.documentElement.lang : 'en'}.html#privacy`; } // общих privacy-страниц на своём домене нет
  track('open');
  if (st.step === 'quiz') return quiz();
  if (st.step === 'result' && st.parent) return result();
  if (st.step === 'child' && st.parent) return child();
  landing();
}
if (typeof document !== 'undefined') boot();
