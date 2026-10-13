import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

const root = new URL('..', import.meta.url).pathname
const read = (path) => readFileSync(join(root, path), 'utf8')

describe('portrait mobile responsive layout contract', () => {
  const appCss = read('src/App.css')
  const app = read('src/App.tsx')
  const desktopLayout = read('src/layouts/desktop/DesktopLayout.tsx')
  const mobileLayout = read('src/layouts/mobile/MobileLayout.tsx')
  const mobileNav = read('src/layouts/mobile/MobileBottomNav.tsx')
  const mobileCss = read('src/layouts/mobile/MobileLayout.css')
  const trackCss = read('src/components/RaceTrack/RaceTrack.css')
  const bettingCss = read('src/components/BettingArea/BettingArea.css')
  const resultsCss = read('src/components/ResultsPanel/ResultsPanel.css')
  const headerCss = read('src/components/Header/Header.css')
  const racePageCss = read('src/pages/RacePage.css')

  it('selects a dedicated mobile layout instead of stacking the desktop grid', () => {
    assert.match(app, /useMediaQuery\(/)
    assert.match(app, /<MobileLayout \{\.\.\.layoutProps\} \/>/)
    assert.match(app, /<DesktopLayout \{\.\.\.layoutProps\} \/>/)
    assert.match(appCss, /@media \(max-width: 768px\).*orientation: portrait/s)
    assert.doesNotMatch(
      appCss,
      /@media \(max-width: 768px\).*?\.nines-race-layout\s*{[^}]*flex-direction: column/s,
    )
    assert.match(mobileLayout, /<MobileBottomNav \/>/)
    assert.match(mobileLayout, /<RaceTrack showFinishAnimation=\{showFinishAnimation\} \/>/)
    assert.match(mobileCss, /\.nines-mobile-nav\s*{[^}]*position: fixed/s)
    assert.match(mobileCss, /\.nines-mobile-nav\s*{[^}]*env\(safe-area-inset-bottom\)/s)
    assert.match(mobileNav, /Selection[\s\S]*Unavailable/s)
    assert.doesNotMatch(
      mobileCss,
      /\.nines-mobile-layout__track\s*{[^}]*transition:/s,
    )
    assert.doesNotMatch(mobileCss, /scale\(0\.98\)/)
    assert.doesNotMatch(mobileCss, /opacity: 0\.84/)
    assert.match(racePageCss, /\.race-page__track\s*{[^}]*height: 640px/s)
  })

  it('gives guests a public runner-order column without private controls', () => {
    assert.match(
      appCss,
      /\.nines-race-layout--guest\s*{[^}]*grid-template-columns: 28% minmax\(0, 1fr\) 24%/s,
    )
    assert.match(
      appCss,
      /\.nines-race-layout--guest \.nines-race-track-panel,[\s\S]*?\.nines-race-layout--guest \.nines-race-results-region\s*{[^}]*grid-column: 2/s,
    )
    assert.match(
      appCss,
      /\.nines-race-layout--guest \.nines-race-events\s*{[^}]*grid-column: 3/s,
    )
    assert.match(
      appCss,
      /\.nines-race-layout--guest \.nines-race-bottom-widgets\s*{[^}]*grid-column: 2 \/ 4/s,
    )
  })

  it('keeps track, betting controls, header controls, and results mobile-safe', () => {
    assert.match(desktopLayout, /<PlayerGameplayPanel \/>/)
    assert.doesNotMatch(desktopLayout, /BettingArea/)
    assert.doesNotMatch(mobileLayout, /MobileSelectionSheet/)
    assert.match(desktopLayout, /<OnTrackEventsCard \/>/)
    assert.match(desktopLayout, /<BottomWidgets \/>/)
    assert.doesNotMatch(trackCss, /@media \(max-width: 768px\).*orientation: portrait/s)
    assert.match(trackCss, /\.race-viewport\s*{[^}]*overflow-x: hidden/s)
    assert.match(trackCss, /\.race-viewport\s*{[^}]*overflow-y: hidden/s)
    assert.match(trackCss, /\.race-track\s*{[^}]*width: min\(100%, 420px\)/s)
    assert.match(trackCss, /\.race-track\s*{[^}]*height: 1740px/s)
    assert.match(mobileCss, /\.nines-mobile-nav button\s*{[^}]*min-height: 50px/s)
    assert.match(headerCss, /\.nines-header-button\s*{[^}]*min-height: 44px/s)
    assert.match(resultsCss, /max-height: min\(72vh, 680px\)/)
    assert.match(resultsCss, /overflow-y: auto/)
  })
})
