// External API fetchers and forecast availability loaders.
async function fetchJson(url) {
      const timeoutMs = 12000;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
      } catch (error) {
        if (error && error.name === "AbortError") {
          throw new Error(`Request timeout after ${timeoutMs / 1000}s`);
        }
        throw error;
      } finally {
        clearTimeout(timeoutId);
      }
    }

    async function fetchTideSeries(stationId, beginNoDash, endNoDash) {
      const params = new URLSearchParams({
        product: "predictions",
        application: "sd-family-ocean-portal",
        begin_date: beginNoDash,
        end_date: endNoDash,
        datum: "MLLW",
        time_zone: "lst_ldt",
        units: "english",
        format: "json",
        station: stationId,
        interval: "h"
      });
      const json = await fetchJson(`${NOAA_URL}?${params.toString()}`);
      if (json.error) throw new Error(json.error.message || "NOAA tide series error");
      const items = Array.isArray(json.predictions) ? json.predictions : [];
      return items.map((row) => ({
        time: parseNoaaLocalTime(row.t),
        heightFt: Number(row.v)
      }));
    }

    async function fetchTideHighLow(stationId, beginNoDash, endNoDash) {
      const params = new URLSearchParams({
        product: "predictions",
        application: "sd-family-ocean-portal",
        begin_date: beginNoDash,
        end_date: endNoDash,
        datum: "MLLW",
        time_zone: "lst_ldt",
        units: "english",
        format: "json",
        station: stationId,
        interval: "hilo"
      });
      const json = await fetchJson(`${NOAA_URL}?${params.toString()}`);
      if (json.error) throw new Error(json.error.message || "NOAA high/low error");
      const items = Array.isArray(json.predictions) ? json.predictions : [];
      return items.map((row) => ({
        time: parseNoaaLocalTime(row.t),
        heightFt: Number(row.v),
        type: row.type === "H" ? "H" : "L"
      }));
    }

    async function fetchTides(place, dateYmd, condition) {
      const baseDate = fromYmd(dateYmd);
      const beginNoDash = toYmdNoDash(baseDate);
      const endNoDash = beginNoDash;

      let stationId = place.tideStation;
      let stationFallbackUsed = false;

      try {
        let hourly = [];
        let highsLows = [];
        try {
          hourly = await fetchTideSeries(stationId, beginNoDash, endNoDash);
        } catch (seriesError) {
          addWarning(condition, `Tide height series unavailable for ${place.name}. Falling back to high/low tide list only.`);
        }

        highsLows = await fetchTideHighLow(stationId, beginNoDash, endNoDash);

        if (!hourly.length && highsLows.length) {
          hourly = highsLows.map((row) => ({ time: row.time, heightFt: row.heightFt }));
        }

        return { hourly, highsLows, stationId, stationFallbackUsed };
      } catch (error) {
        if (place.tideStation === "TWC0413") {
          stationId = "9410170";
          stationFallbackUsed = true;
          addWarning(condition, "Mission Bay tide station was unavailable. Using nearest NOAA fallback station San Diego 9410170.");
          try {
            let hourly = [];
            let highsLows = [];
            try {
              hourly = await fetchTideSeries(stationId, beginNoDash, endNoDash);
            } catch (seriesError) {
              addWarning(condition, "Tide series unavailable on fallback station. Using high/low list.");
            }
            highsLows = await fetchTideHighLow(stationId, beginNoDash, endNoDash);
            if (!hourly.length && highsLows.length) {
              hourly = highsLows.map((row) => ({ time: row.time, heightFt: row.heightFt }));
            }
            return { hourly, highsLows, stationId, stationFallbackUsed };
          } catch (fallbackError) {
            addWarning(condition, `NOAA tide request failed for fallback station: ${fallbackError.message}`);
          }
        } else {
          addWarning(condition, `NOAA tide request failed: ${error.message}`);
        }
      }

      return { hourly: [], highsLows: [], stationId, stationFallbackUsed };
    }

    async function fetchWeather(place, dateYmd, condition) {
      const params = new URLSearchParams({
        latitude: String(place.lat),
        longitude: String(place.lon),
        timezone: TZ,
        temperature_unit: "fahrenheit",
        wind_speed_unit: "mph",
        precipitation_unit: "inch",
        hourly: "temperature_2m,precipitation_probability,precipitation,wind_speed_10m,wind_gusts_10m,cloud_cover,uv_index",
        daily: "sunrise,sunset,uv_index_max,precipitation_probability_max,temperature_2m_max,temperature_2m_min",
        start_date: dateYmd,
        end_date: dateYmd
      });

      try {
        const data = await fetchJson(`${WEATHER_URL}?${params.toString()}`);
        const hourly = [];
        if (data.hourly && Array.isArray(data.hourly.time)) {
          for (let i = 0; i < data.hourly.time.length; i += 1) {
            hourly.push({
              time: parseApiTime(data.hourly.time[i]),
              tempF: data.hourly.temperature_2m ? data.hourly.temperature_2m[i] : null,
              rainChance: data.hourly.precipitation_probability ? data.hourly.precipitation_probability[i] : null,
              rainIn: data.hourly.precipitation ? data.hourly.precipitation[i] : null,
              windMph: data.hourly.wind_speed_10m ? data.hourly.wind_speed_10m[i] : null,
              gustMph: data.hourly.wind_gusts_10m ? data.hourly.wind_gusts_10m[i] : null,
              cloudCover: data.hourly.cloud_cover ? data.hourly.cloud_cover[i] : null,
              uvIndex: data.hourly.uv_index ? data.hourly.uv_index[i] : null
            });
          }
        }

        const daily = {
          sunrise: data.daily && data.daily.sunrise ? parseApiTime(data.daily.sunrise[0]) : null,
          sunset: data.daily && data.daily.sunset ? parseApiTime(data.daily.sunset[0]) : null,
          uvMax: data.daily && data.daily.uv_index_max ? data.daily.uv_index_max[0] : null,
          rainChanceMax: data.daily && data.daily.precipitation_probability_max ? data.daily.precipitation_probability_max[0] : null,
          tempMaxF: data.daily && data.daily.temperature_2m_max ? data.daily.temperature_2m_max[0] : null,
          tempMinF: data.daily && data.daily.temperature_2m_min ? data.daily.temperature_2m_min[0] : null
        };

        return { hourly, daily };
      } catch (error) {
        addWarning(condition, `Weather forecast request failed: ${error.message}`);
        return { hourly: [], daily: {} };
      }
    }

    async function fetchMarine(place, dateYmd, condition) {
      const params = new URLSearchParams({
        latitude: String(place.lat),
        longitude: String(place.lon),
        timezone: TZ,
        hourly: "wave_height,wave_direction,wave_period,swell_wave_height,swell_wave_direction,swell_wave_period,wind_wave_height,sea_surface_temperature,ocean_current_velocity,ocean_current_direction",
        start_date: dateYmd,
        end_date: dateYmd
      });

      try {
        const data = await fetchJson(`${MARINE_URL}?${params.toString()}`);
        const hourly = [];
        if (data.hourly && Array.isArray(data.hourly.time)) {
          for (let i = 0; i < data.hourly.time.length; i += 1) {
            const waveHeightRaw = data.hourly.wave_height ? data.hourly.wave_height[i] : null;
            const swellHeightRaw = data.hourly.swell_wave_height ? data.hourly.swell_wave_height[i] : null;
            const windWaveRaw = data.hourly.wind_wave_height ? data.hourly.wind_wave_height[i] : null;
            const seaTempRaw = data.hourly.sea_surface_temperature ? data.hourly.sea_surface_temperature[i] : null;

            hourly.push({
              time: parseApiTime(data.hourly.time[i]),
              waveFt: metersToFeet(waveHeightRaw),
              wavePeriodSec: data.hourly.wave_period ? data.hourly.wave_period[i] : null,
              waveDirectionDeg: data.hourly.wave_direction ? data.hourly.wave_direction[i] : null,
              swellFt: metersToFeet(swellHeightRaw),
              swellPeriodSec: data.hourly.swell_wave_period ? data.hourly.swell_wave_period[i] : null,
              swellDirectionDeg: data.hourly.swell_wave_direction ? data.hourly.swell_wave_direction[i] : null,
              windWaveFt: metersToFeet(windWaveRaw),
              seaTempF: cToF(seaTempRaw),
              currentVelocity: data.hourly.ocean_current_velocity ? data.hourly.ocean_current_velocity[i] : null,
              currentDirectionDeg: data.hourly.ocean_current_direction ? data.hourly.ocean_current_direction[i] : null
            });
          }
        }
        return { hourly };
      } catch (error) {
        addWarning(condition, `Marine forecast request failed: ${error.message}`);
        return { hourly: [] };
      }
    }

    // Open-license location photography for the context panel background.
    // Openverse needs no API key and serves CORS-enabled JSON; results are
    // cached per query so switching places does not re-hit the network.
    const backgroundImageCache = new Map();

    async function fetchBackgroundImage(query) {
      if (backgroundImageCache.has(query)) {
        return backgroundImageCache.get(query);
      }

      const params = new URLSearchParams({
        q: query,
        aspect_ratio: "wide",
        size: "large",
        mature: "false",
        page_size: "12"
      });

      let image = null;
      try {
        const data = await fetchJson(`${OPENVERSE_URL}?${params.toString()}`);
        const results = Array.isArray(data.results) ? data.results : [];
        const pick = results.find((row) => row && (row.thumbnail || row.url));
        if (pick) {
          image = {
            // Prefer Openverse's proxied thumbnail: it always loads
            // cross-origin, whereas some source `url`s block hotlinking.
            url: pick.thumbnail || pick.url,
            title: pick.title || "",
            creator: pick.creator || "",
            source: pick.foreign_landing_url || pick.url,
            license: [pick.license, pick.license_version].filter(Boolean).join(" ").toUpperCase()
          };
        }
      } catch (error) {
        image = null;
      }

      backgroundImageCache.set(query, image);
      return image;
    }

    async function fetchWaterQualityStatus() {
      return {
        status: "unknown",
        label: "Check official source",
        url: WATER_QUALITY_URL
      };
    }

    async function fetchAvailableDatesForPlace(place) {
      const today = dateInputValue();
      const end = toYmd(addDays(fromYmd(today), 15));
      const dateSet = new Set([today]);
      let weatherEnd = null;
      let marineEnd = null;

      const weatherParams = new URLSearchParams({
        latitude: String(place.lat),
        longitude: String(place.lon),
        timezone: TZ,
        daily: "sunrise",
        start_date: today,
        end_date: end
      });

      const marineParams = new URLSearchParams({
        latitude: String(place.lat),
        longitude: String(place.lon),
        timezone: TZ,
        hourly: "wave_height",
        start_date: today,
        end_date: end
      });

      const [weatherResult, marineResult] = await Promise.allSettled([
        fetchJson(`${WEATHER_URL}?${weatherParams.toString()}`),
        fetchJson(`${MARINE_URL}?${marineParams.toString()}`)
      ]);

      if (weatherResult.status === "fulfilled") {
        const times = weatherResult.value?.daily?.time || [];
        times.forEach((date) => dateSet.add(date));
        weatherEnd = times[times.length - 1] || null;
      }

      if (marineResult.status === "fulfilled") {
        const times = marineResult.value?.hourly?.time || [];
        times.forEach((time) => dateSet.add(String(time).slice(0, 10)));
        const marineDates = Array.from(new Set(times.map((time) => String(time).slice(0, 10))));
        marineEnd = marineDates[marineDates.length - 1] || null;
      }

      const dates = Array.from(dateSet).sort();
      return {
        dates,
        weatherEnd,
        marineEnd
      };
    }
