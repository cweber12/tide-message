# Agent Prompt: Upgrade `index.html` into a San Diego Family Ocean Portal

You are a coding agent updating an existing static GitHub Pages site. Work directly on the existing `index.html` file. Do not create a backend, do not introduce a build step, and do not require API keys. The app must remain a single-page static web app that can run from GitHub Pages by opening `index.html` in a browser.

## Current project context

The current page is a simple NOAA tide-based weekly tide-pool group-message generator. It already has:

- A single `index.html` file.
- Inline CSS and vanilla JavaScript.
- NOAA CO-OPS tide prediction fetching.
- Cards for San Diego, La Jolla, and Mission Bay.
- A copyable weekly homeschool tide-pool message.

Transform this into a broader family-focused ocean/beach dashboard for San Diego, Mission Bay, and La Jolla. The tide-pool group-chat message should remain, but it should become one sub-feature inside the larger portal.

## Product goal

Build a personal/family ocean activity portal for the user's wife, kids, and homeschool groups. It does not need to feel like a generic surf app. It should combine data that may seem unrelated to others, because the purpose is practical family decision support.

The page should help answer:

> Where should we go, on what day, and what ocean/beach activities look reasonable for our family or homeschool group?

Supported activity categories:

1. Homeschool tide pooling.
2. General beach day.
3. Kids / beginner surfing.
4. Adult surfing.
5. Snorkeling / diving.
6. Kayaking / stand-up paddleboarding.

## Non-negotiable constraints

- Keep the app deployable on GitHub Pages as static files.
- Prefer a single `index.html` file with inline CSS and JavaScript.
- No server-side code.
- No Node/npm build process.
- No API keys.
- No paid APIs.
- No scraping Surfline or other commercial sites.
- Do not claim the app replaces lifeguards, posted warnings, water-quality closures, or official safety guidance.
- Make the app useful even when one API fails. Show partial data and clear warnings.

## External libraries to add

Use CDN-hosted browser libraries:

1. Leaflet for the interactive OpenStreetMap map.
   - CSS: `https://unpkg.com/leaflet/dist/leaflet.css`
   - JS: `https://unpkg.com/leaflet/dist/leaflet.js`
2. Chart.js for charts.
   - JS: `https://cdn.jsdelivr.net/npm/chart.js`

Keep OpenStreetMap attribution visible. Use the standard tile URL:

```js
https://tile.openstreetmap.org/{z}/{x}/{y}.png
```

Do not add a geocoding dependency for the MVP. Use saved places and map clicks instead.

## Free public data sources

### 1. NOAA CO-OPS tides

Use NOAA CO-OPS API for tide predictions.

Base URL:

```text
https://api.tidesandcurrents.noaa.gov/api/prod/datagetter
```

Parameters for tide predictions:

```text
product=predictions
application=sd-family-ocean-portal
begin_date=YYYYMMDD
end_date=YYYYMMDD
datum=MLLW
time_zone=lst_ldt
units=english
format=json
station=STATION_ID
```

Use two tide requests where possible:

1. A tide-height series for the chart.
2. High/low predictions with `interval=hilo` for activity windows and message text.

If the height-series request fails, do not break the app. Fall back to the high/low prediction list only.

Recommended tide stations / prediction stations:

```js
const TIDE_STATIONS = {
  sanDiego: { id: "9410170", name: "San Diego, CA" },
  laJolla: { id: "9410230", name: "La Jolla, CA" },
  missionBay: { id: "TWC0413", name: "Quivira Basin, Mission Bay" }
};
```

If `TWC0413` fails in the NOAA API, fallback for Mission Bay to San Diego `9410170` and show a note that Mission Bay tide data is using the nearest available NOAA station fallback.

### 2. Open-Meteo weather forecast

Use Open-Meteo Forecast API for family beach weather.

Base URL:

```text
https://api.open-meteo.com/v1/forecast
```

Request hourly and daily fields for the selected date/location:

