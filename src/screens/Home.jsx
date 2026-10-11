// Home: league tier and the choice of speed round.
import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { loadLeague, loadSkills, TOPICS } from '../lib/data'

const TIER_EMOJI = { Bronze: '🥉', Silver: '🥈', Gold: '🥇', Platinum: '💠', Diamond: '💎' }
const TIER_NL = { Bronze: 'Brons', Silver: 'Zilver', Gold: 'Goud', Platinum: 'Platina', Diamond: 'Diamant' }

export default function Home({ onStart, onVocab, onTest }) {
  const [skills, setSkills] = useState([])
  const [league, setLeague] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([loadSkills(), loadLeague()])
      .then(([s, l]) => {
        setSkills(s)
        setLeague(l)
      })
      .catch((e) => setError(e.message))
  }, [])

  return (
    <main className="screen">
      <header className="topbar">
        <h1 className="logo small-logo">Taal<span>spel</span></h1>
        <button className="link" onClick={() => supabase.auth.signOut()}>Uitloggen</button>
      </header>

      {league && (
        <section className="card league">
          <span className="tier-emoji">{TIER_EMOJI[league.tier]}</span>
          <div>
            <p className="small">Jouw league · Spaans</p>
            <p className="big">{TIER_NL[league.tier]}</p>
            <p className="small">{league.points} punten</p>
          </div>
        </section>
      )}

      <section>
        <h2>✈️ Unidad 6 · ¡Vamos de viaje!</h2>
        <p className="small">Oefen de woorden en test jezelf.</p>
        <div className="grid">
          <button className="btn tile wide vocab-tile" onClick={() => onVocab(TOPICS.unidad6)}>
            📚 Woordenschat · 4 niveaus, 2 richtingen
          </button>
          <button className="btn tile wide test-tile" onClick={onTest}>
            📝 Toets Unidad 6 · score op 20
          </button>
        </div>
      </section>

      <section>
        <h2>⚡ Speed round · Tiempos del pasado</h2>
        <p className="small">60 seconden. Juist op rij = combo. Versla je eigen ghost.</p>
        <div className="grid">
          <button className="btn tile" onClick={() => onStart({ skillId: null, title: 'Alle tijden' })}>
            Alle tijden
          </button>
          {skills.map((s) => (
            <button key={s.id} className="btn tile" onClick={() => onStart({ skillId: s.id, title: s.title })}>
              {s.title}
            </button>
          ))}
        </div>
      </section>

      <section className="card soon">
        <p className="small">Binnenkort: 👑 Boss battles · 🔎 Marker detective · 📖 Verhalen</p>
      </section>

      {error && <p className="error">Laden mislukt: {error}</p>}
    </main>
  )
}
