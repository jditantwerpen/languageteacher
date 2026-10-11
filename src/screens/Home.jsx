// Home: league tier, chapters (learn + practise + test) and speed rounds.
import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { loadLeague, loadSkills, TOPICS } from '../lib/data'

const TIER_EMOJI = { Bronze: '🥉', Silver: '🥈', Gold: '🥇', Platinum: '💠', Diamond: '💎' }
const TIER_NL = { Bronze: 'Brons', Silver: 'Zilver', Gold: 'Goud', Platinum: 'Platina', Diamond: 'Diamant' }

export default function Home({ onStart, onVocab, onTest, onTheory, onWords, isAdmin, onAdmin, onMarker, onStories, onBosses }) {
  const [skills, setSkills] = useState([])
  const [league, setLeague] = useState(null)
  const [error, setError] = useState('')

  const [email, setEmail] = useState('')

  useEffect(() => {
    // Show who is logged in: avoids playing on a classmate's account
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ''))
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
        <div className="who">
          <span className="small">{email}</span>
          <button className="link" onClick={() => supabase.auth.signOut()}>Uitloggen</button>
        </div>
      </header>

      {isAdmin && (
        <button className="btn tile wide admin-tile" onClick={onAdmin}>
          👩‍🏫 Beheer · accounts goedkeuren
        </button>
      )}

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
        <p className="small">Eerst leren, dan oefenen, dan jezelf testen.</p>
        <div className="grid">
          <button className="btn tile learn-tile" onClick={() => onTheory('unidad6')}>
            📖 Theorie
          </button>
          <button className="btn tile learn-tile" onClick={() => onWords(TOPICS.unidad6)}>
            📋 Woordenlijst
          </button>
          <button className="btn tile wide vocab-tile" onClick={() => onVocab(TOPICS.unidad6)}>
            📚 Woordenschat oefenen · 4 niveaus
          </button>
          <button className="btn tile wide test-tile" onClick={onTest}>
            📝 Toets Unidad 6 · score op 20
          </button>
        </div>
      </section>

      <section>
        <h2>⚡ Tiempos del pasado</h2>
        <p className="small">Speed round: 60 seconden. Juist op rij = combo. Versla je eigen ghost.</p>
        <div className="grid">
          <button className="btn tile wide learn-tile" onClick={() => onTheory('pasado')}>
            📖 Theorie: de 3 verleden tijden
          </button>
        </div>
        <div className="grid speed-grid">
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

      <section>
        <h2>🎮 Spellen · Tiempos del pasado</h2>
        <p className="small">Oefen de keuze tussen de tijden en de onregelmatige werkwoorden.</p>
        <div className="grid">
          <button className="btn tile wide game-tile" onClick={onMarker}>
            🔎 Marker detective · welke tijd?
          </button>
          <button className="btn tile game-tile" onClick={onStories}>📖 Verhalen</button>
          <button className="btn tile game-tile" onClick={onBosses}>👑 Boss battles</button>
        </div>
      </section>

      {error && <p className="error">Laden mislukt: {error}</p>}
    </main>
  )
}
