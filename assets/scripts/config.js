// Constants and static configuration data for the planner.
const NOAA_URL = "https://api.tidesandcurrents.noaa.gov/api/prod/datagetter";
    const WEATHER_URL = "https://api.open-meteo.com/v1/forecast";
    const MARINE_URL = "https://marine-api.open-meteo.com/v1/marine";
    const OPENVERSE_URL = "https://api.openverse.org/v1/images/";
    const TZ = "America/Los_Angeles";

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

    const ACTIVITIES = [
      {
        slug: "tide-pools",
        navLabel: "Tide Pools",
        title: "Tide Pools / Homeschool",
        ratingKey: "tidePools",
        reportKeys: ["tide", "marine", "weather"],
        isHomeschool: true,
        intro: "Low tide timing matters most here. Use marine and weather detail to confirm whether that window is worth the trip."
      },
      {
        slug: "beach-day",
        navLabel: "Beach Day",
        title: "Family Beach Day",
        ratingKey: "beachDay",
        reportKeys: ["weather", "wind", "marine"],
        isHomeschool: false,
        intro: "Comfort, wind, and light surf conditions drive whether a family beach outing will feel easy or annoying."
      },
      {
        slug: "kids-surf",
        navLabel: "Kids Surf",
        title: "Kids / Beginner Surf",
        ratingKey: "kidsSurf",
        reportKeys: ["marine", "wind", "weather"],
        isHomeschool: false,
        intro: "For beginner surf, cleaner small waves and manageable wind matter more than broad all-day summaries."
      },
      {
        slug: "adult-surf",
        navLabel: "Adult Surf",
        title: "Adult Surf",
        ratingKey: "adultSurf",
        reportKeys: ["marine", "wind", "weather"],
        isHomeschool: false,
        intro: "This view emphasizes wave energy and wind so surf decisions are separated from family-oriented planning."
      },
      {
        slug: "snorkel-dive",
        navLabel: "Snorkel / Dive",
        title: "Snorkel / Dive",
        ratingKey: "snorkelDive",
        reportKeys: ["marine", "tide", "wind", "waterTemp"],
        isHomeschool: true,
        intro: "Snorkel and dive windows depend on calm marine conditions first, with tide, wind, and water temperature used as supporting context."
      },
      {
        slug: "paddle",
        navLabel: "Kayak / SUP",
        title: "Kayak / SUP",
        ratingKey: "paddle",
        reportKeys: ["wind", "marine", "weather"],
        isHomeschool: false,
        intro: "This view focuses on wind, gusts, and surface conditions so paddling decisions are easier to trust."
      }
    ];

    const DEFAULT_LOCATION_ID = "la-jolla";

    const WATER_QUALITY_URL = "https://www.sdbeachinfo.com/";
