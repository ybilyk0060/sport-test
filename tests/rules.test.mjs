// Проверка правил профиля и рекомендаций + запрет слов на странице. Запуск: node tests/rules.test.mjs
import fs from 'fs';
globalThis.location = { search: '' };
const { buildReport, buildProfile, levelOf, qualitiesOf, bodyBuild } = await import('../js/scoring.js');
let fail = 0; const check = (n, ok, got) => { console.log(`${ok ? 'OK  ' : 'FAIL'} ${n}${got !== undefined ? ': ' + JSON.stringify(got) : ''}`); if (!ok) fail++; };

const full = [
  { key: 'jumping_jack', target: 10, done: 10, elapsedSec: 14, metrics: { rhythmCv: 0.1, armDiff: 0.03 } },
  { key: 'squats', target: 8, done: 8, elapsedSec: 20, metrics: { shallow: 0 } },
  { key: 'high_knees', target: 10, done: 10, elapsedSec: 11, metrics: { liftsLeft: 14, liftsRight: 14 } },
  { key: 'arm_circles', target: 8, done: 8, elapsedSec: 15, metrics: { shallow: 0 } },
  { key: 'wall_french_press', target: 8, done: 8, elapsedSec: 14, metrics: { shallow: 0 } },
];
const quiz = { age: '6-8', now: 'none', likes: 'team', temper: 'active', goal: 'confidence', screen: 'high' };
const r = buildReport(full, quiz);
check('измеренные качества — уровень 3', qualitiesOf(full).every((q) => r.profile.qualities[q].level === 3) && qualitiesOf(full).length === 6, { q: qualitiesOf(full), p: r.profile.qualities });
check('итог high', r.profile.summary === 'high');
check('3 направления, первое — командные', r.sports.length === 3 && r.sports[0].sport === 'team', r.sports);
check('план: 2 недели × 3 занятия × 3 упражнения', r.plan.weeks.length === 2 && r.plan.weeks.every((w) => w.sessions.length === 3 && w.sessions.every((s) => s.items.length === 3 && new Set(s.items.map((i) => i.key)).size === 3)));
check('неделя 2 больше недели 1', r.plan.weeks[1].sessions[0].items[0].amount > r.plan.weeks[0].sessions[0].items[0].amount);
check('советы по квизу', r.plan.tips.includes('screenTip') && r.plan.tips.includes('startTip'), r.plan.tips);

const weak = [
  { key: 'jumping_jack', target: 10, done: 2, elapsedSec: 25, metrics: { rhythmCv: null, armDiff: 0.25 } },
  { key: 'squats', target: 8, done: 1, elapsedSec: 30, metrics: { shallow: 5 } },
  { key: 'high_knees', target: 10, done: 2, elapsedSec: 25, metrics: { liftsLeft: 3, liftsRight: 1 } },
  { key: 'arm_circles', target: 5, done: 1, elapsedSec: 20, metrics: { shallow: 4 } },
];
const w = buildReport(weak, { age: '3-5', likes: 'music', temper: 'calm', goal: 'health', screen: 'low', now: 'yard' });
check('слабый результат: уровни 1, руки не измерены', w.profile.qualities.legs.level === 1 && w.profile.qualities.flex.level === 1 && w.profile.qualities.arms.level === 0, w.profile.qualities);
check('итог low', w.profile.summary === 'low');
check('музыка → танцы первыми', w.sports[0].sport === 'dance', w.sports);
// Пол: лёгкий сдвиг, не перебивает результаты и в причины не попадает
const strongArms = [
  { key: 'jumping_jack', target: 10, done: 4, elapsedSec: 25, metrics: { rhythmCv: 0.45, armDiff: 0.2 } },
  { key: 'squats', target: 8, done: 8, elapsedSec: 20, metrics: { shallow: 0 } },
  { key: 'high_knees', target: 10, done: 3, elapsedSec: 25, metrics: { liftsLeft: 3, liftsRight: 2 } },
  { key: 'arm_circles', target: 8, done: 3, elapsedSec: 20, metrics: { shallow: 4 } },
  { key: 'wall_french_press', target: 8, done: 8, elapsedSec: 14, metrics: { shallow: 0 } },
  { key: 'pushups', target: 8, done: 8, elapsedSec: 20, metrics: { shallow: 0 } },
];
const neutral = { age: '12-15', now: 'yard', likes: 'solo', temper: 'mixed', goal: 'confidence', screen: 'low' };
const gS = buildReport(strongArms, { ...neutral, sex: 'girl' });
const rank = (rep, s) => rep.sports.findIndex((x) => x.sport === s);
check('сильная девочка: единоборства в тройке, танцев нет', rank(gS, 'martial') >= 0 && rank(gS, 'dance') < 0, gS.sports);
const eq = [{ key: 'jumping_jack', target: 10, done: 10, elapsedSec: 14, metrics: { rhythmCv: 0.1, armDiff: 0.03 } }];
const g0 = buildReport(eq, { ...neutral, likes: 'music', sex: 'girl' }), b0 = buildReport(eq, { ...neutral, likes: 'music', sex: 'boy' });
check('при прочих равных пол меняет только порядок, сумма сдвига 0,5', Math.abs(g0.sports[0].score - b0.sports[0].score) <= 0.5, [g0.sports, b0.sports]);
const n0 = buildReport(eq, { ...neutral, sex: 'skip' }), nb = buildReport(eq, { ...neutral, sex: 'boy' });
check('пол в причины не попадает', [...g0.sports, ...b0.sports, ...nb.sports].every((x) => x.reasons.every((k) => !k.startsWith('sex'))));
check('«не вказувати» = без пола', JSON.stringify(n0.sports) === JSON.stringify(buildReport(eq, neutral).sports));
check('причины: сначала результаты теста', gS.sports.every((x) => !x.reasons.some((k, i) => k.startsWith('q.') && x.reasons.slice(0, i).some((p) => !p.startsWith('q.') && !p.startsWith('body.')))), gS.sports);

