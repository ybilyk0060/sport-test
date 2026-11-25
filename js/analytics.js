// Аналитика воронки: Meta Pixel (+ по желанию PostHog). Включается ТОЛЬКО после согласия на cookie (баннер внизу).
// Без согласия события остаются только на устройстве (store.track). Видео, точки тела и ответы о ребёнке наружу не уходят:
// в события идут только имя шага, номер вопроса, ключ упражнения, сумма и валюта.

import { CONFIG } from './config.js?v=2686ed8-mwwcza31';
import { T } from './i18n/index.js?v=2686ed8-mwwcza31';

const KEY = 'sporttest.consent';
let consent = null;
try { consent = localStorage.getItem(KEY); } catch { /* нет доступа */ }
let ready = false;

// Шаги воронки, которые уходят наружу (остальные события — только на устройстве)
const FUNNEL = new Set(['open', 'camera_blocked_shown', 'open_in_chrome_click', 'open_in_safari_click', 'fallback_start', 'quiz_start', 'quiz_answer', 'prep_shown', 'camera_granted', 'camera_denied', 'test_start', 'exercise_done', 'test_done',
  'result_shown', 'paywall_shown', 'offer_timer_end', 'pay_click', 'paid', 'pay_cancelled', 'report_shown', 'workout_start', 'workout_done', 'sub_cancelled', 'gift_code', 'app_link']);
// Только безопасные поля
const SAFE = ['order', 'q', 'step', 'reason', 'confirm', 'via', 'n', 'key', 'skipped', 'amount', 'currency', 'discount', 'mode', 'summary', 'plan', 'test', 'app', 'id', 'lang', 'kind', 'via', 'ok', 'browser', 'platform', 'inApp'];
const clean = (p) => Object.fromEntries(Object.entries(p || {}).filter(([k, v]) => SAFE.includes(k) && v !== undefined && v !== null));

function loadPixel(id) {
  /* eslint-disable */
  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
  /* eslint-enable */
  window.fbq('init', id);
  window.fbq('track', 'PageView');
}
const stripUrl = (u) => { try { const x = new URL(u, location.href); for (const k of ['sub', 's', 'order', 'orderReference']) x.searchParams.delete(k); return x.toString(); } catch { return u; } };
function loadPosthog(key, host) {
  /* eslint-disable */
  !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys onSessionId".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
  /* eslint-enable */
  // Тепловые карты и записи сессий (Юрий 25.11) — только после согласия. Поля ввода маскируются; экран камеры в запись не попадает:
  // запись ставится на паузу на время камеры (recording.pause/resume из stage.js), а сам экран помечен ph-no-capture.
  window.posthog.init(key, {
    api_host: host, autocapture: true, capture_pageview: true, capture_pageleave: true, enable_heatmaps: true,
    disable_session_recording: false, persistence: 'localStorage', ip: false, mask_all_text: false,
    session_recording: { maskAllInputs: true, blockClass: 'ph-no-capture', blockSelector: 'video, canvas, .stage', maskCapturedNetworkRequestFn: (r) => ({ ...r, name: stripUrl(r.name) }) },
    // ссылка доступа к подписке (?sub=) и перенос ответов (?s=) не уходят в аналитику
    sanitize_properties: (props) => { for (const k of ['$current_url', '$referrer', '$initial_current_url', '$prev_pageview_pathname']) if (typeof props[k] === 'string') props[k] = stripUrl(props[k]); return props; },
  });
  window.posthog.register({ app: 'sport-test', lang: T.meta.lang });
}

function start() {
  if (ready || consent !== 'all') return;
  ready = true;
  if (CONFIG.analytics.metaPixelId) loadPixel(CONFIG.analytics.metaPixelId);
  if (CONFIG.analytics.posthogKey) loadPosthog(CONFIG.analytics.posthogKey, CONFIG.analytics.posthogHost);
}

// Пауза записи сессии, пока открыта камера (видео и изображение ребёнка никуда не уходят)
export const recording = {
  pause() { try { window.posthog && window.posthog.stopSessionRecording && window.posthog.stopSessionRecording(); } catch { /* нет */ } },
  resume() { try { ready && window.posthog && window.posthog.startSessionRecording && window.posthog.startSessionRecording(); } catch { /* нет */ } },
};

// Вызывается из store.track для каждого события. В PostHog — все события (воронка по каждому шагу), в Meta — только шаги воронки.
export function send(name, props = {}) {
  if (!ready) return;
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
      if (name === 'paid' && !p.test) {
        window.fbq('track', 'Purchase', { value: p.amount, currency: p.currency }, p.order ? { eventID: `purchase-${p.order}` } : undefined); // eventID — для склейки с Conversions API
        window.fbq('track', 'Subscribe', { value: p.amount, currency: p.currency, predicted_ltv: p.amount });
      }
      window.fbq('trackCustom', `st_${name}`, p);
    }
    if (window.posthog) window.posthog.capture(name, p);
  } catch { /* аналитика не должна ломать страницу */ }
}

// Баннер согласия (ЕС, Великобритания и остальные — одинаково)
export function initConsent() {
  if (!CONFIG.analytics.metaPixelId && !CONFIG.analytics.posthogKey) return; // нечего включать — баннер не нужен
  if (consent) { start(); return; }
  const C = T.consent;
  const el = document.createElement('div');
  el.className = 'consent';
  el.innerHTML = `<p>${C.text} <a href="${T.meta.lang === 'uk' ? 'privacy.html' : `privacy-${T.meta.lang}.html`}">${C.more}</a></p><div><button data-c="necessary">${C.decline}</button><button data-c="all" class="primary">${C.accept}</button></div>`;
  el.addEventListener('click', (e) => {
    const b = e.target.closest('[data-c]'); if (!b) return;
    consent = b.dataset.c;
    try { localStorage.setItem(KEY, consent); } catch { /* нет доступа */ }
    el.remove();
    start();
  });
  document.body.appendChild(el);
}
