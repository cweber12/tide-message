# Design Brief: Marine Life

## Problem

A parent or homeschool group planning a San Diego ocean outing can already learn whether the *conditions* are good, but not what they might actually *see*. "Is there a chance we'll spot sea lions, leopard sharks, or a particular seabird at La Jolla Shores this month?" is a real planning and motivation question, and today the planner is silent on it. The user has to leave the app and stitch together iNaturalist, OBIS, and assorted wildlife sites by hand — and even then it's hard to tie a sighting back to *the place they're considering*.

## Solution

A new **Marine Life** view, sitting in the left-rail **Views** group as a sibling to Overview. It answers "what marine life has been seen near here lately, and what generally lives here?" for the currently selected place. The view reuses the existing Leaflet map to plot recent sightings around that place, paired with a photo-forward, scrollable species list. Selecting a species or sighting opens an in-app detail panel with the photo, names, recency, and a link out to the source record. A best-effort "tagged tracks" layer surfaces animal-telemetry migration paths when data exists for the region, and disappears quietly when it doesn't. The forecast day is irrelevant here, so it's dropped in favor of a "recent window" control; location stays.

## Experience Principles

1. **Discovery grounded in place over a generic species catalog** — Everything answers "near *this* spot," anchoring sightings to the same place the user is already planning around, not a global database dump.
2. **Reliable core, graceful enrichment** — iNaturalist and OBIS form a dependable base; OBIS distribution and ATN tracks are additive layers that degrade silently when a region or source returns nothing, so the view never looks broken.
3. **Editorial restraint, brought to life by photographs** — The page keeps the calm operations-dashboard frame, and lets species photography supply the warmth and color rather than decorative chrome.

## Aesthetic Direction

- **Philosophy**: The existing Functional Swiss-Editorial coastal-operations look, opened up to accommodate a photo-led discovery surface.
- **Tone**: Curious and inviting, but still credible and low-noise — a field guide rendered by a serious instrument, not a lifestyle app.
- **Reference points**: iNaturalist's species cards, Audubon/field-guide layouts, NOAA/marine-sanctuary species pages, the app's own Overview report modules.
- **Anti-references**: Gamified "Pokédex" collection UI, social-feed clutter, autoplaying media, surf-lifestyle branding, alarm-heavy color, and any treatment that makes Marine Life feel like a different product than the planner.

## Existing Patterns

This view extends the current single-file, vanilla-JS, static GitHub Pages app (no backend, no build step). All data must come from keyless, CORS-enabled, client-side `fetch` calls via the existing `fetchJson()` helper in `api.js`. Constants live in `config.js`, view composition in `render.js`, state/events/init in `app.js`. Routing is hash-based (`#/` overview, `#/activity/<slug>`); a new `#/marine-life` route slots into the same `parseRoute`/`applyRoute` pattern.

- **Typography**: Fraunces (display), IBM Plex Sans (body/UI), IBM Plex Mono (data) — already loaded; reuse as-is.
- **Colors**: Tokenized in `:root`. Ink `#050b10`, muted `#18242f`, lines `#c8d6e2`, brand/accent-primary `#0b5f8a`, accent-secondary `#d39f57`, status good `#1e6d56` / warn `#86611e` / error `#9a403a`. Chart series use `#1f5f7a` teal and `#c97347` terracotta. No shadows (`--shadow: none`); flat surfaces with 1px borders.
- **Spacing**: 4 / 8 / 12 / 16 / 24 / 32px scale (`--space-1`…`--space-6`). Radius is mostly square (`--radius-md/lg: 0`), with `--radius-sm: 8px`.
- **Components**: Left rail nav links with `aria-current`; `.panel` surfaces; report cards (`reportCardHtml`); metric cards (`.metric-card`); the Leaflet map already initialized in `map.js` with per-place markers; the context-media header with photo + credit; the availability-note pattern for missing data; warning band.

## Component Inventory

