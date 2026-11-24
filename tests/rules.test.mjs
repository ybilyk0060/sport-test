// Проверка правил профиля и рекомендаций + запрет слов на странице. Запуск: node tests/rules.test.mjs
import fs from 'fs';
globalThis.location = { search: '' };
const { buildReport, buildProfile, levelOf } = await import('../js/scoring.js');
let fail = 0; const check = (n, ok, got) => { console.log(`${ok ? 'OK  ' : 'FAIL'} ${n}${got !== undefined ? ': ' + JSON.stringify(got) : ''}`); if (!ok) fail++; };

const full = [
  { key: 'jumping_jack', target: 10, done: 10, elapsedSec: 14, metrics: { rhythmCv: 0.1, armDiff: 0.03 } },
  { key: 'squats', target: 8, done: 8, elapsedSec: 20, metrics: { shallow: 0 } },
  { key: 'high_knees', target: 10, done: 10, elapsedSec: 11, metrics: { liftsLeft: 14, liftsRight: 14 } },
  { key: 'plank', target: 15, done: 15, elapsedSec: 18, metrics: { driftDeg: 2 } },
];
const quiz = { age: '7-9', now: 'none', likes: 'team', temper: 'active', goal: 'confidence', screen: 'high', city: 'Київ' };
const r = buildReport(full, quiz);
check('все качества — уровень 3', Object.values(r.profile.qualities).every((q) => q.level === 3), r.profile.qualities);
check('итог high', r.profile.summary === 'high');
check('3 направления, первое — командные', r.sports.length === 3 && r.sports[0].sport === 'team', r.sports);
check('план: 2 недели × 3 занятия × 3 упражнения', r.plan.weeks.length === 2 && r.plan.weeks.every((w) => w.sessions.length === 3 && w.sessions.every((s) => s.items.length === 3 && new Set(s.items.map((i) => i.key)).size === 3)));
check('неделя 2 больше недели 1', r.plan.weeks[1].sessions[0].items[0].amount > r.plan.weeks[0].sessions[0].items[0].amount);
check('советы по квизу', r.plan.tips.includes('screenTip') && r.plan.tips.includes('startTip'), r.plan.tips);

const weak = [
  { key: 'jumping_jack', target: 10, done: 2, elapsedSec: 25, metrics: { rhythmCv: null, armDiff: 0.25 } },
  { key: 'squats', target: 8, done: 1, elapsedSec: 30, metrics: { shallow: 5 } },
  { key: 'high_knees', target: 10, done: 2, elapsedSec: 25, metrics: { liftsLeft: 3, liftsRight: 1 } },
  { key: 'plank', target: 15, done: 0, elapsedSec: 40, skipped: true, metrics: {} },
];
const w = buildReport(weak, { age: '4-6', likes: 'music', temper: 'calm', goal: 'health', screen: 'low', now: 'yard' });
check('слабый результат: уровни 1, планка не измерена', w.profile.qualities.legs.level === 1 && w.profile.qualities.core.level === 0, w.profile.qualities);
check('итог low', w.profile.summary === 'low');
check('музыка → танцы первыми', w.sports[0].sport === 'dance', w.sports);
const none = buildProfile(full.map((x) => ({ ...x, skipped: true })));
check('всё пропущено → none', none.summary === 'none' && none.strongest === null);
check('пороги уровней', levelOf(0.75) === 3 && levelOf(0.5) === 2 && levelOf(0.2) === 1 && levelOf(null) === 0);

// Запрещённые слова и цена: в строках интерфейса и html
const banned = /безкоштовн|безоплатн|free|gratis|бесплатн|талант/i;
const files = ['js/i18n/uk.js', 'index.html', 'privacy.html', 'pay-test.html'].filter((f) => fs.existsSync(f));
for (const f of files) {
  const txt = fs.readFileSync(f, 'utf8').split('\n').filter((l) => !l.trim().startsWith('//')).join('\n').replace(/визначити талант/g, '');
  const m = txt.match(banned);
  check(`нет запрещённых слов: ${f}`, !m, m ? m[0] : undefined);
}
// Цена и оплата упоминаются только в блоках paywall / payTest / report / result.locked
const uk = (await import('../js/i18n/uk.js')).default;
const priceWords = /грн|оплат|платіж|\$|(^|[^а-яіїєґ])цін|коштує|купити/i;
const flat = (o, p = '') => Object.entries(o).flatMap(([k, v]) => typeof v === 'function' ? [[p + k, String(v(1, 2, 3))]] : typeof v === 'object' && v ? flat(v, p + k + '.') : [[p + k, String(v)]]);
const early = flat(uk).filter(([k]) => !/^(paywall|payTest|report\.paidOk)/.test(k)).filter(([, v]) => priceWords.test(v));
check('до экрана результата нет слов о цене и оплате', early.length === 0, early);
console.log(fail ? `\n${fail} FAILED` : '\nALL OK'); process.exit(fail ? 1 : 0);
