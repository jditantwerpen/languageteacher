// Shared pieces for the sequential games (stories, boss battles):
// the answer input, the feedback flash and simple rich text.
import { forwardRef, useState } from 'react'
import { TENSE_NL } from '../lib/modes'

const SPECIAL_CHARS = ['á', 'é', 'í', 'ó', 'ú', 'ñ']

/** Label for an option: tense slugs get their Dutch-friendly name. */
export const optionLabel = (o) => TENSE_NL[o] ?? o

/**
 * Text with **bold** parts and the active gap "___" highlighted.
 * Used for story paragraphs and fable sentences.
 */
export function RichText({ text }) {
  const parts = text.split(/(\*\*[^*]+\*\*|___)/g)
  return (
    <p className="story-text">
      {parts.map((p, i) =>
        p === '___' ? <span key={i} className="gap">___</span>
        : p.startsWith('**') ? <b key={i}>{p.slice(2, -2)}</b>
        : p,
      )}
    </p>
  )
}

/**
 * Typed answer or multiple choice, depending on the exercise.
 * Calls onAnswer(text) once per question.
 */
export const AnswerArea = forwardRef(function AnswerArea({ exercise, disabled, onAnswer }, inputRef) {
  const [input, setInput] = useState('')
  const options = exercise.prompt.options

  if (options) {
    return (
      <div className="options">
        {options.map((o, i) => (
          <button key={o} className="btn option" disabled={disabled} onClick={() => onAnswer(o)}>
            <span className="key">{i + 1}</span> {optionLabel(o)}
          </button>
        ))}
      </div>
    )
  }

  function submit(e) {
    e.preventDefault()
    if (!input.trim()) return
    onAnswer(input)
    setInput('')
  }

  return (
    <form onSubmit={submit}>
      <input
        ref={inputRef}
        className="answer"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        autoCapitalize="off"
        autoCorrect="off"
        autoComplete="off"
        spellCheck="false"
        disabled={disabled}
        placeholder="Typ je antwoord…"
      />
      <div className="chars">
        {SPECIAL_CHARS.map((c) => (
          <button
            type="button"
            key={c}
            className="char"
            onClick={() => { setInput((v) => v + c); inputRef?.current?.focus() }}
          >
            {c}
          </button>
        ))}
      </div>
    </form>
  )
})

/** Feedback on the previous answer. */
export function Flash({ flash }) {
  if (!flash) return null
  const answer = optionLabel(flash.correct)
  return (
    <div className={`flash ${flash.result}`}>
      {flash.result === 'correct' && '✓ Juist!'}
      {flash.result === 'accent' && <>⚠️ Let op: accent! <strong>{answer}</strong></>}
      {flash.result === 'article' && <>⚠️ Let op: lidwoord! <strong>{answer}</strong></>}
      {flash.result === 'wrong' && (
        <>✗ <strong>{answer}</strong>{flash.feedback && <span className="small"> · {flash.feedback}</span>}</>
      )}
    </div>
  )
}

/** List of wrong or warned answers for an end screen. */
export function MistakeList({ answers, exercises, describe }) {
  const byId = Object.fromEntries(exercises.map((e) => [e.id, e]))
  const mistakes = answers.filter((a) => a.result !== 'correct')
  if (!mistakes.length) return null
  return (
    <section className="card">
      <h2>Leer van je fouten</h2>
      <ul className="mistakes">
        {mistakes.map((m, i) => {
          const ex = byId[m.exerciseId]
          return (
            <li key={i} className={m.result}>
              <span className="small">{describe(ex)}</span>
              <span><s>{optionLabel(m.given)}</s> → <strong>{optionLabel(ex.correct_answer)}</strong></span>
              {m.result === 'wrong' && ex.feedback_nl && <span className="small">{ex.feedback_nl}</span>}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
