import {
  RaceStatus,
  type BackendRaceResult,
  type HorseEffectState,
  type RaceFinishPresentation,
  type RaceEventRecord,
  type RaceWinnerDeclaredPayload,
  useRaceStore,
} from '../state/raceStore'
import { OFFLINE_MODE, WS_URL } from '../config/runtime'
import { getDefaultHorseIds } from '../constants/raceParticipants'

type EventType =
  | 'bets:open'
  | 'bets:close'
  | 'race:info'
  | 'race:start'
  | 'race:winner-declared'
  | 'race:tick'
  | 'race:keyframe'
  | 'race:delta'
  | 'race:catchup'
  | 'race:sync-complete'
  | 'race:finish'
  | 'race:reset'
  | 'error'

type AnyRecord = Record<string, unknown>

interface WebSocketEvent {
  type: EventType
  raceId: string
  timestampUtc: string
  [key: string]: any
}

type RaceTickType = 'race:tick' | 'race:keyframe' | 'race:delta'

interface RaceFrame {
  type: RaceTickType
  protoVer?: number
  raceId: string
  seq?: number
  tickIndex: number
  tickTs?: number
  keyId?: string
  sig?: string
  data?: {
    positions?: number[]
    deltas?: number[]
    events?: Array<{
      id?: string
      instanceId?: string
      tickIndex?: number
      affectedHorseIds?: string[]
    }>
    effects?: Array<{
      horseId?: string
      activeEventIds?: string[]
      isStunned?: boolean
      isRemoved?: boolean
    }>
    [key: string]: unknown
  }
  [key: string]: unknown
}

interface RaceInfoMsg {
  type: 'race:info'
  protoVer?: number
  raceId: string
  horseOrder: string[]
  config?: Record<string, unknown>
  currentTickIndex?: number
}

interface RaceStartMsg {
  type: 'race:start'
  protoVer?: number
  raceId: string
  timestampUtc?: string
  horseOrder?: string[]
  horses?: Array<{ id: string; name?: string }>
}

interface RaceFinishMsg {
  type: 'race:finish'
  protoVer?: number
  raceId: string
  timestampUtc?: string
  results?: BackendRaceResult[]
  winnerId?: string
  finishOrder?: string[]
  finishTimesMs?: Record<string, number>
  finishTickIndex?: Record<string, number>
  presentation?: RaceFinishPresentation
}

interface RaceWinnerDeclaredMsg extends RaceWinnerDeclaredPayload {
  type: 'race:winner-declared'
  protoVer?: number
}

interface RaceCatchupMsg {
  type: 'race:catchup'
  protoVer?: number
  raceId: string
  startIndex?: number
  currentTickIndex?: number
  ticks?: RaceFrame[]
}

interface ErrorMsg {
  type: 'error'
  protoVer?: number
  message?: string
  [key: string]: unknown
}

type EventCallback = (data: WebSocketEvent) => void

function readGeometryFromConfig(config?: Record<string, unknown>): {
  trackLengthMeters?: number
  finishLineMeters?: number
} {
  if (!config || typeof config !== 'object') return {}

  const trackLengthRaw = config.trackLength
  const finishRatioRaw = config.finishRatio
  const trackLengthMeters =
    typeof trackLengthRaw === 'number' && Number.isFinite(trackLengthRaw)
      ? trackLengthRaw
      : undefined
  const finishRatio =
    typeof finishRatioRaw === 'number' && Number.isFinite(finishRatioRaw)
      ? finishRatioRaw
      : undefined
  const finishLineMeters =
    trackLengthMeters !== undefined && finishRatio !== undefined
      ? trackLengthMeters * finishRatio
      : trackLengthMeters

  return { trackLengthMeters, finishLineMeters }
}

class WebSocketService {
  private ws: WebSocket | null = null
  private listeners: Map<EventType, Set<EventCallback>> = new Map()
  private reconnectTimeout: number | null = null
  private url: string = WS_URL
  private lastSeq: number | null = null
  private horseOrder: string[] | null = null
  private lastPositions: number[] | null = null

  constructor() {
    if (OFFLINE_MODE) {
      console.log('[WebSocket] OFFLINE mode enabled; not connecting')
      return
    }
    this.connect()
  }

