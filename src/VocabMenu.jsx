// Vocabulary menu: pick a chapter part and one of the four levels.
import { useEffect, useState } from 'react'
import { loadVocabOverview } from '../lib/data'
import { VOCAB_LEVELS } from '../lib/modes'

export default function VocabMenu({ topicSlug, onStart, onBack }) {
  const [overview, setOverview] = useState(null)
  const [category, setCategory] = useState(null) // null = all words
  const [error, setError] = useState('')

  useEffect(() => {
    loadVocabOverview(topicSlug).then(setOverview).catch((e) => setError(e.message))
  }, [topicSlug])

  if (error) return <main className="screen center"><p className="error">Laden mislukt: {error}</p></main>
  if (!overview) return <main className="screen center"><p>Laden…</p></main>

  return (
    <main className="screen">
      <header className="topbar">
        <button className="link" onClick={onBack}>← Home</button>
      </header>

      <section>
        <h2>📚 {overview.title}</h2>
        <p className="small">Woordenschat · {overview.total} woorden</p>
      </section>

      <section>
        <h3 className="step">1. Welk deel?</h3>
        <div className="chips">
          <button className={`chip ${category === null ? 'on' : ''}`} onClick={() => setCategory(null)}>
            Alle woorden <span>{overview.total}</span>
          </button>
          {overview.categories.map((c) => (
            <button
              key={c.name}
              className={`chip ${category === c.name ? 'on' : ''}`}
              onClick={() => setCategory(c.name)}
            >
              {c.name} <span>{c.count}</span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3 className="step">2. Welk niveau?</h3>
        <div className="levels">
          {VOCAB_LEVELS.map((l) => (
            <button
              key={l.level}
              className="btn level"
              onClick={() => onStart({ topicId: overview.topicId, category, level: l.level })}
            >
              <span className="level-emoji">{l.emoji}</span>
              <span>
                <strong>Niveau {l.level} · {l.name}</strong>
                <span className="small">{l.info}</span>
              </span>
            </button>
          ))}
        </div>
      </section>
    </main>
  )
}
