// Веб-тест: подписка на сервере (владелец 25.11). Статус, отмена и восстановление доступа не зависят от браузера.
// Ключ доступа устройства (token) живёт в браузере и в ссылке из письма; в базе хранится только его sha256.
//
// POST {action:'activate', orderRef, email, currency, first, regular, quiz, results, test?} -> {token, sub}
//      live: заказ должен быть оплачен (sport_test_orders.status='paid'); test: только если функция в тестовом режиме
// POST {action:'status', token}            -> {sub}
// POST {action:'cancel', token}            -> {sub}
// POST {action:'resume', token}            -> {sub}
// POST {action:'sync', token, workouts}    -> {ok}         (выполненные тренировки — для других устройств)
// POST {action:'restore', email, returnTo} -> {ok:true}    (всегда ok; письмо со ссылкой, если подписка есть)
// POST {action:'remind'} + заголовок x-cron-secret -> письма «через 3 дня продление: цена, дата, ссылка отмены» (cron раз в час)
//
// Письма — через Brevo (секреты BREVO_API_KEY, SPORT_TEST_MAIL_FROM). Без секретов письма не отправляются, остальное работает.
// verify_jwt=false (вызывается со страницы без входа).
import { createHash, randomBytes } from "node:crypto";
import { createClient } from "jsr:@supabase/supabase-js@2";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const MODE = Deno.env.get("WFP_MERCHANT") ? "live" : "test";
const SITE_HOSTS = (Deno.env.get("SPORT_TEST_RETURN_HOSTS") || "kids-test.com,www.kids-test.com,ybilyk0060.github.io,localhost,127.0.0.1").split(",");
const BREVO = Deno.env.get("BREVO_API_KEY");
const FROM = Deno.env.get("SPORT_TEST_MAIL_FROM") || "support@kids-test.com";
const PERIOD_DAYS = 30;
const CRON_SECRET = Deno.env.get("SPORT_TEST_CRON_SECRET");

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });
const hash = (t: string) => createHash("sha256").update(t).digest("hex");
const newToken = () => randomBytes(24).toString("base64url");
const emailOk = (e: string) => /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,24}$/.test(e);
const clip = (v: unknown, max = 20000) => { const s = JSON.stringify(v ?? null); return s.length > max ? null : JSON.parse(s); };

function safeSite(to: string): string | null {
  try { const u = new URL(to); return SITE_HOSTS.includes(u.hostname) && (u.protocol === "https:" || u.hostname === "localhost") ? `${u.origin}${u.pathname}` : null; } catch { return null; }
}

// Публичный вид подписки: без email и служебных полей
const view = (s: Record<string, unknown>) => ({
  status: s.status, mode: s.mode, currency: s.currency, first: Number(s.first_amount), regular: Number(s.regular_amount),
  periodDays: s.period_days, startedAt: Date.parse(String(s.started_at)), paidUntil: Date.parse(String(s.paid_until)),
  cancelledAt: s.cancelled_at ? Date.parse(String(s.cancelled_at)) : null, quiz: s.quiz, results: s.results, workouts: s.workouts,
});

async function byToken(token: string) {
  if (!token || token.length > 100) return null;
  const { data: t } = await db.from("sport_test_sub_tokens").select("sub_id").eq("token_hash", hash(token)).maybeSingle();
  if (!t) return null;
  const { data } = await db.from("sport_test_subscriptions").select("*").eq("id", t.sub_id).maybeSingle();
  return data;
}

async function issueToken(subId: string) {
  const token = newToken();
  await db.from("sport_test_sub_tokens").insert({ token_hash: hash(token), sub_id: subId });
  return token;
}

async function mail(to: string, subject: string, text: string) {
  if (!BREVO) return false;
  const r = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST", headers: { "api-key": BREVO, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ sender: { email: FROM, name: "Kids strengths test" }, to: [{ email: to }], subject, textContent: text }),
  });
  return r.ok;
}

