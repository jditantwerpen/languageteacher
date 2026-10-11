-- =====================================================================
-- Language Learning App — Supabase schema v1
-- Languages: Spanish, French, German
-- First topic: "Los tiempos del pasado" (pretérito compuesto,
-- imperfecto, pretérito indefinido)
--
-- Design principles:
--   * Content tables (verbs, exercises, stories, ...) are read-only for
--     students; only the import script (service role) writes to them.
--   * Student tables (attempts, records, SRS, ...) are private: each
--     student only sees their own rows (row-level security).
--   * Competition is personal only: no table exposes another student's data.
--   * Minimal personal data (GDPR, users are minors): display name and
--     guardian-consent timestamp only. No birth date, no email copies.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------------------

-- How an exercise is presented and checked
create type exercise_type as enum (
  'conjugation',      -- "tener → indefinido, yo" → tuve
  'marker_choice',    -- sentence with a time marker → pick the tense
  'gap_fill',         -- single sentence with a gap
  'multiple_choice',  -- pick one of several options
  'match',            -- match items (e.g. EJ 2 mezclados: 1c / 2f / ...)
  'story_gap',        -- gap inside a story chapter
  'translate'         -- Dutch sentence → target language ("ik heb gezongen" → he cantado)
);

-- The competitive game modes
create type game_mode as enum (
  'speed_round',      -- 60 s, combo multipliers
  'boss_battle',      -- one irregular group, must reach pass accuracy
  'marker_detective', -- tense choice based on time markers
  'story',            -- story chapters, raced against your ghost
  'daily_challenge',  -- same set for the day, beat the par score
  'practice'          -- SRS review, no pressure
);

-- Language-neutral grammatical person (works for es / fr / de)
create type grammatical_person as enum ('1sg','2sg','3sg','1pl','2pl','3pl');

-- ---------------------------------------------------------------------
-- CONTENT TABLES
-- ---------------------------------------------------------------------

create table languages (
  code  text primary key,          -- 'es', 'fr', 'de'
  name  text not null
);

-- A unit of course material, e.g. one uploaded handout
create table topics (
  id            uuid primary key default gen_random_uuid(),
  language_code text not null references languages(code),
  slug          text not null,
  title         text not null,
  source        text,              -- e.g. 'GO! KLA 6SP suplemento gramática'
  sort_order    int  not null default 0,
  unique (language_code, slug)
);

-- A grammar skill inside a topic, e.g. one tense
create table skills (
  id          uuid primary key default gen_random_uuid(),
  topic_id    uuid not null references topics(id) on delete cascade,
  slug        text not null,       -- 'preterito_compuesto', 'imperfecto', ...
  title       text not null,
  explanation_nl text,             -- short theory in Dutch, shown before playing
  sort_order  int  not null default 0,
  unique (topic_id, slug)
);

create table verbs (
  id             uuid primary key default gen_random_uuid(),
  language_code  text not null references languages(code),
  infinitive     text not null,
  translation_nl text,             -- Dutch translation, as in the handout
  unique (language_code, infinitive)
);

-- Every conjugated form we teach; feeds the speed rounds and bosses
create table verb_forms (
  id              uuid primary key default gen_random_uuid(),
  verb_id         uuid not null references verbs(id) on delete cascade,
  skill_id        uuid not null references skills(id) on delete cascade,
  person          grammatical_person not null,
  form            text not null,   -- 'tuve', 'he hecho', 'iba'
  is_irregular    boolean not null default false,
  irregular_group text,            -- 'indefinido_u', 'participio_irregular', ...
  unique (verb_id, skill_id, person)
);

-- Time markers that signal a tense (Parte 2 of the handout)
create table markers (
  id             uuid primary key default gen_random_uuid(),
  skill_id       uuid not null references skills(id) on delete cascade,
  phrase         text not null,    -- 'ayer', 'esta mañana', 'siempre'
  translation_nl text,
  note           text              -- e.g. 'cuando + imperf, de repente + indef'
);

