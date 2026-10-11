// Test simulation for Unidad 6: 25 mixed questions, no feedback until the
// end, scored out of 20 like at school. Accent or article mistakes = half point.
import { useEffect, useRef, useState } from 'react'
import { checkAnswer } from '../lib/answer'
import { answerLang, finishAttempt, loadTestHistory, loadUnidad6Test, startAttempt } from '../lib/data'
import { ConjugationPrompt, VocabPrompt } from '../lib/modes'

const SPECIAL_CHARS = ['á', 'é', 'í', 'ó', 'ú', 'ñ']
const POINTS = { correct: 1, accent: 0.5, article: 0.5, wrong: 0 }
const TENSE_NL = {
  preterito_compuesto: 'Pretérito compuesto',
  imperfecto: 'Imperfecto',
  indefinido: 'Indefinido',
}

/** Points out of `max` → grade out of 20, rounded to half points. */
function toGrade(points, max) {
  return Math.round((points / max) * 20 * 2) / 2
}
/** Grades are stored ×10 as integers (15.5/20 → 155). */
const fromStored = (score) => score / 10

function QuestionPrompt({ exercise }) {
  switch (exercise.type) {
    case 'vocab':
      return <VocabPrompt exercise={exercise} />
    case 'conjugation':
      return <ConjugationPrompt exercise={exercise} />
    case 'marker_choice':
      return (
        <>
          <p className="small">Welke tijd past hier?</p>
          <p className="verb">{exercise.prompt.text}</p>
        </>
      )
    default: // gap_fill (nationalities)
      return (
        <>
          <p className="small">{exercise.prompt.label}</p>
          <p className="verb">{exercise.prompt.text}</p>
        </>
      )
  }
}

/** Short label of a question for the review list. */
function describe(ex) {
  if (ex.type === 'vocab') return ex.prompt.term
  if (ex.type === 'conjugation') return `${ex.prompt.pronoun} · ${ex.prompt.infinitive} · ${ex.prompt.tense}`
  return ex.prompt.text
}

/** The right answer as shown in the review list. */
function shownAnswer(ex) {
  if (ex.type === 'marker_choice') return `${TENSE_NL[ex.correct_answer]} (${ex.prompt.form})`
  return ex.correct_answer
}

