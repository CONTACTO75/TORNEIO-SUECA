export const TIEBREAKERS = {
  h2h: 'Confronto direto (pontos entre as equipas empatadas)',
  wins: 'Mais encontros ganhos',
  best: 'Melhor pontuação numa jornada',
}

export const PRIZE_PLACES = [
  { value: '1', label: '1.º lugar' },
  { value: '2', label: '2.º lugar' },
  { value: '3', label: '3.º lugar' },
  { value: '4', label: '4.º lugar' },
  { value: '5', label: '5.º lugar' },
  { value: 'last', label: 'Último lugar' },
]

export function defaultSettings() {
  return {
    organizer: '',
    venue: '',
    dates: [],
    startTime: '20:00',
    pointsPerGame: 120,
    gamesPerRound: 4,
    roundsPerDay: '',
    tiebreakers: ['h2h', 'wins', 'best'],
    prizes: [
      { place: '1', label: '' },
      { place: '2', label: '' },
      { place: '3', label: '' },
    ],
  }
}

export function withDefaults(settings) {
  return { ...defaultSettings(), ...(settings || {}) }
}

/** Pontos em disputa num encontro (ex.: 4 jogos x 120 = 480). */
export function pointsPerRound(settings) {
  const s = withDefaults(settings)
  return (Number(s.pointsPerGame) || 120) * (Number(s.gamesPerRound) || 4)
}
