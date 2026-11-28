// Проверки теста «Как думает ваш ребёнок»: подсчёт, набор карточек дня, полнота текстов на всех языках.
import assert from 'node:assert/strict';
import KEY from '../js/mind/key.js';
import { score, dailyPlan, dayNumber, streak, SCALES } from '../js/mind/scoring.js';
import { UI } from '../js/mind/texts.js';

let n = 0;
const ok = (name, fn) => { fn(); n++; };

ok('ключ: 16 вопросов по 4 варианта, каждая шкала 8 раз', () => {
  assert.equal(KEY.questions.length, 16);
  const cnt = {};
  for (const q of KEY.questions) { assert.equal(q.scales.length, 4); assert.equal(new Set(q.scales).size, 4); for (const s of q.scales) cnt[s] = (cnt[s] || 0) + 1; }
  for (const s of SCALES) assert.equal(cnt[s], 8, s);
});

const allOf = (scale) => Object.fromEntries(KEY.questions.map((q) => [q.id, q.scales.indexOf(scale)]).filter(([, i]) => i >= 0));
const mid = Object.fromEntries(KEY.sliders.map((s) => [s, 3]));

ok('все ответы одной шкалы: она главная, 100%', () => {
  for (const s of SCALES) {
    const r = score(allOf(s), mid);
    assert.equal(r.primary, s);
    assert.equal(r.percent[s], 100);
    assert.equal(r.shade, null);
  }
});
ok('ползунки двигают шкалы и ограничены 0–100', () => {
  const hi = score(allOf('mover'), { ...mid, energy: 5 });
  assert.equal(hi.points.mover, 17); assert.equal(hi.percent.mover, 100);
  const lo = score({}, { ...mid, energy: 1 });
  assert.equal(lo.points.mover, -1); assert.equal(lo.percent.mover, 0);
});
ok('равенство решает связанный ползунок', () => {
  const a = { ...allOf('builder') };
  // половина ответов — helper там, где он есть
  let moved = 0;
  for (const q of KEY.questions) { const i = q.scales.indexOf('helper'); if (i >= 0 && q.scales.indexOf('builder') >= 0 && moved < 4) { a[q.id] = i; moved++; } }
  const r0 = score(a, mid);
  if (r0.points.builder === r0.points.helper) {
    assert.equal(score(a, { ...mid, sensitivity: 4, persistence: 2 }).primary, 'helper');
  }
});
ok('оттенок', () => {
  assert.equal(score({}, { ...mid, energy: 5, pace: 4 }).shade, 'swift');
  assert.equal(score({}, { ...mid, energy: 2, pace: 2 }).shade, 'calm');
  assert.equal(score({}, { ...mid, energy: 5, pace: 1 }).shade, null);
});
ok('набор карточек: 40 разных, первые 30 по правилу, без повтора шкалы подряд', () => {
  const scaleOf = Object.fromEntries(KEY.cards.map((c) => [c.id, c.scale]));
  for (const p of SCALES) for (const s of SCALES) {
    if (p === s) continue;
    const order = [p, s, ...SCALES.filter((x) => x !== p && x !== s)];
    const plan = dailyPlan(order);
    assert.equal(plan.length, 40); assert.equal(new Set(plan).size, 40);
    assert.ok(plan.every((id) => scaleOf[id]), 'все карточки существуют');
    const first = plan.slice(0, 30).map((id) => scaleOf[id]);
    assert.equal(first.filter((x) => x === p).length, 5);
    assert.equal(first.filter((x) => x === s).length, 5);
    assert.equal(scaleOf[plan[0]], p, 'первый день — главная шкала');
    for (let i = 1; i < 30; i++) assert.notEqual(first[i], first[i - 1], `${p}/${s} день ${i + 1}`);
  }
});
ok('номер дня и серия', () => {
  const t = new Date(2026, 10, 28, 23, 50).getTime();
  assert.equal(dayNumber(t, t), 1);
  assert.equal(dayNumber(t, t + 20 * 60000), 2); // после полуночи — уже второй день
  assert.equal(streak([1, 2, 3], 3), 3);
  assert.equal(streak([1, 2, 3], 4), 3); // сегодня ещё не сделано — серия держится
  assert.equal(streak([1, 2, 3], 5), 0);
  assert.equal(streak([1, 3], 3), 1);
});

// Тексты: у всех языков одинаковый набор ключей, нет пустых строк
const shape = (o, p = '') => Object.entries(o).flatMap(([k, v]) => (v && typeof v === 'object' && !Array.isArray(v) ? shape(v, p + k + '.') : [p + k + ':' + (Array.isArray(v) ? `a${v.length}` : typeof v)]));
ok('тексты интерфейса: одинаковые ключи во всех языках', () => {
  const base = shape({ ...UI.en, consent: 0 }).sort();
  for (const L of ['de', 'fr', 'ru']) assert.deepEqual(shape({ ...UI[L], consent: 0 }).sort(), base, L);
});
const DATA = {};
for (const L of ['en', 'de', 'fr', 'ru']) DATA[L] = (await import(`../js/mind/data-${L}.js`)).default;
ok('данные: полные на всех языках, типографика', () => {
  const walk = (o, f, p = '') => { if (typeof o === 'string') f(o, p); else if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) walk(v, f, p + '/' + k); };
  for (const [L, d] of Object.entries(DATA)) {
    assert.equal(d.questions.length, 16); assert.equal(d.sliders.items.length, 6); assert.equal(d.sliders.labels.length, 5);
    assert.equal(d.cards.length, 40); assert.equal(Object.keys(d.report).length, 8);
    walk(d, (s, p) => {
      assert.ok(s.trim(), `${L}${p} пусто`);
      assert.ok(!s.includes('—'), `${L}${p} длинное тире`);
      if (L === 'fr') assert.ok(!/ [:;?!»]|« /.test(s), `fr${p} пробел перед знаком: ${s}`);
      if (L === 'de') assert.ok(!/"/.test(s), `de${p} прямые кавычки`);
    });
    for (const t of Object.values(d.report)) assert.ok(t.about.startsWith('{name}'), `${L} about начинается с имени`);
  }
});

console.log(`mind: ${n} проверок пройдено`);
