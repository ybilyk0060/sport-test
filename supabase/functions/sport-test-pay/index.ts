// Веб-тест спорту: оплата результата через WayForPay.
// Без секретов приём оплаты ВЫКЛЮЧЕН: демо-мерчант test_merch_n1 списывает реальные деньги.
// Боевой режим: задать секреты WFP_MERCHANT, WFP_SECRET, WFP_DOMAIN (+ SPORT_TEST_PRICE_UAH).
//
// Маршруты (verify_jwt=false):
//   POST {action:'create', sid, returnTo, orderRef?} -> {payUrl, fields, orderRef, amount, mode}  (фронт делает form POST на payUrl)
//   POST {action:'status', orderRef}       -> {paid, status}  (проверка в БД, при необходимости CHECK_STATUS у WayForPay)
//   POST ?action=return&to=<url>           -> 303 на сайт (WayForPay шлёт POST на returnUrl, GitHub Pages POST не принимает)
//   POST ?action=callback                  -> serviceUrl WayForPay, подпись проверяется, ответ accept
import { createHmac } from "node:crypto";
import { createClient } from "jsr:@supabase/supabase-js@2";

const TEST = { merchant: "test_merch_n1", secret: "flk3409refn54t54t*FNJRET", domain: "www.market.ua" };
const merchant = Deno.env.get("WFP_MERCHANT") || TEST.merchant;
const secret = Deno.env.get("WFP_SECRET") || TEST.secret;
const domain = Deno.env.get("WFP_DOMAIN") || TEST.domain;
const mode = Deno.env.get("WFP_MERCHANT") ? "live" : "test";
const PRICE = Number(Deno.env.get("SPORT_TEST_PRICE_UAH") || "210");
const ALLOWED_RETURN = (Deno.env.get("SPORT_TEST_RETURN_HOSTS") || "ybilyk0060.github.io,localhost,127.0.0.1").split(",");

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const FN_URL = `${Deno.env.get("SUPABASE_URL")}/functions/v1/sport-test-pay`;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });
const sign = (parts: (string | number)[]) => createHmac("md5", secret).update(parts.join(";"), "utf8").digest("hex");

function safeReturn(to: string | null): string | null {
  if (!to) return null;
  try {
    const u = new URL(to);
    if (u.protocol !== "https:" && u.hostname !== "localhost" && u.hostname !== "127.0.0.1") return null;
    return ALLOWED_RETURN.includes(u.hostname) ? u.toString() : null;
  } catch { return null; }
}

async function markPaid(orderRef: string, payload: unknown) {
  await db.from("sport_test_orders").update({ status: "paid", paid_at: new Date().toISOString(), provider_payload: payload })
    .eq("order_ref", orderRef).neq("status", "paid");
}

async function checkStatus(orderRef: string) {
  const r = await fetch("https://api.wayforpay.com/api", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transactionType: "CHECK_STATUS", merchantAccount: merchant, orderReference: orderRef,
      merchantSignature: sign([merchant, orderRef]), apiVersion: 1 }),
  });
  return await r.json().catch(() => ({}));
}

async function readBody(req: Request): Promise<Record<string, unknown>> {
  const text = await req.text();
  if (!text) return {};
  try { return JSON.parse(text); } catch { /* not json */ }
  const p = new URLSearchParams(text);
  // WayForPay иногда шлёт JSON как единственный ключ формы
  if ([...p.keys()].length === 1 && !p.values().next().value) {
    try { return JSON.parse([...p.keys()][0]); } catch { /* ignore */ }
  }
  return Object.fromEntries(p);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const url = new URL(req.url);
  const qAction = url.searchParams.get("action");

  try {
    // Возврат покупателя с платёжной страницы
    if (qAction === "return") {
      const body = await readBody(req).catch(() => ({}));
      const orderRef = String(body.orderReference || url.searchParams.get("order") || "");
      const to = safeReturn(url.searchParams.get("to"));
      if (!to) return new Response("bad return url", { status: 400 });
      const dest = new URL(to);
      dest.searchParams.set("pay", "check");
      if (orderRef) dest.searchParams.set("order", orderRef);
      return new Response(null, { status: 303, headers: { Location: dest.toString() } });
    }

    // Серверное уведомление WayForPay
    if (qAction === "callback") {
      const b = await readBody(req);
      const orderRef = String(b.orderReference || "");
      const expected = sign([b.merchantAccount as string, orderRef, b.amount as string, b.currency as string,
        (b.authCode ?? "") as string, (b.cardPan ?? "") as string, b.transactionStatus as string, (b.reasonCode ?? "") as string]);
      if (expected !== b.merchantSignature) return json({ error: "bad signature" }, 400);
      if (b.transactionStatus === "Approved") await markPaid(orderRef, b);
      else await db.from("sport_test_orders").update({ status: String(b.transactionStatus).toLowerCase(), provider_payload: b })
        .eq("order_ref", orderRef).neq("status", "paid");
      const time = Math.floor(Date.now() / 1000);
      return json({ orderReference: orderRef, status: "accept", time, signature: sign([orderRef, "accept", time]) });
    }

    if (req.method !== "POST") return json({ ok: true, mode });
    const b = await readBody(req);

    if (b.action === "create") {
      // Демо-мерчант WayForPay (test_merch_n1) списывает реальные деньги с карт: без своих ключей приём оплаты выключен.
      if (mode !== "live") return json({ error: "payments disabled: merchant keys not configured" }, 503);
      const sid = String(b.sid || "").slice(0, 64);
      const returnTo = safeReturn(String(b.returnTo || ""));
      if (!returnTo) return json({ error: "returnTo not allowed" }, 400);
      const clientRef = String(b.orderRef || "");
      const orderRef = /^st-[A-Za-z0-9_-]{4,76}$/.test(clientRef) ? clientRef : `st-${sid || "anon"}-${Date.now().toString(36)}`.slice(0, 80);
      const amount = PRICE;
      const orderDate = Math.floor(Date.now() / 1000);
      const productName = "Руховий профіль дитини: результат тесту";
      const { error } = await db.from("sport_test_orders").insert({ order_ref: orderRef, sid, amount, currency: "UAH", mode });
      if (error) return json({ error: error.message }, 500);
      const fields: Record<string, string | number> = {
        merchantAccount: merchant,
        merchantAuthType: "SimpleSignature",
        merchantDomainName: domain,
        orderReference: orderRef,
        orderDate,
        amount,
        currency: "UAH",
        "productName[]": productName,
        "productPrice[]": amount,
        "productCount[]": 1,
        language: "UA",
        returnUrl: `${FN_URL}?action=return&to=${encodeURIComponent(returnTo)}`,
        serviceUrl: `${FN_URL}?action=callback`,
        merchantSignature: sign([merchant, domain, orderRef, orderDate, amount, "UAH", productName, 1, amount]),
      };
      return json({ payUrl: "https://secure.wayforpay.com/pay", fields, orderRef, amount, mode });
    }

    if (b.action === "status") {
      const orderRef = String(b.orderRef || "");
      const { data } = await db.from("sport_test_orders").select("status").eq("order_ref", orderRef).maybeSingle();
      if (!data) return json({ paid: false, status: "unknown" });
      if (data.status === "paid") return json({ paid: true, status: "paid", mode });
      const s = await checkStatus(orderRef);
      if (s.transactionStatus === "Approved") { await markPaid(orderRef, s); return json({ paid: true, status: "paid", mode }); }
      return json({ paid: false, status: s.transactionStatus || data.status, reason: s.reason, mode });
    }

    return json({ error: "unknown action" }, 400);
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
