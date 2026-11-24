// Экран камеры: разрешение → проверка кадра → 4 упражнения. И запасной путь: разбор записи.

import { T } from './i18n/index.js';
import { CONFIG } from './config.js';
import { state, setState, track, exportHandoff } from './store.js';
import { detectEnv, chromeIntentUrl, safariUrl } from './env.js';
import { openCamera, stopCamera, keepAwake, camStatus } from './camera.js';
import { preloadPose, poseStatus } from './pose.js';
import { unlockAudio, preloadClips, say, stopVoice } from './audio.js';
import { framingCheck, frameLoop, createRun } from './session.js';

const env = detectEnv();
const $ = (sel, root = document) => root.querySelector(sel);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let root, video, canvas, hud, stopLoop = null, facing = 'environment', alive = false, onDone = null, onExit = null;

const plan = () => CONFIG.ageGroups[state.quiz.age || '7-9'].plan;
const exName = (k) => T.ex[k].name;

function mount() {
  const app = document.getElementById('app');
  app.innerHTML = `<div class="stage" data-rotate="${esc(T.cam.rotate)}"><video class="cam" playsinline muted autoplay></video><canvas class="skel"></canvas><div class="hud"></div></div>`;
  root = $('.stage', app); video = $('video.cam', root); canvas = $('canvas.skel', root); hud = $('.hud', root);
  alive = true;
}
function unmount() {
  alive = false;
  if (stopLoop) { stopLoop(); stopLoop = null; }
  stopVoice(); stopCamera(); keepAwake(false);
  if (video) { try { video.pause(); } catch { /* уже остановлено */ } if (video.src) { URL.revokeObjectURL(video.src); video.removeAttribute('src'); } video.srcObject = null; }
}

// --- Скелет поверх видео (только рисуем, не сохраняем) ---
const BONES = [[11, 12], [11, 13], [13, 15], [12, 14], [14, 16], [11, 23], [12, 24], [23, 24], [23, 25], [25, 27], [24, 26], [26, 28]];
function drawSkeleton(lm) {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  const g = canvas.getContext('2d'); g.clearRect(0, 0, w, h);
  if (!lm || !video.videoWidth) return;
  const vw = video.videoWidth, vh = video.videoHeight, sc = Math.max(w / vw, h / vh), dx = (w - vw * sc) / 2, dy = (h - vh * sc) / 2;
  const P = (i) => [dx + lm[i].x * vw * sc, dy + lm[i].y * vh * sc];
  g.lineWidth = 4; g.lineCap = 'round'; g.strokeStyle = 'rgba(255,255,255,.85)';
  for (const [a, b] of BONES) { if (lm[a].visibility < 0.5 || lm[b].visibility < 0.5) continue; const [x1, y1] = P(a), [x2, y2] = P(b); g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); }
  g.fillStyle = '#ff7a1a';
  for (const i of [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28]) { if (lm[i].visibility < 0.5) continue; const [x, y] = P(i); g.beginPath(); g.arc(x, y, 5, 0, 7); g.fill(); }
}

function topBar(label, { switchBtn = true, skip = false } = {}) {
  return `<div class="hud-top"><span class="pill">${esc(label)}</span><span style="display:flex;gap:8px">${skip ? `<button class="pill" data-act="skip-ex">${esc(T.cam.skipEx)}</button>` : ''}${switchBtn ? `<button class="pill" data-act="switch-cam">${esc(T.cam.switch)}</button>` : ''}</span></div>`;
}

async function switchCamera() {
  facing = facing === 'environment' ? 'user' : 'environment';
  try { await openCamera(video, facing); root.classList.toggle('mirror', facing === 'user'); track('camera_switched', { facing }); }
  catch { facing = facing === 'environment' ? 'user' : 'environment'; try { await openCamera(video, facing); } catch { /* останемся без камеры — сработает экран ошибки при следующем шаге */ } }
}

// ---------- Запуск с живой камерой ----------
export async function startStage({ done, exit }) {
  onDone = done; onExit = exit;
  unlockAudio();
  mount();
  hud.innerHTML = `<div class="big-center"><div><div class="spinner"></div><p class="t" style="margin-top:16px">${esc(T.cam.requesting)}</p><p style="margin-top:8px;opacity:.85">${esc(T.cam.allowHint)}</p></div></div>`;
  track('camera_request', { facing });
  try {
    await openCamera(video, facing);
  } catch (e) {
    const kind = e.kind || 'unsupported';
    track(kind === 'denied' ? 'camera_denied' : 'camera_error', { kind, error: (e && e.name) || String(e) });
    return showBlocked(kind);
  }
  if (!alive) return;
  track('camera_granted', { facing: camStatus.facing, label: camStatus.label, w: camStatus.width, h: camStatus.height });
  root.classList.toggle('mirror', facing === 'user');
  keepAwake(true);
  preloadClips(['session_get_ready', 'session_start', 'session_finished', 'count_1', 'count_2', 'count_3']);
  try {
    hud.innerHTML = `<div class="big-center"><div><div class="spinner"></div><p class="t" style="margin-top:16px">${esc(T.prep.modelLoading)}</p></div></div>`;
    await preloadPose();
  } catch (e) {
    track('model_error', { error: String(e && e.message ? e.message : e) });
    return showBlocked('model');
  }
  if (!alive) return;
  setState({ fallback: false });
  await framing();
  if (!alive) return;
  track('test_start', { mode: 'live', age: state.quiz.age });
  const results = [];
  const list = plan();
  for (let i = 0; i < list.length; i++) {
    const r = await liveExercise(list[i], i, list.length);
    if (!alive) return;
    results.push(r);
  }
  say('session_finished');
  finish(results, 'live');
}

