// Shown to students whose account is not approved yet.
import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

export default function Pending({ onCheckAgain }) {
  const [email, setEmail] = useState('')
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ''))
  }, [])

  async function check() {
    setChecking(true)
    await onCheckAgain()
    setChecking(false)
  }

  return (
    <main className="screen center">
      <h1 className="logo">Taal<span>spel</span></h1>
      <section className="card center pending">
        <p className="big">⏳ Bijna klaar!</p>
        <p>Je account <strong>{email}</strong> is aangemaakt.</p>
        <p className="small">Je leerkracht moet het nog goedkeuren. Daarna kun je meteen beginnen.</p>
        <button className="btn primary" onClick={check} disabled={checking}>
          {checking ? 'Even kijken…' : 'Opnieuw proberen'}
        </button>
      </section>
      <button className="link" onClick={() => supabase.auth.signOut()}>Uitloggen</button>
    </main>
  )
}
