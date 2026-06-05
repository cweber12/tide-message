// Rendering and view composition.
function setStatus(message) {
      el.statusText.textContent = message;
    }

    function labelScore(label) {
      const value = String(label || "").toLowerCase();
      if (value.includes("good") || value.includes("great") || value.includes("ideal") || value.includes("calm")) return 3;
      if (value.includes("fair") || value.includes("possible") || value.includes("mixed") || value.includes("small surf") || value.includes("usable") || value.includes("moderate")) return 2;
      return 1;
    }

    function findMaxItem(items, accessor) {
      let best = null;
      items.forEach((item) => {
        const value = accessor(item);
        if (value == null || Number.isNaN(value)) return;
        if (!best || value > best.value) {
          best = { item, value };
        }
      });
      return best ? best.item : null;
    }

    function findMinItem(items, accessor) {
      let best = null;
      items.forEach((item) => {
        const value = accessor(item);
        if (value == null || Number.isNaN(value)) return;
        if (!best || value < best.value) {
          best = { item, value };
        }
      });
      return best ? best.item : null;
    }

    function renderLocationSelect() {
      el.zoneSelect.innerHTML = LOCATIONS.map((location) => `<option value="${location.id}">${location.label}</option>`).join("");
      el.zoneSelect.value = state.selectedLocationId;
    }

    function renderPlaceSelect() {
      const options = getPlacesForLocation(state.selectedLocationId).slice();
      if (state.selectedPlace && state.selectedPlace.id === "custom") {
        options.push(state.selectedPlace);
      }

      el.placeSelect.innerHTML = options.map((place) => `<option value="${place.id}">${place.name}</option>`).join("");
      el.placeSelect.value = state.selectedPlace.id;
    }

    function renderActivityNav() {
      el.activityNavLinks.innerHTML = ACTIVITIES.map((activity) => `
        <a class="nav-link" href="#/activity/${activity.slug}" data-activity-link="${activity.slug}">${activity.navLabel}</a>
      `).join("");

      const isOverview = state.currentView === "overview";
      if (el.overviewNavLink) {
        if (isOverview) {
          el.overviewNavLink.setAttribute("aria-current", "page");
        } else {
          el.overviewNavLink.removeAttribute("aria-current");
        }
      }

      if (el.marineLifeNavLink) {
        if (state.currentView === "marine-life") {
          el.marineLifeNavLink.setAttribute("aria-current", "page");
        } else {
          el.marineLifeNavLink.removeAttribute("aria-current");
        }
      }

      el.activityNavLinks.querySelectorAll("[data-activity-link]").forEach((link) => {
        const slug = link.getAttribute("data-activity-link");
        const active = state.currentView === "activity" && state.selectedActivity && state.selectedActivity.slug === slug;
        if (active) {
          link.setAttribute("aria-current", "page");
        } else {
          link.removeAttribute("aria-current");
        }
      });
    }

    function resolveAvailableDate(targetDate) {
      const target = typeof targetDate === "string" ? targetDate : toYmd(targetDate);
      if (state.availableDates.includes(target)) return target;
      return state.availableDates.find((date) => date >= target) || state.availableDates[state.availableDates.length - 1] || target;
    }

    function renderDateOptions() {
      const fallbackDate = state.selectedDate || dateInputValue();
      const options = state.availableDates.length ? state.availableDates : [fallbackDate];
      el.dateInput.innerHTML = options.map((date) => `<option value="${date}">${formatDate(fromYmd(date))}</option>`).join("");
      state.selectedDate = resolveAvailableDate(fallbackDate);
      el.dateInput.value = state.selectedDate;
    }

    function ratingClass(label) {
      const score = labelScore(label);
      return score === 3 ? "good" : score === 2 ? "maybe" : "bad";
    }

    // Resolve a single overlay stat (label/value/note) by key for the active view.
    function statByKey(condition, key) {
      const metrics = summarizeCoreMetrics(condition);
      const marineHourly = condition.marine.hourly;
      switch (key) {
        case "lowTide": {
          const low = condition.tides.bestLow;
          return low
            ? { label: "Best low", value: formatTime(low.time), note: `${formatNumber(low.heightFt)} ft` }
            : { label: "Best low", value: "n/a", note: "" };
        }
        case "wave":
          return { label: "Avg wave", value: `${formatNumber(metrics.avgWave)} ft`, note: "" };
        case "swell": {
          const swell = average(marineHourly.map((row) => row.swellFt));
          const period = average(marineHourly.map((row) => row.swellPeriodSec));
          return { label: "Swell", value: `${formatNumber(swell)} ft`, note: `${formatNumber(period, 0)} s` };
        }
        case "wind":
          return { label: "Avg wind", value: `${formatNumber(metrics.avgWind, 0)} mph`, note: `gust ${formatNumber(metrics.maxGust, 0)}` };
        case "rain":
          return { label: "Max rain", value: `${formatNumber(metrics.maxRainChance, 0)}%`, note: "" };
        case "temp":
          return { label: "Air temp", value: `${formatNumber(metrics.minTemp, 0)}-${formatNumber(metrics.maxTemp, 0)} F`, note: "" };
        case "waterTemp": {
          const seaTemps = marineHourly.map((row) => row.seaTempF).filter((value) => value != null);
          return { label: "Water", value: `${formatNumber(average(seaTemps), 1)} F`, note: "" };
        }
        default:
          return null;
      }
    }

    function renderContextHeader(condition) {
      const location = getLocationById(state.selectedLocationId);
      if (state.currentView === "marine-life") {
        const place = (condition && condition.place) || state.selectedPlace;
        el.viewEyebrow.textContent = "Marine Life";
        el.viewTitle.textContent = `${place ? place.name : "San Diego"} · recent sightings`;
        return;
      }
      if (state.currentView === "overview" || !state.selectedActivity) {
        el.viewEyebrow.textContent = "Overview";
        el.viewTitle.textContent = `${location ? location.label : condition.place.zone} · ${formatDate(fromYmd(condition.date))}`;
      } else {
        el.viewEyebrow.textContent = state.selectedActivity.navLabel;
        el.viewTitle.textContent = `${state.selectedActivity.title} · ${condition.place.name}`;
      }
    }

    function renderContextStats(condition) {
      const keys = state.currentView === "activity" && state.selectedActivity
        ? state.selectedActivity.statKeys
        : OVERVIEW_STATS;
      el.contextStats.innerHTML = keys
        .map((key) => statByKey(condition, key))
        .filter(Boolean)
        .map((stat) => `
          <div class="context-stat">
            <span class="context-stat-label">${stat.label}</span>
            <span class="context-stat-value">${stat.value}${stat.note ? ` <small>${stat.note}</small>` : ""}</span>
          </div>
        `).join("");
    }

    // Flatten an activity to its rating reads. Most activities have one read;
    // Surf surfaces two (beginner + energy) from separate scorers.
    function getActivityReads(condition, activity) {
      if (activity.ratingReads) {
        return activity.ratingReads.map((read) => ({
          name: `${activity.navLabel} · ${read.label}`,
          shortName: read.label,
          slug: activity.slug,
          rating: condition.ratings[read.key]
        }));
      }
      return [{
        name: activity.navLabel,
        shortName: activity.navLabel,
        slug: activity.slug,
        rating: condition.ratings[activity.ratingKey]
      }];
    }

    function renderRatingsBar(condition) {
      const activities = state.currentView === "activity" && state.selectedActivity
        ? [state.selectedActivity]
        : ACTIVITIES;
      const reads = activities.flatMap((activity) => getActivityReads(condition, activity));
      el.activityRatings.innerHTML = reads.map((read) => `
        <a class="rating-chip" href="#/activity/${read.slug}">
          <span class="rating-chip-name">${read.name}</span>
          <span class="rating-chip-value is-${ratingClass(read.rating.label)}" title="${read.rating.reason}">${read.rating.label}</span>
        </a>
      `).join("");
    }

    function renderWarnings(condition) {
      const warnings = (condition.warnings || []).filter(Boolean);
      if (!warnings.length) {
        el.warningBand.hidden = true;
        el.warningBand.innerHTML = "";
        return;
      }
      el.warningBand.hidden = false;
      el.warningBand.innerHTML = `
        <p class="warning-band-title">Check before you go</p>
        <ul class="warning-band-list">${warnings.map((warning) => `<li>${warning}</li>`).join("")}</ul>
      `;
    }

    function contextImageQuery(condition) {
      const location = getLocationById(state.selectedLocationId);
      const place = condition.place;
      const subject = (place && place.id !== "custom" && place.name)
        || (location && location.label)
        || (place && place.zone)
        || "San Diego";
      return `${subject} San Diego California ocean coast`;
    }

    async function updateContextBackground(condition) {
      // Prefer a bundled local photo for the selected place; only fall back to
      // the Openverse lookup when there is no local image for this place.
      const localImage = condition.place && PLACE_IMAGES[condition.place.id];
      if (localImage) {
        el.contextMedia.classList.remove("is-loading");
        el.contextMedia.style.backgroundImage = `url("${localImage}")`;
        el.contextMedia.classList.add("has-image");
        el.contextCredit.textContent = "";
        return;
      }

      const query = contextImageQuery(condition);
      el.contextMedia.classList.add("is-loading");
      const image = await fetchBackgroundImage(query);

      // Guard against a stale response landing after the user switched places.
      if (!state.condition || contextImageQuery(state.condition) !== query) return;

      el.contextMedia.classList.remove("is-loading");
      if (image && image.url) {
        el.contextMedia.style.backgroundImage = `url("${image.url}")`;
        el.contextMedia.classList.add("has-image");
        const credit = [image.creator && `Photo: ${image.creator}`, image.license, "Openverse"]
          .filter(Boolean)
          .join(" · ");
        el.contextCredit.textContent = credit;
        if (image.source) {
          el.contextCredit.title = image.title || credit;
        }
      } else {
        el.contextMedia.style.backgroundImage = "";
        el.contextMedia.classList.remove("has-image");
        el.contextCredit.textContent = "";
      }
    }

    function buildHourlyList(items, renderLine) {
      if (!items.length) return "";
      const list = items.slice(0, 24).map((item) => `<li>${renderLine(item)}</li>`).join("");
      return `
        <details class="inline-details">
          <summary>View hourly detail</summary>
          <ul class="hourly-list">${list}</ul>
        </details>
      `;
    }

    function tideWindowAround(time) {
      if (!time) return "No reliable low tide window available";
      const start = new Date(time.getTime() - (60 * 60 * 1000));
      const end = new Date(time.getTime() + (60 * 60 * 1000));
      return `${formatTime(start)}-${formatTime(end)}`;
    }

    function buildReportCatalog(condition) {
      const metrics = summarizeCoreMetrics(condition);
      const weatherHourly = condition.weather.hourly;
      const marineHourly = condition.marine.hourly;
      const lows = condition.tides.highsLows.filter((x) => x.type === "L");
      const highs = condition.tides.highsLows.filter((x) => x.type === "H");
      const peakWind = findMaxItem(weatherHourly, (row) => row.gustMph ?? row.windMph);
      const calmestWind = findMinItem(weatherHourly, (row) => row.windMph);
      const peakWave = findMaxItem(marineHourly, (row) => row.waveFt);
      const seaTemps = marineHourly.map((row) => row.seaTempF).filter((value) => value != null);

      return {
        tide: {
          key: "tide",
          chartKey: "tide",
          title: "Tide Window",
          kicker: "Timing first",
          recommendation: `Recommendation: ${condition.ratings.tidePools.label}. Center shoreline plans around ${tideWindowAround(condition.tides.bestLow ? condition.tides.bestLow.time : null)}.`,
          pills: [
            `Best low ${condition.tides.bestLow ? `${formatTime(condition.tides.bestLow.time)} / ${formatNumber(condition.tides.bestLow.heightFt)} ft` : "n/a"}`,
            `Station ${condition.tides.stationId}${condition.tides.stationFallbackUsed ? " fallback" : ""}`,
            `${lows.length} lows logged`
          ],
          details: [
            `Lowest tide is ${condition.tides.bestLow ? `${formatTime(condition.tides.bestLow.time)} at ${formatNumber(condition.tides.bestLow.heightFt)} ft` : "not available"}.`,
            `Highs: ${highs.map((entry) => `${formatTime(entry.time)} (${formatNumber(entry.heightFt)} ft)`).join("; ") || "n/a"}.`,
            `Lows: ${lows.map((entry) => `${formatTime(entry.time)} (${formatNumber(entry.heightFt)} ft)`).join("; ") || "n/a"}.`
          ],
          availabilityNote: condition.tides.hourly.length ? "" : "Hourly tide curve unavailable for this date. High/low tide timing is still shown where NOAA returned it.",
          hasChartData: condition.tides.hourly.length > 0,
          emptyText: "Hourly tide chart unavailable for this date.",
          hourlyHtml: buildHourlyList(condition.tides.hourly, (row) => `${formatTime(row.time)} - ${formatNumber(row.heightFt)} ft`)
        },
        marine: {
          key: "marine",
          chartKey: "wave",
          title: "Wave And Swell",
          kicker: "Surface conditions",
          recommendation: `Recommendation: ${condition.ratings.snorkelDive.label} for low-clarity activities, ${condition.ratings.adultSurf.label.toLowerCase()} for surf energy.`,
          pills: [
            `Wave avg ${formatNumber(metrics.avgWave)} ft`,
            `Swell ${formatNumber(average(marineHourly.map((row) => row.swellFt)))} ft`,
            `Period ${formatNumber(average(marineHourly.map((row) => row.swellPeriodSec)), 0)} s`
          ],
          details: [
            `Peak wave window: ${peakWave ? `${formatTime(peakWave.time)} near ${formatNumber(peakWave.waveFt)} ft` : "n/a"}.`,
            `Average swell height is ${formatNumber(average(marineHourly.map((row) => row.swellFt)))} ft with period ${formatNumber(average(marineHourly.map((row) => row.swellPeriodSec)), 0)} seconds.`,
            `Sea surface temperature averages ${formatNumber(average(seaTemps), 1)} F when reported.`
          ],
          availabilityNote: marineHourly.length ? "" : "Marine forecast data was not returned for this day. Longer tide coverage can extend beyond marine forecast range.",
          hasChartData: marineHourly.length > 0,
          emptyText: "Wave and swell chart unavailable for this date.",
          hourlyHtml: buildHourlyList(marineHourly, (row) => `${formatTime(row.time)} - wave ${formatNumber(row.waveFt)} ft, swell ${formatNumber(row.swellFt)} ft, period ${formatNumber(row.swellPeriodSec, 0)} s`)
        },
        wind: {
          key: "wind",
          chartKey: "wind",
          title: "Wind",
          kicker: "Exposure and chop",
          recommendation: `Recommendation: ${condition.ratings.paddle.label}. Wind should be treated as a go/no-go lever for paddle and beginner outings.`,
          pills: [
            `Avg ${formatNumber(metrics.avgWind, 0)} mph`,
            `Gusts ${formatNumber(metrics.maxGust, 0)} mph`,
            `Calmest ${calmestWind ? formatTime(calmestWind.time) : "n/a"}`
          ],
          details: [
            `Strongest gusts appear near ${peakWind ? `${formatTime(peakWind.time)} at ${formatNumber(peakWind.gustMph ?? peakWind.windMph, 0)} mph` : "n/a"}.`,
            `Calmest wind window is around ${calmestWind ? `${formatTime(calmestWind.time)} at ${formatNumber(calmestWind.windMph, 0)} mph` : "n/a"}.`,
            `Use the calmer part of the day for paddle, beach comfort, and younger participants.`
          ],
          availabilityNote: weatherHourly.length ? "" : "Wind forecast data was not returned for this day.",
          hasChartData: weatherHourly.length > 0,
          emptyText: "Wind chart unavailable for this date.",
          hourlyHtml: buildHourlyList(weatherHourly, (row) => `${formatTime(row.time)} - wind ${formatNumber(row.windMph, 0)} mph, gusts ${formatNumber(row.gustMph, 0)} mph`)
        },
        weather: {
          key: "weather",
          chartKey: "weather",
          title: "Rain And Temperature",
          kicker: "Comfort and coverage",
          recommendation: `Recommendation: ${condition.ratings.beachDay.label}. Use this module to narrow comfort, timing, and weather-confidence questions.`,
          pills: [
            `${formatNumber(metrics.minTemp, 0)}-${formatNumber(metrics.maxTemp, 0)} F`,
            `Rain max ${formatNumber(metrics.maxRainChance, 0)}%`,
            `UV max ${formatNumber(condition.weather.daily.uvMax, 0)}`
          ],
          details: [
            `Temperature runs from ${formatNumber(metrics.minTemp, 0)} to ${formatNumber(metrics.maxTemp, 0)} F.`,
            `Maximum rain chance is ${formatNumber(metrics.maxRainChance, 0)}%.`,
            `Sunrise ${formatTime(condition.weather.daily.sunrise)} and sunset ${formatTime(condition.weather.daily.sunset)} define the daylight planning window.`
          ],
          availabilityNote: weatherHourly.length ? "" : "Weather forecast data was not returned for this day.",
          hasChartData: weatherHourly.length > 0,
          emptyText: "Weather chart unavailable for this date.",
          hourlyHtml: buildHourlyList(weatherHourly, (row) => `${formatTime(row.time)} - ${formatNumber(row.tempF, 0)} F, rain ${formatNumber(row.rainChance, 0)}%, cloud ${formatNumber(row.cloudCover, 0)}%`)
        },
        waterTemp: {
          key: "waterTemp",
          chartKey: "waterTemp",
          title: "Water Temperature",
          kicker: "Immersion comfort",
          recommendation: `Recommendation: Use water temperature to set expectations for snorkel, dive, and longer in-water sessions.`,
          pills: [
            `Avg ${formatNumber(average(seaTemps), 1)} F`,
            `Low ${formatNumber(minValue(seaTemps), 1)} F`,
            `High ${formatNumber(maxValue(seaTemps), 1)} F`
          ],
          details: [
            `Average sea surface temperature is ${formatNumber(average(seaTemps), 1)} F.`,
            `Reported range spans ${formatNumber(minValue(seaTemps), 1)} to ${formatNumber(maxValue(seaTemps), 1)} F.`,
            `Use this as comfort context rather than a standalone decision signal.`
          ],
          availabilityNote: seaTemps.length ? "" : "Sea-surface temperature was not returned for this date.",
          hasChartData: seaTemps.length > 0,
          emptyText: "Water-temperature chart unavailable for this date.",
          hourlyHtml: buildHourlyList(marineHourly.filter((row) => row.seaTempF != null), (row) => `${formatTime(row.time)} - ${formatNumber(row.seaTempF, 1)} F`)
        }
      };
    }

    function destroyChart(chart) {
      if (chart) chart.destroy();
      return null;
    }

    function destroyAllCharts() {
      Object.keys(state.charts).forEach((key) => {
        state.charts[key] = destroyChart(state.charts[key]);
      });
      state.charts = {};
    }

    function commonChartOptions(yTitle, compact = false) {
      return {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: {
            position: "top",
            labels: {
              boxWidth: compact ? 10 : 14,
              font: { size: compact ? 10 : 12 }
            }
          }
        },
        scales: {
          x: {
            ticks: {
              maxTicksLimit: compact ? 8 : 12
            }
          },
          y: {
            title: { display: true, text: yTitle }
          }
        }
      };
    }

    function mountChart(chartKey, canvasId, condition, compact = false) {
      const canvas = document.getElementById(canvasId);
      if (!canvas) return;

      const tideHourly = condition.tides.hourly;
      const marineHourly = condition.marine.hourly;
      const weatherHourly = condition.weather.hourly;
      state.charts[canvasId] = destroyChart(state.charts[canvasId]);

      if (chartKey === "tide" && tideHourly.length) {
        state.charts[canvasId] = new Chart(canvas, {
          type: "line",
          data: {
            labels: tideHourly.map((row) => formatHourLabel(row.time)),
            datasets: [{
              label: "Tide height (ft)",
              data: tideHourly.map((row) => row.heightFt),
              borderColor: "#1f5f7a",
              backgroundColor: "rgba(31, 95, 122, 0.18)",
              borderWidth: 2,
              fill: true,
              tension: 0.28
            }]
          },
          options: commonChartOptions("Feet", compact)
        });
      }

      if (chartKey === "wave" && marineHourly.length) {
        state.charts[canvasId] = new Chart(canvas, {
          type: "line",
          data: {
            labels: marineHourly.map((row) => formatHourLabel(row.time)),
            datasets: [
              {
                label: "Wave height (ft)",
                data: marineHourly.map((row) => row.waveFt),
                borderColor: "#1f5f7a",
                backgroundColor: "rgba(31, 95, 122, 0.12)",
                borderWidth: 2,
                tension: 0.25
              },
              {
                label: "Swell height (ft)",
                data: marineHourly.map((row) => row.swellFt),
                borderColor: "#c97347",
                backgroundColor: "rgba(201, 115, 71, 0.08)",
                borderWidth: 2,
                tension: 0.25
              }
            ]
          },
          options: commonChartOptions("Feet", compact)
        });
      }

      if (chartKey === "wind" && weatherHourly.length) {
        state.charts[canvasId] = new Chart(canvas, {
          type: "line",
          data: {
            labels: weatherHourly.map((row) => formatHourLabel(row.time)),
            datasets: [
              {
                label: "Wind speed (mph)",
                data: weatherHourly.map((row) => row.windMph),
                borderColor: "#1d6a4d",
                backgroundColor: "rgba(29, 106, 77, 0.12)",
                borderWidth: 2,
                tension: 0.25
              },
              {
                label: "Wind gusts (mph)",
                data: weatherHourly.map((row) => row.gustMph),
                borderColor: "#8b6a1e",
                backgroundColor: "rgba(139, 106, 30, 0.08)",
                borderWidth: 2,
                tension: 0.25
              }
            ]
          },
          options: commonChartOptions("Miles per hour", compact)
        });
      }

      if (chartKey === "weather" && weatherHourly.length) {
        state.charts[canvasId] = new Chart(canvas, {
          type: "line",
          data: {
            labels: weatherHourly.map((row) => formatHourLabel(row.time)),
            datasets: [
              {
                label: "Rain probability (%)",
                data: weatherHourly.map((row) => row.rainChance),
                borderColor: "#1f5f7a",
                backgroundColor: "rgba(31, 95, 122, 0.12)",
                borderWidth: 2,
                yAxisID: "y",
                tension: 0.2
              },
              {
                label: "Air temperature (F)",
                data: weatherHourly.map((row) => row.tempF),
                borderColor: "#c97347",
                backgroundColor: "rgba(201, 115, 71, 0.08)",
                borderWidth: 2,
                yAxisID: "y1",
                tension: 0.2
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: "index", intersect: false },
            plugins: {
              legend: {
                position: "top",
                labels: {
                  boxWidth: compact ? 10 : 14,
                  font: { size: compact ? 10 : 12 }
                }
              }
            },
            scales: {
              x: {
                ticks: {
                  maxTicksLimit: compact ? 8 : 12
                }
              },
              y: {
                type: "linear",
                position: "left",
                title: { display: true, text: "Rain probability (%)" },
                min: 0,
                max: 100
              },
              y1: {
                type: "linear",
                position: "right",
                grid: { drawOnChartArea: false },
                title: { display: true, text: "Air temperature (F)" }
              }
            }
          }
        });
      }

      if (chartKey === "waterTemp") {
        const rows = marineHourly.filter((row) => row.seaTempF != null);
        if (rows.length) {
          state.charts[canvasId] = new Chart(canvas, {
            type: "line",
            data: {
              labels: rows.map((row) => formatHourLabel(row.time)),
              datasets: [{
                label: "Sea surface temp (F)",
                data: rows.map((row) => row.seaTempF),
                borderColor: "#1f5f7a",
                backgroundColor: "rgba(31, 95, 122, 0.1)",
                borderWidth: 2,
                fill: true,
                tension: 0.25
              }]
            },
            options: commonChartOptions("Degrees F", compact)
          });
        }
      }
    }

    // One report card: header on top, verdict + stat pills, then chart below.
    function reportCardHtml(targetId, module, featured) {
      const canvasId = `${targetId}-${module.key}-chart`;
      const chartMarkup = module.hasChartData
        ? `<canvas id="${canvasId}" aria-label="${module.title} chart" role="img"></canvas>`
        : `<div class="chart-empty">${module.emptyText}</div>`;

      return `
        <article class="panel report-card ${featured ? "is-featured" : ""}">
          <div class="report-head">
            <p class="module-kicker">${module.kicker}</p>
            <h3>${module.title}</h3>
          </div>
          <p class="module-recommendation">${module.recommendation}</p>
          <div class="stat-pills">${module.pills.map((pill) => `<span class="stat-pill">${pill}</span>`).join("")}</div>
          ${module.availabilityNote ? `<p class="availability-note">${module.availabilityNote}</p>` : ""}
          ${featured ? module.hourlyHtml : ""}
          <div class="chart-wrap">${chartMarkup}</div>
        </article>
      `;
    }

    // Render an optional full-width featured report above a 2-column grid.
    function renderReports(targetEl, modules, featuredModule) {
      const featuredHtml = featuredModule ? reportCardHtml(targetEl.id, featuredModule, true) : "";
      const gridHtml = `<div class="report-grid">${modules.map((module) => reportCardHtml(targetEl.id, module, false)).join("")}</div>`;
      targetEl.innerHTML = featuredHtml + gridHtml;

      const all = featuredModule ? [featuredModule, ...modules] : modules;
      all.forEach((module) => {
        if (!module.hasChartData) return;
        mountChart(module.chartKey, `${targetEl.id}-${module.key}-chart`, state.condition, module !== featuredModule);
      });
    }

    function parseRoute() {
      const hash = window.location.hash.replace(/^#\/?/, "");
      if (!hash) return { view: "overview", activity: null };
      const [path, queryString] = hash.split("?");
      if (path === "marine-life") {
        const params = new URLSearchParams(queryString || "");
        return { view: "marine-life", activity: null, species: params.get("species") };
      }
      const match = path.match(/^activity\/(.+)$/);
      if (!match) return { view: "overview", activity: null };
      const activity = getActivityBySlug(match[1]);
      return activity ? { view: "activity", activity } : { view: "overview", activity: null };
    }

    function applyRoute(route) {
      state.currentView = route.view;
      state.selectedActivity = route.activity || null;
      el.overviewView.hidden = route.view !== "overview";
      el.activityView.hidden = route.view !== "activity";
      el.marineLifeView.hidden = route.view !== "marine-life";
      document.body.dataset.view = route.view;
      if (route.view === "activity") {
        el.overviewReports.innerHTML = "";
      } else if (route.view === "overview") {
        el.activityReports.innerHTML = "";
        el.messageSection.hidden = true;
        el.activityMessage.value = "";
      }
      renderActivityNav();
      if (route.view === "marine-life") {
        state.pendingSpecies = route.species || null;
        if (state.condition) renderContextHeader(state.condition);
        refreshMarineLife();
      } else {
        if (typeof closeSpeciesPanel === "function") closeSpeciesPanel({ updateUrl: false });
        if (state.condition) renderCurrentView(state.condition);
      }
    }

    function buildTidepoolMessage(condition) {
      const bestLow = condition.tides.bestLow;
      const metrics = summarizeCoreMetrics(condition);
      return [
        `Homeschool tide-pool plan for ${formatDate(fromYmd(condition.date))}`,
        `${condition.place.name} (${condition.place.zone})`,
        "",
        `Best window: ${tideWindowAround(bestLow ? bestLow.time : null)} around ${bestLow ? `${formatTime(bestLow.time)} low tide near ${formatNumber(bestLow.heightFt)} ft` : "the best available low tide"}.`,
        `Forecast snapshot: wave avg ${formatNumber(metrics.avgWave)} ft, wind avg ${formatNumber(metrics.avgWind, 0)} mph, rain max ${formatNumber(metrics.maxRainChance, 0)}%.`,
        "Please verify official water-quality status and follow posted signs and lifeguard guidance before entering the water.",
        "Group note: rocks are slippery, sets can surprise kids, and close supervision is essential."
      ].join("\n");
    }

    function buildSnorkelMessage(condition) {
      const metrics = summarizeCoreMetrics(condition);
      return [
        `Homeschool snorkel / coastal science plan for ${formatDate(fromYmd(condition.date))}`,
        `${condition.place.name} (${condition.place.zone})`,
        "",
        `Current outlook: ${condition.ratings.snorkelDive.label}. Wave avg ${formatNumber(metrics.avgWave)} ft, wind avg ${formatNumber(metrics.avgWind, 0)} mph, water temp about ${formatNumber(average(condition.marine.hourly.map((row) => row.seaTempF).filter((value) => value != null)), 1)} F when reported.`,
        "Please verify water quality, posted conditions, and live visibility before committing to an in-water lesson.",
        "Group note: masks, fins, layered warmth, and a shore-based fallback plan are recommended."
      ].join("\n");
    }

    function buildActivityMessage(condition, activity) {
      if (!activity || !activity.isHomeschool) return "";
      if (activity.slug === "dive") return buildSnorkelMessage(condition);
      return buildTidepoolMessage(condition);
    }

    function renderActivityView(condition) {
      const activity = state.selectedActivity;
      if (!activity) return;
      const catalog = buildReportCatalog(condition);
      const featured = catalog[activity.featuredKey];
      const modules = activity.reportKeys.map((key) => catalog[key]).filter(Boolean);

      el.overviewReports.innerHTML = "";

      el.activityTitle.textContent = `${activity.title} at ${condition.place.name}`;
      el.activityIntro.textContent = activity.intro;

      const reads = getActivityReads(condition, activity);
      const highlights = reads.map((read) => ({
        label: reads.length > 1 ? `Rating · ${read.shortName}` : "Recommendation",
        value: read.rating.label,
        note: read.rating.reason
      }));
      highlights.push(activity.slug === "tide-pools"
        ? {
            label: "Best timing",
            value: tideWindowAround(condition.tides.bestLow ? condition.tides.bestLow.time : null),
            note: "Anchor the trip on the low-tide window."
          }
        : {
            label: "Water quality",
            value: condition.waterQuality.label,
            note: "Confirm the official county source before entering the water."
          });

      el.activityHighlights.innerHTML = highlights.map((card) => `
        <article class="metric-card">
          <p class="metric-label">${card.label}</p>
          <p class="metric-value">${card.value}</p>
          <p class="metric-note">${card.note}</p>
        </article>
      `).join("");

      renderReports(el.activityReports, modules, featured);

      const message = buildActivityMessage(condition, activity);
      el.messageSection.hidden = !message;
      el.activityMessage.value = message;
    }

    function renderOverview(condition) {
      const catalog = buildReportCatalog(condition);
      const overviewModules = ["tide", "marine", "wind", "weather"].map((key) => catalog[key]).filter(Boolean);
      el.activityReports.innerHTML = "";
      el.messageSection.hidden = true;
      el.activityMessage.value = "";
      renderReports(el.overviewReports, overviewModules, null);
    }

    function renderCurrentView(condition) {
      destroyAllCharts();
      renderContextHeader(condition);
      if (state.currentView === "marine-life") {
        updateContextBackground(condition);
        renderMarineLife();
        return;
      }
      renderContextStats(condition);
      renderRatingsBar(condition);
      renderWarnings(condition);
      updateContextBackground(condition);
      if (state.currentView === "activity") {
        renderActivityView(condition);
      } else {
        renderOverview(condition);
      }
    }

    // --- Marine Life rendering ---------------------------------------------
    function renderMarineWindowControl() {
      if (!el.windowControl) return;
      el.windowControl.innerHTML = MARINE_WINDOWS.map((w) => `
        <button type="button" class="segment" data-window="${w.days}" aria-pressed="${w.days === state.marineWindowDays}">${w.label}</button>
      `).join("");
    }

    function formatSightingDate(ymd) {
      if (!ymd) return "—";
      const parts = String(ymd).split("-").map(Number);
      if (parts.length < 3 || parts.some(Number.isNaN)) return ymd;
      return formatDate(fromYmd(`${ymd}`.slice(0, 10)));
    }

    function speciesCardHtml(sp) {
      const photo = sp.photoUrl
        ? `<img class="species-photo" src="${sp.photoUrl}" alt="${sp.commonName} (${sp.sciName})" loading="lazy" />`
        : `<div class="species-photo species-photo-empty" role="img" aria-label="No photo available for ${sp.commonName}"></div>`;
      const count = `${sp.count} sighting${sp.count === 1 ? "" : "s"}`;
      return `
        <article class="species-card" data-taxon="${sp.taxonId}" tabindex="0" aria-label="${sp.commonName}, ${count}">
          <div class="species-photo-wrap">
            ${photo}
            ${sp.obscured ? `<span class="species-approx" title="Exact location obscured for a sensitive species">approx. location</span>` : ""}
          </div>
          <div class="species-meta">
            <p class="species-name">${sp.commonName}</p>
            <p class="species-sci">${sp.sciName}</p>
            <p class="species-stats">${count} · last ${formatSightingDate(sp.lastSeen)}</p>
            <a class="species-link" href="${sp.sourceUrl}" target="_blank" rel="noopener">View on iNaturalist &#8599;</a>
          </div>
        </article>
      `;
    }

    function renderMarineLife() {
      renderMarineWindowControl();
      const placeName = state.selectedPlace ? state.selectedPlace.name : "this place";

      if (state.marineLoading) {
        el.marineSummary.textContent = `Loading recent sightings near ${placeName}…`;
        el.marineSpeciesList.innerHTML = `<p class="marine-empty">Loading recent sightings…</p>`;
        return;
      }

      if (state.marineError) {
        el.marineSummary.textContent = "Could not load sightings.";
        el.marineSpeciesList.innerHTML = `<p class="availability-note">iNaturalist data could not be loaded right now. Check your connection and try again.</p>`;
        if (typeof clearMarineMarkers === "function") clearMarineMarkers();
        return;
      }

      const data = state.marine;
      const species = data ? data.species : [];

      if (!species.length) {
        el.marineSummary.textContent = `No marine life sightings found near ${placeName} in the last ${state.marineWindowDays} days.`;
        el.marineSpeciesList.innerHTML = `<p class="marine-empty">No recent sightings in this window. Try widening the recent window to 90 days or 1 year.</p>`;
        if (typeof clearMarineMarkers === "function") clearMarineMarkers();
        return;
      }

      el.marineSummary.innerHTML = `<strong>${species.length}</strong> species · <strong>${data.sightings.length}</strong> mapped sightings within ${MARINE_RADIUS_KM} km · last ${state.marineWindowDays} days`;
      el.marineSpeciesList.innerHTML = species.map(speciesCardHtml).join("");
      if (typeof renderMarineMarkers === "function") renderMarineMarkers(data.sightings);

      // Honor a deep-linked or still-open species selection now that data exists.
      const pending = state.pendingSpecies || state.selectedSpecies;
      if (pending) {
        const match = species.find((sp) => String(sp.taxonId) === String(pending));
        state.pendingSpecies = null;
        if (match) {
          openSpeciesPanel(match.taxonId, { updateUrl: false, focusPanel: false });
        } else {
          closeSpeciesPanel({ updateUrl: false });
        }
      }
    }

    function getSpeciesByTaxon(taxonId) {
      const species = state.marine ? state.marine.species : [];
      return species.find((sp) => String(sp.taxonId) === String(taxonId)) || null;
    }

    function renderSpeciesDetail(sp) {
      const photo = sp.photoUrl
        ? `<img class="species-detail-photo-img" src="${sp.photoUrl}" alt="${sp.commonName} (${sp.sciName})" />`
        : `<div class="species-detail-photo-img species-photo-empty" role="img" aria-label="No photo available for ${sp.commonName}"></div>`;
      const rows = [
        ["Recent sightings", `${sp.count}`],
        ["Most recent", formatSightingDate(sp.lastSeen)],
        sp.iconicTaxon ? ["Group", sp.iconicTaxon] : null,
        ["Location", sp.obscured ? "Approximate (obscured)" : "Exact"]
      ].filter(Boolean);

      el.speciesPanelContent.innerHTML = `
        <div class="species-detail">
          <div class="species-detail-photo">${photo}</div>
          <p class="eyebrow">Marine Life</p>
          <h2 id="speciesPanelName">${sp.commonName}</h2>
          <p class="species-detail-sci">${sp.sciName}</p>
          <dl class="species-detail-stats">
            ${rows.map(([dt, dd]) => `<div><dt>${dt}</dt><dd>${dd}</dd></div>`).join("")}
          </dl>
          <a class="primary species-detail-link" href="${sp.sourceUrl}" target="_blank" rel="noopener">View record on iNaturalist &#8599;</a>
          <p class="small-note">Source: iNaturalist community observations. Identifications are community-sourced; obscured locations are approximate.</p>
        </div>
      `;
    }

    // Open the in-app detail panel for a species. `updateUrl` keeps the
    // ?species= deep link in sync; `focusPanel` moves focus into the dialog.
    function openSpeciesPanel(taxonId, options) {
      const opts = options || {};
      const sp = getSpeciesByTaxon(taxonId);
      if (!sp) return;

      state.selectedSpecies = sp.taxonId;
      if (opts.trigger) state.speciesPanelTrigger = opts.trigger;

      renderSpeciesDetail(sp);
      el.speciesPanel.hidden = false;
      document.body.classList.add("species-panel-open");

      if (typeof focusSpeciesOnMap === "function") focusSpeciesOnMap(sp.taxonId);

      if (opts.updateUrl !== false) {
        history.replaceState(null, "", `#/marine-life?species=${encodeURIComponent(sp.taxonId)}`);
      }
      if (opts.focusPanel !== false) {
        const closeBtn = el.speciesPanel.querySelector(".species-panel-close");
        if (closeBtn) closeBtn.focus();
      }
    }

    function closeSpeciesPanel(options) {
      const opts = options || {};
      if (el.speciesPanel.hidden) return;
      el.speciesPanel.hidden = true;
      document.body.classList.remove("species-panel-open");
      state.selectedSpecies = null;

      if (opts.updateUrl !== false) {
        history.replaceState(null, "", "#/marine-life");
      }

      const trigger = state.speciesPanelTrigger;
      state.speciesPanelTrigger = null;
      if (trigger && document.contains(trigger)) {
        trigger.focus();
      } else if (el.marineSummary) {
        el.marineSummary.focus();
      }
    }
