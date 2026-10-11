// Small building blocks for theory pages, so the content files stay readable.

/** A titled section with an anchor id (used by the table of contents). */
export function Section({ id, title, children }) {
  return (
    <section id={id} className="card theory-section">
      <h2>{title}</h2>
      {children}
    </section>
  )
}

/** Simple table: head = array of strings, rows = array of arrays. */
export function Table({ head, rows }) {
  return (
    <div className="table-wrap">
      <table>
        {head && (
          <thead>
            <tr>{head.map((h, i) => <th key={i}>{h}</th>)}</tr>
          </thead>
        )}
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Highlighted tip box. kind: 'tip' (mint), 'warn' (amber), 'key' (coral) */
export function Box({ kind = 'tip', title, children }) {
  return (
    <div className={`box ${kind}`}>
      {title && <strong>{title}</strong>}
      <div>{children}</div>
    </div>
  )
}

/** Spanish example sentence with Dutch translation underneath. */
export function Ex({ es, nl }) {
  return (
    <p className="ex">
      <span className="es">{es}</span>
      {nl && <span className="nl">{nl}</span>}
    </p>
  )
}

/** Word chips, e.g. for time markers. */
export function Chips({ items }) {
  return (
    <div className="word-chips">
      {items.map(([es, nl]) => (
        <span key={es} className="word-chip"><b>{es}</b> {nl}</span>
      ))}
    </div>
  )
}
