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
// POST {action:'sendlink', email, s, lang, returnTo} -> {ok:true} (письмо «продолжить тест», когда ребёнок рядом; лимиты)
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
const SITE_HOSTS = (Deno.env.get("SPORT_TEST_RETURN_HOSTS") || "kids-test.com,www.kids-test.com,ybilyk0060.github.io,localhost,127.0.0.1").split(",").concat(["kids-mind.com", "www.kids-mind.com"]);
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

// Отмена (с конца оплаченного периода) и снятие отмены. Подписка Paddle меняется у Paddle, иначе списания продолжатся.
async function changeSub(sub: Record<string, any>, action: "cancel" | "resume"): Promise<{ ok: boolean; data?: Record<string, any> }> {
  const patch = action === "cancel" ? { status: "cancelled", cancelled_at: new Date().toISOString() } : { status: "active", cancelled_at: null };
  if (!sub.provider_sub && sub.order_ref) {
    const { data: o } = await db.from("sport_test_orders").select("provider, provider_sub, provider_txn").eq("order_ref", sub.order_ref).maybeSingle();
    if (o?.provider_sub) sub.provider_sub = o.provider_sub;
    // Прогон 26.11: вебхук не записал id подписки Paddle (заказ стал «paid» раньше, чем пришёл id) — берём его из транзакции
    else if (o?.provider === "paddle" && o.provider_txn) {
      try { const t = await paddle(`/transactions/${o.provider_txn}`, "GET"); if (t?.data?.subscription_id) sub.provider_sub = t.data.subscription_id; } catch (e) { console.error("paddle txn", String(e)); }
    }
    if (sub.provider_sub) { await db.from("sport_test_subscriptions").update({ provider_sub: sub.provider_sub }).eq("id", sub.id); await db.from("sport_test_orders").update({ provider_sub: sub.provider_sub }).eq("order_ref", sub.order_ref); }
    else if (o?.provider === "paddle") return { ok: false }; // не отменяем «на словах», пока у Paddle идут списания
  }
  if (sub.provider_sub) {
    try {
      if (action === "cancel") await paddle(`/subscriptions/${sub.provider_sub}/cancel`, "POST", { effective_from: "next_billing_period" });
      else await paddle(`/subscriptions/${sub.provider_sub}`, "PATCH", { scheduled_change: null });
    } catch (e) { console.error("paddle", String(e)); return { ok: false }; }
  }
  const { data } = await db.from("sport_test_subscriptions").update(patch).eq("id", sub.id).select("*").single();
  return { ok: true, data };
}
const senderFor = (s: Record<string, any>) => (isMind(s) ? ({ de: "Welcher Denktyp ist Ihr Kind?", fr: "Quel est le style de pensée de votre enfant ?" } as Record<string, string>)[String(s.lang)] || "What kind of thinker is your child?" : undefined);
function cancelMail(lang: string, s: Record<string, any>, link: string) {
  const L = ["de", "fr", "uk"].includes(lang) ? lang : "en";
  const until = fmtDate(s.paid_until, L);
  const M: Record<string, { subject: string; text: string }> = {
    en: { subject: "Your subscription is cancelled", text: `We have received your cancellation. Your subscription ends on ${until}. There will be no further charges, and access stays open until that date.\n\nChanged your mind? You can resume here:\n${link}` },
    de: { subject: "Kündigungsbestätigung", text: `Wir bestätigen den Eingang Ihrer Kündigung. Ihr Abo endet am ${until}. Es erfolgen keine weiteren Abbuchungen, der Zugang bleibt bis zu diesem Datum bestehen.\n\nDoch weitermachen? Hier können Sie das Abo fortsetzen:\n${link}` },
    fr: { subject: "Confirmation de résiliation", text: `Nous confirmons la réception de votre résiliation. Votre abonnement prend fin le ${until}. Aucun autre paiement ne sera prélevé et l’accès reste ouvert jusqu’à cette date.\n\nVous changez d’avis\u00a0? Vous pouvez reprendre l’abonnement ici\u00a0:\n${link}` },
    uk: { subject: "Підписку скасовано", text: `Ми отримали ваше скасування. Підписка діє до ${until}. Нових списань не буде, доступ зберігається до цієї дати.\n\nПередумали? Відновити можна тут:\n${link}` },
  };
  return { subject: M[L].subject, text: `${M[L].text}\n\n${FROM}` };
}

