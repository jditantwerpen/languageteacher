// Story mode: play a story from start to end, gap by gap, racing your ghost
// (your best previous run of this story). Combo scoring as in speed rounds.
import { useEffect, useRef, useState } from 'react'
import { checkAnswer } from '../lib/answer'
import { applyResult, ghostScoreAt, initialScore, multiplierFor } from '../lib/scoring'
import { answerLang, finishAttempt, loadGhost, loadStoryExercises, startAttempt } from '../lib/data'
import { AnswerArea, Flash, MistakeList, RichText } from '../components/Play'

const MODE = 'story'

/** Short label of a question for the mistakes list. */
const describe = (ex) =>
  ex.type === 'story_gap'
    ? `Hoofdstuk ${ex.prompt.chapter} · ${ex.prompt.label}`
    : ex.prompt.text.replace(/\*\*/g, '')

const fmtTime = (ms) => `${Math.floor(ms / 60000)}:${String(Math.round((ms % 60000) / 1000)).padStart(2, '0')}`

export default function Story({ story, onBack }) {
  const [phase, setPhase] = useState('loading') // loading | ready | playing | saving | done
  const [exercises, setExercises] = useState([])
  const [ghost, setGhost] = useState(null)
  const [index, setIndex] = useState(0)
  const [scoreState, setScoreState] = useState(initialScore)
  const [elapsed, setElapsed] = useState(0)
  const [flash, setFlash] = useState(null)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const attemptId = useRef(null)
  const startTime = useRef(0)
  const answers = useRef([])
  const inputRef = useRef(null)
  const scope = { scopeId: story.id }

  useEffect(() => {
    Promise.all([loadStoryExercises(story.id), loadGhost(MODE, scope)])
      .then(([ex, gh]) => {
        if (!ex.length) throw new Error('Dit verhaal heeft nog geen vragen.')
        setExercises(ex)
        setGhost(gh)
        setPhase('ready')
      })
      .catch((e) => setError(e.message))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story.id])

  // Stopwatch (counts up; the ghost moves along with it)
  useEffect(() => {
    if (phase !== 'playing') return
    const timer = setInterval(() => setElapsed(Date.now() - startTime.current), 200)
    return () => clearInterval(timer)
  }, [phase])

  async function begin() {
    try {
      attemptId.current = await startAttempt(MODE, scope)
      startTime.current = Date.now()
      setPhase('playing')
      setTimeout(() => inputRef.current?.focus(), 0)
    } catch (e) {
      setError(e.message)
    }
  }

  function answer(given) {
    if (phase !== 'playing') return
    const ex = exercises[index]
    const res = checkAnswer(given, ex.correct_answer, ex.accepted_answers, { lang: answerLang(ex) })
    answers.current.push({ exerciseId: ex.id, given: given.trim(), result: res, elapsedMs: Date.now() - startTime.current })
    setScoreState((s) => applyResult(s, res))
    setFlash({ result: res, correct: ex.correct_answer, feedback: ex.feedback_nl })
    if (index + 1 < exercises.length) {
      setIndex(index + 1)
      setTimeout(() => inputRef.current?.focus(), 0)
    } else {
      finish()
    }
  }

  async function finish() {
    setPhase('saving')
    const final = answers.current.reduce((s, a) => applyResult(s, a.result), initialScore)
    const correct = answers.current.filter((a) => a.result !== 'wrong').length
    const durationMs = Date.now() - startTime.current
    try {
      await finishAttempt(attemptId.current, answers.current, { score: final.score, correct, durationMs })
      setResult({ score: final.score, correct, durationMs })
      setPhase('done')
    } catch (e) {
      setError(e.message)
    }
  }

  if (error) {
    return (
      <main className="screen center">
        <p className="error">Er ging iets mis: {error}</p>
        <button className="btn" onClick={onBack}>Terug</button>
      </main>
    )
  }
  if (phase === 'loading') return <main className="screen center"><p>Verhaal laden…</p></main>

  if (phase === 'ready') {
    return (
      <main className="screen center">
        <p className="small">📖 Verhaal · {exercises.length} vragen</p>
        <h2 className="big">{story.title}</h2>
        <p>{ghost ? `Je record: ${ghost.bestScore} punten. Je ghost leest mee 👻` : 'Eerste keer: zet een record neer!'}</p>
        <p className="small">Lees het hele stukje, vul dan het open gat in. Let op de tijd: imperfecto, indefinido of compuesto?</p>
        <button className="btn primary huge" onClick={begin}>Start</button>
        <button className="link" onClick={onBack}>Terug</button>
      </main>
    )
  }

  if (phase === 'done') {
    const best = ghost?.bestScore ?? null
    const accuracy = Math.round((result.correct / exercises.length) * 100)
    return (
      <main className="screen">
        <section className="card center">
          <p className="small">📖 {story.title}</p>
          {(best === null || result.score > best) && <p className="record">🏆 Nieuw record!</p>}
          <p className="final-score">{result.score}</p>
          <p className="small">punten</p>
          <div className="stats">
            <div><strong>{accuracy}%</strong><span>juist</span></div>
            <div><strong>{fmtTime(result.durationMs)}</strong><span>tijd</span></div>
            <div><strong>{best ?? '–'}</strong><span>vorig record</span></div>
          </div>
        </section>
        <MistakeList answers={answers.current} exercises={exercises} describe={describe} />
        <div className="actions">
          <button className="btn primary" onClick={onBack}>Verhalen</button>
        </div>
      </main>
    )
  }

  // playing / saving
  const ex = exercises[index]
  const ghostScore = ghost ? ghostScoreAt(ghost.timeline, elapsed) : 0
  const barMax = Math.max(scoreState.score, ghost?.bestScore ?? 0, 100)
  const multiplier = multiplierFor(scoreState.streak)

  return (
    <main className="screen play">
      <div className="hud">
        <span className="clock">{fmtTime(elapsed)}</span>
        <span className="score">{scoreState.score}</span>
        <span className={`combo ${multiplier > 1 ? 'on' : ''}`}>x{multiplier}</span>
      </div>
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
        <p className="small">
          {ex.type === 'story_gap' ? `Hoofdstuk ${ex.prompt.chapter}` : ex.prompt.question_nl ?? 'Kies het juiste antwoord'}
          {' · '}vraag {index + 1}/{exercises.length}
        </p>
        <RichText text={ex.prompt.text} />
        <AnswerArea key={index} ref={inputRef} exercise={ex} disabled={phase !== 'playing'} onAnswer={answer} />
      </section>

      <Flash flash={flash} />
      {phase === 'saving' && <p className="center small">Opslaan…</p>}
    </main>
  )
}
