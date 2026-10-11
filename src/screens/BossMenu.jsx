// List of bosses (groups of irregular verbs) and which ones are defeated.
import { useEffect, useState } from 'react'
import { loadBosses, loadMyRecords } from '../lib/data'

export const BOSS_EMOJI = ['🐉', '👻', '🦂', '🐍', '🦖', '👹']

export default function BossMenu({ onPlay, onBack }) {
  const [bosses, setBosses] = useState(null)
  const [records, setRecords] = useState({})
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([loadBosses(), loadMyRecords('boss_battle')])
      .then(([b, r]) => { setBosses(b); setRecords(r) })
      .catch((e) => setError(e.message))
  }, [])

  if (error) return <main className="screen center"><p className="error">Laden mislukt: {error}</p></main>
  if (!bosses) return <main className="screen center"><p>Laden…</p></main>

  // A won fight is stored under scope "<boss id>:won"
  const defeated = bosses.filter((b) => records[`${b.id}:won`]).length

  return (
    <main className="screen">
      <header className="topbar">
        <button className="link" onClick={onBack}>← Home</button>
      </header>
      <section>
        <h1 className="theory-title">👑 Boss battles</h1>
        <p className="small">Versla elke groep onregelmatige werkwoorden. {defeated}/{bosses.length} verslagen.</p>
      </section>
      <div className="levels">
        {bosses.map((b, i) => {
          const won = records[`${b.id}:won`]
          const emoji = BOSS_EMOJI[i % BOSS_EMOJI.length]
          return (
            <button key={b.id} className={`btn level ${won ? 'defeated' : ''}`} onClick={() => onPlay(b, emoji)}>
              <span className="level-emoji">{emoji}</span>
              <span>
                <strong>{b.title}</strong>
                <span className="small">{won ? `✅ Verslagen · beste score ${won.best_score}` : 'Nog niet verslagen'}</span>
              </span>
            </button>
          )
        })}
      </div>
    </main>
  )
}
