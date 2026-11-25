// ПРАВИЛА: профиль из результатов упражнений + рекомендации из профиля и ответов квиза.
// Чистые функции без браузера (проверяются в tests/rules.test.mjs). Тексты — по ключам из js/i18n.
// Важно: возрастных норм нет. Все оценки — «выполнено задание / нет» и «ровно / неровно», пороги рабочие.

import { CONFIG } from './config.js?v=78560a1-mww9uyj5';

const clamp01 = (x) => Math.max(0, Math.min(1, x));
const mean = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : null);

export const QUALITIES = ['coordination', 'legs', 'speed', 'arms', 'core', 'flex', 'symmetry'];
// Какие качества проверяет каждое упражнение (для подписи «Перевіряємо: …» и чтобы не показывать то, что в наборе возраста не мерили)
export const EX_QUALITY = { jumping_jack: ['coordination', 'symmetry'], squats: ['legs'], high_knees: ['speed', 'symmetry'], arm_circles: ['flex'], quadruped_arm_circles: ['core'], wall_french_press: ['arms'], pushups: ['arms', 'core'], good_morning: ['flex'], shoulder_taps: ['core', 'symmetry'] };
export function qualitiesOf(results) { const set = new Set((results || []).flatMap((r) => EX_QUALITY[r.key] || [])); return QUALITIES.filter((q) => set.has(q)); }

// --- Показатели (каждый 0..1 или null, если не измерен) ---
// Рабочие пороги (не нормы):
//   RHYTHM_CV_MAX   — разброс интервалов между повторами, при котором «ритм» = 0
//   ARM_DIFF_MAX    — разница высоты кистей в верхней точке (в длинах туловища), при которой «симметрия рук» = 0
export const WORK = { RHYTHM_CV_MAX: 0.5, ARM_DIFF_MAX: 0.3 };

export function indicators(results) {
  const by = Object.fromEntries((results || []).map((r) => [r.key, r]));
  const ok = (r) => r && !r.skipped;
  const jj = by.jumping_jack, sq = by.squats, hk = by.high_knees, gm = by.good_morning, st = by.shoulder_taps;
  const ac = by.arm_circles, qa = by.quadruped_arm_circles, wp = by.wall_french_press, pu = by.pushups;
  const clean = (r) => { const tries = r.done + (r.metrics.shallow || 0); return tries > 0 ? r.done / tries : 0; };
  const sides = (r) => { const l = r.metrics.liftsLeft || 0, rr = r.metrics.liftsRight || 0; return l + rr >= 4 ? Math.min(l, rr) / Math.max(l, rr) : null; };
  const ind = {};

  if (ok(jj)) {
    ind.jj_done = clamp01(jj.done / jj.target);
    ind.jj_rhythm = jj.metrics.rhythmCv == null ? null : clamp01(1 - jj.metrics.rhythmCv / WORK.RHYTHM_CV_MAX);
    ind.jj_arm_sym = jj.metrics.armDiff == null ? null : clamp01(1 - jj.metrics.armDiff / WORK.ARM_DIFF_MAX);
  }
  if (ok(sq)) {
    ind.sq_done = clamp01(sq.done / sq.target);
    ind.sq_clean = clean(sq); // доля приседаний, засчитанных без подсказки «ниже»
  }
  if (ok(hk)) {
    ind.hk_done = clamp01(hk.done / hk.target);
    ind.hk_pace = hk.elapsedSec > 0 ? clamp01(hk.done / hk.elapsedSec) : 0; // доля времени в активном беге
    ind.hk_side = sides(hk);
  }
  if (ok(gm)) {
    ind.gm_done = clamp01(gm.done / gm.target);
    ind.gm_clean = clean(gm); // доля наклонов без подсказки «нижче»
  }
  if (ok(ac)) { ind.ac_done = clamp01(ac.done / ac.target); ind.ac_clean = clean(ac); }
  if (ok(qa)) { ind.qa_done = clamp01(qa.done / qa.target); ind.qa_clean = clean(qa); }
  if (ok(wp)) { ind.wp_done = clamp01(wp.done / wp.target); ind.wp_clean = clean(wp); }
  if (ok(pu)) { ind.pu_done = clamp01(pu.done / pu.target); ind.pu_clean = clean(pu); }
  if (ok(st)) {
    ind.st_done = clamp01(st.done / st.target);
    ind.st_rhythm = st.metrics.rhythmCv == null ? null : clamp01(1 - st.metrics.rhythmCv / WORK.RHYTHM_CV_MAX);
    ind.st_side = sides(st);
  }
  return ind;
}

