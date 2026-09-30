import { db } from './db'

/** Liga/desliga os pontos no ecrã TV (guardado no torneio, chega à TV em tempo real). */
export async function setTvPoints(tournament, show) {
  await db.saveTournament({ ...tournament, settings: { ...tournament.settings, tvShowPoints: !!show } })
}

/** Guarda (ou remove, com null) o logotipo do torneio. */
export async function setLogo(tournament, dataUrl) {
  await db.saveTournament({ ...tournament, settings: { ...tournament.settings, logo: dataUrl || null } })
}