function finish(results, mode) {
  unmount();
  onDone && onDone(results, mode);
}

// Проверка: голова и стопы в кадре
function framing() {
  return new Promise((resolve) => {
    hud.innerHTML = `${topBar(T.cam.frameTitle)}<div class="grow"></div><div class="frame-msg" data-el="msg"></div><div class="checks"><span class="chk" data-el="head">${esc(T.cam.frameHead)}</span><span class="chk" data-el="feet">${esc(T.cam.frameFeet)}</span></div><div class="hud-bottom"><button class="pill" data-act="start-anyway" hidden>${esc(T.cam.startAnyway)}</button></div>`;
    const msg = $('[data-el=msg]', hud), head = $('[data-el=head]', hud), feet = $('[data-el=feet]', hud);
    let okSince = null, doneFlag = false;
    const t0 = performance.now();
    const end = (how) => { if (doneFlag) return; doneFlag = true; if (stopLoop) { stopLoop(); stopLoop = null; } track('framing_ok', { how, ms: Math.round(performance.now() - t0), fps: poseStatus.fps }); resolve(); };
    hud.onclick = (e) => { const a = e.target.closest('[data-act]'); if (!a) return; if (a.dataset.act === 'start-anyway') end('manual'); if (a.dataset.act === 'switch-cam') switchCamera(); };
    stopLoop = frameLoop(video, (lm) => {
      drawSkeleton(lm);
      const c = framingCheck(lm);
      head.classList.toggle('ok', c.head); feet.classList.toggle('ok', c.feet);
      msg.textContent = c.ok ? T.cam.frameOk : !c.body ? T.cam.frameNoBody : !c.head ? T.cam.frameNoHead : T.cam.frameNoFeet;
      const now = performance.now();
      if (c.ok) { okSince = okSince ?? now; if (now - okSince > 1000) end('auto'); } else okSince = null;
      if (now - t0 > 8000) $('[data-act=start-anyway]', hud).hidden = false;
    });
  });
}

function introSheet(p, i, n, btnHtml) {
  const ex = CONFIG.exercises[p.key], tx = T.ex[p.key];
  const note = p.key === 'plank' ? T.cam.floorNote : ex.facing === 'side' ? T.cam.sideNote : T.cam.frontNote;
  return `<div class="sheet"><span class="tag">${esc(T.cam.exOf(i + 1, n))}</span><h2>${esc(tx.task(p.target))}</h2>
    <video class="panda" playsinline muted loop autoplay preload="auto" poster="${CONFIG.mediaBase + ex.poster}" src="${CONFIG.mediaBase + ex.video}"></video>
    <p>${esc(tx.how)}</p><p class="note">↻ ${esc(note)}</p>${btnHtml}</div>`;
}

