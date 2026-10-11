// App shell: login state and simple screen switching (no router needed yet).
import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import Login from './screens/Login'
import Home from './screens/Home'
import SpeedRound from './screens/SpeedRound'
import Result from './screens/Result'

export default function App() {
  const [session, setSession] = useState(undefined) // undefined = still checking
  const [screen, setScreen] = useState({ name: 'home' })

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  if (session === undefined) return null
  if (!session) return <Login />

  switch (screen.name) {
    case 'speed':
      return (
        <SpeedRound
          // key forces a fresh round when "Nog eens" is pressed
          key={screen.round}
          skillId={screen.skillId}
          title={screen.title}
          onDone={(result) => setScreen({ ...screen, name: 'result', result })}
          onQuit={() => setScreen({ name: 'home' })}
        />
      )
    case 'result':
      return (
        <Result
          result={screen.result}
          onAgain={() => setScreen({ ...screen, name: 'speed', round: (screen.round ?? 0) + 1 })}
          onHome={() => setScreen({ name: 'home' })}
        />
      )
    default:
      return <Home onStart={(opts) => setScreen({ name: 'speed', round: 0, ...opts })} />
  }
}
