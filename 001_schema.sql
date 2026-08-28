-- ============================================================================
--  HanyuGo — Supabase / Postgres schema
--  Migration 001: tables, security policies, indexes
--
--  Run this FIRST in the Supabase SQL Editor (see SETUP.md step 3).
--
--  WHAT CHANGED FROM THE OLD CLOUDFLARE D1 SCHEMA
--  ----------------------------------------------
--  * `users` and `sessions` tables are GONE. Supabase Auth owns identity now
--    (auth.users). We keep a `profiles` table for app-level fields like
--    display_name, linked 1:1 to auth.users. This removes all hand-rolled
--    password hashing and session management from our codebase — that is
--    security-critical code we no longer have to get right ourselves.
--  * user ids are now UUID (auth.users.id) instead of TEXT.
--  * Row Level Security (RLS) is enabled on every table. This is what makes it
--    safe for the browser to talk to the database directly with no API server
--    in between: Postgres itself enforces "you can only read/write your own
--    rows", so a malicious client cannot request someone else's data.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- PROFILES — app-level user data, one row per auth user.
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text,
  display_name text,
  created_at   timestamptz not null default now()
);

-- Auto-create a profile row whenever someone signs up. Doing this with a
-- trigger (rather than a second insert from the client) means a profile can
-- never be missing — even if the user closes the tab mid-signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- CONTENT TABLES — the HSK course material.
-- These are shared, read-only reference data: every signed-in learner sees the
-- same words and lessons, and nobody can modify them from the client.
-- ---------------------------------------------------------------------------
create table if not exists public.hsk_words (
  id              bigint primary key,
  hanzi           text    not null,
  pinyin          text    not null,
  pinyin_numbered text    not null,
  meaning_en      text    not null,
  hsk_level       int     not null,
  part_of_speech  text
);

create table if not exists public.lessons (
  id          bigint primary key,
  hsk_level   int  not null,
  title       text not null,
  order_index int  not null
);

create table if not exists public.lesson_words (
  lesson_id bigint not null references public.lessons(id)   on delete cascade,
  word_id   bigint not null references public.hsk_words(id) on delete cascade,
  primary key (lesson_id, word_id)
);

-- ---------------------------------------------------------------------------
-- USER PROGRESS TABLES — private per learner.
-- ---------------------------------------------------------------------------
create table if not exists public.user_word_progress (
  user_id        uuid   not null references auth.users(id)     on delete cascade,
  word_id        bigint not null references public.hsk_words(id) on delete cascade,
  status         text   not null default 'new',
  correct_streak int    not null default 0,
  next_review_at timestamptz,
  note           text,
  updated_at     timestamptz not null default now(),
  primary key (user_id, word_id),
  constraint user_word_progress_status_check
    check (status in ('new', 'learning', 'known', 'marked_for_review'))
);

create table if not exists public.user_lesson_progress (
  user_id      uuid   not null references auth.users(id)   on delete cascade,
  lesson_id    bigint not null references public.lessons(id) on delete cascade,
  completed_at timestamptz,
  score        int,
  primary key (user_id, lesson_id)
);

-- One row per meaningful engagement event; powers streak + daily goal.
-- kind: 'practice_correct' | 'practice_attempt' | 'word_marked'
create table if not exists public.activity_log (
  id            bigserial primary key,
  user_id       uuid not null references auth.users(id) on delete cascade,
  activity_date date not null default current_date,
  kind          text not null,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- INDEXES — these matter for the dashboard queries at scale.
-- ---------------------------------------------------------------------------
create index if not exists idx_activity_log_user_date on public.activity_log (user_id, activity_date desc);
create index if not exists idx_hsk_words_level        on public.hsk_words (hsk_level, id);
create index if not exists idx_lessons_level_order    on public.lessons (hsk_level, order_index);
create index if not exists idx_lesson_words_word      on public.lesson_words (word_id);
create index if not exists idx_uwp_user               on public.user_word_progress (user_id);
create index if not exists idx_uwp_user_status        on public.user_word_progress (user_id, status);

-- ============================================================================
--  ROW LEVEL SECURITY
--  Nothing below is optional. With RLS enabled and these policies in place,
--  the anon key shipped to the browser can only ever touch the current user's
--  own rows — which is precisely why we can safely drop the API server.
-- ============================================================================

alter table public.profiles             enable row level security;
alter table public.hsk_words            enable row level security;
alter table public.lessons              enable row level security;
alter table public.lesson_words         enable row level security;
alter table public.user_word_progress   enable row level security;
alter table public.user_lesson_progress enable row level security;
alter table public.activity_log         enable row level security;

-- Course content: readable by any signed-in user, writable by nobody.
-- (Seeding is done from the SQL editor, which bypasses RLS as the owner.)
drop policy if exists "content readable by authenticated" on public.hsk_words;
create policy "content readable by authenticated"
  on public.hsk_words for select to authenticated using (true);

drop policy if exists "content readable by authenticated" on public.lessons;
create policy "content readable by authenticated"
  on public.lessons for select to authenticated using (true);

drop policy if exists "content readable by authenticated" on public.lesson_words;
create policy "content readable by authenticated"
  on public.lesson_words for select to authenticated using (true);

-- Profiles: you can read and update only your own.
drop policy if exists "own profile select" on public.profiles;
create policy "own profile select"
  on public.profiles for select to authenticated using (auth.uid() = id);

drop policy if exists "own profile update" on public.profiles;
create policy "own profile update"
  on public.profiles for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

-- Word progress: full control over your own rows only.
drop policy if exists "own word progress" on public.user_word_progress;
create policy "own word progress"
  on public.user_word_progress for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Lesson progress: same.
drop policy if exists "own lesson progress" on public.user_lesson_progress;
create policy "own lesson progress"
  on public.user_lesson_progress for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Activity log: you may read and append your own; no updates or deletes, so a
-- client can't retroactively fake a streak by rewriting history.
drop policy if exists "own activity select" on public.activity_log;
create policy "own activity select"
  on public.activity_log for select to authenticated using (auth.uid() = user_id);

drop policy if exists "own activity insert" on public.activity_log;
create policy "own activity insert"
  on public.activity_log for insert to authenticated with check (auth.uid() = user_id);
