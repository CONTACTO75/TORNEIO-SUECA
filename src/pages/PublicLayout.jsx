import { Link, NavLink, Outlet, useParams } from 'react-router-dom'
import { useTournamentData } from '../hooks/useTournament'
import { fmtDates } from '../lib/format'
import { ErrorBox, Loading, NotFound } from '../components/Status'

export default function PublicLayout() {
  const { tid } = useParams()
  const q = useTournamentData(tid)
  if (q.loading) return <div className="wrap"><Loading /></div>
  if (q.error) return <div className="wrap"><ErrorBox error={q.error} /></div>
  if (!q.data?.tournament) return <div className="wrap"><NotFound title="Este torneio não existe." /></div>
  const t = q.data.tournament
  const s = t.settings
  const meta = [s.organizer, fmtDates(s.dates) + (s.startTime ? `, às ${s.startTime.replace(':', 'h')}` : ''), s.venue]
    .filter((x) => x && x.trim())
    .join('. ')

  return (
    <div className="shell">
      <header className="site-head">
        <div className="wrap head-row">
          <div className="head-title head-brand">
            {s.logo && <img className="head-logo" src={s.logo} alt="" />}
            <div>
              <h1 className="t-name">{t.name}</h1>
              {meta && <p className="t-meta">{meta}</p>}
            </div>
          </div>
          <nav className="nav" aria-label="Secções">
            <NavLink end to={`/t/${tid}`}>Classificação</NavLink>
            <NavLink to={`/t/${tid}/jornadas`}>Jornadas</NavLink>
            <NavLink to={`/t/${tid}/equipas`}>Equipas</NavLink>
            <Link to={`/t/${tid}/tv`} className="nav-tv">Ecrã TV</Link>
          </nav>
        </div>
      </header>
      <main className="wrap">
        <Outlet context={q.data} />
      </main>
      <footer className="wrap foot">
        <Link to="/?todos">Outros torneios</Link>
        <Link to={`/admin/t/${tid}`}>Gestão</Link>
      </footer>
    </div>
  )
}
