// Статичные рекламные креативы теста мышления (EN, США): node tools/mind-ads.cjs [папка]
// Рисует HTML в PNG трёх форматов: 1x1 (1080x1080), 4x5 (1080x1350), 9x16 (1080x1920, с безопасными полями).
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const OUT = process.argv[2] || path.join(ROOT, 'ads-mind');
const b64 = (f, type) => `data:${type};base64,${fs.readFileSync(f).toString('base64')}`;
const img = (f) => (fs.existsSync(f) ? b64(f, f.endsWith('.png') ? 'image/png' : 'image/webp') : '');
const ART = {
  hero: img(path.join(ROOT, 'img/mind/hero.webp')),
  focus: img(path.join(ROOT, 'ads-mind/src/focus.png')),
  mom: img(path.join(ROOT, 'ads-mind/src/mom.png')),
};
const TYPES = [['🧱', 'Builder', '#fff1d6,#ffe1c2'], ['💡', 'Inventor', '#dff4ff,#d9e8ff'], ['📖', 'Storyteller', '#ffe6f0,#f3e3ff'], ['🎨', 'Artist', '#f3e3ff,#ffe9d6'],
  ['🧭', 'Explorer', '#e0f7e4,#dff4ff'], ['🚩', 'Leader', '#fff3c9,#ffe1d6'], ['🤝', 'Helper', '#ffe3e3,#fff1d6'], ['⚡', 'Mover', '#dcf7ef,#e6f3d2']];
const tiles = () => `<div class="tiles">${TYPES.map(([i, n, g]) => `<div style="background:linear-gradient(135deg,${g})"><i>${i}</i><b>${n}</b></div>`).join('')}</div>`;
const result = () => `<div class="res"><div class="rc"><span class="ic">🧭</span><small>YOUR CHILD’S THINKING STYLE</small><b>Explorer</b><span>Observes, collects facts and goes to see what’s around the corner</span></div>
  <div class="bars">${[['Explorer', 86], ['Inventor', 71], ['Builder', 58]].map(([n, v]) => `<div><span>${n}</span><i><u style="width:${v}%"></u></i></div>`).join('')}<div class="lock">🔒 5 more areas in the full report</div></div></div>`;
const pic = (k) => `<div class="pic"><img src="${ART[k]}"></div>`;

// Концепции: имя, блок с картинкой, заголовок, подзаголовок, кнопка
const ADS = [
  { id: 'M1_hero', art: () => pic('hero'), h: 'What kind of thinker is your child?', p: 'A 3-minute test for parents of kids aged 3 to 12', cta: 'Take the test' },
  { id: 'M2_types', art: tiles, h: 'Builder? Explorer? Storyteller?', p: '8 thinking styles. Which one is your child?', cta: 'Find out in 3 minutes' },
  { id: 'M3_result', art: result, h: 'See how your child thinks', p: 'Answer 25 quick questions. No camera, no sign-up.', cta: 'Start the test' },
  { id: 'M4_focus', art: () => pic('focus'), h: 'An hour on blocks. Five minutes on homework.', p: 'It’s not laziness. It’s a thinking style. Find your child’s in 3 minutes.', cta: 'Take the test', need: 'focus' },
  { id: 'M5_mom', art: () => pic('mom'), h: 'You answer 25 questions. You see how your child thinks.', p: '3 minutes. Your child doesn’t even need to be there.', cta: 'Take the test', need: 'mom' },
];
const SIZES = { '1x1': [1080, 1080], '4x5': [1080, 1350], '9x16': [1080, 1920] };

