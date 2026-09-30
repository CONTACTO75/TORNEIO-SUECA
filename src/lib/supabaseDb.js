import { sortTeams } from './format'
import { withDefaults } from './defaults'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function ok({ data, error }) {
  if (error) throw error
  return data
}

const tFrom = (r) => ({
  id: r.id,
  name: r.name,
  settings: withDefaults(r.settings),
  isActive: r.is_active,
  createdAt: r.created_at,
})
const teamFrom = (r) => ({
  id: r.id,
  tournamentId: r.tournament_id,
  code: r.code,
  name: r.name || '',
  player1: r.player1 || '',
  player2: r.player2 || '',
  substitute: r.substitute || '',
  contact1: r.contact1 || '',
  contact2: r.contact2 || '',
  paid: !!r.paid,
})
const teamTo = (t) => ({
  tournament_id: t.tournamentId,
  code: t.code,
  name: t.name || null,
  player1: t.player1 || null,
  player2: t.player2 || null,
  substitute: t.substitute || null,
  contact1: t.contact1 || null,
  contact2: t.contact2 || null,
  paid: !!t.paid,
})
const mFrom = (r) => ({
  id: r.id,
  tournamentId: r.tournament_id,
  round: r.round,
  tableNo: r.table_no,
  homeId: r.home_id,
  awayId: r.away_id,
  homePoints: r.home_points,
  awayPoints: r.away_points,
  updatedAt: r.updated_at,
  updatedBy: r.updated_by,
})
const aFrom = (r) => ({
  id: r.id,
  tournamentId: r.tournament_id,
  teamId: r.team_id,
  round: r.round,
  points: r.points,
  reason: r.reason || '',
  createdAt: r.created_at,
})

export function createSupabaseDb(sb) {
  return {
    mode: 'supabase',
    auth: {
      async getUser() {
        const { data } = await sb.auth.getSession()
        return data.session?.user ?? null
      },
      async signIn(email, password) {
        const { data, error } = await sb.auth.signInWithPassword({ email, password })
        if (error) throw error
        return data.user
      },
      async signOut() {
        await sb.auth.signOut()
      },
      onChange(cb) {
        const { data } = sb.auth.onAuthStateChange((_e, session) => cb(session?.user ?? null))
        return () => data.subscription.unsubscribe()
      },
    },

    async listTournaments() {
      return ok(await sb.from('tournaments').select('*').order('created_at', { ascending: false })).map(tFrom)
    },

    async saveTournament(t) {
      const row = { name: t.name, settings: t.settings, is_active: !!t.isActive }
      const r = t.id
        ? ok(await sb.from('tournaments').update(row).eq('id', t.id).select().single())
        : ok(await sb.from('tournaments').insert(row).select().single())
      if (row.is_active) ok(await sb.from('tournaments').update({ is_active: false }).neq('id', r.id))
      return tFrom(r)
    },

    async deleteTournament(id) {
      ok(await sb.from('tournaments').delete().eq('id', id))
    },

    async loadAll(tid) {
      if (!UUID.test(tid)) return { tournament: null, teams: [], matches: [], adjustments: [] }
      const [t, teams, matches, adj] = await Promise.all([
        sb.from('tournaments').select('*').eq('id', tid).maybeSingle(),
        sb.from('teams').select('*').eq('tournament_id', tid),
        sb.from('matches').select('*').eq('tournament_id', tid).order('round').order('table_no', { nullsFirst: false }),
        sb.from('adjustments').select('*').eq('tournament_id', tid).order('created_at'),
      ])
      const tr = ok(t)
      return {
        tournament: tr ? tFrom(tr) : null,
        teams: ok(teams).map(teamFrom).sort(sortTeams),
        matches: ok(matches).map(mFrom),
        adjustments: ok(adj).map(aFrom),
      }
    },

    async saveTeam(team) {
      const row = teamTo(team)
      const r = team.id
        ? ok(await sb.from('teams').update(row).eq('id', team.id).select().single())
        : ok(await sb.from('teams').insert(row).select().single())
      return teamFrom(r)
    },

    async saveTeams(list) {
      if (!list.length) return []
      return ok(await sb.from('teams').insert(list.map(teamTo)).select()).map(teamFrom)
    },

    async deleteTeam(id) {
      ok(await sb.from('teams').delete().eq('id', id))
    },

    async replaceMatches(tid, list) {
      ok(await sb.from('matches').delete().eq('tournament_id', tid))
      if (!list.length) return
      ok(
        await sb.from('matches').insert(
          list.map((m) => ({
            tournament_id: tid,
            round: m.round,
            table_no: m.tableNo ?? null,
            home_id: m.homeId,
            away_id: m.awayId ?? null,
            home_points: m.homePoints ?? null,
            away_points: m.awayPoints ?? null,
            updated_at: m.homePoints != null ? new Date().toISOString() : null,
            updated_by: m.updatedBy ?? null,
          })),
        ),
      )
    },

    async saveMatchResult(id, homePoints, awayPoints, by) {
      ok(
        await sb
          .from('matches')
          .update({ home_points: homePoints, away_points: awayPoints, updated_at: new Date().toISOString(), updated_by: by || null })
          .eq('id', id),
      )
    },

    async saveAdjustment(a) {
      ok(
        await sb.from('adjustments').insert({
          tournament_id: a.tournamentId,
          team_id: a.teamId,
          round: a.round ?? null,
          points: a.points,
          reason: a.reason || null,
        }),
      )
    },

    async deleteAdjustment(id) {
      ok(await sb.from('adjustments').delete().eq('id', id))
    },

    subscribe(tid, cb) {
      const ch = sb.channel(`sueca-${tid}-${Math.random().toString(36).slice(2, 8)}`)
      for (const table of ['tournaments', 'teams', 'matches', 'adjustments']) {
        ch.on('postgres_changes', { event: '*', schema: 'public', table }, () => cb())
      }
      ch.subscribe()
      return () => {
        sb.removeChannel(ch)
      }
    },
  }
}
