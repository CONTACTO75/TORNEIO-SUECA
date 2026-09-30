import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useTournament'
import { Loading } from './Status'

export default function RequireAuth({ children }) {
  const user = useAuth()
  const loc = useLocation()
  if (user === undefined) return <Loading />
  if (!user) return <Navigate to={`/entrar?voltar=${encodeURIComponent(loc.pathname)}`} replace />
  return children
}
