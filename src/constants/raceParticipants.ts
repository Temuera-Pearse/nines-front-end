export const HORSE_COUNT = 9

export function getHorseId(index: number): string {
  return `horse-${index}`
}

export function getDefaultHorseIds(): string[] {
  return Array.from({ length: HORSE_COUNT }, (_, index) => getHorseId(index))
}