-- Story mode: a story is split into chapters (exercises with story_id)
create table stories (
  id         uuid primary key default gen_random_uuid(),
  topic_id   uuid not null references topics(id) on delete cascade,
  slug       text not null,
  title      text not null,
  sort_order int  not null default 0,
  unique (topic_id, slug)
);

create table exercises (
  id               uuid primary key default gen_random_uuid(),
  topic_id         uuid not null references topics(id) on delete cascade,
  skill_id         uuid references skills(id) on delete set null,  -- null = mixed tenses
  story_id         uuid references stories(id) on delete cascade,  -- set for story_gap
  verb_form_id     uuid references verb_forms(id) on delete set null,
  type             exercise_type not null,
  -- Flexible prompt payload, shape depends on type, e.g.
  --   gap_fill:        {"text": "Yo ___ (visitar) muchos países este año."}
  --   multiple_choice: {"text": "...", "options": ["era","fue","ha sido"]}
  prompt           jsonb not null,
  correct_answer   text not null,
  accepted_answers text[] not null default '{}',  -- e.g. without accents
  hint_nl          text,           -- hint in Dutch (the student's language)
  feedback_nl      text,           -- why the answer is right, shown after answering
  tags             text[] not null default '{}',  -- used to build boss battles
  difficulty       smallint not null default 1 check (difficulty between 1 and 5),
  sort_order       int not null default 0,
  source_ref       text            -- traceability, e.g. 'p11 EJ1 #3'
);

-- A boss = a set of exercises selected by tag, with a pass threshold
create table bosses (
  id            uuid primary key default gen_random_uuid(),
  topic_id      uuid not null references topics(id) on delete cascade,
  slug          text not null,
  title         text not null,
  tag           text not null,     -- exercises with this tag form the fight
  pass_accuracy numeric(3,2) not null default 0.90,
  time_limit_s  int not null default 120,
  sort_order    int not null default 0,
  unique (topic_id, slug)
);

-- One fixed question set per language per day
create table daily_challenges (
  challenge_date date not null,
  language_code  text not null references languages(code),
  exercise_ids   uuid[] not null,
  par_score      int not null,
  primary key (challenge_date, language_code)
);

-- ---------------------------------------------------------------------
-- STUDENT TABLES
-- ---------------------------------------------------------------------

create table profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  display_name        text,
  avatar              text,
  guardian_consent_at timestamptz,   -- null = not yet confirmed
  created_at          timestamptz not null default now()
);

-- One play session in any mode
create table attempts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  mode          game_mode not null,
  language_code text not null references languages(code),
  scope_id      uuid,               -- boss / story / skill id, depending on mode
  daily_date    date,               -- set for daily_challenge
  started_at    timestamptz not null default now(),
  finished_at   timestamptz,        -- null while playing
  score         int not null default 0,
  correct_count int not null default 0,
  total_count   int not null default 0,
  duration_ms   int
);

-- Every answer, with timing: this is what the "ghost" replays
create table attempt_answers (
  id          uuid primary key default gen_random_uuid(),
  attempt_id  uuid not null references attempts(id) on delete cascade,
  exercise_id uuid not null references exercises(id) on delete cascade,
  seq         smallint not null,    -- order within the attempt
  given       text,
  is_correct  boolean not null,
  elapsed_ms  int not null,         -- time since attempt start
  unique (attempt_id, seq)
);

-- Best result per mode and scope; written by trigger only
create table personal_records (
  user_id         uuid not null references auth.users(id) on delete cascade,
  mode            game_mode not null,
  scope_key       text not null,    -- scope_id, daily date, or 'global'
  best_score      int not null,
  best_accuracy   numeric(4,3) not null,
  fastest_ms      int,
  best_attempt_id uuid references attempts(id) on delete set null,  -- the ghost
  updated_at      timestamptz not null default now(),
  primary key (user_id, mode, scope_key)
);

