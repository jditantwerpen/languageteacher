// Generic 60-second round: typing or multiple choice, combo multiplier,
// live ghost. What is asked comes from the mode config (lib/modes.jsx).
import { useEffect, useMemo, useRef, useState } from 'react'
import { checkAnswer } from '../lib/answer'
import { applyResult, ghostScoreAt, initialScore, multiplierFor } from '../lib/scoring'
import { answerLang, finishAttempt, loadGhost, startAttempt } from '../lib/data'
import { buildOptions } from '../lib/modes'

const ROUND_MS = 60_000
const SPECIAL_CHARS = ['á', 'é', 'í', 'ó', 'ú', 'ñ']

export default function Round({ config, onDone, onQuit }) {
  const { mode, scope, title, kind, Prompt } = config

  const [phase, setPhase] = useState('loading') // loading | ready | playing | saving
  const [exercises, setExercises] = useState([])
  const [ghost, setGhost] = useState(null)
  const [index, setIndex] = useState(0)
  const [input, setInput] = useState('')
  const [scoreState, setScoreState] = useState(initialScore)
  const [elapsed, setElapsed] = useState(0)
  const [flash, setFlash] = useState(null) // feedback on the previous answer
  const [error, setError] = useState('')

  // Values that must not trigger re-renders
  const attemptId = useRef(null)
  const startTime = useRef(0)
  const answers = useRef([])
  const inputRef = useRef(null)
  const ended = useRef(false)

  // Load questions and ghost before the countdown starts
  useEffect(() => {
    Promise.all([config.load(), loadGhost(mode, scope)])
      .then(([ex, gh]) => {
        if (!ex.length) throw new Error('Geen vragen gevonden voor deze keuze.')
        setExercises(ex)
        setGhost(gh)
        setPhase('ready')
      })
      .catch((e) => setError(e.message))
    // config is created once per round
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Game clock
  useEffect(() => {
    if (phase !== 'playing') return
    const timer = setInterval(() => {
      const ms = Date.now() - startTime.current
      setElapsed(Math.min(ms, ROUND_MS))
      if (ms >= ROUND_MS) endRound()
    }, 100)
    return () => clearInterval(timer)
    // endRound reads refs only, so it is safe to omit from deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  const exercise = exercises.length ? exercises[index % exercises.length] : null

  // Multiple-choice options for the current question
  const options = useMemo(
    () => (kind === 'choice' && exercise ? buildOptions(exercise, exercises) : []),
    [kind, exercise, exercises],
  )

  // Keys 1–4 pick an option in multiple choice
  useEffect(() => {
    if (kind !== 'choice' || phase !== 'playing') return
    const onKey = (e) => {
      const n = Number(e.key)
      if (n >= 1 && n <= options.length) answer(options[n - 1])
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  async function begin() {
    try {
      attemptId.current = await startAttempt(mode, scope)
      startTime.current = Date.now()
      setPhase('playing')
      setTimeout(() => inputRef.current?.focus(), 0)
    } catch (e) {
      setError(e.message)
    }
  }

  /** Check one answer, update score, move to the next question. */
  function answer(given) {
    if (phase !== 'playing' || ended.current || !given.trim()) return
    const result = checkAnswer(given, exercise.correct_answer, exercise.accepted_answers, {
      lang: answerLang(exercise),
    })
    answers.current.push({
      exerciseId: exercise.id,
      given: given.trim(),
      result,
      elapsedMs: Date.now() - startTime.current,
    })
    setScoreState((s) => applyResult(s, result))
    setFlash({ result, correct: exercise.correct_answer, feedback: exercise.feedback_nl })
    setInput('')
    setIndex((i) => i + 1)
  }

  function submitTyped(e) {
    e.preventDefault()
    answer(input)
  }

  async function endRound() {
    // Guard with a ref: the clock may tick once more before React re-renders
    if (ended.current) return
    ended.current = true
    setPhase('saving')
    // Recompute from the stored answers so the saved score is exact
    const final = answers.current.reduce((s, a) => applyResult(s, a.result), initialScore)
    const totals = {
      score: final.score,
      correct: answers.current.filter((a) => a.result !== 'wrong').length,
      durationMs: ROUND_MS,
    }
    try {
      await finishAttempt(attemptId.current, answers.current, totals)
      onDone({ ...totals, answers: answers.current, exercises, previousBest: ghost?.bestScore ?? null })
    } catch (e) {
      setError(e.message)
    }
  }

  function insertChar(ch) {
    setInput((v) => v + ch)
    inputRef.current?.focus()
  }

  if (error) {
    return (
      <main className="screen center">
        <p className="error">Er ging iets mis: {error}</p>
        <button className="btn" onClick={onQuit}>Terug</button>
      </main>
    )
  }

  if (phase === 'loading') return <main className="screen center"><p>Laden…</p></main>

  if (phase === 'ready') {
    return (
      <main className="screen center">
        <p className="small">{title}</p>
        <h2 className="big">Klaar?</h2>
        <p>{ghost ? `Je record: ${ghost.bestScore} punten. Je ghost rent mee 👻` : 'Je eerste ronde: zet een record neer!'}</p>
        <button className="btn primary huge" onClick={begin}>Start!</button>
        <button className="link" onClick={onQuit}>Terug</button>
      </main>
    )
  }

  const secondsLeft = Math.ceil((ROUND_MS - elapsed) / 1000)
  const ghostScore = ghost ? ghostScoreAt(ghost.timeline, elapsed) : 0
  const barMax = Math.max(scoreState.score, ghost?.bestScore ?? 0, 100)
  const multiplier = multiplierFor(scoreState.streak)

  return (
    <main className="screen play">
      <div className="hud">
        <span className={`clock ${secondsLeft <= 10 ? 'hurry' : ''}`}>{secondsLeft}s</span>
        <span className="score">{scoreState.score}</span>
        <span className={`combo ${multiplier > 1 ? 'on' : ''}`}>x{multiplier}</span>
      </div>

      {/* Race bars: you vs. your ghost */}
      <div className="race">
        <div className="lane">
          <span className="lane-label">Jij</span>
          <div className="bar"><div className="fill you" style={{ width: `${(scoreState.score / barMax) * 100}%` }} /></div>
        </div>
        {ghost && (
          <div className="lane">
            <span className="lane-label">👻</span>
            <div className="bar"><div className="fill ghost" style={{ width: `${(ghostScore / barMax) * 100}%` }} /></div>
          </div>
        )}
      </div>

      <section className="card question" key={index}>
        <Prompt exercise={exercise} />

        {kind === 'choice' ? (
          <div className="options">
            {options.map((o, i) => (
              <button key={o} className="btn option" onClick={() => answer(o)} disabled={phase !== 'playing'}>
                <span className="key">{i + 1}</span> {o}
              </button>
            ))}
          </div>
        ) : (
          <form onSubmit={submitTyped}>
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
            {config.specialChars && (
              <div className="chars">
                {SPECIAL_CHARS.map((c) => (
                  <button type="button" key={c} className="char" onClick={() => insertChar(c)}>{c}</button>
                ))}
              </div>
            )}
          </form>
        )}
      </section>

      {flash && (
        <div className={`flash ${flash.result}`} key={`f${index}`}>
          {flash.result === 'correct' && '✓ Juist!'}
          {flash.result === 'accent' && <>⚠️ Let op: accent! <strong>{flash.correct}</strong></>}
          {flash.result === 'article' && <>⚠️ Let op: lidwoord! <strong>{flash.correct}</strong></>}
          {flash.result === 'wrong' && (
            <>✗ <strong>{flash.correct}</strong>{flash.feedback && <span className="small"> — {flash.feedback}</span>}</>
          )}
        </div>
      )}

      {phase === 'saving' && <p className="center small">Opslaan…</p>}
    </main>
  )
}
