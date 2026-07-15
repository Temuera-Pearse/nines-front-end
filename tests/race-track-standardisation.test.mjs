import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

const root = new URL('..', import.meta.url).pathname
const read = (path) => readFileSync(join(root, path), 'utf8')

describe('fixed race track world contract', () => {
  const constants = read('src/constants/raceTrack.ts')
  const raceTrack = read('src/components/RaceTrack/RaceTrack.tsx')
  const raceTrackCss = read('src/components/RaceTrack/RaceTrack.css')
  const horse = read('src/components/Horse/Horse.tsx')
  const horseCss = read('src/components/Horse/Horse.css')
  const raceHelpers = read('src/utils/raceHelpers.ts')

  it('defines a single fixed world and start/finish coordinates', () => {
    assert.match(constants, /export const TRACK_WIDTH = 420/)
    assert.match(constants, /export const TRACK_HEIGHT = 1180/)
    assert.match(constants, /export const START_Y = 1090/)
    assert.match(constants, /export const FINISH_Y = 90/)
    assert.match(constants, /export const RACE_DISTANCE_Y = START_Y - FINISH_Y/)
    assert.match(constants, /export const AUTO_RACE_CAMERA_ENABLED = true/)
  })

  it('renders a scrollable viewport around a fixed-size world', () => {
    assert.match(
      raceTrack,
      /className="race-viewport"[\s\S]*className=\{`race-track race-world/,
    )
    assert.match(raceTrackCss, /\.race-viewport\s*{[^}]*width: 100%/s)
    assert.match(raceTrackCss, /\.race-viewport\s*{[^}]*overflow-x: hidden/s)
    assert.match(raceTrackCss, /\.race-viewport\s*{[^}]*overflow-y: auto/s)
    assert.match(raceTrackCss, /\.race-viewport\s*{[^}]*scroll-behavior: auto/s)
    assert.match(raceTrackCss, /\.race-track\s*{[^}]*width: min\(100%, 420px\)/s)
    assert.match(raceTrackCss, /\.race-track\s*{[^}]*height: 1180px/s)
    assert.match(raceTrackCss, /\.race-track\s*{[^}]*flex: 0 0 auto/s)
    assert.match(raceTrackCss, /\.race-lane\s*{[^}]*bottom: 0/s)
    assert.match(raceTrackCss, /\.race-lane\s*{[^}]*width: var\(--lane-width\)/s)
    assert.doesNotMatch(raceTrackCss, /@media/)
  })

  it('positions markers and runners from progress, not viewport width', () => {
    assert.match(raceTrack, /style=\{\{ top: `\$\{START_Y\}px` \}\}/)
    assert.match(raceTrack, /style=\{\{ top: `\$\{FINISH_Y\}px` \}\}/)
    assert.match(
      raceHelpers,
      /return START_Y - clamp\(progress, 0, 1\) \* RACE_DISTANCE_Y/,
    )
    assert.match(horse, /positionToWorldY\(position, finishLineMeters\)/)
    assert.match(horseCss, /\.horse\s*{[^}]*transform: translate\(-50%, -50%\)/s)
    assert.doesNotMatch(horse, /clientWidth|offsetWidth|ResizeObserver/)
    assert.doesNotMatch(raceTrack, /innerWidth|matchMedia|screen\.width/)
  })

  it('drives the camera with lerped scrollTop and a manual override pause', () => {
    assert.match(raceTrack, /AUTO_RACE_CAMERA_ENABLED/)
    assert.match(raceTrack, /const CAMERA_LERP = 0\.12/)
    assert.match(raceTrack, /const MANUAL_CAMERA_PAUSE_MS = 3_000/)
    assert.match(
      raceTrack,
      /const actionTarget = followedRunnerY - viewportHeight \* 0\.48/,
    )
    assert.match(
      raceTrack,
      /const finishTarget = FINISH_Y - viewportHeight \* 0\.18/,
    )
    assert.match(
      raceTrack,
      /const finishBias = clamp\(\(followedProgress - 0\.75\) \/ 0\.25, 0, 1\)/,
    )
    assert.match(raceTrack, /viewport\.scrollTop = nextScroll/)
    assert.match(
      raceTrack,
      /manualPauseUntilRef\.current = now \+ MANUAL_CAMERA_PAUSE_MS/,
    )
  })
})
