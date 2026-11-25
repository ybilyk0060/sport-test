// Синтетические позы прыжков «зірочка» (вид спереди): в имитаторе студии их нет.
import * as mock from './studio-mock-poses.mjs';
export function jackFrame(open /*0..1*/, { arms = true, legs = true } = {}) {
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
export function jacks(n, opt) { const f = []; for (let i = 0; i < 10; i++) f.push(jackFrame(0, opt)); for (let k = 0; k < n; k++) { for (let i = 1; i <= 8; i++) f.push(jackFrame(i / 8, opt)); for (let i = 0; i < 2; i++) f.push(jackFrame(1, opt)); for (let i = 1; i <= 8; i++) f.push(jackFrame(1 - i / 8, opt)); for (let i = 0; i < 4; i++) f.push(jackFrame(0, opt)); } return f; }

// Нахили «Доброго ранку» (вид збоку): bend 0..1 → нахил тулуба від вертикалі до maxDeg.
export function goodMorningFrame(bend, maxDeg = 120) {
  const P = (x, y) => mock.pt(x, y); const lm = Array.from({ length: 33 }, () => P(0.5, 0.5));
  const a = (bend * maxDeg) * Math.PI / 180, T = 0.22;
  const hip = { x: 0.45, y: 0.55 };
  const sh = { x: hip.x + T * Math.sin(a), y: hip.y - T * Math.cos(a) };
  for (const [s, dx] of [[0, 0.006], [1, -0.006]]) {
    lm[11 + s] = P(sh.x + dx, sh.y); lm[23 + s] = P(hip.x + dx, hip.y);
    lm[25 + s] = P(hip.x + dx + 0.01, 0.72); lm[27 + s] = P(hip.x + dx, 0.89);
    lm[13 + s] = P(sh.x + dx - 0.03 * Math.cos(a), sh.y - 0.03 * Math.sin(a) - 0.02); lm[15 + s] = P(sh.x + dx + 0.02 * Math.sin(a), sh.y - 0.04 * Math.cos(a));
  }
  for (const i of [29, 31]) lm[i] = P(lm[27].x + 0.03, 0.9); for (const i of [30, 32]) lm[i] = P(lm[28].x + 0.03, 0.9);
  lm[0] = P(sh.x + 0.07 * Math.sin(a) + 0.02, sh.y - 0.07 * Math.cos(a));
  return lm;
}
export function goodMornings(n, maxDeg = 120) { const f = []; for (let i = 0; i < 10; i++) f.push(goodMorningFrame(0, maxDeg)); for (let k = 0; k < n; k++) { for (let i = 1; i <= 12; i++) f.push(goodMorningFrame(i / 12, maxDeg)); for (let i = 0; i < 4; i++) f.push(goodMorningFrame(1, maxDeg)); for (let i = 1; i <= 12; i++) f.push(goodMorningFrame(1 - i / 12, maxDeg)); for (let i = 0; i < 6; i++) f.push(goodMorningFrame(0, maxDeg)); } return f; }

// Торкання плечей в упорі лежачи, обличчям до камери (телефон на підлозі перед дитиною).
// tap 0..1 — рука від підлоги до протилежного плеча; side 'left' | 'right' | null.
export function shoulderTapFrame(side, tap, { reach = 1 } = {}) {
  const P = (x, y) => mock.pt(x, y); const lm = Array.from({ length: 33 }, () => P(0.5, 0.5));
  const L = { sh: [0.6, 0.55], el: [0.61, 0.67], wr: [0.62, 0.79] }, R = { sh: [0.4, 0.55], el: [0.39, 0.67], wr: [0.38, 0.79] };
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const t = tap * reach;
  const arm = (me, other, sgn) => ({ el: mix(me.el, [me.sh[0] - 0.05 * sgn, 0.65], t), wr: mix(me.wr, [other.sh[0] + 0.02 * sgn, 0.56], t) });
  const l = side === 'left' ? arm(L, R, 1) : L, r = side === 'right' ? arm(R, L, -1) : R;
  lm[11] = P(...L.sh); lm[12] = P(...R.sh); lm[13] = P(...l.el); lm[14] = P(...r.el); lm[15] = P(...l.wr); lm[16] = P(...r.wr);
  lm[0] = P(0.5, 0.47); lm[23] = P(0.54, 0.44); lm[24] = P(0.46, 0.44);
  for (const i of [25, 26, 27, 28, 29, 30, 31, 32]) lm[i] = { ...P(0.5, 0.4), visibility: 0.1 };
  return lm;
}
export function shoulderTaps(n, opt) { const f = []; for (let i = 0; i < 10; i++) f.push(shoulderTapFrame(null, 0)); for (let k = 0; k < n; k++) { const s = k % 2 ? 'right' : 'left'; for (let i = 1; i <= 8; i++) f.push(shoulderTapFrame(s, i / 8, opt)); for (let i = 0; i < 3; i++) f.push(shoulderTapFrame(s, 1, opt)); for (let i = 1; i <= 8; i++) f.push(shoulderTapFrame(s, 1 - i / 8, opt)); for (let i = 0; i < 4; i++) f.push(shoulderTapFrame(null, 0)); } return f; }
