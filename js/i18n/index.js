// Подключение языков. Чтобы добавить en/de: import en from './en.js' и дописать в LOCALES.
import uk from './uk.js';

const LOCALES = { uk };
const lang = new URLSearchParams(location.search).get('lang');
export const T = LOCALES[lang] || uk;
