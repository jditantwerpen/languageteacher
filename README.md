# Taalspel

Competitive (but not social) language-learning app for Dutch-speaking students.
Frontend: React + Vite on Netlify. Backend: Supabase (auth, Postgres, RLS).

## What works now

- Login with a magic link (no passwords)
- Home with league tier (Brons → Diamant) per language
- **Speed round**: 60 seconds of conjugations, combo multiplier (x1 → x5),
  live race against your own ghost, accent warning (correct, but no combo bonus),
  personal records, and a list of mistakes with Dutch feedback

## Database

The files are in `supabase/`. Run them in the Supabase SQL Editor, in this order (already done if you followed along):

1. `schema.sql`
2. migration v1.1 (Dutch columns)
3. `seed_01_es_pasado_verbs.sql`
4. `seed_02_es_pasado_exercises.sql`

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
  screens/           Login, Home, SpeedRound, Result
```
