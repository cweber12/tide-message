# Build Tasks: Family Ocean Portal V2

Generated from: .design/family-ocean-portal-v2/DESIGN_BRIEF.md
Date: 2026-06-04

## Foundation

- [ ] **Establish overview/activity shell**: Rework the page into a left-nav plus content layout with a shared filter bar and Overview as the default route. _Reuses: existing single-file architecture, current state object. Modifies: markup, layout CSS, route/view logic._
- [ ] **Retune the dashboard aesthetic**: Tighten the current tokenized visual system into a calmer, more professional Swiss-editorial dashboard with stronger hierarchy and less peripheral clutter. _Reuses: existing font and token setup. Modifies: root CSS, panels, nav, cards, and section headers._

## Core UI

- [ ] **Build grouped landing modules**: Replace separate charts and reports areas with compact modules where each report is paired with its related small chart and scan-friendly summary. _Modifies: chart markup, report rendering, overview structure._
- [ ] **Create dedicated activity views**: Add hash-routed activity pages/views that show only the detailed reports and charts relevant to the selected activity. _Depends on: Establish overview/activity shell._
- [ ] **Replace location handling with location-first filtering**: Add a location selector that defaults to La Jolla, then scope place selection and loaded content to that location. _Modifies: place controls, state defaults, selected-place logic._

## Interactions & States

- [ ] **Implement forecast-aware date selection**: Populate date choices from today through the furthest forecast date returned by weather or marine APIs, while allowing partial rendering when one source is missing for a later date. Covers: initial load, future dates, partial-data notes, unavailable-date fallback.
- [ ] **Tailor reports and messages by activity**: Define which metrics, charts, and copyable group chat messages belong to each activity, with homeschool message tools shown only where relevant. _Modifies: activity metadata, render functions, clipboard behavior._
- [ ] **De-emphasize secondary tools without removing them**: Move the map/custom-location workflow and source links into quieter supporting panels so the main decision path stays clean. _Modifies: page hierarchy and panel treatments._

## Responsive & Polish

- [ ] **Responsive pass for nav and modules**: Ensure the left activity nav becomes a usable mobile text rail and that overview/activity modules remain readable from 375px upward. Breakpoints: mobile, tablet, desktop.
- [ ] **Accessibility pass**: Verify `aria-current`, keyboard navigation, focus states, chart labels, and explicit partial-data messaging against the brief.

## Review

- [ ] **Design review**: Run /design-review against the brief.
