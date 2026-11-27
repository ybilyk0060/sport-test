// ПРАВИЛА: профиль из результатов упражнений + рекомендации из профиля и ответов квиза.
// Чистые функции без браузера (проверяются в tests/rules.test.mjs). Тексты — по ключам из js/i18n.
// Важно: возрастных норм нет. Все оценки — «выполнено задание / нет» и «ровно / неровно», пороги рабочие.

import { CONFIG } from './config.js?v=96d2da0-mwyyqqcf';

const clamp01 = (x) => Math.max(0, Math.min(1, x));
const mean = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : null);

export const QUALITIES = ['balance', 'speed', 'flex', 'coordination', 'endurance', 'arms', 'legs', 'core', 'symmetry'];
// Какие качества проверяет каждое упражнение (для подписи «Перевіряємо: …» и чтобы не показывать то, что в наборе возраста не мерили)
export const EX_QUALITY = { jumping_jack: ['coordination', 'symmetry'], squats: ['legs'], high_knees: ['speed', 'symmetry'], arm_circles: ['flex'], quadruped_arm_circles: ['core'], wall_french_press: ['arms'], pushups: ['arms', 'core'], good_morning: ['flex'], shoulder_taps: ['core', 'symmetry'],
  cross_crawl: ['coordination'], glute_bridge: ['core'], side_bend: ['flex'], side_leg_raise: ['legs'], superman_lifts: ['core'], tuck_jump: ['legs'], balance: ['balance'], crunches: ['core'],
  // Оценочный тест v3
  balance_r: ['balance', 'symmetry'], balance_l: ['balance', 'symmetry'], side_jumps_1: ['speed'], side_jumps_2: ['speed'], bend: ['flex'] };
export function qualitiesOf(results) {
  if (isV3(results)) { const set = new Set(['balance', 'speed', 'flex', 'legs', 'coordination', 'endurance', 'arms', 'symmetry']); const have = new Set((results || []).filter((r) => !r.skipped).map((r) => r.key)); if (!have.has('bend')) set.delete('flex'); if (!have.has('squats')) set.delete('legs'); if (!have.has('shoulder_taps')) set.delete('arms'); if (!have.has('side_jumps_1') && !have.has('side_jumps_2') && !have.has('high_knees')) set.delete('speed'); if (!have.has('jumping_jack')) { set.delete('coordination'); set.delete('endurance'); } return QUALITIES.filter((q) => set.has(q)); } const set = new Set((results || []).flatMap((r) => EX_QUALITY[r.key] || [])); return QUALITIES.filter((q) => set.has(q)); }

// --- Показатели (каждый 0..1 или null, если не измерен) ---
// Рабочие пороги (не нормы):
//   RHYTHM_CV_MAX   — разброс интервалов между повторами, при котором «ритм» = 0
//   ARM_DIFF_MAX    — разница высоты кистей в верхней точке (в длинах туловища), при которой «симметрия рук» = 0
export const WORK = { RHYTHM_CV_MAX: 0.5, ARM_DIFF_MAX: 0.3, SWAY_MAX: 0.15 }; // SWAY_MAX — покачивание таза (в длинах корпуса), при котором «ровность» = 0

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
  // Новые из Студії: доля выполненного задания и чистых повторов
  for (const [k, pre] of [['cross_crawl', 'cc'], ['glute_bridge', 'gb'], ['side_bend', 'sb'], ['side_leg_raise', 'sl'], ['superman_lifts', 'sm'], ['tuck_jump', 'tj'], ['crunches', 'cr']]) {
    const r = by[k]; if (ok(r)) { ind[pre + '_done'] = clamp01(r.done / r.target); ind[pre + '_clean'] = clean(r); }
  }
  // Баланс на одной ноге: время удержания относительно цели + насколько ровно стоит (покачивание таза)
  const bl = by.balance;
  if (ok(bl)) { ind.bal_hold = clamp01(bl.done / bl.target); ind.bal_sway = bl.metrics.sway == null ? null : clamp01(1 - bl.metrics.sway / WORK.SWAY_MAX); }
  if (ok(st)) {
    ind.st_done = clamp01(st.done / st.target);
    ind.st_rhythm = st.metrics.rhythmCv == null ? null : clamp01(1 - st.metrics.rhythmCv / WORK.RHYTHM_CV_MAX);
    ind.st_side = sides(st);
  }
  return ind;
}

