import { sortTeams } from './format'
import { withDefaults } from './defaults'

// Modo local: dados guardados neste navegador (localStorage).
// Útil para testar e como plano B sem internet. Separadores abertos no mesmo
// navegador (ex.: TV + organização) sincronizam entre si.
const KEY = 'torneio-sueca:db:v1'
const bus = new EventTarget()
const empty = () => ({ tournaments: [], teams: [], matches: [], adjustments: [] })
const uid = () =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`

function read() {
  try {
    return { ...empty(), ...(JSON.parse(localStorage.getItem(KEY)) || {}) }
  } catch {
    return empty()
  }
}
function write(d) {
  localStorage.setItem(KEY, JSON.stringify(d))
  bus.dispatchEvent(new Event('change'))
}
const byRoundTable = (a, b) => a.round - b.round || (a.tableNo ?? 999) - (b.tableNo ?? 999)

export function createLocalDb() {
  const user = { email: 'organizacao (modo local)' }
  return {
    mode: 'local',
    auth: {
      getUser: async () => user,
      signIn: async () => user,
      signOut: async () => {},
      onChange: () => () => {},
    },

    async listTournaments() {
      return read()
        .tournaments.map((t) => ({ ...t, settings: withDefaults(t.settings) }))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    },

    async saveTournament(t) {
      const d = read()
      let saved
      if (t.id && d.tournaments.some((x) => x.id === t.id)) {
        d.tournaments = d.tournaments.map((x) => (x.id === t.id ? (saved = { ...x, ...t }) : x))
      } else {
        saved = { isActive: false, ...t, id: uid(), createdAt: new Date().toISOString() }
        d.tournaments.push(saved)
      }
      if (saved.isActive) d.tournaments.forEach((x) => (x.isActive = x.id === saved.id))
      write(d)
      return saved
    },

    async deleteTournament(id) {
      const d = read()
      d.tournaments = d.tournaments.filter((x) => x.id !== id)
      d.teams = d.teams.filter((x) => x.tournamentId !== id)
      d.matches = d.matches.filter((x) => x.tournamentId !== id)
      d.adjustments = d.adjustments.filter((x) => x.tournamentId !== id)
      write(d)
    },

    async loadAll(tid) {
      const d = read()
      const t = d.tournaments.find((x) => x.id === tid)
      return {
        tournament: t ? { ...t, settings: withDefaults(t.settings) } : null,
        teams: d.teams.filter((x) => x.tournamentId === tid).sort(sortTeams),
        matches: d.matches.filter((x) => x.tournamentId === tid).sort(byRoundTable),
        adjustments: d.adjustments.filter((x) => x.tournamentId === tid),
      }
    },

    async saveTeam(team) {
      const d = read()
      let saved
      if (team.id) d.teams = d.teams.map((x) => (x.id === team.id ? (saved = { ...x, ...team }) : x))
      else d.teams.push((saved = { paid: false, ...team, id: uid() }))
      write(d)
      return saved
    },

    async saveTeams(list) {
      const d = read()
      const saved = list.map((t) => ({ paid: false, ...t, id: uid() }))
      d.teams.push(...saved)
      write(d)
      return saved
    },

    async deleteTeam(id) {
      const d = read()
      d.teams = d.teams.filter((x) => x.id !== id)
      d.matches = d.matches.filter((m) => m.homeId !== id && m.awayId !== id)
      d.adjustments = d.adjustments.filter((a) => a.teamId !== id)
      write(d)
    },

    async replaceMatches(tid, list) {
      const d = read()
      d.matches = d.matches.filter((m) => m.tournamentId !== tid)
      d.matches.push(
        ...list.map((m) => ({
          homePoints: null,
          awayPoints: null,
          updatedAt: null,
          updatedBy: null,
          ...m,
          id: uid(),
          tournamentId: tid,
        })),
      )
      write(d)
    },

    async saveMatchResult(id, homePoints, awayPoints, by) {
      const d = read()
      d.matches = d.matches.map((m) =>
        m.id === id ? { ...m, homePoints, awayPoints, updatedAt: new Date().toISOString(), updatedBy: by || null } : m,
      )
      write(d)
    },

    async saveAdjustment(a) {
      const d = read()
      d.adjustments.push({ ...a, id: uid(), createdAt: new Date().toISOString() })
      write(d)
    },

    async deleteAdjustment(id) {
      const d = read()
      d.adjustments = d.adjustments.filter((x) => x.id !== id)
      write(d)
    },

    subscribe(_tid, cb) {
      const onBus = () => cb()
      const onStorage = (e) => e.key === KEY && cb()
      bus.addEventListener('change', onBus)
      window.addEventListener('storage', onStorage)
      return () => {
        bus.removeEventListener('change', onBus)
        window.removeEventListener('storage', onStorage)
      }
    },
  }
}
