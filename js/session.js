// Прогон одного упражнения: кадры → сглаживание студии → движок студии → счёт + показатели.
// Из каждого упражнения берём не только счёт: темп, ритм, глубину, симметрию, устойчивость.
// Сохраняются только итоговые числа. Кадры и точки тела не сохраняются и не отправляются.

import { SpecEngine, ExerciseAnalyzer, PoseSmoother, calibrationForAge } from './engine/kidsney-engine.js?v=a1df8bb-mwwd9zb4';
import { SPECS } from './engine/specs.js?v=a1df8bb-mwwd9zb4';
import { CONFIG } from './config.js?v=a1df8bb-mwwd9zb4';
import { detectPose } from './pose.js?v=a1df8bb-mwwd9zb4';

const VIS = 0.5;
const seen = (p) => p && p.visibility >= VIS && p.x > 0 && p.x < 1 && p.y > 0 && p.y < 1;

// Проверка перед стартом: голова и стопы в кадре.
export function framingCheck(lm) {
  if (!lm || lm.length < 29) return { body: false, head: false, feet: false, ok: false };
  const head = seen(lm[0]) && lm[0].y > 0.02;
  const feet = (seen(lm[27]) || seen(lm[28])) && Math.max(lm[27].y, lm[28].y) < 0.985;
  const body = [11, 12, 23, 24].filter((i) => lm[i] && lm[i].visibility >= VIS).length >= 3;
  return { body, head, feet, ok: body && head && feet };
}

// Цикл кадров по <video>: живая камера или запись. Возвращает функцию остановки.
export function frameLoop(video, onFrame) {
  let stopped = false, lastTime = -1, raf = 0;
  const useRvfc = typeof video.requestVideoFrameCallback === 'function';
  const step = () => {
    if (stopped) return;
    if (video.readyState >= 2 && video.currentTime !== lastTime) {
      lastTime = video.currentTime;
      onFrame(detectPose(video));
    }
    schedule();
  };
  const schedule = () => {
    if (stopped) return;
    if (useRvfc) video.requestVideoFrameCallback(step); else raf = requestAnimationFrame(step);
  };
  // На случай, если rVFC не срабатывает (вкладка в фоне, пауза): страховочный таймер.
  const guard = setInterval(() => { if (!stopped && useRvfc && video.paused && !video.ended) video.play().catch(() => {}); }, 1000);
  schedule();
  return () => { stopped = true; cancelAnimationFrame(raf); clearInterval(guard); };
}

const std = (a) => { const m = a.reduce((s, x) => s + x, 0) / a.length; return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / a.length); };
const meanOf = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : null);
const pct = (a, p) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.max(0, Math.round(p * (s.length - 1))))]; };