```text
latitude=LAT
longitude=LON
timezone=America/Los_Angeles
temperature_unit=fahrenheit
wind_speed_unit=mph
precipitation_unit=inch
hourly=temperature_2m,precipitation_probability,precipitation,wind_speed_10m,wind_gusts_10m,cloud_cover,uv_index
daily=sunrise,sunset,uv_index_max,precipitation_probability_max,temperature_2m_max,temperature_2m_min
start_date=YYYY-MM-DD
end_date=YYYY-MM-DD
```

If a field is absent, skip it gracefully.

### 3. Open-Meteo Marine API

Use Open-Meteo Marine API for waves, swell, and sea-surface temperature.

Base URL:

```text
https://marine-api.open-meteo.com/v1/marine
```

Request hourly fields:

```text
latitude=LAT
longitude=LON
timezone=America/Los_Angeles
hourly=wave_height,wave_direction,wave_period,swell_wave_height,swell_wave_direction,swell_wave_period,wind_wave_height,sea_surface_temperature,ocean_current_velocity,ocean_current_direction
start_date=YYYY-MM-DD
end_date=YYYY-MM-DD
```

Treat wave heights as meters unless the API response confirms a different unit. Convert meters to feet with:

```js
const metersToFeet = meters => meters == null ? null : meters * 3.28084;
```

Treat sea-surface temperature as Celsius unless the API response confirms Fahrenheit. Convert Celsius to Fahrenheit with:

```js
const cToF = c => c == null ? null : (c * 9 / 5) + 32;
```

### 4. Water quality

For MVP, do not depend on an automated water-quality API unless a reliable CORS-friendly JSON endpoint is discovered. Add a visible official water-quality card that links to:

```text
https://www.sdbeachinfo.com/
```

Also add language near the activity ratings:

> Always check official San Diego County Beach & Bay water-quality status before entering the water. This page summarizes forecast conditions but does not replace beach closures, posted signs, lifeguards, or official advisories.

Optional enhancement: add a placeholder function `fetchWaterQualityStatus(place)` that currently returns `{ status: "check official source", url: "https://www.sdbeachinfo.com/" }`. Keep all activity scoring conservative when water quality is unknown.

## Saved family places

Replace the simple station-only list with a place model. Include these saved spots:

```js
const PLACES = [
  {
    id: "la-jolla-shores",
    name: "La Jolla Shores",
    zone: "La Jolla",
    lat: 32.8570,
    lon: -117.2571,
    tideStation: "9410230",
    notes: "Good family beach, snorkeling/diving access, kayak launch area nearby."
  },
  {
    id: "la-jolla-cove",
    name: "La Jolla Cove",
    zone: "La Jolla",
    lat: 32.8507,
    lon: -117.2725,
    tideStation: "9410230",
    notes: "Snorkeling/diving and rocky shoreline; check surf and water quality."
  },
  {
    id: "scripps-pier",
    name: "Scripps Pier",
    zone: "La Jolla",
    lat: 32.8663,
    lon: -117.2544,
    tideStation: "9410230",
    notes: "Useful La Jolla reference point for beach and tide-pool planning."
  },
  {
    id: "mission-bay-quivira",
    name: "Mission Bay / Quivira Basin",
    zone: "Mission Bay",
    lat: 32.7607,
    lon: -117.2359,
    tideStation: "TWC0413",
    notes: "Often better for paddling and calmer family water activities than exposed coast."
  },
  {
    id: "mission-beach",
    name: "Mission Beach",
    zone: "Mission Bay / Coast",
    lat: 32.7707,
    lon: -117.2520,
    tideStation: "TWC0413",
    notes: "Beach day and surf zone; check waves, wind, and water quality."
  },
  {
    id: "ocean-beach",
    name: "Ocean Beach",
    zone: "San Diego",
    lat: 32.7490,
    lon: -117.2535,
    tideStation: "9410170",
    notes: "Exposed coast; good to compare waves, wind, and tide timing."
  },
  {
    id: "point-loma-cabrillo",
    name: "Point Loma / Cabrillo",
    zone: "San Diego",
    lat: 32.6726,
    lon: -117.2406,
    tideStation: "9410170",
    notes: "Important tide-pool area; check access rules, park hours, swell, and low tide."
  }
];
```

