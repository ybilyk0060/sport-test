// Второй человек в кадре (js/personlock.js): счёт держится за своего.
import { createPersonLock } from '../js/personlock.js';
let fail = 0;
const check = (name, ok, extra) => { console.log(ok ? 'OK  ' : 'FAIL', name, ok ? '' : JSON.stringify(extra)); if (!ok) fail++; };
// человек: центр по x, масштаб (1 — во весь рост), full — голова и стопы в кадре
function person(x, scale = 1, full = true, tag = 0) {
  const p = Array.from({ length: 33 }, () => ({ x, y: 0.5, visibility: 0.9, tag }));
  const y = (v) => 0.5 + (v - 0.5) * scale;
  p[0] = { x, y: full ? y(0.12) : -0.05, visibility: full ? 0.9 : 0.1, tag };
  p[11] = { x: x - 0.05 * scale, y: y(0.25), visibility: 0.9, tag }; p[12] = { x: x + 0.05 * scale, y: y(0.25), visibility: 0.9, tag };
  p[23] = { x: x - 0.03 * scale, y: y(0.5), visibility: 0.9, tag }; p[24] = { x: x + 0.03 * scale, y: y(0.5), visibility: 0.9, tag };
  p[27] = { x, y: full ? y(0.9) : 1.1, visibility: full ? 0.9 : 0.1, tag }; p[28] = { x, y: full ? y(0.9) : 1.1, visibility: full ? 0.9 : 0.1, tag };
  return p;
}
const L = createPersonLock();
let t = 0;
const pick = (poses) => { t += 33; const r = L.pick(poses, t); return r ? r[0].tag : null; };
check('один ребёнок целиком — закрепились', pick([person(0.5, 0.8, true, 1)]) === 1 && L.locked);
check('зашёл взрослый сбоку (крупнее, не целиком) — считаем ребёнка', pick([person(0.85, 1.3, false, 2), person(0.5, 0.8, true, 1)]) === 1);
check('модель отдала только взрослого — кадр пропущен', pick([person(0.85, 1.3, false, 2)]) === null);
check('ребёнок прыгает (центр сдвинулся на полкорпуса) — свой', pick([person(0.53, 0.82, true, 1)]) === 1);
// свой ушёл, в кадре другой ребёнок целиком дольше 2,5 с — переключаемся
let r = null; for (let i = 0; i < 90; i++) r = pick([person(0.2, 0.7, true, 3)]);
check('свой ушёл, другой встал целиком — через 2,5 с закрепились за ним', r === 3);
L.reset(true);
check('упражнение на полу: закрепление без головы и стоп', pick([person(0.5, 0.9, false, 4)]) === 4);
console.log(fail ? `\n${fail} FAILED` : '\nALL OK'); process.exit(fail ? 1 : 0);
