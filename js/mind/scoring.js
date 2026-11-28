// Подсчёт теста «Как думает ваш ребёнок». Чистые функции без браузера (проверяются в tests/mind.test.mjs).
// 16 вопросов: выбранный вариант даёт 2 балла своей шкале. В двух первых вопросах 8 вариантов (все шкалы), в остальных по 4:
// каждая шкала встречается 9 раз, максимум 18.
// 6 ползунков (1–5): (значение − 3) × 0.5 к связанным шкалам. Процент = балл / максимум, от 0 до 100.
// Главный тип — шкала с наибольшим баллом, второй — следующая. При равенстве: выше связанный ползунок, затем шкала, выбранная раньше.
// Оттенок: среднее «энергии» и «темпа» ≥ 3.5 — быстрый, ≤ 2.5 — вдумчивый, иначе без оттенка.
import KEY from './key.js?v=3ac479c-mx0jviv6';

export const SCALES = KEY.scales;
const MAX = 2 * KEY.questions.filter((q) => q.scales.includes(SCALES[0])).length;

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
  const percent = Object.fromEntries(SCALES.map((s) => [s, Math.min(100, Math.round((100 * Math.max(pts[s], 0)) / MAX))]));
  const e = Number(sliders.energy), p = Number(sliders.pace);
  const avg = e >= 1 && p >= 1 ? (e + p) / 2 : 3;
  return { points: pts, percent, order, primary: order[0], secondary: order[1], shade: avg >= 3.5 ? 'swift' : avg <= 2.5 ? 'calm' : null };
}

// Набор карточек «Задание дня» на первые 30 дней: все 5 карточек главной шкалы, все 5 второй и 20 из остальных шести
// (у двух самых сильных из остальных по 4, у четырёх по 3). Каждый третий день — сильная сторона, одна шкала два дня подряд не идёт.
// Дни 31–40 — оставшиеся 10 карточек.
export function dailyPlan(order) {
  const all = (s) => KEY.cards.filter((c) => c.scale === s).map((c) => c.id);
  const by = (s) => all(s).slice(0, 5), next = (s) => all(s).slice(5); // первые пять карточек шкалы идут в первый месяц, остальные во второй
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
  // Второй месяц: каждая четвёртая карточка из двух ведущих шкал, остальные по кругу из прочих
  const strong2 = [], other2 = [];
  for (let i = 0; i < 3; i++) { strong2.push(next(p)[i], next(s2)[i]); for (const s of rest) other2.push(next(s)[i]); }
  const mix = [...strong2, ...other2].filter(Boolean), out2 = [];
  const st2 = mix.slice(0, strong2.filter(Boolean).length), ot2 = mix.slice(st2.length);
  while (st2.length || ot2.length) { if (st2.length && (out2.length % 4 === 0 || !ot2.length)) out2.push(st2.shift()); else out2.push(ot2.shift()); }
  // Остаток первого месяца не идёт десятью днями подряд: после первой оплаты продления сразу новые задания ведущих шкал
  const tail = [];
  for (let i = 0, j = 0; i < out2.length || j < left.length;) { if (i < out2.length) tail.push(out2[i++]); if (i < out2.length) tail.push(out2[i++]); if (j < left.length) tail.push(left[j++]); }
  return [...out, ...tail];
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