  private connect() {
    try {
      this.ws = new WebSocket(this.url)
      // If server sends binary frames, prefer ArrayBuffer.
      this.ws.binaryType = 'arraybuffer'

      this.ws.onopen = () => {
        console.log('[WebSocket] Connected at', new Date().toISOString())
        if (this.reconnectTimeout) {
          clearTimeout(this.reconnectTimeout)
          this.reconnectTimeout = null
        }
        // Don't request sync here: we might have a stale raceId from a previous session.
        // Wait for `race:info` from the server to tell us the authoritative raceId.
      }

      this.ws.onmessage = (event) => {
        try {
          if (typeof event.data === 'string') {
            const parsed: unknown = JSON.parse(event.data)
            if (!parsed || typeof parsed !== 'object') {
              console.warn('[WebSocket] Unexpected message shape; ignoring')
              return
            }

            const data = parsed as AnyRecord
            if (typeof data.type !== 'string') {
              console.warn('[WebSocket] Missing message type; ignoring')
              return
            }

            // Canonical contract messages
            if (data.type === 'race:info') {
              this.handleRaceInfo(data as unknown as RaceInfoMsg)
              return
            }
            if (data.type === 'race:start') {
              this.handleRaceStart(data as unknown as RaceStartMsg)
              return
            }
            if (data.type === 'race:catchup') {
              this.handleRaceCatchup(data as unknown as RaceCatchupMsg)
              return
            }
            if (data.type === 'race:winner-declared') {
              this.handleWinnerDeclared(
                data as unknown as RaceWinnerDeclaredMsg,
              )
              return
            }
            if (data.type === 'race:sync-complete') {
              // no-op for now (useful for UI/metrics later)
              return
            }
            if (data.type === 'race:finish') {
              this.handleRaceFinish(data as unknown as RaceFinishMsg)
              return
            }
            if (data.type === 'error') {
              const err = data as unknown as ErrorMsg
              console.warn('[WebSocket] Server error:', err.message ?? err)
              return
            }

            // Tick stream frames
            if (
              data.type === 'race:tick' ||
              data.type === 'race:keyframe' ||
              data.type === 'race:delta'
            ) {
              this.handleRaceFrame(data as unknown as RaceFrame)
              return
            }

            // Legacy events (keep for compatibility)
            const legacy = data as unknown as WebSocketEvent
            console.log(
              `[WebSocket] ${legacy.type} received at ${legacy.timestampUtc}`,
              legacy,
            )
            this.handleLegacyEvent(legacy)
            const callbacks = this.listeners.get(legacy.type)
            if (callbacks) callbacks.forEach((callback) => callback(legacy))
            return
          }

          // Optional binary tick frames
          if (event.data instanceof ArrayBuffer) {
            this.handleBinaryTick(event.data)
            return
          }

          console.warn('[WebSocket] Unsupported frame type; ignoring')
        } catch (error) {
          console.error('[WebSocket] Error parsing message:', error)
        }
      }

      this.ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error)
      }

