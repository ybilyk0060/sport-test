// Экран камеры: разрешение → проверка кадра → 4 упражнения. И запасной путь: разбор записи.

import { T } from './i18n/index.js?v=bc3acf8-mwxp73fq';
import { CONFIG } from './config.js?v=bc3acf8-mwxp73fq';
import { state, setState, track, exportHandoff } from './store.js?v=bc3acf8-mwxp73fq';
import { detectEnv, chromeIntentUrl, safariUrl } from './env.js?v=bc3acf8-mwxp73fq';
import { openCamera, stopCamera, keepAwake, camStatus } from './camera.js?v=bc3acf8-mwxp73fq';
import { preloadPose, poseStatus } from './pose.js?v=bc3acf8-mwxp73fq';
import { unlockAudio, preloadClips, say, sayQueue, stopVoice, exists } from './audio.js?v=bc3acf8-mwxp73fq';
import { framingCheck, frameLoop, createRun } from './session.js?v=bc3acf8-mwxp73fq';
import { createRaiseHand } from './gesture.js?v=bc3acf8-mwxp73fq';
import { recording } from './analytics.js?v=bc3acf8-mwxp73fq';
import { demoSvg } from './demos.js?v=bc3acf8-mwxp73fq';
import { EX_QUALITY } from './scoring.js?v=bc3acf8-mwxp73fq';
import { greenOverlay } from './greenkey.js?v=bc3acf8-mwxp73fq';

const env = detectEnv();
const $ = (sel, root = document) => root.querySelector(sel);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let root, video, canvas, hud, stopLoop = null, facing = 'user', alive = false, onDone = null, onExit = null, customList = null;

const plan = () => customList || (CONFIG.ageGroups[state.quiz.age] || CONFIG.ageGroups[CONFIG.defaultAge]).plan;
const exName = (k) => T.ex[k].name;
// «Упражнение 1 из 5»: обе ноги баланса и обе попытки прыжков — одно упражнение
const base = (k) => k.replace(/_(r|l|1|2)$/, '');
function exOf(i) { const ks = plan().map((p) => base(p.key)); const uniq = [...new Set(ks)]; return T.cam.exOf(uniq.indexOf(ks[i]) + 1, uniq.length); }

function mount() {
  const app = document.getElementById('app');
  recording.pause();
  app.innerHTML = `<div class="stage ph-no-capture" data-rotate="${esc(T.cam.rotate)}"><video class="cam" playsinline muted autoplay></video><canvas class="skel"></canvas><div class="hud"></div><button class="stage-close" data-close aria-label="${esc(T.common.close)}">✕</button></div>`;
  root = $('.stage', app); video = $('video.cam', root); canvas = $('canvas.skel', root); hud = $('.hud', root);
  // Крестик: выйти из камеры в любой момент (камера выключается, возвращаемся к подготовке)
  $('[data-close]', root).onclick = () => { track('camera_closed'); unmount(); onExit && onExit(); };
  alive = true;
}
function unmount() {
  alive = false;
  recording.resume();
  if (stopLoop) { stopLoop(); stopLoop = null; }
  stopVoice(); stopCamera(); keepAwake(false);
  if (video) { try { video.pause(); } catch { /* уже остановлено */ } if (video.src) { URL.revokeObjectURL(video.src); video.removeAttribute('src'); } video.srcObject = null; }
}

// --- Кадр + скелет на одном холсте (только рисуем, не сохраняем) ---
// Кадр, по которому найдена поза, рисуется на тот же холст в тот же момент, что и скелет:
// скелет не отстаёт и не съезжает с тела (раньше видео и скелет жили в разных слоях и расходились при задержке распознавания).
const BONES = [[11, 12], [11, 13], [13, 15], [12, 14], [14, 16], [11, 23], [12, 24], [23, 24], [23, 25], [25, 27], [24, 26], [26, 28], [27, 31], [28, 32]];
const JOINTS = [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];
function drawFrame(lm) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = Math.round(canvas.clientWidth * dpr), h = Math.round(canvas.clientHeight * dpr);
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  const g = canvas.getContext('2d');
  if (lm === null || !video.videoWidth) { g.clearRect(0, 0, w, h); return; } // без позы: виден живой <video> под холстом
  const vw = video.videoWidth, vh = video.videoHeight, sc = Math.max(w / vw, h / vh), dx = (w - vw * sc) / 2, dy = (h - vh * sc) / 2;
  g.drawImage(video, dx, dy, vw * sc, vh * sc);
  if (!lm) return;
  const P = (i) => [dx + lm[i].x * vw * sc, dy + lm[i].y * vh * sc];
  const vis = (i) => lm[i] && lm[i].visibility >= 0.5;
  g.lineCap = 'round'; g.lineJoin = 'round';
  g.lineWidth = 7 * dpr; g.strokeStyle = 'rgba(0,0,0,.35)';
  const bones = () => { for (const [a, b] of BONES) { if (!vis(a) || !vis(b)) continue; const [x1, y1] = P(a), [x2, y2] = P(b); g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); } };
  bones(); g.lineWidth = 4 * dpr; g.strokeStyle = 'rgba(255,255,255,.95)'; bones();
  g.fillStyle = '#ff7a1a';
  for (const i of JOINTS) { if (!vis(i)) continue; const [x, y] = P(i); g.beginPath(); g.arc(x, y, 5 * dpr, 0, 7); g.fill(); }
}
const drawSkeleton = drawFrame;

