# Design Brief: Family Ocean Portal V2

## Problem

The current planner makes a parent work too hard to find the handful of facts that actually determine whether a family or homeschool ocean outing is worth doing. Reports, charts, and activities are mixed together, the most meaningful data is not grouped tightly enough, and moving from an overview to an activity-specific decision takes more scanning than it should.

## Solution

Turn the planner into a cleaner operational dashboard with a summary-first landing page and dedicated activity views. The landing page should default to La Jolla and show grouped report modules where each report sits next to its related small chart and a short decision-oriented summary. A persistent left text navigation should open activity-specific views that reuse the same date and location filters but narrow the page to only the reports, charts, and homeschool messaging relevant to that activity.

## Experience Principles

1. Scanability over completeness upfront -- The landing page should answer "is this worth considering?" in seconds, with detail moved into activity views.
2. Group by decision, not by raw source -- Related chart and report content should live together so the user does not mentally stitch data back together.
3. Graceful partial data over hard failure -- Date filtering should include every future day available from the forecast APIs and simply omit sections whose source does not extend that far.

## Aesthetic Direction

- **Philosophy**: Functional Swiss-Editorial hybrid tuned for a calm coastal operations dashboard.
- **Tone**: Professional, direct, low-noise, technically credible.
- **Reference points**: NOAA forecast layouts, marine operations dashboards, weather products that foreground quick comprehension.
- **Anti-references**: Right-rail clutter, generic card farms, surf-lifestyle branding, bright alarm-heavy UI, hobby-project visual looseness.

## Existing Patterns

Keep the current single-file architecture and API plumbing where practical, but reshape the structure and hierarchy substantially.

- Typography: Fraunces plus IBM Plex family are already loaded and can stay if used more rigorously.
- Colors: Existing tokenized palette is serviceable; bias further toward restrained, professional contrast.
- Spacing: Existing spacing scale can be reused with tighter hierarchy and clearer section rhythm.
- Components: Existing charts, forecast fetchers, scoring logic, copy-to-clipboard actions, and optional map behavior should be preserved where they support the new flow.

## Component Inventory

| Component | Status | Notes |
| --------- | ------ | ----- |
| Left activity navbar | New | Sticky text-based navigation for activity pages; replaces the right rail pattern. |
| Top filter bar | Modify | Shared date and location controls; default zone is La Jolla. |
| Landing overview header | Modify | Faster summary of selected day, location, and decision headline. |
| Grouped report modules | New | Each module pairs a compact chart with a related summarized report. |
| Activity detail view | New | Single-activity page/view with only relevant reports and expanded detail. |
| Activity metadata panel | New | Shows activity rating, best timing, risks, and recommended use case. |
| Homeschool message panel | Modify | Show copy/pasteable group chat message only on homeschool-related activity views. |
| Date availability control | Modify | Offer every future day available from forecast APIs and tolerate missing sections past shorter ranges. |
| Map / custom location panel | Modify | De-emphasize this secondary feature so it does not compete with the primary decision workflow. |
| Safety/source footer | Modify | Keep official links and confidence notes in a quieter, cleaner format. |

## Key Interactions

- User lands on the overview page with La Jolla preselected and the current day loaded.
- User changes the day from a forecast-aware date list spanning today through the furthest available forecast window.
- User changes location using a location-first control and optionally a more specific place within that location.
- User scans grouped report modules where each chart and summary belong to the same decision area.
- User clicks an activity link in the left navbar and enters an activity-specific page/view.
- Activity view reuses the current date and location state, but only shows relevant detailed reports and charts for that activity.
- Homeschool-oriented activity views expose a copy button for a day/location/activity-specific group chat message.
- If one API has no data for a selected future day, the page still renders the sections supported by the remaining APIs and notes the missing source quietly.

## Responsive Behavior

- Mobile: single-column content stack with a horizontal activity nav rail that remains text-first and touch friendly.
- Tablet: left navigation becomes a slim sticky column; grouped report cards remain single column for readability.
- Desktop: two-column shell with sticky left activity nav and a wider content pane for overview or activity detail modules.
- Compact charts stay visibly smaller on landing than on activity views.

## Accessibility Requirements

- Maintain WCAG AA contrast for text, controls, and chart labels.
- Keep all nav links, filter controls, details toggles, and copy actions keyboard reachable.
- Use explicit active-state text and `aria-current` for the selected activity view.
- Ensure grouped modules have clear headings and chart labels for screen readers.
- Do not rely on missing/present sections alone to explain reduced confidence; include text.

## Out of Scope

- Converting the static app into a multi-file framework app.
- Replacing existing APIs or adding private/paid integrations.
- Historical analytics, user accounts, or saved plans.
- Automatic ingestion of beach closure or advisory feeds beyond the official source link pattern.
