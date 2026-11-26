// Ролики панды на зелёном фоне для программы: находит assets/video/<key>-g1.mp4 (без ручного выбора в CONFIG),
// считает рамку панды по всем кадрам (где не зелёный фон) и пишет js/green-boxes.js — config.js подключает их как gVideo/gBox.
// Запуск: node tools/green-boxes.mjs [ключ …]
import fs from 'fs';
import { execFileSync } from 'child_process';
import { createRequire } from 'module';
const ff = createRequire('/Volumes/KidsneyDrive/dev/kidsney/package.json')('ffmpeg-static');
const W = 90, H = 160;
const prev = fs.existsSync('js/green-boxes.js') ? (await import('../js/green-boxes.js')).GREEN : {};
const files = fs.readdirSync('assets/video').filter((f) => /-g1\.mp4$/.test(f));
const only = process.argv.slice(2);
const out = { ...prev };
for (const f of files) {
  const key = f.replace(/-g1\.mp4$/, '');
  if (only.length && !only.includes(key)) continue;
  const raw = execFileSync(ff, ['-loglevel', 'error', '-i', `assets/video/${f}`, '-vf', `fps=6,scale=${W}:${H}`, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], { maxBuffer: 1 << 28 });
  let x0 = W, y0 = H, x1 = 0, y1 = 0;
  for (let i = 0; i < raw.length; i += 3) {
    const r = raw[i], g = raw[i + 1], b = raw[i + 2];
    if (g - Math.max(r, b) < 40) { const p = i / 3, x = p % W, y = Math.floor(p / W) % H; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  }
  if (x1 <= x0 || y1 <= y0) { console.log('пусто', key); continue; }
  const r3 = (v) => Math.round(v * 1000) / 1000;
  out[key] = { video: `assets/video/${f}`, box: [r3(x0 / W), r3(y0 / H), r3((x1 + 1) / W), r3((y1 + 1) / H)] };
  console.log(key, out[key].box.join(' '));
}
fs.writeFileSync('js/green-boxes.js', `// Сгенерировано tools/green-boxes.mjs: ролики панды на зелёном фоне и рамка панды в кадре. Не править руками.\nexport const GREEN = ${JSON.stringify(out, null, 1)};\n`);
