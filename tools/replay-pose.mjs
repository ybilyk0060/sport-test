import fs from 'fs';
const { createRun } = await import('/Users/Urij/спорт тест/js/session.js');
const IDX = [0, 11, 12, 15, 16, 23, 24, 27, 28, 25, 26, 13, 14]; // 13/14 (локти) — в записях с 26.11 вечера
const KEY = process.env.KEY || 'jumping_jack', AGE = process.env.AGE || '12-15', CAP = Number(process.env.CAP || 20);
for (const d of process.argv.slice(2)) {
  const rows = fs.readFileSync(d + '/pose.jsonl', 'utf8').trim().split('\n').map((l) => JSON.parse(l)).filter((r) => r[0] === KEY);
  if (!rows.length) { console.log(d.split('/').pop(), 'нет записей', KEY); continue; }
  let now = rows[0][1], res = null, count = 0;
  const run = createRun({ key: KEY, target: 999, capSec: CAP, ageGroup: AGE, aspect: 9 / 16, clock: () => now, on: { count: (c) => { count = c; }, hint: () => {}, finish: (r) => { res = r; } } });
  run.start();
  for (const r of rows) {
    now = r[1];
    if (r.length < 3) { run.frame(null); continue; }
    const lm = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, z: 0, visibility: 0 }));
    IDX.forEach((ix, j) => { const p = r[2 + j]; if (p) lm[ix] = { x: p[0], y: p[1], z: 0, visibility: p[2] }; });
    // локти и кисти-пальцы — между плечом и кистью (их нет в записи)
    if (r.length < 15) for (const [e, s, w] of [[13, 11, 15], [14, 12, 16]]) lm[e] = { x: (lm[s].x + lm[w].x) / 2, y: (lm[s].y + lm[w].y) / 2, z: 0, visibility: Math.min(lm[s].visibility, lm[w].visibility) };
    run.frame(lm);
  }
  if (!res) run.end && run.end('ended');
  console.log(d.split('/').pop(), KEY, 'count', count, res ? res.done : '', res ? JSON.stringify(res.metrics) : '');
}
process.exit(0);
