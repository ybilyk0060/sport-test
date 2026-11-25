// Аналіз руху за точками MediaPipe Pose (33 точки, x/y в 0..1 від кадру).
// Вхід: frames = [{ t: мс, lm: [{x,y,visibility}] | null }]. Вихід: показники 0..100 і сирі метрики.
// Чисті функції без DOM: перевіряються в node (tests/analyze.test.mjs).

const NOSE = 0, LS = 11, RS = 12, LW = 15, RW = 16, LH = 23, RH = 24, LK = 25, RK = 26, LA = 27, RA = 28;

const clamp = (v, a = 0, b = 100) => Math.max(a, Math.min(b, v));
const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const vis = (p) => (p && (p.visibility ?? 1)) || 0;
const median = (arr) => { if (!arr.length) return 0; const s = [...arr].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };
const mean = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

function angle(a, b, c) { // кут у точці b, градуси
  const v1 = { x: a.x - b.x, y: a.y - b.y }, v2 = { x: c.x - b.x, y: c.y - b.y };
  const d = Math.hypot(v1.x, v1.y) * Math.hypot(v2.x, v2.y);
  if (!d) return 180;
  return Math.acos(clamp((v1.x * v2.x + v1.y * v2.y) / d, -1, 1)) * 180 / Math.PI;
}

function corr(a, b) {
  const n = Math.min(a.length, b.length); if (n < 5) return 0;
  const ma = mean(a.slice(0, n)), mb = mean(b.slice(0, n));
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < n; i++) { const x = a[i] - ma, y = b[i] - mb; num += x * y; da += x * x; db += y * y; }
  return da && db ? num / Math.sqrt(da * db) : 0;
}

function smooth(arr, k = 2) {
  return arr.map((_, i) => { const s = arr.slice(Math.max(0, i - k), i + k + 1); return mean(s); });
}

export function bodyVisible(lm, thr = 0.5) {
  if (!lm) return false;
  return [LS, RS, LH, RH].every((i) => vis(lm[i]) > thr);
}

export function fullBodyVisible(lm, thr = 0.5) {
  return bodyVisible(lm, thr) && vis(lm[LA]) > thr && vis(lm[RA]) > thr && vis(lm[NOSE]) > thr;
}

