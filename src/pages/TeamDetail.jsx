import { useMemo } from 'react'
import { Link, useOutletContext, useParams } from 'react-router-dom'
import { computeStandings, teamSheet } from '../lib/standings'
import { playersOf, teamLabel } from '../lib/format'
import { NotFound } from '../components/Status'

export default function TeamDetail() {
  const { teamId } = useParams()
  const { tournament, teams, matches, adjustments } = useOutletContext()
  const team = teams.find((t) => t.id === teamId)
  const standings = useMemo(
    () => computeStandings({ teams, matches, adjustments, settings: tournament.settings }),
    [teams, matches, adjustments, tournament.settings],
  )
  if (!team) return <NotFound title="Equipa não encontrada." />
  const byId = Object.fromEntries(teams.map((t) => [t.id, t]))
  const row = standings.find((r) => r.team.id === teamId)
  const sheet = teamSheet(teamId, matches)
  const adj = adjustments.filter((a) => a.teamId === teamId)
  const tid = tournament.id

  return (
    <section>
      <p className="crumb"><Link to={`/t/${tid}`}>Classificação</Link></p>
      <div className="team-hero">
        <div>
          <h2>{teamLabel(team)}</h2>
          <p className="players big">{playersOf(team)}</p>
          {team.substitute && <p className="players">Suplente: {team.substitute}</p>}
        </div>
        <div className="team-stats">
          <div><span className="stat">{row.rank}.º</span><span className="stat-l">lugar</span></div>
          <div><span className="stat">{row.total}</span><span className="stat-l">pontos</span></div>
          <div><span className="stat">{row.played ? Math.round(row.points / row.played) : '–'}</span><span className="stat-l">média por jornada</span></div>
        </div>
      </div>

      <div className="table-scroll">
        <table className="sheet">
          <thead>
            <tr>
              <th scope="col">Jornada</th>
              <th scope="col">Mesa</th>
              <th scope="col">Adversário</th>
              <th className="c-num" scope="col">Feitos</th>
              <th className="c-num" scope="col">Sofridos</th>
              <th className="c-num" scope="col">Acumulado</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              let acc = 0
              return sheet.map((l) => {
                const done = l.pointsFor != null
                if (done) acc += l.pointsFor
                const res = !done ? '' : l.pointsFor > l.pointsAgainst ? 'win' : l.pointsFor < l.pointsAgainst ? 'loss' : 'draw'
                return (
                  <tr key={l.match.id} className={res}>
                    <td>{l.round}</td>
                    <td>{l.bye ? '–' : l.tableNo}</td>
                    <td>
                      {l.bye ? <span className="muted">Folga</span> : (
                        <Link to={`/t/${tid}/equipas/${l.opponentId}`}>{teamLabel(byId[l.opponentId])}</Link>
                      )}
                    </td>
                    <td className="c-num strong">{done ? l.pointsFor : ''}</td>
                    <td className="c-num">{done ? l.pointsAgainst : ''}</td>
                    <td className="c-num">{done ? acc : ''}</td>
                  </tr>
                )
              })
            })()}
          </tbody>
          <tfoot>
            {adj.map((a) => (
              <tr key={a.id} className="adj-row">
                <td colSpan={3}>Ajuste{a.round ? ` (jornada ${a.round})` : ''}: {a.reason || 'sem motivo indicado'}</td>
                <td className={`c-num ${a.points < 0 ? 'neg' : 'pos'}`}>{a.points > 0 ? `+${a.points}` : a.points}</td>
                <td colSpan={2} />
              </tr>
            ))}
            <tr>
              <th scope="row" colSpan={3}>Total</th>
              <td className="c-num strong">{row.total}</td>
              <td className="c-num">{row.against}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  )
}
