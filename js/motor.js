// Оценочные упражнения теста (версия 3, Юрий 25.11): своя логика сайта по кадрам позы.
//   createSideJumpRun — прыжки через линию вбок (по образцу DMT 6–18): число пересечений линии за время попытки
//   createBendRun     — наклон вперёд стоя лицом к камере: уровень 1–4 (колени · середина голени · пальцы ног · ладони на полу)
// Чистые функции кадров — проверяются в tests/motor.test.mjs. Пороги рабочие, уточняются на данных.

const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const visible = (p, v = 0.5) => p && (p.visibility ?? 1) >= v;

function body(lm) {
  if (!lm || lm.length < 29) return null;
  const ls = lm[11], rs = lm[12], lh = lm[23], rh = lm[24];
  if (![ls, rs, lh, rh].every((p) => visible(p))) return null;
  const sh = mid(ls, rs), hip = mid(lh, rh);
  const torso = dist(sh, hip);
  if (!(torso > 0.02)) return null;
  return { sh, hip, torso };
}

function baseRun({ key, target, capSec, clock, on, isSeconds = false }, impl) {
  let startedAt = null, finished = false, result = null;
  const run = {
    isSeconds,
    start() { startedAt = clock(); impl.start && impl.start(startedAt); },
    skip() { return finish('skip'); },
    end(reason = 'ended') { return finish(reason); },
    get finished() { return finished; },
    debug() { return impl.debug ? impl.debug() : {}; },
    frame(lm) {
      if (finished || startedAt == null) return;
      const now = clock();
      const r = impl.frame(lm, now);
      if (r) return finish(r);
      const elapsed = (now - startedAt) / 1000;
      on.tick && on.tick({ elapsed, left: Math.max(0, capSec - elapsed), facingWrong: false });
      if (elapsed >= capSec) return finish('time');
    },
  };
  function finish(reason) {
    if (finished) return result;
    finished = true;
    const now = clock();
    const { done, metrics } = impl.result(now);
    result = {
      key, target, capSec, done, completed: done >= target, skipped: reason === 'skip',
      elapsedSec: startedAt == null ? 0 : Math.round(((now - startedAt) / 1000) * 10) / 10, reason, metrics, spec: `${key}@site1`,
    };
    on.finish && on.finish(result);
    return result;
  }
  return run;
}

// ---------- Прыжки через линию вбок ----------
// Ребёнок лицом к камере, линия на полу вертикально в кадре (между ним и телефоном). Каждый прыжок переносит таз на
// другую сторону линии. Положение линии берём из самих прыжков: середина между крайними положениями таза за последние 2 с.
// Прыжок засчитывается, когда таз перешёл с одной стороны на другую с запасом HYST (в длинах корпуса).
export const SJ = { HYST: 0.12, MIN_SPAN: 0.3, WINDOW_MS: 2000 };
export function createSideJumpRun(opts) {
  const { on } = opts;
  let jumps = 0, side = 0, firstAt = null, lastAt = null;
  const hist = []; // [t, x] — таз в длинах корпуса
  const times = [];
  return baseRun(opts, {
    frame(lm, now) {
      const b = body(lm); if (!b) return null;
      const x = b.hip.x / b.torso;
      hist.push([now, x]); while (hist.length && now - hist[0][0] > SJ.WINDOW_MS) hist.shift();
      let lo = Infinity, hi = -Infinity; for (const [, v] of hist) { if (v < lo) lo = v; if (v > hi) hi = v; }
      if (hi - lo < SJ.MIN_SPAN) return null; // ещё не прыгает (или прыгает на месте)
      const c = (lo + hi) / 2;
      const s = x > c + SJ.HYST ? 1 : x < c - SJ.HYST ? -1 : 0;
      if (s !== 0 && s !== side) {
        if (side !== 0) { jumps++; times.push(now); firstAt = firstAt ?? now; lastAt = now; on.count && on.count(jumps); }
        side = s;
      }
      return null;
    },
    result() {
      const iv = []; for (let i = 1; i < times.length; i++) iv.push(times[i] - times[i - 1]);
      const half = times.length >= 4 ? (() => { const m = Math.floor(times.length / 2); const a = (times[m - 1] - times[0]) / (m - 1); const b = (times[times.length - 1] - times[m]) / (times.length - 1 - m); return Math.round((b / a) * 100) / 100; })() : null;
      return { done: jumps, metrics: { tempoPerMin: iv.length ? Math.round(60000 / (iv.reduce((s, v) => s + v, 0) / iv.length)) : null, slowdown: half } };
    },
    debug: () => ({ jumps, side }),
  });
}