export function analyze(frames, ageGroup = '7-9') {
  const total = frames.length;
  const valid = frames.filter((f) => bodyVisible(f.lm));
  const coverage = total ? valid.length / total : 0;
  const durationSec = total > 1 ? (frames[total - 1].t - frames[0].t) / 1000 : 0;
  if (valid.length < 20) return { ok: false, reason: 'no_body', coverage, durationSec };

  const torso = median(valid.map((f) => dist(mid(f.lm[LS], f.lm[RS]), mid(f.lm[LH], f.lm[RH])))) || 0.25;

  // --- серії ---
  const T = [], hipY = [], hipX = [], wristSp = [], ankleSp = [], lWr = [], rWr = [], ankleDiff = [], kneeAng = [], armUp = [];
  for (let i = 0; i < valid.length; i++) {
    const lm = valid[i].lm, hip = mid(lm[LH], lm[RH]);
    T.push(valid[i].t / 1000);
    hipY.push(hip.y / torso); hipX.push(hip.x / torso);
    ankleDiff.push(Math.abs(lm[LA].y - lm[RA].y) / torso);
    const kl = vis(lm[LK]) > 0.4 && vis(lm[LA]) > 0.4 ? angle(lm[LH], lm[LK], lm[LA]) : 180;
    const kr = vis(lm[RK]) > 0.4 && vis(lm[RA]) > 0.4 ? angle(lm[RH], lm[RK], lm[RA]) : 180;
    kneeAng.push(Math.min(kl, kr));
    const top = Math.min(lm[LW].y, lm[RW].y);
    armUp.push((mid(lm[LS], lm[RS]).y - top) / torso); // >0: кисті вище плечей
    if (i > 0) {
      const p = valid[i - 1].lm, dt = Math.max(0.016, (valid[i].t - valid[i - 1].t) / 1000);
      if (dt > 0.5) { wristSp.push(0); ankleSp.push(0); lWr.push(0); rWr.push(0); continue; }
      const lw = dist(lm[LW], p[LW]) / torso / dt, rw = dist(lm[RW], p[RW]) / torso / dt;
      const la = dist(lm[LA], p[LA]) / torso / dt, ra = dist(lm[RA], p[RA]) / torso / dt;
      wristSp.push(Math.min(lw + rw, 30)); ankleSp.push(Math.min(la + ra, 30)); lWr.push(Math.min(lw, 15)); rWr.push(Math.min(rw, 15));
    }
  }

  // --- енергія / витривалість: середня швидкість кінцівок ---
  const energy = mean(wristSp) + mean(ankleSp);
  const activeShare = wristSp.filter((v, i) => v + (ankleSp[i] || 0) > 3).length / Math.max(1, wristSp.length);

  // --- стрибки: підйоми центру таза над рухомою базою ---
  const hs = smooth(hipY, 1);
  const base = hs.map((_, i) => { const w = hs.slice(Math.max(0, i - 30), i + 31); return median(w); });
  let jumps = 0, maxJump = 0, inJump = false, peak = 0;
  for (let i = 0; i < hs.length; i++) {
    const lift = base[i] - hs[i]; // y вниз, тому підйом = база - y
    if (!inJump && lift > 0.18) { inJump = true; peak = lift; }
    else if (inJump) { peak = Math.max(peak, lift); if (lift < 0.07) { jumps++; maxJump = Math.max(maxJump, peak); inJump = false; } }
  }

  // --- присідання / гнучкість ---
  const minKnee = Math.min(...kneeAng.map((a, i) => median(kneeAng.slice(Math.max(0, i - 2), i + 3))));
  let squats = 0, down = false;
  for (const a of smooth(kneeAng, 2)) { if (!down && a < 120) { down = true; } else if (down && a > 155) { squats++; down = false; } }
  const maxArmUp = Math.max(...armUp);

  // --- координація: синхронність рук і ніг + симетрія рук ---
  const c = corr(wristSp, ankleSp);
  const symm = 1 - Math.abs(mean(lWr) - mean(rWr)) / Math.max(0.5, mean(lWr) + mean(rWr));

  // --- баланс: найдовше стояння на одній нозі і стабільність таза в цей час ---
  let bestHold = 0, holdStart = null, holdX = [], bestSway = 1;
  for (let i = 0; i < ankleDiff.length; i++) {
    if (ankleDiff[i] > 0.25) {
      if (holdStart === null) { holdStart = T[i]; holdX = []; }
      holdX.push(hipX[i]);
      const d = T[i] - holdStart;
      if (d > bestHold) { bestHold = d; const m = mean(holdX); bestSway = Math.sqrt(mean(holdX.map((x) => (x - m) ** 2))); }
    } else holdStart = null;
  }

  const ageK = { '4-6': 1.3, '7-9': 1.12, '10-12': 1 }[ageGroup] || 1.1;
  const scores = {
    power: clamp((jumps * 7 + maxJump * 90 + (squats ? 10 : 0)) * ageK),
    endurance: clamp((100 * (1 - Math.exp(-energy / 6)) * 0.7 + activeShare * 30) * ageK),
    flexibility: clamp(((180 - minKnee) / 110 * 65 + clamp(maxArmUp, 0, 1.2) / 1.2 * 35) * ageK),
    coordination: clamp((((c + 1) / 2) * 60 + symm * 40) * Math.min(1, energy / 3 + 0.3) * ageK),
    balance: clamp((Math.min(bestHold, 6) / 6 * 80 + (bestHold > 1 ? 20 * clamp(1 - bestSway / 0.15, 0, 1) : 0)) * ageK),
  };
  for (const k in scores) scores[k] = Math.round(clamp(scores[k], 12, 98));

  return {
    ok: true, coverage, durationSec, scores,
    raw: { torso: +torso.toFixed(3), energy: +energy.toFixed(2), activeShare: +activeShare.toFixed(2), jumps, maxJump: +maxJump.toFixed(2),
      minKnee: Math.round(minKnee), squats, maxArmUp: +maxArmUp.toFixed(2), corr: +c.toFixed(2), symm: +symm.toFixed(2),
      bestHold: +bestHold.toFixed(1), sway: +bestSway.toFixed(3), frames: total, validFrames: valid.length },
  };
}

