import { Link } from 'react-router-dom'

export function Loading({ label = 'A carregar…' }) {
  return <div className="status-box" role="status">{label}</div>
}

export function ErrorBox({ error }) {
  return (
    <div className="status-box error" role="alert">
      <strong>Não foi possível carregar os dados.</strong>
      <span>{error?.message || String(error)}</span>
      <span>Verifique a ligação à internet e recarregue a página.</span>
    </div>
  )
}

export function NotFound({ title = 'Página não encontrada', children }) {
  return (
    <div className="status-box">
      <strong>{title}</strong>
      {children}
      <Link to="/">Ir para a página inicial</Link>
    </div>
  )
}
