import { analyze, recommend, overallIndex, QUALITY_NAMES, bodyVisible, fullBodyVisible } from './analyze.js';

// ===== Налаштування =====
const PAY_FN = 'https://iiafijcmajkitvtktntk.supabase.co/functions/v1/sport-test-pay';
const RECORD_SEC = 30;
const PLAN = [ // підказки під час запису
  { from: 0, to: 8, text: 'Стрибки на місці — як можна вище!' },
  { from: 8, to: 15, text: 'Присідання — глибоко, 5 разів' },
  { from: 15, to: 22, text: 'Руки вгору-вниз, стрибки «зірочка»' },
  { from: 22, to: 30, text: 'Стоїмо на одній нозі і не падаємо' },
];

const QUIZ = [
  { id: 'age', title: 'Скільки років дитині?', opts: { '4-6': '4–6 років', '7-9': '7–9 років', '10-12': '10–12 років' } },
  { id: 'likes', title: 'Що дитині подобається найбільше?', opts: { team: 'Команда і м’яч', solo: 'Сама по собі, свій результат', music: 'Музика і танці', fight: 'Боротьба і сила', climb: 'Лазити і стрибати' } },
  { id: 'temper', title: 'Яка дитина за характером?', opts: { active: 'Дуже активна, не всидить', calm: 'Спокійна, зосереджена', mixed: 'Буває по-різному' } },
  { id: 'goal', title: 'Чого ви хочете від спорту?', opts: { health: 'Здоров’я і постава', discipline: 'Дисципліна', confidence: 'Впевненість у собі', result: 'Спортивний результат' } },
  { id: 'now', title: 'Чим дитина займається зараз?', opts: { none: 'Поки нічим', section: 'Ходить у секцію', yard: 'Двір та рухливі ігри' } },
];

// ===== Стан (на пристрої) =====
const KEY = 'sporttest.v2';
const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch { return null; } };
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { /* приватний режим */ } };
const fresh = () => ({ sid: 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7), step: 'landing', quiz: {}, qi: 0, result: null, paid: false, orderRef: null });
let S = load() || fresh();

const $app = document.getElementById('app');
const h = (html) => { $app.innerHTML = html; window.scrollTo(0, 0); };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const go = (step) => { S.step = step; save(); render(); };

document.getElementById('restart').onclick = (e) => { e.preventDefault(); stopCamera(); S = fresh(); save(); history.replaceState(null, '', location.pathname); render(); };

// ===== Екрани =====
function render() {
  const screens = { landing, quiz, howto, capture, analyzing, teaser, paycheck, full };
  (screens[S.step] || landing)();
}

function landing() {
  h(`<h1>Який спорт підійде вашій дитині?</h1>
  <p class="muted">Руховий профіль за 3 хвилини: короткий тест і 30 секунд руху перед камерою. Штучний інтелект (MediaPipe) аналізує стрибок, гнучкість, координацію, баланс і витривалість.</p>
  <div class="card"><ul class="ticks">
    <li>5 простих запитань</li><li>30 секунд руху: запис з камери або готове відео</li>
    <li>Профіль з 5 якостей і 3 види спорту, з яких варто почати</li>
    <li>Відео не залишає телефон: аналіз прямо в браузері</li></ul></div>
  <button class="btn" id="go">Почати тест</button>
  <p class="muted" style="font-size:14px">Потрібно: телефон, 2×2 метри вільного місця, дитину видно на весь зріст.</p>`);
  document.getElementById('go').onclick = () => { S.qi = 0; go('quiz'); };
}

function quiz() {
  const q = QUIZ[S.qi];
  h(`<div class="muted">Запитання ${S.qi + 1} з ${QUIZ.length}</div>
  <div class="progress"><i style="width:${(S.qi / QUIZ.length) * 100}%"></i></div>
  <h2>${q.title}</h2><div class="opts">${Object.entries(q.opts).map(([k, v]) =>
    `<button class="opt ${S.quiz[q.id] === k ? 'sel' : ''}" data-k="${k}">${v}</button>`).join('')}</div>
  ${S.qi > 0 ? '<button class="btn ghost small" id="back">Назад</button>' : ''}`);
  $app.querySelectorAll('.opt').forEach((b) => b.onclick = () => {
    S.quiz[q.id] = b.dataset.k;
    if (S.qi < QUIZ.length - 1) { S.qi++; save(); quiz(); } else go('howto');
  });
  const back = document.getElementById('back'); if (back) back.onclick = () => { S.qi--; save(); quiz(); };
}

