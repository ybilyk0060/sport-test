// Сверка счёта: оригинальный движок студии + опубликованные спеки на синтетических позах.
// Запуск: node tests/engine.test.mjs
import { SpecEngine, ExerciseAnalyzer, PoseSmoother, calibrationForAge } from '../js/engine/kidsney-engine.js';
import { SPECS } from '../js/engine/specs.js';
import * as mock from './studio-mock-poses.mjs';

const DT = 1000 / 30;
function run(key, frames, { age = 8, target = 0, hold = 0, aspect = 9 / 16 } = {}) {
  const spec = SPECS[key];
  const an = new ExerciseAnalyzer(new SpecEngine(spec), target, spec.gates?.minVisibility ?? 0.5, hold);
  an.setCalibration(calibrationForAge(age));
  an.setFrameAspect(aspect);
  const hints = [];
  an.onHint = (h) => hints.push(h);
  const sm = new PoseSmoother();
  let t = 1000, m = null;
  for (const f of frames) { m = an.processFrame(sm.smooth(f.map((p) => ({ ...p })), t), t); t += DT; }
  return { reps: m.repsCompleted, held: an.heldSeconds(), phase: an.holdPhase(), hints: [...new Set(hints)], dbg: an.debugInfo() };
}
const rep = (fn, n) => Array.from({ length: n }, fn).flat();
let fail = 0;
const check = (name, got, ok) => { console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}: ${JSON.stringify(got)}`); if (!ok) fail++; };

// 1. Присідання: N синтетичних повторів студії → N зарахованих
for (const age of [5, 8, 11]) for (const n of [1, 5, 8]) {
  const r = run('squats', rep(mock.squatRep, n), { age });
  check(`squats age${age} x${n}`, { reps: r.reps, hints: r.hints }, r.reps === n);
}
// неглибоке присідання не рахується
{ const r = run('squats', rep(() => mock.squat(150, 0.02, 0.14), 4), { age: 11 }); check('squats shallow x4 → 0', { reps: r.reps, hints: r.hints }, r.reps === 0); }

// 2. Планка: нерухома поза студії 20 с → утримання ~19 с (мінус settle)
for (const age of [5, 11]) { const r = run('plank', mock.plankFrames(mock.plankPose(), 600), { age, hold: 0 }); check(`plank age${age} 20s`, { held: +r.held.toFixed(1), phase: r.phase }, r.held > 17 && r.held < 20.1); }
// стояча людина — не планка
{ const r = run('plank', rep(() => mock.squat(175, 0, 0.14).slice(0, 1), 300), { age: 11 }); check('plank standing → 0', { held: r.held, phase: r.phase }, r.held === 0); }

// 3. Біг з високими колінами: 40 підйомів (~26 с) → активні секунди йдуть
for (const age of [5, 11]) { const r = run('high_knees', mock.highKnees({ peak: 0.2, plant: 0.85, lifts: 40 }), { age }); check(`high_knees age${age} 40 lifts`, { held: +r.held.toFixed(1), lifts: r.dbg.lifts, phase: r.phase }, r.held > 15 && r.dbg.lifts >= 36); }
// низьке марширування не рахується
{ const r = run('high_knees', mock.highKnees({ peak: 0.7, plant: 0.9, lifts: 30 }), { age: 11 }); check('high_knees low march → 0', { held: r.held, lifts: r.dbg.lifts }, r.held === 0); }

// 4. Зіркові стрибки (фронтально): власний генератор, бо в імітаторі студії його немає
function jackFrame(open /*0..1*/, { arms = true, legs = true } = {}) {
  const P = (x, y) => mock.pt(x, y); const lm = Array.from({ length: 33 }, () => P(0.5, 0.5));
  const sh = 0.30, hip = 0.52, torso = hip - sh; // torso=0.22
  const a = arms ? open : 0, l = legs ? open : 0;
  lm[0] = P(0.5, 0.2); lm[11] = P(0.56, sh); lm[12] = P(0.44, sh); lm[23] = P(0.54, hip); lm[24] = P(0.46, hip);
  const ang = (-80 + 150 * a) * Math.PI / 180, armL = 0.2; // від «вниз» до «вгору»
  const wy = sh - armL * Math.sin(ang), wx = armL * Math.cos(ang);
  lm[15] = P(0.56 + wx, wy); lm[16] = P(0.44 - wx, wy); lm[13] = P(0.56 + wx / 2, (sh + wy) / 2); lm[14] = P(0.44 - wx / 2, (sh + wy) / 2);
  const spread = 0.04 + l * 0.2; // половина відстані між стопами
  lm[25] = P(0.5 + spread * 0.6 + 0.02, 0.7); lm[26] = P(0.5 - spread * 0.6 - 0.02, 0.7); lm[27] = P(0.5 + spread, 0.88); lm[28] = P(0.5 - spread, 0.88);
  for (const i of [29, 31]) lm[i] = P(lm[27].x, 0.9); for (const i of [30, 32]) lm[i] = P(lm[28].x, 0.9);
  return lm;
}
function jacks(n, opt) { const f = []; for (let i = 0; i < 10; i++) f.push(jackFrame(0, opt)); for (let k = 0; k < n; k++) { for (let i = 1; i <= 8; i++) f.push(jackFrame(i / 8, opt)); for (let i = 0; i < 2; i++) f.push(jackFrame(1, opt)); for (let i = 1; i <= 8; i++) f.push(jackFrame(1 - i / 8, opt)); for (let i = 0; i < 4; i++) f.push(jackFrame(0, opt)); } return f; }
for (const age of [5, 8, 11]) for (const n of [1, 6, 10]) { const r = run('jumping_jack', jacks(n), { age }); check(`jumping_jack age${age} x${n}`, { reps: r.reps, hints: r.hints }, r.reps === n); }
{ const r = run('jumping_jack', jacks(6, { legs: false }), { age: 8 }); check('jumping_jack arms only → 0', { reps: r.reps }, r.reps === 0); }
{ const r = run('jumping_jack', jacks(6, { arms: false }), { age: 8 }); check('jumping_jack legs only → 0', { reps: r.reps }, r.reps === 0); }

console.log(fail ? `\n${fail} FAILED` : '\nALL OK');
process.exit(fail ? 1 : 0);
