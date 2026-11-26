// Мини-клиент Веб-инспектора iPhone (через ios_webkit_debug_proxy на 127.0.0.1:9222): выполнить JS во вкладке обычного Safari.
// Нужен для прогона с настоящей камерой: в режиме автоматизации (safaridriver) Safari подставляет заглушку камеры.
export async function connect(match = 'kids-test.com', port = 9222) {
  const tabs = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
  const tab = tabs.find((t) => (t.url || '').includes(match));
  if (!tab) throw new Error(`нет вкладки ${match}: откройте её в Safari на iPhone`);
  const ws = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((ok, bad) => { ws.onopen = ok; ws.onerror = () => bad(new Error('ws')); });
  let id = 0, target = null;
  const pending = new Map();
  const onReply = (m) => { if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.method === 'Target.targetCreated') target = m.params.targetInfo.targetId;
    else if (m.method === 'Target.dispatchMessageFromTarget') onReply(JSON.parse(m.params.message));
    else onReply(m);
  };
  for (let i = 0; i < 30 && !target; i++) await new Promise((r) => setTimeout(r, 100)); // iOS присылает Target.targetCreated не сразу
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const n = ++id;
    const t = setTimeout(() => { pending.delete(n); reject(new Error(`timeout ${method}`)); }, 15000);
    pending.set(n, (m) => { clearTimeout(t); m.error ? reject(new Error(m.error.message)) : resolve(m.result); });
    const inner = { id: n, method, params };
    ws.send(JSON.stringify(target ? { id: ++id + 100000, method: 'Target.sendMessageToTarget', params: { targetId: target, message: JSON.stringify(inner) } } : inner));
  });
  const evaluate = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.wasThrown || r.exceptionDetails) throw new Error('js: ' + JSON.stringify(r.result && r.result.description || r.exceptionDetails).slice(0, 200));
    return r.result && r.result.value;
  };
  return { tab, evaluate, close: () => ws.close() };
}