// Короткое видео с пандой и голос студии перед упражнением
function intro(p, i, n) {
  return new Promise((resolve) => {
    hud.innerHTML = introSheet(p, i, n, `<button class="btn" data-act="go">${esc(T.cam.go)}</button><button class="btn ghost" data-act="skip-ex">${esc(T.cam.skipEx)}</button>`);
    const ex = CONFIG.exercises[p.key];
    preloadClips(Object.keys(T.hints).map((h) => 'hint_' + h));
    say(ex.intro);
    const pv = $('video.panda', hud); pv.play().catch(() => {});
    pv.onerror = () => { pv.style.display = 'none'; }; // нет сети до видео — остаются текст и голос
    let ended = false;
    const end = (v) => { if (ended) return; ended = true; clearTimeout(timer); resolve(v); };
    const timer = setTimeout(() => end('go'), 12000); // руки заняты телефоном — стартуем сами
    hud.onclick = (e) => { const a = e.target.closest('[data-act]'); if (!a) return; if (a.dataset.act === 'go') end('go'); if (a.dataset.act === 'skip-ex') end('skip'); };
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

function runHud(p, i, n, isSeconds) {
  hud.innerHTML = `${topBar(`${T.cam.exOf(i + 1, n)} · ${exName(p.key)}`, { skip: true, switchBtn: false })}
    <div class="count"><div class="num" data-el="num">0</div><div class="of">${esc(isSeconds ? T.cam.secs(p.target) : T.cam.reps(p.target))}</div></div>
    <div class="hint" data-el="hint"></div><div class="timebar"><i data-el="bar"></i></div>`;
  return { num: $('[data-el=num]', hud), hint: $('[data-el=hint]', hud), bar: $('[data-el=bar]', hud) };
}

async function liveExercise(p, i, n) {
  track('exercise_intro', { key: p.key, i });
  const how = await intro(p, i, n);
  if (!alive) return null;
  if (how === 'skip') { const r = skipped(p); track('exercise_done', { key: p.key, skipped: true }); return r; }
  await countdown();
  if (!alive) return null;
  return new Promise((resolve) => {
    let ui, hintTimer = 0, lostSince = null;
    const run = createRun({
      key: p.key, target: p.target, capSec: p.capSec, ageGroup: state.quiz.age || '7-9',
      aspect: video.videoWidth && video.videoHeight ? video.videoWidth / video.videoHeight : null,
      clock: () => performance.now(),
      on: {
        count: (c) => { ui.num.textContent = c; ui.num.classList.remove('pop'); void ui.num.offsetWidth; ui.num.classList.add('pop'); if (c <= 30) say('count_' + c); },
        hint: (id) => { const text = T.hints[id]; if (!text) return; ui.hint.textContent = text; clearTimeout(hintTimer); hintTimer = setTimeout(() => { ui.hint.textContent = ''; }, 2500); say('hint_' + id, { interrupt: false }); },
        tick: ({ left }) => { ui.bar.style.width = `${Math.max(0, (left / p.capSec) * 100)}%`; },
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
      drawSkeleton(lm);
      if (!lm) { lostSince = lostSince ?? performance.now(); if (performance.now() - lostSince > 1500 && !ui.hint.textContent) ui.hint.textContent = T.cam.lost; }
      else if (lostSince) { lostSince = null; if (ui.hint.textContent === T.cam.lost) ui.hint.textContent = ''; }
      run.frame(lm);
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
  } else if (env.inApp && env.platform === 'ios') {
    head = `<h1 class="rtitle">${esc(kind === 'denied' ? B.deniedTitle : B.openSafariTitle)}</h1><p>${esc(kind === 'denied' ? B.deniedLead : B.openSafariLead)}</p>`;
    body = `${kind === 'denied' ? steps(B.howIosInApp) + retry : ''}<a class="btn ${kind === 'denied' ? 'line' : ''}" data-act="open-safari" href="${esc(safariUrl(link))}">${esc(B.openSafari)}</a><p class="small muted center">${esc(B.openManual)}</p><button class="btn ghost" data-act="copy">${esc(B.copyLink)}</button>${fb}`;
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
      const pv = $('video.panda', hud); pv.play().catch(() => {}); pv.onerror = () => { pv.style.display = 'none'; };
      $('[data-el=file]', hud).onchange = (e) => { const f = e.target.files && e.target.files[0]; if (f) analyze(f); };
    };
    hud.onclick = (e) => { const a = e.target.closest('[data-act]'); if (a && a.dataset.act === 'skip-ex') { track('exercise_done', { key: p.key, skipped: true, mode: 'file' }); resolve(skipped(p)); } };
    track('exercise_intro', { key: p.key, i, mode: 'file' });
    render();

    async function analyze(file) {
      track('exercise_start', { key: p.key, target: p.target, mode: 'file', mb: Math.round(file.size / 1e5) / 10 });
      const url = URL.createObjectURL(file); // локальная ссылка на файл в памяти телефона; никуда не отправляется
      video.srcObject = null; video.src = url; video.muted = true; video.loop = false;
      hud.innerHTML = `${topBar(`${T.cam.exOf(i + 1, n)} · ${exName(p.key)}`, { switchBtn: false })}<div class="count"><div class="num" data-el="num">0</div><div class="of">${esc(F.analyzing)}</div></div><div class="timebar"><i data-el="bar" style="width:0"></i></div>`;
      const num = $('[data-el=num]', hud), bar = $('[data-el=bar]', hud);
      const cleanup = () => { if (stopLoop) { stopLoop(); stopLoop = null; } video.onended = null; video.onerror = null; try { video.pause(); } catch { /* уже остановлено */ } video.removeAttribute('src'); video.load(); URL.revokeObjectURL(url); drawSkeleton(null); };
      const fail = () => { cleanup(); track('fallback_failed', { key: p.key }); render(F.failed); };
      try {
        await new Promise((res, rej) => { video.onloadedmetadata = res; video.onerror = rej; setTimeout(rej, 15000); });
      } catch { return fail(); }
      const dur = Number.isFinite(video.duration) ? video.duration : CONFIG.fallbackMaxSec;
      const run = createRun({
        key: p.key, target: p.target, capSec: Math.min(CONFIG.fallbackMaxSec, dur + 1), ageGroup: state.quiz.age || '7-9',
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
      stopLoop = frameLoop(video, (lm) => { drawSkeleton(lm); run.frame(lm); });
      video.play().catch(() => fail());
    }
  });
}

export function leaveStage() { unmount(); }
