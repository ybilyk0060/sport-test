// Карточка для отправки в мессенджер: рисуется на устройстве, без имени и без фото ребёнка.
import { QUALITIES } from './scoring.js?v=796978e-mww9ua54';

export function drawShareCard(cv, profile, T) {
  const g = cv.getContext('2d'), W = cv.width, H = cv.height;
  const font = (w, s) => `${w} ${s}px -apple-system, "Segoe UI", Roboto, Arial, sans-serif`;
  g.fillStyle = '#fff7ec'; g.fillRect(0, 0, W, H);
  const grad = g.createLinearGradient(0, 0, W, 360); grad.addColorStop(0, '#ff7a1a'); grad.addColorStop(1, '#ffab4d');
  g.fillStyle = grad; g.fillRect(0, 0, W, 360);
  g.fillStyle = '#fff'; g.font = font(800, 84); g.fillText(T.card.title, 72, 170);
  g.font = font(600, 40); g.globalAlpha = 0.92; g.fillText(T.card.sub, 72, 236); g.globalAlpha = 1;
  if (profile.strongest) {
    g.font = font(600, 34); g.fillText(`${T.card.strongest}: ${T.result.qualities[profile.strongest].name}`, 72, 306);
  }
  const colors = { 3: '#1f9d6b', 2: '#e0a100', 1: '#d9682f', 0: '#b9b5c6' };
  let y = 450;
  const step = Math.min(150, (H - 150 - y) / Math.max(1, QUALITIES.filter((q) => profile.qualities[q].level > 0).length));
  const shown = QUALITIES.filter((q) => profile.qualities[q].level > 0);
  for (const q of shown.length ? shown : QUALITIES) {
    const lvl = profile.qualities[q].level;
    g.fillStyle = '#1d1b2f'; g.font = font(700, 46); g.fillText(T.result.qualities[q].name, 72, y);
    g.fillStyle = colors[lvl]; g.font = font(700, 32); g.textAlign = 'right'; g.fillText(T.result.levels[lvl], W - 72, y); g.textAlign = 'left';
    for (let i = 0; i < 3; i++) {
      g.fillStyle = i < lvl ? colors[lvl] : '#ece4d6';
      const x = 72 + i * ((W - 144 - 32) / 3 + 16), w = (W - 144 - 32) / 3;
      g.beginPath(); g.roundRect ? g.roundRect(x, y + 26, w, 22, 11) : g.rect(x, y + 26, w, 22); g.fill();
    }
    y += step;
  }
  g.fillStyle = '#6b6880'; g.font = font(500, 30); g.fillText(T.card.foot, 72, H - 72);
}
