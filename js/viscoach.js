// Голосовые подсказки «тебя не видно» (Юрий 27.11): всё автоматически, без родителя.
// Каждый кадр получает позу (или null) и раз в секунду — яркость кадра камеры. Подсказка звучит, если проблема держится
// дольше HOLD_MS, и не чаще раза в GAP_MS (одна и та же — не чаще раза в REPEAT_MS). Текст дублируется на экране.
//
//   темно (средняя яркость кадра < DARK)                          → vis_more_light «Темно, включи свет»
//   человека нет (поза пропала), края кадра светлые, центр темнее → vis_light_behind «Свет сзади, поставь телефон спиной к окну»
//   человека нет                                                   → vis_cant_see «Тебя не видно, встань перед телефоном»
//   человек далеко (корпус < FAR кадра)                             → frame_step_closer «Подойди ближе»
//   не видно ног (обрезаны снизу)                                   → frame_upper_only / frame_step_back
//   не видно головы                                                 → vis_head «Не видно головы, отойди или наклони телефон»
//   ноги видны плохо (тёмная одежда на тёмном фоне)                 → vis_contrast «Встань на фоне светлой стены» (или «включи свет», если темновато)

export const VC = { HOLD_MS: 2500, OK_MS: 1000, GAP_MS: 6000, REPEAT_MS: 12000, DARK: 0.16, DIM: 0.3, FAR: 0.06, LEG_VIS: 0.35, CUT_TOP: 0.015, CUT_BOTTOM: 0.985 };

const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

// Яркость кадра: среднее по всему кадру, по центру и по краям (0..1). Маленький холст, раз в секунду — почти бесплатно.
export function measureLight(video, cv = document.createElement('canvas')) {
  const w = 32, h = 18;
  cv.width = w; cv.height = h;
  const g = cv.getContext('2d', { willReadFrequently: true });
  try { g.drawImage(video, 0, 0, w, h); } catch { return null; }
  const d = g.getImageData(0, 0, w, h).data;
  let all = 0, center = 0, edge = 0, nc = 0, ne = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4, l = (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255;
    all += l;
    if (x > w * 0.3 && x < w * 0.7 && y > h * 0.2 && y < h * 0.85) { center += l; nc++; } else if (x < w * 0.15 || x > w * 0.85 || y < h * 0.15) { edge += l; ne++; }
  }
  return { mean: all / (w * h), center: center / nc, edge: edge / ne };
}

// Чистая функция: что не так с кадром сейчас (null — всё хорошо). light может быть null (нет данных).
export function visProblem(lm, light, { floor = false } = {}) {
  const vis = (p, t = 0.2) => p && (p.visibility ?? 1) >= t;
  if (!lm || lm.length < 29 || ![11, 12, 23, 24].some((i) => vis(lm[i]))) {
    // «темно» говорим, только когда человека из-за этого не видно: в полумраке, где счёт идёт, подсказка мешала (прогон 27.11)
    if (light && light.mean < VC.DARK) return 'vis_more_light';
    if (light && light.edge > 0.55 && light.edge - light.center > 0.22) return 'vis_light_behind';
    return 'vis_cant_see';
  }
  if (floor) return null; // в упоре лёжа голова и стопы не обязаны быть в кадре
  const sh = vis(lm[11]) && vis(lm[12]) ? mid(lm[11], lm[12]) : null, hp = vis(lm[23]) && vis(lm[24]) ? mid(lm[23], lm[24]) : null;
  if (sh && hp && Math.abs(hp.y - sh.y) < VC.FAR) return 'frame_step_closer';
  const headOut = !vis(lm[0], 0.35) || lm[0].y < VC.CUT_TOP;
  const ankles = [lm[27], lm[28]].filter((p) => vis(p));
  const feetOut = !ankles.length || Math.max(...ankles.map((p) => p.y)) > VC.CUT_BOTTOM;
  if (headOut && feetOut) return 'frame_step_back';
  if (feetOut) {
    // стопы «не видны», но колени на месте и не у края — значит, ноги теряются на фоне (тёмная одежда), а не обрезаны
    const knees = [lm[25], lm[26]].filter((p) => vis(p));
    const ankleRawY = Math.max(lm[27] ? lm[27].y : 2, lm[28] ? lm[28].y : 2); // модель «дорисовывает» стопы за краем кадра
    if (knees.length && Math.max(...knees.map((p) => p.y)) < 0.85 && ankleRawY < VC.CUT_BOTTOM) return light && light.mean < VC.DIM ? 'vis_more_light' : 'vis_contrast';
    return 'frame_upper_only';
  }
  if (headOut) return 'vis_head';
  const legVis = [25, 26, 27, 28].map((i) => (lm[i] && lm[i].visibility) || 0);
  if (legVis.reduce((s, v) => s + v, 0) / 4 < VC.LEG_VIS) return light && light.mean < VC.DIM ? 'vis_more_light' : 'vis_contrast';
  return null;
}

// Наблюдатель: frame(lm) на каждом кадре. say(key) — голос, show(text|'') — строка на экране, text(key) — текст подсказки.
export function createVisCoach({ video, say, show, text, floor = false, where = '', track = () => {} }) {
  const cv = document.createElement('canvas');
  let light = null, lightAt = 0, cur = null, since = 0, lastSaid = 0, shown = '', okSince = null;
  const lastByKey = {};
  return {
    get problem() { return cur; },
    frame(lm) {
      const now = performance.now();
      if (now - lightAt > 1000) { lightAt = now; light = measureLight(video, cv) || light; }
      const p = visProblem(lm, light, { floor });
      // ноги/голова/отойди мигают между собой у края кадра — для выдержки это одна проблема «кадр»;
      // проблема считается ушедшей, только если кадр хороший дольше OK_MS (одиночные хорошие кадры её не сбрасывают)
      const grp = (k) => (k && (k.startsWith('frame_') && k !== 'frame_step_closer' || k === 'vis_head') ? 'frame' : k);
      if (!p) {
        okSince = okSince ?? now;
        if (cur && now - okSince < VC.OK_MS) return null;
        cur = null; if (shown) { shown = ''; show(''); } return null;
      }
      okSince = null;
      if (grp(p) !== grp(cur)) since = now;
      cur = p;
      if (now - since < VC.HOLD_MS) return p;
      if (shown !== p) { shown = p; show(text(p)); }
      if (now - lastSaid > VC.GAP_MS && now - (lastByKey[p] || 0) > VC.REPEAT_MS) {
        lastSaid = now; lastByKey[p] = now;
        say(p);
        track('vis_hint', { kind: p, step: where, light: light ? Math.round(light.mean * 100) : null });
      }
      return p;
    },
    stop() { if (shown) show(''); },
  };
}
