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

// Интерес ребёнка → упражнения-основа (по порядку важности)
export const FOCUS = {
  team: ['high_knees', 'jumping_jack', 'squats'],
  solo: ['high_knees', 'squats', 'good_morning'],
  music: ['jumping_jack', 'good_morning', 'high_knees'],
  fight: ['squats', 'shoulder_taps', 'jumping_jack'],
  climb: ['shoulder_taps', 'squats', 'good_morning'],
  none: ['jumping_jack', 'squats', 'high_knees'],
};
// Качество → упражнение, которое его развивает
const FOR_QUALITY = { coordination: 'jumping_jack', legs: 'squats', speed: 'high_knees', core: 'shoulder_taps', flex: 'good_morning', symmetry: 'shoulder_taps' };
// Шаг роста за неделю и минимум недели 1
const DOSE = {
  jumping_jack: { min: 5, step: 2 },
  squats: { min: 4, step: 2 },
  high_knees: { min: 8, step: 4 },
  good_morning: { min: 4, step: 2 },
  shoulder_taps: { min: 6, step: 2 },
};

export function focusKey(quiz) { return FOCUS[quiz && quiz.likes] ? quiz.likes : 'none'; }

export function buildProgram(profile, quiz, results) {
  const base = FOCUS[focusKey(quiz)];
  const measured = QUALITIES.filter((q) => profile && profile.qualities[q] && profile.qualities[q].level > 0);
  const weakest = measured.length ? measured.reduce((a, b) => (profile.qualities[b].score < profile.qualities[a].score ? b : a)) : null;
  const extra = weakest && FOR_QUALITY[weakest] && !base.includes(FOR_QUALITY[weakest]) ? FOR_QUALITY[weakest] : Object.keys(DOSE).find((k) => !base.includes(k));
  const group = CONFIG.ageGroups[(quiz && quiz.age) || '7-9'] || CONFIG.ageGroups['7-9'];
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
      // Каждое тренировка: 3 упражнения основы + 1 на слабое качество; порядок как в тесте (лицом → боком → на полу)
      const keys = [...base, extra];
      const ORDER = ['jumping_jack', 'squats', 'high_knees', 'good_morning', 'shoulder_taps'];
      // Во 2-й тренировке недели одно из основы меняем, чтобы не было одинаково
      if (d === 2) keys[2] = ORDER.find((k) => !keys.includes(k)) || keys[2];
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
