import type {
  LessonSummary,
  LessonDetail,
  ApiWord,
  AuthUser,
  ReviewWord,
  DashboardSummary,
} from "@hanyugo/shared";
import { supabase } from "./lib/supabase";

// ============================================================================
//  Data layer — Supabase edition
//
//  Every function below keeps the EXACT signature it had when this app talked
//  to the Cloudflare Worker API, so none of the pages needed rewriting. Only
//  the implementation changed: `fetch("/api/...")` became a direct, RLS-guarded
//  Postgres query or an RPC call.
//
//  Why this is better than the old setup:
//    * No API server to deploy, wake up, or keep in sync — fewer moving parts,
//      fewer things that can be down.
//    * Postgres enforces access control per row, so security no longer depends
//      on us remembering an auth check in every handler.
//    * Multi-step writes (progress + activity log) happen inside one database
//      function, so they can't half-succeed.
// ============================================================================

/** Turns a Supabase error into a readable message instead of "[object Object]". */
function fail(context: string, error: { message?: string } | null): never {
  throw new Error(`${context}: ${error?.message ?? "unknown error"}`);
}

// ---------------------------------------------------------------------------
// Course content (shared, read-only)
// ---------------------------------------------------------------------------

export async function getLessons(level: number): Promise<{ lessons: LessonSummary[] }> {
  const { data, error } = await supabase
    .from("lessons")
    .select("id, hsk_level, title, order_index")
    .eq("hsk_level", level)
    .order("order_index");
  if (error) fail("Couldn't load lessons", error);
  return { lessons: (data ?? []) as LessonSummary[] };
}

export async function getLesson(id: string | number): Promise<LessonDetail> {
  const lessonId = Number(id);

  // Lesson header and its words are two small queries rather than one nested
  // join: the join returns the lesson row duplicated per word, which is wasted
  // bytes over the wire for no benefit at this size.
  const [{ data: lesson, error: lessonErr }, { data: links, error: linkErr }] = await Promise.all([
    supabase.from("lessons").select("id, hsk_level, title, order_index").eq("id", lessonId).single(),
    supabase
      .from("lesson_words")
      .select("word_id, hsk_words(id, hanzi, pinyin, pinyin_numbered, meaning_en, hsk_level, part_of_speech)")
      .eq("lesson_id", lessonId),
  ]);

  if (lessonErr) fail("Couldn't load this lesson", lessonErr);
  if (linkErr) fail("Couldn't load this lesson's words", linkErr);

  const words = (links ?? [])
    .map((row: { hsk_words: unknown }) => row.hsk_words as ApiWord)
    .filter(Boolean)
    .sort((a, b) => a.id - b.id);

  return { lesson: lesson as LessonSummary, words };
}

export async function getWords(level: number): Promise<{ words: ApiWord[] }> {
  const { data, error } = await supabase
    .from("hsk_words")
    .select("id, hanzi, pinyin, pinyin_numbered, meaning_en, hsk_level, part_of_speech")
    .eq("hsk_level", level)
    .order("id");
  if (error) fail("Couldn't load characters", error);
  return { words: (data ?? []) as ApiWord[] };
}

export async function getWord(id: string | number): Promise<{ word: ApiWord }> {
  const { data, error } = await supabase
    .from("hsk_words")
    .select("id, hanzi, pinyin, pinyin_numbered, meaning_en, hsk_level, part_of_speech")
    .eq("id", Number(id))
    .single();
  if (error) fail("Couldn't load this character", error);
  return { word: data as ApiWord };
}

// ---------------------------------------------------------------------------
// Auth — now handled by Supabase Auth rather than our own password hashing.
// ---------------------------------------------------------------------------

/** Maps a Supabase auth user + profile row into the AuthUser shape the UI expects. */
async function toAuthUser(userId: string, email: string | undefined): Promise<AuthUser> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", userId)
    .maybeSingle();

  return {
    id: userId,
    email: email ?? "",
    display_name: profile?.display_name ?? null,
  } as AuthUser;
}

export async function register(
  email: string,
  password: string,
  displayName?: string
): Promise<{ user: AuthUser }> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    // Stored on the auth user and picked up by the handle_new_user() trigger,
    // which creates the matching profiles row.
    options: { data: { display_name: displayName || null } },
  });
  if (error) fail("Sign up failed", error);
  if (!data.user) throw new Error("Sign up failed: no user returned.");

  // If the project has email confirmation switched on there is no session yet;
  // the UI still gets a user object so it can show the right message.
  return { user: await toAuthUser(data.user.id, data.user.email ?? email) };
}

export async function login(email: string, password: string): Promise<{ user: AuthUser }> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) fail("Login failed", error);
  if (!data.user) throw new Error("Login failed: no user returned.");
  return { user: await toAuthUser(data.user.id, data.user.email ?? email) };
}

export async function logout(): Promise<{ ok: boolean }> {
  const { error } = await supabase.auth.signOut();
  if (error) fail("Logout failed", error);
  return { ok: true };
}

export async function getCurrentUser(): Promise<{ user: AuthUser | null }> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { user: null };
  return { user: await toAuthUser(data.user.id, data.user.email ?? undefined) };
}

/** Sends a password-reset email — something the old hand-rolled auth never had. */
export async function requestPasswordReset(email: string): Promise<{ ok: boolean }> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/settings`,
  });
  if (error) fail("Couldn't send reset email", error);
  return { ok: true };
}

export async function updateDisplayName(displayName: string): Promise<{ ok: boolean }> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Not signed in.");
  const { error } = await supabase
    .from("profiles")
    .update({ display_name: displayName })
    .eq("id", userData.user.id);
  if (error) fail("Couldn't update your name", error);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Review queue
// ---------------------------------------------------------------------------

export async function markWord(
  wordId: string | number,
  status: "marked_for_review" | "known" | "learning" | "new",
  note?: string
): Promise<{ ok: boolean }> {
  const { error } = await supabase.rpc("set_word_status", {
    p_word_id: Number(wordId),
    p_status: status,
    p_note: note ?? null,
  });
  if (error) fail("Couldn't update this word", error);
  return { ok: true };
}

export async function getReviewQueue(): Promise<{ words: ReviewWord[] }> {
  const { data, error } = await supabase.rpc("get_review_queue");
  if (error) fail("Couldn't load your review list", error);
  return { words: (data ?? []) as ReviewWord[] };
}

// ---------------------------------------------------------------------------
// Practice tracking + Dashboard
// ---------------------------------------------------------------------------

export async function recordPracticeResult(
  wordId: string | number,
  correct: boolean
): Promise<{ ok: boolean; correctStreak: number }> {
  const { data, error } = await supabase.rpc("record_practice_result", {
    p_word_id: Number(wordId),
    p_correct: correct,
  });
  if (error) fail("Couldn't save your answer", error);
  const result = data as { ok: boolean; correctStreak: number } | null;
  return { ok: result?.ok ?? true, correctStreak: result?.correctStreak ?? 0 };
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  // One RPC instead of five round-trips: the streak walk, daily goal, active
  // level, in-progress lessons and character sample are all computed in the
  // database, next to the data.
  const { data, error } = await supabase.rpc("get_dashboard_summary");
  if (error) fail("Couldn't load your dashboard", error);
  return data as DashboardSummary;
}
