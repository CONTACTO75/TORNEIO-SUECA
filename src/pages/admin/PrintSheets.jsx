import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTournamentData } from '../../hooks/useTournament'
import { ErrorBox, Loading, NotFound } from '../../components/Status'
import { fmtDate, playersOf, teamLabel } from '../../lib/format'
import { roundDayMap, roundNumbers } from '../../lib/schedule'

export default function PrintSheets() {
  const { tid } = useParams()
  const q = useTournamentData(tid)
  const [which, setWhich] = useState('all')
  if (q.loading) return <Loading />
  if (q.error) return <ErrorBox error={q.error} />
  if (!q.data?.tournament) return <NotFound />

  const { tournament, teams, matches } = q.data
  const s = tournament.settings
  const byId = Object.fromEntries(teams.map((t) => [t.id, t]))
  const rounds = roundNumbers(matches)
  const days = roundDayMap(s, rounds.length)
  const list = matches.filter((m) => m.awayId && (which === 'all' || m.round === Number(which) || (which.startsWith('d:') && days[m.round] === which.slice(2))))
  const games = Array.from({ length: Number(s.gamesPerRound) || 4 }, (_, i) => i + 1)
  const dayOptions = [...new Set(Object.values(days))]

  return (
    <div className="print-page">
      <div className="no-print print-controls wrap">
        <Link to={`/admin/t/${tid}`}>Voltar à gestão</Link>
        <label className="field">
          <span>Imprimir</span>
          <select value={which} onChange={(e) => setWhich(e.target.value)}>
            <option value="all">Todas as jornadas ({matches.filter((m) => m.awayId).length} folhas)</option>
            {dayOptions.map((d) => <option key={d} value={`d:${d}`}>Dia {fmtDate(d)}</option>)}
            {rounds.map((r) => <option key={r} value={r}>Jornada {r}</option>)}
          </select>
        </label>
        <button type="button" className="btn primary" onClick={() => window.print()}>Imprimir {list.length} folhas</button>
        <p className="small muted">Quatro folhas por página A4. Recorte pelas linhas.</p>
      </div>
      <div className="sheets">
        {list.map((m) => {
          const h = byId[m.homeId]
          const a = byId[m.awayId]
          return (
            <article key={m.id} className="game-sheet">
              <header>
                <strong>Folha de jogo</strong>
                <span>Jornada {m.round}, mesa {m.tableNo}</span>
              </header>
              <p className="gs-t">
                {s.logo && <img className="gs-logo" src={s.logo} alt="" />}
                {tournament.name}
              </p>
              <table>
                <thead>
                  <tr>
                    <th>Jogo</th>
                    <th>{teamLabel(h)}<small>{playersOf(h)}</small></th>
                    <th>{teamLabel(a)}<small>{playersOf(a)}</small></th>
                  </tr>
                </thead>
                <tbody>
                  {games.map((g) => <tr key={g}><td>{g}</td><td /><td /></tr>)}
                </tbody>
                <tfoot>
                  <tr><th>Total</th><td /><td /></tr>
                </tfoot>
              </table>
              <p className="gs-foot">Cada jogo soma {s.pointsPerGame} pontos. Total da jornada: {Number(s.pointsPerGame) * games.length}.</p>
            </article>
          )
        })}
      </div>
    </div>
  )
}
