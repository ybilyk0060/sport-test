// Языки. Основной — английский (рынки США, Канада, Великобритания, Австралия), немецкий — Германия и Австрия,
// украинский — Украина. Выбор: ?lang=en|de|uk (запоминается), иначе язык браузера, иначе en.
import en from './en.js';
import de from './de.js';
import uk from './uk.js';

export const LOCALES = { en, de, uk };
function pick() {
  let q = null;
  try { q = new URLSearchParams(location.search).get('lang'); } catch { /* без адреса — тесты */ }
  if (q && LOCALES[q]) { try { localStorage.setItem('sporttest.lang', q); } catch { /* нет доступа */ } return q; }
  try { const s = localStorage.getItem('sporttest.lang'); if (s && LOCALES[s]) return s; } catch { /* нет доступа */ }
  const langs = (typeof navigator !== 'undefined' && (navigator.languages || [navigator.language])) || [];
  for (const l of langs) {
    const c = String(l || '').slice(0, 2).toLowerCase();
    if (c === 'uk' || c === 'ru') return 'uk'; // русскоязычные из Украины получают украинский; русской версии нет
    if (c === 'de') return 'de';
    if (c === 'en') return 'en';
  }
  return 'en';
}
export const LANG = pick();
export const T = LOCALES[LANG];
