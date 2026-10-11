// All database access lives here, so screens stay free of query details.
import { supabase } from '../supabase'
import { checkAnswer } from './answer'
import { ghostTimeline } from './scoring'

export const TOPICS = {
  pasado: 'tiempos-del-pasado',
  unidad6: 'unidad-6',
}
const LANGUAGE = 'es'

/** Throw on Supabase errors so callers can use plain try/catch. */
function unwrap({ data, error }) {
  if (error) throw error
  return data
}

/** Fisher–Yates shuffle (in place, returns the array). */
export function shuffle(rows) {
  for (let i = rows.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[rows[i], rows[j]] = [rows[j], rows[i]]
  }
  return rows
}

/** Language of the expected answer for an exercise. */
export function answerLang(exercise) {
  return exercise.prompt?.direction === 'es_nl' ? 'nl' : 'es'
}

// ---------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------

/** Tense skills of the past-tenses topic, in teaching order. */
export async function loadSkills() {
  return unwrap(
    await supabase
      .from('skills')
      .select('id, slug, title, sort_order, topics!inner(slug, language_code)')
      .eq('topics.slug', TOPICS.pasado)
      .eq('topics.language_code', LANGUAGE)
      .order('sort_order'),
  )
}

/** Conjugation exercises, optionally limited to one tense, shuffled. */
export async function loadConjugations(skillId) {
  let query = supabase
    .from('exercises')
    .select('id, type, prompt, correct_answer, accepted_answers, feedback_nl')
    .eq('type', 'conjugation')
    .limit(1000)
  if (skillId) query = query.eq('skill_id', skillId)
  return shuffle(unwrap(await query))
}

/** Topic id and the chapter parts (categories) with word counts. */
export async function loadVocabOverview(topicSlug) {
  const rows = unwrap(
    await supabase
      .from('vocab_items')
      .select('category, sort_order, topics!inner(id, slug, title)')
      .eq('topics.slug', topicSlug)
      .order('sort_order'),
  )
  const categories = []
  for (const r of rows) {
    const found = categories.find((c) => c.name === r.category)
    if (found) found.count++
    else categories.push({ name: r.category, count: 1 })
  }
  return {
    topicId: rows[0]?.topics.id ?? null,
    title: rows[0]?.topics.title ?? '',
    total: rows.length,
    categories,
  }
}

/** All words of a chapter, in list order, plus the chapter title. */
export async function loadVocabItems(topicSlug) {
  const rows = unwrap(
    await supabase
      .from('vocab_items')
      .select('id, term_es, term_nl, category, note_nl, sort_order, topics!inner(slug, title)')
      .eq('topics.slug', topicSlug)
      .order('sort_order'),
  )
  return { title: rows[0]?.topics.title ?? '', items: rows }
}

/** Vocab exercises for one direction, optionally one chapter part, shuffled. */
export async function loadVocab(topicId, direction, category) {
  let query = supabase
    .from('exercises')
    .select('id, type, prompt, correct_answer, accepted_answers, feedback_nl')
    .eq('type', 'vocab')
    .eq('topic_id', topicId)
    .eq('prompt->>direction', direction)
    .limit(1000)
  if (category) query = query.eq('prompt->>category', category)
  return shuffle(unwrap(await query))
}

/** Id of a topic by its slug. */
export async function loadTopicId(topicSlug) {
  const rows = unwrap(
    await supabase.from('topics').select('id').eq('slug', topicSlug).eq('language_code', LANGUAGE),
  )
  if (!rows.length) throw new Error(`Hoofdstuk '${topicSlug}' niet gevonden.`)
  return rows[0].id
}

/** Exercises of one type within one topic, shuffled. */
async function loadByType(topicId, type) {
  return shuffle(
    unwrap(
      await supabase
        .from('exercises')
        .select('id, type, prompt, correct_answer, accepted_answers, feedback_nl')
        .eq('topic_id', topicId)
        .eq('type', type)
        .limit(1000),
    ),
  )
}

/**
 * Questions for the Unidad 6 test, grouped in sections.
 * Vocabulary and nationalities come from Unidad 6; conjugations and
 * tense choice come from the past-tenses topic (part of the chapter).
 */
