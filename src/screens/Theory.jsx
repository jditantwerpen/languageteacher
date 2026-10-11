// Theory page: table of contents + the summary content for one topic.
import Pasado, { pasadoToc } from '../content/theory/pasado'
import Unidad6, { unidad6Toc } from '../content/theory/unidad6'

export const THEORY = {
  pasado: { title: 'Los tiempos del pasado', toc: pasadoToc, Content: Pasado },
  unidad6: { title: 'Unidad 6 · ¡Vamos de viaje!', toc: unidad6Toc, Content: Unidad6 },
}

export default function Theory({ id, onOpen, onBack }) {
  const { title, toc, Content } = THEORY[id]

  const jump = (anchor) => document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth' })

  return (
    <main className="screen theory">
      <header className="topbar">
        <button className="link" onClick={onBack}>← Terug</button>
      </header>

      <section>
        <p className="small">📖 Theorie</p>
        <h1 className="theory-title">{title}</h1>
      </section>

      <nav className="toc">
        {toc.map(([anchor, label]) => (
          <button key={anchor} className="chip" onClick={() => jump(anchor)}>{label}</button>
        ))}
      </nav>

      <Content onOpen={onOpen} />

      <button className="btn" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>↑ Naar boven</button>
    </main>
  )
}
