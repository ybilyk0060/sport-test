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
// Paddle: заказы оплачиваются через вебхук sport-test-paddle; отмена/возобновление — через API Paddle (ключ PADDLE_API_KEY)
const PADDLE_KEY = Deno.env.get("PADDLE_API_KEY") || "";
const PADDLE_API = (Deno.env.get("PADDLE_ENV") || "sandbox") === "production" ? "https://api.paddle.com" : "https://sandbox-api.paddle.com";
async function paddle(path: string, method: string, body?: unknown) {
  if (!PADDLE_KEY) throw new Error("no PADDLE_API_KEY");
  const r = await fetch(PADDLE_API + path, { method, headers: { authorization: `Bearer ${PADDLE_KEY}`, "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  if (!r.ok) throw new Error(`paddle ${r.status} ${(await r.text()).slice(0, 200)}`);
  return r.json();
}
const SITE_HOSTS = (Deno.env.get("SPORT_TEST_RETURN_HOSTS") || "kids-test.com,www.kids-test.com,ybilyk0060.github.io,localhost,127.0.0.1").split(",");
const BREVO = Deno.env.get("BREVO_API_KEY");
const FROM = Deno.env.get("SPORT_TEST_MAIL_FROM") || "support@kids-test.com";
const PERIOD_DAYS = 30;
const CRON_SECRET = Deno.env.get("SPORT_TEST_CRON_SECRET");
// Приложения в подписке (как CONFIG.appAccess на сайте): 'off' | 'soon' | 'live'. До релиза — 'soon'.
const APP_ACCESS = Deno.env.get("SPORT_TEST_APP_ACCESS") || "soon";

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
  if (!r.ok) { lastMailError = `${r.status} ${(await r.text()).slice(0, 200)}`; console.error("brevo", lastMailError); }
  return r.ok;
}
let lastMailError = "";

// Цена и дата так, как их пишут носители: $14.99 / 14,99 € / 629 грн; «December 26, 2026» / «26. Dezember 2026»
const LOC: Record<string, string> = { en: "en-US", de: "de-DE", uk: "uk-UA" };
const money = (n: number, cur: string, lang = "en") => new Intl.NumberFormat(LOC[lang] || "en-US", { style: "currency", currency: cur || "USD", minimumFractionDigits: Number.isInteger(n) ? 0 : 2 }).format(n);
const fmtDate = (d: unknown, lang = "en") => new Intl.DateTimeFormat(LOC[lang] || "en-US", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(String(d)));
// Строка про приложения в письмах
function appsLine(lang: string) {
  if (APP_ACCESS === "live") return lang === "uk" ? "\n\nУ підписку входить преміум у Kidsney, Kidsney Zoo і Chill Move. Встановіть застосунок і увійдіть з цим email."
    : lang === "de" ? "\n\nIhr Abo enthält Premium in Kidsney, Kidsney Zoo und Chill Move. Installieren Sie die App und melden Sie sich mit dieser E-Mail-Adresse an."
    : "\n\nYour subscription includes premium in Kidsney, Kidsney Zoo and Chill Move. Install the app and sign in with this email.";
  if (APP_ACCESS === "soon") return lang === "uk" ? "\n\nСкоро: преміум у наших застосунках Kidsney, Kidsney Zoo і Chill Move стане частиною вашої підписки, нічого докуповувати не доведеться. Ми напишемо, щойно все буде готово."
    : lang === "de" ? "\n\nBald: Premium in unseren Apps Kidsney, Kidsney Zoo und Chill Move wird ohne Aufpreis Teil Ihres Abos. Wir geben Bescheid, sobald es so weit ist."
    : "\n\nComing soon: premium in our apps Kidsney, Kidsney Zoo and Chill Move will become part of your subscription at no extra cost. We’ll let you know as soon as it’s ready.";
  return "";
}
// Цепочка после оплаты: день 3, день 7, затем раз в 30 дней приглашение на повторный тест
function nurtureMail(kind: "d3" | "d7" | "retest", lang: string, link: string) {
  const L = lang === "uk" || lang === "de" ? lang : "en";
  const M = {
    en: {
      d3: { subject: "How are the first workouts going?", text: `Three days with the program. If you haven’t started yet, today is a good day: a workout takes 7–10 minutes, and the camera counts the reps.\n\nOpen the next workout:\n${link}` },
      d7: { subject: "Week 1 is behind you", text: `Even two or three short workouts a week add up. In a month, the repeat test will show what has changed.\n\nNext workout:\n${link}${appsLine("en")}` },
      retest: { subject: "Time for the repeat test: let’s compare", text: `A month has passed since the last test. Take it again (3 minutes), and we’ll show what has changed in balance, speed, flexibility and coordination.\n\nTake the repeat test:\n${link}` },
    },
    de: {
      d3: { subject: "Wie laufen die ersten Trainings?", text: `Drei Tage mit dem Programm. Falls Sie noch nicht angefangen haben: Heute ist ein guter Tag. Ein Training dauert 7–10 Minuten, die Kamera zählt die Wiederholungen.\n\nZum nächsten Training:\n${link}` },
      d7: { subject: "Die erste Woche ist geschafft", text: `Schon zwei, drei kurze Trainings pro Woche machen einen Unterschied. In einem Monat zeigt der Wiederholungstest, was sich verändert hat.\n\nZum nächsten Training:\n${link}${appsLine("de")}` },
      retest: { subject: "Zeit für den Wiederholungstest", text: `Seit dem letzten Test ist ein Monat vergangen. Machen Sie ihn noch einmal (3 Minuten) – wir zeigen Ihnen, was sich bei Gleichgewicht, Schnelligkeit, Beweglichkeit und Koordination getan hat.\n\nZum Wiederholungstest:\n${link}` },
    },
    uk: {
      d3: { subject: "Як минають перші тренування?", text: `Три дні з програмою. Якщо ще не почали, сьогодні гарний день: тренування триває 7–10 хвилин, камера сама рахує повтори.\n\nНаступне тренування:\n${link}` },
      d7: { subject: "Перший тиждень позаду", text: `Навіть два-три короткі тренування на тиждень дають результат. За місяць повторний тест покаже, що змінилося.\n\nНаступне тренування:\n${link}${appsLine("uk")}` },
      retest: { subject: "Час для повторного тесту", text: `Від останнього тесту минув місяць. Пройдіть його ще раз (3 хвилини), і ми покажемо, що змінилося в рівновазі, швидкості, гнучкості й координації.\n\nПройти повторний тест:\n${link}` },
    },
  } as const;
  const m = M[L][kind];
  return { subject: m.subject, text: `${m.text}\n\n${L === "de" ? "Fragen" : L === "uk" ? "Питання" : "Questions"}: ${FROM}` };
}
function termsMail(lang: string, s: Record<string, unknown>, link: string) {
  const first = money(Number(s.first_amount), String(s.currency), lang), regular = money(Number(s.regular_amount), String(s.currency), lang);
  const until = fmtDate(s.paid_until, lang);
  if (lang === "uk") return { subject: "Підписку оформлено — тест сильних сторін дитини", text: `Дякуємо! Підписку оформлено.\n\nПерший платіж: ${first} за ${PERIOD_DAYS} днів.\nДалі: ${regular} кожні ${PERIOD_DAYS} днів, перше продовження ${until}, доки ви не скасуєте.\n\nВідкрити програму й керувати підпискою (скасування в 2 дотики) з будь-якого пристрою:\n${link}${appsLine("uk")}\n\nПитання: ${FROM}` };
  if (lang === "de") return { subject: "Abo abgeschlossen — Stärkentest für Kinder", text: `Danke! Ihr Abo ist aktiv.\n\nErste Zahlung: ${first} für ${PERIOD_DAYS} Tage.\nDanach ${regular} alle ${PERIOD_DAYS} Tage, erstmals am ${until}, bis Sie kündigen.\n\nProgramm öffnen und Abo verwalten (Kündigung mit zwei Klicks) – auf jedem Gerät:\n${link}${appsLine("de")}\n\nFragen: ${FROM}` };
  return { subject: "You’re subscribed — kids’ strengths test", text: `Thank you! Your subscription is active.\n\nFirst payment: ${first} for ${PERIOD_DAYS} days.\nThen ${regular} every ${PERIOD_DAYS} days, starting ${until}, until you cancel.\n\nOpen your child’s program and manage your subscription (cancel in two taps) on any device:\n${link}${appsLine("en")}\n\nQuestions: ${FROM}` };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ ok: true, mode: MODE });
  try {
    const b = await req.json().catch(() => ({})) as Record<string, any>;

    // Оплачен ли заказ (ждём вебхук Paddle после окна оплаты). Отвечает только да/нет.
    if (b.action === "order") {
      const { data: o } = await db.from("sport_test_orders").select("status").eq("order_ref", String(b.orderRef || "")).maybeSingle();
      return json({ paid: !!o && o.status === "paid" });
    }

    if (b.action === "activate") {
      const email = String(b.email || "").trim().toLowerCase();
      const orderRef = String(b.orderRef || "");
      if (!emailOk(email) || !/^st-[A-Za-z0-9_-]{4,76}$/.test(orderRef)) return json({ error: "bad input" }, 400);
      const { data: order } = await db.from("sport_test_orders").select("status, amount, currency, provider, provider_sub, mode").eq("order_ref", orderRef).maybeSingle();
      let subMode = MODE;
      if (order && order.provider === "paddle") {
        if (order.status !== "paid") return json({ error: "order not paid" }, 402);
        subMode = order.mode === "production" ? "live" : "sandbox";
      } else if (MODE === "live") {
        if (!order || order.status !== "paid") return json({ error: "order not paid" }, 402);
      } else if (!b.test) return json({ error: "test mode only" }, 400);
      const { data: existing } = await db.from("sport_test_subscriptions").select("*").eq("order_ref", orderRef).maybeSingle();
      let sub = existing;
      if (!sub) {
        const now = Date.now();
        const { data, error } = await db.from("sport_test_subscriptions").insert({
          order_ref: orderRef, email, mode: subMode, currency: String(b.currency || "USD").slice(0, 3), provider_sub: order?.provider_sub || null,
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
      let mailed: boolean | null = null;
      if (site && !existing) { const m = termsMail(String(b.lang || "en"), sub, `${site}?sub=${token}`); mailed = await mail(email, m.subject, m.text); }
      return json({ token, sub: view(sub), mailed, mailError: mailed === false ? (BREVO ? lastMailError : "no BREVO_API_KEY") : undefined, from: FROM });
    }

    if (b.action === "remind") {
      const got = req.headers.get("x-cron-secret") || "";
      let want = CRON_SECRET || "";
      if (!want) { const { data } = await db.from("sport_test_settings").select("value").eq("key", "cron_secret").maybeSingle(); want = String(data?.value || ""); }
      if (!want || got.length < 32 || got !== want) return json({ error: "forbidden" }, 403);
      const soon = new Date(Date.now() + 3 * 86400000).toISOString();
      const { data: subs } = await db.from("sport_test_subscriptions").select("*").eq("status", "active").lte("paid_until", soon).gt("paid_until", new Date().toISOString()).limit(200);
      let sent = 0;
      for (const s of subs || []) {
        if (s.reminded_for === s.paid_until || !s.site) continue;
        const token = await issueToken(s.id);
        const link = `${s.site}?sub=${token}`;
        const price = money(Number(s.regular_amount), String(s.currency), String(s.lang));
        const date = fmtDate(s.paid_until, String(s.lang));
        const m = s.lang === "uk"
          ? { subject: `Через 3 дні продовження підписки: ${price}`, text: `${date} підписка продовжиться за ${price} на наступні ${PERIOD_DAYS} днів.\n\nЯкщо не хочете продовжувати — скасуйте в один дотик:\n${link}\n\nПитання: ${FROM}` }
          : s.lang === "de"
          ? { subject: `In 3 Tagen verlängert sich Ihr Abo: ${price}`, text: `Am ${date} verlängert sich Ihr Abo für ${price} um weitere ${PERIOD_DAYS} Tage.\n\nWenn Sie nicht verlängern möchten, kündigen Sie mit einem Klick:\n${link}\n\nFragen: ${FROM}` }
          : { subject: `Your subscription renews in 3 days: ${price}`, text: `On ${date} your subscription renews for ${price} for another ${PERIOD_DAYS} days.\n\nIf you don't want to continue, cancel in one tap:\n${link}\n\nQuestions: ${FROM}` };
        if (await mail(s.email, m.subject, m.text)) { await db.from("sport_test_subscriptions").update({ reminded_for: s.paid_until }).eq("id", s.id); sent++; }
      }
      // Цепочка: день 3 и 7 (onboard_step 1, 2), повторный тест раз в 30 дней. Пропущенные шаги не досылаем: только самый свежий.
      const now = Date.now();
      const { data: act } = await db.from("sport_test_subscriptions").select("*").eq("status", "active").gt("paid_until", new Date(now).toISOString())
        .lte("started_at", new Date(now - 3 * 86400000).toISOString()).not("site", "is", null).limit(500);
      let nurtured = 0;
      for (const s of act || []) {
        const age = (now - Date.parse(String(s.started_at))) / 86400000;
        const step = Number(s.onboard_step || 0);
        const due = age >= 7 ? 2 : age >= 3 ? 1 : 0;
        const retestDue = age >= 28 && (!s.retest_mailed_at || now - Date.parse(String(s.retest_mailed_at)) >= 28 * 86400000);
        const kind = retestDue ? "retest" : due > step && age < 10 ? (due === 2 ? "d7" : "d3") : null;
        if (!kind) { if (due > step) await db.from("sport_test_subscriptions").update({ onboard_step: due }).eq("id", s.id); continue; }
        const token = await issueToken(s.id);
        const m = nurtureMail(kind, String(s.lang), `${s.site}?sub=${token}`);
        if (await mail(s.email, m.subject, m.text)) {
          await db.from("sport_test_subscriptions").update(kind === "retest" ? { retest_mailed_at: new Date(now).toISOString(), onboard_step: Math.max(step, due) } : { onboard_step: due }).eq("id", s.id);
          nurtured++;
        }
      }
      return json({ ok: true, sent, nurtured });
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
      // Подписка Paddle: отмена с конца оплаченного периода / снятие запланированной отмены — у Paddle, иначе списания продолжатся
      if (!sub.provider_sub && sub.order_ref) { const { data: o } = await db.from("sport_test_orders").select("provider_sub").eq("order_ref", sub.order_ref).maybeSingle(); if (o?.provider_sub) sub.provider_sub = o.provider_sub; }
      if (sub.provider_sub) {
        try {
          if (b.action === "cancel") await paddle(`/subscriptions/${sub.provider_sub}/cancel`, "POST", { effective_from: "next_billing_period" });
          else await paddle(`/subscriptions/${sub.provider_sub}`, "PATCH", { scheduled_change: null });
        } catch (e) { console.error("paddle", String(e)); return json({ error: "provider" }, 502); }
      }
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
