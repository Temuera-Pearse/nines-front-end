import type {
  ResultsPanelProps,
  Standing,
} from '../components/ResultsPanel/ResultsPanel'
import type { RaceState } from './raceStore'
import {
  describeRaceEvent,
  getHorseHex,
  getHorseName,
  getHorseNumber,
} from '../utils/raceHelpers'

export interface EventFeedEntry {
  id: string
  message: string
  accentColor: string
  usesHorseAccent: boolean
}

function oddsForHorse(_horseId: string): string {
  return '—'
}

function payoutForHorse(horseId: string, winnerId: string | null): string {
  return horseId === winnerId ? '—' : '—'
}

export function selectResultsStandings(state: RaceState): Standing[] {
  return state.placements.map((horseId, index) => ({
    position: index + 1,
    horseNumber: getHorseNumber(horseId),
    horseName: getHorseName(horseId),
    odds: oddsForHorse(horseId),
    payout: payoutForHorse(horseId, state.winner),
  }))
}

export function selectResultsWinner(
  state: RaceState,
): ResultsPanelProps['winner'] {
  if (!state.winner) return null

  return {
    horseNumber: getHorseNumber(state.winner),
    horseName: getHorseName(state.winner),
    odds: oddsForHorse(state.winner),
    payout: payoutForHorse(state.winner, state.winner),
  }
}

export function selectRecentEventFeed(state: RaceState): string[] {
  return [...state.recentEvents]
    .sort((left, right) => right.tickIndex - left.tickIndex)
    .map((event) => describeRaceEvent(event.eventId, event.affectedHorseIds))
}

export function selectRecentEventFeedEntries(state: RaceState): EventFeedEntry[] {
  return [...state.recentEvents]
    .sort((left, right) => right.tickIndex - left.tickIndex)
    .map((event) => {
      const primaryHorseId =
        event.affectedHorseIds.length === 1 ? event.affectedHorseIds[0] : null

      return {
        id: event.instanceId,
        message: describeRaceEvent(event.eventId, event.affectedHorseIds),
        accentColor: primaryHorseId ? getHorseHex(primaryHorseId) : '#94a3b8',
        usesHorseAccent: primaryHorseId !== null,
      }
    })
}

export function selectCurrentEventHeadline(state: RaceState): string | null {
  const latest = state.recentEvents[state.recentEvents.length - 1]
  if (!latest) return null
  return describeRaceEvent(latest.eventId, latest.affectedHorseIds)
}