function howto() {
  h(`<h2>Тепер 30 секунд руху</h2>
  <div class="card"><b>Як знімати</b><ul class="ticks">
    <li>Телефон на рівні пояса, 2–3 метри від дитини</li>
    <li>Дитину видно повністю: від голови до ступнів</li>
    <li>Добре світло, без людей позаду</li></ul>
  <b>Що робити (підказки будуть на екрані)</b><ul class="ticks">
    ${PLAN.map((p) => `<li>${p.from}–${p.to} с: ${p.text}</li>`).join('')}</ul></div>
  <button class="btn" id="cam">Записати з камери</button>
  <label class="btn ghost" for="file">Завантажити готове відео</label>
  <input type="file" id="file" accept="video/*">
  <p class="muted" style="font-size:14px">Готове відео: 15–60 секунд, дитина рухається (стрибки, присідання, стоїть на одній нозі).</p>`);
  getLandmarker().catch(() => {});
  document.getElementById('cam').onclick = () => { capMode = { kind: 'camera' }; go('capture'); };
  document.getElementById('file').onchange = (e) => { const f = e.target.files[0]; if (f) { capMode = { kind: 'file', file: f }; go('capture'); } };
}

// ===== MediaPipe =====
let landmarker = null, landmarkerPromise = null, lastTs = -1;
function getLandmarker() {
  if (landmarker) return Promise.resolve(landmarker);
  if (!landmarkerPromise) landmarkerPromise = (async () => {
    const { FilesetResolver, PoseLandmarker } = await import('./vendor/mediapipe/vision_bundle.mjs');
    const fs = await FilesetResolver.forVisionTasks(new URL('./vendor/mediapipe/wasm', location.href).href);
    const opts = (delegate) => ({ baseOptions: { modelAssetPath: new URL('./vendor/mediapipe/pose_landmarker_lite.task', location.href).href, delegate },
      runningMode: 'VIDEO', numPoses: 1, minPoseDetectionConfidence: 0.5, minPosePresenceConfidence: 0.5, minTrackingConfidence: 0.5 });
    try { landmarker = await PoseLandmarker.createFromOptions(fs, opts('GPU')); }
    catch { landmarker = await PoseLandmarker.createFromOptions(fs, opts('CPU')); }
    return landmarker;
  })();
  return landmarkerPromise;
}

const BONES = [[11, 12], [11, 13], [13, 15], [12, 14], [14, 16], [11, 23], [12, 24], [23, 24], [23, 25], [25, 27], [24, 26], [26, 28]];
function draw(ctx, lm, w, hgt) {
  ctx.clearRect(0, 0, w, hgt);
  if (!lm) return;
  ctx.lineWidth = Math.max(3, w / 160); ctx.strokeStyle = '#2dd4bf'; ctx.fillStyle = '#fff';
  for (const [a, b] of BONES) { if ((lm[a].visibility ?? 1) < .4 || (lm[b].visibility ?? 1) < .4) continue; ctx.beginPath(); ctx.moveTo(lm[a].x * w, lm[a].y * hgt); ctx.lineTo(lm[b].x * w, lm[b].y * hgt); ctx.stroke(); }
  for (const i of [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28]) { if ((lm[i].visibility ?? 1) < .4) continue; ctx.beginPath(); ctx.arc(lm[i].x * w, lm[i].y * hgt, ctx.lineWidth * 1.3, 0, 7); ctx.fill(); }
}

// ===== Запис / обробка =====
let capMode = null, stream = null, rafId = 0;
function stopCamera() { cancelAnimationFrame(rafId); if (stream) stream.getTracks().forEach((t) => t.stop()); stream = null; }