const SWITCH_ICON = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h2.5l1.6-2.2h7.8L17.5 8H20a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><path d="M9.2 12.6a3 3 0 0 1 5.3-1.4M14.8 14.4a3 3 0 0 1-5.3 1.4"/><path d="M14.6 9.6v1.8h-1.8M9.4 17.4v-1.8h1.8"/></svg>';
const switchBtnHtml = () => `<button class="glass-btn icon" data-act="switch-cam" aria-label="${esc(T.cam.switch)}">${SWITCH_ICON}</button>`;
function topBar(label, { switchBtn = true, skip = false } = {}) {
  // Надписи в углах читаются с 2–3 м (Юрий 26.11): номер упражнения мелко, название крупно, плотный тёмный фон
  const [small, big] = label && label.includes(' · ') ? label.split(' · ') : [null, label];
  return `<div class="hud-top">${label ? `<span class="glass-pill hud-title">${small ? `<small>${esc((small.match(/\d+/g) || []).slice(0, 2).join('/') || small)}</small> · ` : ''}<b>${esc(big)}</b></span>` : '<span></span>'}<span class="hud-actions">${skip ? `<button class="glass-btn" data-act="skip-ex">${esc(T.cam.skipEx)}</button>` : ''}${switchBtn ? switchBtnHtml() : ''}</span></div>`;
}

async function switchCamera() {
  facing = facing === 'environment' ? 'user' : 'environment';
  try { await openCamera(video, facing); root.classList.toggle('mirror', facing === 'user'); track('camera_switched', { facing }); }
  catch { facing = facing === 'environment' ? 'user' : 'environment'; try { await openCamera(video, facing); } catch { /* останемся без камеры — сработает экран ошибки при следующем шаге */ } }
}

// ---------- Запуск с живой камерой ----------
// Видео панды скачиваем заранее (с экрана подготовки) и показываем из памяти: прогон 26.11 — на первом упражнении
// вместо панды 10 с был тёмный прямоугольник, файл не успел загрузиться.
const videoBlobs = new Map();
const videoSrc = (url) => videoBlobs.get(url) || url;
export function prefetchVideos() {
  for (const p of plan()) {
    const ex = CONFIG.exercises[p.key]; if (!ex) continue;
    const url = ex.gVideo || ex.vVideo || ex.localVideo || (ex.video ? CONFIG.mediaBase + ex.video : null);
    const poster = ex.vPoster || ex.localPoster || (ex.poster ? CONFIG.mediaBase + ex.poster : null);
    if (poster) { const im = new Image(); im.src = poster; }
    if (!url || videoBlobs.has(url)) continue;
    videoBlobs.set(url, url);
    fetch(url).then((r) => (r.ok ? r.blob() : null)).then((b) => { if (b && b.size) videoBlobs.set(url, URL.createObjectURL(b)); }).catch(() => {});
  }
}

