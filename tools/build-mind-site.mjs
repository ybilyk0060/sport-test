// Сборка отдельного сайта теста мышления для своего домена (kids-mind.com): node tools/build-mind-site.mjs [папка] [домен]
// Берёт только то, что нужно тесту: страницу (как index.html), мини-тест duo, свои модули по цепочке импортов, стили, картинки, юр. страницы.
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, existsSync } from 'node:fs';
import { join, dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const out = resolve(process.argv[2] || join(root, 'dist-mind'));
const domain = process.argv[3] || 'kids-mind.com';
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

const put = (rel, text) => { const p = join(out, rel); mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, text); };
const copy = (rel) => { const p = join(out, rel); mkdirSync(dirname(p), { recursive: true }); cpSync(join(root, rel), p, { recursive: true }); };

// Модули: всё, до чего дотягиваются импорты двух точек входа
const seen = new Set();
const walk = (file) => {
  const rel = relative(root, file);
  if (seen.has(rel) || !existsSync(file)) return;
  seen.add(rel);
  const src = readFileSync(file, 'utf8');
  for (const m of src.matchAll(/(?:from|import\()\s*'(\.{1,2}\/[^'?]+\.js)(?:\?[^']*)?'/g)) walk(resolve(dirname(file), m[1]));
};
walk(join(root, 'js/mind/app.js'));
walk(join(root, 'js/duo/app.js'));
walk(join(root, 'js/legal.js')); // юр. страницы подставляют продавца, email и цены этим модулем
for (const rel of seen) copy(rel);

for (const f of ['css/app.css', 'css/mind.css', 'legal.css', 'img/mind']) copy(f);
if (existsSync(join(root, 'css/duo.css'))) copy('css/duo.css');

// Главная = тест. На своём домене страницу можно индексировать.
const home = readFileSync(join(root, 'mind.html'), 'utf8')
  .replace(/<meta name="robots"[^>]*>\n?/, `<link rel="canonical" href="https://${domain}/">\n`);
put('index.html', home);
put('mind.html', `<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=./"><link rel="canonical" href="https://${domain}/"><script>location.replace('./' + location.search + location.hash)</script>`);
if (existsSync(join(root, 'duo.html'))) put('duo.html', readFileSync(join(root, 'duo.html'), 'utf8'));
for (const l of ['en', 'de', 'fr']) put(`legal-mind-${l}.html`, readFileSync(join(root, `legal-mind-${l}.html`), 'utf8').replaceAll('href="mind.html', 'href="./'));

put('CNAME', domain + '\n');
put('.nojekyll', '');
put('robots.txt', `User-agent: *\nAllow: /\n`);
put('404.html', `<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=/"><title>Not found</title><a href="/">Home</a>`);
console.log(`${out}: ${seen.size} модулей, домен ${domain}`);