| Component | Status | Notes |
| --------- | ------ | ------ |
| "Marine Life" nav link | New | Added to the **Views** group in the left rail, sibling to Overview; `aria-current` active state; new `#/marine-life` route. |
| Marine Life view container | New | Hidden/shown like `overviewView` / `activityView` via `applyRoute`. |
| Recent-window control | New | Replaces the forecast-day select for this view (e.g. Last 30 / 90 / 365 days). Location + place selectors stay. |
| Sightings map | Modify | Reuse the existing Leaflet map, recentered on the selected place with a sightings radius; plot sighting markers and an optional tagged-tracks polyline layer. |
| Layer toggle | New | Toggle between/among iNaturalist sightings, OBIS distribution, and ATN tagged tracks; layers that return no data hide themselves. |
| Species list / gallery | New | Photo-forward, scrollable list of species seen in-window near the place, with count + most-recent date; paired with the map. |
| Species detail panel | New | In-app side/detail panel: photo, common + scientific name, recent count, date, source attribution, link out to iNaturalist/OBIS record. |
| Context header | Modify | Reuse the photo-header pattern; eyebrow "Marine Life," title "<Place> · recent sightings," stats summarizing counts/sources instead of forecast metrics. |
| Availability / empty states | Modify | Reuse the `availabilityNote` pattern per source and a friendly empty state when a window/place has no records. |
| Source/attribution footer | Modify | Add iNaturalist, OBIS, and ATN/IOOS to the existing sources footer with proper attribution + license. |
| iNaturalist / OBIS / ATN fetchers | New | New keyless, CORS-safe fetchers in `api.js` returning normalized sighting/species/track objects; ATN is best-effort with silent failure. |

## Key Interactions

- User clicks **Marine Life** in the left rail → route changes to `#/marine-life`, forecast-day select is replaced by the recent-window control, location/place selectors persist.
- The map recenters on the selected place and loads recent iNaturalist sightings within a radius; species list populates from the same data. A short status/summary states how many species and records were found in-window.
- User changes **place** or **recent window** → both map and species list refetch and re-render; missing sources note themselves quietly rather than erroring.
- User selects a species in the list **or** clicks a sighting marker → species detail panel opens with photo, names, recency, attribution, and a source link; corresponding map marker(s) highlight.
- User toggles the **OBIS** layer → adds historical "what lives here" context; toggles **Tagged tracks** → ATN migration paths render *if available for the region*, otherwise the toggle shows an unobtrusive "no tagged tracks in range" note.
- Coordinate-obscured / sensitive species (iNaturalist) are shown with a clear "approximate location" treatment rather than a precise pin.

## Responsive Behavior

- **Desktop**: Two-pane layout inside the main column — map on one side, species list on the other; detail panel slides in over/beside the list. Left rail stays sticky.
- **Tablet**: Single column — map stacked above the species list; detail becomes a full-width expanding panel beneath the selected card.
- **Mobile**: Map collapses to a shorter height (reuse `--chart-height-mobile` rhythm) above a single-column species list; detail panel becomes a full-screen overlay with a clear back affordance. Layer toggles wrap into a touch-friendly row.

## Accessibility Requirements

- Maintain WCAG AA contrast for text, controls, species-card captions, and map overlays.
- Nav link, recent-window control, layer toggles, species cards, and detail panel must all be keyboard reachable and operable; map markers need a non-map equivalent (the species/sightings list serves this).
- Use `aria-current="page"` on the active Marine Life nav link, matching the existing nav pattern.
- Every species photo needs descriptive `alt` (common + scientific name); decorative map chrome is `aria-hidden`.
- Detail panel manages focus on open/close and is dismissible via keyboard (Esc) with focus returned to the triggering element.
- Don't signal "no data" by an empty map alone — always include explanatory text, consistent with the existing availability-note convention.

## Out of Scope

- **eBird integration** — its required API key would ship in plaintext on a public static site; excluded until a proxy or backend exists.
- Converting the static app into a framework/multi-file build.
- User accounts, saved species lists, personal life-lists, or submitting observations back to any platform.
- Real-time or push wildlife alerts; data is recent/historical, not live.
- Identification help, range-prediction modeling, or any ML inference.
- Deep ATN/ERDDAP analytics beyond rendering available tagged tracks as a best-effort layer (ATN is intentionally a graceful-enrichment layer, not a core dependency, in v1).
- Tying sightings to the forecast day or activity ratings — Marine Life is a discovery view, decoupled from go/no-go scoring.
