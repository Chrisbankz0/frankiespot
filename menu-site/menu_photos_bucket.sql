/* =====================================================================
   MENU PHOTOS STORAGE BUCKET — lets staff upload a photo straight from
   the "Add a menu item" form instead of needing to already have the
   image hosted somewhere and paste a link.

   Public read (so the photo actually shows on the live site to anyone,
   logged in or not), staff-only write — same anon/authenticated split
   as every other table in this project.

   admin.js shrinks every photo in the browser before it uploads, so a
   normal upload lands well under 2MB — the 10MB cap and image-only
   filter below are just a safety net (a corrupted file that fails to
   resize falls back to uploading as-is), not the normal case.

   Safe to run again if you've already run an earlier version of this
   file — it updates the existing bucket's settings instead of failing.

   Run this in Supabase SQL Editor.
   ===================================================================== */

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'menu-photos',
  'menu-photos',
  true,
  10485760, -- 10MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
  set file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

/* Postgres has no "create policy if not exists", so each one is
   dropped first — this is what actually makes the whole file safe to
   run again, not just the bucket insert above. */

drop policy if exists "public read menu photos" on storage.objects;
create policy "public read menu photos"
  on storage.objects for select
  using (bucket_id = 'menu-photos');

drop policy if exists "staff upload menu photos" on storage.objects;
create policy "staff upload menu photos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'menu-photos');

drop policy if exists "staff replace menu photos" on storage.objects;
create policy "staff replace menu photos"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'menu-photos');

drop policy if exists "staff delete menu photos" on storage.objects;
create policy "staff delete menu photos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'menu-photos');