// --- Рекомендації: якості руху (60%) + анкета (40%) ---
export const QUALITY_NAMES = { power: 'Сила і стрибок', endurance: 'Витривалість', flexibility: 'Гнучкість', coordination: 'Координація', balance: 'Баланс' };

export const SPORTS = [
  { key: 'football', name: 'Футбол', w: { power: .3, endurance: .4, coordination: .3 }, likes: ['team'], temper: ['active'], goals: ['result', 'confidence'] },
  { key: 'swimming', name: 'Плавання', w: { endurance: .5, flexibility: .3, coordination: .2 }, likes: ['solo'], temper: ['calm', 'mixed'], goals: ['health'] },
  { key: 'gymnastics', name: 'Гімнастика / акробатика', w: { flexibility: .4, balance: .3, power: .3 }, likes: ['climb', 'music'], temper: ['active', 'mixed'], goals: ['discipline', 'result'] },
  { key: 'dance', name: 'Танці', w: { coordination: .45, flexibility: .3, balance: .25 }, likes: ['music'], temper: ['active', 'mixed'], goals: ['confidence', 'health'] },
  { key: 'martial', name: 'Єдиноборства', w: { power: .35, coordination: .35, balance: .3 }, likes: ['fight'], temper: ['active'], goals: ['discipline', 'confidence'] },
  { key: 'athletics', name: 'Легка атлетика', w: { power: .5, endurance: .5 }, likes: ['solo'], temper: ['active'], goals: ['result', 'health'] },
  { key: 'basketball', name: 'Баскетбол / волейбол', w: { power: .45, coordination: .4, endurance: .15 }, likes: ['team'], temper: ['active', 'mixed'], goals: ['confidence', 'result'] },
  { key: 'tennis', name: 'Теніс / бадмінтон', w: { coordination: .5, endurance: .3, balance: .2 }, likes: ['solo'], temper: ['mixed', 'calm'], goals: ['discipline', 'result'] },
  { key: 'climbing', name: 'Скелелазіння', w: { power: .4, balance: .3, flexibility: .3 }, likes: ['climb'], temper: ['calm', 'mixed'], goals: ['confidence', 'health'] },
  { key: 'skating', name: 'Фігурне катання', w: { balance: .45, flexibility: .3, coordination: .25 }, likes: ['music'], temper: ['mixed', 'calm'], goals: ['discipline', 'result'] },
];

export function recommend(scores, quiz = {}) {
  return SPORTS.map((s) => {
    let q = 0; for (const k in s.w) q += (scores[k] || 0) * s.w[k];
    let p = 40; // анкета 0..100
    if (s.likes.includes(quiz.likes)) p += 40;
    if (s.temper.includes(quiz.temper)) p += 10;
    if (s.goals.includes(quiz.goal)) p += 10;
    const fit = Math.round(clamp(48 + (0.6 * q + 0.4 * p) * 0.48, 50, 97));
    const best = Object.entries(s.w).sort((a, b) => b[1] - a[1]).map(([k]) => k);
    return { ...s, fit, best };
  }).sort((a, b) => b.fit - a.fit);
}

export function overallIndex(scores) {
  const v = Object.values(scores); return Math.round(mean(v));
}
