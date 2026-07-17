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
    assert.match(constants, /export const TRACK_HEIGHT = 1740/)
    assert.match(constants, /export const START_Y = 1220/)
    assert.match(constants, /export const FINISH_Y = 220/)
    assert.match(constants, /export const RACER_RADIUS_Y = 10/)
    assert.match(constants, /export const RACER_START_CLEARANCE_Y = 16/)
    assert.match(constants, /export const RACE_DISTANCE_Y = START_Y - FINISH_Y/)
    assert.match(constants, /export const RACER_START_Y = START_Y \+ RACER_START_CLEARANCE_Y/)
    assert.match(constants, /export const RACER_FINISH_Y = FINISH_Y \+ RACER_RADIUS_Y/)
    assert.match(constants, /export const RACER_DISTANCE_Y = RACER_START_Y - RACER_FINISH_Y/)
    assert.match(constants, /export const AUTO_RACE_CAMERA_ENABLED = true/)
  })

  it('renders a camera-driven viewport around a fixed-size world', () => {
    assert.match(
      raceTrack,
      /className="race-track-frame"[\s\S]*className="race-viewport"[\s\S]*className="race-track race-world"/,
    )
    assert.doesNotMatch(raceTrack, /race-track--finish-animate/)
    assert.doesNotMatch(raceTrackCss, /\.race-track--finish-animate/)
    assert.doesNotMatch(raceTrackCss, /finish-flash/)
    assert.match(raceTrackCss, /\.race-track-frame\s*{[^}]*position: relative/s)
    assert.match(raceTrackCss, /\.race-track-frame\s*{[^}]*overflow: hidden/s)
    assert.match(raceTrackCss, /\.race-viewport\s*{[^}]*width: 100%/s)
    assert.match(raceTrackCss, /\.race-viewport\s*{[^}]*overflow-x: hidden/s)
    assert.match(raceTrackCss, /\.race-viewport\s*{[^}]*overflow-y: hidden/s)
    assert.match(raceTrackCss, /\.race-viewport\s*{[^}]*scrollbar-width: none/s)
    assert.match(raceTrackCss, /\.race-viewport\s*{[^}]*scroll-behavior: auto/s)
    assert.match(
      raceTrackCss,
      /\.race-track\s*{[^}]*width: min\(100%, 420px\)/s,
    )
    assert.match(raceTrackCss, /\.race-track\s*{[^}]*height: 1740px/s)
    assert.match(raceTrackCss, /\.race-track\s*{[^}]*flex: 0 0 auto/s)
    assert.match(raceTrackCss, /\.race-track::before\s*{[^}]*inset: 0 32px/s)
    assert.match(
      raceTrackCss,
      /\.race-environment--fence\s*{[^}]*inset: 0 24px/s,
    )
    assert.match(raceTrackCss, /\.race-lane\s*{[^}]*bottom: 0/s)
    assert.match(
      raceTrackCss,
      /\.race-lane\s*{[^}]*width: var\(--lane-width\)/s,
    )
    assert.match(raceTrackCss, /\.race-lane\s*{[^}]*background: transparent/s)
    assert.match(raceTrackCss, /\.lane-label\s*{[^}]*bottom: 410px/s)
    assert.match(raceTrackCss, /\.lane-label\s*{[^}]*width: 112px/s)
    assert.match(raceTrackCss, /\.lane-label\s*{[^}]*font-size: 11px/s)
    assert.doesNotMatch(raceTrackCss, /repeating-linear-gradient\(\s*90deg/)
    assert.doesNotMatch(raceTrackCss, /@media/)
  })

  it('keeps race information pinned to the viewport', () => {
    assert.match(
      raceTrack,
      /<div className="race-track-frame">[\s\S]*<div className="race-viewport-info" aria-live="polite">[\s\S]*<div className="race-viewport" ref=\{viewportRef\}>/,
    )
    assert.match(
      raceTrack,
      /<div className="race-viewport-info"[\s\S]*?<div[\s\S]*?className="race-chip race-chip-left"/,
    )
    assert.match(
      raceTrack,
      /import \{ HeaderRaceTimer \} from '\.\.\/Header\/HeaderRaceTimer'/,
    )
    assert.match(raceTrack, /<HeaderRaceTimer \/>/)
    assert.doesNotMatch(raceTrack, /race-chip race-chip-right/)
    assert.match(
      raceTrack,
      /<div className="race-track-overlays">[\s\S]*?\{showStartSignal &&/,
    )
    assert.match(
      raceTrackCss,
      /\.race-viewport-info\s*{[^}]*position: absolute/s,
    )
    assert.match(
      raceTrackCss,
      /\.race-viewport-info \.nines-header-race-block\s*{[^}]*display: flex/s,
    )
    assert.match(
      raceTrackCss,
      /\.race-viewport-info \.nines-header-countdown-chip\s*{[^}]*min-height: 24px/s,
    )
    assert.doesNotMatch(raceTrackCss, /\.race-chip-right\s*{/)
    assert.match(
      raceTrackCss,
      /\.race-track-overlays\s*{[^}]*position: absolute/s,
    )
    assert.match(raceTrackCss, /\.race-viewport-info\s*{[^}]*z-index: 30/s)
    assert.match(raceTrackCss, /\.race-track-overlays\s*{[^}]*z-index: 30/s)
  })

  it('positions markers and runners from progress, not viewport width', () => {
    assert.match(raceTrack, /style=\{\{ top: `\$\{START_Y\}px` \}\}/)
    assert.match(raceTrack, /style=\{\{ top: `\$\{FINISH_Y\}px` \}\}/)
    assert.doesNotMatch(raceTrack, /<span>START<\/span>/)
    assert.doesNotMatch(raceTrack, /<span>FINISH<\/span>/)
    assert.doesNotMatch(raceTrackCss, /\.lane-marker span\s*{/)
    assert.match(
      raceHelpers,
      /return RACER_START_Y - clamp\(progress, 0, 1\) \* RACER_DISTANCE_Y/,
    )
    assert.match(horse, /positionToWorldY\(position, finishLineMeters\)/)
    assert.match(horse, /import \{ RACER_START_Y \} from '..\/..\/constants\/raceTrack'/)
    assert.match(horse, /top: `\$\{RACER_START_Y\}px`/)
    assert.match(
      horseCss,
      /\.horse\s*{[^}]*transform: translate\(-50%, -50%\)/s,
    )
    assert.match(horseCss, /\.horse-num\s*{[^}]*top: auto/s)
    assert.match(horseCss, /\.horse-num\s*{[^}]*bottom: -12px/s)
    assert.match(horseCss, /\.horse-num\s*{[^}]*font-size: 8px/s)
    assert.match(horseCss, /\.horse-effect\s*{[^}]*top: auto/s)
    assert.match(horseCss, /\.horse-effect\s*{[^}]*bottom: -23px/s)
    assert.doesNotMatch(horse, /clientWidth|offsetWidth|ResizeObserver/)
    assert.doesNotMatch(raceTrack, /innerWidth|matchMedia|screen\.width/)
  })

  it('drives the camera with lerped scrollTop following the leading pack', () => {
    assert.match(raceTrack, /AUTO_RACE_CAMERA_ENABLED/)
    assert.match(raceTrack, /const CAMERA_LERP = 0\.12/)
    assert.match(
      raceTrack,
      /const actionTarget = followedRunnerY - viewportHeight \* 0\.48/,
    )
    assert.match(
      raceTrack,
      /const finishTarget = FINISH_Y - viewportHeight \* 0\.2/,
    )
    assert.match(
      raceTrack,
      /return clamp\(START_Y - viewportHeight \* 0\.4, 0, maxScroll\)/,
    )
    assert.match(
      raceTrack,
      /const finishBias = clamp\(\(followedProgress - 0\.75\) \/ 0\.25, 0, 1\)/,
    )
    assert.match(raceTrack, /viewport\.scrollTop = nextScroll/)
    assert.doesNotMatch(raceTrack, /onScroll=\{handleViewportScroll\}/)
    assert.doesNotMatch(raceTrack, /manualPauseUntilRef|MANUAL_CAMERA_PAUSE_MS/)
  })
})