async function mail(to: string, subject: string, text: string, name = "Kids strengths test") {
  if (!BREVO) return false;
  const r = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST", headers: { "api-key": BREVO, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ sender: { email: FROM, name }, to: [{ email: to }], subject, textContent: text }),
  });
  if (!r.ok) { lastMailError = `${r.status} ${(await r.text()).slice(0, 200)}`; console.error("brevo", lastMailError); }
  return r.ok;
}
let lastMailError = "";

// Цена и дата так, как их пишут носители: $14.99 / 14,99 € / 629 грн; «December 26, 2026» / «26. Dezember 2026»
const LOC: Record<string, string> = { en: "en-US", de: "de-DE", uk: "uk-UA", fr: "fr-FR" };
const money = (n: number, cur: string, lang = "en") => new Intl.NumberFormat(LOC[lang] || "en-US", { style: "currency", currency: cur || "USD", minimumFractionDigits: Number.isInteger(n) ? 0 : 2 }).format(n);
const fmtDate = (d: unknown, lang = "en") => new Intl.DateTimeFormat(LOC[lang] || "en-US", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(String(d)));
// Строка про приложения в письмах
function appsLine(lang: string) {
  if (APP_ACCESS === "live") return lang === "uk" ? "\n\nУ підписку входить преміум у Kidsney, Kidsney Zoo і Chill Move. Встановіть застосунок і увійдіть з цим email."
    : lang === "de" ? "\n\nIhr Abo enthält Premium in Kidsney, Kidsney Zoo und Chill Move. Installieren Sie die App und melden Sie sich mit dieser E-Mail-Adresse an."
    : "\n\nYour subscription includes premium in Kidsney, Kidsney Zoo and Chill Move. Install the app and sign in with this email.";
  if (APP_ACCESS === "soon") return lang === "uk" ? "\n\nСкоро: преміум у наших застосунках Kidsney, Kidsney Zoo і Chill Move стане частиною вашої підписки, нічого докуповувати не доведеться. Ми напишемо, щойно все буде готово."
    : lang === "fr" ? "\n\nBientôt : le premium de nos applications Kidsney, Kidsney Zoo et Chill Move fera partie de votre abonnement, sans supplément. Nous vous préviendrons dès que ce sera prêt."
    : lang === "de" ? "\n\nBald: Premium in unseren Apps Kidsney, Kidsney Zoo und Chill Move wird ohne Aufpreis Teil Ihres Abos. Wir geben Bescheid, sobald es so weit ist."
    : "\n\nComing soon: premium in our apps Kidsney, Kidsney Zoo and Chill Move will become part of your subscription at no extra cost. We’ll let you know as soon as it’s ready.";
  return "";
}
// Цепочка после оплаты: день 3, день 7, затем раз в 30 дней приглашение на повторный тест
// Тест «Как думает ваш ребёнок» (страница /mind): подписка та же, письма свои (en, de, fr). Признак — quiz.product === "mind".
const isMind = (s: Record<string, any>) => !!(s && s.quiz && s.quiz.product === "mind");
function mindMail(kind: "terms" | "d3" | "d7" | "retest", lang: string, s: Record<string, unknown>, link: string) {
  const L = lang === "de" || lang === "fr" ? lang : "en";
  const first = money(Number(s.first_amount), String(s.currency), L), regular = money(Number(s.regular_amount), String(s.currency), L);
  const until = fmtDate(s.paid_until, L);
  const M = {
    en: {
      terms: { subject: "You’re subscribed: “What kind of thinker is your child?”", text: `Thank you! Your subscription is active.\n\nFirst payment: ${first} for ${PERIOD_DAYS} days.\nThen ${regular} every ${PERIOD_DAYS} days, starting ${until}, until you cancel.\n\nOpen the full report, today’s activity and your subscription settings (cancel in two taps) on any device:\n${link}${appsLine("en")}` },
      d3: { subject: "Today’s 10 minutes together", text: `Three days in. Each day there is one short activity picked for your child’s thinking style: 5 to 10 minutes together, no screen, with things you already have at home.\n\nOpen today’s activity:\n${link}` },
      d7: { subject: "One week in: what did you notice?", text: `A week of short activities is enough to see what pulls your child in and what doesn’t. The report has phrases that build confidence: try one today.\n\nOpen the report and today’s activity:\n${link}${appsLine("en")}` },
      retest: { subject: "A month has passed: take the test again", text: `Children change fast. Open the report, tap “Take the test again” at the bottom (3 minutes) and get a fresh report for your child today.\n\nOpen:\n${link}` },
      q: "Questions",
    },
    de: {
      terms: { subject: "Abo abgeschlossen: „Welcher Denktyp ist Ihr Kind?“", text: `Danke! Ihr Abo ist aktiv.\n\nErste Zahlung: ${first} für ${PERIOD_DAYS} Tage.\nDanach ${regular} alle ${PERIOD_DAYS} Tage, erstmals am ${until}, bis Sie kündigen.\n\nBericht, Spielidee des Tages und „Mein Abo“ (Kündigung mit zwei Klicks) auf jedem Gerät öffnen:\n${link}${appsLine("de")}` },
      d3: { subject: "Ihre 10 Minuten für heute", text: `Drei Tage sind vorbei. Jeden Tag gibt es eine kurze Spielidee passend zum Denkstil Ihres Kindes: 5 bis 10 Minuten gemeinsam, ohne Bildschirm, mit Dingen, die Sie zu Hause haben.\n\nIdee für heute öffnen:\n${link}` },
      d7: { subject: "Eine Woche ist geschafft: Was ist Ihnen aufgefallen?", text: `Eine Woche mit kurzen Spielideen reicht, um zu sehen, was Ihr Kind fesselt und was nicht. Im Bericht stehen Sätze, die Selbstvertrauen stärken: Probieren Sie heute einen aus.\n\nBericht und Idee für heute öffnen:\n${link}${appsLine("de")}` },
      retest: { subject: "Ein Monat ist vorbei: Machen Sie den Test noch einmal", text: `Kinder verändern sich schnell. Öffnen Sie den Bericht, tippen Sie unten auf „Test noch einmal machen“ (3 Minuten) und erhalten Sie einen aktuellen Bericht.\n\nÖffnen:\n${link}` },
      q: "Fragen",
    },
    fr: {
      terms: { subject: "Abonnement confirmé : « Quel est le style de pensée de votre enfant ? »", text: `Merci ! Votre abonnement est actif.\n\nPremier paiement : ${first} pour ${PERIOD_DAYS} jours.\nEnsuite ${regular} tous les ${PERIOD_DAYS} jours, à partir du ${until}, jusqu’à la résiliation.\n\nOuvrez le rapport complet, l’activité du jour et la gestion de l’abonnement (résiliation en deux clics) sur n’importe quel appareil :\n${link}${appsLine("fr")}` },
      d3: { subject: "Les 10 minutes d’aujourd’hui", text: `Trois jours déjà. Chaque jour, une courte activité est choisie selon le style de pensée de votre enfant : 5 à 10 minutes ensemble, sans écran, avec ce que vous avez à la maison.\n\nOuvrir l’activité du jour :\n${link}` },
      d7: { subject: "Une semaine déjà : qu’avez-vous remarqué ?", text: `Une semaine de courtes activités suffit pour voir ce qui passionne votre enfant et ce qui l’ennuie. Le rapport propose des phrases qui donnent confiance : essayez-en une aujourd’hui.\n\nOuvrir le rapport et l’activité du jour :\n${link}` },
      retest: { subject: "Un mois a passé : refaites le test", text: `Les enfants changent vite. Ouvrez le rapport, touchez « Refaire le test » en bas (3 minutes) et obtenez un rapport à jour.\n\nOuvrir :\n${link}` },
      q: "Questions",
    },
  } as const;
  const nb = (t: string) => (L === "fr" ? t.replace(/« /g, "«\u00a0").replace(/ »/g, "\u00a0»").replace(/ ([:;?!])/g, "\u00a0$1") : t);
  const m = M[L][kind];
  // Покупателю из ЕС/UK у кнопки оплаты показана строка о немедленном доступе: письмо-подтверждение её повторяет
  const W = { en: "\n\nBy subscribing you asked for access to start immediately. Once the full report has opened, the first payment is non-refundable and the 14-day right of withdrawal ends.", de: "\n\nMit dem Abschluss haben Sie ausdrücklich verlangt, dass der Zugang sofort beginnt. Sobald der vollständige Bericht geöffnet ist, erlischt Ihr Widerrufsrecht und die erste Zahlung wird nicht erstattet.", fr: "\n\nEn vous abonnant, vous avez demandé l’accès immédiat au contenu. Dès l’ouverture du rapport complet, vous renoncez à votre droit de rétractation de 14 jours et le premier paiement n’est pas remboursé." };
  const waiver = kind === "terms" && (s.quiz as any)?.waiver ? W[L] : "";
  return { subject: nb(m.subject), text: `${nb(m.text + waiver)}\n\n${M[L].q}${L === "fr" ? "\u00a0" : ""}: ${FROM}` };
}
function nurtureMail(kind: "d3" | "d7" | "retest", lang: string, link: string) {
  const L = lang === "uk" || lang === "de" ? lang : "en";
  const M = {
    en: {
      d3: { subject: "How are the first workouts going?", text: `Three days with the program. If you haven’t started yet, today is a good day: a workout takes 7–10 minutes, and the camera counts the reps.\n\nOpen the next workout:\n${link}` },
      d7: { subject: "Week 1 is behind you", text: `Even two or three short workouts a week add up. In a month, the repeat test will show what has changed.\n\nNext workout:\n${link}${appsLine("en")}` },
      retest: { subject: "Time for the repeat test: let’s compare", text: `A month has passed since the last test. Take it again (3 minutes), and we’ll show what has changed in balance, speed, leg strength and coordination.\n\nTake the repeat test:\n${link}` },
    },
    de: {
      d3: { subject: "Wie laufen die ersten Trainings?", text: `Drei Tage mit dem Programm. Falls Sie noch nicht angefangen haben: Heute ist ein guter Tag. Ein Training dauert 7–10 Minuten, die Kamera zählt die Wiederholungen.\n\nZum nächsten Training:\n${link}` },
      d7: { subject: "Die erste Woche ist geschafft", text: `Schon zwei, drei kurze Trainings pro Woche machen einen Unterschied. In einem Monat zeigt der Wiederholungstest, was sich verändert hat.\n\nZum nächsten Training:\n${link}${appsLine("de")}` },
      retest: { subject: "Zeit für den Wiederholungstest", text: `Seit dem letzten Test ist ein Monat vergangen. Machen Sie ihn noch einmal (3 Minuten) – wir zeigen Ihnen, was sich bei Gleichgewicht, Schnelligkeit, Beinkraft und Koordination getan hat.\n\nZum Wiederholungstest:\n${link}` },
    },
    uk: {
      d3: { subject: "Як минають перші тренування?", text: `Три дні з програмою. Якщо ще не почали, сьогодні гарний день: тренування триває 7–10 хвилин, камера сама рахує повтори.\n\nНаступне тренування:\n${link}` },
      d7: { subject: "Перший тиждень позаду", text: `Навіть два-три короткі тренування на тиждень дають результат. За місяць повторний тест покаже, що змінилося.\n\nНаступне тренування:\n${link}${appsLine("uk")}` },
      retest: { subject: "Час для повторного тесту", text: `Від останнього тесту минув місяць. Пройдіть його ще раз (3 хвилини), і ми покажемо, що змінилося в рівновазі, швидкості, силі ніг і координації.\n\nПройти повторний тест:\n${link}` },
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
      let { data: existing } = await db.from("sport_test_subscriptions").select("*").eq("order_ref", orderRef).maybeSingle();
      // Заказ уже активирован: токен получает только тот же email (иначе по номеру заказа можно было бы управлять чужой подпиской)
      if (existing && String(existing.email || "").toLowerCase() !== email) return json({ error: "forbidden" }, 403);
      let sub = existing;
      if (!sub) {
        const now = Date.now();
        const { data, error } = await db.from("sport_test_subscriptions").insert({
          order_ref: orderRef, email, mode: subMode, currency: String(b.currency || "USD").slice(0, 3), provider_sub: order?.provider_sub || null,
          first_amount: Number(b.first) || 0, regular_amount: Number(b.regular) || 0, period_days: PERIOD_DAYS,
          started_at: new Date(now).toISOString(), paid_until: new Date(now + PERIOD_DAYS * 86400000).toISOString(),
          quiz: clip(b.quiz), results: clip(b.results), lang: ["en", "de", "uk", "fr"].includes(String(b.lang)) ? String(b.lang) : "en",
          site: safeSite(String(b.returnTo || "")),
        }).select("*").single();
        if (error) {
          // Строку уже создал вебхук оплаты (или параллельный запрос): берём её, если email тот же
          const { data: again } = await db.from("sport_test_subscriptions").select("*").eq("order_ref", orderRef).maybeSingle();
          if (!again) return json({ error: error.message }, 500);
          if (String(again.email || "").toLowerCase() !== email) return json({ error: "forbidden" }, 403);
          sub = again; existing = again;
        } else sub = data;
      }
      // Подписку создал сервер по оплате, без ответов анкеты: браузер дописывает их при первом заходе
      if (existing && !(existing.quiz && existing.quiz.answers) && !existing.results && b.quiz && b.results) {
        const { data: upd } = await db.from("sport_test_subscriptions").update({ quiz: clip(b.quiz), results: clip(b.results) }).eq("id", existing.id).select("*").single();
        if (upd) sub = upd;
      }
      const token = await issueToken(sub.id);
      const site = safeSite(String(b.returnTo || ""));
      let mailed: boolean | null = null;
      if (site && !existing) { const m = isMind(sub) ? mindMail("terms", String(sub.lang || "en"), sub, `${site}?sub=${token}`) : termsMail(String(b.lang || "en"), sub, `${site}?sub=${token}`); mailed = await mail(email, m.subject, m.text, senderFor(sub)); }
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
          : s.lang === "fr"
          ? { subject: `Votre abonnement se renouvelle dans 3 jours\u00a0: ${price}`, text: `Le ${date}, votre abonnement se renouvelle pour ${price} pour ${PERIOD_DAYS} jours de plus.\n\nSi vous ne souhaitez pas continuer, ouvrez le lien et résiliez dans «\u00a0Mon abonnement\u00a0»\u00a0:\n${link}\n\nQuestions\u00a0: ${FROM}` }
          : s.lang === "de"
          ? { subject: `In 3 Tagen verlängert sich Ihr Abo: ${price}`, text: `Am ${date} verlängert sich Ihr Abo für ${price} um weitere ${PERIOD_DAYS} Tage.\n\nWenn Sie nicht verlängern möchten, öffnen Sie den Link und kündigen Sie unter „Mein Abo“:\n${link}\n\nFragen: ${FROM}` }
          : { subject: `Your subscription renews in 3 days: ${price}`, text: `On ${date} your subscription renews for ${price} for another ${PERIOD_DAYS} days.\n\nIf you don't want to continue, open the link and cancel in “My subscription”:\n${link}\n\nQuestions: ${FROM}` };
        if (await mail(s.email, m.subject, m.text, senderFor(s))) { await db.from("sport_test_subscriptions").update({ reminded_for: s.paid_until }).eq("id", s.id); sent++; }
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
        const m = isMind(s) ? mindMail(kind, String(s.lang), s, `${s.site}?sub=${token}`) : nurtureMail(kind, String(s.lang), `${s.site}?sub=${token}`);
        if (await mail(s.email, m.subject, m.text, senderFor(s))) {
          await db.from("sport_test_subscriptions").update(kind === "retest" ? { retest_mailed_at: new Date(now).toISOString(), onboard_step: Math.max(step, due) } : { onboard_step: due }).eq("id", s.id);
          nurtured++;
        }
      }
      return json({ ok: true, sent, nurtured });
    }

    // «Ребёнка нет рядом»: письмо со ссылкой продолжить тест (ответы анкеты в ссылке). Не больше 3 писем на адрес за сутки
    // и 300 в час на всех; адрес не храним (только sha256 для счёта). Ответ одинаковый — по нему нельзя ничего узнать.
    if (b.action === "sendlink") {
      const email = String(b.email || "").trim().toLowerCase();
      const site = safeSite(String(b.returnTo || ""));
      const s = String(b.s || "");
      if (!emailOk(email) || !site || !/^[A-Za-z0-9_-]{10,3000}$/.test(s)) return json({ ok: false }, 400);
      const eh = hash("link:" + email);
      const day = new Date(Date.now() - 86400000).toISOString(), hour = new Date(Date.now() - 3600000).toISOString();
      const { count: mine } = await db.from("sport_test_link_requests").select("id", { count: "exact", head: true }).eq("email_hash", eh).gte("created_at", day);
      const { count: all } = await db.from("sport_test_link_requests").select("id", { count: "exact", head: true }).gte("created_at", hour);
      if ((mine ?? 0) >= 3 || (all ?? 0) >= 300) return json({ ok: true });
      await db.from("sport_test_link_requests").insert({ email_hash: eh });
      await db.from("sport_test_link_requests").delete().lt("created_at", new Date(Date.now() - 30 * 86400000).toISOString()); // храним не больше 30 дней (privacy-en)
      const lang = ["en", "de", "uk"].includes(String(b.lang)) ? String(b.lang) : "en";
      const link = `${site}?s=${s}&lang=${lang}`;
      const M = {
        en: { subject: "Your link to the kids sports test", text: `Here is your link to continue the test when your child is nearby. Your answers are saved:\n${link}\n\nYou'll need about 6×6 ft (2×2 m) of space and the phone 2–3 steps away. The exercises take about 3 minutes. Video stays on your phone.\n\nkids-test.com` },
        de: { subject: "Ihr Link zum Sporttest für Kinder", text: `Hier ist Ihr Link, um den Test fortzusetzen, wenn Ihr Kind in der Nähe ist. Ihre Antworten sind gespeichert:\n${link}\n\nSie brauchen etwa 2 × 2 m Platz, das Handy steht 2–3 Schritte entfernt. Die Übungen dauern etwa 3 Minuten. Das Video bleibt auf Ihrem Handy.\n\nkids-test.com` },
        uk: { subject: "Ваше посилання на спортивний тест для дитини", text: `Ось посилання, щоб продовжити тест, коли дитина буде поруч. Ваші відповіді збережено:\n${link}\n\nПотрібно близько 2×2 м вільного місця, телефон за 2–3 кроки. Вправи займуть близько 3 хвилин. Відео залишається на телефоні.\n\nkids-test.com` },
      }[lang]!;
      await mail(email, M.subject, M.text);
      return json({ ok: true });
    }

    if (b.action === "restore") {
      const email = String(b.email || "").trim().toLowerCase();
      const site = safeSite(String(b.returnTo || ""));
      if (!emailOk(email) || !site) return json({ ok: true });
      const { data: subs } = await db.from("sport_test_subscriptions").select("*").eq("email", email).order("paid_until", { ascending: false }).limit(1);
      const sub = subs && subs[0];
      if (sub && (!sub.last_restore_at || Date.now() - Date.parse(sub.last_restore_at) > 60000)) {
        const token = await issueToken(sub.id);
        await db.from("sport_test_subscriptions").update({ last_restore_at: new Date().toISOString() }).eq("id", sub.id);
        const lang = String(b.lang || "en");
        const link = `${site}?sub=${token}`;
        const subject = lang === "uk" ? "Доступ до підписки" : lang === "de" ? "Zugang zu Ihrem Abo" : lang === "fr" ? "Accès à votre abonnement" : "Access to your subscription";
        const text = lang === "uk" ? `Відкрийте програму на цьому пристрої:\n${link}` : lang === "de" ? `${isMind(sub) ? "Öffnen Sie Ihren Bericht" : "Öffnen Sie das Programm"} auf diesem Gerät:\n${link}` : lang === "fr" ? `Ouvrez votre accès sur cet appareil\u00a0:\n${link}` : `${isMind(sub) ? "Open your report" : "Open the program"} on this device:\n${link}`;
        await mail(email, subject, text, senderFor(sub));
      }
      return json({ ok: true }); // одинаковый ответ — по email нельзя узнать, есть ли подписка
    }

    if (b.action === "cancelreq") {
      const email = String(b.email || "").trim().toLowerCase();
      if (!emailOk(email)) return json({ ok: true });
      const { data: subs } = await db.from("sport_test_subscriptions").select("*").eq("email", email).eq("status", "active").order("created_at", { ascending: false }).limit(5);
      for (const s0 of subs || []) {
        const r = await changeSub(s0, "cancel");
        if (!r.ok) { console.error("cancelreq provider", s0.id); await mail(FROM, "Cancellation needs manual handling", `Subscription ${s0.id}: the payment provider did not confirm the cancellation requested by email form.`); continue; }
        const site = s0.site || safeSite(String(b.returnTo || ""));
        const m = cancelMail(String(s0.lang || b.lang || "en"), r.data!, site ? `${site}?sub=${await issueToken(s0.id)}` : "");
        await mail(email, m.subject, m.text, senderFor(s0));
      }
      return json({ ok: true });
    }

    const sub = await byToken(String(b.token || ""));
    if (!sub) return json({ error: "not found" }, 404);

    if (b.action === "status") return json({ sub: view(sub) });
    if (b.action === "cancel" || b.action === "resume") {
      const r = await changeSub(sub, b.action);
      if (!r.ok) return json({ error: "provider" }, 502);
      // Подтверждение расторжения письмом (§ 312k BGB, art. L215-1-1 C. conso.): сразу, со ссылкой, по которой подписку можно вернуть
      if (b.action === "cancel" && sub.site) { const m = cancelMail(String(sub.lang || "en"), r.data, `${sub.site}?sub=${await issueToken(sub.id)}`); await mail(String(sub.email), m.subject, m.text, senderFor(sub)); }
      return json({ sub: view(r.data) });
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
