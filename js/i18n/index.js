// Языки. Основной — английский (рынки США, Канада, Великобритания, Австралия), немецкий — Германия и Австрия,
// украинский — Украина. Выбор: ?lang=en|de|uk (запоминается), иначе язык браузера, иначе en.
import en from './en.js?v=a2f36a7-mwyvssvh';
import de from './de.js?v=a2f36a7-mwyvssvh';
import uk from './uk.js?v=a2f36a7-mwyvssvh';
import { CONFIG } from '../config.js?v=a2f36a7-mwyvssvh';
import { STUDIO } from '../engine/specs-studio.js?v=a2f36a7-mwyvssvh';

const ALL = { en, de, uk };
// Только включённые в CONFIG.languages; первый в списке — язык по умолчанию
export const LOCALES = Object.fromEntries((CONFIG.languages || ['en']).map((k) => [k, ALL[k]]).filter(([, v]) => v));
const FIRST = Object.keys(LOCALES)[0] || 'en';
function pick() {
  let q = null;
  try { q = new URLSearchParams(location.search).get('lang'); } catch { /* без адреса — тесты */ }
  if (q && LOCALES[q]) { try { localStorage.setItem('sporttest.lang', q); } catch { /* нет доступа */ } return q; }
  try { const s = localStorage.getItem('sporttest.lang'); if (s && LOCALES[s]) return s; } catch { /* нет доступа */ }
  const langs = (typeof navigator !== 'undefined' && (navigator.languages || [navigator.language])) || [];
  for (const l of langs) {
    const c = String(l || '').slice(0, 2).toLowerCase();
    const linkOnly = CONFIG.linkOnlyLanguages || [];
    if ((c === 'uk' || c === 'ru') && LOCALES.uk && !linkOnly.includes('uk')) return 'uk'; // русской версии нет
    if (c === 'de' && LOCALES.de) return 'de';
    if (c === 'en' && LOCALES.en) return 'en';
  }
  return FIRST;
}
export const LANG = pick();
export const T = LOCALES[LANG] || ALL.en;

// Упражнения Студії без своих текстов сайта: название, задание и инструкция из каталога
const TASK = {
  en: (name, n, sec) => `${name} — ${n} ${sec ? 'seconds' : 'times'}`,
  de: (name, n, sec) => `${name} — ${sec ? `${n} Sekunden` : `${n}-mal`}`,
  uk: (name, n, sec) => `${name} — ${n} ${sec ? 'секунд' : 'разів'}`,
};
for (const [k, e] of Object.entries(STUDIO)) {
  const tx = e.texts[LANG] || e.texts.en, sec = e.goal === 'seconds';
  if (!T.ex[k]) T.ex[k] = { name: tx.name, task: (n) => (TASK[LANG] || TASK.en)(tx.name, n, sec), how: (tx.instructions && tx.instructions.length ? tx.instructions.join(' ') : tx.description) };
  if (T.report && T.report.planEx && !T.report.planEx[k]) T.report.planEx[k] = tx.name;
}
