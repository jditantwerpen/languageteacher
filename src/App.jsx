// App shell: login state and simple screen switching (no router needed yet).
import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { speedRoundConfig, vocabConfig } from './lib/modes'
import Login from './screens/Login'
import Home from './screens/Home'
import VocabMenu from './screens/VocabMenu'
import Round from './screens/Round'
import Result from './screens/Result'
import Test from './screens/Test'

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

  const goHome = () => setScreen({ name: 'home' })
  // Where "Home" on the result screen leads: back to the menu we came from
  const back = screen.back ?? { name: 'home' }

  /** Start a round; round counter forces a fresh Round component. */
  const play = (config, backTo) =>
    setScreen({ name: 'round', config, back: backTo, round: (screen.round ?? 0) + 1 })

  switch (screen.name) {
    case 'test':
      return <Test key={screen.round} onHome={goHome} />
    case 'vocabMenu':
      return (
        <VocabMenu
          topicSlug={screen.topicSlug}
          onBack={goHome}
          onStart={(opts) => play(vocabConfig(opts), { name: 'vocabMenu', topicSlug: screen.topicSlug })}
        />
      )
    case 'round':
      return (
        <Round
          key={screen.round}
          config={screen.config}
          onDone={(result) => setScreen({ ...screen, name: 'result', result })}
          onQuit={() => setScreen(back)}
        />
      )
    case 'result':
      return (
        <Result
          result={screen.result}
          config={screen.config}
          onAgain={() => play(screen.config, back)}
          onHome={() => setScreen(back)}
        />
      )
    default:
      return (
        <Home
          onStart={(opts) => play(speedRoundConfig(opts), { name: 'home' })}
          onVocab={(topicSlug) => setScreen({ name: 'vocabMenu', topicSlug })}
          onTest={() => setScreen({ name: 'test', round: (screen.round ?? 0) + 1 })}
        />
      )
  }
}