export default function Test({ onHome }) {
  const [phase, setPhase] = useState('loading') // loading | intro | playing | saving | done
  const [questions, setQuestions] = useState([])
  const [topicId, setTopicId] = useState(null)
  const [history, setHistory] = useState([])
  const [index, setIndex] = useState(0)
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  const attemptId = useRef(null)
  const startTime = useRef(0)
  const answers = useRef([])
  const inputRef = useRef(null)

  useEffect(() => {
    loadUnidad6Test()
      .then(async ({ topicId, questions }) => {
        if (questions.length < 10) throw new Error('Te weinig vragen gevonden. Zijn alle SQL-bestanden uitgevoerd?')
        setTopicId(topicId)
        setQuestions(questions)
        setHistory(await loadTestHistory(topicId))
        setPhase('intro')
      })
      .catch((e) => setError(e.message))
  }, [])

  const exercise = questions[index]

  async function begin() {
    try {
      attemptId.current = await startAttempt('test', { scopeId: topicId })
      startTime.current = Date.now()
      setPhase('playing')
      setTimeout(() => inputRef.current?.focus(), 0)
    } catch (e) {
      setError(e.message)
    }
  }

  function answer(given) {
    if (phase !== 'playing' || !given.trim()) return
    const res = checkAnswer(given, exercise.correct_answer, exercise.accepted_answers, {
      lang: answerLang(exercise),
    })
    answers.current.push({
      exerciseId: exercise.id,
      given: given.trim(),
      result: res,
      elapsedMs: Date.now() - startTime.current,
    })
    setInput('')
    if (index + 1 < questions.length) {
      setIndex(index + 1)
      setTimeout(() => inputRef.current?.focus(), 0)
    } else {
      finish()
    }
  }

  async function finish() {
    setPhase('saving')
    const points = answers.current.reduce((sum, a) => sum + POINTS[a.result], 0)
    const grade = toGrade(points, questions.length)
    const durationMs = Date.now() - startTime.current

    // Points per section, for the breakdown
    const sections = {}
    answers.current.forEach((a, i) => {
      const s = questions[i].section
      sections[s] ??= { points: 0, max: 0 }
      sections[s].points += POINTS[a.result]
      sections[s].max += 1
    })

    try {
      await finishAttempt(attemptId.current, answers.current, {
        score: Math.round(grade * 10),
        correct: answers.current.filter((a) => a.result !== 'wrong').length,
        durationMs,
      })
      setResult({ grade, sections, durationMs })
      setPhase('done')
    } catch (e) {
      setError(e.message)
    }
  }

  if (error) {
    return (
      <main className="screen center">
        <p className="error">Er ging iets mis: {error}</p>
        <button className="btn" onClick={onHome}>Home</button>
      </main>
    )
  }

  if (phase === 'loading') return <main className="screen center"><p>Toets klaarzetten…</p></main>

  const previous = history.map((h) => fromStored(h.score))
  const best = previous.length ? Math.max(...previous) : null

  if (phase === 'intro') {
    return (
      <main className="screen center">
        <p className="small">Unidad 6 · ¡Vamos de viaje!</p>
        <h2 className="big">📝 Toets</h2>
        <div className="card test-info">
          <p><strong>{questions.length} vragen</strong>, elke keer anders:</p>
          <p className="small">Woordenschat · Nationaliteiten · Vervoegen · Welke tijd?</p>
          <p className="small">Je ziet de juiste antwoorden pas op het einde. Fout accent of lidwoord = halve punt.</p>
          {best !== null && <p>🏆 Je beste score: <strong>{best}/20</strong></p>}
        </div>
        <button className="btn primary huge" onClick={begin}>Start de toets</button>
        <button className="link" onClick={onHome}>Terug</button>
      </main>
    )
  }

  if (phase === 'done') {
    const byId = Object.fromEntries(questions.map((q) => [q.id, q]))
    const mistakes = answers.current
      .filter((a) => a.result !== 'correct')
      .map((a) => ({ ...a, exercise: byId[a.exerciseId] }))
    const last = previous[0] ?? null
    const minutes = Math.floor(result.durationMs / 60000)
    const seconds = Math.round((result.durationMs % 60000) / 1000)

    return (
      <main className="screen">
        <section className="card center">
          <p className="small">Toets Unidad 6</p>
          {(best === null || result.grade > best) && <p className="record">🏆 Nieuw record!</p>}
          <p className="final-score">{result.grade}<span className="out-of">/20</span></p>
          {last !== null && (
            <p className="small">
              Vorige keer {last}/20{' '}
              {result.grade > last ? '📈 beter!' : result.grade < last ? '📉 nog even oefenen' : '➡️ zelfde score'}
            </p>
          )}
          <p className="small">Tijd: {minutes}:{String(seconds).padStart(2, '0')}</p>
        </section>

        <section className="card">
          <h2>Per onderdeel</h2>
          {Object.entries(result.sections).map(([name, s]) => (
            <div key={name} className="section-row">
              <span>{name}</span>
              <div className="bar light"><div className="fill you" style={{ width: `${(s.points / s.max) * 100}%` }} /></div>
              <strong>{s.points}/{s.max}</strong>
            </div>
          ))}
        </section>

        {mistakes.length > 0 && (
          <section className="card">
            <h2>Verbeter je fouten</h2>
            <ul className="mistakes">
              {mistakes.map((m, i) => (
                <li key={i} className={m.result}>
                  <span className="small">{m.exercise.section} · {describe(m.exercise)}</span>
                  <span>
                    <s>{m.exercise.type === 'marker_choice' ? TENSE_NL[m.given] : m.given}</s> →{' '}
                    <strong>{shownAnswer(m.exercise)}</strong>
                  </span>
                  <span className="small">
                    {m.result === 'accent' && '½ punt: enkel het accent was fout.'}
                    {m.result === 'article' && '½ punt: enkel het lidwoord was fout.'}
                    {m.result === 'wrong' && m.exercise.feedback_nl}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="actions">
          <button className="btn primary" onClick={onHome}>Home</button>
        </div>
      </main>
    )
  }

  // playing / saving
  return (
    <main className="screen play">
      <div className="hud">
        <span className="small">{exercise.section}</span>
        <span className="score">{index + 1}<span className="out-of">/{questions.length}</span></span>
      </div>
      <div className="bar"><div className="fill you" style={{ width: `${(index / questions.length) * 100}%` }} /></div>

      <section className="card question" key={index}>
        <QuestionPrompt exercise={exercise} />

        {exercise.type === 'marker_choice' ? (
          <div className="options">
            {exercise.prompt.options.map((o, i) => (
              <button key={o} className="btn option" onClick={() => answer(o)} disabled={phase !== 'playing'}>
                <span className="key">{i + 1}</span> {TENSE_NL[o]}
              </button>
            ))}
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); answer(input) }}>
            <input
              ref={inputRef}
              className="answer"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              autoCapitalize="off"
              autoCorrect="off"
              autoComplete="off"
              spellCheck="false"
              disabled={phase !== 'playing'}
              placeholder="Typ je antwoord…"
            />
            {answerLang(exercise) === 'es' && (
              <div className="chars">
                {SPECIAL_CHARS.map((c) => (
                  <button type="button" key={c} className="char" onClick={() => { setInput((v) => v + c); inputRef.current?.focus() }}>{c}</button>
                ))}
              </div>
            )}
            <button className="btn primary next">{index + 1 < questions.length ? 'Volgende →' : 'Klaar!'}</button>
          </form>
        )}
      </section>

      {phase === 'saving' && <p className="center small">Toets verbeteren…</p>}
    </main>
  )
}
