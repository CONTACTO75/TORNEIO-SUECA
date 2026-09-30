import { Link, useOutletContext } from 'react-router-dom'
import { playersOf, teamLabel } from '../lib/format'

export default function Teams() {
  const { tournament, teams } = useOutletContext()
  if (!teams.length) return <p className="empty">Ainda não há equipas inscritas.</p>
  return (
    <section>
      <div className="section-head">
        <h2>Equipas</h2>
        <p className="progress-line">{teams.length} equipas inscritas.</p>
      </div>
      <ul className="team-grid">
        {teams.map((t) => (
          <li key={t.id}>
            <Link to={`/t/${tournament.id}/equipas/${t.id}`}>
              <span className="team-code" aria-hidden="true">{t.code}</span>
              <span>
                <span className="team-link">{teamLabel(t)}</span>
                <span className="players">{playersOf(t) || 'Jogadores por indicar'}</span>
                {t.substitute && <span className="players">Suplente: {t.substitute}</span>}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
