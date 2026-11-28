// Сквозной прогон живого сайта глазами покупателя: драйвер сам кликает лендинг, анкету, камеру и экраны,
// человек только делает упражнения перед камерой. Email и оплату на пейволе вводит человек сам (драйвер ждёт).
// Пишет: скриншоты каждого экрана и каждые 2 с во время упражнений, журнал (время шагов, счёт, подсказки, голос, ошибки),
// видео страницы. Запуск: node tools/e2e-live.cjs [url]   (по умолчанию https://kids-test.com/?lang=en&code=KTQA25X9)
// Результат: ./e2e-runs/<время>/ (папка в .gitignore — там видео с камеры).
const fs = require('fs');
const path = require('path');
const { chromium } = require('/Volumes/KidsneyDrive/dev/kidsney/node_modules/playwright');

const URL0 = process.argv[2] || 'https://kids-test.com/?lang=en&code=KTQA25X9';
const OUT = path.join(__dirname, '..', 'e2e-runs', new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19));
fs.mkdirSync(OUT, { recursive: true });
const T0 = Date.now();
const sec = () => ((Date.now() - T0) / 1000).toFixed(1);
const log = [];
const note = (type, data) => { const e = { t: +sec(), type, ...data }; log.push(e); fs.appendFileSync(path.join(OUT, 'log.jsonl'), JSON.stringify(e) + '\n'); console.log(`[${e.t}s] ${type}`, JSON.stringify(data)); };

// Ответы анкеты: ребёнок 12–15 (тест проходит взрослый), остальное — типичные
const ANSWERS = { age: '12-15', sex: 'boy', now: 'section', likes: 'team', temper: 'active', goal: 'health', screen: 'mid' };
const BODY = { cm: '158', kg: '47' };

// В страницу: журнал голоса (какой клип и когда звучит) и долгих задач (зависания)
const INIT = () => {
  window.__e2e = { audio: [], longtasks: [] };
  const urlOf = new WeakMap();
  const of = window.fetch;
  window.fetch = async (...a) => {
    const r = await of(...a);
    const u = String(a[0] && a[0].url ? a[0].url : a[0]);
    if (/\/assets\/audio\//.test(u)) { const c = r.clone(); c.arrayBuffer().then((ab) => urlOf.set(ab, u)).catch(() => {}); r.__u = u; const ab0 = r.arrayBuffer.bind(r); r.arrayBuffer = () => ab0().then((ab) => { urlOf.set(ab, u); return ab; }); }
    return r;
  };
  const bufUrl = new WeakMap();
  const AC = window.AudioContext || window.webkitAudioContext;
  if (AC) {
    const dec = AC.prototype.decodeAudioData;
    AC.prototype.decodeAudioData = function (ab, ok, bad) {
      const u = urlOf.get(ab);
      const p = dec.call(this, ab, (b) => { if (u) bufUrl.set(b, u); ok && ok(b); }, bad);
      if (p && p.then) p.then((b) => { if (u) bufUrl.set(b, u); }).catch(() => {});
      return p;
    };
    const st = AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start = function (...a) {
      if (this.buffer && this.buffer.duration > 0.05) window.__e2e.audio.push({ at: Date.now(), clip: (bufUrl.get(this.buffer) || '?').split('/assets/audio/')[1] || '?', dur: Math.round(this.buffer.duration * 10) / 10 });
      return st.apply(this, a);
    };
  }
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) if (e.duration > 300) window.__e2e.longtasks.push({ at: Date.now(), ms: Math.round(e.duration) }); }).observe({ type: 'longtask', buffered: true }); } catch { /* нет longtask */ }
};

