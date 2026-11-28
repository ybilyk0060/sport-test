// Анимированные примеры для оценочных упражнений без видео с пандой: кадры-человечки сменяют друг друга (CSS, css/app.css .demo).
// Каждый кадр — <g class="f">; число кадров задаёт длительность цикла. Никаких внешних файлов.

const floor = '<path class="floor" d="M30 182 H170"/>';
const head = (x, y) => `<circle class="head" cx="${x}" cy="${y}" r="14"/>`;

const DEMOS = {
  // Стоит на правой ноге, руки на поясе, левая согнута назад — покачивается
  balance: [
    `${head(100, 34)}<path d="M100 50 V112"/><path d="M100 70 L76 92 L92 104"/><path d="M100 70 L124 92 L108 104"/><path d="M100 112 L100 178"/><path d="M100 112 L118 140 L94 150"/>${floor}`,
    `<g transform="rotate(-2 100 178)">${head(100, 34)}<path d="M100 50 V112"/><path d="M100 70 L76 92 L92 104"/><path d="M100 70 L124 92 L108 104"/><path d="M100 112 L100 178"/><path d="M100 112 L118 140 L94 150"/></g>${floor}`,
    `<g transform="rotate(2 100 178)">${head(100, 34)}<path d="M100 50 V112"/><path d="M100 70 L76 92 L92 104"/><path d="M100 70 L124 92 L108 104"/><path d="M100 112 L100 178"/><path d="M100 112 L118 140 L94 150"/></g>${floor}`,
  ],
  // Прыжки двумя ногами через линию: слева → в воздухе → справа → в воздухе
  side_jumps: [
    `<path class="tape" d="M100 150 V182"/>${head(68, 40)}<path d="M68 56 V114"/><path d="M68 74 L50 100"/><path d="M68 74 L86 100"/><path d="M68 114 L62 146 L64 178"/><path d="M68 114 L74 146 L72 178"/>${floor}`,
    `<path class="tape" d="M100 150 V182"/>${head(100, 26)}<path d="M100 42 V98"/><path d="M100 60 L80 80"/><path d="M100 60 L120 80"/><path d="M100 98 L92 124 L98 146"/><path d="M100 98 L108 124 L104 146"/><path class="mark" d="M76 166 Q100 140 124 166"/>${floor}`,
    `<path class="tape" d="M100 150 V182"/>${head(132, 40)}<path d="M132 56 V114"/><path d="M132 74 L114 100"/><path d="M132 74 L150 100"/><path d="M132 114 L126 146 L128 178"/><path d="M132 114 L138 146 L136 178"/>${floor}`,
    `<path class="tape" d="M100 150 V182"/>${head(100, 26)}<path d="M100 42 V98"/><path d="M100 60 L80 80"/><path d="M100 60 L120 80"/><path d="M100 98 L92 124 L98 146"/><path d="M100 98 L108 124 L104 146"/><path class="mark" d="M124 166 Q100 140 76 166"/>${floor}`,
  ],
  // Наклон вперёд стоя, лицом к камере: стоит → тянется к коленям → к полу (колени прямые)
  bend: [
    `${head(100, 30)}<path d="M100 46 V108"/><path d="M100 64 L90 104"/><path d="M100 64 L110 104"/><path d="M100 108 L94 178"/><path d="M100 108 L106 178"/>${floor}`,
    `${head(100, 84)}<path d="M100 100 V112"/><path d="M88 104 L84 136"/><path d="M112 104 L116 136"/><path d="M100 108 L94 178"/><path d="M100 108 L106 178"/>${floor}`,
    `${head(100, 122)}<path d="M92 112 L90 176"/><path d="M108 112 L110 176"/><path d="M96 104 L94 178"/><path d="M104 104 L106 178"/><circle class="dot" cx="90" cy="177" r="5"/><circle class="dot" cx="110" cy="177" r="5"/>${floor}`,
    `${head(100, 122)}<path d="M92 112 L90 176"/><path d="M108 112 L110 176"/><path d="M96 104 L94 178"/><path d="M104 104 L106 178"/><circle class="dot" cx="90" cy="177" r="5"/><circle class="dot" cx="110" cy="177" r="5"/>${floor}`,
  ],
};

export function demoSvg(name) {
  const frames = DEMOS[name];
  if (!frames) return '';
  const n = frames.length;
  return `<div class="demo n${n}"><svg viewBox="0 0 200 200" aria-hidden="true">${frames.map((f, i) => `<g class="f" style="animation-delay:${(i * 0.7).toFixed(2)}s">${f}</g>`).join('')}</svg></div>`;
}
export const DEMO_NAMES = Object.keys(DEMOS);
