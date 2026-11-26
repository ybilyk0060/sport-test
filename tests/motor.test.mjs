// Прыжки через линию и наклон стоя: синтетические позы. Запуск: node tests/motor.test.mjs
import { createSideJumpRun, createBendRun, bendLevel } from '../js/motor.js';
let fail = 0; const check = (n, ok, got) => { console.log(`${ok ? 'OK  ' : 'FAIL'} ${n}${got !== undefined ? ': ' + JSON.stringify(got) : ''}`); if (!ok) fail++; };

// Стоя лицом к камере: плечи 0.30, таз 0.55 (корпус 0.25), колени 0.75, щиколотки 0.95. dx — сдвиг всего тела.
function stand({ dx = 0, wristY = 0.55, hipDrop = 0, kneeDrop = 0, vis = 0.95, hipVis } = {}) {
  const p = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, visibility: vis }));
  const P = (x, y) => ({ x: x + dx, y, visibility: vis });
  p[11] = P(0.45, 0.30 + hipDrop); p[12] = P(0.55, 0.30 + hipDrop); p[23] = P(0.47, 0.55 + hipDrop); p[24] = P(0.53, 0.55 + hipDrop);
  p[25] = P(0.47, 0.75 + kneeDrop); p[26] = P(0.53, 0.75 + kneeDrop);
  if (hipVis != null) { p[23].visibility = hipVis; p[24].visibility = hipVis; } p[27] = P(0.47, 0.95); p[28] = P(0.53, 0.95);
  p[15] = P(0.44, wristY); p[16] = P(0.56, wristY);
  return p;
}
function sim(make, frames, opts) {
  let t = 0, res = null; const counts = [], hints = [];
  const run = make({ key: 'x', clock: () => t, on: { count: (c) => counts.push(c), hint: (h) => hints.push(h), finish: (r) => { res = r; } }, ...opts });
  run.start();
  for (const [ms, f] of frames) { const end = t + ms; while (t < end && !res) { t += 33; run.frame(f(t)); } if (res) break; }
  if (!res) run.end('ended');
  return { res, counts, hints };
}

// --- Прыжки: 2,5 прыжка в секунду, амплитуда 0,1 кадра (0,4 корпуса), 15 с
const jumpAt = (rate, amp) => (t) => stand({ dx: (Math.floor((t / 1000) * rate) % 2 ? amp : -amp) / 2 });
let r = sim(createSideJumpRun, [[16000, jumpAt(2.5, 0.1)]], { target: 999, capSec: 15 });
check('прыжки 2,5/с × 15 с ≈ 37', Math.abs(r.res.done - 37) <= 2, r.res);
r = sim(createSideJumpRun, [[16000, (t) => stand({ dx: Math.sin(t / 150) * 0.01 })]], { target: 999, capSec: 15 });
check('покачивание на месте — 0 прыжков', r.res.done === 0, r.res);
r = sim(createSideJumpRun, [[16000, jumpAt(1.5, 0.12)]], { target: 999, capSec: 15 });
check('медленнее (1,5/с) — меньше, ≈22', Math.abs(r.res.done - 22) <= 2, r.res);

// --- Наклон: уровни
check('уровни по t', [bendLevel(-0.8), bendLevel(0), bendLevel(0.5), bendLevel(0.9), bendLevel(1.05)].join(',') === '0,1,2,3,4');
const wristAt = (t) => 0.75 + t * 0.2; // t → y кисти
// Попытка 1: до середины голени, держит 2 с, выпрямляется; попытка 2: ладони на пол
r = sim(createBendRun, [[1500, () => stand()], [2500, () => stand({ wristY: wristAt(0.6) })], [1000, () => stand()], [2500, () => stand({ wristY: wristAt(1.1) })], [1000, () => stand()]], { target: 4, capSec: 30 });
check('лучшая из 2 попыток — 4', r.res.done === 4 && r.res.reason === 'complete', r.res);
// Коснулся пальцев на миг (0,5 с) — не засчитано; держал 2 с середину голени
r = sim(createBendRun, [[1500, () => stand()], [500, () => stand({ wristY: wristAt(0.8) })], [2000, () => stand({ wristY: wristAt(0.5) })], [1000, () => stand()], [2000, () => stand({ wristY: wristAt(0.5) })], [1000, () => stand()]], { target: 4, capSec: 30 });
check('мгновенное касание не считается — 2', r.res.done === 2, r.res);
// Согнул колени лицом к камере: колени ушли вниз-вперёд (голень в кадре короче на 30 %), дотянулся до пола — не засчитано, подсказка
r = sim(createBendRun, [[1500, () => stand()], [2500, () => stand({ wristY: 0.95 + 0.06, kneeDrop: 0.06, hipDrop: 0.08 })], [1000, () => stand()], [2500, () => stand({ wristY: wristAt(0.3) })], [1000, () => stand()]], { target: 4, capSec: 30 });
check('согнутые колени не засчитаны, подсказка', r.res.done === 1 && r.hints.includes('bend_knees_straight'), { res: r.res, hints: r.hints });
// Прогон на iPhone 26.11: прямые ноги, корпус закрыл таз — модель опустила таз (0,08) с низкой уверенностью. Должно засчитаться.
r = sim(createBendRun, [[1500, () => stand()], [2500, () => stand({ wristY: wristAt(1.1), hipDrop: 0.08, hipVis: 0.5 })], [1000, () => stand()], [2500, () => stand({ wristY: wristAt(0.6), hipDrop: 0.08, hipVis: 0.5 })], [1000, () => stand()]], { target: 4, capSec: 30 });
check('таз закрыт корпусом, ноги прямые — засчитано 4', r.res.done === 4, r.res);
// Кисти мигнули выше колена на 0,2 с посреди наклона — попытка не закрывается
r = sim(createBendRun, [[1500, () => stand()], [600, () => stand({ wristY: wristAt(0.6) })], [200, () => stand()], [2000, () => stand({ wristY: wristAt(0.9) })], [1000, () => stand()], [2500, () => stand({ wristY: wristAt(0.5) })], [1000, () => stand()]], { target: 4, capSec: 30 });
check('мигание точек не закрывает попытку — 3', r.res.done === 3, r.res);

console.log(fail ? `\n${fail} FAILED` : '\nALL OK'); process.exit(fail ? 1 : 0);