// Какие показатели входят в какое качество
export const QUALITY_MAP = {
  coordination: ['jj_done', 'jj_rhythm', 'cc_done', 'cc_clean'],
  legs: ['sq_done', 'sq_clean', 'sl_done', 'sl_clean', 'tj_done', 'tj_clean'],
  speed: ['hk_done', 'hk_pace'],
  arms: ['wp_done', 'wp_clean', 'pu_done', 'pu_clean'],
  core: ['qa_done', 'qa_clean', 'pu_done', 'st_done', 'st_rhythm', 'gb_done', 'gb_clean', 'sm_done', 'sm_clean', 'cr_done', 'cr_clean'],
  flex: ['ac_done', 'ac_clean', 'gm_done', 'gm_clean', 'sb_done', 'sb_clean'],
  balance: ['bal_hold', 'bal_sway'],
  endurance: [],
  symmetry: ['jj_arm_sym', 'hk_side', 'st_side'],
};

export function levelOf(score) {
  if (score == null) return 0;
  return score >= CONFIG.levels.high ? 3 : score >= CONFIG.levels.mid ? 2 : 1;
}

// ---------- Оценочный тест v3 (спецификация 25.11): пороги «A / B» по возрасту ----------
// Ниже A — «зона роста», A…B — «есть запас», от B — «сильная сторона». Рабочие оценки, не нормы; пока одинаково для мальчиков и девочек.
// После ~300 тестов на группу «возраст × пол» заменить на P25 / P75 собственных данных.
export const NORMS = {
  // legs — приседания за время (15 с для 3–5, иначе 20 с), рабочие пороги до данных
  '3-5': { balance: [6, 15], knees: [14, 24], speed: [6, 12], flex: [2, 4], coordination: [5, 12], arms: null, legs: [5, 9] },
  '6-8': { balance: [15, 26], knees: [20, 32], speed: [18, 28], flex: [3, 4], coordination: [12, 20], arms: [8, 16], legs: [9, 14] },
  '9-11': { balance: [20, 30], knees: [26, 38], speed: [25, 35], flex: [3, 4], coordination: [15, 24], arms: [12, 22], legs: [11, 16] },
  '12-15': { balance: [24, 30], knees: [30, 42], speed: [30, 40], flex: [3, 4], coordination: [18, 28], arms: [16, 28], legs: [13, 18] },
};
export const V3 = { SWAY_STRONG: 0.05, RHYTHM_CV_MAX: 0.5, SLOW_OK: 1.1, SLOW_MID: 1.3 }; // SWAY_STRONG — раскачка таза, ниже которой 9+ получают «сильную сторону» в балансе (временно, до медианы по данным)
const V3_KEYS = ['balance_r', 'balance_l', 'side_jumps_1', 'side_jumps_2', 'bend'];
export const isV3 = (results) => (results || []).some((r) => V3_KEYS.includes(r.key));
// Число в уровень и балл 0..1, совместимый с levelOf (mid 0.45, high 0.75)
// max — потолок задания (баланс 2 × цель, наклон 4): достигнут — балл 1, чтобы упражнения с потолком не проигрывали «бесконечным»
function graded(v, [a, b], max = null) {
  if (v == null) return null;
  if (max != null && v >= max) return { score: 1, level: 3 };
  if (v < a) return { score: Math.round(0.44 * (v / a) * 100) / 100, level: 1 };
  if (v < b) return { score: Math.round((0.45 + 0.29 * ((v - a) / (b - a))) * 100) / 100, level: 2 };
  return { score: Math.round(Math.min(1, 0.75 + 0.25 * ((v - b) / b)) * 100) / 100, level: 3 };
}
const down = (g) => (g && g.level > 1 ? { score: Math.min(g.score, g.level === 3 ? 0.74 : 0.44), level: g.level - 1 } : g);
export function buildProfileV3(results, ageGroup) {
  const N = NORMS[ageGroup] || NORMS[CONFIG.defaultAge];
  const by = Object.fromEntries((results || []).filter((r) => r && !r.skipped).map((r) => [r.key, r]));
  const q = {};
  const metr = {};
  // 1. Баланс: сумма секунд на двух ногах; для 9+ «сильная сторона» только при малой раскачке
  const br = by.balance_r, bl = by.balance_l;
  if (br || bl) {
    const sum = (br ? br.done : 0) + (bl ? bl.done : 0);
    const sways = [br, bl].map((r) => r && r.metrics.sway).filter((x) => x != null);
    const sway = sways.length ? sways.reduce((a, x) => a + x, 0) / sways.length : null;
    let g = graded(sum, N.balance, (br ? br.target : 0) + (bl ? bl.target : 0));
    if (g && g.level === 3 && parseInt(ageGroup, 10) >= 9 && !(sway != null && sway < V3.SWAY_STRONG)) g = down(g);
    q.balance = g; metr.balanceSec = sum; metr.sway = sway;
    if (br && bl && Math.max(br.done, bl.done) > 0) metr.balanceSym = Math.min(br.done, bl.done) / Math.max(br.done, bl.done);
  }
  // 2. Быстрота и ловкость ног: среднее число прыжков через линию за попытку
  // 2'. Быстрота ног — бег на месте с высокими коленями 15 с (26.11 вместо прыжков через полоску): число подъёмов колен
  const hk = by.high_knees;
  if (hk && hk.metrics) {
    const lifts = (hk.metrics.liftsLeft || 0) + (hk.metrics.liftsRight || 0);
    q.speed = graded(lifts, N.knees); metr.kneeLifts = lifts;
    const lr = [hk.metrics.liftsLeft || 0, hk.metrics.liftsRight || 0];
    if (lifts >= 8) metr.kneeSym = Math.min(...lr) / Math.max(...lr);
  }
  const sj = [by.side_jumps_1, by.side_jumps_2].filter(Boolean);
  if (sj.length) { const avg = sj.reduce((a, r) => a + r.done, 0) / sj.length; q.speed = graded(avg, N.speed); metr.sideJumps = Math.round(avg * 10) / 10; }
  // 3. Гибкость: уровень наклона 1–4
  if (by.bend) { q.flex = graded(by.bend.done, N.flex, 4); metr.bendLevel = by.bend.done; }
  // 3'. Сила ног — приседания на время (26.11 вместо наклона); неглубокие повторы снижают уровень
  const sq = by.squats;
  if (sq && sq.timed !== false && N.legs) {
    let g = graded(sq.done, N.legs);
    const tries = sq.done + (sq.metrics.shallow || 0);
    if (tries >= 4 && sq.done / tries < 0.7) g = down(g);
    q.legs = g; metr.squats = sq.done;
  }
  // 4. Координация и ритм: повторы jumping jack за время; неровный ритм — на уровень ниже. Выносливость — держит ли темп до конца.
  const jj = by.jumping_jack;
  if (jj) {
    let g = graded(jj.done, N.coordination);
    if (jj.metrics.rhythmCv != null && jj.metrics.rhythmCv > V3.RHYTHM_CV_MAX) g = down(g);
    q.coordination = g;
    const sl = jj.metrics.slowdown;
    if (sl != null) q.endurance = sl <= V3.SLOW_OK ? { score: 0.75, level: 3 } : sl <= V3.SLOW_MID ? { score: 0.55, level: 2 } : { score: 0.3, level: 1 };
    metr.jjReps = jj.done; metr.slowdown = sl;
  }
  // 5. Сила рук и корпуса: касания плеч за 20 с; неровный ритм — на уровень ниже
  const st = by.shoulder_taps;
  if (st && N.arms) {
    let g = graded(st.done, N.arms);
    if (st.metrics.rhythmCv != null && st.metrics.rhythmCv > V3.RHYTHM_CV_MAX) g = down(g);
    q.arms = g; metr.taps = st.done;
  }
  // Симметрия: баланс Л/П, руки в jumping jack, касания Л/П
  const symParts = [];
  if (metr.balanceSym != null) symParts.push(metr.balanceSym);
  if (metr.kneeSym != null) symParts.push(metr.kneeSym);
  if (jj && jj.metrics.armDiff != null) symParts.push(clamp01(1 - jj.metrics.armDiff / WORK.ARM_DIFF_MAX));
  if (st && (st.metrics.liftsLeft || 0) + (st.metrics.liftsRight || 0) >= 4) symParts.push(Math.min(st.metrics.liftsLeft, st.metrics.liftsRight) / Math.max(st.metrics.liftsLeft, st.metrics.liftsRight));
  if (symParts.length) { const sc = mean(symParts); q.symmetry = { score: Math.round(sc * 100) / 100, level: levelOf(sc) }; }

  const qualities = {};
  for (const k of QUALITIES) qualities[k] = q[k] || { score: null, level: 0 };
  const measured = QUALITIES.filter((k) => qualities[k].level > 0 && k !== 'symmetry');
  // «Главная сила» — только из измеренных напрямую качеств: темп до конца (endurance) — вспомогательный показатель 20 с, не «сила»
  const cand = measured.filter((k) => k !== 'endurance');
  const strongest = cand.length ? cand.reduce((a, b) => (qualities[b].score > qualities[a].score ? b : a)) : null;
  const avg = mean(measured.map((k) => qualities[k].score));
  const summary = measured.length < 2 ? 'none' : avg >= CONFIG.levels.high ? 'high' : avg >= CONFIG.levels.mid ? 'mid' : 'low';
  return { qualities, strongest, summary, indicators: metr, preliminary: true, version: 3 };
}