-- Spaced repetition state per student per exercise
create table srs_items (
  user_id       uuid not null references auth.users(id) on delete cascade,
  exercise_id   uuid not null references exercises(id) on delete cascade,
  ease          numeric(4,2) not null default 2.50,
  interval_days int not null default 0,
  reps          int not null default 0,
  lapses        int not null default 0,
  due_at        timestamptz not null default now(),
  primary key (user_id, exercise_id)
);

-- League points per language; tier is derived, never stored
create table league_points (
  user_id       uuid not null references auth.users(id) on delete cascade,
  language_code text not null references languages(code),
  points        int not null default 0,
  updated_at    timestamptz not null default now(),
  primary key (user_id, language_code)
);

-- ---------------------------------------------------------------------
-- INDEXES
-- ---------------------------------------------------------------------

create index on exercises (topic_id, skill_id);
create index on exercises (story_id, sort_order);
create index on exercises using gin (tags);
create index on verb_forms (skill_id, irregular_group);
create index on attempts (user_id, mode, scope_id);
create index on attempt_answers (attempt_id);
create index on attempt_answers (exercise_id);
create index on srs_items (user_id, due_at);

-- ---------------------------------------------------------------------
-- FUNCTIONS & TRIGGERS
-- ---------------------------------------------------------------------

-- Map points to a league tier (Bronze → Diamond)
create or replace function public.league_tier(p_points int)
returns text
language sql
immutable
as $$
  select case
    when p_points >= 20000 then 'Diamond'
    when p_points >= 8000  then 'Platinum'
    when p_points >= 3000  then 'Gold'
    when p_points >= 1000  then 'Silver'
    else 'Bronze'
  end;
$$;

-- When an attempt is finished: update personal records and league points.
-- Runs as definer so students cannot write records or points directly.
create or replace function public.on_attempt_finished()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_scope    text    := coalesce(new.scope_id::text, new.daily_date::text, 'global');
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

  -- Personal record: keep the best values; the best-scoring attempt is the ghost
  insert into personal_records as pr
    (user_id, mode, scope_key, best_score, best_accuracy, fastest_ms, best_attempt_id, updated_at)
  values
    (new.user_id, new.mode, v_scope, new.score, v_accuracy, new.duration_ms, new.id, now())
  on conflict (user_id, mode, scope_key) do update set
    best_attempt_id = case when excluded.best_score > pr.best_score
                           then excluded.best_attempt_id else pr.best_attempt_id end,
    best_score      = greatest(pr.best_score, excluded.best_score),
    best_accuracy   = greatest(pr.best_accuracy, excluded.best_accuracy),
    fastest_ms      = least(pr.fastest_ms, excluded.fastest_ms),  -- least() ignores nulls
    updated_at      = now();

  -- League points accumulate per language
  insert into league_points (user_id, language_code, points)
  values (new.user_id, new.language_code, greatest(new.score, 0))
  on conflict (user_id, language_code) do update set
    points     = league_points.points + excluded.points,
    updated_at = now();

  return new;
end;
$$;

create trigger trg_attempt_finished
  after insert or update of finished_at on attempts
  for each row execute function public.on_attempt_finished();

-- Create an empty profile when a student signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- VIEWS
-- ---------------------------------------------------------------------

-- Mastery per skill (drives the mastery map): accuracy over all answers.
-- security_invoker makes the view respect the caller's RLS.
create view v_skill_mastery
with (security_invoker = on) as
select
  a.user_id,
  e.skill_id,
  count(*)                                              as answered,
  count(*) filter (where aa.is_correct)                 as correct,
  round(avg(case when aa.is_correct then 1 else 0 end)::numeric, 3) as accuracy
from attempt_answers aa
join attempts  a on a.id = aa.attempt_id
join exercises e on e.id = aa.exercise_id
where e.skill_id is not null
group by a.user_id, e.skill_id;

-- League standing for the current student
create view v_my_league
with (security_invoker = on) as
select user_id, language_code, points, public.league_tier(points) as tier
from league_points;

