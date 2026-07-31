export type KycPopupOutcome = 'pass' | 'fail'

export type KycPopupStatus =
  | 'idle'
  | 'opening'
  | 'open'
  | 'completed'
  | 'cancelled'
  | 'blocked'
  | 'closed'
  | 'timeout'
  | 'error'

export type KycPopupResult =
  | { status: 'completed'; outcome: KycPopupOutcome }
  | { status: 'cancelled' | 'closed' | 'timeout' }

export interface KycPopupWindow {
  readonly closed: boolean
  close(): void
  location: {
    replace(url: string): void
  }
}

export interface KycPopupHost {
  open(
    url?: string | URL,
    target?: string,
    features?: string,
  ): KycPopupWindow | null
  addEventListener(
    type: 'message',
    listener: (event: MessageEvent) => void,
  ): void
  removeEventListener(
    type: 'message',
    listener: (event: MessageEvent) => void,
  ): void
  setInterval(handler: () => void, timeout: number): number
  clearInterval(handle: number): void
  setTimeout(handler: () => void, timeout: number): number
  clearTimeout(handle: number): void
}

export class KycPopupBlockedError extends Error {
  constructor() {
    super(
      'The verification popup was blocked. Allow popups for Nines and try again.',
    )
    this.name = 'KycPopupBlockedError'
  }
}

export class KycPopupUrlError extends Error {
  constructor() {
    super('The verification provider did not return a safe hosted URL.')
    this.name = 'KycPopupUrlError'
  }
}

export function parseKycPopupUrl(
  value: string | null,
  allowInsecureDevelopmentUrl: boolean,
): URL | null {
  if (!value) return null
  try {
    const url = new URL(value)
    if (url.protocol === 'https:') return url
    if (allowInsecureDevelopmentUrl && url.protocol === 'http:') return url
    return null
  } catch {
    return null
  }
}

export function reserveKycPopup(
  host: KycPopupHost = window as unknown as KycPopupHost,
): KycPopupWindow {
  const popup = host.open(
    'about:blank',
    'nines-kyc-provider',
    'popup=yes,width=520,height=650,resizable=yes,scrollbars=yes',
  )
  if (!popup) throw new KycPopupBlockedError()
  return popup
}

function isCompletionMessage(
  value: unknown,
  sessionId: string,
): value is {
  type: 'nines:kyc-complete'
  sessionId: string
  outcome: KycPopupOutcome
} {
  if (!value || typeof value !== 'object') return false
  const message = value as Record<string, unknown>
  return (
    message.type === 'nines:kyc-complete' &&
    message.sessionId === sessionId &&
    (message.outcome === 'pass' || message.outcome === 'fail')
  )
}

function isCancellationMessage(
  value: unknown,
  sessionId: string,
): boolean {
  if (!value || typeof value !== 'object') return false
  const message = value as Record<string, unknown>
  return (
    message.type === 'nines:kyc-cancelled' &&
    message.sessionId === sessionId
  )
}

export function monitorKycPopup(input: {
  host?: KycPopupHost
  popup: KycPopupWindow
  sessionId: string
  verificationUrl: string
  allowInsecureDevelopmentUrl: boolean
  signal?: AbortSignal
  pollIntervalMs?: number
  timeoutMs?: number
}): Promise<KycPopupResult> {
  const host: KycPopupHost =
    input.host ?? (window as unknown as KycPopupHost)
  const targetUrl = parseKycPopupUrl(
    input.verificationUrl,
    input.allowInsecureDevelopmentUrl,
  )
  if (!targetUrl) {
    input.popup.close()
    throw new KycPopupUrlError()
  }

  return new Promise<KycPopupResult>((resolve, reject) => {
    let settled = false
    let pollHandle = 0
    let timeoutHandle = 0

    const cleanup = () => {
      host.removeEventListener('message', onMessage)
      if (pollHandle) host.clearInterval(pollHandle)
      if (timeoutHandle) host.clearTimeout(timeoutHandle)
      input.signal?.removeEventListener('abort', onAbort)
    }
    const settle = (result: KycPopupResult) => {
      if (settled) return
      settled = true
      cleanup()
      resolve(result)
    }
    const onAbort = () => {
      if (settled) return
      settled = true
      cleanup()
      input.popup.close()
      const error = new Error('The verification popup was cancelled')
      error.name = 'AbortError'
      reject(error)
    }
    const onMessage = (event: MessageEvent) => {
      if (
        event.origin !== targetUrl.origin ||
        event.source !== input.popup
      ) {
        return
      }
      if (isCompletionMessage(event.data, input.sessionId)) {
        settle({ status: 'completed', outcome: event.data.outcome })
      } else if (isCancellationMessage(event.data, input.sessionId)) {
        settle({ status: 'cancelled' })
      }
    }

    host.addEventListener('message', onMessage)
    input.signal?.addEventListener('abort', onAbort, { once: true })
    if (input.signal?.aborted) {
      onAbort()
      return
    }
    pollHandle = host.setInterval(() => {
      if (input.popup.closed) settle({ status: 'closed' })
    }, input.pollIntervalMs ?? 500)
    timeoutHandle = host.setTimeout(() => {
      input.popup.close()
      settle({ status: 'timeout' })
    }, input.timeoutMs ?? 10 * 60_000)

    try {
      input.popup.location.replace(targetUrl.toString())
    } catch (error) {
      settled = true
      cleanup()
      input.popup.close()
      reject(error)
    }
  })
}
