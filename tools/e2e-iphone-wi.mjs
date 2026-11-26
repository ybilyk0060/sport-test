// Сквозной прогон живого сайта на iPhone в ОБЫЧНОМ Safari с настоящей камерой.
// Управление через Веб-инспектор (ios_webkit_debug_proxy + tools/wi.mjs): JS-клики и чтение состояния страницы,
// скриншоты экрана телефона через devicectl. (В режиме safaridriver Safari подставляет заглушку камеры, поэтому так.)
// Человек: одно касание «Start the test» (iOS включает звук страницы только от настоящего касания), «Разрешить» камеру, упражнения.
// Запуск: ios_webkit_debug_proxy -c <UDID>:9222 &  затем  node tools/e2e-iphone-wi.mjs [url]
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
import { connect } from './wi.mjs';

const OBSERVE = process.argv.includes('--observe'); // только смотрим: человек всё нажимает сам, страницу не перезагружаем
const UDID = process.env.IPHONE_UDID || '00008130-0011095C3A04001C';
const URL0 = process.argv.find((a) => a.startsWith('http')) || 'https://kids-test.com/?lang=en&code=KTQA25X9';
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'e2e-runs', 'iphone-wi-' + new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19));
fs.mkdirSync(OUT, { recursive: true });
const T0 = Date.now();
const sec = () => +((Date.now() - T0) / 1000).toFixed(1);
const note = (type, data = {}) => { const e = { t: sec(), type, ...data }; fs.appendFileSync(path.join(OUT, 'log.jsonl'), JSON.stringify(e) + '\n'); console.log(`[${e.t}s] ${type}`, JSON.stringify(data)); };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const ANSWERS = { age: '12-15', sex: 'boy', now: 'section', likes: 'team', temper: 'active', goal: 'health', screen: 'mid' };
const IDS = ['age', 'sex', 'body', 'now', 'likes', 'temper', 'goal', 'screen'];
const BODY = { cm: '158', kg: '47' };
let shotN = 0;
function shot(name) {
  const f = `${String(++shotN).padStart(3, '0')}-${name.replace(/[^a-z0-9-]+/gi, '_').slice(0, 40)}.png`;
  try { execFileSync('xcrun', ['devicectl', 'device', 'capture', 'screenshot', '--device', UDID, '--destination', path.join(OUT, f)], { stdio: 'ignore', timeout: 20000 }); } catch (e) { note('shot_error', { msg: String(e).slice(0, 80) }); }
  return f;
}
const INIT = `if (!window.__e2e) {
  window.__e2e = { audio: [], longtasks: [] };
  const urlOf = new WeakMap(), bufUrl = new WeakMap();
  const of = window.fetch;
  window.fetch = async (...a) => { const r = await of(...a); const u = String(a[0] && a[0].url ? a[0].url : a[0]);
    if (/\\/assets\\/audio\\//.test(u)) { const ab0 = r.arrayBuffer.bind(r); r.arrayBuffer = () => ab0().then((ab) => { urlOf.set(ab, u); return ab; }); } return r; };
  const AC = window.AudioContext || window.webkitAudioContext;
  if (AC) {
    const dec = AC.prototype.decodeAudioData;
    AC.prototype.decodeAudioData = function (ab, ok, bad) { const u = urlOf.get(ab); const p = dec.call(this, ab, (b) => { if (u) bufUrl.set(b, u); ok && ok(b); }, bad); if (p && p.then) p.then((b) => { if (u) bufUrl.set(b, u); }).catch(() => {}); return p; };
    const st = AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start = function (...a) { if (this.buffer && this.buffer.duration > 0.05) window.__e2e.audio.push({ clip: (bufUrl.get(this.buffer) || '?').split('/assets/audio/')[1] || '?', dur: Math.round(this.buffer.duration * 10) / 10 }); return st.apply(this, a); };
  }
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) if (e.duration > 300) window.__e2e.longtasks.push(Math.round(e.duration)); }).observe({ type: 'longtask', buffered: true }); } catch (e) {}
  window.addEventListener('error', (e) => window.__e2e.errors = [...(window.__e2e.errors || []), String(e.message).slice(0, 200)]);
}`;
const STATE = `
  let st = {}; try { st = JSON.parse(localStorage.getItem('sporttest.v1.state') || '{}'); } catch (e) {}
  const q = (s) => document.querySelector(s), vis = (s) => { const e = q(s); return !!(e && e.offsetParent !== null); }, txt = (s) => (q(s) ? q(s).textContent.trim() : '');
  const hud = q('.hud'), v = q('video'), E = window.__e2e || { audio: [], longtasks: [], errors: [] };
  return { step: st.step || '', quizIndex: st.quizIndex, qtitle: txt('.qtitle'), stage: !!(hud && hud.innerHTML.trim()),
    framing: vis('.frame-card'), frameMsg: txt('.frame-card [data-el=msg]'), intro: vis('.sheet [data-act=go]'), introTitle: txt('.sheet h2'),
    run: vis('.gauge'), num: txt('.gauge [data-el=num]'), left: txt('[data-el=left]'), hint: txt('.hud [data-el=hint]'), title: txt('.hud-top'),
    paywall: vis('#price-top'), report: !!q('.rep-head'), aud: window.__audioState ? window.__audioState() : 'none', sess: navigator.audioSession ? navigator.audioSession.type + '/' + navigator.audioSession.state : '-', cam: v ? v.videoWidth + 'x' + v.videoHeight + ' ' + ((v.srcObject && v.srcObject.getVideoTracks()[0] || {}).label || '') : '', err: vis('[data-act=retry]') ? txt('.hud') .slice(0, 200) : '',
    audio: E.audio, longtasks: E.longtasks, errors: E.errors || [] };`;

