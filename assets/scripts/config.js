// Constants and static configuration data for the planner.
const NOAA_URL = "https://api.tidesandcurrents.noaa.gov/api/prod/datagetter";
    const WEATHER_URL = "https://api.open-meteo.com/v1/forecast";
    const MARINE_URL = "https://marine-api.open-meteo.com/v1/marine";
    const OPENVERSE_URL = "https://api.openverse.org/v1/images/";
    const INATURALIST_URL = "https://api.inaturalist.org/v1/observations";
    const TZ = "America/Los_Angeles";

    // Marine Life view config. Geographic radius (km) around the selected place
    // for sightings, and the recent-window options shown in the segmented
    // control. Sightings are historical/recent, so there is no forecast day.
    const MARINE_RADIUS_KM = 20;
    const MARINE_PER_PAGE = 200;
    const MARINE_WINDOWS = [
      { days: 30, label: "30 days" },
      { days: 90, label: "90 days" },
      { days: 365, label: "1 year" }
    ];

    // iNaturalist iconic/high-level taxon IDs used to bias results toward marine
    // and intertidal life. These are tunable: widen or trim as San Diego results
    // suggest. (Ray-finned fishes, sharks/rays, molluscs, cnidarians, echinoderms,
    // malacostracans/crabs, cetaceans, pinnipeds, sea turtles.)
    const MARINE_TAXON_IDS = [47178, 47273, 47115, 47534, 47549, 85493, 152871, 152870, 39532];

    const TIDE_STATIONS = {
      sanDiego: { id: "9410170", name: "San Diego, CA", lat: 32.7157, lon: -117.1611 },
      laJolla: { id: "9410230", name: "La Jolla, CA", lat: 32.8328, lon: -117.2713 },
      missionBay: { id: "TWC0413", name: "Quivira Basin, Mission Bay", lat: 32.7607, lon: -117.2359 }
    };

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

    const LOCATIONS = [
      {
        id: "la-jolla",
        label: "La Jolla",
        placeIds: ["la-jolla-shores", "la-jolla-cove", "scripps-pier"]
      },
      {
        id: "mission-bay",
        label: "Mission Bay",
        placeIds: ["mission-bay-quivira", "mission-beach"]
      },
      {
        id: "san-diego-coast",
        label: "San Diego Coast",
        placeIds: ["ocean-beach", "point-loma-cabrillo"]
      }
    ];

    // Each activity declares a single featured report (rendered full-width) and a
    // grid of supporting reports, plus the stat keys shown in the photo overlay.
    // `ratingReads` lets one view surface multiple scores (Surf = beginner + energy).
    const ACTIVITIES = [
      {
        slug: "tide-pools",
        navLabel: "Tide Pools",
        title: "Tide Pools",
        ratingKey: "tidePools",
        featuredKey: "tide",
        reportKeys: ["marine", "weather"],
        statKeys: ["lowTide", "wave", "wind", "rain"],
        isHomeschool: true,
        intro: "Low tide timing is the make-or-break signal. Marine and weather confirm whether the window is worth the trip."
      },
      {
        slug: "beach-day",
        navLabel: "Beach Day",
        title: "Beach Day",
        ratingKey: "beachDay",
        featuredKey: "weather",
        reportKeys: ["wind", "marine"],
        statKeys: ["temp", "wind", "rain", "wave"],
        isHomeschool: false,
        intro: "Comfort, wind, and light surf decide whether a family beach outing feels easy or annoying."
      },
      {
        slug: "surf",
        navLabel: "Surf",
        title: "Surf",
        ratingReads: [
          { key: "kidsSurf", label: "Beginner" },
          { key: "adultSurf", label: "Energy" }
        ],
        featuredKey: "marine",
        reportKeys: ["wind", "weather"],
        statKeys: ["wave", "swell", "wind", "rain"],
        isHomeschool: false,
        intro: "Wave energy and wind drive the call. Read two ways: a beginner-friendly window and an overall energy read."
      },
      {
        slug: "dive",
        navLabel: "Dive",
        title: "Dive",
        ratingKey: "snorkelDive",
        featuredKey: "marine",
        reportKeys: ["tide", "wind", "waterTemp"],
        statKeys: ["wave", "wind", "waterTemp", "lowTide"],
        isHomeschool: true,
        intro: "Calm marine conditions come first; tide, wind, and water temperature add supporting context."
      },
      {
        slug: "paddle",
        navLabel: "Paddle",
        title: "Paddle",
        ratingKey: "paddle",
        featuredKey: "wind",
        reportKeys: ["marine", "weather"],
        statKeys: ["wind", "wave", "rain", "lowTide"],
        isHomeschool: false,
        intro: "Wind and gusts decide go/no-go; surface conditions and weather refine the timing."
      }
    ];

    // Stats shown in the photo overlay on the Overview (non-activity) view.
    const OVERVIEW_STATS = ["lowTide", "wave", "wind", "rain"];

    // Local photography for the context panel, keyed by place id. When a place
    // has an entry here it is used directly instead of the Openverse lookup.
    const PLACE_IMAGES = {
      "la-jolla-shores": "./assets/la_jolla_shores.jpg",
      "la-jolla-cove": "./assets/la_jolla_cove.jpg",
      "scripps-pier": "./assets/scripps_pier.jpg"
    };

    const DEFAULT_LOCATION_ID = "la-jolla";

    const WATER_QUALITY_URL = "https://www.sdbeachinfo.com/";