export async function startStage({ done, exit, list = null, mode = 'live' }) {
  onDone = done; onExit = exit; customList = list;
  unlockAudio();
  prefetchVideos();
  mount();
  hud.innerHTML = `<div class="big-center"><div><div class="spinner"></div><p class="t" style="margin-top:16px">${esc(T.cam.requesting)}</p><p style="margin-top:8px;opacity:.85">${esc(T.cam.allowHint)}</p></div></div>`;
  track('camera_request', { facing, mode });
  // Камера и модель позы стартуют одновременно: пока телефон спрашивает разрешение, модель уже грузится.
  const t0 = performance.now();
  const model = preloadPose().then(() => null, (e) => e || new Error('model'));
  preloadClips(['cue_great', 'pf_phone', 'ui_steps_back', 'frame_step_back', 'frame_upper_only', 'ui_raise_hand', 'intro_next', 'intro_last', 'session_get_ready', 'session_start', 'session_finished', 'count_1', 'count_2', 'count_3', ...plan().flatMap((p) => [CONFIG.exercises[p.key].intro, CONFIG.exercises[p.key].introFallback].filter(Boolean))]);
  try {
    await openCamera(video, facing);
  } catch (e) {
    const kind = e.kind || 'unsupported';
    track(kind === 'denied' ? 'camera_denied' : 'camera_error', { kind, error: (e && e.name) || String(e) });
    return showBlocked(kind);
  }
  if (!alive) return;
  track('camera_granted', { facing: camStatus.facing, label: camStatus.label, w: camStatus.width, h: camStatus.height, ms: Math.round(performance.now() - t0) });
  // Голосом, как в Kidsney: «Постав телефон до стіни!» → «Три кроки назад!»
  sayQueue(['pf_phone', 'ui_steps_back']);
  root.classList.toggle('mirror', facing === 'user');
  keepAwake(true);
  if (poseStatus.state !== 'ready') hud.innerHTML = `<div class="big-center small-overlay"><div><div class="spinner"></div><p class="t" style="margin-top:16px">${esc(T.prep.modelLoading)}</p></div></div>`;
  const err = await model;
  if (err) { track('model_error', { error: String(err && err.message ? err.message : err) }); return showBlocked('model'); }
  if (!alive) return;
  track('stage_ready', { ms: Math.round(performance.now() - t0) });
  setState({ fallback: false });
  await framing();
  if (!alive) return;
  track('test_start', { mode, age: state.quiz.age });
  const results = [];
  const items = plan();
  for (let i = 0; i < items.length; i++) {
    const r = await liveExercise(items[i], i, items.length);
    if (!alive) return;
    results.push(r);
  }
  say('session_finished');
  finish(results, mode);
}

function finish(results, mode) {
  unmount();
  onDone && onDone(results, mode);
}

// Проверка: голова и стопы в кадре
function framing() {
  return new Promise((resolve) => {
    hud.innerHTML = `${topBar('')}<div class="frame-guide" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
      <div class="glass-card frame-card"><p class="fc-title">${esc(T.cam.frameTitle)}</p><p class="fc-msg" data-el="msg"></p>
        <div class="checks"><span class="chk" data-el="head">${esc(T.cam.frameHead)}</span><span class="chk" data-el="feet">${esc(T.cam.frameFeet)}</span></div>
        <button class="glass-btn wide" data-act="start-anyway" hidden>${esc(T.cam.startAnyway)}</button></div>`;
    const msg = $('[data-el=msg]', hud), head = $('[data-el=head]', hud), feet = $('[data-el=feet]', hud);
    let okSince = null, doneFlag = false, lastHint = 0;
    const t0 = performance.now();
    const end = (how) => { if (doneFlag) return; doneFlag = true; if (stopLoop) { stopLoop(); stopLoop = null; } track('framing_ok', { how, ms: Math.round(performance.now() - t0), fps: poseStatus.fps }); resolve(); };
    hud.onclick = (e) => { const a = e.target.closest('[data-act]'); if (!a) return; if (a.dataset.act === 'start-anyway') end('manual'); if (a.dataset.act === 'switch-cam') switchCamera(); };
    stopLoop = frameLoop(video, (lm) => {
      drawSkeleton(lm || false);
      const c = framingCheck(lm);
      head.classList.toggle('ok', c.head); feet.classList.toggle('ok', c.feet);
      hud.querySelector('.frame-card').classList.toggle('ok', c.ok);
      msg.textContent = c.ok ? T.cam.frameOk : !c.body ? T.cam.frameNoBody : !c.head ? T.cam.frameNoHead : T.cam.frameNoFeet;
      const now = performance.now();
      if (c.ok) { okSince = okSince ?? now; if (now - okSince > 1000) end('auto'); } else okSince = null; // «Чудово!» звучит в начале вступления первого упражнения одной очередью, чтобы не перебить инструкцию
      // Голосовые подсказки кадра (не чаще раза в 5 с, после вступления)
      if (!c.ok && now - t0 > 4500 && now - lastHint > 5000) { lastHint = now; say(!c.body ? 'ui_steps_back' : !c.head && !c.feet ? 'frame_step_back' : !c.feet ? 'frame_upper_only' : 'frame_step_back', { interrupt: false }); }
      if (now - t0 > 8000) $('[data-act=start-anyway]', hud).hidden = false;
    });
  });
}

