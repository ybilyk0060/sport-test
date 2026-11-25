// Проверка обёртки прогона (js/session.js): счёт, завершение по цели/времени, показатели. Запуск: node tests/session.test.mjs
globalThis.location = { search: '' };
const { createRun } = await import('../js/session.js');
const mock = await import('./studio-mock-poses.mjs');
const { jacks, goodMornings, shoulderTaps, pushFronts } = await import('./synthetic.mjs');
const rep = (fn, n) => Array.from({ length: n }, fn).flat();
let fail = 0; const check = (n, ok, got) => { console.log(`${ok ? 'OK  ' : 'FAIL'} ${n}: ${JSON.stringify(got)}`); if (!ok) fail++; };

function play(key, frames, { target, capSec, ageGroup = '6-8' }) {
  let t = 1000; const counts = []; let res = null;
  const run = createRun({ key, target, capSec, ageGroup, aspect: 9 / 16, clock: () => t, on: { count: (c) => counts.push(c), finish: (r) => { res = r; } } });
  run.start();
  for (const f of frames) { if (run.finished) break; run.frame(f); t += 1000 / 30; }
  if (!run.finished) run.end('ended');
  return { ...res, counts };
}
{ const r = play('jumping_jack', jacks(12), { target: 10, capSec: 25 }); check('зірочки: стоп на 10 из 10', r.done === 10 && r.completed && r.reason === 'complete' && r.counts.join() === '1,2,3,4,5,6,7,8,9,10' && r.metrics.rhythmCv !== null && r.metrics.armDiff < 0.05, { done: r.done, reason: r.reason, sec: r.elapsedSec, m: r.metrics }); }
{ const r = play('jumping_jack', jacks(4), { target: 10, capSec: 25 }); check('зірочки: 4 из 10, запись кончилась', r.done === 4 && !r.completed, { done: r.done, reason: r.reason }); }
{ const r = play('squats', rep(mock.squatRep, 20), { target: 8, capSec: 30, ageGroup: '9-11' }); check('присідання: 8 из 8', r.done === 8 && r.completed && r.metrics.depth > 0.15 && r.metrics.shallow === 0, { done: r.done, reason: r.reason, m: r.metrics }); }
{ const r = play('squats', rep(mock.squatRep, 20), { target: 8, capSec: 5, ageGroup: '3-5' }); check('присідання: стоп по времени 5 с', r.reason === 'time' && r.done >= 2 && r.done < 8, { done: r.done, reason: r.reason, sec: r.elapsedSec }); }
{ const r = play('high_knees', mock.highKnees({ peak: 0.2, plant: 0.85, lifts: 60 }), { target: 10, capSec: 25 }); check('біг: 10 с из 10', r.done === 10 && r.completed && r.metrics.liftsLeft > 5 && r.metrics.liftsRight > 5, { done: r.done, reason: r.reason, sec: r.elapsedSec, m: r.metrics }); }
{ const r = play('plank', mock.plankFrames(mock.plankPose(), 900), { target: 15, capSec: 40 }); check('планка: 15 с из 15', r.done === 15 && r.completed && r.metrics.driftDeg < 2, { done: r.done, reason: r.reason, m: r.metrics }); }
{ const r = play('plank', rep(() => mock.squat(175, 0, 0.14).slice(0, 1), 1300), { target: 15, capSec: 40 }); check('планка: стоит — 0 с, стоп по времени', r.done === 0 && r.reason === 'time', { done: r.done, reason: r.reason }); }
{ const r = play('good_morning', goodMornings(8, 95), { target: 6, capSec: 25, ageGroup: '12-15' }); check('нахили: 6 из 6 (детские пороги и для 12–15)', r.done === 6 && r.completed, { done: r.done, reason: r.reason, m: r.metrics }); }
{ const r = play('good_morning', goodMornings(8, 40), { target: 6, capSec: 25 }); check('нахили: неглибокі — 0', r.done === 0, { done: r.done, m: r.metrics }); }
{ const r = play('shoulder_taps', shoulderTaps(12), { target: 10, capSec: 30 }); check('торкання плечей: 10 из 10, обе руки', r.done === 10 && r.completed && r.metrics.liftsLeft >= 4 && r.metrics.liftsRight >= 4, { done: r.done, reason: r.reason, m: r.metrics }); }
{ const r = play('shoulder_taps', shoulderTaps(12, { reach: 0.4 }), { target: 10, capSec: 30 }); check('торкання плечей: рука не дотягнулась — 0', r.done === 0, { done: r.done, m: r.metrics }); }
{ const r = play('pushups', pushFronts(9), { target: 8, capSec: 30, ageGroup: '12-15' }); check('віджимання лицом: 8 из 8 (вторая спека)', r.done === 8 && r.completed && r.metrics.view === 'front', { done: r.done, reason: r.reason, m: r.metrics }); }
{ const r = play('pushups', pushFronts(9, 0.3), { target: 8, capSec: 30, ageGroup: '12-15' }); check('віджимання лицом: неглибокі — 0', r.done === 0, { done: r.done }); }
{ const r = play('arm_circles', jacks(9, { legs: false }), { target: 8, capSec: 25 }); check('млинок: руки вгору-вниз 8 из 8', r.done === 8 && r.completed, { done: r.done, reason: r.reason }); }
{ const frames = jacks(3); const r = play('jumping_jack', frames.map((f, i) => (i % 40 > 30 ? null : f)), { target: 10, capSec: 25 }); check('пропавшие кадры не роняют прогон', r.done >= 0 && r.reason, { done: r.done }); }
console.log(fail ? `\n${fail} FAILED` : '\nALL OK'); process.exit(fail ? 1 : 0);
