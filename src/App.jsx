import { Route, Routes } from 'react-router-dom'
import RequireAuth from './components/RequireAuth'
import { NotFound } from './components/Status'
import Home from './pages/Home'
import PublicLayout from './pages/PublicLayout'
import Standings from './pages/Standings'
import Rounds from './pages/Rounds'
import Teams from './pages/Teams'
import TeamDetail from './pages/TeamDetail'
import TvMode from './pages/TvMode'
import Login from './pages/Login'
import AdminHome from './pages/admin/AdminHome'
import AdminTournament from './pages/admin/AdminTournament'
import PrintSheets from './pages/admin/PrintSheets'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/t/:tid" element={<PublicLayout />}>
        <Route index element={<Standings />} />
        <Route path="jornadas" element={<Rounds />} />
        <Route path="equipas" element={<Teams />} />
        <Route path="equipas/:teamId" element={<TeamDetail />} />
      </Route>
      <Route path="/t/:tid/tv" element={<TvMode />} />
      <Route path="/entrar" element={<Login />} />
      <Route path="/admin" element={<RequireAuth><AdminHome /></RequireAuth>} />
      <Route path="/admin/t/:tid" element={<RequireAuth><AdminTournament /></RequireAuth>} />
      <Route path="/admin/t/:tid/imprimir" element={<RequireAuth><PrintSheets /></RequireAuth>} />
      <Route path="*" element={<div className="wrap"><NotFound /></div>} />
    </Routes>
  )
}
