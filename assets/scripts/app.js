// Runtime state, DOM references, event wiring, and app init.
// State
const state = {
      selectedDate: "",
      availableDates: [],
      availability: {
        weatherEnd: null,
        marineEnd: null
      },
      selectedLocationId: DEFAULT_LOCATION_ID,
      currentView: "overview",
      selectedActivity: null,
      selectedPlace: PLACES[0],
      condition: null,
      map: null,
      mapMarkers: new Map(),
      customMarker: null,
      charts: {}
    };

// DOM references
const el = {
      dateInput: document.getElementById("dateInput"),
      zoneSelect: document.getElementById("zoneSelect"),
      placeSelect: document.getElementById("placeSelect"),
      updateBtn: document.getElementById("updateBtn"),
      statusText: document.getElementById("statusText"),
      overviewNavLink: document.getElementById("overviewNavLink"),
      activityNavLinks: document.getElementById("activityNavLinks"),
      viewEyebrow: document.getElementById("viewEyebrow"),
      viewTitle: document.getElementById("viewTitle"),
      viewDescription: document.getElementById("viewDescription"),
      activitySummaryStrip: document.getElementById("activitySummaryStrip"),
      summaryLead: document.getElementById("summaryLead"),
      summaryMeta: document.getElementById("summaryMeta"),
      warningList: document.getElementById("warningList"),
      summarySection: document.getElementById("summarySection"),
      overviewView: document.getElementById("overviewView"),
      overviewReports: document.getElementById("overviewReports"),
      activityView: document.getElementById("activityView"),
      activityTitle: document.getElementById("activityTitle"),
      activityIntro: document.getElementById("activityIntro"),
      activityHighlights: document.getElementById("activityHighlights"),
      activityReports: document.getElementById("activityReports"),
      messageSection: document.getElementById("messageSection"),
      activityMessage: document.getElementById("activityMessage"),
      copyActivityMessage: document.getElementById("copyActivityMessage")
    };

// Event handlers
async function copyText(text) {
      try {
        await navigator.clipboard.writeText(text || "");
        setStatus("Copied to clipboard.");
      } catch (error) {
        setStatus("Could not copy automatically. Select and copy manually.");
      }
    }

    async function refreshAvailableDates() {
      try {
        const availability = await fetchAvailableDatesForPlace(state.selectedPlace);
        state.availableDates = availability.dates.length ? availability.dates : [dateInputValue()];
        state.availability = {
          weatherEnd: availability.weatherEnd,
          marineEnd: availability.marineEnd
        };
      } catch (error) {
        state.availableDates = [state.selectedDate || dateInputValue()];
        state.availability = {
          weatherEnd: null,
          marineEnd: null
        };
      }

      state.selectedDate = resolveAvailableDate(state.selectedDate || dateInputValue());
      renderDateOptions();
    }

    async function updateConditions() {
      const dateYmd = selectedDateOrToday();
      state.selectedDate = dateYmd;
      el.updateBtn.disabled = true;

      try {
        const condition = await buildCondition(state.selectedPlace, dateYmd);
        state.condition = condition;
        renderSummary(condition);
        renderCurrentView(condition);
        setStatus(`Updated ${new Date().toLocaleString()}.`);
      } catch (error) {
        console.error(error);
      } finally {
        el.updateBtn.disabled = false;
      }
    }

    async function refreshPlanner() {
      await refreshAvailableDates();
      await updateConditions();
    }

    function syncRouteFromHash() {
      applyRoute(parseRoute());
    }

    function setLocation(locationId) {
      state.selectedLocationId = locationId;
      const places = getPlacesForLocation(locationId);
      if (!places.some((place) => place.id === state.selectedPlace.id)) {
        state.selectedPlace = places[0] || PLACES[0];
      }
      renderLocationSelect();
      renderPlaceSelect();
      focusMarkerForPlace(state.selectedPlace);
    }

    function wireEvents() {
      el.zoneSelect.addEventListener("change", async () => {
        setLocation(el.zoneSelect.value);
        await refreshPlanner();
      });

      el.placeSelect.addEventListener("change", async () => {
        const place = getPlaceById(el.placeSelect.value) || (state.selectedPlace.id === "custom" ? state.selectedPlace : null);
        if (place) {
          setSelectedPlace(place);
          await refreshPlanner();
        }
      });

      el.dateInput.addEventListener("change", async () => {
        state.selectedDate = el.dateInput.value;
        await updateConditions();
      });
      el.updateBtn.addEventListener("click", updateConditions);
      el.copyActivityMessage.addEventListener("click", () => copyText(el.activityMessage.value));
      window.addEventListener("hashchange", syncRouteFromHash);
    }

// Init
async function init() {
      renderLocationSelect();
      renderActivityNav();
      state.selectedDate = dateInputValue();
      setLocation(DEFAULT_LOCATION_ID);
      renderDateOptions();

      initMap();
      wireEvents();
      syncRouteFromHash();
      await refreshPlanner();
    }