function introSheet(p, i, n, btnHtml) {
  const ex = CONFIG.exercises[p.key], tx = T.ex[p.key];
  const note = ex.wall ? T.cam.wallNote : ex.floor === 'any' ? T.cam.floorAnyNote : ex.floor === 'side' ? T.cam.floorSideNote : ex.floor ? T.cam.floorFrontNote : ex.facing === 'side' ? T.cam.sideNote : T.cam.frontNote;
  const checks = (EX_QUALITY[p.key] || []).map((q) => T.result.qualities[q].name.toLowerCase()).join(', ');
  return `<div class="sheet show"><div class="tags"><span class="tag">${esc(exOf(i, n))}</span>${checks ? `<span class="tag checks">${esc(T.cam.checks(checks))}</span>` : ''}</div><h2>${esc(p.timed ? T.cam.forSec(tx.name, p.capSec) : tx.task(p.target))}</h2>
    ${ex.vVideo || ex.localVideo ? `<video class="panda${ex.vVideo ? ' vert' : ''}" playsinline muted loop autoplay preload="auto" poster="${ex.vPoster || ex.localPoster}" src="${videoSrc(ex.vVideo || ex.localVideo)}"></video>` : ex.demo ? demoSvg(ex.demo) : ex.video ? `<video class="panda" playsinline muted loop autoplay preload="auto" poster="${CONFIG.mediaBase + ex.poster}" src="${videoSrc(CONFIG.mediaBase + ex.video)}"></video>` : (ex.art || '')}
    <p>${esc(tx.how)}</p>${tx.pandaNote ? `<p class="small" style="opacity:.8">${esc(tx.pandaNote)}</p>` : ''}<p class="note">↻ ${esc(note)}</p>${btnHtml}</div>`;
}

// Короткое видео с пандой и голос студии перед упражнением.
// Дальше — поднятой рукой (держать 1,5 с), как во всех приложениях Kidsney, или кнопкой. Подходить к телефону не нужно.
let inFrame = false; // последний кадр вступления: голова и стопы видны
const HAND_R = 34, HAND_C = 2 * Math.PI * HAND_R;
function intro(p, i, n) {
  return new Promise((resolve) => {
    inFrame = false;
    const handHtml = `<div class="raise wait"><svg viewBox="0 0 80 80" aria-hidden="true"><circle class="r-bg" cx="40" cy="40" r="${HAND_R}"/><circle class="r-fg" data-el="ring" cx="40" cy="40" r="${HAND_R}" stroke-dasharray="${HAND_C}" stroke-dashoffset="${HAND_C}"/><text x="40" y="52" text-anchor="middle" font-size="34">✋</text></svg><span>${esc(T.cam.raiseHand)}</span></div>`;
    const ex = CONFIG.exercises[p.key];
    // Есть ролик на зелёном фоне — панда во весь экран поверх живой камеры (Юрий 26.11), иначе карточка с роликом
    let stopKey = null;
    if (ex.gVideo) {
      hud.innerHTML = `${topBar(`${exOf(i, n)} · ${exName(p.key)}`, { switchBtn: false })}<canvas class="panda-key" aria-hidden="true"></canvas><video class="pk-src" playsinline muted loop autoplay preload="auto" src="${videoSrc(ex.gVideo)}"></video>
        <div class="over-bottom">${handHtml}<button class="btn" data-act="go">${esc(T.cam.go)}</button><button class="btn ghost" data-act="skip-ex">${esc(T.cam.skipEx)}</button></div>`;
      const sv = $('video.pk-src', hud); sv.play().catch(() => {});
      stopKey = greenOverlay($('canvas.panda-key', hud), sv);
      if (!stopKey) { sv.classList.add('plain'); } // нет WebGL — ролик как есть
    } else hud.innerHTML = introSheet(p, i, n, `${handHtml}<button class="btn" data-act="go">${esc(T.cam.go)}</button><button class="btn ghost" data-act="skip-ex">${esc(T.cam.skipEx)}</button>`);
    preloadClips([...Object.keys(T.hints).map((h) => 'hint_' + h), ...Object.keys(T.hints), ...(ex.coach ? [1, 2].map((n) => ex.coach + n) : []), 'ui_raise_hand']);
    // «Далі!» / «Останнє!», для вправи на підлозі — «Телефон на підлогу!», затем полная инструкция (пока её нет — короткий клип студии)
    // Поднятая рука запускает упражнение только после инструкции (прогон 26.11: рука срабатывала на 4-й секунде 17-секундной инструкции,
    // ребёнок не слышал, что делать). Кнопка «Поехали» работает сразу. Без звука (iOS не разрешил) рука включается сразу же.
    let handArmed = false;
    const armHand = () => { if (handArmed || ended) return; handArmed = true; const rz = $('.raise', hud); if (rz) rz.classList.remove('wait'); clearTimeout(remindTimer); remind(); };
    sayQueue([...(i > 0 ? [i === n - 1 ? 'intro_last' : 'intro_next'] : ['cue_great']), ...(ex.floor ? ['ui_phone_tip'] : []), exists(ex.intro) ? ex.intro : ex.introFallback]).then(armHand, armHand);
    setTimeout(armHand, 30000); // страховка, если голос завис
    const pv = $('video.panda', hud); if (pv) { pv.play().catch(() => {}); pv.onerror = () => { pv.style.display = 'none'; }; } // нет сети до видео — остаются текст и голос
    const ring = $('[data-el=ring]', hud);
    const gesture = createRaiseHand();
    // Голос «Підніми руку»: после инструкции, потом напоминания (как в Kidsney: 20 с, затем каждые 15 с, не больше 3 раз)
    let reminders = 0;
    const remind = () => { if (ended) return; say('ui_raise_hand', { interrupt: false }); if (++reminders < 3) remindTimer = setTimeout(remind, 15000); };
    let remindTimer = 0;
    let ended = false;
    const end = (v, how) => {
      if (ended) return; ended = true; clearTimeout(remindTimer); if (stopKey) stopKey();
      if (stopLoop) { stopLoop(); stopLoop = null; }
      track('exercise_go', { key: p.key, how });
      resolve(v);
    };
    hud.onclick = (e) => { const a = e.target.closest('[data-act]'); if (!a) return; if (a.dataset.act === 'go') end('go', 'button'); if (a.dataset.act === 'skip-ex') end('skip', 'button'); };
    // Камера живая и под карточкой: распознаём позу только ради жеста
    if (stopLoop) { stopLoop(); stopLoop = null; }
    stopLoop = frameLoop(video, (lm) => {
      drawSkeleton(lm || false);
      inFrame = framingCheck(lm).ok;
      if (!handArmed) return;
      const r = gesture.frame(lm, performance.now());
      ring.style.strokeDashoffset = String(HAND_C * (1 - r.progress));
      ring.parentNode.parentNode.classList.toggle('on', r.progress > 0);
      if (r.fired) end('go', 'hand');
    });
  });
}

