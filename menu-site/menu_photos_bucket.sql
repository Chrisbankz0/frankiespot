/* =====================================================================
   MENU PHOTOS STORAGE BUCKET — lets staff upload a photo straight from
   the "Add a menu item" form instead of needing to already have the
   image hosted somewhere and paste a link.

   Public read (so the photo actually shows on the live site to anyone,
   logged in or not), staff-only write — same anon/authenticated split
   as every other table in this project.

   Run this once in Supabase SQL Editor.
   ===================================================================== */

insert into storage.buckets (id, name, public)
values ('menu-photos', 'menu-photos', true)
on conflict (id) do nothing;

create policy "public read menu photos"
  on storage.objects for select
  using (bucket_id = 'menu-photos');

create policy "staff upload menu photos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'menu-photos');

create policy "staff replace menu photos"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'menu-photos');

create policy "staff delete menu photos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'menu-photos');
