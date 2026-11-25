// Баланс на одной ноге (стойка «фламинго» упрощённо): ребёнок лицом к камере, одна нога поднята.
// Время удержания — сколько секунд подряд стопа поднятой ноги выше опорной. Своя логика сайта (в Студії вправ
// balance_stand ещё в статусе testing). Чистая функция кадров — проверяется в tests/balance.test.mjs.
//
// Правила (рабочие, до утверждения протокола):
//   нога поднята   — разница высоты щиколоток ≥ LIFT × длины корпуса (плечи–таз)
//   старт отсчёта  — нога поднята непрерывно START_MS
//   потеря баланса — нога опущена дольше DROP_MS (короткое касание прощаем) → попытка закончена
//   нет человека в кадре дольше LOST_MS → тоже конец попытки
// Метрика качества: покачивание таза по горизонтали (СКО в длинах корпуса) за время удержания.

export const BAL = { LIFT: 0.15, START_MS: 400, DROP_MS: 500, LOST_MS: 1200, MIN_VIS: 0.5 };

const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

// Одна поза → { ok, lifted, side, hipX, torso }
export function balanceFrame(lm) {
  if (!lm || lm.length < 29) return { ok: false };
  const ls = lm[11], rs = lm[12], lh = lm[23], rh = lm[24], la = lm[27], ra = lm[28];
  const vis = (p) => p && (p.visibility ?? 1) >= BAL.MIN_VIS;
  if (![ls, rs, lh, rh, la, ra].every(vis)) return { ok: false };
  const hip = mid(lh, rh);
  const torso = dist(mid(ls, rs), hip);
  if (!(torso > 0.02)) return { ok: false };
  const diff = (ra.y - la.y) / torso; // >0: левая щиколотка выше (левая нога поднята)
  const lifted = Math.abs(diff) >= BAL.LIFT;
  return { ok: true, lifted, side: lifted ? (diff > 0 ? 'left' : 'right') : null, hipX: hip.x / torso, torso };
}

// Прогон в интерфейсе createRun (session.js): target — секунды, capSec — сколько ждём начала и держим всего.
export function createBalanceRun({ key, target, capSec, clock, on, leg = null }) {
  let startedAt = null, finished = false, result = null;
  let liftSince = null, holdStart = null, dropSince = null, lostSince = null, lastSec = 0, side = null, held = 0;
  const xs = [];
  const sides = { left: 0, right: 0 };

  function finish(reason) {
    if (finished) return result;
    finished = true;
    const now = clock();
    if (holdStart != null) held = Math.max(held, (Math.min(now, dropSince ?? lostSince ?? now) - holdStart) / 1000);
    const done = Math.min(target, Math.round(held * 10) / 10);
    const m = xs.length >= 10 ? xs.reduce((s, x) => s + x, 0) / xs.length : null;
    const sway = m == null ? null : Math.round(Math.sqrt(xs.reduce((s, x) => s + (x - m) ** 2, 0) / xs.length) * 1000) / 1000;
    result = {
      key, target, capSec, done, completed: done >= target, skipped: reason === 'skip',
      elapsedSec: startedAt == null ? 0 : Math.round(((now - startedAt) / 1000) * 10) / 10, reason,
      metrics: { sway, side, leg, liftsLeft: sides.left, liftsRight: sides.right }, spec: 'balance@site1',
    };
    on.finish && on.finish(result);
    return result;
  }

  return {
    isSeconds: true,
    start() { startedAt = clock(); },
    skip() { return finish('skip'); },
    end(reason = 'ended') { return finish(reason); },
    get finished() { return finished; },
    debug() { return { held, holdStart, side }; },
    frame(lm) {
      if (finished || startedAt == null) return;
      const now = clock();
      const f = balanceFrame(lm);
      if (!f.ok) {
        lostSince = lostSince ?? now;
        if (holdStart != null && now - lostSince > BAL.LOST_MS) return finish('lost');
      } else {
        lostSince = null;
        if (f.lifted) {
          dropSince = null;
          liftSince = liftSince ?? now;
          if (holdStart == null && now - liftSince >= BAL.START_MS) { holdStart = liftSince; side = f.side; sides[f.side]++; }
          if (holdStart != null) xs.push(f.hipX);
        } else {
          liftSince = null;
          if (holdStart != null) {
            dropSince = dropSince ?? now;
            if (now - dropSince > BAL.DROP_MS) return finish('broken');
          }
        }
      }
      if (holdStart != null && dropSince == null && lostSince == null) {
        held = (now - holdStart) / 1000;
        const sec = Math.floor(held);
        if (sec > lastSec) { lastSec = sec; on.count && on.count(Math.min(sec, target)); }
        on.phase && on.phase('holding', held);
        if (held >= target) return finish('complete');
      }
      const elapsed = (now - startedAt) / 1000;
      on.tick && on.tick({ elapsed, left: Math.max(0, capSec - elapsed), facingWrong: false });
      if (elapsed >= capSec) return finish('time');
    },
  };
}
