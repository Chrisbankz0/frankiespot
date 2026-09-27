/* =====================================================================
   PAGE VIEWS — a bare-minimum, privacy-respecting view counter so the
   dashboard can show "X people viewed the menu, Y ordered" for the same
   Today/This week/This month ranges the order stats already use.

   Deliberately just a timestamp — no visitor ID, no IP, no cookie, no
   way to tell whether two rows came from the same person. It answers
   "how many views happened," never "who viewed."

   Run this once in Supabase SQL Editor.
   ===================================================================== */

create table if not exists page_views (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);

alter table page_views enable row level security;

/* Anyone (anon) can log a view — that's every customer loading the
   menu. Nobody, not even anon, can read them back except staff; a
   customer has no reason to see how many people viewed the site. */
create policy "anyone can log a view"
  on page_views for insert
  to anon
  with check (true);

create policy "staff can view the view log"
  on page_views for select
  to authenticated
  using (true);