async function capture() {
  if (!capMode) return go('howto');
  const isCam = capMode.kind === 'camera';
  h(`<div class="stage"><video id="v" playsinline muted></video><canvas id="c"></canvas>
    <div class="overlay" id="top">Завантажуємо модель руху…</div><div class="overlay bottom" id="bot"></div></div>
    ${isCam ? `<div class="row"><button class="btn" id="start" disabled>Старт</button><button class="btn ghost" id="flip">Інша камера</button></div>` : ''}
    <button class="btn ghost small" id="cancel">Назад</button><p class="err" id="err"></p>`);
  const v = document.getElementById('v'), c = document.getElementById('c'), ctx = c.getContext('2d');
  const top = document.getElementById('top'), bot = document.getElementById('bot'), err = document.getElementById('err');
  document.getElementById('cancel').onclick = () => { stopCamera(); go('howto'); };
  let facing = capMode.facing || 'environment';

  let lmk;
  try { lmk = await getLandmarker(); } catch (e) { top.textContent = ''; err.textContent = 'Не вдалося завантажити модель. Оновіть сторінку або відкрийте в Chrome/Safari.'; return; }

  const detect = (ts) => { const t = Math.max(ts, lastTs + 1); lastTs = t; const r = lmk.detectForVideo(v, t); return r.landmarks && r.landmarks[0] ? r.landmarks[0] : null; };
  const fit = () => { c.width = v.videoWidth || 480; c.height = v.videoHeight || 640; };

  if (isCam) {
    const startCam = async () => {
      stopCamera();
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing, width: { ideal: 640 }, height: { ideal: 480 } }, audio: false });
      } catch (e) { err.textContent = 'Немає доступу до камери. Дозвольте камеру в налаштуваннях браузера або завантажте готове відео.'; return; }
      v.srcObject = stream; await v.play(); fit();
      v.classList.toggle('mirror', facing === 'user'); c.classList.toggle('mirror', facing === 'user');
      preview();
    };
    let recording = false, frames = [], t0 = 0, okSince = 0;
    const preview = () => {
      const loop = () => {
        if (!stream) return;
        if (v.readyState >= 2) {
          const now = performance.now(); const lm = detect(now); draw(ctx, lm, c.width, c.height);
          if (recording) {
            const el = (now - t0) / 1000;
            frames.push({ t: now, lm: lm ? lm.map((p) => ({ x: p.x, y: p.y, visibility: p.visibility })) : null });
            const step = PLAN.find((p) => el >= p.from && el < p.to);
            top.innerHTML = `<span class="big">${Math.max(0, Math.ceil(RECORD_SEC - el))}</span>`; bot.textContent = step ? step.text : '';
            if (el >= RECORD_SEC) { recording = false; stopCamera(); return finish(frames); }
          } else {
            const full = fullBodyVisible(lm);
            if (full) { okSince = okSince || now; } else okSince = 0;
            top.textContent = full ? 'Дитину видно повністю ✓' : (bodyVisible(lm) ? 'Відійдіть далі: має бути видно ступні' : 'Наведіть камеру на дитину на весь зріст');
            document.getElementById('start').disabled = false;
          }
        }
        rafId = requestAnimationFrame(loop);
      };
      rafId = requestAnimationFrame(loop);
    };
    document.getElementById('flip').onclick = () => { facing = facing === 'user' ? 'environment' : 'user'; capMode.facing = facing; startCam(); };
    document.getElementById('start').onclick = async (e) => {
      e.target.disabled = true; document.getElementById('flip').disabled = true;
      for (let i = 3; i > 0; i--) { bot.textContent = 'Приготуйтесь…'; top.innerHTML = `<span class="big">${i}</span>`; await new Promise((r) => setTimeout(r, 1000)); }
      frames = []; t0 = performance.now(); recording = true;
    };
    startCam();
  } else {
    v.src = URL.createObjectURL(capMode.file);
    v.muted = true; v.playsInline = true;
    await new Promise((r) => { v.onloadedmetadata = r; v.onerror = r; });
    if (!v.videoWidth) { err.textContent = 'Не вдалося відкрити відео. Спробуйте інший файл (MP4 або MOV).'; return; }
    fit();
    const frames = []; const maxSec = Math.min(v.duration || 60, 60);
    top.textContent = 'Аналізуємо відео…';
    const onFrame = () => {
      if (v.ended || v.currentTime >= maxSec) { v.pause(); return finish(frames); }
      const ms = v.currentTime * 1000; const lm = detect(ms); draw(ctx, lm, c.width, c.height);
      frames.push({ t: ms, lm: lm ? lm.map((p) => ({ x: p.x, y: p.y, visibility: p.visibility })) : null });
      bot.textContent = `${Math.round((v.currentTime / maxSec) * 100)}%`;
      schedule();
    };
    const schedule = () => v.requestVideoFrameCallback ? v.requestVideoFrameCallback(onFrame) : (rafId = requestAnimationFrame(onFrame));
    v.onended = () => finish(frames);
    schedule(); try { await v.play(); } catch { err.textContent = 'Натисніть на відео, щоб почати аналіз.'; v.onclick = () => v.play(); }
  }
}

