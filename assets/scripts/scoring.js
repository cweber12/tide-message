// Condition normalization and activity scoring logic.
function findBestLow(highsLows, sunrise, sunset) {
      const lows = highsLows.filter((tide) => tide.type === "L");
      if (!lows.length) return null;
      const daylightLows = lows.filter((low) => isInDaylight(low.time, sunrise, sunset));
      const source = daylightLows.length ? daylightLows : lows;
      return source.reduce((best, current) => {
        if (!best || current.heightFt < best.heightFt) return current;
        return best;
      }, null);
    }

    function summarizeCoreMetrics(condition) {
      const weatherHourly = condition.weather.hourly;
      const marineHourly = condition.marine.hourly;

      const avgWind = average(weatherHourly.map((x) => x.windMph));
      const maxGust = maxValue(weatherHourly.map((x) => x.gustMph));
      const maxRainChance = maxValue(weatherHourly.map((x) => x.rainChance));
      const avgWave = average(marineHourly.map((x) => x.waveFt));
      const minTemp = minValue(weatherHourly.map((x) => x.tempF));
      const maxTemp = maxValue(weatherHourly.map((x) => x.tempF));

      return {
        avgWind,
        maxGust,
        maxRainChance,
        avgWave,
        minTemp,
        maxTemp
      };
    }

    function scoreTidePools(condition, metrics) {
      const bestLow = condition.tides.bestLow;
      const wave = metrics.avgWave;
      const wind = metrics.avgWind;
      const rain = metrics.maxRainChance;
      const hasDaylightData = Boolean(condition.weather.daily.sunrise && condition.weather.daily.sunset);
      const reasons = [];

      if (!bestLow) {
        return { label: "Limited confidence", reason: "Low tide data unavailable for this date." };
      }

      // Low tides are the primary positive signal for tide pooling.
      if (bestLow.heightFt <= THRESHOLDS.tidePools.excellentLowTideFt) {
        reasons.push("Very low tide");
      } else if (bestLow.heightFt <= THRESHOLDS.tidePools.goodLowTideFt) {
        reasons.push("Good low tide");
      } else if (bestLow.heightFt <= THRESHOLDS.tidePools.maybeLowTideFt) {
        reasons.push("Moderate low tide");
      } else {
        reasons.push("Low tide is relatively high");
      }

      let label = "Fair window";
      if (bestLow.heightFt <= THRESHOLDS.tidePools.excellentLowTideFt && wave != null && wave <= THRESHOLDS.tidePools.excellentWaveFt && wind != null && wind <= THRESHOLDS.tidePools.maxGoodWindMph && rain != null && rain <= THRESHOLDS.tidePools.maxGoodRainChance) {
        label = "Great window";
      } else if (bestLow.heightFt <= THRESHOLDS.tidePools.goodLowTideFt && wave != null && wave <= THRESHOLDS.tidePools.goodWaveFt && wind != null && wind <= THRESHOLDS.tidePools.maxGoodWindMph) {
        label = "Good window";
      } else if (bestLow.heightFt <= THRESHOLDS.tidePools.maybeLowTideFt && (wave == null || wave <= THRESHOLDS.tidePools.maybeWaveFt) && (wind == null || wind <= THRESHOLDS.tidePools.maxMaybeWindMph)) {
        label = "Usable window";
      }

      if (condition.waterQuality.status === "closure") {
        label = "Check official closure status";
        reasons.push("Official closure status must be checked");
      }

      if (!hasDaylightData) {
        reasons.push("Daylight filter unavailable");
      }

      if (condition.waterQuality.status === "unknown") {
        reasons.push("Water quality unknown");
      }

      return {
        label,
        reason: `${reasons.join(". ")}.`
      };
    }

    function scoreBeachDay(condition, metrics) {
      const tempMid = metrics.maxTemp != null && metrics.minTemp != null ? (metrics.maxTemp + metrics.minTemp) / 2 : metrics.maxTemp;
      const wind = metrics.avgWind;
      const rain = metrics.maxRainChance;
      const wave = metrics.avgWave;
      let label = "Mixed conditions";

      if (condition.waterQuality.status === "closure") {
        label = "Check official closure status";
      } else if (tempMid != null && tempMid >= 69 && (rain == null || rain <= 25) && (wind == null || wind <= 12) && (wave == null || wave <= 4)) {
        label = "Great beach day";
      } else if (tempMid != null && tempMid >= 64 && (rain == null || rain <= 40) && (wind == null || wind <= 15)) {
        label = "Good beach day";
      } else if ((wind != null && wind > 18) || (tempMid != null && tempMid < 60)) {
        label = "Cool or windy";
      }

      return {
        label,
        reason: `Air ${formatNumber(metrics.minTemp, 0)} to ${formatNumber(metrics.maxTemp, 0)} F, wind ${formatNumber(wind, 0)} mph, rain chance ${formatNumber(rain, 0)}%.`
      };
    }

    function scoreKidsSurf(condition, metrics) {
      const wave = metrics.avgWave;
      const wind = metrics.avgWind;
      let label = "Possible with close supervision";

      if (condition.waterQuality.status === "closure") {
        label = "Check official closure status";
      } else if (wave == null) {
        label = "Possible with close supervision";
      } else if (wave < THRESHOLDS.kidsSurf.minWaveFt) {
        label = "Very small waves";
      } else if (wave <= THRESHOLDS.kidsSurf.maxGoodWaveFt && (wind == null || wind <= THRESHOLDS.kidsSurf.maxGoodWindMph)) {
        label = "Good beginner window";
      } else if (wave <= THRESHOLDS.kidsSurf.maxMaybeWaveFt && (wind == null || wind <= THRESHOLDS.kidsSurf.maxMaybeWindMph)) {
        label = "Possible with close supervision";
      } else {
        label = "More advanced conditions";
      }

      return {
        label,
        reason: `Wave average ${formatNumber(wave)} ft and wind average ${formatNumber(wind, 0)} mph.`
      };
    }

    function scoreAdultSurf(metrics) {
      const wave = metrics.avgWave;
      const wind = metrics.avgWind;
      let label = "Small surf";
      if (wave == null) {
        label = "Conditions unclear";
      } else if (wave < 2) {
        label = "Small surf";
      } else if (wave < 4) {
        label = "Moderate surf";
      } else if (wave < 6) {
        label = "Bigger surf";
      } else {
        label = "Large surf";
      }
      return {
        label,
        reason: `Estimated wave average ${formatNumber(wave)} ft. Wind average ${formatNumber(wind, 0)} mph.`
      };
    }

    function scoreSnorkelDive(condition, metrics) {
      const wave = metrics.avgWave;
      const wind = metrics.avgWind;
      const rain = metrics.maxRainChance;
      let label = "Limited clarity";

      if (condition.waterQuality.status === "closure") {
        label = "Check official closure status";
      } else if (wave != null && wave <= THRESHOLDS.snorkelDive.maxGoodWaveFt && (wind == null || wind <= THRESHOLDS.snorkelDive.maxGoodWindMph) && (rain == null || rain <= 25)) {
        label = "Good window";
      } else if (wave != null && wave <= THRESHOLDS.snorkelDive.maxMaybeWaveFt && (wind == null || wind <= THRESHOLDS.snorkelDive.maxMaybeWindMph)) {
        label = "Possible window";
      } else if (wave != null && wave > THRESHOLDS.snorkelDive.maxMaybeWaveFt) {
        label = "Rougher conditions";
      }

      return {
        label,
        reason: `Visibility is not directly measured here; using surf, wind, rain, and water-quality status as proxies.`
      };
    }

    function scorePaddle(condition, metrics) {
      const wave = metrics.avgWave;
      const wind = metrics.avgWind;
      const gust = metrics.maxGust;
      const isMissionBay = condition.place.zone.toLowerCase().includes("mission bay");
      const waveAdjust = isMissionBay ? 0.7 : 0;

      let label = "Possible window";
      const goodWave = wave == null || wave <= THRESHOLDS.paddle.maxGoodWaveFt + waveAdjust;
      const maybeWind = wind == null || wind <= THRESHOLDS.paddle.maxMaybeWindMph;
      const maybeGust = gust == null || gust <= THRESHOLDS.paddle.maxMaybeGustMph;

      if (condition.waterQuality.status === "closure") {
        label = "Check official closure status";
      } else if (goodWave && (wind == null || wind <= THRESHOLDS.paddle.maxGoodWindMph) && (gust == null || gust <= THRESHOLDS.paddle.maxGoodGustMph)) {
        label = isMissionBay ? "Calm morning window" : "Good window";
      } else if (goodWave && maybeWind && maybeGust) {
        label = "Possible window";
      } else if ((wind != null && wind > THRESHOLDS.paddle.maxMaybeWindMph) || (gust != null && gust > THRESHOLDS.paddle.maxMaybeGustMph)) {
        label = "Windy";
      } else {
        label = "Limited window";
      }

      return {
        label,
        reason: `Wind avg ${formatNumber(wind, 0)} mph, gusts up to ${formatNumber(gust, 0)} mph, waves ${formatNumber(wave)} ft${isMissionBay ? " (Mission Bay adjusted)" : ""}.`
      };
    }

    function buildRatings(condition) {
      const metrics = summarizeCoreMetrics(condition);
      return {
        tidePools: scoreTidePools(condition, metrics),
        beachDay: scoreBeachDay(condition, metrics),
        kidsSurf: scoreKidsSurf(condition, metrics),
        adultSurf: scoreAdultSurf(metrics),
        snorkelDive: scoreSnorkelDive(condition, metrics),
        paddle: scorePaddle(condition, metrics)
      };
    }

    async function buildCondition(place, dateYmd) {
      const condition = {
        place,
        date: dateYmd,
        tides: {
          hourly: [],
          highsLows: [],
          bestLow: null,
          stationId: place.tideStation,
          stationFallbackUsed: false
        },
        weather: {
          hourly: [],
          daily: {
            sunrise: null,
            sunset: null,
            uvMax: null,
            rainChanceMax: null,
            tempMaxF: null,
            tempMinF: null
          }
        },
        marine: {
          hourly: []
        },
        waterQuality: {
          status: "unknown",
          label: "Check official source",
          url: WATER_QUALITY_URL
        },
        ratings: {
          tidePools: null,
          beachDay: null,
          kidsSurf: null,
          adultSurf: null,
          snorkelDive: null,
          paddle: null
        },
        warnings: []
      };

      const [tides, weather, marine, waterQuality] = await Promise.all([
        fetchTides(place, dateYmd, condition),
        fetchWeather(place, dateYmd, condition),
        fetchMarine(place, dateYmd, condition),
        fetchWaterQualityStatus(place)
      ]);

      condition.tides.hourly = tides.hourly;
      condition.tides.highsLows = tides.highsLows;
      condition.tides.stationId = tides.stationId;
      condition.tides.stationFallbackUsed = tides.stationFallbackUsed;

      condition.weather.hourly = weather.hourly;
      condition.weather.daily = {
        ...condition.weather.daily,
        ...weather.daily
      };

      condition.marine.hourly = marine.hourly;
      condition.waterQuality = waterQuality;

      condition.tides.bestLow = findBestLow(
        condition.tides.highsLows,
        condition.weather.daily.sunrise,
        condition.weather.daily.sunset
      );

      if (!condition.weather.daily.sunrise || !condition.weather.daily.sunset) {
        addWarning(condition, "Sunrise and sunset data missing. Daylight filter for tide-pool windows was not applied.");
      }

      if (!condition.weather.hourly.length) {
        addWarning(condition, "Hourly weather data is missing. Ratings are less certain.");
      }
      if (!condition.marine.hourly.length) {
        addWarning(condition, "Marine wave and swell data is missing. Surf and snorkel guidance is limited.");
      }
      if (!condition.tides.highsLows.length) {
        addWarning(condition, "Tide highs/lows are missing. Tide-pool timing guidance is limited.");
      }

      condition.ratings = buildRatings(condition);
      return condition;
    }
