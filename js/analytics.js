// Аналитика воронки: Meta Pixel + PostHog.
// Meta Pixel и записи сессий PostHog — ТОЛЬКО после согласия на cookie (баннер внизу).
// До согласия и после отказа PostHog считает шаги воронки без cookie (cookieless_mode 'always', Юрий 26.11):
// ничего не пишется в браузер, человек анонимен и не склеивается между визитами, записей сессий нет. Видео, точки тела и ответы о ребёнке наружу не уходят:
// в события идут только имя шага, номер вопроса, ключ упражнения, сумма и валюта.

import { CONFIG } from './config.js?v=e9c53be-mwz656hs';
import { T } from './i18n/index.js?v=e9c53be-mwz656hs';

const KEY = 'sporttest.consent';
let consent = null;
try { consent = localStorage.getItem(KEY); } catch { /* нет доступа */ }
// Баннер согласия — только для ЕС, ЕЭЗ, Швейцарии и Великобритании (решение Юрия 27.11, о риске предупреждён):
// в США, Австралии и др. пиксель и аналитика включаются сразу. Регион — по часовому поясу; не удалось определить — спрашиваем.
export const consentRegion = (() => {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (!tz) return true;
    if (tz.startsWith('Europe/')) return true;
    if (['Atlantic/Reykjavik', 'Atlantic/Canary', 'Atlantic/Madeira', 'Atlantic/Azores', 'Atlantic/Faroe', 'Arctic/Longyearbyen'].includes(tz)) return true;
    return T.meta.lang === 'de';
  } catch { return true; }
})();
if (!consent && !consentRegion) consent = 'all';
let phMode = null; // null | 'full' (согласие) | 'cookieless' (нет согласия)
let pixelOn = false;

// Шаги воронки, которые уходят наружу (остальные события — только на устройстве)
const FUNNEL = new Set(['open', 'camera_blocked_shown', 'open_in_chrome_click', 'open_in_safari_click', 'fallback_start', 'quiz_start', 'quiz_answer', 'prep_shown', 'link_form_open', 'link_requested', 'camera_granted', 'camera_denied', 'test_start', 'exercise_done', 'test_done',
  'result_shown', 'paywall_shown', 'offer_timer_end', 'pay_click', 'checkout_open', 'checkout_closed', 'checkout_failed', 'paid', 'pay_cancelled', 'report_shown', 'workout_start', 'workout_done', 'sub_cancelled', 'gift_code', 'app_link']);
// Только безопасные поля
const SAFE = ['order', 'fps', 'ms', 'q', 'step', 'reason', 'confirm', 'via', 'n', 'key', 'skipped', 'amount', 'currency', 'discount', 'mode', 'summary', 'plan', 'test', 'app', 'id', 'lang', 'kind', 'via', 'ok', 'browser', 'platform', 'inApp', 'provider', 'utm', 'ref', 'choice', 'done', 'target', 'error', 'regular', 'light', 'how'];
const clean = (p) => Object.fromEntries(Object.entries(p || {}).filter(([k, v]) => SAFE.includes(k) && v !== undefined && v !== null));

function loadPixel(id) {
  /* eslint-disable */
  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
  /* eslint-enable */
  window.fbq('init', id);
  window.fbq('track', 'PageView');
}
const stripUrl = (u) => { try { const x = new URL(u, location.href); for (const k of ['sub', 's', 'order', 'orderReference']) x.searchParams.delete(k); return x.toString(); } catch { return u; } };
function loadPosthog(key, host, full) {
  /* eslint-disable */
  !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys onSessionId".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
  /* eslint-enable */
  // Тепловые карты и записи сессий (Юрий 25.11) — только после согласия. Поля ввода маскируются; экран камеры в запись не попадает:
  // запись ставится на паузу на время камеры (recording.pause/resume из stage.js), а сам экран помечен ph-no-capture.
  const base = {
    api_host: host, autocapture: true, capture_pageview: true, capture_pageleave: true, enable_heatmaps: true, ip: false, mask_all_text: false,
    // ссылка доступа к подписке (?sub=) и перенос ответов (?s=) не уходят в аналитику
    sanitize_properties: (props) => { for (const k of ['$current_url', '$referrer', '$initial_current_url', '$prev_pageview_pathname']) if (typeof props[k] === 'string') props[k] = stripUrl(props[k]); return props; },
  };
  window.posthog.init(key, full ? {
    ...base, persistence: 'localStorage', disable_session_recording: false,
    session_recording: { maskAllInputs: true, blockClass: 'ph-no-capture', blockSelector: 'video, canvas, .stage', maskCapturedNetworkRequestFn: (r) => ({ ...r, name: stripUrl(r.name) }) },
  } : {
    // Без согласия: без cookie и localStorage, без записей сессий (нужен «Cookieless server hash mode» в настройках проекта PostHog)
    ...base, cookieless_mode: 'always', persistence: 'memory', disable_session_recording: true,
  });
  window.posthog.register({ app: 'sport-test', lang: T.meta.lang, consent: full ? 'all' : (consent || 'none') });
}

