import { useEffect, useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { db } from '../lib/db'
import { fmtDates } from '../lib/format'
import { ErrorBox, Loading } from '../components/Status'

export default function Home() {
  const [params] = useSearchParams()
  const [list, setList] = useState(null)
  const [error, setError] = useState(null)
  useEffect(() => {
    db.listTournaments().then(setList).catch(setError)
  }, [])

  if (error) return <div className="wrap"><ErrorBox error={error} /></div>
  if (!list) return <div className="wrap"><Loading /></div>
  const active = list.find((t) => t.isActive)
  if (active && !params.has('todos')) return <Navigate to={`/t/${active.id}`} replace />

  return (
    <div className="shell">
      <header className="site-head">
        <div className="wrap head-row">
          <h1 className="t-name">Torneios de Sueca</h1>
        </div>
      </header>
      <main className="wrap">
        {list.length === 0 ? (
          <div className="status-box">
            <strong>Ainda não há torneios.</strong>
            <span>A organização cria o primeiro torneio na área de gestão.</span>
            <Link className="btn primary" to="/admin">Abrir gestão</Link>
          </div>
        ) : (
          <ul className="t-list">
            {list.map((t) => (
              <li key={t.id}>
                <Link to={`/t/${t.id}`}>
                  <span className="t-list-name">{t.name}</span>
                  <span className="muted">{fmtDates(t.settings.dates)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
      <footer className="wrap foot">
        <Link to="/admin">Gestão do torneio</Link>
      </footer>
    </div>
  )
}