// Поза во время упражнений: компактные точки (кисти, плечи, щиколотки, нос) — для разбора счёта (window.__poseTap в stage.js)
const POSETAP = `if (!window.__poseBuf) { window.__poseBuf = []; window.__poseTap = (key, lm) => { if (!lm) { window.__poseBuf.push([key, Date.now()]); return; } const f = (i) => [Math.round(lm[i].x * 1000) / 1000, Math.round(lm[i].y * 1000) / 1000, Math.round((lm[i].visibility ?? 1) * 100) / 100]; window.__poseBuf.push([key, Date.now(), f(0), f(11), f(12), f(15), f(16), f(23), f(24), f(27), f(28), f(25), f(26), f(13), f(14)]); }; }`;
let c; for (let k = 0; ; k++) { try { c = await connect('kids-test.com'); break; } catch (e) { if (k > 200) throw e; if (k % 10 === 0) console.log('жду вкладку kids-test.com в Safari…'); await new Promise((r) => setTimeout(r, 3000)); } }
const ev = async (expr) => { try { return await c.evaluate(expr); } catch (e) { if (/ws|timeout|closed|domain/i.test(String(e))) { c = await connect('kids-test.com'); return c.evaluate(expr); } throw e; } };
const run = (body) => ev(`(() => { ${body} })()`);
const click = (css) => run(`const e = document.querySelector(${JSON.stringify(css)}); if (!e) return false; e.click(); return true;`);
const setVal = (css, v) => run(`const e = document.querySelector(${JSON.stringify(css)}); if (!e) return false; e.value = ${JSON.stringify(v)}; e.dispatchEvent(new Event('input', { bubbles: true })); return true;`);

