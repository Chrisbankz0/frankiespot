/* =====================================================================
   PROMO BANNER — a dashboard-controlled announcement strip on the
   customer site ("20% off today", "Try our new Shawarma", etc).

   Lives on site_status rather than its own table — it's one more
   site-wide setting alongside the existing "busy" flag, read on the
   same single row the site already fetches on every page load.

   Run this once in Supabase SQL Editor.
   ===================================================================== */

alter table site_status
  add column if not exists promo_enabled boolean not null default false;

alter table site_status
  add column if not exists promo_message text;

/* Optional — when set, the banner stops showing to customers on its own
   past this time (no need to remember to switch it off). The dashboard
   also flips promo_enabled back off once it notices this has passed. */
alter table site_status
  add column if not exists promo_expires_at timestamptz;
