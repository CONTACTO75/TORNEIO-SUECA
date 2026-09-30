import { useState } from 'react'
import { db } from '../../lib/db'
import { teamLabel } from '../../lib/format'
import { roundNumbers } from '../../lib/schedule'

export default function AdjustmentsTab({ tournament, teams, matches, adjustments }) {
  const s = tournament.settings
  const ppg = Number(s.pointsPerGame) || 120
  const games = Number(s.gamesPerRound) || 4
  const presets = [
    { label: `Renúncia do adversário (+1 jogo = +${ppg})`, points: ppg, reason: 'Renúncia da equipa adversária (regulamento, 5.º, n.º 3)' },
    { label: `Falar durante o jogo (−${games} jogos = −${ppg * games})`, points: -ppg * games, reason: 'Diálogo durante o jogo (regulamento, 5.º, n.º 4)' },
    { label: `Sinais não permitidos (−${ppg})`, points: -ppg, reason: 'Sinais não permitidos (regulamento, 5.º, n.º 2)' },
  ]
  const [f, setF] = useState({ teamId: '', round: '', points: '', reason: '' })
  const [error, setError] = useState(null)
  const byId = Object.fromEntries(teams.map((t) => [t.id, t]))
  const rounds = roundNumbers(matches)

  async function submit(e) {
    e.preventDefault()
    setError(null)
    const points = Number(f.points)
    if (!f.teamId || !Number.isInteger(points) || points === 0) {
      setError('Escolha a equipa e indique os pontos (positivos ou negativos, sem ser zero).')
      return
    }
    try {
      await db.saveAdjustment({ tournamentId: tournament.id, teamId: f.teamId, round: f.round ? Number(f.round) : null, points, reason: f.reason.trim() })
      setF({ teamId: '', round: '', points: '', reason: '' })
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <section>
      <p className="hint">
        Use para penalizações e decisões da organização. Os pontos somam (ou descontam) ao total da equipa e ficam visíveis na sua folha,
        com o motivo. Os valores sugeridos são uma proposta: confirme-os com o regulamento.
      </p>
      <form className="panel adj-form" onSubmit={submit}>
        <div className="preset-row">
          {presets.map((p) => (
            <button key={p.label} type="button" className="chip" onClick={() => setF({ ...f, points: String(p.points), reason: p.reason })}>
              {p.label}
            </button>
          ))}
        </div>
        <label className="field">
          <span>Equipa</span>
          <select value={f.teamId} onChange={(e) => setF({ ...f, teamId: e.target.value })} required>
            <option value="">Escolher…</option>
            {teams.map((t) => <option key={t.id} value={t.id}>{teamLabel(t)}</option>)}
          </select>
        </label>
        <label className="field">
          <span>Jornada (opcional)</span>
          <select value={f.round} onChange={(e) => setF({ ...f, round: e.target.value })}>
            <option value="">Nenhuma</option>
            {rounds.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>
        <label className="field">
          <span>Pontos</span>
          <input inputMode="numeric" placeholder="Ex.: -480 ou 120" value={f.points} onChange={(e) => setF({ ...f, points: e.target.value.replace(/[^\d-]/g, '') })} />
        </label>
        <label className="field grow">
          <span>Motivo</span>
          <input value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} />
        </label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="btn primary">Registar</button>
      </form>

      {adjustments.length === 0 ? (
        <p className="empty">Sem penalizações nem ajustes registados.</p>
      ) : (
        <div className="table-scroll">
          <table className="sheet">
            <thead>
              <tr><th scope="col">Equipa</th><th scope="col">Jornada</th><th className="c-num" scope="col">Pontos</th><th scope="col">Motivo</th><th /></tr>
            </thead>
            <tbody>
              {adjustments.map((a) => (
                <tr key={a.id}>
                  <td>{teamLabel(byId[a.teamId])}</td>
                  <td>{a.round ?? '–'}</td>
                  <td className={`c-num ${a.points < 0 ? 'neg' : 'pos'}`}>{a.points > 0 ? `+${a.points}` : a.points}</td>
                  <td>{a.reason}</td>
                  <td>
                    <button type="button" className="btn ghost small danger" onClick={() => window.confirm('Apagar este ajuste?') && db.deleteAdjustment(a.id)}>
                      Apagar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
