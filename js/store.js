// Хранилище за одним интерфейсом. Сейчас — устройство (localStorage).
// Чтобы подключить сервер: реализовать те же методы в новом адаптере и выбрать его в CONFIG.storage.
// Сохраняем: ответы квиза, баллы, состояние подписки и выполненные тренировки, события пути. Видео и точки тела — никогда.

import { CONFIG } from './config.js?v=39e5375-mwz6navn';
import { detectEnv } from './env.js?v=39e5375-mwz6navn';
import { send } from './analytics.js?v=39e5375-mwz6navn';

const NS = 'sporttest.v1.';
const mem = {};
const ls = {
  get(k) { try { return localStorage.getItem(NS + k); } catch { return mem[k] ?? null; } },
  set(k, v) { try { localStorage.setItem(NS + k, v); } catch { mem[k] = v; } },
  del(k) { try { localStorage.removeItem(NS + k); } catch { delete mem[k]; } },
  keys() { try { return Object.keys(localStorage).filter((k) => k.startsWith(NS)); } catch { return []; } },
};
const readJson = (k, d) => { try { const v = ls.get(k); return v ? JSON.parse(v) : d; } catch { return d; } };

const deviceAdapter = {
  name: 'device',
  saveState(state) { ls.set('state', JSON.stringify(state)); },
  loadState() { return readJson('state', null); },
  appendEvent(ev) {
    const all = readJson('events', []);
    all.push(ev);
    if (all.length > 500) all.splice(0, all.length - 500);
    ls.set('events', JSON.stringify(all));
  },
  events() { return readJson('events', []); },
  clearAll() { for (const k of ls.keys()) { try { localStorage.removeItem(k); } catch { /* нет доступа */ } } },
};

const adapters = { device: deviceAdapter };
export const store = adapters[CONFIG.storage] || deviceAdapter;

// --- Состояние прохождения ---
const newSid = () => 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
export function freshState() {
  return { sid: newSid(), step: 'landing', quiz: {}, results: null, profile: null, paid: false, fallback: false, startedAt: Date.now() };
}
export let state = store.loadState() || freshState();
export function setState(patch) { Object.assign(state, patch); store.saveState(state); return state; }
export function resetState() { state = freshState(); store.saveState(state); return state; }
export function replaceState(next) { state = next; store.saveState(state); return state; }

// --- События пути ---
const env = detectEnv();
export function track(name, props = {}) {
  const ev = { t: new Date().toISOString(), sid: state.sid, name, browser: env.browser, platform: env.platform, inApp: env.inApp, ...props };
  store.appendEvent(ev);
  if (window.__debugLog) window.__debugLog(ev);
  send(name, ev);
  return ev;
}

// --- Перенос ответов в другой браузер (Android: «Відкрити в Chrome») ---
const b64u = {
  enc: (s) => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
  dec: (s) => decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/')))),
};
export function exportHandoff() {
  return b64u.enc(JSON.stringify({ sid: state.sid, quiz: state.quiz, startedAt: state.startedAt }));
}
export function importHandoff(token) {
  try {
    const d = JSON.parse(b64u.dec(token));
    if (!d || typeof d !== 'object' || !d.quiz) return false;
    replaceState({ ...freshState(), sid: d.sid || newSid(), quiz: d.quiz, startedAt: d.startedAt || Date.now(), step: 'prep' });
    return true;
  } catch { return false; }
}