async function countdown() {
  say('session_get_ready');
  hud.onclick = null;
  for (const n of [3, 2, 1]) {
    if (!alive) return;
    hud.innerHTML = `<div class="big-center"><div class="n">${n}</div></div>`;
    await sleep(n === 3 ? 1100 : 900);
    if (n > 1) say('count_' + (n - 1), { interrupt: true });
  }
  say('session_start');
}

// Крупная шкала, видна издалека: кольцо = сколько осталось, с каждым засчитанным повтором (секундой) уменьшается.
const RING_R = 88, RING_C = 2 * Math.PI * RING_R;
function runHud(p, i, n, isSeconds) {
  // На время (timed): кольцо — оставшееся время, число — повторы. Наклон: число — достигнутый уровень из 4.
  const timed = !!p.timed, bend = CONFIG.exercises[p.key].custom === 'bend';
  const of = timed ? T.cam.inSec(p.capSec) : bend ? T.cam.levelOf(4) : isSeconds ? T.cam.secs(p.target) : T.cam.reps(p.target);
  const left0 = timed ? T.cam.left(p.capSec, true) : bend ? T.cam.bendHold : T.cam.left(p.target, isSeconds);
  hud.innerHTML = `${topBar(`${exOf(i, n)} · ${exName(p.key)}`, { skip: true, switchBtn: false })}
    <div class="gauge"><svg viewBox="0 0 200 200" aria-hidden="true"><circle class="g-bg" cx="100" cy="100" r="${RING_R}"/><circle class="g-fg" data-el="ring" cx="100" cy="100" r="${RING_R}" stroke-dasharray="${RING_C}" stroke-dashoffset="0"/></svg>
      <div class="g-in"><div class="num" data-el="num">0</div><div class="of">${esc(of)}</div></div></div>
    <div class="left" data-el="left">${esc(left0)}</div>
    <div class="hint" data-el="hint"></div><div class="timebar"><i data-el="bar"></i></div>`;
  const ring = $('[data-el=ring]', hud), left = $('[data-el=left]', hud);
  return {
    num: $('[data-el=num]', hud), hint: $('[data-el=hint]', hud), bar: $('[data-el=bar]', hud),
    timeLeft(sec) { if (!timed) return; ring.style.strokeDashoffset = String(RING_C * (1 - sec / p.capSec)); left.textContent = sec > 0 ? T.cam.left(Math.ceil(sec), true) : T.cam.done; },
    set(c) {
      if (timed) return;
      if (bend) { ring.style.strokeDashoffset = String(RING_C * (1 - c / 4)); return; }
      const rest = Math.max(0, p.target - c);
      ring.style.strokeDashoffset = String(RING_C * (1 - rest / p.target));
      left.textContent = rest > 0 ? T.cam.left(rest, isSeconds) : T.cam.done;
      ring.classList.remove('hit'); void ring.getBoundingClientRect(); ring.classList.add('hit');
    },
  };
}

