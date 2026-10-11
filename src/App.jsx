// App shell: login state and simple screen switching (no router needed yet).
import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { markerConfig, speedRoundConfig, vocabConfig } from './lib/modes'
import { loadMyProfile, TOPICS } from './lib/data'
import Login from './screens/Login'
import Home from './screens/Home'
import VocabMenu from './screens/VocabMenu'
import Round from './screens/Round'
import Result from './screens/Result'
import Test from './screens/Test'
import Theory from './screens/Theory'
import WordList from './screens/WordList'
import Pending from './screens/Pending'
import Admin from './screens/Admin'
import StoryMenu from './screens/StoryMenu'
import Story from './screens/Story'
import BossMenu from './screens/BossMenu'
import Boss from './screens/Boss'

export default function App() {
  const [session, setSession] = useState(undefined) // undefined = still checking
  const [screen, setScreen] = useState({ name: 'home' })
  const [profile, setProfile] = useState(null) // { approved, isAdmin } once loaded

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  // Load approval status whenever someone (else) logs in
  const userId = session?.user?.id
  const refreshProfile = () =>
    loadMyProfile()
      .then(setProfile)
      // If the profile cannot be read, let the app load: the database (RLS)
      // still refuses content to accounts that are not approved
      .catch(() => setProfile({ approved: true, isAdmin: false }))
  useEffect(() => {
    setProfile(null)
    setScreen({ name: 'home' })
    if (userId) refreshProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  if (session === undefined) return null
  if (!session) return <Login />
  if (!profile) return null
  if (!profile.approved) return <Pending onCheckAgain={refreshProfile} />

  const goHome = () => setScreen({ name: 'home' })
  // Where "Home" on the result screen leads: back to the menu we came from
  const back = screen.back ?? { name: 'home' }

  /** Start a round; round counter forces a fresh Round component. */
  const play = (config, backTo) =>
    setScreen({ name: 'round', config, back: backTo, round: (screen.round ?? 0) + 1 })

  switch (screen.name) {
    case 'test':
      return (
        <Test
          key={screen.round}
          onHome={goHome}
          onTheory={() => setScreen({ name: 'theory', id: 'unidad6', back: screen })}
          onWords={() => setScreen({ name: 'words', topicSlug: TOPICS.unidad6, back: screen })}
        />
      )
    case 'theory':
      return (
        <Theory
          key={screen.id}
          id={screen.id}
          onOpen={(id) => setScreen({ name: 'theory', id, back: screen })}
          onBack={() => setScreen(back)}
        />
      )
    case 'stories':
      return <StoryMenu onBack={goHome} onPlay={(story) => setScreen({ name: 'story', story })} />
    case 'story':
      return <Story key={screen.story.id} story={screen.story} onBack={() => setScreen({ name: 'stories' })} />
    case 'bosses':
      return <BossMenu onBack={goHome} onPlay={(boss, emoji) => setScreen({ name: 'boss', boss, emoji })} />
    case 'boss':
      return <Boss key={screen.boss.id} boss={screen.boss} emoji={screen.emoji} onBack={() => setScreen({ name: 'bosses' })} />
    case 'admin':
      return profile.isAdmin ? <Admin onBack={goHome} /> : null
    case 'words':
      return <WordList topicSlug={screen.topicSlug} onBack={() => setScreen(back)} />
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
          onTheory={(id) => setScreen({ name: 'theory', id })}
          onWords={(topicSlug) => setScreen({ name: 'words', topicSlug })}
          isAdmin={profile.isAdmin}
          onAdmin={() => setScreen({ name: 'admin' })}
          onMarker={() => play(markerConfig(), { name: 'home' })}
          onStories={() => setScreen({ name: 'stories' })}
          onBosses={() => setScreen({ name: 'bosses' })}
        />
      )
  }
}
