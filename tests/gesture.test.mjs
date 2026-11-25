// Жест «Підніми руку»: одна рука над головой 1,5 с → срабатывание; обе руки вверх и короткий взмах — нет.
import { createRaiseHand, raisedHand } from '../js/gesture.js';
let fail = 0; const check = (n, ok, got) => { console.log(`${ok ? 'OK  ' : 'FAIL'} ${n}${got !== undefined ? ': ' + JSON.stringify(got) : ''}`); if (!ok) fail++; };
const P = (x, y, v = 0.95) => ({ x, y, visibility: v });
function pose(left, right) { // 'up' | 'down'
  const lm = Array.from({ length: 33 }, () => P(0.5, 0.5));
  lm[0] = P(0.5, 0.2); lm[11] = P(0.58, 0.3); lm[12] = P(0.42, 0.3);
  const arm = (side, st) => { const sx = side === 'l' ? 0.58 : 0.42, d = side === 'l' ? 0.04 : -0.04; return st === 'up' ? [P(sx + d, 0.2), P(sx + d, 0.08)] : [P(sx + d, 0.4), P(sx + d, 0.5)]; };
  [lm[13], lm[15]] = arm('l', left); [lm[14], lm[16]] = arm('r', right);
  return lm;
}
const run = (frames) => { const g = createRaiseHand(); let t = 0, fired = -1; frames.forEach((f, i) => { const r = g.frame(f, t); if (r.fired && fired < 0) fired = i; t += 33; }); return fired; };
check('одна рука вверх — жест', !!raisedHand(pose('up', 'down')) && !!raisedHand(pose('down', 'up')));
check('обе вверх — не жест', !raisedHand(pose('up', 'up')));
check('руки опущены — не жест', !raisedHand(pose('down', 'down')));
const hold = Array.from({ length: 60 }, () => pose('up', 'down'));
const f = run(hold); check('срабатывает через ~1,5 с', f >= 44 && f <= 47, f);
check('короткий взмах 0,5 с — нет', run([...Array.from({ length: 15 }, () => pose('up', 'down')), ...Array.from({ length: 60 }, () => pose('down', 'down'))]) === -1);
check('пропуск 0,2 с не сбрасывает', run([...Array.from({ length: 30 }, () => pose('up', 'down')), ...Array.from({ length: 6 }, () => pose('down', 'down')), ...Array.from({ length: 30 }, () => pose('up', 'down'))]) > 0);
console.log(fail ? `\n${fail} FAILED` : '\nALL OK'); process.exit(fail ? 1 : 0);