(async () => {
  let browser;
  // Пробный прогон без человека: E2E_DRY=1 — без окна, поддельная камера, стоп через 90 с
  if (process.env.E2E_DRY) browser = await chromium.launch({ args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] });
  else try { browser = await chromium.launch({ channel: 'chrome', headless: false, args: ['--window-size=440,960'] }); }
  catch { browser = await chromium.launch({ headless: false, args: ['--window-size=440,960'] }); }
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: 'en-US', timezoneId: 'America/New_York', recordVideo: { dir: OUT, size: { width: 390, height: 844 } } });
  await ctx.addInitScript(INIT);
  const page = await ctx.newPage();
  page.on('pageerror', (e) => note('page_error', { msg: String(e).slice(0, 300) }));
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') note('console_' + m.type(), { msg: m.text().slice(0, 300) }); });
  page.on('requestfailed', (r) => { if (!/posthog|facebook|tiktok/.test(r.url())) note('request_failed', { url: r.url().slice(0, 160), err: r.failure() && r.failure().errorText }); });

  let shotN = 0;
  const shot = async (name) => { const f = `${String(++shotN).padStart(3, '0')}-${name}.png`; try { await page.screenshot({ path: path.join(OUT, f), fullPage: /result|report|paywall/.test(name) }); } catch { /* окно меняется */ } return f; };

  note('open', { url: URL0 });
  await page.goto(URL0, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => { try { localStorage.clear(); localStorage.setItem('sporttest.consent', 'necessary'); } catch { /* нет */ } });
  await page.goto(URL0, { waitUntil: 'load' });

  let last = '', lastHud = '', since = Date.now(), introSince = 0, paywallSeen = false, audioN = 0, ltN = 0, lastPeriodic = 0;
  const stepTimes = {};
  for (;;) {
    await page.waitForTimeout(250);
    let s;
    try {
      s = await page.evaluate(() => {
        let st = {}; try { st = JSON.parse(localStorage.getItem('sporttest.v1.state') || '{}'); } catch { /* нет */ }
        const q = (sel) => document.querySelector(sel);
        const vis = (sel) => { const e = q(sel); return !!(e && e.offsetParent !== null); };
        const txt = (sel) => (q(sel) ? q(sel).textContent.trim() : '');
        const hud = q('.hud');
        return {
          step: st.step || '', quizIndex: st.quizIndex, paid: !!st.sub,
          qtitle: txt('.qtitle'), stage: !!(hud && hud.innerHTML.trim()),
          framing: vis('.frame-card'), frameMsg: txt('.frame-card [data-el=msg]'),
          intro: vis('.sheet [data-act=go]'), introTitle: txt('.sheet h2'),
          run: vis('.gauge'), num: txt('.gauge [data-el=num]'), left: txt('[data-el=left]'), hint: txt('.hud [data-el=hint]'), title: txt('.hud-top'),
          paywall: vis('#price-top'), report: !!q('.rep-head'), paddle: !!document.querySelector('iframe[name*=paddle], iframe[src*=paddle]'),
          audio: window.__e2e ? window.__e2e.audio : [], longtasks: window.__e2e ? window.__e2e.longtasks : [],
        };
      });
    } catch (e) { note('eval_error', { msg: String(e).slice(0, 120) }); if (page.isClosed()) break; continue; }

    for (const a of s.audio.slice(audioN)) note('voice', { clip: a.clip, dur: a.dur }); audioN = s.audio.length;
    for (const l of s.longtasks.slice(ltN)) note('freeze', { ms: l.ms }); ltN = s.longtasks.length;

    const key = s.report ? 'report' : s.paywall ? 'paywall' : s.run ? `run:${s.title}` : s.intro ? `intro:${s.introTitle}` : s.framing ? 'framing' : s.stage ? 'stage' : `${s.step}${s.step === 'quiz' ? ':' + s.quizIndex : ''}`;
    if (key !== last) {
      if (last) { stepTimes[last] = ((Date.now() - since) / 1000).toFixed(1); note('step_end', { step: last, sec: stepTimes[last] }); }
      last = key; since = Date.now(); introSince = s.intro ? Date.now() : 0;
      note('screen', { step: key, title: s.qtitle || s.introTitle || s.title, shot: await shot(key.replace(/[^a-z0-9:-]+/gi, '_').slice(0, 40)) });
    }

    // Счёт и подсказки во время упражнения
    if (s.run) {
      const h = `${s.num}|${s.left}|${s.hint}`;
      if (h !== lastHud) { lastHud = h; note('hud', { ex: s.title, num: s.num, left: s.left, hint: s.hint }); }
      if (Date.now() - lastPeriodic > 2000) { lastPeriodic = Date.now(); await shot('run'); }
    }
    if (s.framing && s.frameMsg && Date.now() - lastPeriodic > 3000) { lastPeriodic = Date.now(); note('framing', { msg: s.frameMsg }); await shot('framing'); }

    // Действия драйвера
    try {
      if (s.step === 'landing' && !s.stage) await page.click('[data-act=start]');
      else if (s.step === 'quiz' && !s.stage) {
        if (await page.$('[data-el=cm]')) { await page.fill('[data-el=cm]', BODY.cm); await page.fill('[data-el=kg]', BODY.kg); await page.waitForTimeout(400); await page.click('[data-act=next]'); }
        else {
          const ids = ['age', 'sex', 'body', 'now', 'likes', 'temper', 'goal', 'screen'];
          const v = ANSWERS[ids[s.quizIndex]];
          const b = v && await page.$(`[data-act=pick][data-v="${v}"]`);
          if (b) { await page.waitForTimeout(500); await b.click(); await page.waitForTimeout(400); }
        }
      } else if (s.step === 'prep' && !s.stage) { await page.waitForTimeout(800); note('action', { what: 'нажал «включить камеру»' }); await page.click('[data-act=cam]'); await page.waitForTimeout(1500); }
      else if (s.intro && introSince && Date.now() - introSince > 30000) { note('action', { what: 'рука не распознана 30 с — нажал «Старт»' }); introSince = Date.now(); await page.click('.sheet [data-act=go]'); }
      else if (s.paywall && !paywallSeen) {
        paywallSeen = true;
        note('paywall', { msg: 'ЖДУ ЧЕЛОВЕКА: email и оплата вводятся вручную' });
        await shot('paywall-full');
      } else if (s.report) {
        await page.waitForTimeout(1500);
        await page.$$eval('details.sec', (ds) => ds.forEach((d) => { d.open = true; }));
        await page.waitForTimeout(800);
        await shot('report-full');
        note('done', { total_sec: sec(), steps: stepTimes });
        break;
      }
    } catch (e) { note('action_error', { step: key, msg: String(e).slice(0, 160) }); }
    if (process.env.E2E_DRY && +sec() > 90) { note('dry_stop', {}); break; }
    if (+sec() > 3600) { note('timeout', {}); break; }
  }
  fs.writeFileSync(path.join(OUT, 'summary.json'), JSON.stringify({ url: URL0, total_sec: sec(), steps: stepTimes, events: log.length }, null, 2));
  await page.waitForTimeout(3000);
  await ctx.close(); await browser.close();
  console.log('OUT', OUT);
})();
