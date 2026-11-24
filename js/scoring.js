// ПРАВИЛА: профиль из результатов упражнений + рекомендации из профиля и ответов квиза.
// Чистые функции без браузера (проверяются в tests/rules.test.mjs). Тексты — по ключам из js/i18n.
// Важно: возрастных норм нет. Все оценки — «выполнено задание / нет» и «ровно / неровно», пороги рабочие.

import { CONFIG } from './config.js';

const clamp01 = (x) => Math.max(0, Math.min(1, x));
const mean = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : null);

export const QUALITIES = ['coordination', 'legs', 'speed', 'core', 'symmetry'];

// --- Показатели (каждый 0..1 или null, если не измерен) ---
// Рабочие пороги (не нормы):
//   RHYTHM_CV_MAX   — разброс интервалов между повторами, при котором «ритм» = 0
//   ARM_DIFF_MAX    — разница высоты кистей в верхней точке (в длинах туловища), при которой «симметрия рук» = 0
//   PLANK_DRIFT_MAX — дрейф линии корпуса в градусах; взят из спека планки студии (stillness.maxDrift = 10)
export const WORK = { RHYTHM_CV_MAX: 0.5, ARM_DIFF_MAX: 0.3, PLANK_DRIFT_MAX: 10 };

export function indicators(results) {
  const by = Object.fromEntries((results || []).map((r) => [r.key, r]));
  const ok = (r) => r && !r.skipped;
  const jj = by.jumping_jack, sq = by.squats, hk = by.high_knees, pl = by.plank;
  const ind = {};

  if (ok(jj)) {
    ind.jj_done = clamp01(jj.done / jj.target);
    ind.jj_rhythm = jj.metrics.rhythmCv == null ? null : clamp01(1 - jj.metrics.rhythmCv / WORK.RHYTHM_CV_MAX);
    ind.jj_arm_sym = jj.metrics.armDiff == null ? null : clamp01(1 - jj.metrics.armDiff / WORK.ARM_DIFF_MAX);
  }
  if (ok(sq)) {
    ind.sq_done = clamp01(sq.done / sq.target);
    const tries = sq.done + (sq.metrics.shallow || 0);
    ind.sq_clean = tries > 0 ? sq.done / tries : 0; // доля приседаний, засчитанных без подсказки «ниже»
  }
  if (ok(hk)) {
    ind.hk_done = clamp01(hk.done / hk.target);
    ind.hk_pace = hk.elapsedSec > 0 ? clamp01(hk.done / hk.elapsedSec) : 0; // доля времени в активном беге
    const l = hk.metrics.liftsLeft || 0, r = hk.metrics.liftsRight || 0;
    ind.hk_side = l + r >= 4 ? Math.min(l, r) / Math.max(l, r) : null;
  }
  if (ok(pl)) {
    ind.pl_done = clamp01(pl.done / pl.target);
    ind.pl_steady = pl.metrics.driftDeg == null ? null : clamp01(1 - pl.metrics.driftDeg / WORK.PLANK_DRIFT_MAX);
  }
  return ind;
}

// Какие показатели входят в какое качество
export const QUALITY_MAP = {
  coordination: ['jj_done', 'jj_rhythm'],
  legs: ['sq_done', 'sq_clean'],
  speed: ['hk_done', 'hk_pace'],
  core: ['pl_done', 'pl_steady'],
  symmetry: ['jj_arm_sym', 'hk_side'],
};

export function levelOf(score) {
  if (score == null) return 0;
  return score >= CONFIG.levels.high ? 3 : score >= CONFIG.levels.mid ? 2 : 1;
}

export function buildProfile(results) {
  const ind = indicators(results);
  const qualities = {};
  for (const q of QUALITIES) {
    const vals = QUALITY_MAP[q].map((k) => ind[k]).filter((v) => v != null);
    const score = mean(vals);
    qualities[q] = { score: score == null ? null : Math.round(score * 100) / 100, level: levelOf(score) };
  }
  const measured = QUALITIES.filter((q) => qualities[q].level > 0);
  const strongest = measured.length ? measured.reduce((a, b) => (qualities[b].score > qualities[a].score ? b : a)) : null;
  const avg = mean(measured.map((q) => qualities[q].score));
  const summary = measured.length < 2 ? 'none' : avg >= CONFIG.levels.high ? 'high' : avg >= CONFIG.levels.mid ? 'mid' : 'low';
  return { qualities, strongest, summary, indicators: ind, preliminary: true };
}

// --- Рекомендации: 3 направления спорта ---
// Баллы направления = ответы квиза + качества профиля. Таблица целиком — в отчёте владельцу.
export const SPORTS = ['team', 'athletics', 'gymnastics', 'dance', 'martial', 'swimming', 'climbing', 'racket'];

