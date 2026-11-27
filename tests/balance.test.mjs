// Баланс на одной ноге: синтетические позы. Запуск: node tests/balance.test.mjs
import { balanceFrame, createBalanceRun } from '../js/balance.js';
let fail = 0; const check = (n, ok, got) => { console.log(`${ok ? 'OK  ' : 'FAIL'} ${n}${got !== undefined ? ': ' + JSON.stringify(got) : ''}`); if (!ok) fail++; };

// Ребёнок лицом к камере: плечи y=0.30, таз y=0.55 (корпус 0.25), щиколотки y=0.95. lift — насколько поднята левая щиколотка.
function pose(lift = 0, sway = 0, vis = 0.95) {
  const p = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, z: 0, visibility: vis }));
  p[11] = { x: 0.45 + sway, y: 0.30, visibility: vis }; p[12] = { x: 0.55 + sway, y: 0.30, visibility: vis };
  p[23] = { x: 0.47 + sway, y: 0.55, visibility: vis }; p[24] = { x: 0.53 + sway, y: 0.55, visibility: vis };
  p[27] = { x: 0.47, y: 0.95 - lift, visibility: vis }; p[28] = { x: 0.53, y: 0.95, visibility: vis };
  return p;
}

check('две ноги на полу — не поднята', balanceFrame(pose(0)).lifted === false);
check('левая поднята на 0,1 (0,4 корпуса) — поднята, сторона left', (() => { const f = balanceFrame(pose(0.1)); return f.lifted && f.side === 'left'; })());
check('чуть приподнята (0,02 = 0,08 корпуса) — не считается', balanceFrame(pose(0.02)).lifted === false);
check('очень плохая видимость (0,1) — нет данных', balanceFrame(pose(0.1, 0, 0.1)).ok === false);
check('тёмная одежда (видимость 0,25) — нога поднята', balanceFrame(pose(0.1, 0, 0.25)).lifted === true);

function sim(frames, target = 10, capSec = 30) {
  let t = 0, res = null; const counts = [];
  const run = createBalanceRun({ key: 'balance', target, capSec, clock: () => t, on: { count: (c) => counts.push(c), finish: (r) => { res = r; } } });
  run.start();
  for (const [ms, lm] of frames) { const end = t + ms; while (t < end && !res) { t += 33; run.frame(typeof lm === 'function' ? lm(t) : lm); } if (res) break; }
  if (!res) run.end('ended');
  return { res, counts };
}

// Стоит 2 с, поднимает ногу и держит 6 с, опускает
let r = sim([[2000, pose(0)], [6000, pose(0.1)], [2000, pose(0)]]);
check('удержание ~6 с, причина broken', Math.abs(r.res.done - 6) < 0.5 && r.res.reason === 'broken', r.res);
check('секунды озвучиваются 1..6', r.counts.join(',') === '1,2,3,4,5,6' || r.counts.join(',') === '1,2,3,4,5', r.counts);

// Короткое касание пола 0,3 с прощается
r = sim([[3000, pose(0.1)], [300, pose(0)], [3000, pose(0.1)], [1500, pose(0)]]);
check('касание 0,3 с не прерывает: ~6 с', r.res.done > 5.5 && r.res.reason === 'broken', r.res);

// Держит дольше цели — завершается на цели
r = sim([[15000, pose(0.1)]], 10);
check('цель 10 с достигнута', r.res.done === 10 && r.res.reason === 'complete', r.res);

// Покачивание: сильнее качается — больше sway
const a = sim([[5000, pose(0.1)], [1000, pose(0)]]).res.metrics.sway;
const b = sim([[5000, (t) => pose(0.1, Math.sin(t / 200) * 0.03)], [1000, pose(0)]]).res.metrics.sway;
check('покачивание различается', b > a + 0.03, { a, b });

// Не поднимает ногу вовсе — 0 с по времени
r = sim([[31000, pose(0)]], 10, 30);
check('не поднял — 0 с, причина time', r.res.done === 0 && r.res.reason === 'time', r.res);

// Ушёл из кадра во время удержания
r = sim([[4000, pose(0.1)], [1500, null], [2000, pose(0.1)]]);
check('модель моргнула на 1,5 с — удержание продолжается (~7,5 с)', Math.abs(r.res.done - 7.5) < 0.5, r.res);
r = sim([[4000, pose(0.1)], [3000, null]]);
check('ушёл из кадра — lost, ~4 с', r.res.reason === 'lost' && Math.abs(r.res.done - 4) < 0.5, r.res);

console.log(fail ? `\n${fail} FAILED` : '\nALL OK'); process.exit(fail ? 1 : 0);
