// Иллюстрации (SVG в коде, без внешних файлов).
const kid = (x, y, s = 1, c = '#ff7a1a') => `<g transform="translate(${x} ${y}) scale(${s})"><circle cx="0" cy="-22" r="6" fill="${c}"/><path d="M0-16V4M0-10l-9 8M0-10l9 8M0 4l-7 14M0 4l7 14" stroke="${c}" stroke-width="4" stroke-linecap="round" fill="none"/></g>`;
const phone = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-8" y="-15" width="16" height="30" rx="3.5" fill="#1d1b2f"/><rect x="-6" y="-12" width="12" height="22" rx="1.5" fill="#bfe3ff"/></g>`;

export const ART = {
  hero: `<svg viewBox="0 0 240 200" role="img" aria-hidden="true"><ellipse cx="120" cy="178" rx="92" ry="12" fill="#ffe7d1"/><circle cx="60" cy="52" r="20" fill="#ffd9b0"/><circle cx="190" cy="36" r="10" fill="#ffe7d1"/><g transform="translate(120 112) scale(2.6)"><circle cx="0" cy="-22" r="6.5" fill="#ff7a1a"/><path d="M0-15V5M0-10l-13-9M0-10l13-9M0 5l-10 15M0 5l10 15" stroke="#ff7a1a" stroke-width="4.2" stroke-linecap="round" fill="none"/></g><path d="M196 96l4 9 10 1-8 7 2 10-8-5-9 5 3-10-8-7 10-1z" fill="#ffc400"/><path d="M38 110l3 6 7 1-5 5 1 7-6-4-6 4 1-7-5-5 7-1z" fill="#ffc400"/></svg>`,
  prep: [
    `<svg viewBox="0 0 84 84" aria-hidden="true"><rect x="10" y="14" width="64" height="58" rx="8" fill="#ffe7d1"/><rect x="20" y="24" width="44" height="38" rx="4" fill="none" stroke="#ff7a1a" stroke-width="2.5" stroke-dasharray="5 4"/>${kid(42, 50, 0.9)}<text x="42" y="80" font-size="9" font-weight="700" text-anchor="middle" fill="#b3500a" font-family="sans-serif">2×2 м</text></svg>`,
    `<svg viewBox="0 0 84 84" aria-hidden="true"><rect x="6" y="14" width="72" height="58" rx="8" fill="#ffe7d1"/>${phone(20, 46, 0.9)}${kid(64, 52, 0.85)}<path d="M32 62h22" stroke="#b3500a" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="1 6"/><circle cx="34" cy="62" r="2.4" fill="#b3500a"/><circle cx="43" cy="62" r="2.4" fill="#b3500a"/><circle cx="52" cy="62" r="2.4" fill="#b3500a"/></svg>`,
    `<svg viewBox="0 0 84 84" aria-hidden="true"><rect x="22" y="6" width="40" height="72" rx="8" fill="#1d1b2f"/><rect x="26" y="12" width="32" height="60" rx="4" fill="#bfe3ff"/>${kid(42, 48, 1.05)}<path d="M30 18h8M30 18v8M54 18h-8M54 18v8M30 68h8M30 68v-8M54 68h-8M54 68v-8" stroke="#1f9d6b" stroke-width="2.4" stroke-linecap="round" fill="none"/></svg>`,
  ],
};
