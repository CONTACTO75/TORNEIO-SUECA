export function teamLabel(team) {
  if (!team) return '—'
  return team.name?.trim() || `Equipa ${team.code}`
}

export function playersOf(team) {
  if (!team) return ''
  return [team.player1, team.player2].map((p) => (p || '').trim()).filter(Boolean).join(' e ')
}

export function sortTeams(a, b) {
  return a.code.length - b.code.length || a.code.localeCompare(b.code)
}

/** A, B, ..., Z, AA, AB, ... */
export function codeFor(index) {
  let s = ''
  let n = index
  do {
    s = String.fromCharCode(65 + (n % 26)) + s
    n = Math.floor(n / 26) - 1
  } while (n >= 0)
  return s
}

export function nextCode(teams) {
  const used = new Set(teams.map((t) => t.code))
  let i = 0
  while (used.has(codeFor(i))) i++
  return codeFor(i)
}

export function fmtDate(iso, opts = { day: 'numeric', month: 'long' }) {
  if (!iso) return ''
  const d = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('pt-PT', opts)
}

export function fmtDates(dates = []) {
  const list = dates.filter(Boolean).map((d) => fmtDate(d))
  if (list.length <= 1) return list.join('')
  return `${list.slice(0, -1).join(', ')} e ${list.at(-1)}`
}

export function fmtTime(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
}

export function ordinal(n) {
  return `${n}.º`
}
