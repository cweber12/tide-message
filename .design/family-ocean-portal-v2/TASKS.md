# Build Tasks: Family Ocean Portal V2

Generated from: .design/family-ocean-portal-v2/DESIGN_BRIEF.md
Date: 2026-06-04

## Foundation

- [x] **Apply new tokenized visual system**: Replace existing page styling with a fully new clean professional theme using the new token philosophy (typography, surfaces, spacing, hierarchy). Done looks like a distinct visual identity with no carryover of old card styling. _Reuses: existing single-file architecture. Modifies: root CSS, layout classes, headings, controls._
- [x] **Create top-level view architecture**: Add dropdown-based view switch for Summary, Reports, and Activities with Summary as landing default. Done looks like deterministic section toggling with preserved state after updates. _Modifies: controls panel + section visibility logic._

## Core UI

- [x] **Refactor reports presentation**: Rebuild report sections so each area shows concise data and one suggestion line, with no oversized red prohibition language. Done looks like calm data-first report cards. _Modifies: summary/report rendering functions and report markup._
- [x] **Fix chart sizing permanently**: Ensure all condition charts use fixed-height wrappers and cannot vertically creep on repeated updates. Done looks like stable chart height after multiple refreshes/date switches. _Modifies: chart CSS + chart initialization lifecycle._

## Interactions and States

- [x] **Add per-section hourly drilldown**: Provide a View hourly data toggle per report section when hourly data exists. Done looks like collapsed-by-default details with accessible summary labels and table/list output. _New interaction. Depends on reports refactor._
- [x] **Improve activity suggestion accuracy**: Update activity scoring language and thresholds so tidepool logic prioritizes low tides and all activity suggestions stay practical and non-alarmist. Done looks like section-level activity guidance with confidence and official-source reminders. _Modifies: scoring + rendering copy._

## Responsive and Polish

- [x] **Finalize responsive pass for new design**: Validate mobile-first spacing, 44px+ targets, and legible section density across breakpoints. _Modifies: media queries and section grids._
- [x] **Accessibility pass**: Verify keyboard operability, focus styling, readable status text, and non-color-only status cues. _Modifies: ARIA labels and focus states as needed._

## Review

- [ ] **Design review**: Run /design-review against the brief.
