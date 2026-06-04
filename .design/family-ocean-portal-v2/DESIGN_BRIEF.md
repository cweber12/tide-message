# Design Brief: Family Ocean Portal V2

## Problem

A parent planning family and homeschool ocean outings has to piece together tides, weather, marine conditions, and activity suitability from multiple sources, then translate that into a practical decision. The current experience creates friction by making charts unstable, recommendations noisy or hard to trust, and activity-specific decisions insufficiently separated.

## Solution

Create a clearer planning interface that defaults to an overall summary, then lets the user switch between detailed reports and activity-specific guidance. Each section should present data first and a concise, accurate suggestion second, with optional hourly expansion when available. The interface should remain calm, straightforward, and technically credible while preserving official safety links and caveats.

## Experience Principles

1. Decision clarity over visual drama -- Always show practical next-step guidance from data without alarmist or oversized warning language.
2. Structured views over mixed context -- Separate Summary, Reports, and Activities to reduce cognitive load and make intent explicit.
3. Stability over novelty -- Keep chart sizing fixed and predictable, prevent runaway rendering behavior, and degrade gracefully when APIs partially fail.

## Aesthetic Direction

- **Philosophy**: Calm operations dashboard for families: NOAA-style straightforwardness with Weather Channel-like scanability.
- **Tone**: Calm, direct, technical, practical.
- **Reference points**: NOAA forecast pages, weather dashboards that prioritize quick comprehension and confidence.
- **Anti-references**: Alarmist red warning motifs, generic pro-surf app styling, noisy dashboard clutter, tacky student-project look, AI-generic styling.

## Existing Patterns

Keep implementation architecture and data plumbing, but fully replace visual style.

- Typography: Replace prior font pair with a cleaner professional typographic system.
- Colors: Replace previous palette with semantic tokens designed for a technical, calm dashboard.
- Spacing: Keep responsive behavior while retuning spacing/radius rhythm for cleaner hierarchy.
- Components: Reuse functional structure where practical, but redesign visual treatment of controls, cards, charts, and headings.

## Component Inventory

| Component | Status | Notes |
| --------- | ------ | ----- |
| View mode dropdown (Summary / Reports / Activities) | New | Top-level mode switch; Summary is default landing view. |
| Summary panel | Modify | Keep concise headline + confidence notes using existing style. |
| Reports section | Modify | Reframe charts into fixed-height report cards with data + suggestion blocks. |
| Activities section | Modify | Separate activity cards for tidepools, beach day, kids surf, adult surf, snorkel/dive, kayak/SUP. |
| Hourly data toggles | New | Per-section expand/collapse, hidden by default, only shown when data exists. |
| Condition charts | Modify | Enforce fixed height and prevent repeated vertical expansion on updates. |
| Recommendation text blocks | Modify | Replace large red advisory style with neutral data-first suggestion format. |
| Tidepool recommendation logic | Modify | Make low tide the primary positive factor and ensure suggestions are accurate. |
| Safety/source panel | Exists | Keep official source links and non-replacement safety disclaimer. |

## Key Interactions

- User chooses a date and place, then updates conditions.
- User switches top-level view from dropdown: Summary (default), Reports, Activities.
- Summary gives fast all-up guidance.
- Reports shows sectioned condition data with concise suggestion under each section and optional hourly detail toggle.
- Activities shows per-activity suitability cards with data-backed suggestions.
- Map click creates custom location and nearest tide station fallback behavior remains transparent.
- If partial API data fails, app continues rendering available sections with confidence warnings.

## Responsive Behavior

- Mobile: single-column stack, fixed-height charts reduced for smaller screens, toggles collapse dense hourly tables by default.
- Tablet/Desktop: maintain current panel grid system; Reports and Activities can use multi-column card layouts.
- View-mode switch remains persistent and visible across breakpoints.
- Hourly details should remain readable on small screens (horizontal overflow for tables if needed).

## Accessibility Requirements

- Maintain minimum contrast targets for body and status text (WCAG AA).
- All interactive controls keyboard accessible (dropdown, update button, hourly toggles, copy actions).
- Clear visible focus states on all controls.
- ARIA labels for chart canvases and expanded/collapsed hourly regions.
- Avoid color-only communication for recommendation severity; include explicit text labels.

## Out of Scope

- Backend services, auth, or build tooling.
- Paid APIs or API-key-dependent integrations.
- Replacing official advisories, closures, or lifeguard decisions.
- Automated beach water-quality ingestion beyond official link workflow.
- Full historical analytics or account-based saved plans.
