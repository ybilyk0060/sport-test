// Вебхук Paddle Billing для теста kids-test.com (проект «Kids test»).
// Paddle шлёт сюда события; подпись Paddle-Signature (ts=…;h1=HMAC-SHA256(secret, ts + ':' + тело)) проверяется секретом
// PADDLE_WEBHOOK_SECRET (из Paddle → Developer tools → Notifications). Без верной подписи ничего не меняется.
//   transaction.completed  → заказ custom_data.order_ref = оплачен (sport_test_orders), подписка продлевается на период
//   subscription.canceled  → подписка помечается отменённой
//   subscription.updated   → статус/дата следующего списания
//   + первая оплата подписки → Purchase и Subscribe в Meta через Conversions API (если задан META_CAPI_TOKEN):
//     event_id purchase-{order_ref} / subscribe-{order_ref} совпадает с браузерным пикселем → Meta считает покупку один раз.
//     Продления и оплаты на 0 (промокод 100%) не шлём; при META_TEST_EVENT_CODE всё уходит в «Тестовые события».
//     UK и ЕС: только если покупатель согласился на cookie (custom_data.consent = 'all').
// verify_jwt=false (вызывает Paddle). Ответ всегда быстрый: 200 при успехе, 400 при плохой подписи.
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { createClient } from "jsr:@supabase/supabase-js@2";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const SECRET = Deno.env.get("PADDLE_WEBHOOK_SECRET") || "";
const ENV = Deno.env.get("PADDLE_ENV") || "sandbox";
const PERIOD_DAYS = 30;

function verify(sigHeader: string | null, raw: string): boolean {
  if (!SECRET || !sigHeader) return false;
  const parts = Object.fromEntries(sigHeader.split(";").map((kv) => kv.split("=")));
  const ts = parts.ts, h1 = parts.h1;
  if (!ts || !h1) return false;
  if (Math.abs(Date.now() / 1000 - Number(ts)) > 300) return false; // старше 5 минут — повтор
  const mac = createHmac("sha256", SECRET).update(`${ts}:${raw}`).digest("hex");
  try { return timingSafeEqual(new TextEncoder().encode(mac), new TextEncoder().encode(h1)); } catch { return false; }
}

const money = (minor: unknown) => (minor == null ? null : Number(minor) / 100);

// --- Meta Conversions API ---
const PIXEL = Deno.env.get("META_PIXEL_ID") || "1607393024387662";
const CAPI_TOKEN = Deno.env.get("META_CAPI_TOKEN") || "";
const CAPI_TEST = Deno.env.get("META_TEST_EVENT_CODE") || "";
const CONSENT_COUNTRIES = new Set(["GB", "UK", "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE", "IS", "LI", "NO", "CH"]);
const sha = (s: string) => createHash("sha256").update(s.trim().toLowerCase()).digest("hex");
const str = (v: unknown, n = 400) => (typeof v === "string" ? v.slice(0, n) : "");

async function sendCapi(d: Record<string, any>, orderRef: string, value: number, currency: string) {
  if (!CAPI_TOKEN) return "no token";
  const c = d.custom_data || {};
  const country = str(c.country, 2).toUpperCase();
  if (c.consent !== "all") return "no consent";
  if (!(value > 0) && !CAPI_TEST) return "zero amount";
  const user_data: Record<string, unknown> = {};
  if (/^[a-f0-9]{64}$/.test(str(c.em))) user_data.em = [c.em];
  if (/^[A-Z]{2}$/.test(country)) user_data.country = [sha(country)];
  if (str(c.fbc)) user_data.fbc = str(c.fbc);
  if (str(c.fbp)) user_data.fbp = str(c.fbp);
  if (str(c.ua)) user_data.client_user_agent = str(c.ua);
  if (d.customer_id) user_data.external_id = [sha(String(d.customer_id))];
  const base = {
    event_time: Math.floor(Date.now() / 1000), action_source: "website",
    event_source_url: str(c.url) || "https://kids-test.com/", user_data,
  };
  const custom = { value: value > 0 ? value : 0.01, currency: currency || "USD", order_id: orderRef };
  const body: Record<string, unknown> = {
    data: [
      { ...base, event_name: "Purchase", event_id: `purchase-${orderRef}`, custom_data: custom },
      { ...base, event_name: "Subscribe", event_id: `subscribe-${orderRef}`, custom_data: { ...custom, predicted_ltv: custom.value } },
    ],
  };
  if (CAPI_TEST) body.test_event_code = CAPI_TEST;
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 4000);
  try {
    const r = await fetch(`https://graph.facebook.com/v24.0/${PIXEL}/events?access_token=${encodeURIComponent(CAPI_TOKEN)}`, {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), signal: ctl.signal,
    });
    const txt = (await r.text()).slice(0, 300);
    if (!r.ok) console.error("capi", r.status, txt);
    return `${r.status} ${txt}`;
  } catch (e) { console.error("capi", String(e)); return "error " + String(e).slice(0, 100); } finally { clearTimeout(t); }
}

