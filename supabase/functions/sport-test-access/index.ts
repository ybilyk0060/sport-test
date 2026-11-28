// Доступ подписчика теста к приложениям (Kidsney, Kidsney Zoo, Chill Move) без промокодов (Юрий 26.11).
// Приложение спрашивает email, с которым родитель оплатил тест, сервер шлёт на него 6-значный код, по коду выдаёт токен приложения.
// Статус подписки по одному email не раскрывается: на запрос кода ответ всегда {ok:true}, неверный код и «нет подписки» неразличимы.
//
// POST {action:'request', email, app, lang?}        -> {ok:true}                      (код на почту, если подписка активна; не чаще раза в минуту)
// POST {action:'verify',  email, code, app}         -> {token, access} | {error:'invalid'} 401  (10 неверных попыток в час на email, код живёт 10 минут)
// POST {action:'check',   token}                    -> {access:{active, until, status}} | 404   (приложение вызывает при запуске)
// POST {action:'logout',  token}                    -> {ok:true}
// access.active = true, пока оплаченный период не истёк (после отмены доступ остаётся до конца периода).
//
// Таблицы: sport_test_access_codes, sport_test_app_tokens (миграция 20261126_sport_test_app_access.sql). verify_jwt=false.
import { createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { createClient } from "jsr:@supabase/supabase-js@2";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const BREVO = Deno.env.get("BREVO_API_KEY");
const FROM = Deno.env.get("SPORT_TEST_MAIL_FROM") || "support@kids-test.com";
const APPS: Record<string, string> = { kidsney: "Kidsney", zoo: "Kidsney Zoo", chillmove: "Chill Move" };
// Ошибки ввода копятся час и между повторными кодами: перебор 6 цифр невозможен (10 попыток в час на email)
const CODE_TTL = 10 * 60000, RESEND_MS = 60000, MAX_TRIES = 10;

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });
const sha = (t: string) => createHash("sha256").update(t).digest("hex");
const emailOk = (e: string) => /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,24}$/.test(e);
const same = (a: string, b: string) => a.length === b.length && timingSafeEqual(new TextEncoder().encode(a), new TextEncoder().encode(b));

// Подписка с открытым доступом: последняя по email, оплаченный период ещё идёт
async function activeSub(email: string) {
  const { data } = await db.from("sport_test_subscriptions").select("id, status, paid_until, lang").eq("email", email)
    .gt("paid_until", new Date().toISOString()).order("paid_until", { ascending: false }).limit(1);
  return data && data[0];
}
const access = (s: Record<string, unknown> | null | undefined) => s && Date.parse(String(s.paid_until)) > Date.now()
  ? { active: true, until: Date.parse(String(s.paid_until)), status: s.status } : { active: false, until: s ? Date.parse(String(s.paid_until)) : null, status: s ? s.status : null };

async function mail(to: string, subject: string, text: string) {
  if (!BREVO) return false;
  const r = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST", headers: { "api-key": BREVO, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ sender: { email: FROM, name: "Kids strengths test" }, to: [{ email: to }], subject, textContent: text }),
  });
  if (!r.ok) console.error("brevo", r.status);
  return r.ok;
}
function codeMail(lang: string, app: string, code: string) {
  if (lang === "de") return { subject: `Ihr Anmeldecode für ${app}: ${code}`, text: `Ihr Code für die Anmeldung in ${app}: ${code}\n\nDer Code ist 10 Minuten gültig. Wenn Sie ihn nicht angefordert haben, ignorieren Sie diese E-Mail einfach.\n\nFragen: ${FROM}` };
  if (lang === "uk") return { subject: `Код для входу в ${app}: ${code}`, text: `Ваш код для входу в ${app}: ${code}\n\nКод діє 10 хвилин. Якщо ви його не запитували, просто проігноруйте цей лист.\n\nПитання: ${FROM}` };
  return { subject: `Your ${app} sign-in code: ${code}`, text: `Your code to sign in to ${app}: ${code}\n\nThe code is valid for 10 minutes. If you didn’t request it, you can ignore this email.\n\nQuestions: ${FROM}` };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ ok: true });
  try {
    const b = await req.json().catch(() => ({})) as Record<string, any>;
    const email = String(b.email || "").trim().toLowerCase();
    const app = String(b.app || "");

    if (b.action === "request") {
      if (!emailOk(email) || !APPS[app]) return json({ ok: true });
      const sub = await activeSub(email);
      if (!sub) return json({ ok: true });
      const { data: prev } = await db.from("sport_test_access_codes").select("sent_at, attempts").eq("email", email).maybeSingle();
      if (prev && Date.now() - Date.parse(prev.sent_at) < RESEND_MS) return json({ ok: true });
      const code = String(randomInt(0, 1000000)).padStart(6, "0");
      await db.from("sport_test_access_codes").upsert({ email, code_hash: sha(`${email}:${code}`), expires_at: new Date(Date.now() + CODE_TTL).toISOString(), attempts: prev && Date.now() - Date.parse(prev.sent_at) < 3600000 ? prev.attempts : 0, sent_at: new Date().toISOString() });
      const lang = ["en", "de", "uk"].includes(String(b.lang)) ? String(b.lang) : String(sub.lang || "en");
      const m = codeMail(lang, APPS[app], code);
      await mail(email, m.subject, m.text);
      return json({ ok: true });
    }

    if (b.action === "verify") {
      const code = String(b.code || "").replace(/\D/g, "");
      if (!emailOk(email) || !APPS[app] || code.length !== 6) return json({ error: "invalid" }, 401);
      const { data: row } = await db.from("sport_test_access_codes").select("*").eq("email", email).maybeSingle();
      if (!row || Date.parse(row.expires_at) < Date.now() || row.attempts >= MAX_TRIES) return json({ error: "invalid" }, 401);
      if (!same(row.code_hash, sha(`${email}:${code}`))) {
        await db.from("sport_test_access_codes").update({ attempts: row.attempts + 1 }).eq("email", email);
        return json({ error: "invalid" }, 401);
      }
      await db.from("sport_test_access_codes").delete().eq("email", email);
      const sub = await activeSub(email);
      if (!sub) return json({ error: "invalid" }, 401);
      const token = randomBytes(32).toString("base64url");
      await db.from("sport_test_app_tokens").insert({ token_hash: sha(token), sub_id: sub.id, app });
      return json({ token, access: access(sub) });
    }

    const token = String(b.token || "");
    if (!token || token.length > 100) return json({ error: "not found" }, 404);
    const { data: t } = await db.from("sport_test_app_tokens").select("sub_id").eq("token_hash", sha(token)).maybeSingle();
    if (!t) return json({ error: "not found" }, 404);

    if (b.action === "check") {
      const { data: sub } = await db.from("sport_test_subscriptions").select("id, status, paid_until").eq("id", t.sub_id).maybeSingle();
      await db.from("sport_test_app_tokens").update({ last_seen_at: new Date().toISOString() }).eq("token_hash", sha(token));
      return json({ access: access(sub) });
    }
    if (b.action === "logout") {
      await db.from("sport_test_app_tokens").delete().eq("token_hash", sha(token));
      return json({ ok: true });
    }
    return json({ error: "unknown action" }, 400);
  } catch (e) {
    console.error("access", String(e));
    return json({ error: "server" }, 500);
  }
});
