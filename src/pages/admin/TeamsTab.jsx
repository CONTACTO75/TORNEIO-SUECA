import { useState } from 'react'
import { db } from '../../lib/db'
import { codeFor, nextCode, playersOf, teamLabel } from '../../lib/format'

const EMPTY = { name: '', player1: '', player2: '', substitute: '', contact1: '', contact2: '', paid: false }

function TeamForm({ initial, onSave, onCancel, submitLabel }) {
  const [f, setF] = useState({ ...EMPTY, ...initial })
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })
  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    try {
      await onSave(f)
      if (!initial?.id) setF(EMPTY)
    } finally {
      setBusy(false)
    }
  }
  return (
    <form className="team-form" onSubmit={submit}>
      <label className="field"><span>Jogador 1</span><input required value={f.player1} onChange={set('player1')} /></label>
      <label className="field"><span>Jogador 2</span><input required value={f.player2} onChange={set('player2')} /></label>
      <label className="field"><span>Suplente (opcional)</span><input value={f.substitute} onChange={set('substitute')} /></label>
      <label className="field"><span>Contacto 1</span><input type="tel" value={f.contact1} onChange={set('contact1')} /></label>
      <label className="field"><span>Contacto 2</span><input type="tel" value={f.contact2} onChange={set('contact2')} /></label>
      <label className="field"><span>Nome da equipa (opcional)</span><input placeholder="Por omissão: Equipa + letra" value={f.name} onChange={set('name')} /></label>
      <label className="check"><input type="checkbox" checked={f.paid} onChange={set('paid')} /> Inscrição paga</label>
      <div className="form-actions">
        <button className="btn primary" disabled={busy}>{submitLabel}</button>
        {onCancel && <button type="button" className="btn ghost" onClick={onCancel}>Cancelar</button>}
      </div>
    </form>
  )
}

export default function TeamsTab({ tournament, teams, matches, adjustments }) {
  const [editing, setEditing] = useState(null)
  const [paste, setPaste] = useState('')
  const [showPaste, setShowPaste] = useState(false)
  const [error, setError] = useState(null)
  const hasSchedule = matches.length > 0
  const paid = teams.filter((t) => t.paid).length

  const guard = async (fn) => {
    setError(null)
    try {
      await fn()
    } catch (err) {
      setError(err.message)
    }
  }

  const add = (f) => guard(() => db.saveTeam({ ...f, tournamentId: tournament.id, code: nextCode(teams) }))
  const update = (f) => guard(async () => {
    await db.saveTeam(f)
    setEditing(null)
  })
  const togglePaid = (t) => guard(() => db.saveTeam({ ...t, paid: !t.paid }))
  const remove = (t) => {
    const n = matches.filter((m) => m.homeId === t.id || m.awayId === t.id).length + adjustments.filter((a) => a.teamId === t.id).length
    const msg = n
      ? `Remover ${teamLabel(t)}? Os seus ${n} encontros e ajustes também são apagados e o calendário fica incompleto.`
      : `Remover ${teamLabel(t)}?`
    if (window.confirm(msg)) guard(() => db.deleteTeam(t.id))
  }

  // Colar do Excel: uma equipa por linha. Colunas: Jogador 1, Jogador 2, [Contacto 1, Contacto 2].
  // Se a primeira coluna for "Equipa X", é ignorada.
  const parsed = paste
    .split(/\r?\n/)
    .map((l) => l.split('\t').map((c) => c.trim()))
    .map((c) => (/^equipa\s+\S+$/i.test(c[0]) ? c.slice(1) : c))
    .filter((c) => c[0] && !/^jogador/i.test(c[0]))
  async function importPaste() {
    const used = new Set(teams.map((t) => t.code))
    let i = 0
    const list = parsed.map((c) => {
      while (used.has(codeFor(i))) i++
      const code = codeFor(i++)
      return { ...EMPTY, tournamentId: tournament.id, code, player1: c[0] || '', player2: c[1] || '', contact1: c[2] || '', contact2: c[3] || '' }
    })
    await guard(() => db.saveTeams(list))
    setPaste('')
    setShowPaste(false)
  }

  return (
    <section>
      {hasSchedule && (
        <p className="hint warn">O calendário já foi gerado. Se adicionar ou remover equipas, gere-o de novo no separador Calendário.</p>
      )}
      <div className="section-head row">
        <h2>{teams.length} equipas</h2>
        {teams.length > 0 && <span className="muted">{paid} de {teams.length} inscrições pagas</span>}
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}

      {teams.length > 0 && (
        <ul className="admin-teams">
          {teams.map((t) =>
            editing === t.id ? (
              <li key={t.id} className="editing">
                <strong>{teamLabel(t)}</strong>
                <TeamForm initial={t} onSave={update} onCancel={() => setEditing(null)} submitLabel="Guardar alterações" />
              </li>
            ) : (
              <li key={t.id}>
                <span className="team-code" aria-hidden="true">{t.code}</span>
                <span className="grow">
                  <span className="team-link">{teamLabel(t)}</span>
                  <span className="players">{playersOf(t)}{t.substitute ? `, suplente ${t.substitute}` : ''}</span>
                  {(t.contact1 || t.contact2) && <span className="players">{[t.contact1, t.contact2].filter(Boolean).join(', ')}</span>}
                </span>
                <button type="button" className={`chip ${t.paid ? 'on' : ''}`} onClick={() => togglePaid(t)} aria-pressed={t.paid}>
                  {t.paid ? 'Pago' : 'Por pagar'}
                </button>
                <button type="button" className="btn ghost small" onClick={() => setEditing(t.id)}>Editar</button>
                <button type="button" className="btn ghost small danger" onClick={() => remove(t)}>Remover</button>
              </li>
            ),
          )}
        </ul>
      )}

      <div className="panel">
        <h3>Inscrever equipa ({teamLabel({ code: nextCode(teams) })})</h3>
        <TeamForm onSave={add} submitLabel="Inscrever equipa" />
      </div>

      <div className="panel subtle">
        <h3>Importar do Excel</h3>
        {!showPaste ? (
          <>
            <p className="small">Copie as linhas da folha de inscrições (Jogador 1, Jogador 2 e, se quiser, os contactos) e cole-as aqui.</p>
            <button type="button" className="btn" onClick={() => setShowPaste(true)}>Colar lista de equipas</button>
          </>
        ) : (
          <>
            <textarea
              rows={8}
              value={paste}
              onChange={(e) => setPaste(e.target.value)}
              placeholder={'André Santos\tEdgar Rodrigues\nLuis Sousa\tMario Beliz'}
              aria-label="Lista de equipas colada do Excel"
            />
            <div className="form-actions">
              <button type="button" className="btn primary" disabled={!parsed.length} onClick={importPaste}>
                Importar {parsed.length} equipas
              </button>
              <button type="button" className="btn ghost" onClick={() => setShowPaste(false)}>Cancelar</button>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
