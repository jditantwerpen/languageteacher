// Speed round: 60 seconds of conjugations, combo multiplier, live ghost.
import { useEffect, useRef, useState } from 'react'
import { checkAnswer } from '../lib/answer'
import { applyResult, ghostScoreAt, initialScore, multiplierFor } from '../lib/scoring'
import { finishAttempt, loadConjugations, loadGhost, startAttempt } from '../lib/data'

const ROUND_MS = 60_000
const MODE = 'speed_round'
const SPECIAL_CHARS = ['á', 'é', 'í', 'ó', 'ú', 'ñ']

export default function SpeedRound({ skillId, title, onDone, onQuit }) {
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
    Promise.all([loadConjugations(skillId), loadGhost(MODE, skillId)])
      .then(([ex, gh]) => {
        setExercises(ex)
        setGhost(gh)
        setPhase('ready')
      })
      .catch((e) => setError(e.message))
  }, [skillId])

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

  async function begin() {
    try {
      attemptId.current = await startAttempt(MODE, skillId)
      startTime.current = Date.now()
      setPhase('playing')
      setTimeout(() => inputRef.current?.focus(), 0)
    } catch (e) {
      setError(e.message)
    }
  }

  function submit(e) {
    e.preventDefault()
    if (phase !== 'playing' || !input.trim()) return

    const ex = exercises[index % exercises.length]
    const result = checkAnswer(input, ex.correct_answer, ex.accepted_answers)
    answers.current.push({
      exerciseId: ex.id,
      given: input.trim(),
      result,
      elapsedMs: Date.now() - startTime.current,
    })
    setScoreState((s) => applyResult(s, result))
    setFlash({ result, correct: ex.correct_answer, given: input.trim(), feedback: ex.feedback_nl })
    setInput('')
    setIndex((i) => i + 1)
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
      onDone({ ...totals, answers: answers.current, exercises, previousBest: ghost?.bestScore ?? null, title })
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
        <p className="small">Speed round · {title}</p>
        <h2 className="big">Klaar?</h2>
        <p>{ghost ? `Je record: ${ghost.bestScore} punten. Je ghost rent mee 👻` : 'Je eerste ronde: zet een record neer!'}</p>
        <button className="btn primary huge" onClick={begin}>Start!</button>
        <button className="link" onClick={onQuit}>Terug</button>
      </main>
    )
  }

  const ex = exercises[index % exercises.length]
  const p = ex.prompt
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
        <p className="small">{p.tense}</p>
        <p className="pronoun">{p.pronoun}</p>
        <p className="verb">{p.infinitive} <span className="nl">({p.translation_nl})</span></p>
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
            disabled={phase !== 'playing'}
            placeholder="Typ de vorm…"
          />
          <div className="chars">
            {SPECIAL_CHARS.map((c) => (
              <button type="button" key={c} className="char" onClick={() => insertChar(c)}>{c}</button>
            ))}
          </div>
        </form>
      </section>

      {flash && (
        <div className={`flash ${flash.result}`} key={`f${index}`}>
          {flash.result === 'correct' && '✓ Juist!'}
          {flash.result === 'accent' && <>⚠️ Let op: accent! <strong>{flash.correct}</strong></>}
          {flash.result === 'wrong' && <>✗ <strong>{flash.correct}</strong> <span className="small">— {flash.feedback}</span></>}
        </div>
      )}

      {phase === 'saving' && <p className="center small">Opslaan…</p>}
    </main>
  )
}
