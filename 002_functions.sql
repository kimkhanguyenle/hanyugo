-- ============================================================================
--  HanyuGo — Supabase / Postgres functions
--  Migration 002: the logic that used to live in the Cloudflare Worker API.
--
--  Run this SECOND in the Supabase SQL Editor (see SETUP.md step 3).
--
--  WHY FUNCTIONS INSTEAD OF AN API SERVER
--  --------------------------------------
--  The old backend had one purpose-built endpoint per screen so the Dashboard
--  didn't have to make 5 separate calls. Now that the browser talks to Postgres
--  directly, we keep that same benefit by moving the logic into SQL functions
--  the client calls with supabase.rpc(). Result: one round-trip, logic runs
--  next to the data (fast), and nothing extra to deploy or keep running.
--
--  All functions are SECURITY INVOKER by default and derive the user from
--  auth.uid() — never from a client-supplied id — so a caller cannot read or
--  write another learner's data even if they tamper with the request.
-- ============================================================================

-- Tunables, matching the old Worker's constants.
--   DAILY_GOAL_TARGET        = 5  (words correctly practiced today)
--   MASTERED_STREAK_THRESHOLD = 2 (correct_streak >= 2 counts as "known")

-- ---------------------------------------------------------------------------
-- get_dashboard_summary()
-- Everything the Dashboard screen needs, in one call.
-- Returns JSON shaped exactly like the old GET /api/dashboard-summary.
-- ---------------------------------------------------------------------------
create or replace function public.get_dashboard_summary()
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  uid              uuid := auth.uid();
  mastered_thresh  int  := 2;
  goal_target      int  := 5;
  v_streak         int  := 0;
  v_cursor         date;
  v_goal_done      int  := 0;
  v_active_level   int;
  v_lessons        jsonb;
  v_chars          jsonb;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  -- STREAK -------------------------------------------------------------
  -- Walk backwards day by day from today while activity exists. If today has
  -- no activity yet we start from yesterday, so a learner who simply hasn't
  -- practiced *yet today* doesn't see their streak collapse to zero before
  -- they've had the chance to keep it going.
  v_cursor := current_date;
  if not exists (
    select 1 from activity_log
    where user_id = uid and activity_date = current_date
  ) then
    v_cursor := current_date - 1;
  end if;

  while exists (
    select 1 from activity_log
    where user_id = uid and activity_date = v_cursor
  ) loop
    v_streak := v_streak + 1;
    v_cursor := v_cursor - 1;
  end loop;

  -- DAILY GOAL ---------------------------------------------------------
  select count(*) into v_goal_done
  from activity_log
  where user_id = uid
    and activity_date = current_date
    and kind = 'practice_correct';
  v_goal_done := least(v_goal_done, goal_target);

  -- ACTIVE LEVEL -------------------------------------------------------
  -- Whichever HSK level this learner has touched the most words in.
  -- Brand-new accounts fall back to HSK 1.
  select w.hsk_level into v_active_level
  from user_word_progress p
  join hsk_words w on w.id = p.word_id
  where p.user_id = uid
  group by w.hsk_level
  order by count(*) desc
  limit 1;
  v_active_level := coalesce(v_active_level, 1);

  -- CURRENT LESSONS ----------------------------------------------------
  -- Up to 2 lessons started but not finished at that level.
  select coalesce(jsonb_agg(t order by t."orderIndex"), '[]'::jsonb) into v_lessons
  from (
    select l.id,
           l.hsk_level  as "hskLevel",
           l.title,
           l.order_index as "orderIndex",
           count(lw.word_id)::int as total,
           coalesce(sum(case when p.correct_streak >= mastered_thresh then 1 else 0 end), 0)::int as known,
           case when count(lw.word_id) > 0
                then round(100.0 * coalesce(sum(case when p.correct_streak >= mastered_thresh then 1 else 0 end), 0)
                           / count(lw.word_id))::int
                else 0 end as percent
      from lessons l
      join lesson_words lw on lw.lesson_id = l.id
      left join user_word_progress p
             on p.word_id = lw.word_id and p.user_id = uid
     where l.hsk_level = v_active_level
     group by l.id, l.hsk_level, l.title, l.order_index
    having coalesce(sum(case when p.correct_streak >= mastered_thresh then 1 else 0 end), 0) > 0
       and coalesce(sum(case when p.correct_streak >= mastered_thresh then 1 else 0 end), 0) < count(lw.word_id)
     order by l.order_index
     limit 2
  ) t;

  -- Nothing in progress yet: suggest the first lesson of the level at 0%.
  if v_lessons = '[]'::jsonb then
    select coalesce(jsonb_agg(t), '[]'::jsonb) into v_lessons
    from (
      select l.id,
             l.hsk_level   as "hskLevel",
             l.title,
             l.order_index as "orderIndex",
             count(lw.word_id)::int as total,
             0 as known,
             0 as percent
        from lessons l
        join lesson_words lw on lw.lesson_id = l.id
       where l.hsk_level = v_active_level
       group by l.id, l.hsk_level, l.title, l.order_index
       order by l.order_index
       limit 1
    ) t;
  end if;

  -- CHARACTER SAMPLE ---------------------------------------------------
  select coalesce(jsonb_agg(t order by t.id), '[]'::jsonb) into v_chars
  from (
    select w.id,
           w.hanzi,
           w.pinyin,
           (coalesce(p.correct_streak, 0) >= mastered_thresh) as mastered
      from hsk_words w
      left join user_word_progress p
             on p.word_id = w.id and p.user_id = uid
     where w.hsk_level = v_active_level
     order by w.id
     limit 6
  ) t;

  return jsonb_build_object(
    'streak',          v_streak,
    'dailyGoal',       jsonb_build_object('completed', v_goal_done, 'target', goal_target),
    'activeLevel',     v_active_level,
    'currentLessons',  v_lessons,
    'characterSample', v_chars
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- record_practice_result(word_id, correct)
-- Called after each graded pinyin answer. Updates the streak counter for that
-- word AND appends the activity row in one atomic call, so the two can never
-- drift apart (a real risk when the client made two separate writes).
-- ---------------------------------------------------------------------------
create or replace function public.record_practice_result(
  p_word_id bigint,
  p_correct boolean
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  uid       uuid := auth.uid();
  v_streak  int;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  -- Correct answers advance the streak; a wrong answer resets it to 0.
  select case when p_correct then coalesce(correct_streak, 0) + 1 else 0 end
    into v_streak
    from user_word_progress
   where user_id = uid and word_id = p_word_id;

  if v_streak is null then
    v_streak := case when p_correct then 1 else 0 end;
  end if;

  insert into user_word_progress (user_id, word_id, correct_streak, status, updated_at)
  values (uid, p_word_id, v_streak,
          case when v_streak >= 2 then 'known' else 'learning' end,
          now())
  on conflict (user_id, word_id) do update
    set correct_streak = excluded.correct_streak,
        -- Never downgrade a word the learner deliberately starred for review.
        status = case
                   when user_word_progress.status = 'marked_for_review'
                     then 'marked_for_review'
                   else excluded.status
                 end,
        updated_at = now();

  insert into activity_log (user_id, activity_date, kind)
  values (uid, current_date,
          case when p_correct then 'practice_correct' else 'practice_attempt' end);

  return jsonb_build_object('ok', true, 'correctStreak', v_streak);
end;
$$;

-- ---------------------------------------------------------------------------
-- set_word_status(word_id, status, note)
-- Star / unstar a word for review, optionally with a note.
-- Preserves the existing note when the caller doesn't supply one.
-- ---------------------------------------------------------------------------
create or replace function public.set_word_status(
  p_word_id bigint,
  p_status  text,
  p_note    text default null
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  if p_status not in ('new', 'learning', 'known', 'marked_for_review') then
    raise exception 'Invalid status: %', p_status;
  end if;

  insert into user_word_progress (user_id, word_id, status, note, updated_at)
  values (uid, p_word_id, p_status, p_note, now())
  on conflict (user_id, word_id) do update
    set status     = excluded.status,
        note       = coalesce(excluded.note, user_word_progress.note),
        updated_at = now();

  insert into activity_log (user_id, activity_date, kind)
  values (uid, current_date, 'word_marked');

  return jsonb_build_object('ok', true);
end;
$$;

-- ---------------------------------------------------------------------------
-- get_review_queue()
-- Words the learner has starred, newest first, with their notes.
-- ---------------------------------------------------------------------------
create or replace function public.get_review_queue()
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  v   jsonb;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  select coalesce(jsonb_agg(t order by t.updated_at desc), '[]'::jsonb) into v
  from (
    select w.id, w.hanzi, w.pinyin, w.pinyin_numbered, w.meaning_en,
           w.hsk_level, w.part_of_speech,
           p.status, p.note, p.correct_streak, p.next_review_at, p.updated_at
      from user_word_progress p
      join hsk_words w on w.id = p.word_id
     where p.user_id = uid
       and p.status = 'marked_for_review'
  ) t;

  return v;
end;
$$;
