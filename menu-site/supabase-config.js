/* =====================================================================
   SUPABASE CONFIG — shared by the menu site (order-saving) and the
   admin dashboard (login + reports).

   Both values here are meant to be public — this is the "anon" key,
   not a secret. What actually protects your data is the Row Level
   Security policies set up in supabase-setup.sql, not hiding this file.

   NEVER put the "service_role" key here or anywhere in this project.
   ===================================================================== */

const SUPABASE_URL = "https://dogiuswvdcyvwhbjsadt.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvZ2l1c3d2ZGN5dndoYmpzYWR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1NDYxNTIsImV4cCI6MjEwNTEyMjE1Mn0.XENkfJwCvuzh7-K-jGAHBBWgcvqUxIDKUg3BsaeqCPA";