When the user clicks on the map outside a saved spot, create a temporary selected place:

```js
{
  id: "custom",
  name: "Custom map location",
  zone: "Selected on map",
  lat,
  lon,
  tideStation: nearestTideStation(lat, lon),
  notes: "Selected by map click."
}
```

Implement `nearestTideStation(lat, lon)` by comparing distance to the three station reference points. Do not geocode.

## UI requirements

Update the page layout to this structure:

1. Header
   - Title: `Family Ocean Day Planner`
   - Subtitle: `San Diego • Mission Bay • La Jolla`
   - Short explanation that it combines tides, weather, waves, and activity recommendations for family and homeschool planning.

2. Controls panel
   - Date picker.
   - Buttons: `Today`, `Tomorrow`, `This Weekend` if easy.
   - Saved-place buttons or select dropdown.
   - `Update conditions` button.

3. OpenStreetMap / Leaflet map
   - Center on coastal San Diego / La Jolla / Mission Bay.
   - Add markers for saved places.
   - Click a marker to select that saved place.
   - Click the map to select a custom lat/lon.
   - Show selected place name and coordinates.

4. Overall summary panel
   - Selected place.
   - Selected date.
   - Short family-friendly summary.
   - Data freshness / warnings.

5. Activity cards
   - Tide pools / homeschool.
   - General beach day.
   - Kids / beginner surf.
   - Adult surf.
   - Snorkel / dive.
   - Kayak / SUP.

6. Charts section
   - Tide chart.
   - Wave/swell chart.
   - Wind chart.
   - Weather/rain chart.
   - Optional water-temperature chart if data exists.

7. Message tools
   - Keep the existing tide-pool homeschool group message generator.
   - Add optional beach-day and beginner-surf message generators if simple.
   - Each message should be copyable.

8. Safety / official links footer
   - NOAA tide source link.
   - Open-Meteo weather/marine source link.
   - San Diego County Beach & Bay water-quality link.
   - NWS forecast/alerts link if included.

## Chart requirements

Use Chart.js. Create and update charts without leaking old Chart instances. Store chart objects globally and call `.destroy()` before re-rendering.

Required charts:

1. Tide chart
   - X axis: local hour.
   - Y axis: tide height in feet.
   - Show low/high markers if practical.

2. Wave/swell chart
   - X axis: local hour.
   - Y axis: feet for wave/swell height.
   - Include wave height and swell height if available.
   - Include swell period as either a second dataset or a separate simple text summary if dual axes are too much.

3. Wind chart
   - X axis: local hour.
   - Y axis: mph.
   - Include sustained wind and gusts if available.

4. Rain/weather chart
   - X axis: local hour.
   - Y axis: precipitation probability percentage.
   - Add temperature as a separate dataset if clean; otherwise show temperature in summary text.

5. Water-temperature chart
   - Only render if sea-surface temperature is available.

## Activity scoring requirements

Implement readable scoring functions. Do not overfit; make the thresholds easy for a parent to understand and adjust.

Use these as initial thresholds. Put them in a clearly labeled constants object so the user can edit them later.

```js
const THRESHOLDS = {
  tidePools: {
    excellentLowTideFt: 0.5,
    goodLowTideFt: 1.0,
    maybeLowTideFt: 1.5,
    excellentWaveFt: 2.5,
    goodWaveFt: 3.0,
    maybeWaveFt: 4.0,
    maxGoodWindMph: 15,
    maxMaybeWindMph: 18,
    maxGoodRainChance: 30
  },
  kidsSurf: {
    minWaveFt: 1,
    maxGoodWaveFt: 3,
    maxMaybeWaveFt: 4,
    maxGoodWindMph: 12,
    maxMaybeWindMph: 15
  },
  snorkelDive: {
    maxGoodWaveFt: 2,
    maxMaybeWaveFt: 3,
    maxGoodWindMph: 10,
    maxMaybeWindMph: 15
  },
  paddle: {
    maxGoodWaveFt: 2.5,
    maxGoodWindMph: 10,
    maxGoodGustMph: 15,
    maxMaybeWindMph: 15,
    maxMaybeGustMph: 20
  }
};
```

