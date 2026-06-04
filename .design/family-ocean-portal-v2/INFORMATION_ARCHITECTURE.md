# Information Architecture: Family Ocean Portal V2

## Site Map

- Overview `/`
- Activity view `#/activity/tide-pools`
- Activity view `#/activity/beach-day`
- Activity view `#/activity/kids-surf`
- Activity view `#/activity/adult-surf`
- Activity view `#/activity/snorkel-dive`
- Activity view `#/activity/paddle`

## Navigation Model

- **Primary navigation**: Left text navbar listing six activity links plus an overview/home link. Maximum seven items.
- **Secondary navigation**: Shared top filter bar for day, location zone, and place selection. This persists across overview and activity views.
- **Utility navigation**: Source links, water-quality link, and optional custom map selection live in secondary panels below the main decision content.
- **Mobile navigation**: Activity links collapse into a horizontally scrollable text rail above content; filters remain stacked.

## Content Hierarchy

### Overview
1. Date and location context -- The user must know immediately what day and coastline area they are looking at.
2. Decision summary -- Fast read on overall suitability and the top reasons.
3. Grouped report modules -- Tide, weather, and marine modules each combine chart plus summary for fast scanning.
4. Secondary tools -- Map/custom location, source links, and supporting notes.

### Activity View
1. Activity-specific recommendation -- Clear headline, best timing, and why this activity is or is not a fit.
2. Relevant detailed reports -- Only the source sections that matter to that activity.
3. Relevant charts -- Larger versions of the specific charts that support the activity decision.
4. Homeschool message tools -- Only for homeschool-related activities.
5. Secondary tools -- Safety and official links.

## User Flows

### Daily planning overview
1. User lands on `/`
2. User sees La Jolla and the current date preselected
3. User scans the summary and grouped modules
4. User either decides from the overview or clicks an activity link for more detail

### Activity-specific evaluation
1. User clicks an activity in the left navbar
2. User arrives at `#/activity/<activity-slug>`
3. User sees the current date and location carried over automatically
4. User reviews only the relevant detailed modules and charts
5. If the activity is homeschool-related, user copies the prepared group chat message

### Future-date planning with partial data
1. User opens the date selector
2. User chooses any day from today through the furthest forecast date available from weather or marine APIs
3. The app loads available data for that date
4. If one source is unavailable for that date, the page renders the remaining sources and shows a quiet availability note

## Naming Conventions

| Concept | Label in UI | Notes |
|---------|-------------|-------|
| Top-level non-activity page | Overview | Faster and clearer than "summary" |
| Coast area grouping | Location | User asked for location-based filtering |
| Specific lat/lon preset | Place | Secondary selector within a location |
| Activity suitability line | Recommendation | Direct, neutral language |
| Missing source note | Availability note | Communicates partial coverage without alarm |

## Component Reuse Map

| Component | Used on | Behavior differences |
|-----------|---------|---------------------|
| Filter bar | Overview, all activity views | Same controls and state everywhere |
| Left activity navbar | Overview, all activity views | Active item changes by route |
| Grouped report module | Overview | Compact chart plus abbreviated report |
| Detailed report module | Activity views | Longer metric list, larger chart, relevance scoped by activity |
| Message panel | Homeschool-related activity views | Copy content changes per activity/date/location |
| Map/custom location panel | Overview, optionally activity views | Lower priority placement |

## Content Growth Plan

Activity views can grow by adding more specialized report modules without changing the primary navigation model. Locations can expand by adding more places within a zone and more zones within the location filter. Report modules stay composable so new data sources can be inserted into overview or activity pages without restructuring the entire app.

## URL Strategy

- Pattern: Static root page with hash-based activity routes, `#/activity/<activity-slug>`
- Dynamic segments: Activity slug only
- Query parameters: Not required initially; date and location state remain client-side
