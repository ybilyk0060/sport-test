// Подсказки видимости (js/viscoach.js): какая ситуация распознаётся.
import { visProblem } from '../js/viscoach.js';
let fail = 0;
const check = (name, ok, extra) => { console.log(ok ? 'OK  ' : 'FAIL', name, ok ? '' : JSON.stringify(extra)); if (!ok) fail++; };
// Стоящий человек: голова 0,12, плечи 0,25, таз 0,5, колени 0,7, щиколотки 0,9 (доля высоты кадра)
function body({ scale = 1, dy = 0, vis = 0.95, legVis = vis, footVis = legVis } = {}) {
  const p = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, visibility: 0 }));
  const y = (v) => 0.5 + (v - 0.5) * scale + dy;
  p[0] = { x: 0.5, y: y(0.12), visibility: vis };
  p[11] = { x: 0.45, y: y(0.25), visibility: vis }; p[12] = { x: 0.55, y: y(0.25), visibility: vis };
  p[23] = { x: 0.47, y: y(0.5), visibility: vis }; p[24] = { x: 0.53, y: y(0.5), visibility: vis };
  p[25] = { x: 0.47, y: y(0.7), visibility: legVis }; p[26] = { x: 0.53, y: y(0.7), visibility: legVis };
  p[27] = { x: 0.47, y: y(0.9), visibility: footVis }; p[28] = { x: 0.53, y: y(0.9), visibility: footVis };
  return p;
}
const ok = { mean: 0.45, center: 0.45, edge: 0.45 };
check('всё хорошо', visProblem(body(), ok) === null, visProblem(body(), ok));
check('темно', visProblem(body(), { mean: 0.1, center: 0.1, edge: 0.1 }) === 'vis_more_light');
check('никого нет', visProblem(null, ok) === 'vis_cant_see');
check('никого нет, окно сзади', visProblem(null, { mean: 0.5, center: 0.3, edge: 0.75 }) === 'vis_light_behind');
check('далеко', visProblem(body({ scale: 0.2 }), ok) === 'frame_step_closer', visProblem(body({ scale: 0.2 }), ok));
check('слишком близко: нет ни головы, ни ног', visProblem(body({ scale: 1.6 }), ok) === 'frame_step_back', visProblem(body({ scale: 1.6 }), ok));
check('ноги обрезаны снизу', visProblem(body({ dy: 0.12 }), ok) === 'frame_upper_only', visProblem(body({ dy: 0.12 }), ok));
check('голова обрезана сверху', visProblem(body({ dy: -0.12 }), ok) === 'vis_head', visProblem(body({ dy: -0.12 }), ok));
check('тёмная одежда: стопы не видны, колени на месте', visProblem(body({ footVis: 0.1 }), ok) === 'vis_contrast', visProblem(body({ footVis: 0.1 }), ok));
check('тёмная одежда в полумраке → включи свет', visProblem(body({ footVis: 0.1 }), { mean: 0.22, center: 0.22, edge: 0.22 }) === 'vis_more_light');
check('ноги видны слабо (0,3)', visProblem(body({ legVis: 0.3 }), ok) === 'vis_contrast', visProblem(body({ legVis: 0.3 }), ok));
check('в упоре лёжа голова/ноги не обязательны', visProblem(body({ scale: 1.6 }), ok, { floor: true }) === null);
console.log(fail ? `\n${fail} FAILED` : '\nALL OK'); process.exit(fail ? 1 : 0);
