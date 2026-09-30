import { Link } from 'react-router-dom'
import { db, isLocalMode } from '../../lib/db'

export default function AdminBar({ user, children }) {
  return (
    <header className="site-head admin-head">
      <div className="wrap head-row">
        <div className="head-title">
          {children && <p className="t-meta"><Link to="/admin">Todos os torneios</Link></p>}
          <h1 className="t-name">{children || 'Gestão de torneios'}</h1>
        </div>
        <div className="admin-user">
          <span className="muted small">{isLocalMode ? 'Modo local' : user?.email}</span>
          {!isLocalMode && (
            <button type="button" className="btn ghost small" onClick={() => db.auth.signOut()}>Sair</button>
          )}
        </div>
      </div>
    </header>
  )
}
