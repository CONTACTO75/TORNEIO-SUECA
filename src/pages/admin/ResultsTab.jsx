import { useEffect, useState } from 'react'
import { db } from '../../lib/db'
import { pointsPerRound } from '../../lib/defaults'
import { fmtTime, playersOf, teamLabel } from '../../lib/format'
import { currentRound, hasResult, isPlayable, roundNumbers } from '../../lib/schedule'

function ResultRow({ m, byId, total, userEmail }) {
  const [h, setH] = useState(m.homePoints ?? '')
  const [a, setA] = useState(m.awayPoints ?? '')
  const [auto, setAuto] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [flash, setFlash] = useState(false)

  useEffect(() => {
    setH(m.homePoints ?? '')
    setA(m.awayPoints ?? '')
    setAuto(null)
  }, [m.homePoints, m.awayPoints])

  const clean = (v) => v.replace(/\D/g, '').slice(0, 4)
  function change(side, raw) {
    const v = clean(raw)
    const other = side === 'h' ? a : h
    const otherAuto = side === 'h' ? 'a' : 'h'
    side === 'h' ? setH(v) : setA(v)
    if (other === '' || auto === otherAuto) {
      const comp = v === '' || Number(v) > total ? '' : String(total - Number(v))
      side === 'h' ? setA(comp) : setH(comp)
      setAuto(comp === '' ? null : otherAuto)
    } else if (auto === side) {
      setAuto(null)
    }
  }

  const filled = h !== '' && a !== ''
  const sum = Number(h) + Number(a)
  const valid = filled && sum === total
  const dirty = String(h) !== String(m.homePoints ?? '') || String(a) !== String(m.awayPoints ?? '')
  const saved = hasResult(m) && !dirty
  const state = saved ? 'saved' : !filled ? 'blank' : valid ? 'ready' : 'invalid'

  async function save(e) {
    e?.preventDefault()
    if (!valid || !dirty || busy) return
    if (hasResult(m) && !window.confirm(`Substituir o resultado ${m.homePoints}–${m.awayPoints} por ${h}–${a}?`)) return
    setBusy(true)
    setError(null)
    try {
      await db.saveMatchResult(m.id, Number(h), Number(a), userEmail)
      setFlash(true)
      setTimeout(() => setFlash(false), 1500)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function clear() {
    if (!window.confirm('Apagar o resultado desta mesa?')) return
    setBusy(true)
    try {
      await db.saveMatchResult(m.id, null, null, userEmail)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const home = byId[m.homeId]
  const away = byId[m.awayId]
  return (
    <form className={`result-row ${state}${flash ? ' flash' : ''}`} onSubmit={save}>
      <span className="table-no">Mesa {m.tableNo}</span>
      <label className="rr-side">
        <span className="rr-team">{teamLabel(home)}</span>
        <span className="rr-players">{playersOf(home)}</span>
        <input
          inputMode="numeric"
          aria-label={`Pontos de ${teamLabel(home)}`}
          value={h}
          onChange={(e) => change('h', e.target.value)}
          className={auto === 'h' ? 'auto' : ''}
        />
      </label>
      <label className="rr-side">
        <span className="rr-team">{teamLabel(away)}</span>
        <span className="rr-players">{playersOf(away)}</span>
        <input
          inputMode="numeric"
          aria-label={`Pontos de ${teamLabel(away)}`}
          value={a}
          onChange={(e) => change('a', e.target.value)}
          className={auto === 'a' ? 'auto' : ''}
        />
      </label>
      <div className="rr-actions">
        {state === 'invalid' && <span className="rr-msg bad">Soma {sum}; tem de dar {total}</span>}
        {state === 'saved' && (
          <span className="rr-msg ok">
            {flash ? 'Guardado' : `Lançado${m.updatedAt ? ` às ${fmtTime(m.updatedAt)}` : ''}${m.updatedBy ? ` por ${m.updatedBy}` : ''}`}
          </span>
        )}
        {error && <span className="rr-msg bad">{error}</span>}
        {!saved && (
          <button className="btn primary" disabled={!valid || busy}>{hasResult(m) ? 'Corrigir' : 'Guardar'}</button>
        )}
        {hasResult(m) && !dirty && (
          <button type="button" className="btn ghost small" onClick={clear} disabled={busy}>Apagar</button>
        )}
      </div>
    </form>
  )
}

export default function ResultsTab({ tournament, teams, matches, user, goTo }) {
  const rounds = roundNumbers(matches)
  const [sel, setSel] = useState(() => currentRound(matches))
  if (!rounds.length) {
    return (
      <div className="empty">
        <p>Ainda não há calendário.</p>
        <button className="btn primary" onClick={() => goTo('calendario')}>Gerar calendário</button>
      </div>
    )
  }
  const round = rounds.includes(sel) ? sel : rounds[0]
  const byId = Object.fromEntries(teams.map((t) => [t.id, t]))
  const total = pointsPerRound(tournament.settings)
  const list = matches.filter((m) => m.round === round).sort((a, b) => (a.tableNo ?? 999) - (b.tableNo ?? 999))
  const playable = list.filter(isPlayable)
  const done = playable.filter(hasResult).length
  const stateOf = (r) => {
    const ms = matches.filter((m) => m.round === r && isPlayable(m))
    const d = ms.filter(hasResult).length
    return d === 0 ? '' : d === ms.length ? 'done' : 'partial'
  }

  return (
    <section>
      <p className="hint">
        Escreva os pontos totais de uma equipa na jornada (a soma dos {tournament.settings.gamesPerRound} jogos); a outra é preenchida
        automaticamente para dar {total}. Os resultados aparecem na hora na classificação e na TV.
      </p>
      <nav className="round-pills" aria-label="Escolher jornada">
        {rounds.map((r) => (
          <button key={r} type="button" className={`pill ${stateOf(r)}${r === round ? ' current' : ''}`} onClick={() => setSel(r)}>
            {r}
          </button>
        ))}
      </nav>
      <div className="section-head row">
        <h2>Jornada {round}</h2>
        <span className="muted">{done} de {playable.length} mesas lançadas</span>
      </div>
      <div className="results">
        {list.map((m) =>
          m.awayId ? (
            <ResultRow key={m.id} m={m} byId={byId} total={total} userEmail={user?.email} />
          ) : (
            <p key={m.id} className="muted bye-line">Folga: {teamLabel(byId[m.homeId])}</p>
          ),
        )}
      </div>
      {done === playable.length && rounds.includes(round + 1) && (
        <button type="button" className="btn" onClick={() => setSel(round + 1)}>Passar à jornada {round + 1}</button>
      )}
    </section>
  )
}