const money = (n: number, cur: string) => (cur === "UAH" ? `${n} грн` : cur === "EUR" ? `${n} €` : `$${n}`);
function termsMail(lang: string, s: Record<string, unknown>, link: string) {
  const first = money(Number(s.first_amount), String(s.currency)), regular = money(Number(s.regular_amount), String(s.currency));
  const until = new Date(String(s.paid_until)).toISOString().slice(0, 10);
  if (lang === "uk") return { subject: "Підписку оформлено — тест сильних сторін дитини", text: `Дякуємо! Підписку оформлено.\n\nПерший платіж: ${first} за ${PERIOD_DAYS} днів.\nДалі: ${regular} кожні ${PERIOD_DAYS} днів, перше продовження ${until}, доки ви не скасуєте.\n\nВідкрити програму й керувати підпискою (скасування в 2 дотики) з будь-якого пристрою:\n${link}\n\nПитання: ${FROM}` };
  if (lang === "de") return { subject: "Abo abgeschlossen — Stärkentest für Kinder", text: `Danke! Ihr Abo ist aktiv.\n\nErste Zahlung: ${first} für ${PERIOD_DAYS} Tage.\nDanach: ${regular} alle ${PERIOD_DAYS} Tage, erste Verlängerung am ${until}, bis Sie kündigen.\n\nProgramm öffnen und Abo verwalten (Kündigung mit 2 Klicks) auf jedem Gerät:\n${link}\n\nFragen: ${FROM}` };
  return { subject: "You’re subscribed — kids’ strengths test", text: `Thank you! Your subscription is active.\n\nFirst payment: ${first} for ${PERIOD_DAYS} days.\nThen: ${regular} every ${PERIOD_DAYS} days, first renewal on ${until}, until you cancel.\n\nOpen the program and manage your subscription (cancel in 2 taps) on any device:\n${link}\n\nQuestions: ${FROM}` };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ ok: true, mode: MODE });
  try {
    const b = await req.json().catch(() => ({})) as Record<string, any>;

    if (b.action === "activate") {
      const email = String(b.email || "").trim().toLowerCase();
      const orderRef = String(b.orderRef || "");
      if (!emailOk(email) || !/^st-[A-Za-z0-9_-]{4,76}$/.test(orderRef)) return json({ error: "bad input" }, 400);
      if (MODE === "live") {
        const { data: o } = await db.from("sport_test_orders").select("status, amount, currency").eq("order_ref", orderRef).maybeSingle();
        if (!o || o.status !== "paid") return json({ error: "order not paid" }, 402);
      } else if (!b.test) return json({ error: "test mode only" }, 400);
      const { data: existing } = await db.from("sport_test_subscriptions").select("*").eq("order_ref", orderRef).maybeSingle();
      let sub = existing;
      if (!sub) {
        const now = Date.now();
        const { data, error } = await db.from("sport_test_subscriptions").insert({
          order_ref: orderRef, email, mode: MODE, currency: String(b.currency || "USD").slice(0, 3),
          first_amount: Number(b.first) || 0, regular_amount: Number(b.regular) || 0, period_days: PERIOD_DAYS,
          started_at: new Date(now).toISOString(), paid_until: new Date(now + PERIOD_DAYS * 86400000).toISOString(),
          quiz: clip(b.quiz), results: clip(b.results), lang: ["en", "de", "uk"].includes(String(b.lang)) ? String(b.lang) : "en",
          site: safeSite(String(b.returnTo || "")),
        }).select("*").single();
        if (error) return json({ error: error.message }, 500);
        sub = data;
      }
      const token = await issueToken(sub.id);
      const site = safeSite(String(b.returnTo || ""));
      if (site && !existing) { const m = termsMail(String(b.lang || "en"), sub, `${site}?sub=${token}`); await mail(email, m.subject, m.text); }
      return json({ token, sub: view(sub) });
    }

    if (b.action === "remind") {
      if (!CRON_SECRET || req.headers.get("x-cron-secret") !== CRON_SECRET) return json({ error: "forbidden" }, 403);
      const soon = new Date(Date.now() + 3 * 86400000).toISOString();
      const { data: subs } = await db.from("sport_test_subscriptions").select("*").eq("status", "active").lte("paid_until", soon).gt("paid_until", new Date().toISOString()).limit(200);
      let sent = 0;
      for (const s of subs || []) {
        if (s.reminded_for === s.paid_until || !s.site) continue;
        const token = await issueToken(s.id);
        const link = `${s.site}?sub=${token}`;
        const price = money(Number(s.regular_amount), String(s.currency));
        const date = new Date(String(s.paid_until)).toISOString().slice(0, 10);
        const m = s.lang === "uk"
          ? { subject: `Через 3 дні продовження підписки: ${price}`, text: `${date} підписка продовжиться за ${price} на наступні ${PERIOD_DAYS} днів.\n\nЯкщо не хочете продовжувати — скасуйте в один дотик:\n${link}\n\nПитання: ${FROM}` }
          : s.lang === "de"
          ? { subject: `In 3 Tagen verlängert sich Ihr Abo: ${price}`, text: `Am ${date} verlängert sich Ihr Abo für ${price} um weitere ${PERIOD_DAYS} Tage.\n\nWenn Sie nicht verlängern möchten, kündigen Sie mit einem Klick:\n${link}\n\nFragen: ${FROM}` }
          : { subject: `Your subscription renews in 3 days: ${price}`, text: `On ${date} your subscription renews for ${price} for another ${PERIOD_DAYS} days.\n\nIf you don't want to continue, cancel in one tap:\n${link}\n\nQuestions: ${FROM}` };
        if (await mail(s.email, m.subject, m.text)) { await db.from("sport_test_subscriptions").update({ reminded_for: s.paid_until }).eq("id", s.id); sent++; }
      }
      return json({ ok: true, sent });
    }

    if (b.action === "restore") {
      const email = String(b.email || "").trim().toLowerCase();
      const site = safeSite(String(b.returnTo || ""));
      if (!emailOk(email) || !site) return json({ ok: true });
      const { data: subs } = await db.from("sport_test_subscriptions").select("*").eq("email", email).order("created_at", { ascending: false }).limit(1);
      const sub = subs && subs[0];
      if (sub && (!sub.last_restore_at || Date.now() - Date.parse(sub.last_restore_at) > 60000)) {
        const token = await issueToken(sub.id);
        await db.from("sport_test_subscriptions").update({ last_restore_at: new Date().toISOString() }).eq("id", sub.id);
        const lang = String(b.lang || "en");
        const link = `${site}?sub=${token}`;
        const subject = lang === "uk" ? "Доступ до підписки" : lang === "de" ? "Zugang zu Ihrem Abo" : "Access to your subscription";
        const text = lang === "uk" ? `Відкрийте програму на цьому пристрої:\n${link}` : lang === "de" ? `Öffnen Sie das Programm auf diesem Gerät:\n${link}` : `Open the program on this device:\n${link}`;
        await mail(email, subject, text);
      }
      return json({ ok: true }); // одинаковый ответ — по email нельзя узнать, есть ли подписка
    }

    const sub = await byToken(String(b.token || ""));
    if (!sub) return json({ error: "not found" }, 404);

    if (b.action === "status") return json({ sub: view(sub) });
    if (b.action === "cancel" || b.action === "resume") {
      const patch = b.action === "cancel" ? { status: "cancelled", cancelled_at: new Date().toISOString() } : { status: "active", cancelled_at: null };
      // Настоящая отмена у платёжного провайдера (регулярный платёж WayForPay) — добавить при подключении мерчанта
      const { data } = await db.from("sport_test_subscriptions").update(patch).eq("id", sub.id).select("*").single();
      return json({ sub: view(data) });
    }
    if (b.action === "sync") {
      const w = clip(b.workouts, 50000);
      if (Array.isArray(w)) await db.from("sport_test_subscriptions").update({ workouts: w }).eq("id", sub.id);
      return json({ ok: true });
    }
    return json({ error: "unknown action" }, 400);
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
