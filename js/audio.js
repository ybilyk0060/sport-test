// Голос студии (Achird, один на всё): счёт, подсказки, вступления. WebAudio — чтобы счёт звучал без задержки.
// Какие клипы есть — js/voice-map.js (генерирует tools/fetch-voice.mjs из манифеста Студії вправ).
// Звук разблокируется первым нажатием пользователя (требование iOS).

import { VOICE_FILES } from './voice-map.js';
import { LANG } from './i18n/index.js';

const CLIPS = VOICE_FILES[LANG] || VOICE_FILES.en;

const base = 'assets/audio/';
let ctx = null;
const buffers = new Map();
let current = null;
export const audioStatus = { state: 'idle', loaded: 0 };

export function unlockAudio() {
  try {
    if (!ctx) { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) { audioStatus.state = 'unsupported'; return; } ctx = new AC(); }
    if (ctx.state === 'suspended') ctx.resume();
    // iOS 17+: голос звучит и при беззвучном режиме телефона (иначе Web Audio молчит при выключенном звонке)
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch { /* старый iOS */ }
    const b = ctx.createBuffer(1, 1, 22050); const s = ctx.createBufferSource(); s.buffer = b; s.connect(ctx.destination); s.start(0);
    audioStatus.state = 'unlocked';
  } catch { audioStatus.state = 'error'; }
}

async function loadClip(name) {
  if (!ctx || buffers.has(name)) return buffers.get(name);
  const p = fetch(base + CLIPS[name]).then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error('404'))))
    .then((ab) => new Promise((res, rej) => ctx.decodeAudioData(ab, res, rej)))
    .then((buf) => { audioStatus.loaded++; return buf; })
    .catch(() => null);
  buffers.set(name, p);
  return p;
}

// Только клипы из набора студии; чего нет — молчим (текст остаётся на экране). Системный TTS не используем: другой голос.
export const exists = (name) => Object.prototype.hasOwnProperty.call(CLIPS, name);

export function preloadClips(names) { for (const n of names) if (exists(n)) loadClip(n); }

// say(name): проиграть клип. interrupt=true прерывает текущий (для счёта).
export async function say(name, { interrupt = true } = {}) {
  if (!ctx || !exists(name)) return;
  const buf = await loadClip(name);
  if (!buf) return;
  if (current && interrupt) { try { current.stop(); } catch { /* уже остановлен */ } current = null; }
  if (current && !interrupt) return;
  const src = ctx.createBufferSource(); src.buffer = buf; src.connect(ctx.destination);
  src.onended = () => { if (current === src) current = null; };
  current = src; src.start(0);
}

// Несколько клипов подряд (как вступление камеры в Kidsney: «Постав телефон до стіни!» → «Три кроки назад!»)
let queueId = 0;
export async function sayQueue(names, gapMs = 250) {
  const id = ++queueId;
  for (const name of names) {
    if (id !== queueId || !ctx || !exists(name)) continue;
    const buf = await loadClip(name);
    if (!buf || id !== queueId) continue;
    if (current) { try { current.stop(); } catch { /* уже остановлен */ } }
    const src = ctx.createBufferSource(); src.buffer = buf; src.connect(ctx.destination);
    current = src;
    await new Promise((res) => { src.onended = () => { if (current === src) current = null; res(); }; src.start(0); });
    await new Promise((res) => setTimeout(res, gapMs));
  }
}

export function stopVoice() { queueId++; if (current) { try { current.stop(); } catch { /* уже остановлен */ } current = null; } }
