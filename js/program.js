// ЧТО ПОЛУЧАЕТ ПОДПИСЧИК: программа на 4 недели, 3 тренировки в неделю, с камерой и голосом, как в тесте.
// Чистые функции без браузера (проверяются в tests/rules.test.mjs).
//
// Акцент — от того, что ребёнку нравится (ответ квиза likes): «команда и мяч» → бег и ловкость, «борьба» → сила и т. д.
// Плюс одно упражнение на самое слабое качество из теста. Дозировка — от собственного результата ребёнка
// в тесте и растёт каждую неделю на небольшой шаг. Упражнения — только 5 вправ теста (их считает камера).

import { CONFIG } from './config.js?v=ff3d1e2-mwwor4iu';
import { QUALITIES } from './scoring.js?v=ff3d1e2-mwwor4iu';

export const WEEKS = 4;
export const PER_WEEK = 3;

// Интерес ребёнка → упражнения-основа (по порядку важности). 'ARMS' — упражнение на руки/корпус из набора возраста.
export const FOCUS = {
  team: ['high_knees', 'jumping_jack', 'squats'],
  solo: ['high_knees', 'squats', 'arm_circles'],
  music: ['jumping_jack', 'arm_circles', 'high_knees'],
  fight: ['squats', 'ARMS', 'jumping_jack'],
  climb: ['ARMS', 'squats', 'arm_circles'],
  none: ['jumping_jack', 'squats', 'high_knees'],
};
// Качество → упражнение, которое его развивает
const FOR_QUALITY = { coordination: 'jumping_jack', legs: 'squats', speed: 'high_knees', flex: 'arm_circles', core: 'ARMS', arms: 'ARMS', symmetry: 'jumping_jack', balance: 'squats', endurance: 'high_knees' };
// Шаг роста за неделю и минимум недели 1
const DOSE = {
  jumping_jack: { min: 5, step: 2 },
  squats: { min: 4, step: 2 },
  high_knees: { min: 8, step: 4 },
  arm_circles: { min: 5, step: 2 },
  quadruped_arm_circles: { min: 4, step: 2 },
  wall_french_press: { min: 6, step: 2 },
  pushups: { min: 4, step: 2 },
  good_morning: { min: 4, step: 2 },
  shoulder_taps: { min: 6, step: 2 },
  cross_crawl: { min: 6, step: 2 }, glute_bridge: { min: 5, step: 2 }, side_bend: { min: 6, step: 2 }, side_leg_raise: { min: 6, step: 2 }, superman_lifts: { min: 4, step: 2 }, tuck_jump: { min: 4, step: 1 },
};
const ORDER = ['jumping_jack', 'cross_crawl', 'side_leg_raise', 'tuck_jump', 'arm_circles', 'side_bend', 'squats', 'high_knees', 'good_morning', 'quadruped_arm_circles', 'glute_bridge', 'superman_lifts', 'wall_french_press', 'pushups', 'shoulder_taps'];

// Новые упражнения из Студії (25.11) с минимальным возрастом: в программу подписчика, по одному в 3-й тренировке недели (вместо одного из основных)
const FRESH = { cross_crawl: 4, side_leg_raise: 4, side_bend: 4, glute_bridge: 4, superman_lifts: 6, tuck_jump: 7 };
export function focusKey(quiz) { return FOCUS[quiz && quiz.likes] ? quiz.likes : 'none'; }