export async function loadUnidad6Test() {
  const [u6, pasado] = await Promise.all([loadTopicId(TOPICS.unidad6), loadTopicId(TOPICS.pasado)])
  const [vocabEsNl, vocabNlEs, nationalities, conjugations, markers] = await Promise.all([
    loadVocab(u6, 'es_nl'),
    loadVocab(u6, 'nl_es'),
    loadByType(u6, 'gap_fill'),
    loadByType(pasado, 'conjugation'),
    loadByType(pasado, 'marker_choice'),
  ])
  const tag = (rows, n, section) => rows.slice(0, n).map((e) => ({ ...e, section }))
  return {
    topicId: u6,
    questions: [
      ...tag(vocabEsNl, 5, 'Woordenschat'),
      ...tag(vocabNlEs, 5, 'Woordenschat'),
      ...tag(nationalities, 5, 'Nationaliteiten'),
      ...tag(conjugations, 5, 'Vervoegen'),
      ...tag(markers, 5, 'Welke tijd?'),
    ],
  }
}

/** The student's last finished tests for a topic, newest first. */
export async function loadTestHistory(topicId) {
  return unwrap(
    await supabase
      .from('attempts')
      .select('score, finished_at')
      .eq('mode', 'test')
      .eq('scope_id', topicId)
      .not('finished_at', 'is', null)
      .order('finished_at', { ascending: false })
      .limit(5),
  )
}

/** League standing for the current student. */
export async function loadLeague() {
  const rows = unwrap(
    await supabase.from('v_my_league').select('points, tier').eq('language_code', LANGUAGE),
  )
  return rows[0] ?? { points: 0, tier: 'Bronze' }
}

// ---------------------------------------------------------------------
// Attempts, records and ghosts
// ---------------------------------------------------------------------

/**
 * Record key exactly as the database trigger builds it:
 * <scopeId | 'global'>[:<scopeLabel>][:L<level>]
 */
export function scopeKey({ scopeId, scopeLabel, level }) {
  return (
    (scopeId ?? 'global') +
    (scopeLabel ? `:${scopeLabel}` : '') +
    (level ? `:L${level}` : '')
  )
}

/**
 * The student's best previous run for this mode/scope, as a ghost.
 * Returns { bestScore, timeline } or null when there is no record yet.
 */
export async function loadGhost(mode, scope) {
  const records = unwrap(
    await supabase
      .from('personal_records')
      .select('best_score, best_attempt_id')
      .eq('mode', mode)
      .eq('scope_key', scopeKey(scope)),
  )
  const record = records[0]
  if (!record?.best_attempt_id) return null

  const answers = unwrap(
    await supabase
      .from('attempt_answers')
      .select('elapsed_ms, given, exercises(correct_answer, accepted_answers, prompt)')
      .eq('attempt_id', record.best_attempt_id)
      .order('seq'),
  )
  const timeline = ghostTimeline(answers, (a) =>
    checkAnswer(a.given, a.exercises.correct_answer, a.exercises.accepted_answers, {
      lang: answerLang(a.exercises),
    }),
  )
  return { bestScore: record.best_score, timeline }
}

/** Open a new attempt; returns its id. */
export async function startAttempt(mode, scope) {
  const { data: auth } = await supabase.auth.getUser()
  const row = unwrap(
    await supabase
      .from('attempts')
      .insert({
        user_id: auth.user.id,
        mode,
        language_code: LANGUAGE,
        scope_id: scope.scopeId ?? null,
        scope_label: scope.scopeLabel ?? null,
        level: scope.level ?? null,
      })
      .select('id')
      .single(),
  )
  return row.id
}

/**
 * Save all answers, then close the attempt. Closing fires the database
 * trigger that updates personal records and league points.
 * Order matters: answers can only be added while the attempt is open.
 */
export async function finishAttempt(attemptId, answers, totals) {
  if (answers.length) {
    unwrap(
      await supabase.from('attempt_answers').insert(
        answers.map((a, i) => ({
          attempt_id: attemptId,
          exercise_id: a.exerciseId,
          seq: i + 1,
          given: a.given,
          is_correct: a.result !== 'wrong',
          elapsed_ms: a.elapsedMs,
        })),
      ),
    )
  }
  unwrap(
    await supabase
      .from('attempts')
      .update({
        finished_at: new Date().toISOString(),
        score: totals.score,
        correct_count: totals.correct,
        total_count: answers.length,
        duration_ms: totals.durationMs,
      })
      .eq('id', attemptId),
  )
}