note('start', { url: URL0 });
for (let k = 0; k < 5; k++) { try { await ev('1'); break; } catch (e) { note('connect_retry', { msg: String(e).slice(0, 80) }); await wait(2000); try { c.close(); } catch {} c = await connect('kids-test.com'); } }
if (!OBSERVE) await run(`try { localStorage.clear(); ${process.env.ASK_CONSENT ? '' : "localStorage.setItem('sporttest.consent', 'necessary');"} } catch (e) {} location.href = ${JSON.stringify(URL0)}; return 1;`);
await wait(4000);
c.close(); c = await connect('kids-test.com');
await ev(INIT);
note('waiting', { msg: 'ЖДУ касания «Start the test» на телефоне' });
shot('landing');
let paywallDone = false, payWaitFrom = 0, audLogged = '', soundChecked = false;
const SOUNDCHECK = process.argv.includes('--soundcheck');
let last = '', lastHud = '', since = Date.now(), introSince = 0, a0 = 0, l0 = 0, e0 = 0, lastPeriodic = 0, camLogged = '', prepClicked = 0;
const steps = {};
for (;;) {
  await wait(300);
  let s;
  try { await ev(INIT); await ev(POSETAP); const pb = await run('const b = window.__poseBuf || []; window.__poseBuf = []; return b;'); if (pb && pb.length) fs.appendFileSync(path.join(OUT, 'pose.jsonl'), pb.map((x) => JSON.stringify(x)).join('\n') + '\n'); s = await run(STATE); } catch (e) { note('eval_error', { msg: String(e).slice(0, 160) }); await wait(1000); continue; }
  for (const a of s.audio.slice(a0)) note('voice', a); a0 = s.audio.length;
  for (const ms of s.longtasks.slice(l0)) note('freeze', { ms }); l0 = s.longtasks.length;
  for (const m of s.errors.slice(e0)) note('page_error', { msg: m }); e0 = s.errors.length;
  const audKey = `${String(s.aud).split('@')[0]}|${s.sess}`;
  if (audKey !== audLogged) { audLogged = audKey; note('audio', { ctx: s.aud, session: s.sess }); }
  if (s.cam && s.cam !== camLogged) { camLogged = s.cam; note('camera', { info: s.cam }); }
  const key = s.report ? 'report' : s.paywall ? 'paywall' : s.err ? 'camera_error' : s.run ? `run:${s.title}` : s.intro ? `intro:${s.introTitle}` : s.framing ? 'framing' : s.stage ? 'stage' : `${s.step}${s.step === 'quiz' ? ':' + s.quizIndex : ''}`;
  if (key !== last) {
    if (last) { steps[last] = +((Date.now() - since) / 1000).toFixed(1); note('step_end', { step: last, sec: steps[last] }); }
    last = key; since = Date.now(); introSince = s.intro ? Date.now() : 0;
    note('screen', { step: key, title: s.qtitle || s.introTitle || s.title, err: s.err || undefined, shot: shot(key) });
  }
  if (s.run) {
    const h = `${s.num}|${s.left}|${s.hint}`;
    if (h !== lastHud) { lastHud = h; note('hud', { ex: s.title, num: s.num, left: s.left, hint: s.hint }); }
    if (Date.now() - lastPeriodic > 2500) { lastPeriodic = Date.now(); shot('run'); }
  }
  if (s.framing && Date.now() - lastPeriodic > 3000) { lastPeriodic = Date.now(); note('framing', { msg: s.frameMsg }); shot('framing'); }
  if (OBSERVE) { if (sec() > 600) break; continue; }
  try {
    if (SOUNDCHECK && s.step === 'quiz' && !soundChecked) { soundChecked = true; await run("window.__say && window.__say('balance_howto'); return 1;"); await wait(1500); note('soundcheck', { at: 'анкета, до камеры', ctx: await run("return window.__audioState ? window.__audioState() : 'none'") }); }
    if (SOUNDCHECK && s.intro) { note('soundcheck', { at: 'вступление после камеры', ctx: s.aud, session: s.sess }); await wait(8000); note('soundcheck_end', { ctx: await run("return window.__audioState ? window.__audioState() : 'none'") }); break; }
    if (process.env.E2E_DRY && s.step === 'landing') { await wait(800); await click('[data-act=start]'); }
    else if (process.env.E2E_DRY && s.step === 'prep') { note('dry_stop', { steps }); break; }
    else if (s.step === 'quiz' && !s.stage) {
      if (await run('return !!document.querySelector("[data-el=cm]")')) { await wait(600); await setVal('[data-el=cm]', BODY.cm); await setVal('[data-el=kg]', BODY.kg); await wait(500); await click('[data-act=next]'); await wait(500); }
      else { const v = ANSWERS[IDS[s.quizIndex]]; await wait(900); if (v) await click(`[data-act=pick][data-v="${v}"]`); await wait(500); }
    } else if (s.step === 'prep' && !s.stage && Date.now() - prepClicked > 8000) {
      // 26.11: камеру включает человек своим касанием. Если включить её кликом из кода (не жест пользователя), iOS глушит
      // голос страницы на всё упражнение; руками в Safari звук есть (проверено Юрием). Без касания ждём; AUTO_CAM=1 — по-старому.
      prepClicked = Date.now();
      if (process.env.AUTO_CAM) { await wait(1500); note('action', { what: 'нажал «включить камеру» кодом (звук может пропасть)' }); await click('[data-act=cam]'); await wait(2000); }
      else note('waiting', { msg: 'ЖДУ касания «включить камеру» на телефоне' });
    } else if (s.intro && introSince && Date.now() - introSince > 30000) { note('action', { what: 'рука не распознана за 30 с — нажал «Старт»' }); introSince = Date.now(); await click('.sheet [data-act=go]'); }
    else if (s.paywall && !paywallDone) {
      paywallDone = true;
      await wait(2500);
      note('paywall', { msg: 'пейвол: снимаю страницу целиком, затем жду оплату человеком' });
      const h = await run('return document.documentElement.scrollHeight'), vh = await run('return window.innerHeight');
      for (let y = 0, i = 0; y < h && i < 12; y += vh * 0.85, i++) { await run(`window.scrollTo(0, ${Math.round(y)}); return 1;`); await wait(600); shot(`paywall-${i}`); }
      await run('window.scrollTo(0, 0); return 1;');
      payWaitFrom = Date.now();
    } else if (paywallDone && !s.report && Date.now() - lastPeriodic > 4000) {
      lastPeriodic = Date.now(); shot('checkout');
      if (Date.now() - payWaitFrom > 15 * 60000) { note('pay_timeout'); break; }
    } else if (s.report) {
      await wait(2500);
      note('report', { msg: 'оплата прошла, отчёт открыт' });
      await run("document.querySelectorAll('details.sec').forEach((d) => { d.open = true; }); return 1;");
      await wait(800);
      const h = await run('return document.documentElement.scrollHeight'), vh = await run('return window.innerHeight');
      for (let y = 0, i = 0; y < h && i < 20; y += vh * 0.85, i++) { await run(`window.scrollTo(0, ${Math.round(y)}); return 1;`); await wait(600); shot(`report-${i}`); }
      await run('window.scrollTo(0, 0); return 1;');
      note('done', { total_sec: sec(), steps, sub: await run("const st = JSON.parse(localStorage.getItem('sporttest.v1.state') || '{}'); return st.sub ? { status: st.sub.status, paidUntil: st.sub.paidUntil, token: !!st.subToken, orderId: st.orderId } : null;") });
      break;
    }
  } catch (e) { note('action_error', { step: key, msg: String(e).slice(0, 160) }); }
  if (sec() > 1800) { note('timeout'); break; }
}
fs.writeFileSync(path.join(OUT, 'summary.json'), JSON.stringify({ url: URL0, total_sec: sec(), steps }, null, 2));
c.close();
console.log('OUT', OUT);
process.exit(0);
