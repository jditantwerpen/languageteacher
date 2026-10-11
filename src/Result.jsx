// End of round: score, record check and the mistakes to learn from.
const WARNING_TEXT = {
  accent: 'Enkel het accent was fout.',
  article: 'Enkel het lidwoord was fout.',
}

export default function Result({ result, config, onAgain, onHome }) {
  const { score, correct, answers, exercises, previousBest } = result
  const isRecord = previousBest === null || score > previousBest
  const accuracy = answers.length ? Math.round((correct / answers.length) * 100) : 0

  // Wrong or warned answers, with the exercise they belong to
  const byId = Object.fromEntries(exercises.map((e) => [e.id, e]))
  const mistakes = answers
    .filter((a) => a.result !== 'correct')
    .map((a) => ({ ...a, exercise: byId[a.exerciseId] }))

  return (
    <main className="screen">
      <section className="card center">
        <p className="small">{config.title}</p>
        {isRecord && <p className="record">🏆 Nieuw record!</p>}
        <p className="final-score">{score}</p>
        <p className="small">punten</p>
        <div className="stats">
          <div><strong>{answers.length}</strong><span>vragen</span></div>
          <div><strong>{accuracy}%</strong><span>juist</span></div>
          <div><strong>{previousBest ?? '–'}</strong><span>vorig record</span></div>
        </div>
      </section>

      {mistakes.length > 0 && (
        <section className="card">
          <h2>Leer van je fouten</h2>
          <ul className="mistakes">
            {mistakes.map((m, i) => (
              <li key={i} className={m.result}>
                <span className="small">{config.describe(m.exercise)}</span>
                <span>
                  <s>{m.given}</s> → <strong>{m.exercise.correct_answer}</strong>
                </span>
                {(WARNING_TEXT[m.result] || m.exercise.feedback_nl) && (
                  <span className="small">{WARNING_TEXT[m.result] ?? m.exercise.feedback_nl}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="actions">
        <button className="btn primary" onClick={onAgain}>Nog eens!</button>
        <button className="btn" onClick={onHome}>Home</button>
      </div>
    </main>
  )
}