async function liveExercise(p, i, n) {
  track('exercise_intro', { key: p.key, i });
  const how = await intro(p, i, n);
  if (!alive) return null;
  if (how === 'skip') { const r = skipped(p); track('exercise_done', { key: p.key, skipped: true }); return r; }
  // Прогон 26.11: рука поднята вплотную к телефону — и баланс начал отсчёт, когда в кадре было одно лицо.
  // Стоя: перед отсчётом снова ждём тело целиком в кадре (на полу голова/стопы не обязаны быть видны).
  if (!inFrame && !CONFIG.exercises[p.key].floor) { await framing(); if (!alive) return null; }
  await countdown();
  if (!alive) return null;
  return new Promise((resolve) => {
    let ui, hintTimer = 0, lostSince = null, lostSaidAt = 0;
    const run = createRun({
      key: p.key, target: p.target, capSec: p.capSec, ageGroup: state.quiz.age || CONFIG.defaultAge, timed: !!p.timed,
      aspect: video.videoWidth && video.videoHeight ? video.videoWidth / video.videoHeight : null,
      clock: () => performance.now(),
      on: {
        count: (c) => { ui.num.textContent = c; ui.set(c); ui.num.classList.remove('pop'); void ui.num.offsetWidth; ui.num.classList.add('pop'); const ex = CONFIG.exercises[p.key]; if (c <= 30 && ex.custom !== 'sidejump' && ex.custom !== 'bend') say('count_' + c); if (ex.coach && !run.isSeconds && c % 5 === 0 && c < p.target) setTimeout(() => say(ex.coach + (1 + ((c / 5 - 1) % 4)), { interrupt: false }), 650); },
        hint: (id) => { const text = T.hints[id]; if (!text) return; ui.hint.textContent = text; clearTimeout(hintTimer); hintTimer = setTimeout(() => { ui.hint.textContent = ''; }, 2500); say(exists('hint_' + id) ? 'hint_' + id : id, { interrupt: false }); },
        tick: ({ left }) => { ui.bar.style.width = `${Math.max(0, (left / p.capSec) * 100)}%`; ui.timeLeft(left); },
        finish: async (r) => {
          if (stopLoop) { stopLoop(); stopLoop = null; }
          clearTimeout(hintTimer);
          track('exercise_done', { key: p.key, done: r.done, target: r.target, reason: r.reason, sec: r.elapsedSec, fps: poseStatus.fps, skipped: !!r.skipped });
          drawSkeleton(null);
          if (!r.skipped) { hud.innerHTML = `<div class="big-center"><div class="t" style="font-size:40px">${esc(T.cam.done)}</div></div>`; await sleep(900); }
          resolve(r);
        },
      },
    });
    ui = runHud(p, i, n, run.isSeconds);
    hud.onclick = (e) => { const a = e.target.closest('[data-act]'); if (a && a.dataset.act === 'skip-ex') run.skip(); };
    track('exercise_start', { key: p.key, target: p.target });
    run.start();
    stopLoop = frameLoop(video, (lm) => {
      drawSkeleton(lm || false);
      // Тело должно быть в кадре целиком (стоя): иначе подсказка «отойдите» (прогон 26.11: вплотную к телефону было видно одно лицо)
      const seen = lm && (CONFIG.exercises[p.key].floor || framingCheck(lm).ok);
      if (!seen) { lostSince = lostSince ?? performance.now(); if (performance.now() - lostSince > 1500 && !ui.hint.textContent) { ui.hint.textContent = T.cam.lost; if (performance.now() - lostSaidAt > 6000) { lostSaidAt = performance.now(); say('ui_steps_back', { interrupt: false }); } } }
      else if (lostSince) { lostSince = null; if (ui.hint.textContent === T.cam.lost) ui.hint.textContent = ''; }
      run.frame(lm);
      if (window.__poseTap) try { window.__poseTap(p.key, lm); } catch { /* диагностика прогона (tools/e2e-iphone-wi.mjs), у покупателя не задана */ }
    });
  });
}

const skipped = (p) => ({ key: p.key, target: p.target, capSec: p.capSec, done: 0, completed: false, skipped: true, elapsedSec: 0, reason: 'skip', metrics: {} });