      this.ws.onclose = () => {
        console.log('[WebSocket] Disconnected at', new Date().toISOString())
        this.lastSeq = null
        this.lastPositions = null
        // Attempt to reconnect after 3 seconds
        this.reconnectTimeout = window.setTimeout(() => {
          console.log('[WebSocket] Attempting to reconnect...')
          this.connect()
        }, 3000)
      }
    } catch (error) {
      console.error('[WebSocket] Connection error:', error)
    }
  }

  private ensureHorsesInitialized(horseIds: string[]) {
    const store = useRaceStore.getState()
    if (store.horses.length > 0) return

    const horses = horseIds.map((id) => ({ id, position: 0 }))
    if (horses.length > 0) store.setHorses(horses)
  }

  private setHorseOrder(order: string[]) {
    const normalized = Array.isArray(order) ? order.filter(Boolean) : []
    if (normalized.length === 0) return
    this.horseOrder = normalized
    const store = useRaceStore.getState()
    store.setHorseOrder(normalized)
    if (store.horses.length === 0) {
      store.setHorses(normalized.map((id) => ({ id, position: 0 })))
    }
  }

  private handleRaceInfo(msg: RaceInfoMsg) {
    const store = useRaceStore.getState()

    // If this is a different race than what we currently show, hard-reset UI state
    // to prevent the previous race's positions/seq from bleeding into the next.
    if (store.raceId && store.raceId !== msg.raceId) {
      store.reset()
      // Clear lastResult for the new race to avoid showing old results
      useRaceStore.setState({ lastResult: null })
      this.lastSeq = null
      this.lastPositions = null
      this.horseOrder = null
    }

    store.setRaceId(msg.raceId)
    if (Array.isArray(msg.horseOrder)) {
      this.setHorseOrder(msg.horseOrder)
      this.ensureHorsesInitialized(msg.horseOrder)
    }
    const geometry = readGeometryFromConfig(msg.config)
    if (
      geometry.trackLengthMeters !== undefined ||
      geometry.finishLineMeters !== undefined
    ) {
      store.setRaceGeometry(
        geometry.trackLengthMeters,
        geometry.finishLineMeters,
      )
    }

    const currentTickIndex =
      typeof msg.currentTickIndex === 'number' ? msg.currentTickIndex : -1
    if (currentTickIndex >= 0) {
      this.requestSync(msg.raceId)
    }
  }

  private handleRaceStart(msg: RaceStartMsg) {
    const store = useRaceStore.getState()

    // New race start should always reset visible positions and sequencing.
    if (store.raceId && store.raceId !== msg.raceId) {
      store.reset()
    }
    this.lastSeq = null
    this.lastPositions = null

    store.setRaceId(msg.raceId)
    if (Array.isArray(msg.horseOrder)) {
      this.setHorseOrder(msg.horseOrder)
      this.ensureHorsesInitialized(msg.horseOrder)
    } else if (Array.isArray(msg.horses)) {
      const ids = msg.horses.map((h) => h.id).filter(Boolean)
      if (ids.length > 0) {
        this.setHorseOrder(ids)
        this.ensureHorsesInitialized(ids)
      }
    }

    // Always reset horse positions to 0 at the start of a race.
    const ids = this.horseOrder ?? store.horseOrder
    if (Array.isArray(ids) && ids.length > 0) {
      store.setHorses(ids.map((id) => ({ id, position: 0 })))
    }

    if (msg.timestampUtc) {
      store.setRaceStartUtc(msg.timestampUtc)
    }
    store.clearLiveRaceVisuals()
    store.setInterpolationEnabled(true)
    if (store.status !== RaceStatus.RUNNING) store.setStatus(RaceStatus.RUNNING)
  }

  private handleRaceFinish(msg: RaceFinishMsg) {
    const store = useRaceStore.getState()
    store.handleRaceFinish(msg)
  }

  private handleWinnerDeclared(msg: RaceWinnerDeclaredMsg) {
    const store = useRaceStore.getState()
    store.handleWinnerDeclared(msg)
  }

  private handleRaceCatchup(msg: RaceCatchupMsg) {
    const store = useRaceStore.getState()
    // If UI has already moved on to a different race, ignore stale catch-up.
    if (store.raceId && msg.raceId && store.raceId !== msg.raceId) return
    if (!Array.isArray(msg.ticks) || msg.ticks.length === 0) return
    // Apply in order; allow normal seq gating.
    const sorted = [...msg.ticks].sort(
      (a, b) => (a.tickIndex ?? 0) - (b.tickIndex ?? 0),
    )
    for (const t of sorted) {
      if (
        t &&
        (t.type === 'race:tick' ||
          t.type === 'race:keyframe' ||
          t.type === 'race:delta')
      ) {
        this.handleRaceFrame(t as RaceFrame)
      }
    }
  }

  private handleRaceFrame(frame: RaceFrame) {
    const store = useRaceStore.getState()

    if (
      !store.interpolationEnabled ||
      store.status === RaceStatus.FINISHED ||
      store.status === RaceStatus.RESULTS
    ) {
      return
    }

    // Drop frames for a different raceId (can happen with in-flight messages
    // during cycle boundaries or reconnects).
    if (store.raceId && frame.raceId && store.raceId !== frame.raceId) {
      return
    }

    if (typeof frame.seq === 'number') {
      if (this.lastSeq !== null && frame.seq <= this.lastSeq) return
      this.lastSeq = frame.seq
    }

    if (typeof frame.raceId === 'string' && frame.raceId) {
      store.setRaceId(frame.raceId)
    }

    this.applyLiveTickDetails(frame)

    const positions = frame.data?.positions
    const deltas = frame.data?.deltas

    // Delta mode
    if (frame.type === 'race:delta') {
      if (!Array.isArray(deltas) || deltas.length === 0) return
      if (!this.lastPositions || this.lastPositions.length !== deltas.length) {
        // Wait for a keyframe/tick to establish baseline
        return
      }
      const next = this.lastPositions.map((p, i) => p + (deltas[i] ?? 0))
      this.lastPositions = next
      this.applyPositionsArray(next, frame.tickIndex)
      return
    }

    // Plain tick or keyframe
    if (Array.isArray(positions) && positions.length > 0) {
      this.lastPositions = positions.slice()
      this.applyPositionsArray(positions, frame.tickIndex)
    }
  }

  private applyPositionsArray(positions: number[], tickIndex?: number) {
    const store = useRaceStore.getState()
    const order = this.horseOrder ?? store.horseOrder
    if (!Array.isArray(order) || order.length === 0) {
      // Fallback: if horses already exist, use their order.
      if (store.horses.length > 0) {
        const ids = store.horses.map((h) => h.id)
        this.setHorseOrder(ids)
      } else {
        return
      }
    }

    const finalOrder = this.horseOrder ?? store.horseOrder
    if (!finalOrder || finalOrder.length === 0) return
    this.ensureHorsesInitialized(finalOrder)

    const out: Record<string, number> = {}
    for (let i = 0; i < finalOrder.length; i++) {
      const id = finalOrder[i]
      const pos = positions[i]
      if (typeof pos === 'number') out[id] = pos
    }
    if (Object.keys(out).length > 0) {
      const previousPositions = new Map(
        store.horses.map((horse) => [horse.id, horse.position]),
      )
      const finishLineMeters =
        Number.isFinite(store.finishLineMeters) && store.finishLineMeters > 0
          ? store.finishLineMeters
          : 1000
      const crossingEvents: RaceEventRecord[] = Object.entries(out)
        .filter(([horseId, nextPosition]) => {
          const previousPosition = previousPositions.get(horseId) ?? 0
          return previousPosition < finishLineMeters && nextPosition >= finishLineMeters
        })
        .map(([horseId]) => ({
          eventId: 'finish_line_crossed',
          instanceId: `finish:${store.raceId ?? 'race'}:${horseId}`,
          tickIndex: typeof tickIndex === 'number' ? tickIndex : Number.MAX_SAFE_INTEGER,
          affectedHorseIds: [horseId],
        }))

      store.updatePositions(out)
      if (crossingEvents.length > 0) {
        store.applyLiveTickDetails(crossingEvents)
      }
      if (
        store.status !== RaceStatus.RUNNING &&
        store.status !== RaceStatus.FINISHED &&
        store.status !== RaceStatus.RESULTS
      ) {
        store.setStatus(RaceStatus.RUNNING)
      }
    }
  }

  private applyLiveTickDetails(frame: RaceFrame) {
    const rawEvents = frame.data?.events
    const rawEffects = frame.data?.effects

    const events: RaceEventRecord[] | undefined = Array.isArray(rawEvents)
      ? rawEvents
          .filter((event): event is NonNullable<typeof event> =>
            Boolean(event?.id && event?.instanceId),
          )
          .map((event) => ({
            eventId: event.id!,
            instanceId: event.instanceId!,
            tickIndex:
              typeof event.tickIndex === 'number'
                ? event.tickIndex
                : frame.tickIndex,
            affectedHorseIds: Array.isArray(event.affectedHorseIds)
              ? event.affectedHorseIds.filter(Boolean)
              : [],
          }))
      : undefined

    const effects: HorseEffectState[] | undefined = Array.isArray(rawEffects)
      ? rawEffects
          .filter((effect): effect is NonNullable<typeof effect> =>
            Boolean(effect?.horseId),
          )
          .map((effect) => ({
            horseId: effect.horseId!,
            activeEventIds: Array.isArray(effect.activeEventIds)
              ? effect.activeEventIds.filter(Boolean)
              : [],
            isStunned: effect.isStunned === true,
            isRemoved: effect.isRemoved === true,
          }))
      : undefined

    if (events || effects) {
      useRaceStore.getState().applyLiveTickDetails(events, effects)
    }
  }

  private handleBinaryTick(buf: ArrayBuffer) {
    // Format: UTF-8 JSON header + \n + Float32Array body
    const bytes = new Uint8Array(buf)
    let nl = -1
    for (let i = 0; i < bytes.length; i++) {
      if (bytes[i] === 10) {
        nl = i
        break
      }
    }
    if (nl <= 0) return
    const headerBytes = bytes.slice(0, nl)
    const bodyBytes = bytes.slice(nl + 1)

    try {
      const headerJson = new TextDecoder().decode(headerBytes)
      const header = JSON.parse(headerJson) as {
        type?: string
        raceId?: string
        seq?: number
        tickIndex?: number
        tickTs?: number
        protoVer?: number
        data?: RaceFrame['data']
      }
      if (header.type !== 'race:tick' || !header.raceId) return
      if (bodyBytes.byteLength % 4 !== 0) return

      const floats = new Float32Array(
        bodyBytes.buffer,
        bodyBytes.byteOffset,
        bodyBytes.byteLength / 4,
      )
      const positions = Array.from(floats)

      const frame: RaceFrame = {
        type: 'race:tick',
        protoVer: header.protoVer,
        raceId: header.raceId,
        seq: header.seq,
        tickIndex: typeof header.tickIndex === 'number' ? header.tickIndex : 0,
        tickTs: header.tickTs,
        data: { ...header.data, positions },
      }
      this.handleRaceFrame(frame)
    } catch {
      return
    }
  }

  private handleLegacyEvent(data: WebSocketEvent) {
    const store = useRaceStore.getState()

    switch (data.type) {
      case 'bets:open':
        store.setRaceId(data.raceId)
        store.setStatus(RaceStatus.BETS_OPEN)
        store.setInterpolationEnabled(true)
        store.setBetsOpenAtUtc(data.timestampUtc)
        if (data.betsCloseAtUtc) {
          store.setBetsCloseAtUtc(data.betsCloseAtUtc)
        }
        // Initialize horses
        this.ensureHorsesInitialized(getDefaultHorseIds())
        break

      case 'bets:close':
        store.setStatus(RaceStatus.BETS_CLOSED)
        store.setBetsCloseAtUtc(data.timestampUtc)
        if (data.raceStartUtc) {
          store.setRaceStartUtc(data.raceStartUtc)
        }
        break

      case 'race:start':
        store.setStatus(RaceStatus.RUNNING)
        store.setInterpolationEnabled(true)
        store.setRaceStartUtc(data.timestampUtc)
        break

      case 'race:tick':
        if (data.positions) {
          store.updatePositions(data.positions)
        }
        break

      case 'race:finish':
        store.handleRaceFinish({
          raceId: data.raceId,
          timestampUtc: data.timestampUtc,
          winnerId: typeof data.winner === 'string' ? data.winner : undefined,
          finishOrder: Array.isArray(data.placements)
            ? data.placements.filter(
                (placement): placement is string =>
                  typeof placement === 'string',
              )
            : undefined,
        })
        break

      case 'race:winner-declared':
        store.handleWinnerDeclared({
          raceId: data.raceId,
          timestampUtc: data.timestampUtc,
          winnerId:
            typeof data.winnerId === 'string' ? data.winnerId : undefined,
        })
        break

      case 'race:reset':
        store.reset()
        break

      default:
        console.warn('[WebSocket] Unknown event type:', data.type)
    }
  }

  public send(message: unknown) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return
    this.ws.send(JSON.stringify(message))
  }

  public requestSync(raceId: string, fromTick?: number) {
    this.send({
      type: 'sync:request',
      raceId,
      ...(fromTick !== undefined ? { fromTick } : {}),
    })
  }

  public subscribe(eventType: EventType, callback: EventCallback): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set())
    }

    this.listeners.get(eventType)!.add(callback)

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(eventType)
      if (callbacks) {
        callbacks.delete(callback)
      }
    }
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }
    this.lastSeq = null
  }
}

// Export singleton instance
export const wsService = new WebSocketService()
