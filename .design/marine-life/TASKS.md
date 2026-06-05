# Build Tasks: Marine Life

Generated from: .design/marine-life/DESIGN_BRIEF.md
Date: 2026-06-04

Architecture note: vanilla-JS static app, no build step. Source files are
`assets/scripts/{config,api,scoring,utils,render,map,app,bootstrap}.js` and a
single `assets/styles/main.css`. Routing is hash-based via `parseRoute`/
`applyRoute` in `render.js`. Bump the `?v=` cache-busting query in `index.html`
for any file you touch.

## Foundation

- [ ] **Marine Life tokens + view shell + route**: Merge the `--ml-*` light tokens from `.design/marine-life/DESIGN_TOKENS.css` into the live `main.css :root`. Add a **Marine Life** `nav-link` to the **Views** group in `index.html` (sibling to `overviewNavLink`, `href="#/marine-life"`), and a hidden `marineLifeView` `<section>` container in the main column. Extend `parseRoute` to return `{ view: "marine-life", species }` and `applyRoute` to toggle the new container + `aria-current`, mirroring the Overview branch. _Done = clicking the link routes to `#/marine-life`, shows an empty titled view, sets active state. Establishes the Functional Swiss-Editorial "editorial frame, photos add warmth" direction. Reuses: nav pattern, hash router, context-media header._

- [ ] **iNaturalist fetcher + normalization** (risk-first): Add `fetchMarineLifeSightings(place, windowDays)` to `api.js` using the existing `fetchJson()` helper against the keyless iNat observations endpoint (geo radius around `place.lat/lon`, marine taxa, `d1` date filter). Normalize to `{ taxonId, commonName, sciName, photoUrl, count, lastSeen, lat, lon, obscured, sourceUrl }`, **aggregated by species** (count + most-recent). Verify CORS works from the static origin and confirm the `obscured`/`geoprivacy` flag is captured. _Done = console/`_smoke` call returns a normalized, de-duplicated species array for La Jolla. New code; no UI yet. This is the highest-uncertainty piece — prove it before building UI on top._

## Core UI

- [ ] **Species list / gallery**: Render the normalized species as a photo-forward card grid in `marineLifeView` (`render.js`). Each card: photo (4/3, scrim caption), common name, italic scientific name, count + most-recent date; OBIS/photo-less species use the placeholder token. Auto-fill grid using `--ml-list-card-min` / `--ml-grid-gap`. _Done = selecting a place shows real iNat species cards matching the token spec. Depends on: iNaturalist fetcher. New component; reuses `.panel`, `--ml-card-*` tokens._

- [ ] **Sightings map layer**: Reuse the existing Leaflet map (`map.js`); on the Marine Life view recenter on the selected place and plot sighting markers styled with `--ml-layer-sightings` + white ring. Wire marker ↔ species-card highlighting (hover/select syncs both ways). _Done = sightings appear as pins near the place and selecting a card highlights its marker. Depends on: iNaturalist fetcher, species list. Modifies: `map.js`._

- [ ] **Recent-window control + header swap + summary**: On the Marine Life view, replace the Forecast-day `<select>` with the segmented **Recent window** control (30 / 90 / 365 days; `--ml-segment-*` tokens); keep Location + Place. Render the context header (eyebrow "Marine Life," title "<Place> · recent sightings") and a summary chip strip ("N species · M sightings"). Changing place or window refetches map + list together. _Done = window/place changes drive a coordinated refetch and the summary updates. Depends on: species list, map layer. Modifies: header filter bar, context header._

## Interactions & States

- [ ] **Species detail panel**: In-app panel opened from a card or marker, deep-linked via `#/marine-life?species=<taxonId>`. Shows large photo, common + scientific name, recent count + date, source attribution, and an out-link to the iNat/OBIS record. Manage focus on open, dismiss on Esc/close with focus returned to trigger; clear `?species` on close. _Done = selecting a species opens an accessible, restorable detail panel. Covers: open, close, deep-link restore, focus trap/return. Depends on: species list, route plumbing. New component; reuses `--ml-panel-*`, `--color-surface-overlay`._

- [ ] **Layer toggles + OBIS + ATN best-effort**: Add a **Layers** control (iNaturalist sightings default-on, OBIS distribution, Tagged tracks). Add `fetchObisOccurrences(place, windowDays)` and a best-effort `fetchAtnTracks(place)` to `api.js` (keyless, CORS-safe). OBIS renders distribution markers (`--ml-layer-distribution`), ATN renders track polylines (`--ml-layer-tracks` + soft corridor); a layer that returns nothing self-disables with a quiet "no tagged tracks in range" note. _Done = toggling layers adds/removes data; absent sources degrade silently. Covers: layer on/off, empty-source disable. Depends on: map layer. New fetchers + map layer code._

- [ ] **Data states + obscured species + attribution**: Loading, empty (no records in window → friendly text + "widen the window" hint), and error states for each source, reusing the `availabilityNote` pattern. Obscured/sensitive species get the "approximate location" treatment (`--ml-marker-approx-*`, dashed halo, no precise pin). Add iNaturalist / OBIS / ATN-IOOS attribution + license to the sources footer. _Done = every load path has a clear non-empty-map explanation and sensitive species are visibly approximate. Covers: loading, empty, error, obscured, attribution. Depends on: fetchers, map, list._

## Responsive & Polish

- [ ] **Responsive layout**: Desktop two-pane (map + list, detail docks beside list at `--ml-panel-width`); tablet single column (map stacked above list, detail expands inline); mobile (shorter map via `--ml-map-height-mobile`, single-column list, detail becomes full-screen overlay, layer toggles wrap to a touch row). Breakpoints: `--breakpoint-md` (768), `--breakpoint-lg` (1024). _Done = layout adapts cleanly at all three sizes. Depends on: core UI + detail panel._

- [ ] **Accessibility pass**: AA contrast on card captions, layer swatches, and map overlays; keyboard reach for nav link, recent-window control, layer toggles, cards, and panel; `aria-current` on the active nav link; descriptive `alt` (common + scientific) on photos; `aria-hidden` decorative map chrome; species list serves as the non-map equivalent for markers; never signal "no data" by an empty map alone. _Specific checks from the brief's Accessibility section._

## Review

- [ ] **Design review**: Run /design-review against the brief.
