// Answer checking.
// Agreed rules:
//  * a missing or wrong accent counts as correct, with a warning and no combo bonus
//  * Spanish: a missing or wrong article (el/la/...) is treated the same way
//  * Dutch: the article (de/het/een) does not matter at all

const ARTICLES = {
  es: /^(el|la|los|las|un|una)\s+/,
  nl: /^(de|het|een)\s+/,
}

/** Lowercase, trim and collapse whitespace. */
export function normalize(text) {
  return (text ?? '').toLowerCase().trim().replace(/\s+/g, ' ')
}

/** Remove all accents (á → a, ñ → n, ü → u). */
export function stripAccents(text) {
  return normalize(text).normalize('NFD').replace(/[̀-ͯ]/g, '')
}

function stripArticle(text, lang) {
  return normalize(text).replace(ARTICLES[lang] ?? /^$/, '')
}

/**
 * Compare a student's answer with the expected one.
 * @param {string}   given
 * @param {string}   correct
 * @param {string[]} accepted  other answers that also count
 * @param {{lang?: 'es' | 'nl'}} options  language of the expected answer
 * @returns {'correct' | 'accent' | 'article' | 'wrong'}
 */
export function checkAnswer(given, correct, accepted = [], { lang = 'es' } = {}) {
  const g = normalize(given)
  if (!g) return 'wrong'

  const targets = [correct, ...(accepted ?? [])].map(normalize)
  if (targets.includes(g)) return 'correct'

  if (lang === 'nl') {
    // Dutch articles never matter; accents only give a warning
    const gBare = stripArticle(g, 'nl')
    if (targets.some((t) => stripArticle(t, 'nl') === gBare)) return 'correct'
    if (targets.some((t) => stripAccents(stripArticle(t, 'nl')) === stripAccents(gBare))) return 'accent'
    return 'wrong'
  }

  // Spanish
  if (targets.some((t) => stripAccents(t) === stripAccents(g))) return 'accent'
  const gBare = stripAccents(stripArticle(g, 'es'))
  if (targets.some((t) => stripAccents(stripArticle(t, 'es')) === gBare)) return 'article'
  return 'wrong'
}

/** Results that count as correct (points, but maybe a warning). */
export const isRight = (result) => result !== 'wrong'