### Tide-pool / homeschool rating

Use low tide height, daylight, wave height, wind, rain chance, and water-quality status.

Ratings:

- `Excellent`
- `Good`
- `Maybe`
- `Poor`
- `Not recommended`

If water quality is unknown, do not automatically mark as unsafe, but include a visible caution.

### General beach day rating

Use air temperature, rain chance, wind, surf/wave height, and water quality.

Suggested labels:

- `Great beach day`
- `Good`
- `Maybe`
- `Windy / cool / check conditions`
- `Not recommended`

### Kids / beginner surf rating

Use wave height and wind first, plus water quality.

Suggested labels:

- `Good beginner window`
- `Very small`
- `Maybe with close supervision`
- `Not beginner-friendly`
- `Not recommended`

### Adult surf rating

Do not imply that small surf is always bad. Use surf-style descriptions:

- `< 2 ft`: `Small / beginner-friendly`
- `2–4 ft`: `Fun / moderate`
- `4–6 ft`: `Bigger surf — experienced surfers`
- `> 6 ft`: `Large surf — experts only`

Also mention wind quality if available.

### Snorkel / dive rating

Be conservative. Wave height, wind, recent rain, and water quality matter.

Labels:

- `Good`
- `Maybe`
- `Poor`
- `Not recommended`

If visibility data is not available, explicitly say:

> Visibility is not directly measured here; using surf, wind, rain, and water-quality status as proxies.

### Kayak / SUP rating

Wind and gusts are most important. Waves matter more for exposed coast than inside Mission Bay. If selected zone is Mission Bay, allow slightly more favorable rating for paddling than exposed coastal locations, but still warn about wind/gusts.

Labels:

- `Good morning / calm window`
- `Good`
- `Maybe`
- `Windy / not ideal`
- `Not recommended`

## Data normalization requirements

Create a normalized data object after fetching all APIs:

```js
const condition = {
  place,
  date: "YYYY-MM-DD",
  tides: {
    hourly: [{ time, heightFt }],
    highsLows: [{ time, heightFt, type }],
    bestLow: { time, heightFt } || null
  },
  weather: {
    hourly: [{ time, tempF, rainChance, rainIn, windMph, gustMph, cloudCover, uvIndex }],
    daily: { sunrise, sunset, uvMax, rainChanceMax, tempMaxF, tempMinF }
  },
  marine: {
    hourly: [{ time, waveFt, wavePeriodSec, waveDirectionDeg, swellFt, swellPeriodSec, swellDirectionDeg, windWaveFt, seaTempF, currentVelocity, currentDirectionDeg }]
  },
  waterQuality: {
    status: "unknown" | "open" | "advisory" | "closure",
    label: "Check official source",
    url: "https://www.sdbeachinfo.com/"
  },
  ratings: {
    tidePools,
    beachDay,
    kidsSurf,
    adultSurf,
    snorkelDive,
    paddle
  },
  warnings: []
};
```

The UI should render from this normalized object.

## Daylight logic

Use Open-Meteo daily sunrise/sunset if available. A tide-pool low tide is family-friendly only if its time is after sunrise and before sunset. If sunrise/sunset data is missing, do not fail; just do not apply the daylight filter and show a warning.

## Message generator requirements

Keep the existing tide-pool group message, but update it to use the selected place/date and new condition data.

The generated homeschool tide-pool message should include:

- Best location.
- Best window around low tide.
- Low tide time and height.
- Brief conditions summary: waves, wind, rain chance.
- Water-quality reminder.
- Safety reminder for slippery rocks, waves, posted signs, and supervision.
- A gentle educational tone.

Example style:

```text
🌊 Tide-pool idea for this week: La Jolla Shores / Scripps area

Best window: Tuesday 2:30–4:30 PM, centered around a low tide near 3:30 PM.
The tide looks low enough for better exploring, and the forecast currently shows small/moderate surf and manageable wind.

Please check official San Diego County water-quality status before entering the water, and follow all posted signs/lifeguard guidance. Rocks can be slippery and waves can surprise kids, so close supervision is important.

Homeschool idea: bring a small notebook and sketch 3 things you observe, then leave everything where you found it. 🐚
```

