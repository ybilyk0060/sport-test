// Ставит одну метку версии (?v=...) на все свои JS-модули: импорты в js/** и <script src="js/..."> в *.html.
// GitHub Pages кэширует файлы на 10 минут; с меткой вернувшийся посетитель сразу получает новый набор модулей целиком
// (без смеси старых и новых файлов). Запускать перед каждой выкладкой: node tools/stamp-version.mjs
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const root = fileURLToPath(new URL('..', import.meta.url));
const stamp = process.argv[2] || (() => {
  try { return execSync('git rev-parse --short HEAD', { cwd: root }).toString().trim() + '-' + Date.now().toString(36); }
  catch { return Date.now().toString(36); }
})();

const walk = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const tag = (spec) => spec.replace(/\?v=[^'"]*$/, '') + `?v=${stamp}`; // js и css
let changed = 0;
const save = (p, before, after) => { if (after !== before) { writeFileSync(p, after); changed++; } };

for (const p of walk(join(root, 'js')).filter((f) => f.endsWith('.js'))) {
  const s = readFileSync(p, 'utf8');
  // только относительные импорты своих модулей; vendor (mediapipe) не трогаем
  const t = s.replace(/((?:from|import\()\s*')(\.{1,2}\/[^']+?\.js(?:\?v=[^']*)?)(')/g,
    (m, a, spec, b) => (spec.includes('vendor/') ? m : a + tag(spec) + b));
  save(p, s, t);
}
for (const f of readdirSync(root).filter((f) => f.endsWith('.html'))) {
  const p = join(root, f), s = readFileSync(p, 'utf8');
  const t = s.replace(/(<script type="module" src=")(js\/[^"]+?\.js(?:\?v=[^"]*)?)(")/g, (m, a, spec, b) => a + tag(spec) + b)
    .replace(/((?:from|import\()\s*')(\.\/js\/[^']+?\.js(?:\?v=[^']*)?)(')/g, (m, a, spec, b) => a + tag(spec) + b)
    .replace(/(<link rel="stylesheet" href=")((?:css\/[^"]+?|legal)\.css(?:\?v=[^"]*)?)(")/g, (m, a, spec, b) => a + tag(spec) + b);
  save(p, s, t);
}
console.log(`stamp ${stamp}: ${changed} files`);