const page = (ad, fmt) => `<!doctype html><html><head><meta charset="utf-8"><style>
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:100%;height:100%}
body{font-family:Inter,system-ui,sans-serif;color:#1e1a3a;background:#f5f2ff;display:flex;flex-direction:column;justify-content:center;gap:var(--gap);padding:var(--pt) 64px var(--pb)}
body.f1x1{--gap:30px;--pt:56px;--pb:56px;--h:74px;--p:36px;--art:430px}
body.f4x5{--gap:40px;--pt:70px;--pb:70px;--h:84px;--p:40px;--art:600px}
body.f9x16{--gap:52px;--pt:270px;--pb:390px;--h:88px;--p:42px;--art:640px}
.brand{display:flex;align-items:center;gap:14px;font-weight:700;font-size:30px;color:#4a32c8}
.brand i{width:44px;height:44px;border-radius:50%;background:#6a4df4;display:grid;place-items:center;color:#fff;font-style:normal;font-size:26px}
h1{font-family:Georgia,"Liberation Serif","DejaVu Serif",serif;font-size:var(--h);line-height:1.06;letter-spacing:-.015em}
p{font-size:var(--p);line-height:1.3;color:#57537a}
.cta{align-self:flex-start;background:#6a4df4;color:#fff;font-weight:700;font-size:40px;padding:26px 56px;border-radius:999px;box-shadow:0 16px 36px rgba(106,77,244,.32)}
.pic{height:var(--art);border-radius:44px;overflow:hidden;background:#fdf3e1;box-shadow:0 20px 44px rgba(75,47,214,.16);flex:none}
.pic img{width:100%;height:100%;object-fit:cover;display:block}
.tiles{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.tiles div{display:flex;align-items:center;gap:18px;padding:0 26px;border-radius:28px;height:calc((var(--art) - 48px)/4)}
.tiles i{font-style:normal;font-size:52px;line-height:1}
.tiles b{font-size:38px}
.res{display:grid;gap:22px}
.rc{background:linear-gradient(150deg,#4b2fd6,#8f6bff 70%,#b79bff);border-radius:44px;padding:40px 44px;color:#fff;display:grid;gap:8px;box-shadow:0 20px 44px rgba(75,47,214,.25)}
.rc .ic{font-size:68px;line-height:1}
.rc small{font-size:24px;font-weight:700;letter-spacing:.08em;opacity:.9;margin-top:6px}
.rc b{font-family:Georgia,"Liberation Serif",serif;font-size:76px;line-height:1}
.rc span:last-child{font-size:32px;line-height:1.25;opacity:.95}
.bars{background:#fff;border-radius:36px;padding:30px 36px;display:grid;gap:18px;box-shadow:inset 0 0 0 2px #e2dcf7}
.bars div{display:flex;align-items:center;gap:20px;font-size:30px;font-weight:700}
.bars span{flex:0 0 170px}
.bars i{flex:1;height:22px;border-radius:12px;background:#e8e2ff;overflow:hidden}
.bars u{display:block;height:100%;border-radius:12px;background:linear-gradient(90deg,#6a4df4,#a58bff)}
.bars .lock{font-size:26px;font-weight:600;color:#6a6788}
body.f1x1 .rc{padding:28px 36px} body.f1x1 .rc b{font-size:64px} body.f1x1 .rc .ic{font-size:54px} body.f1x1 .bars{padding:22px 30px;gap:12px} body.f1x1 .bars .lock{display:none}
body.f1x1 .cta{font-size:36px;padding:22px 48px}
.note{font-size:22px;color:#8a87a6}
</style></head><body class="f${fmt}">
<div class="brand"><i>★</i>kids-mind.com</div>
${ad.art()}
<h1>${ad.h}</h1><p>${ad.p}</p><div class="cta">${ad.cta}</div>
</body></html>`;

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch();
  for (const ad of ADS) {
    if (ad.need && !ART[ad.need]) { console.log('skip', ad.id, '(нет картинки)'); continue; }
    for (const [fmt, [w, h]] of Object.entries(SIZES)) {
      const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
      await p.setContent(page(ad, fmt)); await p.waitForTimeout(150);
      const over = await p.evaluate(() => document.body.scrollHeight - innerHeight);
      await p.screenshot({ path: path.join(OUT, `EN_${ad.id}_${fmt}.png`) });
      console.log(ad.id, fmt, over > 0 ? 'OVERFLOW ' + over : 'ok');
      await p.close();
    }
  }
  await b.close();
})();
