/* =====================================================================
   STAFF PUSH SUBSCRIPTIONS — lets staff get a real push notification on
   their own phone/laptop the moment a new order comes in, instead of
   having to keep the dashboard open and refreshing.

   Mirrors push_subscriptions.sql (the customer-facing "we're open"
   opt-in) but kept as its own table since only logged-in staff should
   ever read, write, or subscribe here — customers never touch this one.

   Run this once in Supabase SQL Editor.
   ===================================================================== */

create table if not exists staff_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  subscription jsonb not null
);

alter table staff_push_subscriptions enable row level security;

/* Only logged-in staff (via admin.html) can subscribe, view, or remove
   subscriptions — there's no anon access at all, unlike the customer
   push_subscriptions table. */
create policy "staff can subscribe"
  on staff_push_subscriptions for insert
  to authenticated
  with check (true);

create policy "staff can view subscriptions"
  on staff_push_subscriptions for select
  to authenticated
  using (true);

create policy "staff can delete subscriptions"
  on staff_push_subscriptions for delete
  to authenticated
  using (true);