// Создаёт прогон упражнения. clock() — время в мс (живая камера: performance.now, запись: позиция в видео).
export function createRun({ key, target, capSec, ageGroup, aspect, clock, on }) {
  const ex = CONFIG.exercises[key] || {};
  const spec = SPECS[ex.spec || key];
  const isSeconds = spec.goal === 'seconds';
  const engine = new SpecEngine(spec);
  const an = new ExerciseAnalyzer(engine, isSeconds ? 0 : target, spec.gates?.minVisibility ?? 0.5, isSeconds ? target : 0);
  const age = (CONFIG.ageGroups[ageGroup] || CONFIG.ageGroups[CONFIG.defaultAge]).engineAge;
  an.setCalibration(calibrationForAge(ex.maxEngineAge ? Math.min(age, ex.maxEngineAge) : age));
  if (aspect) an.setFrameAspect(aspect);
  const smoother = new PoseSmoother();
  // Второй способ счёта (віджимання лицом к камере): свой анализатор, берётся больший счёт
  let an2 = null;
  if (ex.altSpec && SPECS[ex.altSpec]) {
    const spec2 = SPECS[ex.altSpec];
    an2 = new ExerciseAnalyzer(new SpecEngine(spec2), isSeconds ? 0 : target, spec2.gates?.minVisibility ?? 0.5, 0);
    an2.setCalibration(calibrationForAge(ex.maxEngineAge ? Math.min(age, ex.maxEngineAge) : age));
    if (aspect) an2.setFrameAspect(aspect);
  }
  const facingHints = new Set([spec.facingHint, ex.altSpec && SPECS[ex.altSpec] ? SPECS[ex.altSpec].facingHint : null, 'turn_sideways', 'jumping_jack_face_wrong'].filter(Boolean));
  const reps = () => Math.max(an.repsCompleted, an2 ? an2.repsCompleted : 0);

  const m = { hints: {}, lostFrames: 0, frames: 0 };
  const perRep = { armDiffs: [], feet: [], depths: [] };
  let cur = { wl: -Infinity, wr: -Infinity, feet: 0, depth: 0 };
  const lifts = { left: 0, right: 0 };
  const hipLine = [];
  let startedAt = null, firstActionAt = null, finished = false, lastCount = 0, lastSec = 0, result = null;

  an.onHint = (id) => { if (an2 && facingHints.has(id)) return; m.hints[id] = (m.hints[id] || 0) + 1; on.hint && on.hint(id); };
  engine.onEvent = (e) => {
    if (e.type === 'lift' && e.counted) { lifts[e.side] = (lifts[e.side] || 0) + 1; if (firstActionAt == null) firstActionAt = clock(); }
  };

  function finish(reason) {
    if (finished) return result;
    finished = true;
    const now = clock();
    const elapsedFrom = isSeconds && key === 'high_knees' && firstActionAt != null ? firstActionAt : startedAt;
    const elapsedSec = startedAt == null ? 0 : Math.max(0, (now - (elapsedFrom ?? now)) / 1000);
    const done = isSeconds ? Math.min(target, Math.round(an.heldSeconds() * 10) / 10) : reps();
    const ts = an2 && an2.repsCompleted > an.repsCompleted ? an2.repTimestamps : an.repTimestamps;
    const iv = []; for (let i = 1; i < ts.length; i++) iv.push(ts[i] - ts[i - 1]);
    const metrics = {};
    if (!isSeconds) {
      metrics.rhythmCv = iv.length >= 2 ? Math.round((std(iv) / meanOf(iv)) * 100) / 100 : null;
      metrics.tempoPerMin = iv.length >= 1 ? Math.round(60000 / meanOf(iv)) : null;
    }
    if (key === 'jumping_jack') {
      metrics.armDiff = perRep.armDiffs.length ? Math.round(meanOf(perRep.armDiffs) * 100) / 100 : null;
      metrics.feetSpread = perRep.feet.length ? Math.round(meanOf(perRep.feet) * 100) / 100 : null;
    }
    if (key === 'squats') {
      metrics.depth = perRep.depths.length ? Math.round(meanOf(perRep.depths) * 100) / 100 : null;
      metrics.shallow = m.hints.sit_lower || 0;
    }
    if (key === 'good_morning') metrics.shallow = m.hints.good_morning_not_reached || 0;
    if (key === 'arm_circles') metrics.shallow = m.hints.arm_circles_not_reached || 0;
    if (key === 'quadruped_arm_circles') metrics.shallow = m.hints.quadruped_arm_circles_not_reached || 0;
    if (key === 'wall_french_press') metrics.shallow = m.hints.wall_french_press_not_reached || 0;
    if (key === 'pushups') { metrics.shallow = (m.hints.go_lower || 0); metrics.view = an2 && an2.repsCompleted > an.repsCompleted ? 'front' : 'side'; }
    if (key === 'shoulder_taps') {
      metrics.liftsLeft = lifts.left || 0; metrics.liftsRight = lifts.right || 0;
      metrics.shallow = m.hints.shoulder_taps_not_reached || 0;
    }
    if (key === 'high_knees') {
      metrics.liftsLeft = lifts.left || 0; metrics.liftsRight = lifts.right || 0;
      metrics.cadence = done > 0 ? Math.round(((lifts.left + lifts.right) / done) * 10) / 10 : null;
    }
    if (key === 'plank') {
      metrics.driftDeg = hipLine.length >= 15 ? Math.round((pct(hipLine, 0.95) - pct(hipLine, 0.05)) * 10) / 10 : null;
      metrics.broken = an.holdPhase() === 'broken';
    }
    result = {
      key, target, capSec, done, completed: done >= target, skipped: reason === 'skip',
      elapsedSec: Math.round(elapsedSec * 10) / 10, reason, metrics,
      spec: `${spec.key}@${spec.version}`,
    };
    on.finish && on.finish(result);
    return result;
  }

  return {
    isSeconds,
    start() { startedAt = clock(); },
    skip() { return finish('skip'); },
    end(reason = 'ended') { return finish(reason); },
    get finished() { return finished; },
    debug() { return an.debugInfo(); },
    // Один кадр. lm — точки позы или null.
    frame(lm) {
      if (finished || startedAt == null) return;
      const now = clock();
      m.frames++;
      let metricsNow;
      if (lm) {
        const sm = smoother.smooth(lm.map((p) => ({ x: p.x, y: p.y, z: p.z || 0, visibility: p.visibility ?? 0 })), now);
        metricsNow = an.processFrame(sm, now);
        if (an2) { const m2 = an2.processFrame(sm, now); if (m2.repsCompleted > metricsNow.repsCompleted) metricsNow = { ...metricsNow, repsCompleted: m2.repsCompleted, isComplete: m2.isComplete || metricsNow.isComplete }; }
      } else {
        m.lostFrames++;
        if (an.isHold()) an.processFrame([], now);
        metricsNow = an.getMetrics();
      }
      const v = engine.lastValues;
      if (key === 'jumping_jack') {
        const wl = v.get('wrist_h'), wr = v.get('wrist_h_r'), f = v.get('feet');
        if (wl != null && wl > cur.wl) { cur.wl = wl; cur.wr = wr ?? cur.wr; }
        if (f != null && f > cur.feet) cur.feet = f;
      } else if (key === 'squats') {
        const d = v.get('hip_drop'); if (d != null && d > cur.depth) cur.depth = d;
      } else if (key === 'plank' && an.holdPhase() === 'holding') {
        const h = v.get('hip_line'); if (h != null) hipLine.push(h);
      }

      if (!isSeconds && metricsNow.repsCompleted > lastCount) {
        lastCount = metricsNow.repsCompleted;
        if (firstActionAt == null) firstActionAt = now;
        if (key === 'jumping_jack') { if (cur.wl > -Infinity && cur.wr > -Infinity) perRep.armDiffs.push(Math.abs(cur.wl - cur.wr)); perRep.feet.push(cur.feet); }
        if (key === 'squats') perRep.depths.push(cur.depth);
        cur = { wl: -Infinity, wr: -Infinity, feet: 0, depth: 0 };
        on.count && on.count(lastCount);
      }
      if (isSeconds) {
        const held = an.heldSeconds();
        const sec = Math.floor(held);
        if (sec > lastSec) { lastSec = sec; on.count && on.count(sec); }
        on.phase && on.phase(an.holdPhase(), held);
        if (key === 'plank' && an.holdPhase() === 'broken') return finish('broken');
      }
      const elapsed = (now - startedAt) / 1000;
      on.tick && on.tick({ elapsed, left: Math.max(0, capSec - elapsed), facingWrong: an.isFacingCamera() });
      if (metricsNow.isComplete) return finish('complete');
      if (elapsed >= capSec) return finish('time');
    },
  };
}
