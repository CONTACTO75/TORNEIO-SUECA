import { useState } from 'react'
import { db } from '../../lib/db'
import { fmtDate, teamLabel } from '../../lib/format'
import { generateSchedule, hasResult, roundDayMap, roundNumbers } from '../../lib/schedule'

export default function ScheduleTab({ tournament, teams, matches, goTo }) {
  const [shuffle, setShuffle] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const byId = Object.fromEntries(teams.map((t) => [t.id, t]))
  const rounds = roundNumbers(matches)
  const results = matches.filter(hasResult).length
  const n = teams.length
  const expectedRounds = n < 2 ? 0 : n % 2 ? n : n - 1
  const tables = Math.floor(n / 2)
  const days = roundDayMap(tournament.settings, rounds.length || expectedRounds)
  const idsInSchedule = new Set(matches.flatMap((m) => [m.homeId, m.awayId]).filter(Boolean))
  const outOfSync = rounds.length > 0 && (teams.some((t) => !idsInSchedule.has(t.id)) || rounds.length !== expectedRounds)

  async function generate() {
    const msg = results
      ? `Já existem ${results} resultados lançados. Gerar um novo calendário apaga-os todos. Continuar?`
      : matches.length
        ? 'Substituir o calendário atual?'
        : null
    if (msg && !window.confirm(msg)) return
    setBusy(true)
    setError(null)
    try {
      await db.replaceMatches(tournament.id, generateSchedule(teams.map((t) => t.id), { shuffle }))
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section>
      <div className="panel">
        <h3>{rounds.length ? 'Gerar de novo' : 'Gerar calendário'}</h3>
        {n < 2 ? (
          <p className="small">São precisas pelo menos 2 equipas. <button className="linklike" onClick={() => goTo('equipas')}>Inscrever equipas</button></p>
        ) : (
          <>
            <p className="small">
              Com {n} equipas: {expectedRounds} jornadas, {tables} mesas em simultâneo
              {n % 2 ? ', e uma equipa de folga em cada jornada' : ''}. Todas as equipas jogam uma vez contra todas.
            </p>
            <label className="check">
              <input type="checkbox" checked={shuffle} onChange={(e) => setShuffle(e.target.checked)} />
              Sortear a ordem dos confrontos (sem sorteio, segue a ordem das letras, como no Excel)
            </label>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button type="button" className="btn primary" onClick={generate} disabled={busy}>
              {busy ? 'A gerar…' : rounds.length ? 'Gerar novo calendário' : 'Gerar calendário'}
            </button>
          </>
        )}
      </div>

      {outOfSync && (
        <p className="hint warn">As equipas mudaram desde que o calendário foi gerado. Gere-o de novo para incluir todas.</p>
      )}

      {rounds.length > 0 && (
        <div className="schedule-grid">
          {rounds.map((r) => (
            <div key={r} className="sched-round">
              <h4>
                Jornada {r}
                {days[r] && <span className="muted"> {fmtDate(days[r], { day: 'numeric', month: 'short' })}</span>}
              </h4>
              <ol>
                {matches
                  .filter((m) => m.round === r)
                  .map((m) => (
                    <li key={m.id}>
                      {m.awayId ? (
                        <>
                          <span className="muted">{m.tableNo}</span> {teamLabel(byId[m.homeId])} <span className="muted">vs</span> {teamLabel(byId[m.awayId])}
                        </>
                      ) : (
                        <span className="muted">Folga: {teamLabel(byId[m.homeId])}</span>
                      )}
                    </li>
                  ))}
              </ol>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
