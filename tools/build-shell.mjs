// Вшивает первый экран в index.html, чтобы заголовок и кнопка Start появлялись сразу с ответом сервера,
// а не после загрузки всех модулей (замер 28.11: 1,2 с на хорошем 4G, 3,6 с на 3G белого экрана).
// Разметка — та же функция, что рисует экран в программе (js/landing-html.js), тексты — из js/i18n.
// Запуск: node tools/build-shell.mjs          — обновить index.html
//         node tools/build-shell.mjs --check  — проверить, что вшитый экран совпадает с текстами (для npm test)
// tools/stamp-version.mjs вызывает его сам перед выкладкой.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const { landingHtml } = await import('../js/landing-html.js');
const { ART } = await import('../js/art.js');
const { CONFIG } = await import('../js/config.js');
const ALL = { en: (await import('../js/i18n/en.js')).default, de: (await import('../js/i18n/de.js')).default, uk: (await import('../js/i18n/uk.js')).default };

const langs = (CONFIG.languages || ['en']).filter((k) => ALL[k]);
const linkOnly = CONFIG.linkOnlyLanguages || [];
const html = Object.fromEntries(langs.map((k) => [k, `<section class="screen">${landingHtml({ T: ALL[k], lang: k, langs, linkOnly, heroArt: ART.hero, video: false })}</section>`]));
const data = JSON.stringify({ langs, linkOnly, t: html }).replace(/</g, '\\u003c');

// Маленький скрипт без модулей: выбирает язык так же, как js/i18n/index.js, и показывает экран только новому посетителю
// (нет сохранённого шага дальше первого экрана и нет служебных параметров: ссылка подписки, перенос ответов, возврат с оплаты).
const script = `<script>(function(){try{var q=new URLSearchParams(location.search);if(q.get('sub')||q.get('s')||q.get('pay')||q.get('_ptxn'))return;` +
  `var st=null;try{st=localStorage.getItem('sporttest.v1.state')}catch(e){}if(st){var o=JSON.parse(st);if(!o||o.results||(o.step&&o.step!=='landing'))return}` +
  `var D=${data},l=q.get('lang');if(!(l&&D.t[l])){l=null;try{var s=localStorage.getItem('sporttest.lang');if(s&&D.t[s])l=s}catch(e){}}` +
  `if(!l){var n=navigator.languages||[navigator.language];for(var i=0;i<n.length&&!l;i++){var c=String(n[i]||'').slice(0,2).toLowerCase();` +
  `if((c==='uk'||c==='ru')&&D.t.uk&&D.linkOnly.indexOf('uk')<0)l='uk';else if(c==='de'&&D.t.de)l='de';else if(c==='en'&&D.t.en)l='en'}}` +
  `if(!l)l=D.langs[0];var a=document.getElementById('app');a.innerHTML=D.t[l];document.documentElement.lang=l;window.__ktShell=l;` +
  `a.onclick=function(e){var b=e.target.closest&&e.target.closest('[data-act="start"]');if(b){window.__ktStart=1;b.classList.add('wait')}}` +
  `}catch(e){}})();</script>`;

const A = '<!-- shell:start (собирает tools/build-shell.mjs, руками не править) -->', B = '<!-- shell:end -->';
const p = root + 'index.html';
const src = readFileSync(p, 'utf8');
const i = src.indexOf(A), j = src.indexOf(B);
if (i < 0 || j < 0) { console.log('FAIL: в index.html нет меток shell:start / shell:end'); process.exit(1); }
const out = src.slice(0, i + A.length) + '\n' + script + '\n' + src.slice(j);
if (process.argv.includes('--check')) {
  if (out !== src) { console.log('FAIL: вшитый первый экран в index.html устарел — запустите node tools/build-shell.mjs'); process.exit(1); }
  console.log('вшитый первый экран: OK');
} else {
  if (out !== src) writeFileSync(p, out);
  console.log(`shell: ${langs.join(', ')} · ${Math.round(script.length / 1024)} КБ${out !== src ? ' · index.html обновлён' : ' · без изменений'}`);
}
