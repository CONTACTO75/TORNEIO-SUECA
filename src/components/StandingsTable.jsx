import { Link } from 'react-router-dom'
import { playersOf, teamLabel } from '../lib/format'
import { prizeFor } from '../lib/standings'

export default function StandingsTable({ rows, tid, prizes, compact = false, showAdj }) {
  const n = rows.length
  const adjCol = showAdj ?? rows.some((r) => r.adj !== 0)
  return (
    <div className="table-scroll">
      <table className={`standings${compact ? ' compact' : ''}`}>
        <thead>
          <tr>
            <th className="c-rank" scope="col">Lugar</th>
            <th scope="col">Equipa</th>
            <th className="c-num hide-sm" scope="col" title="Jornadas jogadas">J</th>
            <th className="c-num hide-sm" scope="col" title="Ganhos, empates e perdidos">G‑E‑P</th>
            {adjCol && <th className="c-num" scope="col" title="Ajustes e penalizações">Ajustes</th>}
            <th className="c-pts" scope="col">Pontos</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const prize = prizeFor(r.rank, n, prizes)
            const podium = r.played > 0 && r.rank <= 3 ? `podium-${r.rank}` : ''
            return (
              <tr key={r.team.id} className={podium}>
                <td className="c-rank">
                  <span className="rank-num">{r.rank}</span>
                  {r.tied && <span className="tie" title="Empatada">=</span>}
                </td>
                <td className="c-team">
                  {tid ? (
                    <Link to={`/t/${tid}/equipas/${r.team.id}`} className="team-link">{teamLabel(r.team)}</Link>
                  ) : (
                    <span className="team-link">{teamLabel(r.team)}</span>
                  )}
                  <span className="players">{playersOf(r.team)}</span>
                  {prize && !compact && <span className="prize-tag">{prize}</span>}
                </td>
                <td className="c-num hide-sm">{r.played}</td>
                <td className="c-num hide-sm">{`${r.wins}‑${r.draws}‑${r.losses}`}</td>
                {adjCol && <td className={`c-num ${r.adj < 0 ? 'neg' : r.adj > 0 ? 'pos' : ''}`}>{r.adj ? (r.adj > 0 ? `+${r.adj}` : r.adj) : ''}</td>}
                <td className="c-pts">{r.total}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
