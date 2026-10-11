// Scoring for speed rounds. One pure function, used both for the live
// game and for replaying the ghost, so both always use the same rules.

export const BASE_POINTS = 10
export const MAX_MULTIPLIER = 5

/** Multiplier grows by 1 every 3 correct answers in a row, up to x5. */
export function multiplierFor(streak) {
  return Math.min(1 + Math.floor(streak / 3), MAX_MULTIPLIER)
}

/**
 * Apply one answer result to the running state.
 * - correct: streak +1, points at the (new) multiplier
 * - accent:  base points only, streak unchanged (no combo bonus)
 * - wrong:   streak back to 0, no points
 */
export function applyResult(state, result) {
  if (result === 'correct') {
    const streak = state.streak + 1
    return { score: state.score + BASE_POINTS * multiplierFor(streak), streak }
  }
  if (result === 'accent') {
    return { score: state.score + BASE_POINTS, streak: state.streak }
  }
  return { score: state.score, streak: 0 }
}

export const initialScore = { score: 0, streak: 0 }

/**
 * Turn the ghost's stored answers into a timeline of [elapsedMs, score],
 * so the ghost bar can be drawn at any moment of the new round.
 */
export function ghostTimeline(answers, check) {
  let state = initialScore
  return answers.map((a) => {
    state = applyResult(state, check(a))
    return [a.elapsed_ms, state.score]
  })
}

/** Ghost score at a given elapsed time. */
export function ghostScoreAt(timeline, elapsedMs) {
  let score = 0
  for (const [t, s] of timeline) {
    if (t > elapsedMs) break
    score = s
  }
  return score
}
