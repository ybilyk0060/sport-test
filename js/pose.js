// Распознавание позы в браузере: @mediapipe/tasks-vision, Pose Landmarker (lite).
// Модель и wasm лежат на нашем адресе (vendor/mediapipe). Кадры обрабатываются на устройстве и никуда не уходят.

import { createPersonLock } from './personlock.js?v=e9c53be-mwz656hs';
import { CONFIG } from './config.js?v=e9c53be-mwz656hs';

export const poseStatus = { state: 'idle', delegate: null, error: null, loadMs: null, fps: 0, frames: 0 };
let landmarker = null;
let loading = null;
let vision = null;
let fileset = null;
let lastTs = 0;

const abs = (p) => new URL(p, document.baseURI).href;

async function create(delegate) {
  return vision.PoseLandmarker.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: abs(CONFIG.modelPath), delegate },
    runningMode: 'VIDEO',
    // до двух человек: второй в кадре не сбивает счёт (js/personlock.js закрепляется за своим) — Юрий 27.11
    numPoses: CONFIG.numPoses || 1,
    // 0,5: при 0,4 на iPhone модель дольше держалась за «мусорную» позу (прогон 27.11, провалы по 2–6 с) — вернули
    minPoseDetectionConfidence: 0.5,
    minPosePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });
}

async function load() {
  poseStatus.state = 'loading';
  const t0 = performance.now();
  try {
    vision = await import('../vendor/mediapipe/vision_bundle.mjs');
    fileset = await vision.FilesetResolver.forVisionTasks(abs(CONFIG.wasmPath));
    try { landmarker = await create('GPU'); poseStatus.delegate = 'GPU'; }
    catch (e) { landmarker = await create('CPU'); poseStatus.delegate = 'CPU'; }
    // Прогрев: первый кадр на GPU компилирует шейдеры (на iPhone — секунды). Делаем это заранее, на пустом холсте,
    // пока родитель отвечает на вопросы, а не в момент, когда ребёнок уже стоит перед камерой.
    try { const c = document.createElement('canvas'); c.width = 64; c.height = 64; c.getContext('2d').fillRect(0, 0, 64, 64); landmarker.detectForVideo(c, (lastTs = performance.now())); } catch { /* не критично */ }
    poseStatus.state = 'ready';
    poseStatus.loadMs = Math.round(performance.now() - t0);
  } catch (e) {
    poseStatus.state = 'error';
    poseStatus.error = String(e && e.message ? e.message : e);
    loading = null;
    throw e;
  }
}

// Только скачать файлы модели в кэш браузера, ничего не компилируя (Юрий 25.11: в Messenger/TikTok интерфейс замирал
// на 10–16 с, пока на главном потоке компилировался wasm и шейдеры GPU). Компиляция — по нажатию «Включить камеру»,
// под системным вопросом о камере и индикатором загрузки.
let prefetching = null;
export function prefetchPose() {
  if (prefetching || loading) return prefetching;
  const files = [CONFIG.modelPath, 'vendor/mediapipe/vision_bundle.mjs', `${CONFIG.wasmPath}/vision_wasm_internal.js`, `${CONFIG.wasmPath}/vision_wasm_internal.wasm`];
  prefetching = (async () => {
    for (const f of files) {
      try { const r = await fetch(abs(f), { priority: 'low' }); if (r.ok) await r.arrayBuffer(); } catch { /* сеть — догрузится при камере */ }
    }
  })();
  return prefetching;
}

// Полная загрузка и прогрев: только когда камера уже запрашивается (stage.js) или в отладке.
export function preloadPose() {
  if (!loading) loading = load();
  return loading;
}

let fpsT = 0, fpsN = 0;
const personLock = createPersonLock();
// ?lock=1 в адресе включает закрепление за человеком для проверки на телефоне (по умолчанию — CONFIG.personLock)
let lockOn = !!CONFIG.personLock;
try { const q = new URLSearchParams(location.search).get('lock'); if (q === '1') sessionStorage.setItem('sporttest.lock', '1'); if (q === '0') sessionStorage.removeItem('sporttest.lock'); if (sessionStorage.getItem('sporttest.lock')) lockOn = true; } catch { /* нет */ }
export const diag = { frames: 0, noPose: 0, lockDrop: 0, errors: 0, lastError: '' };
try { window.__poseDiag = () => ({ ...diag, lockOn, delegate: poseStatus.delegate, fps: poseStatus.fps, ms: Math.round(poseStatus.ms || 0) }); } catch { /* нет окна (тесты) */ }
export const resetPersonLock = (floor = false) => personLock.reset(floor);
// Возвращает массив из 33 точек {x,y,z,visibility} или null. Точки нигде не сохраняются.
export function detectPose(video) {
  if (!landmarker || !video.videoWidth) return null;
  let ts = performance.now();
  if (ts <= lastTs) ts = lastTs + 1;
  lastTs = ts;
  let res;
  const t0 = performance.now();
  try { res = landmarker.detectForVideo(video, ts); poseStatus.ms = poseStatus.ms ? poseStatus.ms * 0.9 + (performance.now() - t0) * 0.1 : performance.now() - t0; }
  catch (e) {
    diag.errors++; diag.lastError = String(e && e.message ? e.message : e).slice(0, 120);
    // Сбой GPU на отдельных телефонах: один раз пересоздаём на CPU.
    if (poseStatus.delegate === 'GPU') {
      poseStatus.delegate = 'CPU (после сбоя GPU)';
      const old = landmarker; landmarker = null;
      create('CPU').then((lm) => { landmarker = lm; try { old.close(); } catch { /* уже закрыт */ } }).catch((err) => { poseStatus.state = 'error'; poseStatus.error = String(err); });
    } else { poseStatus.error = String(e && e.message ? e.message : e); }
    return null;
  }
  poseStatus.frames++;
  fpsN++;
  if (ts - fpsT >= 1000) { poseStatus.fps = Math.round((fpsN * 1000) / (ts - fpsT)); fpsT = ts; fpsN = 0; }
  const poses = (res && res.landmarks ? res.landmarks : []).filter((l) => l && l.length);
  poseStatus.people = poses.length;
  // Закрепление за «своим» выключено (CONFIG.personLock): на iPhone 27.11 в прогоне появились провалы позы по 2–6 с,
  // которых не было ни в одном прогоне до него. Пока не разобрано на телефоне — берём позу модели как раньше.
  const out = lockOn ? personLock.pick(poses, ts) : (poses[0] || null);
  // Диагностика провалов позы (прогон 27.11): сколько кадров модель никого не нашла и сколько отбросило закрепление
  diag.frames++; if (!poses.length) diag.noPose++; else if (!out) diag.lockDrop++;
  return out;
}
