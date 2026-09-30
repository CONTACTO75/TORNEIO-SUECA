import { db } from './db'
import exemplo from '../data/exemplo-ara-2026.json'

/** Cria um torneio completo a partir dos dados do Excel de 2026 (para testar). */
export async function importExample() {
  const t = await db.saveTournament({ name: exemplo.name, settings: exemplo.settings, isActive: false })
  const teams = await db.saveTeams(exemplo.teams.map((x) => ({ ...x, tournamentId: t.id })))
  const byCode = Object.fromEntries(teams.map((x) => [x.code, x.id]))
  await db.replaceMatches(
    t.id,
    exemplo.matches.map((m) => ({
      round: m.round,
      tableNo: m.tableNo,
      homeId: byCode[m.home],
      awayId: byCode[m.away],
      homePoints: m.homePoints,
      awayPoints: m.awayPoints,
      updatedBy: 'importado do Excel',
    })),
  )
  return t.id
}