// PostHog запускается один раз за загрузку страницы: с согласием — полный, без — без cookie.
// Если человек нажал «Accept» посреди визита, до конца визита PostHog остаётся без cookie (пиксель включается сразу).
const PHC = 'sporttest.phc';
function cookielessVisit() { try { return Date.now() - Number(localStorage.getItem(PHC) || 0) < 3 * 3600 * 1000; } catch { return false; } }
function start() {
  if (!phMode && CONFIG.analytics.posthogKey) {
    // Визит начался без согласия → до конца визита (3 ч) PostHog без cookie: тот же анонимный id и после возврата из Paddle,
    // иначе воронка «оплатить → оплачено» рвётся на двух разных людей. С согласием полный режим включится со следующего визита.
    phMode = consent === 'all' && !cookielessVisit() ? 'full' : 'cookieless';
    if (phMode === 'cookieless' && !cookielessVisit()) { try { localStorage.setItem(PHC, String(Date.now())); } catch { /* нет */ } }
    loadPosthog(CONFIG.analytics.posthogKey, CONFIG.analytics.posthogHost, phMode === 'full');
  }
  if (!pixelOn && consent === 'all' && CONFIG.analytics.metaPixelId) { pixelOn = true; loadPixel(CONFIG.analytics.metaPixelId); }
}