// Телосложение: пороги IOTF по верху возрастного диапазона
check('8 лет девочка 128 см 26 кг (ИМТ 15,9) — std', bodyBuild({ cm: 128, kg: 26, sex: 'girl', age: '6-8' }) === 'std');
check('8 лет девочка 128 см 31 кг (ИМТ 18,9) — soft', bodyBuild({ cm: 128, kg: 31, sex: 'girl', age: '6-8' }) === 'soft');
check('8 лет девочка 128 см 38 кг (ИМТ 23,2) — gentle', bodyBuild({ cm: 128, kg: 38, sex: 'girl', age: '6-8' }) === 'gentle');
check('неправдоподобные числа — null', bodyBuild({ cm: 12, kg: 30 }) === null && bodyBuild({ cm: 130, kg: 300 }) === null && bodyBuild({}) === null);
check('пол не указан — больший порог', bodyBuild({ cm: 150, kg: 54, age: '12-15' }) === 'soft' && bodyBuild({ cm: 150, kg: 53, age: '12-15' }) === 'std' && bodyBuild({ cm: 150, kg: 53, age: '12-15', sex: 'boy' }) === 'soft');
const climbQ = { age: '6-8', now: 'none', likes: 'climb', temper: 'mixed', goal: 'health', screen: 'low', sex: 'girl' };
const climbStd = buildReport(full, { ...climbQ, build: 'std' }), climbG = buildReport(full, { ...climbQ, build: 'gentle' });
check('gentle: гимнастика уходит из тройки, плавание входит', rank(climbStd, 'gymnastics') >= 0 && rank(climbG, 'gymnastics') < 0 && rank(climbG, 'swimming') >= 0, [climbStd.sports, climbG.sports]);
check('gentle: причина про суставы, без слов о весе; совет про кардио', climbG.sports.some((x) => x.reasons.includes('body.joints')) && climbG.plan.tips[0] === 'cardioTip');

// Программа подписчика: 4 недели × 3 тренировки, акцент по интересу, рост нагрузки
const { buildProgram, nextWorkout } = await import('../js/program.js');
const pg = buildProgram(r.profile, quiz, full);
check('программа: 12 тренировок по 4 упражнения', pg.workouts.length === 12 && pg.workouts.every((x) => x.items.length === 4), pg.workouts.map((x) => x.items.length));
check('в программе только упражнения возраста (+ новые из Студії по возрасту)', pg.workouts.every((x) => x.items.every((i) => ['jumping_jack', 'arm_circles', 'squats', 'high_knees', 'good_morning', 'quadruped_arm_circles', 'cross_crawl', 'side_leg_raise', 'side_bend', 'glute_bridge', 'superman_lifts'].includes(i.key))));
check('новое упражнение из Студії раз в неделю, tuck_jump не раньше 7 лет', pg.workouts.filter((x) => x.day === 3).every((x) => x.items.some((i) => ['cross_crawl', 'side_leg_raise', 'side_bend', 'glute_bridge', 'superman_lifts'].includes(i.key))) && pg.workouts.every((x) => x.items.every((i) => i.key !== 'tuck_jump')));
check('футбол → бег в каждой тренировке', pg.focus === 'team' && pg.workouts.every((x) => x.items.some((i) => i.key === 'high_knees')));
const sq = (wk) => pg.workouts.find((x) => x.week === wk && x.day === 1).items.find((i) => i.key === 'squats').target;
check('нагрузка растёт по неделям', sq(4) > sq(1), [sq(1), sq(4)]);
check('следующая тренировка после выполненной', nextWorkout(pg, [{ id: 'w1d1' }]).id === 'w1d2' && nextWorkout(pg, pg.workouts) === null);
const pf = buildProgram(w.profile, { age: '12-15', likes: 'fight' }, weak);
check('борьба → присідання і віджимання', pf.workouts[0].items.some((i) => i.key === 'squats') && pf.workouts[0].items.some((i) => i.key === 'pushups'), pf.workouts[0].items);
const none = buildProfile(full.map((x) => ({ ...x, skipped: true })));
check('всё пропущено → none', none.summary === 'none' && none.strongest === null);
check('пороги уровней', levelOf(0.75) === 3 && levelOf(0.5) === 2 && levelOf(0.2) === 1 && levelOf(null) === 0);

