// Голос студии: счёт, подсказки, вступления. WebAudio — чтобы счёт звучал без задержки.
// Звук разблокируется первым нажатием пользователя (требование iOS).

const base = 'assets/audio/';
let ctx = null;
const buffers = new Map();
let current = null;
export const audioStatus = { state: 'idle', loaded: 0 };

export function unlockAudio() {
  try {
    if (!ctx) { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) { audioStatus.state = 'unsupported'; return; } ctx = new AC(); }
    if (ctx.state === 'suspended') ctx.resume();
    const b = ctx.createBuffer(1, 1, 22050); const s = ctx.createBufferSource(); s.buffer = b; s.connect(ctx.destination); s.start(0);
    audioStatus.state = 'unlocked';
  } catch { audioStatus.state = 'error'; }
}

async function loadClip(name) {
  if (!ctx || buffers.has(name)) return buffers.get(name);
  const p = fetch(base + name + '.wav').then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error('404'))))
    .then((ab) => new Promise((res, rej) => ctx.decodeAudioData(ab, res, rej)))
    .then((buf) => { audioStatus.loaded++; return buf; })
    .catch(() => null);
  buffers.set(name, p);
  return p;
}

// Клипы подсказок, которые есть в студии (у прыжков голосовых подсказок нет — только текст).
const HINT_CLIPS = new Set(['sit_lower', 'turn_sideways', 'keep_feet_planted', 'stand_straight_arms_down', 'keep_moving', 'switch_legs', 'start_high_knees', 'lift_knees_higher', 'hold_your_plank', 'get_into_plank_position', 'show_full_body']);
const exists = (name) => !name.startsWith('hint_') || HINT_CLIPS.has(name.slice(5));

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

export function stopVoice() { if (current) { try { current.stop(); } catch { /* уже остановлен */ } current = null; } }