// Lead «анкета завершена» со страницы (27.11): дубль браузерного пикселя с тем же event_id, без подписи Paddle.
// Только проверка формы; с UK/ЕС без согласия не шлём; повтор одного event_id Meta сама отбрасывает.
const leadCors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
async function sendLeadCapi(c: Record<string, any>, ip: string) {
  if (!CAPI_TOKEN) return "no token";
  const eventId = str(c.event_id, 120);
  if (!/^lead-[A-Za-z0-9_-]{4,100}$/.test(eventId)) return "bad id";
  const country = str(c.country, 2).toUpperCase();
  if (c.consent !== "all") return "no consent"; // страны без баннера и так присылают all
  const user_data: Record<string, unknown> = {};
  if (/^[A-Z]{2}$/.test(country)) user_data.country = [sha(country)];
  if (str(c.fbc)) user_data.fbc = str(c.fbc);
  if (str(c.fbp)) user_data.fbp = str(c.fbp);
  if (str(c.ua)) user_data.client_user_agent = str(c.ua);
  if (/^[0-9a-fA-F:.]{3,45}$/.test(ip)) user_data.client_ip_address = ip; // Meta требует IP или другие данные для событий сайта
  const body: Record<string, unknown> = { data: [{ event_name: "Lead", event_id: eventId, event_time: Math.floor(Date.now() / 1000), action_source: "website",
    event_source_url: str(c.url) || "https://kids-test.com/", user_data, custom_data: { content_name: c.content_name === "mind_quiz_complete" ? "mind_quiz_complete" : "quiz_complete" } }] };
  if (CAPI_TEST) body.test_event_code = CAPI_TEST;
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 4000);
  try {
    const r = await fetch(`https://graph.facebook.com/v24.0/${PIXEL}/events?access_token=${encodeURIComponent(CAPI_TOKEN)}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), signal: ctl.signal });
    const txt = (await r.text()).slice(0, 200);
    if (!r.ok) console.error("capi lead", r.status, txt);
    return `${r.status} ${r.ok ? "" : txt.slice(0, 160)}`;
  } catch (e) { return "error " + String(e).slice(0, 80); } finally { clearTimeout(t); }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: leadCors });
  if (req.method !== "POST") return new Response("ok");
  const raw = await req.text();
  if (raw.length < 4000 && raw.includes('"action":"lead"')) {
    let c: Record<string, any> = {};
    try { c = JSON.parse(raw); } catch { return new Response("bad json", { status: 400, headers: leadCors }); }
    if (c.action === "lead") {
      const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim();
      const r = await sendLeadCapi(c, ip);
      return new Response(JSON.stringify({ ok: true, r }), { headers: { ...leadCors, "content-type": "application/json" } });
    }
  }
  if (!verify(req.headers.get("Paddle-Signature"), raw)) return new Response("bad signature", { status: 400 });
  let ev: Record<string, any>;
  try { ev = JSON.parse(raw); } catch { return new Response("bad json", { status: 400 }); }
  const type = String(ev.event_type || ""), d = ev.data || {};
  try {
    if (type === "transaction.completed" || type === "transaction.paid") {
      const orderRef = String(d.custom_data?.order_ref || "");
      const subId = d.subscription_id || null;
      const total = money(d.details?.totals?.grand_total ?? d.details?.totals?.total);
      const cur = String(d.currency_code || "");
      if (/^st-[A-Za-z0-9_-]{4,76}$/.test(orderRef)) {
        const { data: o } = await db.from("sport_test_orders").select("order_ref, status").eq("order_ref", orderRef).maybeSingle();
        const row = { status: "paid", paid_at: new Date().toISOString(), amount: total ?? 0, currency: cur, mode: ENV, provider: "paddle", provider_txn: d.id, provider_sub: subId, provider_payload: { id: d.id, status: d.status, origin: d.origin } };
        if (o) await db.from("sport_test_orders").update(row).eq("order_ref", orderRef).neq("status", "paid");
        else await db.from("sport_test_orders").insert({ order_ref: orderRef, sid: orderRef.split("-")[1] || "", ...row });
        // Покупка в Meta (Conversions API): только на transaction.completed первой оплаты, один раз на заказ
        if (type === "transaction.completed" && d.origin !== "subscription_recurring") {
          const { data: done } = await db.from("sport_test_orders").select("provider_payload").eq("order_ref", orderRef).maybeSingle();
          if (!done?.provider_payload?.capi) {
            const capi = await sendCapi(d, orderRef, total ?? 0, cur);
            await db.from("sport_test_orders").update({ provider_payload: { id: d.id, status: d.status, origin: d.origin, capi, src: { utm_source: str(d.custom_data?.utm_source, 100), utm_campaign: str(d.custom_data?.utm_campaign, 200), utm_content: str(d.custom_data?.utm_content, 200), utm_term: str(d.custom_data?.utm_term, 200), country: str(d.custom_data?.country, 2), consent: str(d.custom_data?.consent, 12), keys: Object.keys(d.custom_data || {}).join(","), fbc: !!d.custom_data?.fbc, em: !!d.custom_data?.em } } }).eq("order_ref", orderRef);
          }
        }
        // Покупатель мог закрыть вкладку до возврата на сайт: подписку и письмо с условиями создаём сами (пока только тест мышления).
        // Повтор безопасен: вторая активация того же заказа возвращает уже созданную строку и письмо не шлёт.
        const cd = d.custom_data || {};
        if (type === "transaction.completed" && d.origin !== "subscription_recurring" && cd.st_product === "mind" && str(cd.st_email, 200)) {
          const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 8000);
          try {
            if (subId) await db.from("sport_test_orders").update({ provider_sub: subId }).eq("order_ref", orderRef);
            const r = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/sport-test-sub`, { method: "POST", headers: { "content-type": "application/json" }, signal: ctl.signal,
              body: JSON.stringify({ action: "activate", email: str(cd.st_email, 200), orderRef, currency: cur || "USD", first: Number(cd.st_first) || 0, regular: Number(cd.st_regular) || 0, lang: str(cd.st_lang, 2), returnTo: str(cd.st_site, 300), quiz: { product: "mind" } }) });
            if (!r.ok) console.error("auto-activate", r.status, (await r.text()).slice(0, 200));
          } catch (e) { console.error("auto-activate", String(e)); } finally { clearTimeout(t); }
        }
        // id подписки может прийти позже первого «paid» (transaction.paid → transaction.completed): дописываем всегда
        if (subId) { await db.from("sport_test_orders").update({ provider_sub: subId }).eq("order_ref", orderRef); await db.from("sport_test_subscriptions").update({ provider_sub: subId }).eq("order_ref", orderRef); }
      }
      // Продление (не первая оплата): подписка по provider_sub продлевается на период
      if (subId && d.origin === "subscription_recurring") {
        const until = d.billing_period?.ends_at || new Date(Date.now() + PERIOD_DAYS * 86400000).toISOString();
        await db.from("sport_test_subscriptions").update({ paid_until: until, status: "active" }).eq("provider_sub", subId);
      }
    } else if (type === "subscription.canceled") {
      await db.from("sport_test_subscriptions").update({ status: "cancelled", cancelled_at: new Date().toISOString() }).eq("provider_sub", d.id);
    } else if (type === "subscription.updated" || type === "subscription.created" || type === "subscription.activated") {
      // Запомнить связь заказа и подписки Paddle, дату следующего списания
      const orderRef = String(d.custom_data?.order_ref || "");
      if (orderRef) { await db.from("sport_test_subscriptions").update({ provider_sub: d.id }).eq("order_ref", orderRef); await db.from("sport_test_orders").update({ provider_sub: d.id }).eq("order_ref", orderRef); }
      if (d.scheduled_change?.action === "cancel") await db.from("sport_test_subscriptions").update({ status: "cancelled", cancelled_at: new Date().toISOString() }).eq("provider_sub", d.id);
      else if (d.status === "active" && d.current_billing_period?.ends_at) await db.from("sport_test_subscriptions").update({ paid_until: d.current_billing_period.ends_at }).eq("provider_sub", d.id);
    }
  } catch (e) {
    console.error("paddle webhook", type, String(e));
    return new Response("error", { status: 500 }); // Paddle повторит
  }
  return new Response(JSON.stringify({ ok: true }), { headers: { "content-type": "application/json" } });
});