// Метки для сервера (покупка в Meta через Conversions API): клик из рекламы, браузер, UTM, согласие.
// Уходят в заказ Paddle (customData), оттуда — в вебхук. fbclid берём из адреса первого захода (sessionStorage).
const AD = 'sporttest.ad';
try {
  const q = new URLSearchParams(location.search);
  if (q.get('fbclid') || q.get('utm_source')) {
    const ad = { ts: Date.now() };
    for (const k of ['fbclid', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']) if (q.get(k)) ad[k] = q.get(k).slice(0, 200);
    try { sessionStorage.setItem(AD, JSON.stringify(ad)); } catch { /* нет */ }
    try { localStorage.setItem(AD, JSON.stringify(ad)); } catch { /* нет */ }
  }
} catch { /* нет доступа */ }
const cookie = (n) => { try { const m = document.cookie.match(new RegExp('(?:^|; )' + n + '=([^;]*)')); return m ? decodeURIComponent(m[1]) : ''; } catch { return ''; } };
export function adContext() {
  let ad = {};
  try { ad = JSON.parse(sessionStorage.getItem(AD) || '{}') || {}; } catch { /* нет */ }
  if (!ad.ts) { try { const l = JSON.parse(localStorage.getItem(AD) || '{}') || {}; if (l.ts && Date.now() - l.ts < 7 * 86400000) ad = l; } catch { /* нет */ } }
  if (!ad.ts) { try { const q = new URLSearchParams(location.search); for (const k of ['fbclid', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']) if (q.get(k)) { ad[k] = q.get(k).slice(0, 200); ad.ts = ad.ts || Date.now(); } } catch { /* нет */ } }
  const out = { consent: consent || 'none', url: location.origin + location.pathname, ua: navigator.userAgent.slice(0, 400) };
  for (const k of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']) if (ad[k]) out[k] = ad[k];
  // Метки Meta — только с согласием (UK/ЕС); без него сервер всё равно получит факт покупки, но без привязки к клику
  if (consent === 'all') {
    const fbc = cookie('_fbc') || (ad.fbclid ? `fb.1.${ad.ts}.${ad.fbclid}` : '');
    if (fbc) out.fbc = fbc;
    if (cookie('_fbp')) out.fbp = cookie('_fbp');
  }
  return out;
}

// Пауза записи сессии, пока открыта камера (видео и изображение ребёнка никуда не уходят)
export const recording = {
  pause() { try { window.posthog && window.posthog.stopSessionRecording && window.posthog.stopSessionRecording(); } catch { /* нет */ } },
  resume() { try { phMode === 'full' && window.posthog && window.posthog.startSessionRecording && window.posthog.startSessionRecording(); } catch { /* нет */ } },
};

// Вызывается из store.track для каждого события. В PostHog — все события (воронка по каждому шагу), в Meta — только шаги воронки.
export function send(name, props = {}) {
  if (!phMode && !pixelOn) return;
  const p = clean(props);
  try {
    if (window.fbq && FUNNEL.has(name)) {
      if (name === 'quiz_start') window.fbq('track', 'ViewContent', { content_name: 'quiz' });
      if (name === 'test_done') window.fbq('track', 'CompleteRegistration', { content_name: 'test_done' });
      // Схема событий для рекламы (тред Meta 25.11): ViewContent — старт, CompleteRegistration — камера пройдена,
      // InitiateCheckout — пейвол, AddPaymentInfo — нажал «Оплатить», Purchase (+Subscribe) — оплата.
      if (name === 'paywall_shown') window.fbq('track', 'InitiateCheckout', { value: p.amount, currency: p.currency });
      if (name === 'pay_click') window.fbq('track', 'AddPaymentInfo', { value: p.amount, currency: p.currency });
      // Покупка уходит в Meta только настоящая: тестовая оплата рекламу не обучает
      let promo = false; try { promo = !!sessionStorage.getItem('sporttest.code'); } catch { /* нет */ }
      if (name === 'paid' && !p.test && !promo) { // оплата по промокоду (проверка 100%) рекламу не обучает
        window.fbq('track', 'Purchase', { value: p.amount, currency: p.currency }, p.order ? { eventID: `purchase-${p.order}` } : undefined); // eventID — для склейки с Conversions API
        window.fbq('track', 'Subscribe', { value: p.amount, currency: p.currency, predicted_ltv: p.amount }, p.order ? { eventID: `subscribe-${p.order}` } : undefined);
      }
      window.fbq('trackCustom', `st_${name}`, p);
    }
    if (window.posthog) window.posthog.capture(name, p);
  } catch { /* аналитика не должна ломать страницу */ }
}

// Баннер согласия: только где consentRegion (ЕС/ЕЭЗ/Швейцария/UK); в остальных странах consent уже «all» и баннер не показывается
export function initConsent() {
  if (!CONFIG.analytics.metaPixelId && !CONFIG.analytics.posthogKey) return; // нечего включать — баннер не нужен
  start(); // PostHog без cookie считает и тех, кто баннер не тронул
  if (consent) return;
  const C = T.consent;
  const el = document.createElement('div');
  el.className = 'consent';
  document.body.classList.add('has-consent');
  el.innerHTML = `<p>${C.text} <a href="${T.meta.lang === 'uk' ? 'privacy.html' : `privacy-${T.meta.lang}.html`}">${C.more}</a></p><div><button data-c="necessary">${C.decline}</button><button data-c="all" class="primary">${C.accept}</button></div>`;
  el.addEventListener('click', (e) => {
    const b = e.target.closest('[data-c]'); if (!b) return;
    consent = b.dataset.c;
    try { localStorage.setItem(KEY, consent); } catch { /* нет доступа */ }
    el.remove();
    document.body.classList.remove('has-consent');
    try { window.posthog && window.posthog.register && window.posthog.register({ consent }); } catch { /* нет */ }
    send('consent_choice', { choice: consent });
    start();
  });
  document.body.appendChild(el);
}

// Анкета завершена → Lead в Meta (обучение рекламы, 27.11): браузерный пиксель и тот же event_id с сервера (Conversions API,
// функция sport-test-paddle), чтобы Meta склеила дубли, а события, потерянные во встроенных браузерах FB/IG, дошли с сервера.
// Один раз на прохождение (sid). Страна для правил согласия — из языка браузера или часового пояса (как в оплате).
const LEAD_FN = 'https://hcnlzndlivlojdqmzbgi.supabase.co/functions/v1/sport-test-paddle';
function leadCountry() {
  try {
    const m = /-([A-Z]{2})$/i.exec(navigator.language || ''); if (m) return m[1].toUpperCase();
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (tz.startsWith('Australia/')) return 'AU';
    if (tz.startsWith('America/')) return 'US';
    if (tz === 'Europe/London') return 'GB';
    return '';
  } catch { return ''; }
}
export function sendLead(sid) {
  if (!sid) return;
  const key = 'sporttest.lead.' + sid;
  try { if (localStorage.getItem(key)) return; localStorage.setItem(key, '1'); } catch { /* нет */ }
  const eventId = `lead-${sid}`;
  try { if (window.fbq) window.fbq('track', 'Lead', { content_name: 'quiz_complete' }, { eventID: eventId }); } catch { /* нет */ }
  try {
    const body = JSON.stringify({ action: 'lead', event_id: eventId, ...adContext(), country: leadCountry() });
    fetch(LEAD_FN, { method: 'POST', headers: { 'content-type': 'application/json' }, body, keepalive: true }).catch(() => {});
  } catch { /* нет */ }
}