export function buildProfile(results, ageGroup) {
  if (isV3(results)) return buildProfileV3(results, ageGroup);
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
  // Оценочный тест v3 (вес 2 / 1 по спецификации 25.11)
  balance: { gymnastics: 2, dance: 2, martial: 1, climbing: 1 },
  speed: { racket: 2, team: 2, athletics: 1, martial: 1 },
  flex: { gymnastics: 2, dance: 2, martial: 1, swimming: 1 },
  coordination: { dance: 2, team: 1, racket: 1, gymnastics: 1 },
  endurance: { athletics: 2, swimming: 1, team: 1 },
  arms: { climbing: 2, martial: 2, swimming: 1, gymnastics: 1 },
  symmetry: { gymnastics: 1, dance: 1, swimming: 1 },
  // Прежние качества (старые результаты и программа)
  legs: { athletics: 1, martial: 2, climbing: 1 },
  core: { gymnastics: 2, martial: 1, swimming: 1, climbing: 1 },
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
      // Главная сила из отчёта весит в 1,5 раза больше (Юрий 26.11): «сильная сторона: равновесие» должна вести к видам спорта, где она нужна
      const k = q === profile.strongest ? 1.5 : 1;
      for (const [s, w] of Object.entries(QUALITY_RULES[q])) t[s] = (k * w * (lvl - 1)) / 2;
      add(t, `q.${q}`);
    }
  }
  return SPORTS
    .map((s, i) => ({ sport: s, score: score[s], order: i, testW: reasons[s].filter((r) => r.key.startsWith('q.')).reduce((a, r) => a + r.w, 0), reasons: reasons[s].sort((a, b) => rprio(b.key) - rprio(a.key) || b.w - a.w).slice(0, 3).map((r) => r.key) }))
    .sort((a, b) => b.score - a.score || a.order - b.order)
    .slice(0, 3)
    // Уверенность (честно, без процентов): насколько выбор опирается на результаты теста, а не только на ответы родителя
    //   high — сильные стороны из теста дают ≥ 3 балла этому направлению; medium — ≥ 1; low — выбор почти только по интересам
    .map(({ sport, score: sc, reasons: rs, testW }) => ({ sport, score: sc, reasons: rs, confidence: testW >= 3 ? 'high' : testW >= 1 ? 'medium' : 'low' }));
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
  balance: ['squats', 'jumping_jack'],
  endurance: ['high_knees', 'jumping_jack'],
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
  const profile = buildProfile(results, quiz && quiz.age);
  return { profile, sports: recommendSports(profile, quiz), plan: buildPlan(profile, quiz, results) };
}
