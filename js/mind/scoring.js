// Подсчёт теста «Как думает ваш ребёнок». Чистые функции без браузера (проверяются в tests/mind.test.mjs).
// 16 вопросов: выбранный вариант даёт 2 балла своей шкале (каждая шкала встречается 8 раз, максимум 16).
// 6 ползунков (1–5): (значение − 3) × 0.5 к связанным шкалам. Процент = балл / 16, от 0 до 100.
// Главный тип — шкала с наибольшим баллом, второй — следующая. При равенстве: выше связанный ползунок, затем шкала, выбранная раньше.
// Оттенок: среднее «энергии» и «темпа» ≥ 3.5 — быстрый, ≤ 2.5 — вдумчивый, иначе без оттенка.
import KEY from './key.js';

export const SCALES = KEY.scales;

export function score(answers, sliders) {
  const pts = Object.fromEntries(SCALES.map((s) => [s, 0]));
  const firstPick = {}; // порядок первого выбора шкалы (для равенства)
  KEY.questions.forEach((q, i) => {
    const s = q.scales[answers[q.id]];
    if (!s) return;
    pts[s] += 2;
    if (!(s in firstPick)) firstPick[s] = i;
  });
  const linked = Object.fromEntries(SCALES.map((s) => [s, 0])); // самый высокий связанный ползунок шкалы
  for (const [id, scales] of Object.entries(KEY.sliderMap)) {
    const v = Number(sliders[id]);
    if (!(v >= 1 && v <= 5)) continue;
    for (const s of scales) { pts[s] += (v - 3) * 0.5; linked[s] = Math.max(linked[s], v); }
  }
  const order = [...SCALES].sort((a, b) => pts[b] - pts[a] || linked[b] - linked[a] || (firstPick[a] ?? 99) - (firstPick[b] ?? 99) || SCALES.indexOf(a) - SCALES.indexOf(b));
  const percent = Object.fromEntries(SCALES.map((s) => [s, Math.min(100, Math.round((100 * Math.max(pts[s], 0)) / 16))]));
  const e = Number(sliders.energy), p = Number(sliders.pace);
  const avg = e >= 1 && p >= 1 ? (e + p) / 2 : 3;
  return { points: pts, percent, order, primary: order[0], secondary: order[1], shade: avg >= 3.5 ? 'swift' : avg <= 2.5 ? 'calm' : null };
}

// Набор карточек «Задание дня» на первые 30 дней: все 5 карточек главной шкалы, все 5 второй и 20 из остальных шести
// (у двух самых сильных из остальных по 4, у четырёх по 3). Каждый третий день — сильная сторона, одна шкала два дня подряд не идёт.
// Дни 31–40 — оставшиеся 10 карточек.
export function dailyPlan(order) {
  const by = (s) => KEY.cards.filter((c) => c.scale === s).map((c) => c.id);
  const [p, s2, ...rest] = order;
  const strong = [];
  for (let i = 0; i < 5; i++) strong.push(by(p)[i], by(s2)[i]);
  const take = rest.map((s, i) => by(s).slice(0, i < 2 ? 4 : 3));
  const left = rest.flatMap((s, i) => by(s).slice(i < 2 ? 4 : 3));
  const other = [];
  for (let round = 0; round < 4; round++) for (const t of take) if (t[round]) other.push(t[round]);
  const out = [];
  let a = 0, b = 0;
  for (let i = 0; i < 30; i++) out.push(i % 3 === 0 ? strong[a++] : other[b++]);
  return [...out, ...left];
}

// Номер дня подписки (с 1) по местным календарным дням
export function dayNumber(startedAt, now = Date.now()) {
  const d0 = new Date(startedAt), d1 = new Date(now);
  const a = Date.UTC(d0.getFullYear(), d0.getMonth(), d0.getDate()), b = Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate());
  return Math.max(1, Math.round((b - a) / 86400000) + 1);
}

// Сколько дней подряд выполнено, считая сегодняшний или вчерашний день как конец серии
export function streak(doneDays, today) {
  const set = new Set(doneDays);
  let d = set.has(today) ? today : today - 1, n = 0;
  while (d >= 1 && set.has(d)) { n++; d--; }
  return n;
}
