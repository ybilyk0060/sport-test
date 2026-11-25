import { analyze, recommend, overallIndex } from '../analyze.js';
const P = (x, y) => ({ x, y, visibility: 0.95 });
function pose({ lift = 0, knee = 0, armUp = false, oneLeg = false, sway = 0, armX = 0 }) {
  const lm = Array.from({ length: 33 }, () => P(0.5, 0.5));
  const dy = -lift;
  lm[0] = P(0.5, 0.15 + dy);
  lm[11] = P(0.45, 0.3 + dy + knee * 0.1); lm[12] = P(0.55, 0.3 + dy + knee * 0.1);
  lm[23] = P(0.46 + sway, 0.55 + dy + knee * 0.1); lm[24] = P(0.54 + sway, 0.55 + dy + knee * 0.1);
  lm[25] = P(0.46 - knee * 0.08, 0.7 + dy); lm[26] = P(0.54 + knee * 0.08, 0.7 + dy);
  lm[27] = P(0.46, 0.85 + dy); lm[28] = P(0.54, oneLeg ? 0.7 + dy : 0.85 + dy);
  lm[13] = P(0.4 - armX, armUp ? 0.2 + dy : 0.4 + dy); lm[14] = P(0.6 + armX, armUp ? 0.2 + dy : 0.4 + dy);
  lm[15] = P(0.4 - armX, armUp ? 0.1 + dy : 0.5 + dy); lm[16] = P(0.6 + armX, armUp ? 0.1 + dy : 0.5 + dy);
  return lm;
}
function session(active) {
  const f = []; let t = 0; const dt = 33;
  for (let i = 0; i < 900; i++, t += dt) {
    const s = t / 1000; let o = {};
    if (active) {
      if (s < 8) { const ph = (s * 2) % 1; o = { lift: ph < 0.4 ? Math.sin(ph / 0.4 * Math.PI) * 0.08 : 0, armUp: ph < 0.4 }; }
      else if (s < 15) { o = { knee: (Math.sin(s * 2.5) + 1) / 2 * 0.9 }; }
      else if (s < 22) { const ph = (s * 2) % 1; o = { armUp: ph < 0.5, armX: ph < 0.5 ? 0.1 : 0, lift: ph < 0.3 ? 0.04 : 0 }; }
      else o = { oneLeg: true, sway: Math.sin(s * 3) * 0.005 };
    }
    f.push({ t, lm: pose(o) });
  }
  return f;
}
const a = analyze(session(true), '7-9'), b = analyze(session(false), '7-9');
console.log('active', a.scores, a.raw);
console.log('still ', b.scores);
console.log('none  ', analyze([{ t: 0, lm: null }, { t: 100, lm: null }]).ok);
console.log(recommend(a.scores, { likes: 'team', temper: 'active', goal: 'result' }).slice(0, 3).map(s => s.name + ' ' + s.fit), overallIndex(a.scores));
let fail = 0; const ok = (c, m) => { console.log((c ? 'OK  ' : 'FAIL') + ' ' + m); if (!c) fail++; };
ok(a.raw.jumps >= 10, 'стрибки пораховані'); ok(a.raw.squats >= 3, 'присідання пораховані'); ok(a.raw.bestHold >= 5, 'баланс на одній нозі');
ok(overallIndex(a.scores) > overallIndex(b.scores) + 20, 'активна дитина вища за нерухому');
process.exit(fail ? 1 : 0);
