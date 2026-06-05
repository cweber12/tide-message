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
      charts: {},
      // Marine Life view
      marineWindowDays: 30,
      marine: null,
      marineLoading: false,
      marineError: false,
      marineMap: null,
      marineMarkers: null,
      marineMarkerByTaxon: new Map(),
      selectedSpecies: null,
      pendingSpecies: null,
      speciesPanelTrigger: null
    };

// DOM references
const el = {
      dateInput: document.getElementById("dateInput"),
      zoneSelect: document.getElementById("zoneSelect"),
      placeSelect: document.getElementById("placeSelect"),
      updateBtn: document.getElementById("updateBtn"),
      statusText: document.getElementById("statusText"),
      overviewNavLink: document.getElementById("overviewNavLink"),
      marineLifeNavLink: document.getElementById("marineLifeNavLink"),
      activityNavLinks: document.getElementById("activityNavLinks"),
      windowControl: document.getElementById("windowControl"),
      marineLifeView: document.getElementById("marineLifeView"),
      marineSummary: document.getElementById("marineSummary"),
      marineSpeciesList: document.getElementById("marineSpeciesList"),
      speciesPanel: document.getElementById("speciesPanel"),
      speciesPanelContent: document.getElementById("speciesPanelContent"),
      viewEyebrow: document.getElementById("viewEyebrow"),
      viewTitle: document.getElementById("viewTitle"),
      contextMedia: document.getElementById("contextMedia"),
      contextCredit: document.getElementById("contextCredit"),
      contextStats: document.getElementById("contextStats"),
      activityRatings: document.getElementById("activityRatings"),
      warningBand: document.getElementById("warningBand"),
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
        renderWarnings(condition);
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

    // Fetch and render recent marine-life sightings for the current place and
    // window. Independent of the forecast condition; safe to call only while the
    // Marine Life view is active.
    async function refreshMarineLife() {
      if (state.currentView !== "marine-life") return;
      state.marineLoading = true;
      state.marineError = false;
      renderMarineLife();
      try {
        const data = await fetchMarineLifeSightings(state.selectedPlace, state.marineWindowDays);
        state.marine = data;
        state.marineError = false;
      } catch (error) {
        console.error(error);
        state.marine = null;
        state.marineError = true;
      } finally {
        state.marineLoading = false;
        renderMarineLife();
      }
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
        if (state.currentView === "marine-life") await refreshMarineLife();
      });

      el.placeSelect.addEventListener("change", async () => {
        const place = getPlaceById(el.placeSelect.value) || (state.selectedPlace.id === "custom" ? state.selectedPlace : null);
        if (place) {
          setSelectedPlace(place);
          await refreshPlanner();
          if (state.currentView === "marine-life") await refreshMarineLife();
        }
      });

      if (el.windowControl) {
        el.windowControl.addEventListener("click", (event) => {
          const button = event.target.closest("[data-window]");
          if (!button) return;
          const days = Number(button.getAttribute("data-window"));
          if (!days || days === state.marineWindowDays) return;
          state.marineWindowDays = days;
          refreshMarineLife();
        });
      }

      if (el.marineSpeciesList) {
        const openFromCard = (card) => {
          const taxonId = card.getAttribute("data-taxon");
          if (taxonId) openSpeciesPanel(taxonId, { trigger: card });
        };
        el.marineSpeciesList.addEventListener("click", (event) => {
          if (event.target.closest("a")) return;
          const card = event.target.closest(".species-card");
          if (card) openFromCard(card);
        });
        el.marineSpeciesList.addEventListener("keydown", (event) => {
          if (event.key !== "Enter" && event.key !== " ") return;
          const card = event.target.closest(".species-card");
          if (card) {
            event.preventDefault();
            openFromCard(card);
          }
        });
      }

      if (el.speciesPanel) {
        el.speciesPanel.addEventListener("click", (event) => {
          if (event.target.closest("[data-close]")) closeSpeciesPanel();
        });
        el.speciesPanel.addEventListener("keydown", (event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            closeSpeciesPanel();
            return;
          }
          if (event.key !== "Tab") return;
          // Simple focus trap across the panel's focusable elements.
          const focusable = el.speciesPanel.querySelectorAll(
            'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
          );
          if (!focusable.length) return;
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        });
      }

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
      document.body.dataset.view = "overview";
      renderLocationSelect();
      renderActivityNav();
      renderMarineWindowControl();
      state.selectedDate = dateInputValue();
      setLocation(DEFAULT_LOCATION_ID);
      renderDateOptions();

      initMap();
      wireEvents();
      syncRouteFromHash();
      await refreshPlanner();
    }
