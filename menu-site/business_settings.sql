/* =====================================================================
   BUSINESS SETTINGS — lets staff change the WhatsApp number, delivery
   fee, minimum order, and opening hours from the dashboard, instead of
   editing menu.js and redeploying for the most commonly-changed values
   on the whole site.

   This table starts EMPTY on purpose. Until the dashboard's "Business
   settings" form is saved for the first time, no row exists here, and
   menu.js's BUSINESS block keeps governing everything exactly as it
   always has — nothing changes for a site that never touches this.
   The moment it's saved once, this row becomes the source of truth for
   all of these fields together (see app.js, which reads it as one
   fetch and overrides BUSINESS wholesale, not field-by-field).

   Run this once in Supabase SQL Editor.
   ===================================================================== */

create table if not exists business_settings (
  id int primary key,
  whatsapp text not null,
  whatsapp_backup text,
  delivery_fee numeric,        -- null means "agreed in chat" — a real, valid value, not "unset"
  minimum_order numeric not null default 0,
  hours_text text,             -- plain-text hours shown on the page
  open_days int[],             -- weekday numbers open (Sun=0..Sat=6); null/empty turns auto-close off
  open_time text,              -- "HH:MM", 24-hour, local time
  close_time text,             -- "HH:MM", 24-hour, local time
  updated_at timestamptz not null default now()
);

alter table business_settings enable row level security;

/* Anyone (anon) can read it — the customer site needs these values on
   every page load. Only staff can change them. */
create policy "anyone can view business settings"
  on business_settings for select
  using (true);

create policy "staff can manage business settings"
  on business_settings for all
  to authenticated
  using (true)
  with check (true);