// ---------- Наклон вперёд стоя ----------
// Ребёнок лицом к камере. Уровень — где кисти относительно колена и щиколотки: t = (кисть − колено) / (щиколотка − колено) по вертикали.
//   1 — наклонился, кисти выше колена; 2 — до середины голени; 3 — до щиколотки (кончики пальцев ниже запястья); 4 — ниже щиколотки / ладони на полу.
// Прогоны на iPhone 26.11 (запись позы): (1) корпус закрывает таз — его нельзя брать для проверки коленей;
// (2) когда кисти у стоп, модель путает кисти и щиколотки — «щиколотки» прыгают вверх на 10 % кадра, голень «укорачивается»,
// и прямые ноги считались согнутыми, а уровень считался от неверной голени. Поэтому колени и щиколотки запоминаем СТОЯ
// (во время наклона они не двигаются), уровень меряем от них, а согнутые колени ловим по опусканию колена ниже стоячего
// (колено при сгибе лицом к камере уходит вниз). Ребёнок касается и сразу встаёт: удержание HOLD_MS 0,4 с (было 1 с — не засчитывалось).
export const BEND = { L1: -0.6, L2: 0.45, L3: 0.85, L4: 1.0, KNEE_DROP: 0.25, HOLD_MS: 400, UP_MS: 500, ATTEMPTS: 2, START_T: -0.3, UP_T: -0.6 };
export function bendLevel(t) { return t >= BEND.L4 ? 4 : t >= BEND.L3 ? 3 : t >= BEND.L2 ? 2 : t >= BEND.L1 ? 1 : 0; }
export function createBendRun(opts) {
  const { on } = opts;
  let best = 0, attempts = 0, bentKnees = 0, ref = null, inBend = false, cand = 0, candSince = null, attemptBest = 0, kneeWarnAt = -1e9, upSince = null;
  return baseRun(opts, {
    frame(lm, now) {
      if (!lm || lm.length < 29) return null;
      const lk = lm[25], rk = lm[26], la = lm[27], ra = lm[28], lw = lm[15], rw = lm[16];
      const wy = Math.max(visible(lw, 0.3) ? lw.y : -1, visible(rw, 0.3) ? rw.y : -1);
      if (!inBend) {
        // стоя: запоминаем колени и щиколотки (сглаживаем)
        if (![lk, rk, la, ra].every((p) => visible(p, 0.4))) return null;
        const k = mid(lk, rk).y, a = mid(la, ra).y;
        if (!(a - k > 0.02)) return null;
        ref = ref ? { k: ref.k * 0.8 + k * 0.2, a: ref.a * 0.8 + a * 0.2 } : { k, a };
      }
      if (!ref || wy < 0) return null;
      const shin = ref.a - ref.k;
      const t = (wy - ref.k) / shin;
      const kneeY = visible(lk, 0.4) && visible(rk, 0.4) ? mid(lk, rk).y : ref.k;
      const kneesOk = kneeY - ref.k < BEND.KNEE_DROP * shin;
      if (!inBend && t >= BEND.START_T) { inBend = true; attemptBest = 0; upSince = null; }
      if (inBend) {
        if (!kneesOk) { cand = 0; candSince = null; if (now - kneeWarnAt > 3000) { kneeWarnAt = now; bentKnees++; on.hint && on.hint('bend_knees_straight'); } }
        else {
          const lv = bendLevel(t);
          if (lv !== cand) { cand = lv; candSince = now; }
          if (cand > attemptBest && now - candSince >= BEND.HOLD_MS) { attemptBest = cand; if (attemptBest > best) { best = attemptBest; on.count && on.count(best); } }
        }
        if (t < BEND.UP_T) { upSince = upSince ?? now; if (now - upSince >= BEND.UP_MS) { inBend = false; attempts++; if (attempts >= BEND.ATTEMPTS || best >= 4) return 'complete'; } }
        else upSince = null;
      }
      return null;
    },
    result() { return { done: best, metrics: { attempts, bentKnees } }; },
    debug: () => ({ best, attempts, inBend }),
  });
}