export const QUIZ_RULES = {
  likes: {
    team: { team: 4, racket: 1 },
    solo: { swimming: 2, athletics: 2, racket: 2 },
    music: { dance: 4, gymnastics: 1 },
    fight: { martial: 4 },
    climb: { climbing: 4, gymnastics: 2 },
  },
  temper: {
    active: { team: 1, martial: 1, athletics: 1 },
    calm: { swimming: 1, racket: 1, dance: 1 },
    mixed: {},
  },
  goal: {
    health: { swimming: 2, gymnastics: 1 },
    discipline: { martial: 2, gymnastics: 1 },
    confidence: { martial: 1, team: 1, dance: 1, climbing: 1 },
    result: { athletics: 1, gymnastics: 1, racket: 1, swimming: 1 },
  },
};
// Возраст 4–6: приоритет направлениям с разносторонней базой
export const AGE_RULES = { '4-6': { gymnastics: 1, dance: 1, swimming: 1 } };
// Качество → направления. Вклад = вес × (уровень − 1) / 2: «зона роста» 0, «есть запас» — половина веса, «сильная сторона» — полный вес.
// Желание ребёнка (likes, до 4 баллов) весит больше любого одного качества из теста (до 2 баллов).
export const QUALITY_RULES = {
  coordination: { team: 1, gymnastics: 1, dance: 2, martial: 1, climbing: 1, racket: 1 },
  legs: { athletics: 1, martial: 1, climbing: 1 },
  speed: { team: 1, athletics: 2, racket: 1 },
  core: { gymnastics: 2, martial: 1, swimming: 1, climbing: 1 },
  symmetry: { gymnastics: 1, dance: 1, swimming: 1 },
};

export function recommendSports(profile, quiz) {
  const score = Object.fromEntries(SPORTS.map((s) => [s, 0]));
  const reasons = Object.fromEntries(SPORTS.map((s) => [s, []]));
  const add = (table, reason) => {
    for (const [s, w] of Object.entries(table || {})) { score[s] += w; reasons[s].push({ key: reason, w }); }
  };
  for (const q of ['likes', 'temper', 'goal']) if (quiz[q]) add(QUIZ_RULES[q][quiz[q]], `${q}.${quiz[q]}`);
  if (AGE_RULES[quiz.age]) add(AGE_RULES[quiz.age], 'age.young');
  for (const q of QUALITIES) {
    const lvl = profile.qualities[q].level;
    if (lvl >= 2) {
      const t = {};
      for (const [s, w] of Object.entries(QUALITY_RULES[q])) t[s] = (w * (lvl - 1)) / 2;
      add(t, `q.${q}`);
    }
  }
  return SPORTS
    .map((s, i) => ({ sport: s, score: score[s], order: i, reasons: reasons[s].sort((a, b) => b.w - a.w).slice(0, 3).map((r) => r.key) }))
    .sort((a, b) => b.score - a.score || a.order - b.order)
    .slice(0, 3)
    .map(({ sport, score: sc, reasons: rs }) => ({ sport, score: sc, reasons: rs }));
}

// --- План на 2 недели дома ---
// Упражнения — только из каталога студии с возрастом 4+ и проверкой позы.
// Состав занятия: 2 упражнения на «зоны роста» (самые слабые качества) + 1 на самую сильную сторону.
// Дозировка: неделя 1 — собственный результат ребёнка в тесте (не меньше минимума), неделя 2 — на шаг больше.
export const PLAN_EX = {
  coordination: ['jumping_jack', 'arm_circles'],
  legs: ['squats', 'high_knees'],
  speed: ['high_knees', 'jumping_jack'],
  core: ['plank', 'crunches'],
  symmetry: ['arm_circles', 'jumping_jack'],
};
export const PLAN_DOSE = {
  // unit, min — минимум недели 1, step — прибавка на неделе 2
  jumping_jack: { unit: 'reps', min: 4, step: 2 },
  squats: { unit: 'reps', min: 3, step: 2 },
  arm_circles: { unit: 'reps', min: 6, step: 2 },
  crunches: { unit: 'reps', min: 3, step: 2 },
  high_knees: { unit: 'sec', min: 5, step: 5 },
  plank: { unit: 'sec', min: 5, step: 5 },
};

export function buildPlan(profile, quiz, results) {
  const measured = QUALITIES.filter((q) => profile.qualities[q].level > 0);
  const asc = [...measured].sort((a, b) => profile.qualities[a].score - profile.qualities[b].score);
  const weak = asc.slice(0, 2);
  const strong = profile.strongest && !weak.includes(profile.strongest) ? profile.strongest : asc[asc.length - 1];
  const focus = [...weak, strong].filter(Boolean);
  while (focus.length < 3) focus.push(QUALITIES.find((q) => !focus.includes(q)));

  const done = Object.fromEntries((results || []).filter((r) => !r.skipped).map((r) => [r.key, Math.floor(r.done)]));
  const dose = (key, week) => {
    const d = PLAN_DOSE[key];
    const base = Math.max(d.min, done[key] || 0);
    return { key, unit: d.unit, amount: base + (week - 1) * d.step };
  };
  const weeks = [1, 2].map((week) => ({
    week,
    sessions: [0, 1, 2].map((s) => {
      const used = new Set();
      const items = focus.map((q, i) => {
        const opts = PLAN_EX[q];
        let key = opts[(s + i) % opts.length];
        if (used.has(key)) key = opts.find((k) => !used.has(k)) || Object.keys(PLAN_DOSE).find((k) => !used.has(k));
        used.add(key);
        return dose(key, week);
      });
      return { n: s + 1, items };
    }),
  }));
  const tips = [];
  if (quiz.screen === 'high') tips.push('screenTip');
  if (quiz.now === 'none') tips.push('startTip');
  if (quiz.now === 'section') tips.push('sectionTip');
  return { focus, weeks, tips };
}

export function buildReport(results, quiz) {
  const profile = buildProfile(results);
  return { profile, sports: recommendSports(profile, quiz), plan: buildPlan(profile, quiz, results) };
}
