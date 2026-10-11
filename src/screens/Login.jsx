// Login with a magic link: no passwords for students to forget.
import { useState } from 'react'
import { supabase } from '../supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle | sending | sent | error
  const [error, setError] = useState('')

  async function sendLink(e) {
    e.preventDefault()
    setStatus('sending')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    })
    if (error) {
      setError(error.message)
      setStatus('error')
    } else {
      setStatus('sent')
    }
  }

  return (
    <main className="screen center">
      <h1 className="logo">Taal<span>spel</span></h1>
      <p className="tagline">Speel tegen jezelf. Word elke dag beter.</p>

      {status === 'sent' ? (
        <div className="card">
          <p className="big">📬 Check je mailbox!</p>
          <p>We stuurden een inloglink naar <strong>{email}</strong>.</p>
        </div>
      ) : (
        <form className="card" onSubmit={sendLink}>
          <label htmlFor="email">Je e-mailadres</label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="naam@school.be"
          />
          <button className="btn primary" disabled={status === 'sending'}>
            {status === 'sending' ? 'Bezig…' : 'Stuur me een inloglink'}
          </button>
          {status === 'error' && <p className="error">Er ging iets mis: {error}</p>}
          <p className="small">Je e-mailadres gebruiken we alleen om in te loggen.</p>
        </form>
      )}
    </main>
  )
}
