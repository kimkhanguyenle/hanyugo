import { createClient } from "@supabase/supabase-js";

// The single Supabase client for the whole app.
//
// These two values are PUBLIC by design — the anon key is meant to ship to the
// browser. It grants no privileges on its own: every table has Row Level
// Security enabled (see supabase/migrations/001_schema.sql), so Postgres itself
// decides what this key is allowed to touch, per signed-in user. That is what
// makes it safe to talk to the database directly with no API server in between.
//
// NEVER put the `service_role` key in this file or any other frontend file —
// that one bypasses RLS entirely and would expose every user's data.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  // Failing loudly here beats a dozen confusing "fetch failed" errors later.
  throw new Error(
    "Supabase is not configured.\n\n" +
      "Create a file named `.env.local` next to package.json containing:\n" +
      "  VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co\n" +
      "  VITE_SUPABASE_ANON_KEY=your-anon-key\n\n" +
      "You'll find both in your Supabase dashboard under Project Settings → API. " +
      "See SETUP.md for the full walkthrough."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Keep the user signed in across page reloads and refresh tokens silently
    // in the background, so a learner is never kicked out mid-lesson.
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
