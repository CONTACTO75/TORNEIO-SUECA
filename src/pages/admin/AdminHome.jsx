import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { db, isLocalMode } from '../../lib/db'
import { defaultSettings } from '../../lib/defaults'
import { fmtDates } from '../../lib/format'
import { importExample } from '../../lib/seed'
import { useAuth } from '../../hooks/useTournament'
import { ErrorBox, Loading } from '../../components/Status'
import AdminBar from './AdminBar'

export default function AdminHome() {
  const user = useAuth()
  const nav = useNavigate()
  const [list, setList] = useState(null)
  const [error, setError] = useState(null)
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)

  const load = () => db.listTournaments().then(setList).catch(setError)
  useEffect(() => {
    load()
  }, [])

  async function create(e) {
    e.preventDefault()
    if (!name.trim()) return
    setBusy(true)
    try {
      const t = await db.saveTournament({ name: name.trim(), settings: defaultSettings(), isActive: !list?.some((x) => x.isActive) })
      nav(`/admin/t/${t.id}?separador=definicoes`)
    } catch (err) {
      setError(err)
      setBusy(false)
    }
  }

  async function loadExample() {
    setBusy(true)
    try {
      const id = await importExample()
      nav(`/admin/t/${id}`)
    } catch (err) {
      setError(err)
      setBusy(false)
    }
  }

  return (
    <div className="shell admin">
      <AdminBar user={user} />
      <main className="wrap">
        {error && <ErrorBox error={error} />}
        <div className="section-head"><h2>Torneios</h2></div>
        {!list ? <Loading /> : list.length === 0 ? (
          <p className="empty">Ainda não há torneios. Crie o primeiro abaixo, ou carregue o de 2026 para experimentar.</p>
        ) : (
          <ul className="t-list">
            {list.map((t) => (
              <li key={t.id}>
                <Link to={`/admin/t/${t.id}`}>
                  <span className="t-list-name">{t.name}</span>
                  <span className="muted">{fmtDates(t.settings.dates) || 'Sem datas'}</span>
                  {t.isActive && <span className="badge">Na página inicial</span>}
                </Link>
              </li>
            ))}
          </ul>
        )}

        <form className="panel inline-form" onSubmit={create}>
          <label className="field grow">
            <span>Novo torneio</span>
            <input placeholder="Ex.: Torneio de Sueca A.R.A. 2027" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <button className="btn primary" disabled={busy || !name.trim()}>Criar torneio</button>
        </form>

        <div className="panel subtle">
          <h3>Experimentar com dados reais</h3>
          <p className="small">Cria uma cópia do torneio de fevereiro e março de 2026, com as 16 equipas e os 120 resultados do Excel. Pode apagá-la depois em Definições.</p>
          <button type="button" className="btn" onClick={loadExample} disabled={busy}>Carregar torneio de 2026</button>
        </div>

        {isLocalMode && (
          <div className="panel warn">
            <h3>Modo local</h3>
            <p className="small">
              A base de dados partilhada ainda não está ligada, por isso os dados ficam guardados só neste navegador.
              Para vários telemóveis lançarem resultados ao mesmo tempo, siga o guia no ficheiro LEIA-ME.md.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
