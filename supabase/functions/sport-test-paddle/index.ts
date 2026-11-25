// Вебхук Paddle Billing для теста kids-test.com (проект «Kids test»).
// Paddle шлёт сюда события; подпись Paddle-Signature (ts=…;h1=HMAC-SHA256(secret, ts + ':' + тело)) проверяется секретом
// PADDLE_WEBHOOK_SECRET (из Paddle → Developer tools → Notifications). Без верной подписи ничего не меняется.
//   transaction.completed  → заказ custom_data.order_ref = оплачен (sport_test_orders), подписка продлевается на период
//   subscription.canceled  → подписка помечается отменённой
//   subscription.updated   → статус/дата следующего списания
// verify_jwt=false (вызывает Paddle). Ответ всегда быстрый: 200 при успехе, 400 при плохой подписи.
import { createHmac, timingSafeEqual } from "node:crypto";
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

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("ok");
  const raw = await req.text();
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
      if (orderRef) await db.from("sport_test_subscriptions").update({ provider_sub: d.id }).eq("order_ref", orderRef);
      if (d.scheduled_change?.action === "cancel") await db.from("sport_test_subscriptions").update({ status: "cancelled", cancelled_at: new Date().toISOString() }).eq("provider_sub", d.id);
      else if (d.status === "active" && d.current_billing_period?.ends_at) await db.from("sport_test_subscriptions").update({ paid_until: d.current_billing_period.ends_at }).eq("provider_sub", d.id);
    }
  } catch (e) {
    console.error("paddle webhook", type, String(e));
    return new Response("error", { status: 500 }); // Paddle повторит
  }
  return new Response(JSON.stringify({ ok: true }), { headers: { "content-type": "application/json" } });
});