// ---------- Экран «камера недоступна» ----------
function showBlocked(kind) {
  unmount();
  const app = document.getElementById('app');
  const here = new URL(location.href); here.search = ''; here.hash = '';
  here.searchParams.set('s', exportHandoff());
  here.searchParams.set('lang', T.meta.lang); // язык не теряется при переходе в Safari/Chrome
  const link = here.toString();
  const B = T.blocked;
  let head, body = '';
  const steps = (arr) => `<div class="box"><ol class="steps">${arr.map((s) => `<li>${esc(s)}</li>`).join('')}</ol></div>`;
  const retry = `<button class="btn" data-act="retry">${esc(T.common.retry)}</button>`;
  const fb = `<div class="box"><button class="btn line" data-act="fallback">${esc(B.fallbackCta)}</button><p class="small muted center">${esc(B.fallbackNote)}</p></div>`;

  if (env.inApp && env.platform === 'android') {
    // Встроенный браузер на Android без камеры: одна кнопка «Відкрити в Chrome», ответы едут в ссылке.
    head = `<h1 class="rtitle">${esc(B.openChromeTitle)}</h1><p>${esc(B.openChromeLead)}</p>`;
    body = `<a class="btn" data-act="open-chrome" href="${esc(chromeIntentUrl(link))}">${esc(B.openChrome)}</a><p class="small muted center">${esc(B.openManual)}</p><button class="btn ghost" data-act="copy">${esc(B.copyLink)}</button>${fb}`;
    track('open_in_chrome_shown', { kind });
  } else if (env.inApp && env.platform === 'ios' && !['Instagram', 'Facebook', 'Messenger'].includes(env.app)) {
    // TikTok и др.: переход в Safari по схеме не работает (проверено Юрием 25.11), меню «Открыть в браузере» нет.
    // Главное действие — скопировать ссылку с ответами и открыть её в Safari. Запасной путь «записать видео» здесь тоже не работает — не показываем.
    head = `<h1 class="rtitle">${esc(B.copyTitle)}</h1><p>${esc(B.copyLead)}</p>`;
    body = `<button class="btn" data-act="copy">${esc(B.copyLinkBig)}</button>${steps(B.copySteps)}`;
    track('copy_link_shown', { kind });
  } else if (env.inApp && env.platform === 'ios') {
    head = `<h1 class="rtitle">${esc(B.openSafariTitle)}</h1><p>${esc(B.openSafariLead)}</p>`;
    // Меньше касаний: главная кнопка — сразу в Safari с сохранёнными ответами; копировать ссылку — запасной путь.
    // Запись видео встроенной камерой в браузерах приложений на iOS даёт чёрный экран — не показываем.
    body = `<a class="btn" data-act="open-safari" href="${esc(safariUrl(link))}">${esc(B.openSafari)}</a><p class="small muted center">${esc(B.openManual)}</p><button class="btn ghost" data-act="copy">${esc(B.copyLink)}</button>${kind === 'denied' ? `<div class="box"><p class="small"><b>${esc(B.deniedTitle)}</b></p>${steps(B.howIosInApp(env.app || 'Instagram'))}<button class="btn line" data-act="retry">${esc(T.common.retry)}</button></div>` : ''}`;
    track('open_in_safari_shown', { kind });
  } else if (kind === 'denied') {
    head = `<h1 class="rtitle">${esc(B.deniedTitle)}</h1><p>${esc(B.deniedLead)}</p>`;
    body = steps(env.platform === 'ios' ? B.howIosSafari : env.platform === 'android' ? B.howAndroid : B.howGeneric) + retry + fb;
  } else if (kind === 'model') {
    head = `<h1 class="rtitle">${esc(B.noCamTitle)}</h1><p>${esc(T.cam.modelFail)}</p>`;
    body = retry;
  } else {
    head = `<h1 class="rtitle">${esc(B.noCamTitle)}</h1><p>${esc(B.noCamLead)}</p>`;
    body = fb + `<button class="btn ghost" data-act="retry">${esc(T.common.retry)}</button>`;
  }
  app.innerHTML = `<section class="screen">${head}${body}<div class="grow"></div><button class="btn ghost" data-act="exit">${esc(T.common.back)}</button></section>`;
  track('camera_blocked_shown', { kind });
  app.onclick = async (e) => {
    const a = e.target.closest('[data-act]'); if (!a) return;
    const act = a.dataset.act;
    if (act === 'retry') { app.onclick = null; startStage({ done: onDone, exit: onExit }); }
    else if (act === 'fallback') { app.onclick = null; startFallback({ done: onDone, exit: onExit }); }
    else if (act === 'exit') { app.onclick = null; onExit && onExit(); }
    else if (act === 'open-chrome') track('open_in_chrome_click');
    else if (act === 'open-safari') track('open_in_safari_click');
    else if (act === 'copy') {
      try { await navigator.clipboard.writeText(link); } catch { const ta = document.createElement('textarea'); ta.value = link; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch { /* не удалось */ } ta.remove(); }
      toast(B.copied);
    }
  };
}

