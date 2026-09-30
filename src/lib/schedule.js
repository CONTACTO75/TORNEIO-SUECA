function shuffled(list) {
  const a = [...list]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Campeonato todos-contra-todos pelo método do círculo (a 1.ª equipa fica fixa,
 * as restantes rodam). Com 16 equipas A..P reproduz exatamente o calendário usado
 * no Excel (J1: A-P, B-O, ... H-I; J2: A-O, P-N, B-M, ...).
 * Número ímpar de equipas: em cada jornada uma equipa fica de folga (awayId = null).
 */
export function generateSchedule(teamIds, { shuffle = false } = {}) {
  let ids = shuffle ? shuffled(teamIds) : [...teamIds]
  if (ids.length < 2) return []
  if (ids.length % 2) ids.push(null)
  const n = ids.length
  const fixed = ids[0]
  const rest = ids.slice(1)
  const len = rest.length
  const out = []
  for (let r = 0; r < n - 1; r++) {
    const rot = rest.map((_, i) => rest[(((i - r) % len) + len) % len])
    const pairs = [[fixed, rot[n - 2]]]
    for (let i = 0; i < n / 2 - 1; i++) pairs.push([rot[i], rot[n - 3 - i]])
    let table = 0
    for (const [a, b] of pairs) {
      if (a == null || b == null) {
        out.push({ round: r + 1, tableNo: null, homeId: a ?? b, awayId: null })
      } else {
        out.push({ round: r + 1, tableNo: ++table, homeId: a, awayId: b })
      }
    }
  }
  return out
}

/** Distribui as jornadas pelos dias do torneio. Devolve { [jornada]: 'AAAA-MM-DD' }. */
export function roundDayMap(settings, totalRounds) {
  const dates = (settings?.dates || []).filter(Boolean)
  if (!dates.length || !totalRounds) return {}
  let counts = String(settings.roundsPerDay || '')
    .split(/[,;\s]+/)
    .map(Number)
    .filter((n) => n > 0)
  if (!counts.length) {
    const per = Math.ceil(totalRounds / dates.length)
    counts = dates.map(() => per)
  }
  const map = {}
  let r = 1
  counts.forEach((c, i) => {
    for (let k = 0; k < c && r <= totalRounds; k++) map[r++] = dates[Math.min(i, dates.length - 1)]
  })
  while (r <= totalRounds) map[r++] = dates.at(-1)
  return map
}

export function roundNumbers(matches) {
  return [...new Set(matches.map((m) => m.round))].sort((a, b) => a - b)
}

export const isPlayable = (m) => m.homeId && m.awayId
export const hasResult = (m) => m.homePoints != null && m.awayPoints != null

/** Primeira jornada com encontros por lançar (ou a última, se já acabou). */
export function currentRound(matches) {
  const rounds = roundNumbers(matches)
  for (const r of rounds) {
    if (matches.some((m) => m.round === r && isPlayable(m) && !hasResult(m))) return r
  }
  return rounds.at(-1) ?? null
}

export function progress(matches) {
  const playable = matches.filter(isPlayable)
  return { done: playable.filter(hasResult).length, total: playable.length }
}
