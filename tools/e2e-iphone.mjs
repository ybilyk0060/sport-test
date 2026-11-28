// Сквозной прогон живого сайта на настоящем iPhone (Safari + настоящая камера) через safaridriver с Mac.
// Драйвер сам нажимает лендинг, анкету, камеру и экраны; человек только делает упражнения перед телефоном.
// Пишет в ./e2e-runs/iphone-<время>/: скриншоты каждого экрана и каждые 2 с во время упражнений, log.jsonl
// (время шагов, счёт, подсказки, какой голос звучал, зависания, ошибки), summary.json.
// Подготовка (один раз): iPhone → Настройки → Safari → Дополнения → «Веб-инспектор» и «Удалённая автоматизация»;
// на Mac: sudo safaridriver --enable. Телефон по кабелю, разблокирован.
// Запуск: node tools/e2e-iphone.mjs [url] [--dry]   (--dry: только до экрана камеры, без человека)
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const UDID = process.env.IPHONE_UDID || '00008130-0011095C3A04001C';
const args = process.argv.slice(2);
const DRY = args.includes('--dry');
const URL0 = args.find((a) => a.startsWith('http')) || 'https://kids-test.com/?lang=en';
const PORT = 4723;
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'e2e-runs', 'iphone-' + new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19));
fs.mkdirSync(OUT, { recursive: true });
const T0 = Date.now();
const sec = () => +((Date.now() - T0) / 1000).toFixed(1);
const note = (type, data = {}) => { const e = { t: sec(), type, ...data }; fs.appendFileSync(path.join(OUT, 'log.jsonl'), JSON.stringify(e) + '\n'); console.log(`[${e.t}s] ${type}`, JSON.stringify(data)); };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const ANSWERS = { age: '12-15', sex: 'boy', now: 'section', likes: 'team', temper: 'active', goal: 'health', screen: 'mid' };
const IDS = ['age', 'sex', 'body', 'now', 'likes', 'temper', 'goal', 'screen'];
const BODY = { cm: '158', kg: '47' };

