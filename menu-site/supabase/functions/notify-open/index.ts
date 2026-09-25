// =====================================================================
// EDGE FUNCTION: notify-open
//
// Sends a real push notification ("Frankie's Pot is open!") to every
// customer who opted in via the site's "🔔 Notify me when you're open"
// banner — including customers who don't currently have the site open.
//
// Triggered from the staff dashboard (admin.html/admin.js) via the
// "Notify customers we're open" button. Only a logged-in staff member
// can call this — the Bearer token is checked against Supabase Auth
// below, same login as the rest of the dashboard.
//
// Deploy with:
//   supabase functions deploy notify-open
//
// Secrets it needs (see README.md in this folder for the full list of
// commands):
//   supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=...
//
// SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are
// provided automatically inside every Edge Function — they do NOT need
// to be set as secrets.
// =====================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "https://esm.sh/web-push@3.6.7?target=deno";

/* Change this to your site's real, live URL — it's what a tapped
   notification opens. */
const SITE_URL = "https://frankiespot.vercel.app";

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
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!token) {
      return json({ error: "Missing Authorization header" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    /* Verify the caller is a logged-in staff member — same check as
       Supabase Auth does anywhere else, just done by hand here since
       this endpoint isn't a normal table request. */
    const authClient = createClient(supabaseUrl, anonKey);
    const { data: userData, error: userError } = await authClient.auth.getUser(token);
    if (userError || !userData?.user) {
      return json({ error: "Unauthorized" }, 401);
    }

    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
    if (!vapidPublicKey || !vapidPrivateKey) {
      return json({ error: "VAPID keys aren't configured on this function" }, 500);
    }
    webpush.setVapidDetails("mailto:admin@frankiespot.com", vapidPublicKey, vapidPrivateKey);

    /* Service role key — bypasses RLS so this can read every
       subscription, not just what "anon" is allowed to see. */
    const dbClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: subs, error: subsError } = await dbClient
      .from("push_subscriptions")
      .select("id, subscription");
    if (subsError) {
      return json({ error: subsError.message }, 500);
    }

    const payload = JSON.stringify({
      title: "Frankie's Pot is open!",
      body: "We're open now — order your food today.",
      url: SITE_URL,
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
            // Browser unsubscribed or the subscription expired — stop
            // trying to push to it.
            await dbClient.from("push_subscriptions").delete().eq("id", row.id);
            cleaned++;
          } else {
            console.error("Push failed for subscription", row.id, err);
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