export function toast(text) {
  const t = document.createElement('div'); t.className = 'toast'; t.textContent = text; document.body.appendChild(t); setTimeout(() => t.remove(), 2200);
}

// ---------- Запасной путь: запись обычной камерой телефона, разбор в браузере ----------
export async function startFallback({ done, exit }) {
  onDone = done; onExit = exit;
  unlockAudio();
  mount();
  setState({ fallback: true });
  track('fallback_start');
  try {
    hud.innerHTML = `<div class="big-center"><div><div class="spinner"></div><p class="t" style="margin-top:16px">${esc(T.prep.modelLoading)}</p></div></div>`;
    await preloadPose();
  } catch (e) { track('model_error', { error: String(e) }); return showBlocked('model'); }
  if (!alive) return;
  track('test_start', { mode: 'file', age: state.quiz.age });
  const list = plan(); const results = [];
  for (let i = 0; i < list.length; i++) {
    const r = await fileExercise(list[i], i, list.length);
    if (!alive) return;
    results.push(r);
  }
  finish(results, 'file');
}

function fileExercise(p, i, n) {
  return new Promise((resolve) => {
    const F = T.fallback;
    const render = (errText = '') => {
      hud.innerHTML = introSheet(p, i, n, `<p>${esc(F.lead(CONFIG.fallbackClipSec))}</p>${errText ? `<p class="err">${esc(errText)}</p>` : ''}
        <label class="btn">${esc(F.pick)}<input type="file" accept="video/*" capture="environment" hidden data-el="file"></label>
        <p class="small muted center">${esc(F.privacy)}</p><button class="btn ghost" data-act="skip-ex">${esc(T.cam.skipEx)}</button>`);
      const pv = $('video.panda', hud); if (pv) { pv.play().catch(() => {}); pv.onerror = () => { pv.style.display = 'none'; }; }
      $('[data-el=file]', hud).onchange = (e) => { const f = e.target.files && e.target.files[0]; if (f) analyze(f); };
    };
    hud.onclick = (e) => { const a = e.target.closest('[data-act]'); if (a && a.dataset.act === 'skip-ex') { track('exercise_done', { key: p.key, skipped: true, mode: 'file' }); resolve(skipped(p)); } };
    track('exercise_intro', { key: p.key, i, mode: 'file' });
    render();

    async function analyze(file) {
      track('exercise_start', { key: p.key, target: p.target, mode: 'file', mb: Math.round(file.size / 1e5) / 10 });
      const url = URL.createObjectURL(file); // локальная ссылка на файл в памяти телефона; никуда не отправляется
      video.srcObject = null; video.src = url; video.muted = true; video.loop = false;
      hud.innerHTML = `${topBar(`${exOf(i, n)} · ${exName(p.key)}`, { switchBtn: false })}<div class="count"><div class="num" data-el="num">0</div><div class="of">${esc(F.analyzing)}</div></div><div class="timebar"><i data-el="bar" style="width:0"></i></div>`;
      const num = $('[data-el=num]', hud), bar = $('[data-el=bar]', hud);
      const cleanup = () => { if (stopLoop) { stopLoop(); stopLoop = null; } video.onended = null; video.onerror = null; try { video.pause(); } catch { /* уже остановлено */ } video.removeAttribute('src'); video.load(); URL.revokeObjectURL(url); drawSkeleton(null); };
      const fail = () => { cleanup(); track('fallback_failed', { key: p.key }); render(F.failed); };
      try {
        await new Promise((res, rej) => { video.onloadedmetadata = res; video.onerror = rej; setTimeout(rej, 15000); });
      } catch { return fail(); }
      const dur = Number.isFinite(video.duration) ? video.duration : CONFIG.fallbackMaxSec;
      const run = createRun({
        key: p.key, target: p.target, capSec: Math.min(CONFIG.fallbackMaxSec, dur + 1), ageGroup: state.quiz.age || CONFIG.defaultAge,
        aspect: video.videoWidth / video.videoHeight, clock: () => 1000 + video.currentTime * 1000,
        on: {
          count: (c) => { num.textContent = c; },
          tick: () => { bar.style.width = `${Math.min(100, (video.currentTime / dur) * 100)}%`; },
          finish: (r) => { cleanup(); track('exercise_done', { key: p.key, done: r.done, target: r.target, reason: r.reason, sec: r.elapsedSec, mode: 'file', fps: poseStatus.fps }); resolve(r); },
        },
      });
      run.start();
      video.onended = () => run.end('ended');
      video.onerror = () => { if (!run.finished) fail(); };
      stopLoop = frameLoop(video, (lm) => { drawSkeleton(lm || false); run.frame(lm); });
      video.play().catch(() => fail());
    }
  });
}

export function leaveStage() { unmount(); }
