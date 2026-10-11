// All database access lives here, so screens stay free of query details.
import { supabase } from '../supabase'
import { checkAnswer } from './answer'
import { ghostTimeline } from './scoring'

const TOPIC_SLUG = 'tiempos-del-pasado'
const LANGUAGE = 'es'

/** Throw on Supabase errors so callers can use plain try/catch. */
function unwrap({ data, error }) {
  if (error) throw error
  return data
}

/** The tense skills of the Spanish topic, in teaching order. */
export async function loadSkills() {
  return unwrap(
    await supabase
      .from('skills')
      .select('id, slug, title, sort_order, topics!inner(slug, language_code)')
      .eq('topics.slug', TOPIC_SLUG)
      .eq('topics.language_code', LANGUAGE)
      .order('sort_order'),
  )
}

/** League standing for the current student (null before the first round). */
export async function loadLeague() {
  const rows = unwrap(
    await supabase.from('v_my_league').select('points, tier').eq('language_code', LANGUAGE),
  )
  return rows[0] ?? { points: 0, tier: 'Bronze' }
}

/** Conjugation exercises, optionally limited to one tense, shuffled. */
export async function loadConjugations(skillId) {
  let query = supabase
    .from('exercises')
    .select('id, prompt, correct_answer, accepted_answers, feedback_nl')
    .eq('type', 'conjugation')
    .limit(1000)
  if (skillId) query = query.eq('skill_id', skillId)

  const rows = unwrap(await query)
  // Fisher–Yates shuffle
  for (let i = rows.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[rows[i], rows[j]] = [rows[j], rows[i]]
  }
  return rows
}

/** Scope key exactly as the database trigger builds it. */
export function scopeKey(skillId) {
  return skillId ?? 'global'
}

/**
 * The student's best previous run for this mode/scope, as a ghost.
 * Returns { bestScore, timeline } or null when there is no record yet.
 */
export async function loadGhost(mode, skillId) {
  const records = unwrap(
    await supabase
      .from('personal_records')
      .select('best_score, best_attempt_id')
      .eq('mode', mode)
      .eq('scope_key', scopeKey(skillId)),
  )
  const record = records[0]
  if (!record?.best_attempt_id) return null

  const answers = unwrap(
    await supabase
      .from('attempt_answers')
      .select('elapsed_ms, given, exercises(correct_answer, accepted_answers)')
      .eq('attempt_id', record.best_attempt_id)
      .order('seq'),
  )
  const timeline = ghostTimeline(answers, (a) =>
    checkAnswer(a.given, a.exercises.correct_answer, a.exercises.accepted_answers),
  )
  return { bestScore: record.best_score, timeline }
}

/** Open a new attempt; returns its id. */
export async function startAttempt(mode, skillId) {
  const { data: auth } = await supabase.auth.getUser()
  const row = unwrap(
    await supabase
      .from('attempts')
      .insert({ user_id: auth.user.id, mode, language_code: LANGUAGE, scope_id: skillId ?? null })
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