let finished = false;
function finish(frames) {
  if (finished) return; finished = true; setTimeout(() => { finished = false; }, 1000);
  go('analyzing');
  setTimeout(() => {
    const r = analyze(frames, S.quiz.age);
    if (!r.ok || r.coverage < 0.35) {
      S.step = 'howto'; save();
      howto();
      $app.insertAdjacentHTML('afterbegin', `<div class="card err">Не вдалося розгледіти рух (дитину видно в ${Math.round((r.coverage || 0) * 100)}% кадрів). Станьте далі від камери, щоб було видно всю дитину, і повторіть.</div>`);
      return;
    }
    S.result = { ...r, sports: recommend(r.scores, S.quiz).slice(0, 3).map((s) => ({ name: s.name, fit: s.fit, best: s.best })), index: overallIndex(r.scores) };
    S.paid = false; go('teaser');
  }, 900);
}

function analyzing() { h(`<h2>Рахуємо руховий профіль…</h2><div class="spinner"></div><p class="muted" style="text-align:center">Стрибок, гнучкість, координація, баланс і витривалість</p>`); }

function bars(scores) {
  return Object.entries(scores).sort((a, b) => b[1] - a[1]).map(([k, v]) =>
    `<div class="bar"><b>${QUALITY_NAMES[k]}</b><div class="track"><i style="width:${v}%"></i></div><span>${v}</span></div>`).join('');
}

let price = 210, payMode = null;
async function teaser() {
  const r = S.result; if (!r) return go('landing');
  const [topK, topV] = Object.entries(r.scores).sort((a, b) => b[1] - a[1])[0];
  h(`<h2>Руховий профіль готовий</h2>
  <div class="card" style="text-align:center"><div class="muted">Руховий індекс</div><div class="big" style="color:var(--brand)">${r.index}</div>
  <div>Найсильніша якість: <b>${QUALITY_NAMES[topK]}</b> (${topV}/100)</div></div>
  <div class="card lock"><div class="blur">${bars(r.scores)}<div class="sport"><b>██████████</b><span class="pct">9█%</span></div><div class="sport"><b>████████</b><span class="pct">8█%</span></div></div>
  <div class="lockmsg">🔒 Повний профіль і 3 види спорту</div></div>
  <div class="card"><b>У повному результаті</b><ul class="ticks">
    <li>Оцінка 5 якостей руху з поясненням</li><li>3 види спорту з відсотком відповідності</li>
    <li>Що розвивати в першу чергу і як почати</li></ul>
    <div style="text-align:center"><div class="price" id="price">${price} грн</div><div class="muted">разовий платіж</div></div>
    <button class="btn" id="pay">Відкрити результат</button><p class="err" id="perr"></p>
    <p class="muted" style="font-size:13px">Оплата на захищеній сторінці WayForPay: картка, Apple Pay, Google Pay.</p></div>`);
  document.getElementById('pay').onclick = startPay;
  try { const m = await fetch(PAY_FN).then((x) => x.json()); payMode = m.mode; document.getElementById('testbar').hidden = m.mode !== 'test'; } catch { /* офлайн */ }
}

