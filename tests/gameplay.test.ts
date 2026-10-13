import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { createNinesApiClient } from '../src/api/ninesApiClient'
import { submitWager } from '../src/gameplay/api'
import { isBettingOpen, wagerOutcome } from '../src/gameplay/lifecycle'
import { formatNinesMinor, parseNinesToMinor } from '../src/gameplay/money'
import type { PlayerWager } from '../src/gameplay/types'
import { RaceStatus } from '../src/state/raceStore'

describe('exact NINES amounts', () => {
  it('converts decimal input to exact six-place minor units without floats', () => {
    assert.equal(parseNinesToMinor('1'), '1000000')
    assert.equal(parseNinesToMinor('0.000001'), '1')
    assert.equal(parseNinesToMinor('123456789012.345678'), '123456789012345678')
    assert.equal(formatNinesMinor('123456789012345678'), '123456789012.345678')
  })

  it('rejects malformed, non-positive, and over-precision amounts', () => {
    for (const value of ['', '0', '-1', '1.0000001', '1e3', '1.2.3']) {
      assert.throws(() => parseNinesToMinor(value))
    }
  })
})

describe('authoritative lifecycle projection', () => {
  const closesAt = '2030-01-01T00:00:30.000Z'
  it('uses strict now < closesAt semantics', () => {
    assert.equal(isBettingOpen(RaceStatus.BETS_OPEN, closesAt, Date.parse(closesAt) - 1), true)
    assert.equal(isBettingOpen(RaceStatus.BETS_OPEN, closesAt, Date.parse(closesAt)), false)
    assert.equal(isBettingOpen(RaceStatus.BETS_CLOSED, closesAt, Date.parse(closesAt) - 1), false)
  })

  it('keeps result-known and settlement-confirmed states distinct', () => {
    const wager: PlayerWager = { betId: 'bet', raceRef: 'N9-ABCDE-FGHJK', selectionId: 'horse-1',
      stakeMinor: '1000000', status: 'accepted', rejectionCode: null,
      acceptedAt: closesAt, updatedAt: closesAt, poolStatus: 'frozen',
      winningSelectionId: null, settlementStatus: 'pending', settledAt: null, payoutMinor: null }
    assert.equal(wagerOutcome(wager, null), 'pending_result')
    assert.equal(wagerOutcome(wager, 'horse-1'), 'settlement_pending')
    assert.equal(wagerOutcome({ ...wager, status: 'settled_win', payoutMinor: '1800000' }, 'horse-1'), 'won')
    assert.equal(wagerOutcome({ ...wager, status: 'settled_loss' }, 'horse-2'), 'lost')
  })
})

describe('authenticated wager submission', () => {
  it('sends exact minor units with bearer and idempotency headers and uses the authoritative response', async () => {
    let requestHeaders: Headers | null = null
    let requestBody = ''
    const client = createNinesApiClient({ baseUrl: 'https://api.example.test',
      getAccessToken: async () => 'player-token',
      fetchImpl: async (_input, init) => {
        requestHeaders = new Headers(init?.headers)
        requestBody = typeof init?.body === 'string' ? init.body : ''
        return Response.json({ schemaVersion: 'nines-place-bet-result.v1', result: 'accepted',
          betId: 'bet-id', raceRef: 'N9-ABCDE-FGHJK', selectionId: 'horse-1',
          stake: { currency: 'NINES', scale: 6, minorUnits: '1250000' },
          rejectionCode: null, effectiveAt: '2030-01-01T00:00:29.000Z' }, { status: 201 })
      } })
    const result = await submitWager(client, { raceRef: 'N9-ABCDE-FGHJK', selectionId: 'horse-1',
      stakeMinor: '1250000', idempotencyKey: 'wager-idempotency' })
    assert.equal(result.result, 'accepted')
    assert.equal(requestHeaders?.get('authorization'), 'Bearer player-token')
    assert.equal(requestHeaders?.get('idempotency-key'), 'wager-idempotency')
    assert.deepEqual(JSON.parse(requestBody), { raceRef: 'N9-ABCDE-FGHJK', selectionId: 'horse-1',
      stakeMinor: '1250000' })
  })
})