// --- WebDriver поверх safaridriver ---
const drv = spawn('safaridriver', ['-p', String(PORT)], { stdio: 'ignore' });
process.on('exit', () => { try { drv.kill(); } catch { /* уже нет */ } });
const base = `http://127.0.0.1:${PORT}`;
let SID = '';
async function wd(method, p, body) {
  if (process.env.E2E_DEBUG) console.log("wd", method, p, body ? JSON.stringify(body).slice(0, 60) : "");
  const r = await fetch(`${base}${SID && !p.startsWith('/session') ? `/session/${SID}` : ''}${p}`, { method, headers: { 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(p.endsWith('/session') && !SID ? 60000 : 15000) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`${method} ${p}: ${j.value && (j.value.message || j.value.error)}`);
  return j.value;
}
const js = (script, ...a) => wd('POST', '/execute/sync', { script, args: a });
async function el(css) { try { const v = await wd('POST', '/element', { using: 'css selector', value: css }); return v && Object.values(v)[0]; } catch { return null; } }
async function tap(css) {
  const e = await el(css); if (!e) { note('tap_miss', { css }); return false; }
  const before = await js('return document.querySelector(".screen") ? document.querySelector(".screen").innerHTML.length + ":" + (localStorage.getItem("sporttest.v1.state") || "").length : ""');
  // 1) жест касания W3C Actions (как палец), 2) клик WebDriver, 3) JS-клик
  const sig = () => js('return document.querySelector(".screen") ? document.querySelector(".screen").innerHTML.length + ":" + (localStorage.getItem("sporttest.v1.state") || "").length : ""');
  try {
    const EK = 'element-6066-11e4-a52e-4f735466cecf';
    await wd('POST', '/actions', { actions: [{ type: 'pointer', id: 'finger', parameters: { pointerType: 'touch' }, actions: [{ type: 'pointerMove', duration: 0, origin: { [EK]: e }, x: 0, y: 0 }, { type: 'pointerDown', button: 0 }, { type: 'pause', duration: 80 }, { type: 'pointerUp', button: 0 }] }] });
    await wd('DELETE', '/actions').catch(() => {});
  } catch (err) { note('touch_error', { css, msg: String(err).slice(0, 120) }); }
  await wait(900);
  if (before !== await sig()) { tapStats.touch++; return true; }
  try { await wd('POST', `/element/${e}/click`, {}); } catch (err) { note('tap_error', { css, msg: String(err).slice(0, 120) }); }
  await wait(900);
  const after = await js('return document.querySelector(".screen") ? document.querySelector(".screen").innerHTML.length + ":" + (localStorage.getItem("sporttest.v1.state") || "").length : ""');
  if (before !== after) tapStats.click++;
  if (before === after && await el(css)) { tapStats.js++; await js('const e = document.querySelector(arguments[0]); if (e) e.click();', css); note('tap_js', { css, why: 'нативное касание WebDriver не дошло до страницы' }); }
  return true;
}
async function type(css, text) {
  const e = await el(css); if (!e) return false;
  try { await wd('POST', `/element/${e}/clear`, {}); await wd('POST', `/element/${e}/value`, { text }); } catch { /* ниже через JS */ }
  const got = await js('const e = document.querySelector(arguments[0]); return e ? e.value : null;', css);
  if (got !== text) { await js('const e = document.querySelector(arguments[0]); e.value = arguments[1]; e.dispatchEvent(new Event("input", { bubbles: true }));', css, text); note('type_js', { css }); }
  return true;
}
const tapStats = { touch: 0, click: 0, js: 0 };
let shotN = 0;
async function shot(name) { const f = `${String(++shotN).padStart(3, '0')}-${name.replace(/[^a-z0-9-]+/gi, '_').slice(0, 40)}.png`; try { fs.writeFileSync(path.join(OUT, f), Buffer.from(await wd('GET', '/screenshot'), 'base64')); } catch (e) { note('shot_error', { msg: String(e).slice(0, 100) }); } return f; }

// В страницу: журнал голоса и долгих задач
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
    paywall: vis('#price-top'), cam: v ? v.videoWidth + 'x' + v.videoHeight : '', err: vis('[data-act=retry]') ? txt('.hud') .slice(0, 200) : '',
    audio: E.audio, longtasks: E.longtasks, errors: E.errors || [] };`;

(async () => {
  await wait(1500);
  note('session', { udid: UDID, url: URL0 });
  const s0 = await wd('POST', '/session', { capabilities: { alwaysMatch: { platformName: 'iOS', browserName: 'safari', 'safari:deviceUDID': UDID } } });
  SID = s0.sessionId;
  await wd('POST', '/url', { url: URL0 });
  await js("try { localStorage.clear(); localStorage.setItem('sporttest.consent', 'necessary'); } catch (e) {}");
  await wd('POST', '/url', { url: URL0 });
  await wait(1500);
  await js(INIT);

  let last = '', lastHud = '', since = Date.now(), introSince = 0, a0 = 0, l0 = 0, e0 = 0, lastPeriodic = 0, camLogged = '';
  const steps = {};
  for (;;) {
    await wait(300);
    let s;
    try { await js(INIT); s = await js(STATE); } catch (e) { note('eval_error', { msg: String(e).slice(0, 160) }); await wait(1000); continue; }
    for (const a of s.audio.slice(a0)) note('voice', a); a0 = s.audio.length;
    for (const ms of s.longtasks.slice(l0)) note('freeze', { ms }); l0 = s.longtasks.length;
    for (const m of s.errors.slice(e0)) note('page_error', { msg: m }); e0 = s.errors.length;
    if (s.cam && s.cam !== camLogged) { camLogged = s.cam; note('camera', { size: s.cam }); }

    const key = s.paywall ? 'paywall' : s.err ? 'camera_error' : s.run ? `run:${s.title}` : s.intro ? `intro:${s.introTitle}` : s.framing ? 'framing' : s.stage ? 'stage' : `${s.step}${s.step === 'quiz' ? ':' + s.quizIndex : ''}`;
    if (key !== last) {
      if (last) { steps[last] = +((Date.now() - since) / 1000).toFixed(1); note('step_end', { step: last, sec: steps[last] }); }
      last = key; since = Date.now(); introSince = s.intro ? Date.now() : 0;
      note('screen', { step: key, title: s.qtitle || s.introTitle || s.title, err: s.err || undefined, shot: await shot(key) });
    }
    if (s.run) {
      const h = `${s.num}|${s.left}|${s.hint}`;
      if (h !== lastHud) { lastHud = h; note('hud', { ex: s.title, num: s.num, left: s.left, hint: s.hint }); }
      if (Date.now() - lastPeriodic > 2000) { lastPeriodic = Date.now(); await shot('run'); }
    }
    if (s.framing && Date.now() - lastPeriodic > 3000) { lastPeriodic = Date.now(); note('framing', { msg: s.frameMsg }); await shot('framing'); }

    try {
      if (s.step === 'landing' && !s.stage) { await wait(1200); await tap('[data-act=start]'); }
      else if (s.step === 'quiz' && !s.stage) {
        if (await el('[data-el=cm]')) { await type('[data-el=cm]', BODY.cm); await type('[data-el=kg]', BODY.kg); await wait(500); await tap('[data-act=next]'); }
        else { const v = ANSWERS[IDS[s.quizIndex]]; await wait(700); if (v) await tap(`[data-act=pick][data-v="${v}"]`); await wait(400); }
      } else if (s.step === 'prep' && !s.stage) {
        await wait(1500);
        if (DRY) { note('dry_stop', { msg: 'дошёл до экрана камеры', tapStats }); break; }
        note('action', { what: 'нажал «включить камеру» — на телефоне может появиться запрос доступа к камере' }); await tap('[data-act=cam]'); await wait(2000);
      } else if (s.intro && introSince && Date.now() - introSince > 30000) { note('action', { what: 'рука не распознана за 30 с — нажал «Старт»' }); introSince = Date.now(); await tap('.sheet [data-act=go]'); }
      else if (s.paywall) {
        await wait(2500);
        note('paywall', { msg: 'пейвол: снимаю всю страницу; оплату вручную вне автоматизации' });
        const h = await js('return document.documentElement.scrollHeight'), vh = await js('return window.innerHeight');
        for (let y = 0, i = 0; y < h && i < 12; y += vh * 0.85, i++) { await js(`window.scrollTo(0, ${Math.round(y)})`); await wait(500); await shot(`paywall-${i}`); }
        note('done', { total_sec: sec(), steps, tapStats });
        break;
      }
    } catch (e) { note('action_error', { step: key, msg: String(e).slice(0, 160) }); }
    if (sec() > 1800) { note('timeout'); break; }
  }
  fs.writeFileSync(path.join(OUT, 'summary.json'), JSON.stringify({ url: URL0, total_sec: sec(), steps }, null, 2));
  await wd('DELETE', '').catch(() => {});
  console.log('OUT', OUT);
  process.exit(0);
})().catch((e) => { note('fatal', { msg: String(e).slice(0, 300) }); console.log('OUT', OUT); process.exit(1); });