Add one or both optional message generators if time allows:

1. Beach-day family message.
2. Beginner surf message.

## Error handling requirements

For each API call:

- Use `fetch` with `try/catch`.
- If one API fails, continue rendering the rest.
- Add a warning to `condition.warnings`.
- Show a friendly message in the UI.
- Keep the copy message from making unsupported claims when data is missing.

## Accessibility and usability requirements

- Keep the page mobile-friendly.
- Use semantic headings.
- Use buttons with clear labels.
- Ensure canvas charts have surrounding text summaries for accessibility.
- Do not rely only on chart color to communicate important information.
- Keep the family summary readable for nontechnical users.

## Suggested implementation steps

Follow this sequence:

1. Preserve the existing file and refactor the JavaScript into sections:
   - Constants.
   - State.
   - DOM references.
   - API fetchers.
   - Data normalization.
   - Activity scoring.
   - Rendering.
   - Message generation.
   - Event handlers.

2. Add Leaflet and Chart.js scripts/styles to `<head>` or before `</body>`.

3. Replace the current controls with date + saved-place controls.

4. Add the map container and initialize Leaflet:
   - Center roughly at `[32.80, -117.25]`.
   - Zoom around `11`.
   - Add markers for saved places.
   - Add map click handler.

5. Implement data fetchers:
   - `fetchTides(place, date)`.
   - `fetchWeather(place, date)`.
   - `fetchMarine(place, date)`.
   - `fetchWaterQuality(place)` placeholder.

6. Implement `buildCondition(place, date)` that calls all fetchers and returns the normalized object.

7. Implement scoring functions and attach results to the condition object.

8. Render activity cards.

9. Render charts with Chart.js.

10. Update the message generator.

11. Add source links and safety language.

12. Test on GitHub Pages or with a local static server.

## Testing checklist

The finished page must pass these checks:

- It loads on GitHub Pages without a build step.
- It works on mobile-width screens.
- Selecting each saved place updates the selected place and marker.
- Clicking the map creates a custom selected location.
- Selecting a different date refetches or rerenders the data.
- Tide chart renders when NOAA tide series data is available.
- High/low tide data still renders if the tide chart series fails.
- Wave/swell chart renders when Open-Meteo Marine data is available.
- Wind and rain charts render when Open-Meteo Weather data is available.
- Activity cards show clear labels and reasons.
- Water-quality card always links to the official San Diego County site.
- Copying the homeschool tide-pool message works.
- If an API fails, the page shows a warning instead of crashing.

## Definition of done

Deliver a modified `index.html` that implements the family ocean portal MVP:

- Map-based location selection using Leaflet/OpenStreetMap.
- Date-based data lookup.
- NOAA tide data.
- Open-Meteo weather data.
- Open-Meteo marine data.
- Chart.js visualizations.
- Family/homeschool activity scoring.
- Tide-pool group-message sub-feature.
- Official water-quality link and safety caveats.
- Static GitHub Pages compatibility.

Do not stop after writing a plan. Make the actual code changes in `index.html`.

## Official documentation links for the agent to verify while implementing

- NOAA CO-OPS Data API: https://api.tidesandcurrents.noaa.gov/api/prod/
- NOAA CO-OPS API URL Builder: https://tidesandcurrents.noaa.gov/api-helper/url-generator.html
- Open-Meteo Forecast API: https://open-meteo.com/en/docs
- Open-Meteo Marine API: https://open-meteo.com/en/docs/marine-weather-api
- Leaflet Quick Start: https://leafletjs.com/examples/quick-start/
- Chart.js documentation: https://www.chartjs.org/docs/latest/
- OpenStreetMap tile usage policy: https://operations.osmfoundation.org/policies/tiles/
- San Diego Beach & Bay Water Quality: https://www.sdbeachinfo.com/
- NWS API documentation, optional later enhancement: https://www.weather.gov/documentation/services-web-api
