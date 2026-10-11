// Game mode definitions. Each mode is a config object that the generic
// Round screen knows how to play:
//   mode       game_mode value stored with the attempt
//   scope      { scopeId, scopeLabel, level } → personal record + ghost
//   title      shown on start and result screens
//   kind       'type' (free input) or 'choice' (multiple choice)
//   load()     returns the exercises for the round
//   Prompt     component that shows the question
//   describe() one-line label for the mistakes list
import { answerLang, loadConjugations, loadVocab } from './data'

/** The four vocabulary levels: both directions, choice then typing. */
export const VOCAB_LEVELS = [
  { level: 1, emoji: '🟢', name: 'Herkennen', info: 'Meerkeuze · Spaans → Nederlands', direction: 'es_nl', kind: 'choice' },
  { level: 2, emoji: '🟡', name: 'Terugvinden', info: 'Meerkeuze · Nederlands → Spaans', direction: 'nl_es', kind: 'choice' },
  { level: 3, emoji: '🟠', name: 'Vertalen', info: 'Typen · Spaans → Nederlands', direction: 'es_nl', kind: 'type' },
  { level: 4, emoji: '🔴', name: 'Toetsniveau', info: 'Typen · Nederlands → Spaans, mét lidwoord en accenten', direction: 'nl_es', kind: 'type' },
]

export function ConjugationPrompt({ exercise }) {
  const p = exercise.prompt
  return (
    <>
      <p className="small">{p.tense}</p>
      <p className="pronoun">{p.pronoun}</p>
      <p className="verb">{p.infinitive} <span className="nl">({p.translation_nl})</span></p>
    </>
  )
}

export function VocabPrompt({ exercise }) {
  const p = exercise.prompt
  return (
    <>
      <p className="small">{p.direction === 'es_nl' ? '🇪🇸 → 🇳🇱' : '🇳🇱 → 🇪🇸'} · {p.category}</p>
      <p className="pronoun">{p.term}</p>
      {p.note && <p className="nl">{p.note}</p>}
    </>
  )
}

/** 60-second conjugation race (past tenses). */
export function speedRoundConfig({ skillId, title }) {
  return {
    mode: 'speed_round',
    scope: { scopeId: skillId ?? null },
    title: `Speed round · ${title}`,
    kind: 'type',
    specialChars: true,
    load: () => loadConjugations(skillId),
    Prompt: ConjugationPrompt,
    describe: (ex) => `${ex.prompt.pronoun} · ${ex.prompt.infinitive} · ${ex.prompt.tense}`,
  }
}

/** 60-second vocabulary race at one of the four levels. */
export function vocabConfig({ topicId, category, level }) {
  const lvl = VOCAB_LEVELS.find((l) => l.level === level)
  return {
    mode: 'vocab_race',
    scope: { scopeId: topicId, scopeLabel: category ?? null, level },
    title: `${lvl.emoji} ${lvl.name} · ${category ?? 'Alle woorden'}`,
    kind: lvl.kind,
    // Special characters only help when typing Spanish
    specialChars: lvl.kind === 'type' && lvl.direction === 'nl_es',
    load: () => loadVocab(topicId, lvl.direction, category),
    Prompt: VocabPrompt,
    describe: (ex) => ex.prompt.term,
  }
}

/**
 * Four answer options: the right one plus three others from the same
 * chapter part (harder to guess), filled up from the rest if needed.
 */
export function buildOptions(exercise, pool) {
  const others = pool.filter((e) => e.correct_answer !== exercise.correct_answer)
  const sameCategory = others.filter((e) => e.prompt.category === exercise.prompt.category)
  const picks = []
  for (const source of [sameCategory, others]) {
    for (const e of [...source].sort(() => Math.random() - 0.5)) {
      if (picks.length === 3) break
      if (!picks.includes(e.correct_answer)) picks.push(e.correct_answer)
    }
  }
  return [exercise.correct_answer, ...picks].sort(() => Math.random() - 0.5)
}

export { answerLang }
