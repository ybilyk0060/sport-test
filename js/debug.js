// Страница ?debug=1: что определилось на этом телефоне. Владелец присылает её снимок.
// Подписи здесь служебные (для владельца), поэтому не в файле переводов.

import { detectEnv } from './env.js?v=747f322-mwxfyx5j';
import { camStatus, openCamera, queryPermission } from './camera.js?v=747f322-mwxfyx5j';
import { poseStatus, preloadPose, detectPose } from './pose.js?v=747f322-mwxfyx5j';
import { audioStatus } from './audio.js?v=747f322-mwxfyx5j';
import { CONFIG } from './config.js?v=747f322-mwxfyx5j';
import { state, store } from './store.js?v=747f322-mwxfyx5j';

export function initDebug({ paywallMode, restart, toast }) {
  if (new URLSearchParams(location.search).get('debug') !== '1') return;
  const env = detectEnv();
  const el = document.createElement('div'); el.className = 'dbg';
  document.body.appendChild(el);
  let min = false, test = null, lastErr = '';
  window.addEventListener('error', (e) => { lastErr = String(e.message || e.error); });
  window.addEventListener('unhandledrejection', (e) => { lastErr = String((e.reason && e.reason.message) || e.reason); });
  queryPermission();

  const yes = (v) => `<span class="${v ? 'good' : 'bad'}">${v ? 'так' : 'ні'}</span>`;
  const rows = () => [
    ['Браузер', `<b>${env.browser}</b> · ${env.platform} ${env.osVersion}${env.inApp ? ' · <span class="bad">вбудований</span>' : ''}`],
    ['HTTPS / API камери', `${yes(env.secure)} / ${yes(env.hasMediaDevices)}`],
    ['Дозвіл камери', camStatus.permission || '—'],
    ['Камера', `${camStatus.state}${camStatus.errorName ? ` <span class="bad">${camStatus.errorName} (${camStatus.error})</span>` : ''}`],
    ['Яка камера', camStatus.state === 'open' ? `${camStatus.facing || '?'} · ${camStatus.width}×${camStatus.height}${camStatus.fps ? ` · ${camStatus.fps} к/с` : ''}<br>${camStatus.label || ''}` : '—'],
    ['Модель пози', `${poseStatus.state}${poseStatus.delegate ? ` · ${poseStatus.delegate}` : ''}${poseStatus.loadMs ? ` · ${poseStatus.loadMs} мс` : ''}${poseStatus.error ? ` <span class="bad">${poseStatus.error}</span>` : ''}`],
    ['Кадрів за секунду', `<b class="${poseStatus.fps >= 15 ? 'good' : poseStatus.fps > 0 ? 'bad' : ''}">${poseStatus.fps || '—'}</b> (оброблено ${poseStatus.frames})`],
    ['Звук', audioStatus.state],
    ['Екран', `${innerWidth}×${innerHeight} · dpr ${devicePixelRatio}`],
    ['Крок / пейвол', `${state.step} · ${paywallMode} · ${JSON.stringify(CONFIG.subscription.prices)} · підписка: ${state.sub ? state.sub.status : '—'} · оплата: ${CONFIG.paymentProvider}`],
    ['Події', `${store.events().length} · останні: ${store.events().slice(-4).map((e) => e.name).join(', ')}`],
    ['Помилка', lastErr ? `<span class="bad">${lastErr}</span>` : '—'],
    ['UA', `<span style="word-break:break-all">${env.ua}</span>`],
  ];
  const draw = () => {
    if (min) { el.className = 'dbg min'; el.innerHTML = `<div data-d="min">▾ debug · ${env.browser}/${env.platform} · cam:${camStatus.state} · model:${poseStatus.state} · ${poseStatus.fps} к/с</div>`; return; }
    el.className = 'dbg';
    el.innerHTML = `<div data-d="min"><b>▴ ДІАГНОСТИКА</b> ${new Date().toLocaleTimeString()}</div><table>${rows().map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('')}</table>
      <div class="row"><button data-d="cam">Тест камери і моделі</button><button data-d="copy">Скопіювати звіт</button><button data-d="events">Скопіювати події</button><button data-d="reset">Скинути дані</button></div>
      <video data-d="v" playsinline muted style="width:96px;border-radius:6px;display:${test ? 'block' : 'none'}"></video>`;
    if (test) { const v = el.querySelector('video'); v.replaceWith(test.video); test.video.style.cssText = 'width:96px;border-radius:6px;display:block'; }
  };
  const copy = async (text) => { try { await navigator.clipboard.writeText(text); toast('Скопійовано'); } catch { prompt('Скопіюйте:', text); } };
  el.addEventListener('click', async (e) => {
    const d = e.target.closest('[data-d]'); if (!d) return;
    const act = d.dataset.d;
    if (act === 'min') { min = !min; draw(); }
    if (act === 'reset') { stopTest(); store.clearAll(); restart(); toast('Дані скинуто'); }
    if (act === 'events') copy(JSON.stringify(store.events()));
    if (act === 'copy') copy(rows().map(([k, v]) => `${k}: ${String(v).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()}`).join('\n'));
    if (act === 'cam') runTest();
  });
  function stopTest() { if (test) { cancelAnimationFrame(test.raf); const so = test.video.srcObject; if (so) for (const t of so.getTracks()) t.stop(); test = null; } }
  async function runTest() {
    stopTest();
    const video = document.createElement('video'); video.muted = true; video.setAttribute('playsinline', '');
    test = { video, raf: 0 };
    preloadPose().catch(() => {});
    try { await openCamera(video, 'environment'); } catch (err) { test = null; draw(); return; }
    await preloadPose().catch(() => {});
    let last = -1;
    const loop = () => { if (!test) return; if (video.currentTime !== last) { last = video.currentTime; detectPose(video); } test.raf = requestAnimationFrame(loop); };
    loop();
    setTimeout(stopTest, 20000); // тест на 20 секунд, потом камера выключается
  }
  draw();
  setInterval(draw, 1000);
  window.__debugLog = () => {};
}
