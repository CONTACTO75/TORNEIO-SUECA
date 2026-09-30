import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../../lib/db'
import { PRIZE_PLACES, TIEBREAKERS, pointsPerRound } from '../../lib/defaults'

export default function SettingsTab({ tournament }) {
  const nav = useNavigate()
  const [name, setName] = useState(tournament.name)
  const [isActive, setIsActive] = useState(tournament.isActive)
  const [s, setS] = useState(() => structuredClone(tournament.settings))
  const [state, setState] = useState(null)
  const set = (k) => (e) => setS({ ...s, [k]: e.target.value })

  const tb = s.tiebreakers || []
  const unused = Object.keys(TIEBREAKERS).filter((k) => !tb.includes(k))
  const moveTb = (i, d) => {
    const a = [...tb]
    ;[a[i], a[i + d]] = [a[i + d], a[i]]
    setS({ ...s, tiebreakers: a })
  }

  async function save(e) {
    e.preventDefault()
    setState('busy')
    try {
      const settings = {
        ...s,
        dates: s.dates.filter(Boolean).sort(),
        pointsPerGame: Number(s.pointsPerGame) || 120,
        gamesPerRound: Number(s.gamesPerRound) || 4,
        prizes: s.prizes.filter((p) => p.label.trim()),
      }
      await db.saveTournament({ ...tournament, name: name.trim() || tournament.name, isActive, settings })
      setState('saved')
      setTimeout(() => setState(null), 2000)
    } catch (err) {
      setState(err.message)
    }
  }

  async function remove() {
    if (window.prompt(`Para apagar definitivamente, escreva APAGAR`) !== 'APAGAR') return
    await db.deleteTournament(tournament.id)
    nav('/admin')
  }

  return (
    <form className="settings" onSubmit={save}>
      <div className="panel">
        <h3>Torneio</h3>
        <label className="field"><span>Nome</span><input value={name} onChange={(e) => setName(e.target.value)} required /></label>
        <label className="field"><span>Organização</span><input value={s.organizer} onChange={set('organizer')} placeholder="Associação Recreativa Andrinense" /></label>
        <label className="field"><span>Local</span><input value={s.venue} onChange={set('venue')} placeholder="Sede da associação" /></label>
        <label className="check">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          Mostrar este torneio na página inicial (só um de cada vez)
        </label>
      </div>

      <div className="panel">
        <h3>Datas</h3>
        <div className="date-list">
          {s.dates.map((d, i) => (
            <div key={i} className="date-item">
              <input type="date" value={d} aria-label={`Dia ${i + 1}`} onChange={(e) => setS({ ...s, dates: s.dates.map((x, j) => (j === i ? e.target.value : x)) })} />
              <button type="button" className="btn ghost small" onClick={() => setS({ ...s, dates: s.dates.filter((_, j) => j !== i) })}>Remover</button>
            </div>
          ))}
          <button type="button" className="btn small" onClick={() => setS({ ...s, dates: [...s.dates, ''] })}>Acrescentar dia</button>
        </div>
        <label className="field"><span>Hora de início</span><input type="time" value={s.startTime} onChange={set('startTime')} /></label>
        <label className="field">
          <span>Jornadas por dia (opcional)</span>
          <input value={s.roundsPerDay} onChange={set('roundsPerDay')} placeholder="Ex.: 8, 7. Vazio = dividir por igual" />
        </label>
      </div>

      <div className="panel">
        <h3>Pontuação</h3>
        <div className="two-col">
          <label className="field"><span>Pontos por jogo</span><input type="number" min="1" value={s.pointsPerGame} onChange={set('pointsPerGame')} /></label>
          <label className="field"><span>Jogos por jornada</span><input type="number" min="1" value={s.gamesPerRound} onChange={set('gamesPerRound')} /></label>
        </div>
        <p className="small">Cada encontro distribui {pointsPerRound(s)} pontos. Ao lançar um resultado, a app confirma que a soma dá este valor.</p>

        <h4>Critérios de desempate, por ordem</h4>
        <ol className="tb-list">
          {tb.map((k, i) => (
            <li key={k}>
              <span className="grow">{TIEBREAKERS[k]}</span>
              <button type="button" className="btn ghost small" disabled={i === 0} onClick={() => moveTb(i, -1)} aria-label="Subir">Subir</button>
              <button type="button" className="btn ghost small" disabled={i === tb.length - 1} onClick={() => moveTb(i, 1)} aria-label="Descer">Descer</button>
              <button type="button" className="btn ghost small" onClick={() => setS({ ...s, tiebreakers: tb.filter((x) => x !== k) })}>Retirar</button>
            </li>
          ))}
        </ol>
        {unused.map((k) => (
          <button key={k} type="button" className="chip" onClick={() => setS({ ...s, tiebreakers: [...tb, k] })}>Acrescentar: {TIEBREAKERS[k]}</button>
        ))}
        <p className="small">Se continuarem empatadas depois de todos os critérios, as equipas partilham o lugar.</p>
      </div>

      <div className="panel">
        <h3>Prémios</h3>
        {s.prizes.map((p, i) => (
          <div key={i} className="prize-item">
            <select value={p.place} aria-label="Lugar" onChange={(e) => setS({ ...s, prizes: s.prizes.map((x, j) => (j === i ? { ...x, place: e.target.value } : x)) })}>
              {PRIZE_PLACES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <input value={p.label} aria-label="Prémio" placeholder="Ex.: Bacalhau" onChange={(e) => setS({ ...s, prizes: s.prizes.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} />
            <button type="button" className="btn ghost small" onClick={() => setS({ ...s, prizes: s.prizes.filter((_, j) => j !== i) })}>Remover</button>
          </div>
        ))}
        <button type="button" className="btn small" onClick={() => setS({ ...s, prizes: [...s.prizes, { place: 'last', label: '' }] })}>Acrescentar prémio</button>
      </div>

      <div className="sticky-save">
        <button className="btn primary" disabled={state === 'busy'}>Guardar definições</button>
        {state === 'saved' && <span className="rr-msg ok">Definições guardadas</span>}
        {state && !['busy', 'saved'].includes(state) && <span className="rr-msg bad">{state}</span>}
      </div>

      <div className="panel danger-zone">
        <h3>Apagar torneio</h3>
        <p className="small">Apaga as equipas, o calendário, os resultados e as penalizações deste torneio. Não é possível desfazer. Exporte para Excel antes, se quiser guardar uma cópia.</p>
        <button type="button" className="btn danger" onClick={remove}>Apagar torneio</button>
      </div>
    </form>
  )
}
