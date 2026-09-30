import { teamLabel } from '../lib/format'
import { hasResult } from '../lib/schedule'

export default function MatchCard({ match, byId }) {
  const home = byId[match.homeId]
  if (!match.awayId) {
    return (
      <div className="match bye">
        <span className="table-no">Folga</span>
        <span className="side">{teamLabel(home)}</span>
      </div>
    )
  }
  const away = byId[match.awayId]
  const done = hasResult(match)
  const hw = done && match.homePoints > match.awayPoints
  const aw = done && match.awayPoints > match.homePoints
  return (
    <div className={`match${done ? ' done' : ''}`}>
      <span className="table-no">Mesa {match.tableNo}</span>
      <span className={`side home${hw ? ' win' : ''}`}>{teamLabel(home)}</span>
      <span className="score">
        {done ? (
          <>
            <b className={hw ? 'win' : ''}>{match.homePoints}</b>
            <i>–</i>
            <b className={aw ? 'win' : ''}>{match.awayPoints}</b>
          </>
        ) : (
          <span className="pending">por lançar</span>
        )}
      </span>
      <span className={`side away${aw ? ' win' : ''}`}>{teamLabel(away)}</span>
    </div>
  )
}