async function startPay(e) {
  const btn = e.target, perr = document.getElementById('perr'); btn.disabled = true; btn.textContent = 'Відкриваємо оплату…'; perr.textContent = '';
  try {
    const ret = location.origin + location.pathname;
    const r = await fetch(PAY_FN, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'create', sid: S.sid, returnTo: ret }) }).then((x) => x.json());
    if (!r.payUrl) throw new Error(r.error || 'no payUrl');
    S.orderRef = r.orderRef; save();
    const f = document.createElement('form'); f.method = 'POST'; f.action = r.payUrl; f.acceptCharset = 'utf-8';
    for (const [k, v] of Object.entries(r.fields)) { const i = document.createElement('input'); i.type = 'hidden'; i.name = k; i.value = v; f.appendChild(i); }
    document.body.appendChild(f); f.submit();
  } catch (x) { btn.disabled = false; btn.textContent = 'Відкрити результат'; perr.textContent = 'Не вдалося відкрити оплату. Перевірте інтернет і спробуйте ще раз.'; }
}

async function paycheck() {
  h(`<h2>Перевіряємо оплату…</h2><div class="spinner"></div>`);
  const order = S.orderRef;
  for (let i = 0; i < 8 && order; i++) {
    try {
      const r = await fetch(PAY_FN, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'status', orderRef: order }) }).then((x) => x.json());
      if (r.paid) { S.paid = true; return go('full'); }
    } catch { /* повтор */ }
    await new Promise((r) => setTimeout(r, 2000));
  }
  S.step = 'teaser'; save(); await teaser();
  $app.insertAdjacentHTML('afterbegin', '<div class="card err">Оплату не підтверджено. Якщо гроші списано — оновіть сторінку за хвилину; інакше спробуйте ще раз.</div>');
}

const ADVICE = {
  power: 'Стрибки через скакалку, ігри з м’ячем, вистрибування — 2–3 рази на тиждень.',
  endurance: 'Рухливі ігри 30+ хвилин щодня, велосипед, плавання.',
  flexibility: 'Розтяжка 10 хвилин після руху: нахили, «метелик», місток для старших.',
  coordination: 'Ігри з м’ячем, танцювальні рухи під музику, «класики».',
  balance: 'Стояння на одній нозі з закритими очима, ходьба по бордюру, балансир.',
};

function full() {
  const r = S.result; if (!r || !S.paid) return go(r ? 'teaser' : 'landing');
  const sorted = Object.entries(r.scores).sort((a, b) => b[1] - a[1]);
  const weak = sorted.slice(-2).map(([k]) => k);
  h(`<h2>Повний руховий профіль</h2>
  <div class="card" style="text-align:center"><div class="muted">Руховий індекс</div><div class="big" style="color:var(--brand)">${r.index}</div></div>
  <div class="card"><b>5 якостей руху</b>${bars(r.scores)}
    <p class="muted" style="font-size:13px">Оцінка порівняно з дітьми того ж віку (${esc(S.quiz.age || '')} р.), за ${Math.round(r.durationSec)} с руху. Це орієнтир для вибору секції, не медичний висновок.</p></div>
  <div class="card"><b>З чого почати</b>${r.sports.map((s, i) => `<div class="sport"><div><b>${i + 1}. ${s.name}</b><div class="muted" style="font-size:14px">Опора: ${s.best.slice(0, 2).map((k) => QUALITY_NAMES[k].toLowerCase()).join(', ')}</div></div><span class="pct">${s.fit}%</span></div>`).join('')}</div>
  <div class="card"><b>Що розвивати</b>${weak.map((k) => `<p><b>${QUALITY_NAMES[k]}.</b> ${ADVICE[k]}</p>`).join('')}
    <p class="muted" style="font-size:14px">Порада: сходіть на 2 пробні заняття з першого списку і повторіть тест через 3 місяці, щоб побачити прогрес.</p></div>
  <button class="btn ghost" id="again">Пройти тест ще раз</button>`);
  document.getElementById('again').onclick = () => { S = fresh(); save(); render(); };
}

// ===== Повернення з оплати =====
const qp = new URLSearchParams(location.search);
if (qp.get('pay') === 'check') {
  if (qp.get('order')) S.orderRef = qp.get('order');
  S.step = 'paycheck'; save(); history.replaceState(null, '', location.pathname);
}
if (S.step === 'capture' || S.step === 'analyzing') S.step = 'howto';
render();
if (S.step !== 'landing') getLandmarker().catch(() => {}); // прогріваємо модель заздалегідь
