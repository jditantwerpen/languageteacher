# Taalspel

Competitive (but not social) language-learning app for Dutch-speaking students.
Frontend: React + Vite on Netlify. Backend: Supabase (auth, Postgres, RLS).

## What works now

- Login with email + password (no emails sent; "Confirm email" off in Supabase)
- New accounts need approval by an admin (teacher page "Beheer"), enforced by RLS
- Home with league tier (Brons → Diamant) per language
- **Speed round**: 60 seconds of conjugations, combo multiplier (x1 → x5),
  live race against your own ghost, accent warning (correct, but no combo bonus),
  personal records, and a list of mistakes with Dutch feedback
- **Vocabulary (Unidad 6)**: 146 words in 7 chapter parts, 4 levels
  (multiple choice ES→NL, multiple choice NL→ES, typing ES→NL, typing NL→ES),
  records and ghost per part and level, article warning in Spanish
- **Toets Unidad 6**: 25 random questions (vocab, nationalities, conjugation,
  tense choice), score out of 20, half point for accent/article mistakes,
  breakdown per section and comparison with the previous test
- **Spellen (tiempos del pasado)**: Marker detective (kies de tijd, 60 s), Verhalen
  (7 stories, gaps in reading order, ghost race), Boss battles (6 irregular groups,
  15 questions, 2 hearts, time limit; a win is stored as scope label 'won')
- **Leren**: theory summaries in Dutch (Unidad 6 and los tiempos del pasado,
  in `src/content/theory/`) and a searchable word list with self-quiz mode

## Database

The files are in `supabase/`. Run them in the Supabase SQL Editor, in this order (already done if you followed along):

1. `schema.sql`
2. migration v1.1 (Dutch columns)
3. `seed_01_es_pasado_verbs.sql`
4. `seed_02_es_pasado_exercises.sql`
5. `migration_v1_2_vocab.sql`
6. `seed_03_unidad6.sql`
7. `migration_v1_3_approval.sql` (account approval; admins = teachers)

## Local development

```bash
cp .env.example .env.local   # fill in URL and anon key
npm install
npm run dev                  # http://localhost:5173
```

## Project structure

```
src/
  supabase.js        Supabase client
  lib/answer.js      answer checking (accent rule)
  lib/scoring.js     points, combo, ghost replay
  lib/data.js        all database queries
  lib/modes.jsx      game modes (speed round, vocab levels)
  content/theory/    theory summaries (JSX)
  components/Play.jsx shared answer input, feedback and mistakes list
  screens/           Login, Pending, Admin, StoryMenu, Story, BossMenu, Boss, Home, Theory, WordList, VocabMenu, Round, Test, Result
```
