-- =====================================================================
-- Migration v1.1 → v1.2: vocabulary games
--   * vocab_items: one row per word, Spanish ↔ Dutch
--   * exercises.vocab_item_id: links the two vocab exercises
--     (ES→NL and NL→ES) to their word
--   * attempts.level + attempts.scope_label: personal records per
--     chapter part and per level (level 1–4)
--   * new enum values for vocab rounds and (later) test mode
-- Run once in the Supabase SQL Editor, BEFORE seed_03.
-- =====================================================================

alter type exercise_type add value if not exists 'vocab';
alter type game_mode     add value if not exists 'vocab_race';
alter type game_mode     add value if not exists 'test';

-- One word or expression to learn
create table if not exists vocab_items (
  id          uuid primary key default gen_random_uuid(),
  topic_id    uuid not null references topics(id) on delete cascade,
  term_es     text not null,          -- shown form, e.g. 'la maleta'
  term_nl     text not null,          -- shown form, e.g. 'de koffer, de valies'
  category    text not null,          -- chapter part in Dutch, e.g. 'Op reis'
  note_nl     text,                   -- extra info, e.g. '1ª p. = propongo'
  sort_order  int  not null default 0,
  source_ref  text,
  unique (topic_id, term_es)
);

alter table vocab_items enable row level security;
create policy read_content on vocab_items for select to authenticated using (true);

alter table exercises add column if not exists
  vocab_item_id uuid references vocab_items(id) on delete cascade;
create index if not exists exercises_vocab_item_idx on exercises (vocab_item_id);

-- Level (1–4) and a free-text scope (e.g. the chapter part) for records
alter table attempts add column if not exists level       smallint;
alter table attempts add column if not exists scope_label text;

-- Personal records now distinguish scope label and level.
-- Key format: <scope_id | daily date | 'global'>[:<scope_label>][:L<level>]
create or replace function public.on_attempt_finished()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_scope    text    := coalesce(new.scope_id::text, new.daily_date::text, 'global')
                        || coalesce(':' || new.scope_label, '')
                        || coalesce(':L' || new.level, '');
  v_accuracy numeric := case when new.total_count > 0
                             then new.correct_count::numeric / new.total_count
                             else 0 end;
begin
  -- Only act on the transition "not finished" → "finished"
  if new.finished_at is null then
    return new;
  end if;
  if tg_op = 'UPDATE' and old.finished_at is not null then
    return new;
  end if;

  insert into personal_records as pr
    (user_id, mode, scope_key, best_score, best_accuracy, fastest_ms, best_attempt_id, updated_at)
  values
    (new.user_id, new.mode, v_scope, new.score, v_accuracy, new.duration_ms, new.id, now())
  on conflict (user_id, mode, scope_key) do update set
    best_attempt_id = case when excluded.best_score > pr.best_score
                           then excluded.best_attempt_id else pr.best_attempt_id end,
    best_score      = greatest(pr.best_score, excluded.best_score),
    best_accuracy   = greatest(pr.best_accuracy, excluded.best_accuracy),
    fastest_ms      = least(pr.fastest_ms, excluded.fastest_ms),
    updated_at      = now();

  insert into league_points (user_id, language_code, points)
  values (new.user_id, new.language_code, greatest(new.score, 0))
  on conflict (user_id, language_code) do update set
    points     = league_points.points + excluded.points,
    updated_at = now();

  return new;
end;
$$;
