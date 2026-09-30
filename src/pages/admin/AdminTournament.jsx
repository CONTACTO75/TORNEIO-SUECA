import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useAuth, useTournamentData } from '../../hooks/useTournament'
import { ErrorBox, Loading, NotFound } from '../../components/Status'
import AdminBar from './AdminBar'
import ResultsTab from './ResultsTab'
import TeamsTab from './TeamsTab'
import ScheduleTab from './ScheduleTab'
import AdjustmentsTab from './AdjustmentsTab'
import SettingsTab from './SettingsTab'

const TABS = [
  { id: 'resultados', label: 'Resultados', C: ResultsTab },
  { id: 'equipas', label: 'Equipas', C: TeamsTab },
  { id: 'calendario', label: 'Calendário', C: ScheduleTab },
  { id: 'ajustes', label: 'Penalizações', C: AdjustmentsTab },
  { id: 'definicoes', label: 'Definições', C: SettingsTab },
]

export default function AdminTournament() {
  const { tid } = useParams()
  const user = useAuth()
  const q = useTournamentData(tid)
  const [params, setParams] = useSearchParams()

  if (q.loading) return <Loading />
  if (q.error) return <div className="wrap"><ErrorBox error={q.error} /></div>
  if (!q.data?.tournament) return <div className="wrap"><NotFound title="Este torneio não existe." /></div>

  const data = q.data
  const defaultTab = !data.teams.length ? 'equipas' : !data.matches.length ? 'calendario' : 'resultados'
  const tab = TABS.find((t) => t.id === params.get('separador'))?.id || defaultTab
  const Current = TABS.find((t) => t.id === tab).C
  const ctx = { ...data, user, reload: q.reload, goTo: (id) => setParams({ separador: id }) }

  return (
    <div className="shell admin">
      <AdminBar user={user}>{data.tournament.name}</AdminBar>
      <div className="wrap">
        <div className="admin-tools">
          <Link className="btn ghost small" to={`/t/${tid}`} target="_blank">Ver página pública</Link>
          <Link className="btn ghost small" to={`/t/${tid}/tv`} target="_blank">Abrir ecrã TV</Link>
          <Link className="btn ghost small" to={`/admin/t/${tid}/imprimir`}>Imprimir folhas de jogo</Link>
          <button type="button" className="btn ghost small" onClick={async () => (await import('../../lib/exportXlsx')).exportTournament(data)}>Exportar Excel</button>
        </div>
        <nav className="tabs" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              type="button"
              aria-selected={tab === t.id}
              className={tab === t.id ? 'active' : ''}
              onClick={() => setParams({ separador: t.id })}
            >
              {t.label}
            </button>
          ))}
        </nav>
        <main className="tab-body">
          <Current {...ctx} />
        </main>
      </div>
    </div>
  )
}
