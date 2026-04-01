export interface CanvasHorseSprite {
  id: string
  x: number
  y: number
  width: number
  height: number
  finishRank?: number
  isWinner?: boolean
  crossedFinishLine?: boolean
  highlightStrength?: number
  winnerGlowStrength?: number
  spotlightStrength?: number
}

export interface BackendFinishResult {
  horse: number | string
  position: number
}

export interface FinishLayout {
  finishLineX: number
  winnerOvershootPx?: number
  spacingPx?: number
  rankDelayMs?: number
  baseDurationMs?: number
  durationStepMs?: number
}

export interface FinishTarget {
  horseId: string
  rank: number
  fromX: number
  targetX: number
  delayMs: number
  durationMs: number
  highlightColor: string
}

export interface FinishAnimationState {
  startedAtMs: number
  finishLineX: number
  targets: Record<string, FinishTarget>
  completed: boolean
}

export interface FinishFrameResult {
  horses: CanvasHorseSprite[]
  completed: boolean
}

export interface WinnerHighlightState {
  winnerHorseId: string | null
  showBanner: boolean
  active: boolean
}

const DEFAULT_WINNER_OVERSHOOT_PX = 10
const DEFAULT_SPACING_PX = 20
const DEFAULT_RANK_DELAY_MS = 90
const DEFAULT_BASE_DURATION_MS = 520
const DEFAULT_DURATION_STEP_MS = 80
const WINNER_HIGHLIGHT = '#ffd54a'

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t
}

function easeOutCubic(t: number): number {
  const clamped = clamp(t, 0, 1)
  return 1 - Math.pow(1 - clamped, 3)
}

function pulse(nowMs: number, speed = 0.012): number {
  return 0.5 + Math.sin(nowMs * speed) * 0.5
}

export function normalizeHorseId(horse: number | string): string {
  if (typeof horse === 'string') {
    return horse.startsWith('horse-') ? horse : `horse-${horse}`
  }

  return `horse-${horse}`
}

function resolveHorseId(
  horse: number | string,
  knownHorseIds: string[],
): string | null {
  const normalized = normalizeHorseId(horse)
  if (knownHorseIds.includes(normalized)) return normalized

  if (typeof horse === 'number') {
    const oneBased = `horse-${horse - 1}`
    if (knownHorseIds.includes(oneBased)) return oneBased
  }

  return null
}

export function calculateFinalXPositions(
  horses: CanvasHorseSprite[],
  results: BackendFinishResult[],
  layout: FinishLayout,
): Record<string, FinishTarget> {
  const winnerOvershootPx =
    layout.winnerOvershootPx ?? DEFAULT_WINNER_OVERSHOOT_PX
  const spacingPx = layout.spacingPx ?? DEFAULT_SPACING_PX
  const rankDelayMs = layout.rankDelayMs ?? DEFAULT_RANK_DELAY_MS
  const baseDurationMs = layout.baseDurationMs ?? DEFAULT_BASE_DURATION_MS
  const durationStepMs = layout.durationStepMs ?? DEFAULT_DURATION_STEP_MS

  const spritesById = new Map(horses.map((horse) => [horse.id, horse]))
  const knownHorseIds = horses.map((horse) => horse.id)

  return [...results]
    .sort((left, right) => left.position - right.position)
    .reduce<Record<string, FinishTarget>>((accumulator, result, index) => {
      const horseId = resolveHorseId(result.horse, knownHorseIds)
      if (!horseId) return accumulator
      const horse = spritesById.get(horseId)
      if (!horse) return accumulator

      const rank = result.position
      const noseAtFinishX = layout.finishLineX - horse.width
      const rankGap = (rank - 1) * (horse.width * 0.65 + spacingPx)
      const targetX =
        rank === 1 ? noseAtFinishX + winnerOvershootPx : noseAtFinishX - rankGap

      accumulator[horseId] = {
        horseId,
        rank,
        fromX: horse.x,
        targetX,
        delayMs: index * rankDelayMs,
        durationMs: baseDurationMs + (rank - 1) * durationStepMs,
        highlightColor: rank === 1 ? WINNER_HIGHLIGHT : 'transparent',
      }

      return accumulator
    }, {})
}

