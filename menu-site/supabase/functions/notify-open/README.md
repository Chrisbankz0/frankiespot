# notify-open — setup

Run these once, from a terminal with the [Supabase CLI](https://supabase.com/docs/guides/cli)
installed and logged in (`supabase login`), from inside the `menu-site` folder.

## 1. Link this folder to your Supabase project (first time only)

```
supabase link --project-ref dogiuswvdcyvwhbjsadt
```

(That's the project ref from your `SUPABASE_URL` — `https://dogiuswvdcyvwhbjsadt.supabase.co`.)

## 2. Set the VAPID key secrets

The public key is already in `supabase-config.js` (safe to expose). The
private key is NOT in this repo anywhere — set it as a secret here, and
nowhere else:

```
supabase secrets set VAPID_PUBLIC_KEY="BJ9zERgCfdvGF3bS4829fPvWHo4_osltpYU_q6642GApqFsXhK8qZPRmwT9RopeBazyLk1As-6bQ27PXAP65cH4"
supabase secrets set VAPID_PRIVATE_KEY="<paste the private key you saved — never commit it>"
```

`SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` do **not**
need to be set — every Edge Function gets those automatically.

## 3. Deploy the function

```
supabase functions deploy notify-open
```

## 4. One-time SQL

Run `push_subscriptions.sql` (in the `menu-site` folder) in the Supabase SQL
Editor, if you haven't already.

That's it — the "Notify customers we're open" button on the dashboard calls
this function directly; there's nothing else to wire up.
