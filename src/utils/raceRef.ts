export function formatRaceRef(raceRef: string | null | undefined): string {
  return raceRef ? `race: "${raceRef}"` : 'race: unavailable'
}
