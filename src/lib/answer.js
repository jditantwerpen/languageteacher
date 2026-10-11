// Answer checking.
// Rule agreed for the app: a missing or wrong accent counts as correct,
// but with a warning and without combo bonus.

/** Lowercase, trim and collapse whitespace. */
export function normalize(text) {
  return (text ?? '').toLowerCase().trim().replace(/\s+/g, ' ')
}

/** Remove all accents (á → a, ñ → n, ü → u). */
export function stripAccents(text) {
  return normalize(text).normalize('NFD').replace(/[̀-ͯ]/g, '')
}

/**
 * Compare a student's answer with the expected one.
 * @returns {'correct' | 'accent' | 'wrong'}
 */
export function checkAnswer(given, correct, accepted = []) {
  const g = normalize(given)
  if (!g) return 'wrong'

  const targets = [correct, ...accepted].map(normalize)
  if (targets.includes(g)) return 'correct'

  const gPlain = stripAccents(g)
  if (targets.some((t) => stripAccents(t) === gPlain)) return 'accent'

  return 'wrong'
}
