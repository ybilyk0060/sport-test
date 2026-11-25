// ЧТО ПОЛУЧАЕТ ПОДПИСЧИК: программа на 4 недели, 3 тренировки в неделю, с камерой и голосом, как в тесте.
// Чистые функции без браузера (проверяются в tests/rules.test.mjs).
//
// Акцент — от того, что ребёнку нравится (ответ квиза likes): «команда и мяч» → бег и ловкость, «борьба» → сила и т. д.
// Плюс одно упражнение на самое слабое качество из теста. Дозировка — от собственного результата ребёнка
// в тесте и растёт каждую неделю на небольшой шаг. Упражнения — только 5 вправ теста (их считает камера).

import { CONFIG } from './config.js';
import { QUALITIES } from './scoring.js';

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
const FOR_QUALITY = { coordination: 'jumping_jack', legs: 'squats', speed: 'high_knees', flex: 'arm_circles', core: 'ARMS', arms: 'ARMS', symmetry: 'jumping_jack' };
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
};
const ORDER = ['jumping_jack', 'arm_circles', 'squats', 'high_knees', 'good_morning', 'quadruped_arm_circles', 'wall_french_press', 'pushups', 'shoulder_taps'];

export function focusKey(quiz) { return FOCUS[quiz && quiz.likes] ? quiz.likes : 'none'; }

export function buildProgram(profile, quiz, results) {
  const group = CONFIG.ageGroups[(quiz && quiz.age) || CONFIG.defaultAge] || CONFIG.ageGroups[CONFIG.defaultAge];
  const avail = group.plan.map((p) => p.key);
  const armsKey = avail.find((k) => ['pushups', 'wall_french_press', 'quadruped_arm_circles'].includes(k)) || 'squats';
  const pick = (k) => (k === 'ARMS' ? armsKey : k);
  const base = [...new Set(FOCUS[focusKey(quiz)].map(pick))].filter((k) => avail.includes(k));
  const measured = QUALITIES.filter((q) => profile && profile.qualities[q] && profile.qualities[q].level > 0);
  const weakest = measured.length ? measured.reduce((a, b) => (profile.qualities[b].score < profile.qualities[a].score ? b : a)) : null;
  const weakKey = weakest && FOR_QUALITY[weakest] ? pick(FOR_QUALITY[weakest]) : null;
  const extra = weakKey && avail.includes(weakKey) && !base.includes(weakKey) ? weakKey : avail.find((k) => !base.includes(k));
  const testTarget = Object.fromEntries(group.plan.map((p) => [p.key, p]));
  const did = Object.fromEntries((results || []).filter((r) => !r.skipped).map((r) => [r.key, Math.floor(r.done)]));

  const dose = (key, week) => {
    const d = DOSE[key];
    const start = Math.max(d.min, did[key] || Math.round((testTarget[key] ? testTarget[key].target : d.min) * 0.7));
    const target = start + (week - 1) * d.step;
    const isSec = CONFIG.exercises[key].goal === 'seconds';
    return { key, target, capSec: isSec ? target + 20 : Math.max(25, Math.round(target * 3.5)) };
  };
  const workouts = [];
  for (let w = 1; w <= WEEKS; w++) {
    for (let d = 1; d <= PER_WEEK; d++) {
      // Тренировка: основа по интересу + 1 упражнение на слабое качество; во 2-й тренировке недели одно меняем
      const keys = [...base, extra].filter(Boolean);
      if (d === 2 && keys.length > 2) keys[2] = avail.find((k) => !keys.includes(k)) || keys[2];
      const items = [...new Set(keys)].sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b)).map((k) => dose(k, w));
      workouts.push({ id: `w${w}d${d}`, week: w, day: d, items });
    }
  }
  return { focus: focusKey(quiz), weakest, workouts };
}

export function nextWorkout(program, done) {
  const ids = new Set((done || []).map((x) => x.id));
  return program.workouts.find((w) => !ids.has(w.id)) || null;
}
