// Один человек в кадре (Юрий 27.11): если в кадр заходит второй, счёт не должен на него переключаться.
// Закрепляемся за тем, кто встал в кадр целиком (голова и стопы видны), и дальше берём из поз на кадре ту, что ближе
// всего к нему по положению и размеру корпуса. Поза «прыгнула» к чужому человеку — кадр пропускаем; если «своего»
// нет дольше RELOCK_MS, а в кадре ровно один человек целиком — закрепляемся за ним (свой ушёл, пришёл другой ребёнок).
// Чистая логика без браузера — проверяется в tests/personlock.test.mjs.

export const PL = { MAX_JUMP: 1.4, SIZE_MIN: 0.6, SIZE_MAX: 1.65, RELOCK_MS: 2500, VIS: 0.3, SMOOTH: 0.3 };

const v = (p) => p && (p.visibility ?? 1) >= PL.VIS;
export function bodyOf(lm) {
  if (!lm || lm.length < 29) return null;
  const sh = [lm[11], lm[12]].filter(v), hp = [lm[23], lm[24]].filter(v);
  if (!sh.length || !hp.length) return null;
  const m = (a) => ({ x: a.reduce((s, p) => s + p.x, 0) / a.length, y: a.reduce((s, p) => s + p.y, 0) / a.length });
  const s = m(sh), h = m(hp);
  const torso = Math.hypot(s.x - h.x, s.y - h.y);
  if (!(torso > 0.02)) return null;
  const full = v(lm[0]) && lm[0].y > 0.01 && [lm[27], lm[28]].some((p) => v(p) && p.y < 0.99);
  return { x: (s.x + h.x) / 2, y: (s.y + h.y) / 2, torso, full };
}

export function createPersonLock() {
  let lock = null, missSince = null, floor = false;
  return {
    get locked() { return !!lock; },
    // новое упражнение: закрепление заново (на полу корпус другого размера, голова/стопы не обязательны)
    reset(onFloor = false) { lock = null; missSince = null; floor = onFloor; },
    // poses — массив поз (каждая — 33 точки), now — мс. Возвращает позу «своего» человека или null.
    pick(poses, now) {
      const cands = (poses || []).map((lm) => ({ lm, b: bodyOf(lm) })).filter((c) => c.b);
      if (!lock) {
        // закрепляемся за первым, кто виден целиком (если таких несколько — за самым крупным: он ближе к телефону)
        const full = cands.filter((c) => c.b.full || floor).sort((a, b) => b.b.torso - a.b.torso)[0];
        if (full) { lock = { ...full.b }; missSince = null; return full.lm; }
        return cands.length === 1 ? cands[0].lm : (cands.sort((a, b) => b.b.torso - a.b.torso)[0] || {}).lm || null; // до закрепления — как раньше
      }
      let best = null, bestD = Infinity;
      for (const c of cands) {
        const d = Math.hypot(c.b.x - lock.x, c.b.y - lock.y) / lock.torso, r = c.b.torso / lock.torso;
        if (d <= PL.MAX_JUMP && r >= PL.SIZE_MIN && r <= PL.SIZE_MAX && d < bestD) { best = c; bestD = d; }
      }
      if (best) {
        missSince = null;
        lock.x += (best.b.x - lock.x) * (1 - PL.SMOOTH); lock.y += (best.b.y - lock.y) * (1 - PL.SMOOTH); lock.torso += (best.b.torso - lock.torso) * (1 - PL.SMOOTH);
        return best.lm;
      }
      missSince = missSince ?? now;
      if (now - missSince > PL.RELOCK_MS) {
        const full = cands.filter((c) => c.b.full || floor);
        if (full.length === 1) { lock = { ...full[0].b }; missSince = null; return full[0].lm; }
      }
      return null;
    },
  };
}
