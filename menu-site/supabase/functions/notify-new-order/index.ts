// =====================================================================
// EDGE FUNCTION: notify-new-order
//
// Sends a push notification to every staff member who's opted in
// (dashboard: "Notify me when a new order comes in") the moment a
// customer places an order. Called from the customer site (app.js)
// right after an order saves successfully — best-effort, fire-and-
// forget: if this fails for any reason, the customer's order itself is
// completely unaffected, since it's already saved by the time this runs.
//
// Reuses the same VAPID keys already set for notify-open — no new
// secrets needed. Deploy with:
//   supabase functions deploy notify-new-order
//
// SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are
// provided automatically inside every Edge Function.
// =====================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "https://esm.sh/web-push@3.6.7?target=deno";

/* Change this to your site's real, live URL — it's what a tapped
   notification opens (the dashboard, not the customer menu). */
const ADMIN_URL = "https://frankiespot.vercel.app/admin.html";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { order_id } = await req.json().catch(() => ({}));
    if (!order_id) {
      return json({ error: "Missing order_id" }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const dbClient = createClient(supabaseUrl, serviceRoleKey);

    /* Confirms this is a real order (not just an arbitrary call with the
       public anon key) and gives us something useful to put in the
       notification body. */
    const { data: order, error: orderError } = await dbClient
      .from("orders")
      .select("total, items, customer_name")
      .eq("id", order_id)
      .single();
    if (orderError || !order) {
      return json({ error: "Order not found" }, 404);
    }

    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
    if (!vapidPublicKey || !vapidPrivateKey) {
      return json({ error: "VAPID keys aren't configured on this function" }, 500);
    }
    webpush.setVapidDetails("mailto:admin@frankiespot.com", vapidPublicKey, vapidPrivateKey);

    const { data: subs, error: subsError } = await dbClient
      .from("staff_push_subscriptions")
      .select("id, subscription");
    if (subsError) {
      return json({ error: subsError.message }, 500);
    }

    const itemCount = (order.items || []).reduce(
      (sum: number, i: { qty?: number }) => sum + Number(i.qty || 0),
      0
    );
    const money = (n: number) => "₦" + Number(n || 0).toLocaleString("en-NG");
    const payload = JSON.stringify({
      title: "New order!",
      body:
        `${money(order.total)} · ${itemCount} item${itemCount === 1 ? "" : "s"}` +
        (order.customer_name ? ` — ${order.customer_name}` : ""),
      url: ADMIN_URL,
    });

    let sent = 0;
    let cleaned = 0;

    await Promise.all(
      (subs || []).map(async (row: { id: string; subscription: webpush.PushSubscription }) => {
        try {
          await webpush.sendNotification(row.subscription, payload);
          sent++;
        } catch (err) {
          const statusCode = (err as { statusCode?: number })?.statusCode;
          if (statusCode === 404 || statusCode === 410) {
            await dbClient.from("staff_push_subscriptions").delete().eq("id", row.id);
            cleaned++;
          } else {
            console.error("Push failed for staff subscription", row.id, err);
          }
        }
      })
    );

    return json({ sent, cleaned });
  } catch (err) {
    console.error(err);
    return json({ error: String(err) }, 500);
  }
});
