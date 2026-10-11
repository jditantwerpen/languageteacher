// Boss battle: beat one group of irregular verbs. Every right answer hits
// the boss, every wrong answer costs a heart. Win = all questions answered
// with at most one mistake (≥ 90%) before the time runs out.
import { useEffect, useRef, useState } from 'react'
import { checkAnswer } from '../lib/answer'
import { applyResult, initialScore } from '../lib/scoring'
import { answerLang, finishAttempt, loadBossExercises, startAttempt } from '../lib/data'
import { ConjugationPrompt } from '../lib/modes'
import { AnswerArea, Flash, MistakeList } from '../components/Play'

const MODE = 'boss_battle'
const QUESTIONS = 15
const HEARTS = 2 // the second mistake loses the fight

const describe = (ex) => `${ex.prompt.pronoun} · ${ex.prompt.infinitive} · ${ex.prompt.tense}`

export default function Boss({ boss, emoji, onBack }) {
  const [phase, setPhase] = useState('loading') // loading | ready | playing | saving | done
  const [exercises, setExercises] = useState([])
  const [index, setIndex] = useState(0)
  const [hearts, setHearts] = useState(HEARTS)
  const [hit, setHit] = useState(false) // short shake animation
  const [elapsed, setElapsed] = useState(0)
  const [flash, setFlash] = useState(null)
  const [outcome, setOutcome] = useState(null) // { won, reason, score, correct }
  const [error, setError] = useState('')

  const attemptId = useRef(null)
  const startTime = useRef(0)
  const answers = useRef([])
  const inputRef = useRef(null)
  const ended = useRef(false)
  const limitMs = boss.time_limit_s * 1000

  useEffect(() => {
    loadBossExercises(boss.tag, QUESTIONS)
      .then((ex) => {
        if (!ex.length) throw new Error('Geen vragen gevonden voor deze boss.')
        setExercises(ex)
        setPhase('ready')
      })
      .catch((e) => setError(e.message))
  }, [boss.tag])

  // Countdown; running out of time loses the fight
  useEffect(() => {
    if (phase !== 'playing') return
    const timer = setInterval(() => {
      const ms = Date.now() - startTime.current
      setElapsed(Math.min(ms, limitMs))
      if (ms >= limitMs) end(false, 'time')
    }, 200)
    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  async function begin() {
    try {
      attemptId.current = await startAttempt(MODE, { scopeId: boss.id })
      startTime.current = Date.now()
      setPhase('playing')
      setTimeout(() => inputRef.current?.focus(), 0)
    } catch (e) {
      setError(e.message)
    }
  }

  function answer(given) {
    if (phase !== 'playing' || ended.current) return
    const ex = exercises[index]
    const res = checkAnswer(given, ex.correct_answer, ex.accepted_answers, { lang: answerLang(ex) })
    answers.current.push({ exerciseId: ex.id, given: given.trim(), result: res, elapsedMs: Date.now() - startTime.current })
    setFlash({ result: res, correct: ex.correct_answer, feedback: ex.feedback_nl })

    if (res === 'wrong') {
      const left = hearts - 1
      setHearts(left)
      if (left === 0) return end(false, 'hearts')
    } else {
      setHit(true)
      setTimeout(() => setHit(false), 300)
    }
    if (index + 1 >= exercises.length) return end(true, 'won')
    setIndex(index + 1)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  async function end(won, reason) {
    if (ended.current) return
    ended.current = true
    setPhase('saving')
    const score = answers.current.reduce((s, a) => applyResult(s, a.result), initialScore).score
    const correct = answers.current.filter((a) => a.result !== 'wrong').length
    try {
      await finishAttempt(attemptId.current, answers.current, {
        score,
        correct,
        total: exercises.length, // unanswered questions count as missed
        durationMs: Math.min(Date.now() - startTime.current, limitMs),
        extra: won ? { scope_label: 'won' } : {},
      })
      setOutcome({ won, reason, score, correct })
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
  if (phase === 'loading') return <main className="screen center"><p>De boss komt eraan…</p></main>

  if (phase === 'ready') {
    return (
      <main className="screen center">
        <p className="boss-emoji">{emoji}</p>
        <h2 className="big">{boss.title}</h2>
        <div className="card test-info">
          <p><strong>{exercises.length} vragen</strong> in {boss.time_limit_s} seconden.</p>
          <p>Elk juist antwoord raakt de boss. Je hebt <strong>{HEARTS} levens</strong>: bij de 2de fout verlies je.</p>
          <p className="small">Fout accent telt als juist (met waarschuwing).</p>
        </div>
        <button className="btn primary huge" onClick={begin}>Vechten! ⚔️</button>
        <button className="link" onClick={onBack}>Terug</button>
      </main>
    )
  }

  if (phase === 'done') {
    const reasons = { time: '⏰ De tijd is op.', hearts: '💔 Je levens zijn op.' }
    return (
      <main className="screen">
        <section className="card center">
          <p className="boss-emoji">{outcome.won ? '🏆' : emoji}</p>
          <p className="big">{outcome.won ? `${boss.title} verslagen!` : 'De boss wint deze keer…'}</p>
          {!outcome.won && <p className="small">{reasons[outcome.reason]} Probeer opnieuw!</p>}
          <div className="stats">
            <div><strong>{outcome.correct}/{exercises.length}</strong><span>juist</span></div>
            <div><strong>{outcome.score}</strong><span>punten</span></div>
            <div><strong>{Math.round(elapsed / 1000)}s</strong><span>tijd</span></div>
          </div>
        </section>
        <MistakeList answers={answers.current} exercises={exercises} describe={describe} />
        <div className="actions">
          <button className="btn primary" onClick={onBack}>Alle bosses</button>
        </div>
      </main>
    )
  }

  // playing / saving
  const ex = exercises[index]
  const bossHp = exercises.length - answers.current.filter((a) => a.result !== 'wrong').length
  const secondsLeft = Math.ceil((limitMs - elapsed) / 1000)

  return (
    <main className="screen play">
      <div className="hud">
        <span className={`clock ${secondsLeft <= 15 ? 'hurry' : ''}`}>{secondsLeft}s</span>
        <span className="hearts">{'❤️'.repeat(hearts)}{'🖤'.repeat(HEARTS - hearts)}</span>
      </div>

      <section className="boss-arena">
        <span className={`boss-emoji ${hit ? 'hit' : ''}`}>{emoji}</span>
        <div className="bar boss-bar"><div className="fill boss-hp" style={{ width: `${(bossHp / exercises.length) * 100}%` }} /></div>
        <span className="small">{boss.title} · {bossHp} HP</span>
      </section>

      <section className="card question" key={index}>
        <ConjugationPrompt exercise={ex} />
        <AnswerArea key={index} ref={inputRef} exercise={ex} disabled={phase !== 'playing'} onAnswer={answer} />
      </section>

      <Flash flash={flash} />
      {phase === 'saving' && <p className="center small">Opslaan…</p>}
    </main>
  )
}
