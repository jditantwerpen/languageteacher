// Teacher page: approve new accounts and see who is active.
// Only works for admins: the database functions refuse everyone else.
import { useEffect, useState } from 'react'
import { adminListUsers, adminSetApproval } from '../lib/data'

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('nl-BE', { day: 'numeric', month: 'short' }) : '–')

export default function Admin({ onBack }) {
  const [users, setUsers] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')

  const refresh = () => adminListUsers().then(setUsers).catch((e) => setError(e.message))
  useEffect(() => { refresh() }, [])

  async function setApproval(user, approved) {
    if (!approved && !confirm(`Toegang intrekken voor ${user.email}?`)) return
    setBusyId(user.id)
    try {
      await adminSetApproval(user.id, approved)
      await refresh()
    } catch (e) {
      setError(e.message)
    }
    setBusyId(null)
  }

  if (error) return <main className="screen center"><p className="error">{error}</p><button className="btn" onClick={onBack}>Terug</button></main>
  if (!users) return <main className="screen center"><p>Laden…</p></main>

  const pending = users.filter((u) => !u.approved_at && !u.is_admin)
  const active = users.filter((u) => u.approved_at || u.is_admin)

  return (
    <main className="screen">
      <header className="topbar">
        <button className="link" onClick={onBack}>← Home</button>
        <button className="link" onClick={refresh}>↻ Vernieuwen</button>
      </header>
      <h1 className="theory-title">👩‍🏫 Beheer</h1>

      <section className="card">
        <h2>Wacht op goedkeuring ({pending.length})</h2>
        {pending.length === 0 && <p className="small">Niemand wacht. 🎉</p>}
        {pending.map((u) => (
          <div key={u.id} className="user-row">
            <div>
              <strong>{u.email}</strong>
              <span className="small">aangemaakt {fmtDate(u.created_at)}</span>
            </div>
            <button className="btn primary" disabled={busyId === u.id} onClick={() => setApproval(u, true)}>
              Goedkeuren
            </button>
          </div>
        ))}
      </section>

      <section className="card">
        <h2>Actieve accounts ({active.length})</h2>
        {active.map((u) => (
          <div key={u.id} className="user-row">
            <div>
              <strong>{u.email}</strong>
              <span className="small">
                {u.is_admin ? 'beheerder · ' : ''}{u.points} punten · {u.rounds} rondes · laatst geoefend {fmtDate(u.last_played)}
              </span>
            </div>
            {!u.is_admin && (
              <button className="btn" disabled={busyId === u.id} onClick={() => setApproval(u, false)}>
                Intrekken
              </button>
            )}
          </div>
        ))}
      </section>

      <p className="small center-text">Wachtwoord vergeten? Dat reset je nog via de SQL Editor in Supabase.</p>
    </main>
  )
}
