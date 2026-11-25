// Жест «Підніми руку» = «Далі», как во всех приложениях Kidsney (src/apps/game/domain/gestures/raiseHand.ts, 31.10).
// Одна рука над головой, другая опущена; удержание 1,5 с; короткий пропуск (≤ 250 мс) прогресс не сбрасывает.
// Обе руки вверх — не жест (зірочка). Точки — только аргумент кадра, ничего не хранится.

export const RAISE = { holdMs: 1500, graceMs: 250, minWristVis: 0.6, minDownWristVis: 0.5, aboveNoseSw: 0.5, swMin: 0.05 };
const ok = (p) => p && Number.isFinite(p.x) && Number.isFinite(p.y);

export function raisedHand(lm, c = RAISE) {
  if (!lm || lm.length < 17) return null;
  const [nose, ls, rs, le, re, lw, rw] = [lm[0], lm[11], lm[12], lm[13], lm[14], lm[15], lm[16]];
  if (![nose, ls, rs, le, re, lw, rw].every(ok)) return null;
  const sw = Math.max(Math.abs(ls.x - rs.x), c.swMin);
  const head = nose.y - c.aboveNoseSw * sw;
  const up = (w, e, s) => (w.visibility ?? 0) > c.minWristVis && w.y < head && e.y < s.y;
  const down = (w, s) => (w.visibility ?? 0) > c.minDownWristVis && w.y > s.y;
  const L = up(lw, le, ls), R = up(rw, re, rs);
  if (L && !R && down(rw, rs)) return { side: 'left', x: lw.x, y: lw.y };
  if (R && !L && down(lw, ls)) return { side: 'right', x: rw.x, y: rw.y };
  return null;
}

// Детектор с удержанием по времени кадра. frame(lm, ts) → { progress 0..1, fired }
export function createRaiseHand(c = RAISE) {
  let since = null, lastSeen = null, fired = false;
  return {
    frame(lm, ts) {
      if (fired) return { progress: 1, fired: false };
      const hand = raisedHand(lm, c);
      if (hand) { if (since == null || ts - lastSeen > c.graceMs) since = ts; lastSeen = ts; }
      else if (lastSeen != null && ts - lastSeen > c.graceMs) { since = null; lastSeen = null; }
      const progress = since == null ? 0 : Math.min(1, (ts - since) / c.holdMs);
      if (progress >= 1) { fired = true; return { progress: 1, fired: true }; }
      return { progress, fired: false };
    },
  };
}
