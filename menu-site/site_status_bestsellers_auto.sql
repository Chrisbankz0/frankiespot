/* =====================================================================
   FIX — adds the missing bestsellers_auto column to site_status.

   The dashboard and site code have referenced site_status.bestsellers_auto
   since the "Bestsellers uses real sales data" toggle was added, but the
   column itself was never created in the actual table — every read of
   site_status (busy + bestsellers_auto together) has been failing with a
   400 ("column does not exist") ever since, silently breaking BOTH the
   busy/closed banner and the bestsellers toggle on the customer site.

   Run this once in Supabase SQL Editor.
   ===================================================================== */

alter table site_status
  add column if not exists bestsellers_auto boolean not null default true;
