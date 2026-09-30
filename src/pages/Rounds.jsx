import { useOutletContext, useSearchParams } from 'react-router-dom'
import MatchCard from '../components/MatchCard'
import { currentRound, hasResult, isPlayable, roundDayMap, roundNumbers } from '../lib/schedule'
import { fmtDate } from '../lib/format'

export default function Rounds() {
  const { tournament, teams, matches } = useOutletContext()
  const [params, setParams] = useSearchParams()
  const rounds = roundNumbers(matches)
  if (!rounds.length) return <p className="empty">O calendário ainda não foi sorteado.</p>

  const byId = Object.fromEntries(teams.map((t) => [t.id, t]))
  const days = roundDayMap(tournament.settings, rounds.length)
  const sel = Number(params.get('j')) || currentRound(matches)
  const list = matches.filter((m) => m.round === sel).sort((a, b) => (a.tableNo ?? 999) - (b.tableNo ?? 999))

  const state = (r) => {
    const ms = matches.filter((m) => m.round === r && isPlayable(m))
    const d = ms.filter(hasResult).length
    return d === 0 ? '' : d === ms.length ? 'done' : 'partial'
  }

  return (
    <section>
      <div className="section-head">
        <h2>Jornada {sel}</h2>
        {days[sel] && <p className="progress-line">{fmtDate(days[sel], { weekday: 'long', day: 'numeric', month: 'long' })}</p>}
      </div>
      <nav className="round-pills" aria-label="Escolher jornada">
        {rounds.map((r) => (
          <button
            key={r}
            type="button"
            className={`pill ${state(r)}${r === sel ? ' current' : ''}`}
            aria-current={r === sel ? 'true' : undefined}
            onClick={() => setParams({ j: r })}
          >
            {r}
          </button>
        ))}
      </nav>
      <div className="matches">
        {list.map((m) => <MatchCard key={m.id} match={m} byId={byId} />)}
      </div>
    </section>
  )
}