// Какие показатели входят в какое качество
export const QUALITY_MAP = {
  coordination: ['jj_done', 'jj_rhythm'],
  legs: ['sq_done', 'sq_clean'],
  speed: ['hk_done', 'hk_pace'],
  arms: ['wp_done', 'wp_clean', 'pu_done', 'pu_clean'],
  core: ['qa_done', 'qa_clean', 'pu_done', 'st_done', 'st_rhythm'],
  flex: ['ac_done', 'ac_clean', 'gm_done', 'gm_clean'],
  symmetry: ['jj_arm_sym', 'hk_side', 'st_side'],
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
// Пол (по желанию Юрия 25.11): только лёгкий сдвиг при прочих равных, 0,5 балла — меньше любой сильной стороны из теста
// (до 2) и меньше желания ребёнка (до 4). Ничего не отсекает: девочке с сильными руками и корпусом единоборства выйдут выше танцев.
// В причины отчёта не попадает — объясняем только результатами и ответами родителя.
export const SEX_RULES = { girl: { dance: 0.5, gymnastics: 0.5 }, boy: { team: 0.5, martial: 0.5 } };
// --- Телосложение (рост и вес, по желанию Юрия 25.11 «в первую очередь») ---
// ИМТ сравниваем с детскими порогами IOTF (Cole et al., BMJ 2000): ИМТ ребёнка, соответствующий взрослым 25 и 30, по возрасту и полу.
// Индекс = возраст в годах 2..15. Точный возраст не спрашиваем — берём верх диапазона (пороги с возрастом растут → меньше ложных «перегрузок»).
// Пол не указан → берём больший из порогов мальчиков и девочек. Сами рост и вес не уходят ни на сервер, ни в аналитику; в анкету пишется только build.
export const IOTF = {
  boy: { ow: [18.41, 17.89, 17.55, 17.42, 17.55, 17.92, 18.44, 19.10, 19.84, 20.55, 21.22, 21.91, 22.62, 23.29], ob: [20.09, 19.57, 19.29, 19.30, 19.78, 20.63, 21.60, 22.77, 24.00, 25.10, 26.02, 26.84, 27.63, 28.30] },
  girl: { ow: [18.02, 17.56, 17.28, 17.15, 17.34, 17.75, 18.35, 19.07, 19.86, 20.74, 21.68, 22.58, 23.34, 23.94], ob: [19.81, 19.36, 19.15, 19.17, 19.65, 20.51, 21.57, 22.81, 24.11, 25.42, 26.67, 27.76, 28.57, 29.11] },
};
// 'std' — обычная нагрузка; 'soft' — выше порога «25»; 'gentle' — выше порога «30». null — данных нет или они неправдоподобны.
export function bodyBuild({ cm, kg, sex, age } = {}) {
  cm = Number(cm); kg = Number(kg);
  if (!(cm >= 80 && cm <= 200 && kg >= 10 && kg <= 150)) return null;
  const bmi = kg / (cm / 100) ** 2;
  if (bmi < 10 || bmi > 50) return null;
  const top = parseInt(String(age || '').split('-')[1], 10) || 8;
  const i = Math.max(0, Math.min(13, top - 2));
  const cut = (k) => (IOTF[sex] ? IOTF[sex][k][i] : Math.max(IOTF.boy[k][i], IOTF.girl[k][i]));
  return bmi >= cut('ob') ? 'gentle' : bmi >= cut('ow') ? 'soft' : 'std';
}
// Телосложение — сильный фактор (до 3 баллов, как сильная сторона в тесте): щадящие суставы виды вверх, прыжковые и «висы» вниз.
// В причинах показываем только положительную формулировку (без ярлыков про вес).
export const BODY_RULES = {
  soft: { swimming: 1.5, martial: 1, team: 0.5, gymnastics: -1.5, climbing: -1 },
  gentle: { swimming: 3, martial: 1.5, team: 0.5, racket: 0.5, gymnastics: -3, climbing: -2, athletics: -1 },
};
// Возраст 3–5: приоритет направлениям с разносторонней базой
export const AGE_RULES = { '3-5': { gymnastics: 1, dance: 1, swimming: 1 } };
// Качество → направления. Вклад = вес × (уровень − 1) / 2: «зона роста» 0, «есть запас» — половина веса, «сильная сторона» — полный вес.
// Желание ребёнка (likes, до 4 баллов) весит больше любого одного качества из теста (до 2 баллов).
export const QUALITY_RULES = {
  coordination: { team: 1, gymnastics: 1, dance: 2, martial: 1, climbing: 1, racket: 1 },
  legs: { athletics: 1, martial: 2, climbing: 1 },
  speed: { team: 1, athletics: 2, racket: 1 },
  core: { gymnastics: 2, martial: 1, swimming: 1, climbing: 1 },
  flex: { gymnastics: 2, dance: 1, martial: 1, swimming: 1 },
  arms: { climbing: 2, swimming: 1, martial: 2, racket: 1, gymnastics: 1 },
  symmetry: { gymnastics: 1, dance: 1, swimming: 1 },
};

// Порядок причин в отчёте: телосложение, затем результаты теста, затем ответы родителя
const rprio = (k) => (k.startsWith('body.') ? 2 : k.startsWith('q.') ? 1 : 0);
export function recommendSports(profile, quiz) {
  const score = Object.fromEntries(SPORTS.map((s) => [s, 0]));
  const reasons = Object.fromEntries(SPORTS.map((s) => [s, []]));
  const add = (table, reason) => {
    for (const [s, w] of Object.entries(table || {})) { score[s] += w; reasons[s].push({ key: reason, w }); }
  };
  for (const q of ['likes', 'temper', 'goal']) if (quiz[q]) add(QUIZ_RULES[q][quiz[q]], `${q}.${quiz[q]}`);
  for (const [s, w] of Object.entries(SEX_RULES[quiz.sex] || {})) score[s] += w; // без причины в отчёте
  for (const [s, w] of Object.entries(BODY_RULES[quiz.build] || {})) { score[s] += w; if (s === 'swimming') reasons[s].push({ key: 'body.joints', w }); }
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
    .map((s, i) => ({ sport: s, score: score[s], order: i, reasons: reasons[s].sort((a, b) => rprio(b.key) - rprio(a.key) || b.w - a.w).slice(0, 3).map((r) => r.key) }))
    .sort((a, b) => b.score - a.score || a.order - b.order)
    .slice(0, 3)
    .map(({ sport, score: sc, reasons: rs }) => ({ sport, score: sc, reasons: rs }));
}

// --- План на 2 недели дома ---
// Упражнения — только 5 вправ тесту (их ребёнок уже знает и их считает камера).
// Состав занятия: 2 упражнения на «зоны роста» (самые слабые качества) + 1 на самую сильную сторону.
// Дозировка: неделя 1 — собственный результат ребёнка в тесте (не меньше минимума), неделя 2 — на шаг больше.
export const PLAN_EX = {
  coordination: ['jumping_jack', 'shoulder_taps'],
  legs: ['squats', 'high_knees'],
  speed: ['high_knees', 'jumping_jack'],
  core: ['shoulder_taps', 'squats'],
  flex: ['good_morning', 'squats'],
  arms: ['squats', 'jumping_jack'],
  symmetry: ['shoulder_taps', 'jumping_jack'],
};
export const PLAN_DOSE = {
  // unit, min — минимум недели 1, step — прибавка на неделе 2
  jumping_jack: { unit: 'reps', min: 4, step: 2 },
  squats: { unit: 'reps', min: 3, step: 2 },
  good_morning: { unit: 'reps', min: 4, step: 2 },
  shoulder_taps: { unit: 'reps', min: 6, step: 2 },
  high_knees: { unit: 'sec', min: 5, step: 5 },
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
  if (quiz.build === 'soft' || quiz.build === 'gentle') tips.push('cardioTip');
  if (quiz.screen === 'high') tips.push('screenTip');
  if (quiz.now === 'none') tips.push('startTip');
  if (quiz.now === 'section') tips.push('sectionTip');
  return { focus, weeks, tips };
}

export function buildReport(results, quiz) {
  const profile = buildProfile(results);
  return { profile, sports: recommendSports(profile, quiz), plan: buildPlan(profile, quiz, results) };
}