// month — номер месяца подписки (1, 2, 3…). history — выполненные тренировки [{ id, done: [{ key, done, target, skipped }] }].
// Месяц 1 — от результата теста. Месяц N — от лучшего результата прошлого месяца: справился — растём, нет — держим уровень.
export const monthId = (m, w, d) => (m === 1 ? `w${w}d${d}` : `m${m}w${w}d${d}`);
export function buildProgram(profile, quiz, results, { month = 1, history = [] } = {}) {
  const group = CONFIG.ageGroups[(quiz && quiz.age) || CONFIG.defaultAge] || CONFIG.ageGroups[CONFIG.defaultAge];
  const avail = (group.program || group.plan).map((p) => p.key);
  const armsKey = avail.find((k) => ['pushups', 'wall_french_press', 'quadruped_arm_circles'].includes(k)) || 'squats';
  const pick = (k) => (k === 'ARMS' ? armsKey : k);
  const base = [...new Set(FOCUS[focusKey(quiz)].map(pick))].filter((k) => avail.includes(k));
  const measured = QUALITIES.filter((q) => profile && profile.qualities[q] && profile.qualities[q].level > 0);
  const weakest = measured.length ? measured.reduce((a, b) => (profile.qualities[b].score < profile.qualities[a].score ? b : a)) : null;
  const weakKey = weakest && FOR_QUALITY[weakest] ? pick(FOR_QUALITY[weakest]) : null;
  const extra = weakKey && avail.includes(weakKey) && !base.includes(weakKey) ? weakKey : avail.find((k) => !base.includes(k));
  const testTarget = Object.fromEntries((group.program || group.plan).map((p) => [p.key, p]));
  const did = Object.fromEntries((results || []).filter((r) => !r.skipped).map((r) => [r.key, Math.floor(r.done)]));

  // Лучший результат и цель прошлого месяца по каждому упражнению
  const prevIds = month > 1 ? new Set([1, 2, 3, 4].flatMap((w) => [1, 2, 3].map((d) => monthId(month - 1, w, d)))) : new Set();
  const best = {}, hit = {};
  for (const rec of history || []) {
    if (!prevIds.has(rec.id)) continue;
    for (const it of rec.done || []) {
      if (it.skipped) continue;
      best[it.key] = Math.max(best[it.key] || 0, Math.floor(it.done));
      if (it.done >= it.target) hit[it.key] = (hit[it.key] || 0) + 1;
    }
  }
  const startOf = (key) => {
    const d = DOSE[key];
    const m1 = Math.max(d.min, did[key] || Math.round((testTarget[key] ? testTarget[key].target : d.min) * 0.7));
    if (month === 1) return m1;
    if (best[key] != null) return Math.max(d.min, best[key] + (hit[key] ? d.step : 0));
    return m1 + (month - 1) * 2 * d.step; // прошлый месяц не занимались этим упражнением — растём умеренно
  };
  const dose = (key, week) => {
    const d = DOSE[key];
    const target = startOf(key) + (week - 1) * d.step;
    const isSec = CONFIG.exercises[key].goal === 'seconds';
    return { key, target, capSec: isSec ? target + 20 : Math.max(25, Math.round(target * 3.5)) };
  };
  const groupMin = parseInt((quiz && quiz.age) || CONFIG.defaultAge, 10) || 6;
  const fresh = Object.entries(FRESH).filter(([, a]) => a <= Math.max(4, groupMin)).map(([k]) => k).filter((k) => !avail.includes(k));
  const workouts = [];
  for (let w = 1; w <= WEEKS; w++) {
    for (let d = 1; d <= PER_WEEK; d++) {
      // Тренировка: основа по интересу + 1 упражнение на слабое качество; во 2-й тренировке недели одно меняем,
      // в чётные месяцы — другое, чтобы программа не повторялась
      const keys = [...base, extra].filter(Boolean);
      const swapAt = month % 2 === 0 ? 1 : 2;
      if (d === 2 && keys.length > swapAt) keys[swapAt] = avail.find((k) => !keys.includes(k)) || keys[swapAt];
      // 3-я тренировка недели: одно новое упражнение из Студії по очереди (разнообразие без удлинения теста)
      if (d === 3 && fresh.length && keys.length > 1) keys[swapAt === 1 ? 2 % keys.length : 1] = fresh[((month - 1) * WEEKS + (w - 1)) % fresh.length];
      const items = [...new Set(keys)].sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b)).map((k) => dose(k, w));
      workouts.push({ id: monthId(month, w, d), month, week: w, day: d, items });
    }
  }
  return { focus: focusKey(quiz), weakest, month, workouts };
}

// Какой месяц программы сейчас: по времени подписки, но если месяц пройден раньше — можно начать следующий.
export function currentMonth(sub, history, now = Date.now(), periodDays = 30) {
  const byTime = sub && sub.startedAt ? Math.floor((now - sub.startedAt) / (periodDays * 86400000)) + 1 : 1;
  const done = new Set((history || []).map((x) => x.id));
  let m = 1;
  while ([1, 2, 3, 4].every((w) => [1, 2, 3].every((d) => done.has(monthId(m, w, d))))) m++;
  return Math.max(byTime, m);
}

export function nextWorkout(program, done) {
  const ids = new Set((done || []).map((x) => x.id));
  return program.workouts.find((w) => !ids.has(w.id)) || null;
}
