// Собирает данные теста «Как думает ваш ребёнок» по языкам: mind-src/*.json → js/mind/data-<lang>.js.
// Источники (вопросы, типы, тексты отчёта, карточки дня) правятся в mind-src/, затем: node tools/build-mind-data.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const read = (f) => JSON.parse(readFileSync(root + 'mind-src/' + f, 'utf8'));
const spec = read('spec.json'), report = read('report.json'), cards = read('cards.json');
const LANGS = ['en', 'de', 'fr', 'ru'];
const NB = ' ';
// Французская типографика: неразрывный пробел перед : ; ? ! и внутри « »
const fr = (s) => s.replace(/(\p{L})'(\p{L})/gu, '$1’$2').replace(/« /g, '«' + NB).replace(/ »/g, NB + '»').replace(/ ([:;?!])/g, NB + '$1');
const fix = (s, L) => (L === 'fr' ? fr(s) : s);

for (const L of LANGS) {
  const t = (o) => { if (typeof o[L] !== 'string' || !o[L].trim()) throw new Error(`no ${L} text: ${JSON.stringify(o).slice(0, 80)}`); return fix(o[L], L); };
  const [age, gender] = spec.intro;
  const data = {
    intro: { ageQ: t(age.text), ages: age.options, genderQ: t(gender.text), genders: gender.options.map(t) },
    questions: spec.questions.map((q) => ({ id: q.id, text: t(q.text), options: q.options.map((o) => ({ scale: o.scale, text: t(o.text) })) })),
    sliders: { labels: spec.sliders.scale_labels[L], items: spec.sliders.items.map((i) => ({ id: i.id, text: t(i.text) })) },
    goal: { text: t(spec.goal.text), options: spec.goal.options.map((o) => ({ id: o.id, text: t(o.text) })) },
    types: Object.fromEntries(Object.entries(spec.types).map(([k, v]) => [k, { name: t(v.name), nameF: t(v.name_f), tagline: t(v.tagline), careers: t(v.careers) }])),
    shade: Object.fromEntries(['swift', 'calm'].map((k) => [k, { m: spec.scoring.shade[k][L], f: spec.scoring.shade[k][L + '_f'] || spec.scoring.shade[k][L] }])),
    disclaimer: t(spec.disclaimer),
    report: Object.fromEntries(Object.entries(report.types).map(([k, v]) => [k, {
      about: t(v.about), hooks: t(v.hooks), strengths: v.strengths.map(t), grow: t(v.grow), say: v.say.map(t),
      ages: Object.fromEntries(Object.entries(v.ages).map(([a, x]) => [a, t(x)])), plan: v.plan.map(t), ...(v.extra ? { extra: t(v.extra) } : {}),
    }])),
    cards: cards.cards.map((c) => ({ id: c.id, scale: c.scale, title: t(c.title), task: Object.fromEntries(Object.entries(c.task).map(([a, x]) => [a, t(x)])) })),
    safety: t(cards.safety_note),
  };
  writeFileSync(`${root}js/mind/data-${L}.js`, `// Собрано tools/build-mind-data.mjs из mind-src/*.json. Руками не править.\nexport default ${JSON.stringify(data)};\n`);
}
// Ключи подсчёта (без текстов): какой вариант какой шкале даёт балл, связи ползунков со шкалами
const key = {
  scales: Object.keys(spec.types),
  questions: spec.questions.map((q) => ({ id: q.id, scales: q.options.map((o) => o.scale) })),
  sliders: spec.sliders.items.map((i) => i.id),
  sliderMap: spec.scoring.slider_map,
  cards: cards.cards.map((c) => ({ id: c.id, scale: c.scale })),
};
writeFileSync(`${root}js/mind/key.js`, `// Собрано tools/build-mind-data.mjs из mind-src/*.json. Руками не править.\nexport default ${JSON.stringify(key)};\n`);
console.log('mind data: ' + LANGS.join(', '));
