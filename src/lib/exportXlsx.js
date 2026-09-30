import * as XLSX from 'xlsx'
import { computeStandings } from './standings'
import { playersOf, teamLabel } from './format'

export function exportTournament({ tournament, teams, matches, adjustments }) {
  const byId = Object.fromEntries(teams.map((t) => [t.id, t]))
  const standings = computeStandings({ teams, matches, adjustments, settings: tournament.settings })

  const classif = standings.map((r) => ({
    Lugar: r.rank,
    Equipa: teamLabel(r.team),
    Jogadores: playersOf(r.team),
    'Jornadas jogadas': r.played,
    Ganhos: r.wins,
    Empates: r.draws,
    Perdidos: r.losses,
    Pontos: r.points,
    Ajustes: r.adj,
    Total: r.total,
  }))

  const results = matches.map((m) => ({
    Jornada: m.round,
    Mesa: m.tableNo ?? 'Folga',
    'Equipa 1': teamLabel(byId[m.homeId]),
    'Pontos 1': m.homePoints ?? '',
    'Equipa 2': m.awayId ? teamLabel(byId[m.awayId]) : '',
    'Pontos 2': m.awayPoints ?? '',
  }))

  const equipas = teams.map((t) => ({
    Equipa: teamLabel(t),
    'Jogador 1': t.player1,
    'Jogador 2': t.player2,
    Suplente: t.substitute,
    'Contacto 1': t.contact1,
    'Contacto 2': t.contact2,
    Pago: t.paid ? 'Sim' : 'Não',
  }))

  const ajustes = adjustments.map((a) => ({
    Equipa: teamLabel(byId[a.teamId]),
    Jornada: a.round ?? '',
    Pontos: a.points,
    Motivo: a.reason,
  }))

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(classif), 'Classificação')
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(results), 'Resultados')
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(equipas), 'Inscrições')
  if (ajustes.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ajustes), 'Ajustes')
  const safe = tournament.name.replace(/[^\p{L}\p{N} _-]/gu, '').trim() || 'torneio'
  XLSX.writeFile(wb, `${safe}.xlsx`)
}