-- ---------------------------------------------------------------------
-- ROW-LEVEL SECURITY
-- ---------------------------------------------------------------------

-- Content: readable by any signed-in student, writable only by service role
alter table languages        enable row level security;
alter table topics           enable row level security;
alter table skills           enable row level security;
alter table verbs            enable row level security;
alter table verb_forms       enable row level security;
alter table markers          enable row level security;
alter table stories          enable row level security;
alter table exercises        enable row level security;
alter table bosses           enable row level security;
alter table daily_challenges enable row level security;

create policy read_content on languages        for select to authenticated using (true);
create policy read_content on topics           for select to authenticated using (true);
create policy read_content on skills           for select to authenticated using (true);
create policy read_content on verbs            for select to authenticated using (true);
create policy read_content on verb_forms       for select to authenticated using (true);
create policy read_content on markers          for select to authenticated using (true);
create policy read_content on stories          for select to authenticated using (true);
create policy read_content on exercises        for select to authenticated using (true);
create policy read_content on bosses           for select to authenticated using (true);
create policy read_content on daily_challenges for select to authenticated using (true);

-- Student data: own rows only
alter table profiles         enable row level security;
alter table attempts         enable row level security;
alter table attempt_answers  enable row level security;
alter table personal_records enable row level security;
alter table srs_items        enable row level security;
alter table league_points    enable row level security;

create policy own_profile_select on profiles for select to authenticated
  using (id = auth.uid());
create policy own_profile_update on profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy own_attempts_select on attempts for select to authenticated
  using (user_id = auth.uid());
create policy own_attempts_insert on attempts for insert to authenticated
  with check (user_id = auth.uid());
-- Attempts can only be edited while still running (no rewriting old scores)
create policy own_attempts_update on attempts for update to authenticated
  using (user_id = auth.uid() and finished_at is null)
  with check (user_id = auth.uid());

create policy own_answers_select on attempt_answers for select to authenticated
  using (exists (select 1 from attempts a
                 where a.id = attempt_id and a.user_id = auth.uid()));
create policy own_answers_insert on attempt_answers for insert to authenticated
  with check (exists (select 1 from attempts a
                      where a.id = attempt_id and a.user_id = auth.uid()
                        and a.finished_at is null));

-- Records and points: read-only for students (written by the trigger)
create policy own_records_select on personal_records for select to authenticated
  using (user_id = auth.uid());
create policy own_points_select on league_points for select to authenticated
  using (user_id = auth.uid());

create policy own_srs_all on srs_items for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------
-- SEED: base data for the first topic
-- ---------------------------------------------------------------------

insert into languages (code, name) values
  ('es', 'Español'), ('fr', 'Français'), ('de', 'Deutsch');

with t as (
  insert into topics (language_code, slug, title, source)
  values ('es', 'tiempos-del-pasado', 'Los tiempos del pasado',
          'GO! KLA 6SP – suplemento gramática')
  returning id
), s as (
  insert into skills (topic_id, slug, title, sort_order)
  select t.id, v.slug, v.title, v.ord from t,
    (values ('preterito_compuesto', 'Pretérito compuesto', 1),
            ('imperfecto',          'Imperfecto',          2),
            ('indefinido',          'Pretérito indefinido', 3)) as v(slug, title, ord)
  returning id
)
insert into bosses (topic_id, slug, title, tag, sort_order)
select t.id, v.slug, v.title, v.tag, v.ord from t,
  (values ('participios',  'Participios irregulares',    'participio_irregular', 1),
          ('imperf-irreg', 'Imperfecto: ir, ser, ver',   'imperfecto_irregular', 2),
          ('indef-i',      'Indefinido: verbos con i',   'indefinido_i',         3),
          ('indef-j',      'Indefinido: verbos con j',   'indefinido_j',         4),
          ('indef-u',      'Indefinido: verbos con u',   'indefinido_u',         5),
          ('indef-cambio', 'Indefinido: e→i, o→u, y',    'indefinido_cambio',    6))
  as v(slug, title, tag, ord);