export function createFinishAnimationState(
  horses: CanvasHorseSprite[],
  results: BackendFinishResult[],
  layout: FinishLayout,
  startedAtMs: number = performance.now(),
): FinishAnimationState {
  return {
    startedAtMs,
    finishLineX: layout.finishLineX,
    targets: calculateFinalXPositions(horses, results, layout),
    completed: false,
  }
}

export function stepFinishAnimation(
  horses: CanvasHorseSprite[],
  animation: FinishAnimationState,
  nowMs: number,
): FinishFrameResult {
  let allCompleted = true

  const nextHorses = horses.map((horse) => {
    const target = animation.targets[horse.id]
    if (!target) return horse

    const elapsedMs = nowMs - animation.startedAtMs - target.delayMs
    const progress = clamp(elapsedMs / target.durationMs, 0, 1)
    const easedProgress = easeOutCubic(progress)
    const x = lerp(target.fromX, target.targetX, easedProgress)
    const crossedFinishLine = x + horse.width >= animation.finishLineX
    const isWinner = target.rank === 1
    const highlightStrength = isWinner
      ? 0.7 + pulse(nowMs) * 0.3
      : crossedFinishLine
        ? 0.16
        : 0
    const winnerGlowStrength = isWinner ? 0.78 + pulse(nowMs, 0.01) * 0.22 : 0
    const spotlightStrength = isWinner ? 0.34 + pulse(nowMs, 0.006) * 0.18 : 0

    if (progress < 1) {
      allCompleted = false
    }

    return {
      ...horse,
      x,
      finishRank: target.rank,
      isWinner,
      crossedFinishLine,
      highlightStrength,
      winnerGlowStrength,
      spotlightStrength,
    }
  })

  return {
    horses: nextHorses,
    completed: allCompleted,
  }
}

export function drawWinnerHighlight(
  ctx: CanvasRenderingContext2D,
  horse: CanvasHorseSprite,
  color: string = WINNER_HIGHLIGHT,
): void {
  if (!horse.isWinner || !horse.highlightStrength) return

  drawWinnerSpotlight(ctx, horse)

  ctx.save()
  ctx.globalAlpha = horse.winnerGlowStrength ?? horse.highlightStrength
  ctx.shadowColor = color
  ctx.shadowBlur = 30
  ctx.strokeStyle = color
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.roundRect(
    horse.x - 10,
    horse.y - 8,
    horse.width + 20,
    horse.height + 16,
    14,
  )
  ctx.stroke()
  ctx.restore()
}

export function drawWinnerSpotlight(
  ctx: CanvasRenderingContext2D,
  horse: CanvasHorseSprite,
  color: string = '255, 242, 170',
): void {
  if (!horse.isWinner || !horse.spotlightStrength) return

  const centerX = horse.x + horse.width / 2
  const baseY = horse.y + horse.height / 2

  ctx.save()
  ctx.globalAlpha = horse.spotlightStrength
  const gradient = ctx.createRadialGradient(
    centerX,
    baseY,
    8,
    centerX,
    baseY,
    76,
  )
  gradient.addColorStop(0, `rgba(${color}, 0.32)`)
  gradient.addColorStop(0.55, `rgba(${color}, 0.14)`)
  gradient.addColorStop(1, `rgba(${color}, 0)`)
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.ellipse(centerX, baseY, 92, 48, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

export function createWinnerHighlightState(
  horses: CanvasHorseSprite[],
  resultsVisible = false,
): WinnerHighlightState {
  const winner = horses.find((horse) => horse.isWinner)
  return {
    winnerHorseId: winner?.id ?? null,
    showBanner: Boolean(winner) && !resultsVisible,
    active: Boolean(winner) && !resultsVisible,
  }
}

export function applyRaceFinish(
  horses: CanvasHorseSprite[],
  results: BackendFinishResult[],
  layout: FinishLayout,
  startedAtMs?: number,
): FinishAnimationState {
  return createFinishAnimationState(horses, results, layout, startedAtMs)
}
