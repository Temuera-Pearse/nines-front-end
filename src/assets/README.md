# Frontend Asset System

This folder is organized by asset domain rather than by component.

Principles:

- Keep runtime code importing from registries, not raw deep paths.
- Match event folder names to backend event ids.
- Reuse shared horse animation frames and skin horses separately.
- Keep placeholder files in empty folders so the intended structure is tracked.

Top-level structure:

- `backgrounds/`: track, crowd, sky, and scene overlays.
- `horses/`: shared animation frames and per-horse skin assets.
- `events/`: event-specific visual assets keyed by event id.
- `effects/`: reusable FX layers like dust, flashes, trails, and impacts.
- `ui/`: badges, markers, banners, and icons.
- `audio/`: sound effects, ambience, and announcer clips.

Naming guidance:

- Use lowercase filenames.
- Use underscores, not spaces.
- Prefer explicit suffixes like `_idle_01`, `_impact_01`, `_beam`, `_overlay`.

Examples:

- `ufo_abduction_beam.png`
- `horse_gallop_01.png`
- `temporary_shield_loop_01.webp`
- `finish_marker.svg`
