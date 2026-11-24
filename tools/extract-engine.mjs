// Обновление движка из новой сборки Студії вправ (kidsney-demo/studio/assets/studio-*.js).
// Запуск: node tools/extract-engine.mjs <путь к studio-XXXX.js>
// Вырезает фрагмент «геометрия → калибровка по возрасту → сглаживание → анализатор → движок спеков» без правок.
// Имена минифицированы и меняются от сборки к сборке: после запуска проверьте строку export и прогоните npm test.
import fs from 'fs'; import crypto from 'crypto';
const src = fs.readFileSync(process.argv[2], 'utf8');
const a = src.search(/function \w+\(e,t,n\)\{const s=Math\.atan2\(n\.y-t\.y,n\.x-t\.x\)-Math\.atan2/);
const b = src.search(/const \w+=\(e,t,n,s\)=>\(\{text:\{en:e,uk:t,de:n\}/);
if (a < 0 || b < 0 || b < a) throw new Error('границы движка не найдены — сборка изменилась, нужен ручной разбор');
const body = src.slice(a, b);
console.log('фрагмент', a, b, 'sha256', crypto.createHash('sha256').update(body).digest('hex'));
fs.writeFileSync('js/engine/kidsney-engine.extracted.js', body);
console.log('записано js/engine/kidsney-engine.extracted.js — добавьте шапку и export по образцу kidsney-engine.js');
