// Login and sign-up with email + password.
// Requires "Confirm email" to be OFF in Supabase (Authentication → Sign In / Providers
// → Email), so no emails are sent at all: no rate limits, no spam folder.
import { useState } from 'react'
import { supabase } from '../supabase'

// Supabase error messages → Dutch for the students
const ERRORS_NL = {
  'Invalid login credentials': 'E-mailadres of wachtwoord klopt niet.',
  'User already registered': 'Dit e-mailadres heeft al een account. Log in.',
  'Password should be at least 6 characters.': 'Je wachtwoord moet minstens 6 tekens hebben.',
  'Email not confirmed': 'Je account is nog niet bevestigd. Vraag je leerkracht om hulp.',
}

export default function Login() {
  const [mode, setMode] = useState('login') // login | signup
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    // Clear any stale session in this browser first (shared school devices)
    await supabase.auth.signOut({ scope: 'local' })
    const { error } =
      mode === 'login'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password })
    // On success, App picks up the new session automatically
    if (error) setError(ERRORS_NL[error.message] ?? error.message)
    setBusy(false)
  }

  function switchMode(next) {
    setMode(next)
    setError('')
  }

  return (
    <main className="screen center">
      <h1 className="logo">Taal<span>spel</span></h1>
      <p className="tagline">Speel tegen jezelf. Word elke dag beter.</p>

      <form className="card" onSubmit={submit}>
        <div className="tabs">
          <button type="button" className={mode === 'login' ? 'on' : ''} onClick={() => switchMode('login')}>
            Inloggen
          </button>
          <button type="button" className={mode === 'signup' ? 'on' : ''} onClick={() => switchMode('signup')}>
            Account maken
          </button>
        </div>

        <label htmlFor="email">E-mailadres</label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="naam@school.be"
        />

        <label htmlFor="password">Wachtwoord</label>
        <input
          id="password"
          type="password"
          required
          minLength={6}
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={mode === 'signup' ? 'Minstens 6 tekens' : ''}
        />

        <button className="btn primary" disabled={busy}>
          {busy ? 'Bezig…' : mode === 'login' ? 'Inloggen' : 'Account maken'}
        </button>
        {error && <p className="error">{error}</p>}
        <p className="small">Je e-mailadres gebruiken we alleen om in te loggen.</p>
      </form>
    </main>
  )
}
