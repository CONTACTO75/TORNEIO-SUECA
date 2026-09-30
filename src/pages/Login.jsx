import { useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { db, isLocalMode } from '../lib/db'
import { useAuth } from '../hooks/useTournament'

export default function Login() {
  const user = useAuth()
  const [params] = useSearchParams()
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const next = params.get('voltar') || '/admin'

  if (isLocalMode || user) return <Navigate to={next} replace />

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await db.auth.signIn(email.trim(), password)
      nav(next, { replace: true })
    } catch (err) {
      setError(err.message === 'Invalid login credentials' ? 'Email ou palavra-passe errados.' : err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login">
      <form className="panel" onSubmit={submit}>
        <h1 className="t-name">Gestão do torneio</h1>
        <p className="muted">Entrada reservada à organização.</p>
        <label className="field">
          <span>Email</span>
          <input type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="field">
          <span>Palavra-passe</span>
          <input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="btn primary" disabled={busy}>{busy ? 'A entrar…' : 'Entrar'}</button>
        <Link to="/" className="small">Voltar às classificações</Link>
      </form>
    </div>
  )
}
