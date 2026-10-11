// Word list for a chapter: browse per part, search, and hide one side
// to quiz yourself (tap a word to reveal it).
import { useEffect, useMemo, useState } from 'react'
import { loadVocabItems } from '../lib/data'
import { stripAccents } from '../lib/answer'

export default function WordList({ topicSlug, onBack }) {
  const [data, setData] = useState(null)
  const [category, setCategory] = useState(null) // null = all
  const [search, setSearch] = useState('')
  const [hide, setHide] = useState(null) // null | 'es' | 'nl'
  const [revealed, setRevealed] = useState(() => new Set())
  const [error, setError] = useState('')

  useEffect(() => {
    loadVocabItems(topicSlug).then(setData).catch((e) => setError(e.message))
  }, [topicSlug])

  const categories = useMemo(() => [...new Set((data?.items ?? []).map((i) => i.category))], [data])

  const visible = useMemo(() => {
    const q = stripAccents(search)
    return (data?.items ?? []).filter(
      (i) =>
        (!category || i.category === category) &&
        (!q || stripAccents(i.term_es).includes(q) || stripAccents(i.term_nl).includes(q)),
    )
  }, [data, category, search])

  // Changing what is hidden starts the quiz fresh
  function toggleHide(side) {
    setHide(hide === side ? null : side)
    setRevealed(new Set())
  }

  function reveal(id) {
    setRevealed((prev) => new Set(prev).add(id))
  }

  if (error) return <main className="screen center"><p className="error">Laden mislukt: {error}</p></main>
  if (!data) return <main className="screen center"><p>Laden…</p></main>

  return (
    <main className="screen">
      <header className="topbar">
        <button className="link" onClick={onBack}>← Terug</button>
      </header>

      <section>
        <p className="small">📋 Woordenlijst</p>
        <h1 className="theory-title">{data.title}</h1>
      </section>

      <input
        className="search"
        type="search"
        placeholder="Zoek een woord (Spaans of Nederlands)…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="chips">
        <button className={`chip ${category === null ? 'on' : ''}`} onClick={() => setCategory(null)}>
          Alles <span>{data.items.length}</span>
        </button>
        {categories.map((c) => (
          <button key={c} className={`chip ${category === c ? 'on' : ''}`} onClick={() => setCategory(c)}>
            {c}
          </button>
        ))}
      </div>

      <div className="hide-toggle">
        <span className="small">Overhoor jezelf:</span>
        <button className={`chip ${hide === 'nl' ? 'on' : ''}`} onClick={() => toggleHide('nl')}>Verberg 🇳🇱</button>
        <button className={`chip ${hide === 'es' ? 'on' : ''}`} onClick={() => toggleHide('es')}>Verberg 🇪🇸</button>
      </div>

      <section className="card word-table">
        {visible.length === 0 && <p className="small">Geen woorden gevonden.</p>}
        {visible.map((item) => {
          const hidden = hide && !revealed.has(item.id)
          return (
            <div key={item.id} className="word-row">
              <span
                className={`es ${hidden && hide === 'es' ? 'masked' : ''}`}
                onClick={() => hidden && hide === 'es' && reveal(item.id)}
              >
                {item.term_es}
              </span>
              <span
                className={`nl ${hidden && hide === 'nl' ? 'masked' : ''}`}
                onClick={() => hidden && hide === 'nl' && reveal(item.id)}
              >
                {item.term_nl}
                {item.note_nl && <em> · {item.note_nl}</em>}
              </span>
            </div>
          )
        })}
      </section>
      {hide && <p className="small center-text">Tik op een verborgen woord om het te zien.</p>}
    </main>
  )
}
