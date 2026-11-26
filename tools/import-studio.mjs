// Все опубликованные упражнения Студії вправ (публичный каталог exercise-catalog) — в программу подписчика.
// Юрий 26.11: «забери все упражнения, которые там проверены и сделаны». Пишет js/engine/specs-studio.js:
// спека счёта, ролик панды, возраст, сложность, тексты en/de/uk. Упражнения, которые на сайте уже есть со своей
// (проверенной в прогонах) спекой, не трогаем. Повторный запуск безопасен.
// Запуск: node tools/import-studio.mjs
import fs from 'fs';
import { SPECS } from '../js/engine/specs.js';

const URL0 = 'https://iiafijcmajkitvtktntk.supabase.co/functions/v1/exercise-catalog';
const MEDIA = 'https://iiafijcmajkitvtktntk.supabase.co/storage/v1/object/public/assets/video/exercise-demo/';
// shoulder_taps в каталоге — боковой вариант; на сайте своя спека лицом (shoulder_taps_front). squats_front — без текстов.
const SKIP = new Set(['shoulder_taps', 'squats_front']);
const cat = await fetch(URL0).then((r) => { if (!r.ok) throw new Error(`каталог ${r.status}`); return r.json(); });
const out = {};
for (const e of cat) {
  if (e.status !== 'published' || SKIP.has(e.key) || SPECS[e.key]) continue;
  if (!['en', 'de', 'uk'].every((l) => e.texts && e.texts[l] && e.texts[l].name)) { console.log('нет текстов', e.key); continue; }
  const strip = (u) => (u && u.startsWith(MEDIA) ? u.slice(MEDIA.length) : u || null);
  out[e.key] = {
    spec: e.spec,
    facing: e.spec.facing,
    goal: e.spec.goal,
    video: strip(e.media && e.media.pandaVideo),
    poster: strip(e.media && e.media.poster),
    ageMin: e.age_min, ageMax: e.age_max, difficulty: e.difficulty, stat: e.stat,
    texts: Object.fromEntries(['en', 'de', 'uk'].map((l) => [l, { name: e.texts[l].name, description: e.texts[l].description || '', instructions: e.texts[l].instructions || [] }])),
    phrases: Object.keys(e.spec.phrases || {}),
  };
}
fs.writeFileSync('js/engine/specs-studio.js', `// Сгенерировано tools/import-studio.mjs из каталога Студії вправ (${new Date().toISOString().slice(0, 10)}). Не править руками.\n// Опубликованные упражнения, которых нет среди своих спек сайта: программа подписчика (js/program.js).\nexport const STUDIO = ${JSON.stringify(out, null, 1)};\n`);
console.log('добавлено', Object.keys(out).length, Object.keys(out).join(', '));
