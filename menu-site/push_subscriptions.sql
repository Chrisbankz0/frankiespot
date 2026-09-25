/* =====================================================================
   PUSH SUBSCRIPTIONS — stores each customer's browser push subscription
   so the "notify-open" Edge Function can send a real push notification
   (even while the site isn't open) when the kitchen opens for the day.

   A customer opts in on the site (see the "🔔 Notify me when you're
   open" banner in index.html/app.js), which subscribes their browser
   and inserts the resulting subscription object here. Staff never see
   who's who — this is just a list of subscription objects to push to.

   Run this once in Supabase SQL Editor.
   ===================================================================== */

create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  subscription jsonb not null
);

alter table push_subscriptions enable row level security;

/* Anyone (anon) can opt in — that's a customer subscribing themselves.
   No one can read or edit other people's subscriptions from the browser;
   only the Edge Function (using the service role key, which bypasses
   RLS entirely) reads the table to actually send notifications. */
create policy "anon can subscribe"
  on push_subscriptions for insert
  to anon
  with check (true);

/* Staff (logged in via admin.html) can view the list and remove dead
   subscriptions from the dashboard if that's ever added. */
create policy "staff can view subscriptions"
  on push_subscriptions for select
  to authenticated
  using (true);

create policy "staff can delete subscriptions"
  on push_subscriptions for delete
  to authenticated
  using (true);
