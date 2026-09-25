/* =====================================================================
   BESTSELLER OVERRIDES — lets staff mark any menu.js item as a
   Bestseller from the dashboard (added to the Bestsellers row up top),
   without editing menu.js or redeploying. Same shape and same pattern
   as sold_out_items/archived_items: presence in this table is an
   ADDITIONAL, instant override on top of whatever menu.js already says.

   Doesn't cover items added from the "Add a menu item" dashboard form —
   those already carry their own `popular` column directly on
   custom_menu_items, toggled the same way from the same dashboard list.

   Run this once in Supabase SQL Editor.
   ===================================================================== */

create table if not exists bestseller_overrides (
  item_name text primary key
);

alter table bestseller_overrides enable row level security;

/* Anyone (anon) can read it — the customer site needs this to know
   which items to show in the Bestsellers row. Only staff can add or
   remove entries. */
create policy "anyone can view bestseller overrides"
  on bestseller_overrides for select
  using (true);

create policy "staff can manage bestseller overrides"
  on bestseller_overrides for all
  to authenticated
  using (true)
  with check (true);
