# Information Architecture: Marine Life

## Site Map

The app is a single-page, hash-routed static site. Marine Life adds one new top-level route in the **Views** group. All routes share the same header (filter bar) and left rail.

- Overview `#/` — existing default view
- **Marine Life `#/marine-life`** — new; sibling to Overview in the Views group
  - Species detail — `#/marine-life?species=<taxonId>` *(in-app panel; deep-linkable, not a separate page)*
- Activities (existing)
  - Tide Pools `#/activity/tide-pools`
  - Beach Day `#/activity/beach-day`
  - Surf `#/activity/surf`
  - Dive `#/activity/dive`
  - Paddle `#/activity/paddle`

Marine Life has no nested *pages* — the species detail is an in-app panel layered over the view, with a query param so a selected species can be linked/restored on reload. This matches the app's flat, panel-based model (Overview and Activity views are siblings, not nested trees).

## Navigation Model

- **Primary navigation**: The left rail, unchanged in structure. Two groups: **Views** (Overview, **Marine Life**) and **Activities** (5 activity links). Marine Life is appended to the Views group via the same `nav-link` + `aria-current` pattern used by `overviewNavLink`. Max items in Views group: 2 today, designed to tolerate a few more.
- **Secondary navigation (within Marine Life)**:
  - *Layer toggles* — iNaturalist sightings (default on), OBIS distribution, Tagged tracks (ATN). Segmented/checkbox-style control; layers with no data self-disable with a quiet note.
  - *Species list* — the scrollable list/gallery acts as in-view navigation: selecting a species drives the detail panel and highlights map markers. This is the keyboard-accessible equivalent of clicking map pins.
- **Utility navigation**: The shared header filter bar. On Marine Life the **Forecast day** select is swapped for a **Recent window** control; **Location** and **Place** persist. The sources footer gains iNaturalist / OBIS / ATN attribution.
- **Mobile navigation**: Left rail collapses per existing responsive behavior. Within Marine Life, layer toggles wrap to a touch row; the species detail becomes a full-screen overlay with a back affordance.

## Content Hierarchy

### Marine Life view
1. **Context header (place + summary)** — Eyebrow "Marine Life," title "<Place> · recent sightings," and a one-line summary of species/record counts in-window. Orients the user to *where* and *how much* before detail. Reuses the context-media photo header.
2. **Map of recent sightings** — Spatial anchor; recentered on the selected place with a sightings radius. The primary "near here" payoff.
3. **Species list / gallery** — Photo-forward, scrollable; each card shows photo, common + scientific name, sighting count, most-recent date. The browsable counterpart to the map.
4. **Layer toggles** — Adjacent to map/list; secondary because the default iNaturalist layer is useful with zero interaction.
5. **Species detail panel** — On-demand, overlays list/map area. Highest *depth* but only when invoked.
6. **Availability / empty notes + source attribution** — Quiet, below the working area; explain missing layers and credit sources.

### Recent-window control (header, Marine Life only)
1. Last 30 days (default) — freshest, most "right now" signal.
2. Last 90 days — seasonal context.
3. Last 365 days — "what lives here generally."

## User Flows

### Enter Marine Life
1. User is on Overview or an Activity view with a place selected.
2. User clicks **Marine Life** in the left rail → route becomes `#/marine-life`, `aria-current` moves, Forecast-day select swaps to Recent-window.
3. View loads: map recenters on the selected place, iNaturalist sightings fetch for the default 30-day window, species list and summary populate.
   - If sightings returned → map pins + species cards render.
   - If none in window → friendly empty state with text + suggestion to widen the window; map still shows the place.

### Change place or recent window
1. User changes **Place** (or **Location** → Place) or the **Recent window**.
2. Map and species list refetch and re-render together; the summary count updates.
   - If a layer source errors/returns nothing → that layer notes itself quietly; other layers still render.

### Inspect a species / sighting
1. User selects a species card **or** clicks a sighting marker.
2. Detail panel opens (`?species=<taxonId>`): photo, names, recent count, date, source attribution, link out to iNaturalist/OBIS record. Corresponding map marker(s) highlight; focus moves into the panel.
3. User dismisses (Esc / close / back) → panel closes, `?species` cleared, focus returns to the triggering card/marker.
   - Sensitive/obscured species → shown with an "approximate location" treatment instead of a precise pin.

