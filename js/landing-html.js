// Разметка первого экрана — в одном месте для двух потребителей:
//  1) js/app.js рисует её после загрузки программы (video: true — ролик с автозапуском);
//  2) tools/build-shell.mjs вшивает её в index.html (video: false — кадр ролика картинкой), чтобы заголовок и кнопка
//     появлялись сразу с ответом сервера, а не после загрузки всех модулей (замер 28.11: 1,2–3,6 с белого экрана).
// Модуль без импортов и без обращения к окну: его читает и браузер, и сборка.

export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const NAMES = { en: 'English', de: 'Deutsch', uk: 'Українська' };

// T — тексты языка; lang — его код; langs — включённые языки; linkOnly — языки «только по ссылке»; heroArt — SVG для языков без ролика
export function landingHtml({ T, lang, langs, linkOnly = [], heroArt = '', video = true }) {
  const L = T.landing;
  // Выбор языка вверху: внизу его закрывала панель Safari (прогон 26.11)
  const top = langs.length > 1
    ? `<div class="langs top">${Object.entries(NAMES).filter(([k]) => langs.includes(k) && (k === lang || !linkOnly.includes(k))).map(([k, v]) => `<a href="?lang=${k}" class="${k === lang ? 'on' : ''}">${v}</a>`).join('')}</div>`
    : '';
  const media = video
    ? `<video class="hero-video" src="assets/landing/hero-moves.mp4" poster="assets/landing/hero-moves.jpg" autoplay muted loop playsinline preload="auto" aria-hidden="true"></video>`
    : `<img class="hero-video" src="assets/landing/hero-moves.jpg" alt="" aria-hidden="true">`;
  const hero = lang === 'en'
    ? `<div class="hero hero-vid"><div class="hero-vwrap">${media}<span class="hv-badge">🔒 ${esc(L.videoBadge)}</span></div><div class="hv-text"><h1>${esc(L.title)}</h1><p class="promise">${esc(L.promise)}</p></div></div>`
    : `<div class="hero"><div class="hero-art">${heroArt}</div><h1>${esc(L.title)}</h1><p class="promise">${esc(L.promise)}</p></div>`;
  return `${top}${hero}
    <!-- Кнопка сразу под обещанием (реклама 27.11: в окне Facebook её закрывал баннер cookie, на iPhone SE она была ниже края) -->
    <button class="btn" data-act="start">${esc(L.cta)}</button>
    <ul class="points">${L.points.map((p) => `<li>${esc(p)}</li>`).join('')}</ul><div class="trust-box"><span class="tb-ic" aria-hidden="true">🏅</span><span>${esc(L.trustShort)}</span></div><div class="grow"></div>
    <p class="small muted center land-note">${esc(L.note)} ${esc(T.result.shortNote)}</p><p class="small muted center land-note">${esc(L.trustNote)}</p>`;
}
