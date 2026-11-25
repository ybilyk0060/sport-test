// Языки. Основной — английский (рынки США, Канада, Великобритания, Австралия), немецкий — Германия и Австрия,
// украинский — Украина. Выбор: ?lang=en|de|uk (запоминается), иначе язык браузера, иначе en.
import en from './en.js?v=ee7001c-mwwo3tzn';
import de from './de.js?v=ee7001c-mwwo3tzn';
import uk from './uk.js?v=ee7001c-mwwo3tzn';
import { CONFIG } from '../config.js?v=ee7001c-mwwo3tzn';

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
