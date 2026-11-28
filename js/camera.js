// Камера: по умолчанию задняя (родитель держит или ставит телефон), переключение на переднюю.
// Поток идёт только в <video> на странице. Запись не ведётся, ничего не отправляется.

export const camStatus = { state: 'idle', facing: null, label: null, width: 0, height: 0, fps: null, error: null, errorName: null, permission: null };
let stream = null;

export function classifyError(e) {
  const n = e && e.name;
  if (n === 'NotAllowedError' || n === 'PermissionDeniedError' || n === 'SecurityError') return 'denied';
  if (n === 'NotFoundError' || n === 'DevicesNotFoundError' || n === 'OverconstrainedError') return 'notfound';
  if (n === 'NotReadableError' || n === 'TrackStartError' || n === 'AbortError') return 'busy';
  return 'unsupported';
}

export async function queryPermission() {
  try {
    const p = await navigator.permissions.query({ name: 'camera' });
    camStatus.permission = p.state;
  } catch { camStatus.permission = 'unknown'; }
  return camStatus.permission;
}

export function stopCamera() {
  if (stream) { for (const t of stream.getTracks()) t.stop(); stream = null; }
  if (camStatus.state === 'open') camStatus.state = 'closed';
}

export async function openCamera(video, facing = 'environment') {
  stopCamera();
  camStatus.state = 'requesting'; camStatus.error = null; camStatus.errorName = null;
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    camStatus.state = 'error'; camStatus.error = 'unsupported'; camStatus.errorName = 'NoMediaDevices';
    const err = new Error('getUserMedia недоступен'); err.kind = 'unsupported'; throw err;
  }
  // 960×540: быстрее открывается и распознаётся, для позы хватает. Во встроенных браузерах приложений (Messenger, Instagram)
  // ресурсов меньше — 640×360: модель всё равно уменьшает кадр, а подсчёт меньше подвисает (Юрий 25.11).
  const inApp = /Instagram|FBAN|FBAV|FB_IAB|FBIOS|FB4A|Messenger|musical_ly|BytedanceWebview|Telegram|Viber/i.test(navigator.userAgent || '');
  const base = inApp ? { width: { ideal: 640 }, height: { ideal: 360 }, frameRate: { ideal: 30 } } : { width: { ideal: 960 }, height: { ideal: 540 }, frameRate: { ideal: 30 } };
  const tries = [{ ...base, facingMode: { ideal: facing } }, { facingMode: facing }, true];
  let lastErr = null;
  for (const v of tries) {
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: v }); break; }
    catch (e) { lastErr = e; if (classifyError(e) === 'denied') break; }
  }
  if (!stream) {
    camStatus.state = 'error'; camStatus.error = classifyError(lastErr); camStatus.errorName = (lastErr && lastErr.name) || 'Error';
    lastErr.kind = camStatus.error; throw lastErr;
  }
  video.srcObject = stream;
  video.setAttribute('playsinline', ''); video.muted = true;
  await video.play().catch(() => {});
  const track = stream.getVideoTracks()[0];
  const s = track.getSettings ? track.getSettings() : {};
  camStatus.state = 'open';
  camStatus.facing = s.facingMode || facing;
  camStatus.label = track.label || '';
  camStatus.width = s.width || video.videoWidth; camStatus.height = s.height || video.videoHeight;
  camStatus.fps = s.frameRate ? Math.round(s.frameRate) : null;
  queryPermission();
  return camStatus;
}

// Экран не гаснет: Wake Lock, с повторным запросом при возврате на вкладку.
let wake = null;
export async function keepAwake(on) {
  try {
    if (on) {
      if ('wakeLock' in navigator && !wake) {
        wake = await navigator.wakeLock.request('screen');
        wake.addEventListener('release', () => { wake = null; });
      }
    } else if (wake) { await wake.release(); wake = null; }
  } catch { /* нет поддержки — экран держит включённым играющее видео камеры */ }
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && camStatus.state === 'open') keepAwake(true); });