// Запрещённые слова и цена: в строках интерфейса и html
// «талант» разрешён владельцем 25.11 (крючок теста). «free/gratis» — только в контексте промокодов не используем на странице.
const banned = /безкоштовн|безоплатн|бесплатн/i;
const files = ['js/i18n/uk.js', 'index.html', 'privacy.html', 'pay-test.html', 'privacy-en.html', 'privacy-de.html', 'oferta.html', 'povernennya.html', 'kontakty.html', 'terms-en.html', 'refund-en.html', 'contact-en.html', 'agb-de.html', 'refund-de.html', 'impressum-de.html', 'pricing-en.html', 'pricing-de.html', 'ciny.html'].filter((f) => fs.existsSync(f));
for (const f of files) {
  const txt = fs.readFileSync(f, 'utf8').split('\n').filter((l) => !l.trim().startsWith('//')).join('\n');
  const m = txt.match(banned);
  check(`нет запрещённых слов: ${f}`, !m, m ? m[0] : undefined);
}
// Цена и оплата упоминаются только в блоках paywall / payTest / report / result.locked
const uk = (await import('../js/i18n/uk.js')).default;
const priceWords = /грн|оплат|платіж|\$|(^|[^а-яіїєґ])цін|коштує|купити/i;
const flat = (o, p = '') => Object.entries(o).flatMap(([k, v]) => typeof v === 'function' ? [[p + k, String(v(1, 2, 3))]] : typeof v === 'object' && v ? flat(v, p + k + '.') : [[p + k, String(v)]]);
const early = flat(uk).filter(([k]) => !/^(paywall|payTest|sub|report\.paidOk|common\.pricing)/.test(k)).filter(([, v]) => priceWords.test(v));
check('до экрана результата нет слов о цене и оплате', early.length === 0, early);
// Все языки: одинаковые ключи (en — эталон), функции те же
const en = (await import('../js/i18n/en.js')).default, de = (await import('../js/i18n/de.js')).default;
const keys = (o) => flat(o).map(([k]) => k).sort();
for (const [n, L] of [['de', de], ['uk', uk]]) { const a = keys(en), b = keys(L); const miss = a.filter((k) => !b.includes(k)), extra = b.filter((k) => !a.includes(k)); check(`ключи ${n} = en`, !miss.length && !extra.length, { miss, extra }); }
// Следующий месяц: id другие, нагрузка от лучшего результата прошлого месяца
const { currentMonth } = await import('../js/program.js');
const hist = pg.workouts.map((x) => ({ id: x.id, done: x.items.map((i) => ({ key: i.key, done: i.target + 1, target: i.target })) }));
const p2 = buildProgram(r.profile, quiz, full, { month: 2, history: hist });
const sqm = (p, wk) => p.workouts.find((x) => x.week === wk && x.day === 1).items.find((i) => i.key === 'squats');
check('месяц 2: новые id и рост нагрузки', p2.workouts[0].id === 'm2w1d1' && sqm(p2, 1).target > sqm(pg, 1).target, [sqm(pg, 1), sqm(p2, 1)]);
check('месяц по времени и по выполненному', currentMonth({ startedAt: Date.now() - 31 * 86400000 }, []) === 2 && currentMonth({ startedAt: Date.now() }, hist) === 2 && currentMonth({ startedAt: Date.now() }, []) === 1);
console.log(fail ? `\n${fail} FAILED` : '\nALL OK'); process.exit(fail ? 1 : 0);
