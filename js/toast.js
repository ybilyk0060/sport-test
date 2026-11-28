// Короткое всплывающее сообщение. Отдельный маленький модуль: нужен и первому экрану, и экрану камеры,
// а код камеры (stage.js) теперь подгружается после нажатия Start.
export function toast(text) {
  const t = document.createElement('div'); t.className = 'toast'; t.textContent = text; document.body.appendChild(t); setTimeout(() => t.remove(), 2200);
}
