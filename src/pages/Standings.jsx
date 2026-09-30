import { useMemo } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import StandingsTable from '../components/StandingsTable'
import { computeStandings } from '../lib/standings'
import { currentRound, progress, roundNumbers } from '../lib/schedule'
import { PRIZE_PLACES, TIEBREAKERS } from '../lib/defaults'

export default function Standings() {
  const { tournament, teams, matches, adjustments } = useOutletContext()
  const s = tournament.settings
  const rows = useMemo(
    () => computeStandings({ teams, matches, adjustments, settings: s }),
    [teams, matches, adjustments, s],
  )
  const rounds = roundNumbers(matches)
  const prog = progress(matches)
  const cur = currentRound(matches)
  const finished = prog.total > 0 && prog.done === prog.total
  const prizes = (s.prizes || []).filter((p) => p.label?.trim())

  if (!teams.length) {
    return <p className="empty">As inscrições ainda estão abertas. A classificação aparece aqui quando o torneio começar.</p>
  }

  return (
    <section>
      <div className="section-head">
        <h2>{finished ? 'Classificação final' : 'Classificação'}</h2>
        {rounds.length > 0 && (
          <p className="progress-line">
            {finished ? (
              `Torneio concluído: ${rounds.length} jornadas, ${prog.total} encontros.`
            ) : prog.done === 0 ? (
              <>Ainda sem resultados. <Link to={`/t/${tournament.id}/jornadas?j=${cur}`}>Ver a jornada {cur}</Link>.</>
            ) : (
              <>
                Em jogo: <Link to={`/t/${tournament.id}/jornadas?j=${cur}`}>jornada {cur} de {rounds.length}</Link>.{' '}
                {prog.done} de {prog.total} encontros lançados.
              </>
            )}
          </p>
        )}
        {prog.total > 0 && (
          <div className="bar" aria-hidden="true"><span style={{ width: `${(prog.done / prog.total) * 100}%` }} /></div>
        )}
      </div>

      <StandingsTable rows={rows} tid={tournament.id} prizes={s.prizes} />

      <div className="aside-grid">
        {prizes.length > 0 && (
          <div className="aside">
            <h3>Prémios</h3>
            <dl className="prizes">
              {prizes.map((p) => (
                <div key={p.place}>
                  <dt>{PRIZE_PLACES.find((x) => x.value === p.place)?.label || p.place}</dt>
                  <dd>{p.label}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
        <div className="aside">
          <h3>Como se ordena</h3>
          <p className="small">
            Conta a soma dos pontos feitos em todas as jornadas (cada encontro distribui {Number(s.pointsPerGame) * Number(s.gamesPerRound)} pontos em {s.gamesPerRound} jogos).
            {s.tiebreakers?.length ? ' Em caso de empate: ' : ''}
            {s.tiebreakers?.map((k, i) => `${i + 1}) ${TIEBREAKERS[k]?.toLowerCase()}`).join('; ')}
            {s.tiebreakers?.length ? '.' : ''}
          </p>
        </div>
      </div>
    </section>
  )
}
