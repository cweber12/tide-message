// Rendering and view composition.
function setStatus(message) {
      el.statusText.textContent = message;
    }

    function labelScore(label) {
      const value = String(label || "").toLowerCase();
      if (value.includes("good") || value.includes("great") || value.includes("ideal")) return 3;
      if (value.includes("fair") || value.includes("possible") || value.includes("mixed") || value.includes("small surf")) return 2;
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

    function sortedActivityCards(condition) {
      return ACTIVITIES.map((activity) => ({
        activity,
        rating: condition.ratings[activity.ratingKey]
      })).sort((left, right) => labelScore(right.rating.label) - labelScore(left.rating.label));
    }

    function renderSummary(condition) {
      const topActivities = sortedActivityCards(condition).slice(0, 2).map((entry) => entry.activity.navLabel).join(" and ");
      const bestLow = condition.tides.bestLow;
      const bestLowText = bestLow
        ? `Best low tide ${formatTime(bestLow.time)} at ${formatNumber(bestLow.heightFt)} ft.`
        : "No clear low-tide window found for this date.";
      const waveAvg = average(condition.marine.hourly.map((x) => x.waveFt));
      const windAvg = average(condition.weather.hourly.map((x) => x.windMph));
      const rainMax = maxValue(condition.weather.hourly.map((x) => x.rainChance));

      el.summaryLead.textContent = `${condition.place.name} on ${formatDate(fromYmd(condition.date))} looks strongest for ${topActivities || "careful activity selection"}.`;
      el.summaryMeta.textContent = `${bestLowText} Avg wave ${formatNumber(waveAvg)} ft, avg wind ${formatNumber(windAvg, 0)} mph, max rain chance ${formatNumber(rainMax, 0)}%. Water quality: ${condition.waterQuality.label}.`;

      el.warningList.innerHTML = "";
      const warnings = condition.warnings.length
        ? condition.warnings
        : ["No obvious forecast gaps reported. Still verify closures, signs, water quality, and live beach conditions before leaving."];
      warnings.forEach((warning) => {
        const li = document.createElement("li");
        li.textContent = warning;
        el.warningList.appendChild(li);
      });
    }

    function renderContextHeader(condition) {
      const location = getLocationById(state.selectedLocationId);
      if (state.currentView === "overview" || !state.selectedActivity) {
        el.viewEyebrow.textContent = "Overview";
        el.viewTitle.textContent = `${location ? location.label : condition.place.zone} overview for ${formatDate(fromYmd(condition.date))}`;
        el.viewDescription.textContent = "Grouped tide, marine, wind, and weather modules with activity guidance ranked for quick scanning.";
      } else {
        el.viewEyebrow.textContent = "Activity View";
        el.viewTitle.textContent = `${state.selectedActivity.title} for ${condition.place.name}`;
        el.viewDescription.textContent = state.selectedActivity.intro;
      }
    }

    function renderActivitySummaryStrip(condition) {
      const cards = state.currentView === "activity" && state.selectedActivity
        ? [{ activity: state.selectedActivity, rating: condition.ratings[state.selectedActivity.ratingKey] }]
        : sortedActivityCards(condition);
      el.activitySummaryStrip.innerHTML = cards.map(({ activity, rating }) => `
        <article class="metric-card">
          <p class="metric-label">${activity.navLabel}</p>
          <p class="metric-value">${rating.label}</p>
          <p class="metric-note">${rating.reason}</p>
        </article>
      `).join("");

      const label = el.summaryStripToggle.querySelector(".summary-strip-toggle-label");
      if (label) {
        label.textContent = state.currentView === "activity" && state.selectedActivity
          ? `${state.selectedActivity.navLabel} rating`
          : `Activity ratings (${cards.length})`;
      }
    }

    function setSummaryStripOpen(open) {
      el.summaryStripWrap.setAttribute("data-open", String(open));
      el.summaryStripToggle.setAttribute("aria-expanded", String(open));
      el.activitySummaryStrip.setAttribute("aria-hidden", String(!open));
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

    function renderModuleCards(targetEl, modules, detailed = false) {
      targetEl.innerHTML = modules.map((module) => {
        const canvasId = `${targetEl.id}-${module.key}-chart`;
        const chartMarkup = module.hasChartData
          ? `<canvas id="${canvasId}" aria-label="${module.title} chart" role="img"></canvas>`
          : `<div class="chart-empty">${module.emptyText}</div>`;

        return `
          <article class="panel module-card ${detailed ? "is-detailed" : "is-compact"}">
            <div class="module-copy">
              <p class="module-kicker">${module.kicker}</p>
              <h3>${module.title}</h3>
              <p class="module-recommendation">${module.recommendation}</p>
              <div class="stat-pills">${module.pills.map((pill) => `<span class="stat-pill">${pill}</span>`).join("")}</div>
              <ul class="detail-list">${module.details.map((line) => `<li>${line}</li>`).join("")}</ul>
              ${module.availabilityNote ? `<p class="availability-note">${module.availabilityNote}</p>` : ""}
              ${detailed ? module.hourlyHtml : ""}
            </div>
            <div class="chart-wrap">${chartMarkup}</div>
          </article>
        `;
      }).join("");

      modules.forEach((module) => {
        if (!module.hasChartData) return;
        mountChart(module.chartKey, `${targetEl.id}-${module.key}-chart`, state.condition, !detailed);
      });
    }

    function parseRoute() {
      const hash = window.location.hash.replace(/^#\/?/, "");
      if (!hash) return { view: "overview", activity: null };
      const match = hash.match(/^activity\/(.+)$/);
      if (!match) return { view: "overview", activity: null };
      const activity = getActivityBySlug(match[1]);
      return activity ? { view: "activity", activity } : { view: "overview", activity: null };
    }

    function applyRoute(route) {
      state.currentView = route.view;
      state.selectedActivity = route.activity || null;
      el.overviewView.hidden = route.view !== "overview";
      el.activityView.hidden = route.view !== "activity";
      if (route.view === "activity") {
        el.overviewReports.innerHTML = "";
      } else {
        el.activityReports.innerHTML = "";
        el.messageSection.hidden = true;
        el.activityMessage.value = "";
      }
      renderActivityNav();
      if (state.condition) {
        renderCurrentView(state.condition);
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
      if (activity.slug === "snorkel-dive") return buildSnorkelMessage(condition);
      return buildTidepoolMessage(condition);
    }

    function renderActivityView(condition) {
      const activity = state.selectedActivity;
      if (!activity) return;
      const rating = condition.ratings[activity.ratingKey];
      const catalog = buildReportCatalog(condition);
      const modules = activity.reportKeys.map((key) => catalog[key]).filter(Boolean);

      el.overviewReports.innerHTML = "";

      el.activityTitle.textContent = `${activity.title} at ${condition.place.name}`;
      el.activityIntro.textContent = activity.intro;
      el.activityHighlights.innerHTML = [
        { label: "Recommendation", value: rating.label, note: rating.reason },
        { label: "Best timing", value: activity.slug === "tide-pools" ? tideWindowAround(condition.tides.bestLow ? condition.tides.bestLow.time : null) : formatDate(fromYmd(condition.date)), note: activity.slug === "tide-pools" ? "Use the low-tide window as the anchor." : "Use the detailed modules below to narrow the best hour." },
        { label: "Water quality", value: condition.waterQuality.label, note: "Always confirm the official county source before entering the water." }
      ].map((card) => `
        <article class="metric-card">
          <p class="metric-label">${card.label}</p>
          <p class="metric-value">${card.value}</p>
          <p class="metric-note">${card.note}</p>
        </article>
      `).join("");

      renderModuleCards(el.activityReports, modules, true);

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
      renderModuleCards(el.overviewReports, overviewModules, false);
    }

    function renderCurrentView(condition) {
      destroyAllCharts();
      renderContextHeader(condition);
      renderActivitySummaryStrip(condition);
      updateContextBackground(condition);
      if (state.currentView === "activity") {
        renderActivityView(condition);
      } else {
        renderOverview(condition);
      }
    }
