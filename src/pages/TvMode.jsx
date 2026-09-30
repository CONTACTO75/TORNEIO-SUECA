import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTournamentData } from '../hooks/useTournament'
import { computeStandings } from '../lib/standings'
import { currentRound, hasResult, progress, roundNumbers } from '../lib/schedule'
import { playersOf, teamLabel } from '../lib/format'
import { ErrorBox, Loading, NotFound } from '../components/Status'

const ROWS_PER_PAGE = 16
const PAGE_SECONDS = 15

function useClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 10000)
    return () => clearInterval(t)
  }, [])
  return now
}

export default function TvMode() {
  const { tid } = useParams()
  const q = useTournamentData(tid)
  const now = useClock()
  const [page, setPage] = useState(0)

  useEffect(() => {
    document.body.classList.add('tv-body')
    return () => document.body.classList.remove('tv-body')
  }, [])

  const data = q.data
  const rows = useMemo(
    () => (data?.tournament ? computeStandings({ ...data, settings: data.tournament.settings }) : []),
    [data],
  )
  const pages = Math.max(1, Math.ceil(rows.length / ROWS_PER_PAGE))
  useEffect(() => {
    if (pages < 2) return
    const t = setInterval(() => setPage((p) => (p + 1) % pages), PAGE_SECONDS * 1000)
    return () => clearInterval(t)
  }, [pages])

  if (q.loading) return <Loading />
  if (q.error) return <ErrorBox error={q.error} />
  if (!data?.tournament) return <NotFound title="Este torneio não existe." />

  const { tournament, teams, matches } = data
  const byId = Object.fromEntries(teams.map((t) => [t.id, t]))
  const rounds = roundNumbers(matches)
  const cur = currentRound(matches)
  const prog = progress(matches)
  const finished = prog.total > 0 && prog.done === prog.total
  const roundMatches = matches.filter((m) => m.round === cur).sort((a, b) => (a.tableNo ?? 999) - (b.tableNo ?? 999))
  const visible = rows.slice((page % pages) * ROWS_PER_PAGE, (page % pages + 1) * ROWS_PER_PAGE)

  const goFull = () => document.documentElement.requestFullscreen?.().catch(() => {})

  return (
    <div className="tv">
      <header className="tv-head">
        <h1>{tournament.name}</h1>
        <div className="tv-meta">
          {rounds.length > 0 && (
            <span className="tv-round">{finished ? 'Classificação final' : `Jornada ${cur} de ${rounds.length}`}</span>
          )}
          <span className="tv-clock">{now.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}</span>
          <button type="button" className="tv-btn" onClick={goFull}>Ecrã inteiro</button>
          <Link className="tv-btn" to={`/t/${tid}`}>Sair</Link>
        </div>
      </header>

      <div className="tv-grid">
        <section className="tv-standings" aria-label="Classificação">
          <table>
            <tbody>
              {visible.map((r) => (
                <tr key={r.team.id} className={r.played > 0 && r.rank <= 3 ? `podium-${r.rank}` : ''}>
                  <td className="tv-rank">{r.rank}</td>
                  <td className="tv-team">
                    <span>{teamLabel(r.team)}</span>
                    <small>{playersOf(r.team)}</small>
                  </td>
                  <td className="tv-played">{r.played}J</td>
                  <td className="tv-pts">{r.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {pages > 1 && <p className="tv-page">Página {(page % pages) + 1} de {pages}</p>}
        </section>

        {!finished && roundMatches.length > 0 && (
          <section className="tv-round-list" aria-label={`Jornada ${cur}`}>
            <h2>Jornada {cur}</h2>
            <ol>
              {roundMatches.map((m) => {
                if (!m.awayId) return <li key={m.id} className="tv-bye">Folga: {teamLabel(byId[m.homeId])}</li>
                const done = hasResult(m)
                return (
                  <li key={m.id} className={done ? 'done' : ''}>
                    <span className="tv-table">{m.tableNo}</span>
                    <span className={done && m.homePoints > m.awayPoints ? 'w' : ''}>{byId[m.homeId]?.code}</span>
                    <span className="tv-score">{done ? `${m.homePoints}–${m.awayPoints}` : 'vs'}</span>
                    <span className={done && m.awayPoints > m.homePoints ? 'w' : ''}>{byId[m.awayId]?.code}</span>
                  </li>
                )
              })}
            </ol>
            <p className="tv-legend">Mesa, equipa, pontos, equipa</p>
          </section>
        )}
      </div>
    </div>
  )
}
