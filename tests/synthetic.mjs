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
