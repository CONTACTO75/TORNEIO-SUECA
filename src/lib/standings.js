import { sortTeams } from './format'
import { hasResult, isPlayable } from './schedule'

function apply(row, forPts, againstPts) {
  row.played++
  row.points += forPts
  row.against += againstPts
  if (forPts > againstPts) row.wins++
  else if (forPts < againstPts) row.losses++
  else row.draws++
  row.best = row.best == null ? forPts : Math.max(row.best, forPts)
}

/**
 * Classificação: soma de pontos (+ ajustes/penalizações). Empates desfeitos pelos
 * critérios definidos no torneio, pela ordem escolhida. Se continuarem empatadas,
 * as equipas partilham o lugar (tied = true).
 */
export function computeStandings({ teams, matches, adjustments, settings }) {
  const rows = new Map(
    teams.map((t) => [
      t.id,
      { team: t, played: 0, points: 0, against: 0, wins: 0, draws: 0, losses: 0, adj: 0, best: null },
    ]),
  )
  const done = []
  for (const m of matches) {
    if (!isPlayable(m) || !hasResult(m)) continue
    const h = rows.get(m.homeId)
    const a = rows.get(m.awayId)
    if (!h || !a) continue
    done.push(m)
    apply(h, m.homePoints, m.awayPoints)
    apply(a, m.awayPoints, m.homePoints)
  }
  for (const x of adjustments || []) {
    const r = rows.get(x.teamId)
    if (r) r.adj += Number(x.points) || 0
  }
  const list = [...rows.values()].map((r) => ({ ...r, total: r.points + r.adj }))

  if (!done.length && !(adjustments || []).length) {
    return [...list].sort((a, b) => sortTeams(a.team, b.team)).map((r, i) => ({ ...r, rank: i + 1, tied: false }))
  }

  const keyFactories = {
    total: () => (r) => r.total,
    wins: () => (r) => r.wins,
    best: () => (r) => r.best ?? -Infinity,
    h2h: (group) => {
      const ids = new Set(group.map((r) => r.team.id))
      const pts = new Map(group.map((r) => [r.team.id, 0]))
      for (const m of done) {
        if (ids.has(m.homeId) && ids.has(m.awayId)) {
          pts.set(m.homeId, pts.get(m.homeId) + m.homePoints)
          pts.set(m.awayId, pts.get(m.awayId) + m.awayPoints)
        }
      }
      return (r) => pts.get(r.team.id)
    },
  }

  function resolve(group, criteria) {
    if (group.length < 2 || !criteria.length) return [group]
    const [c, ...rest] = criteria
    const factory = keyFactories[c]
    if (!factory) return resolve(group, rest)
    const key = factory(group)
    const sorted = [...group].sort((a, b) => key(b) - key(a))
    const out = []
    let cur = [sorted[0]]
    for (let i = 1; i < sorted.length; i++) {
      if (key(sorted[i]) === key(cur[0])) cur.push(sorted[i])
      else {
        out.push(...resolve(cur, rest))
        cur = [sorted[i]]
      }
    }
    out.push(...resolve(cur, rest))
    return out
  }

  const groups = resolve(list, ['total', ...(settings?.tiebreakers || [])])
  const result = []
  let pos = 1
  for (const g of groups) {
    const tied = g.length > 1
    for (const r of [...g].sort((a, b) => sortTeams(a.team, b.team))) result.push({ ...r, rank: pos, tied })
    pos += g.length
  }
  return result
}

/** Prémio associado a cada lugar (1, 2, 3 ... e 'last'). */
export function prizeFor(rank, totalTeams, prizes = []) {
  const found = prizes.find((p) => p.label?.trim() && (p.place === String(rank) || (p.place === 'last' && rank === totalTeams)))
  return found?.label || null
}

/** Folha de controlo de uma equipa: jornada a jornada. */
export function teamSheet(teamId, matches) {
  return matches
    .filter((m) => m.homeId === teamId || m.awayId === teamId)
    .sort((a, b) => a.round - b.round)
    .map((m) => {
      const home = m.homeId === teamId
      const opponentId = home ? m.awayId : m.homeId
      const pf = home ? m.homePoints : m.awayPoints
      const pa = home ? m.awayPoints : m.homePoints
      return { match: m, round: m.round, tableNo: m.tableNo, opponentId, pointsFor: pf, pointsAgainst: pa, bye: !m.awayId }
    })
}