### Add enrichment layers
1. User toggles **OBIS distribution** → adds historical "what lives here" context to map/list.
2. User toggles **Tagged tracks (ATN)** → migration polylines render *if available for the region*; otherwise the toggle shows "no tagged tracks in range" and stays off.

## Naming Conventions

| Concept | Label in UI | Notes |
|---------|-------------|-------|
| The view | **Marine Life** | Matches user's framing; sits in Views group. |
| Time scope | **Recent window** | "Recent," not "Date" — signals historical, not forecast. Options phrased "Last 30 days" etc. |
| A single observation | **Sighting** | User-facing word for an iNaturalist/OBIS occurrence record. |
| A kind of animal | **Species** | Use over "taxon"; show common name primary, scientific name secondary. |
| Data source toggles | **Layers** | Map convention; "iNaturalist sightings," "OBIS distribution," "Tagged tracks." |
| ATN telemetry | **Tagged tracks** | Plain-language for animal-telemetry migration paths; avoid "ATN/ERDDAP" in UI (footer only). |
| Map radius around place | **Nearby** | "Sightings nearby," not "within Nkm" in primary copy. |
| Missing data | **availability note** | Reuse existing pattern/word from forecast views. |

## Component Reuse Map

| Component | Used on | Behavior differences |
|-----------|---------|----------------------|
| Left rail nav (`nav-link`, `aria-current`) | All views | Marine Life link added to Views group; no behavioral change. |
| Header filter bar | All views | On Marine Life, Forecast-day select is replaced by Recent-window; Location + Place unchanged. |
| Hash router (`parseRoute`/`applyRoute`) | All views | Add `#/marine-life` branch + optional `?species` param; show/hide a new `marineLifeView` container like `overviewView`/`activityView`. |
| Context-media header (photo + eyebrow + title + stats) | Overview, Activity, **Marine Life** | Stats summarize species/record counts and active sources instead of forecast metrics. |
| Leaflet map (`map.js`) | Overview (custom-location), **Marine Life** | Marine Life recenters on place, adds sighting markers + optional track polylines + layer control; Overview keeps its custom-point behavior. |
| `.panel` surface + availability-note pattern | All views | Reused for map panel, list panel, and empty/missing-source notes. |
| Sources footer | All views | Marine Life adds iNaturalist / OBIS / ATN-IOOS attribution + license. |
| `fetchJson()` (`api.js`) | All data | New keyless, CORS-safe fetchers for iNaturalist / OBIS / ATN returning normalized objects. |

## Content Growth Plan

- **Sightings volume** grows with the recent window and popular places. Cap the species list to a sensible page size with "show more" / lazy loading; aggregate by species (count + most-recent) rather than listing every raw record, keeping the list bounded.
- **Sources** may expand later (e.g. eBird behind a future proxy, GBIF). The **Layers** model and normalized fetcher shape are the extension point — a new source becomes a new toggle + fetcher without restructuring the view.
- **Places** grow via `config.js` `PLACES`/`LOCATIONS`; Marine Life inherits new places automatically through the shared Place selector.
- No archival/pagination of *pages* is needed — growth is within-view (list paging, layer toggles), consistent with the app's flat structure.

## URL Strategy

- **Pattern**: Hash routes, matching existing convention. `#/marine-life`.
- **Dynamic segments**: None as path segments (flat view model). Species selection is a query param on the hash: `#/marine-life?species=<taxonId>`.
- **Query parameters** (all optional, restore-on-load, default-omitted):
  - `species=<taxonId>` — open a species detail panel.
  - Recent window and active layers default in state and are *not* required in the URL for v1; they can be promoted to params later if shareable views become a goal (noted, out of scope now).
- **Routing integration**: Extend `parseRoute` to recognize `marine-life` (returning `{ view: "marine-life", species? }`) and `applyRoute` to toggle the `marineLifeView` container and `aria-current`, mirroring the Overview branch.
