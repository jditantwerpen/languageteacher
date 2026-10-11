// List of stories with the student's best score per story.
import { useEffect, useState } from 'react'
import { loadMyRecords, loadStories } from '../lib/data'

export default function StoryMenu({ onPlay, onBack }) {
  const [stories, setStories] = useState(null)
  const [records, setRecords] = useState({})
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([loadStories(), loadMyRecords('story')])
      .then(([s, r]) => { setStories(s); setRecords(r) })
      .catch((e) => setError(e.message))
  }, [])

  if (error) return <main className="screen center"><p className="error">Laden mislukt: {error}</p></main>
  if (!stories) return <main className="screen center"><p>Laden…</p></main>

  return (
    <main className="screen">
      <header className="topbar">
        <button className="link" onClick={onBack}>← Home</button>
      </header>
      <section>
        <h1 className="theory-title">📖 Verhalen</h1>
        <p className="small">Vul de verhalen aan met de juiste verleden tijd. Versla je eigen ghost.</p>
      </section>
      <div className="levels">
        {stories.map((s) => {
          const rec = records[s.id]
          return (
            <button key={s.id} className="btn level" onClick={() => onPlay(s)}>
              <span className="level-emoji">{rec ? '⭐' : '📘'}</span>
              <span>
                <strong>{s.title}</strong>
                <span className="small">{s.count} vragen{rec ? ` · record ${rec.best_score} punten` : ''}</span>
              </span>
            </button>
          )
        })}
      </div>
    </main>
  )
}
