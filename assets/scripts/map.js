// Leaflet map setup and map-driven place selection.
function focusMarkerForPlace(place) {
      state.mapMarkers.forEach((marker, placeId) => {
        const markerEl = marker.getElement();
        if (!markerEl) return;
        markerEl.style.filter = placeId === place.id ? "hue-rotate(0deg) saturate(1.15)" : "grayscale(0.2)";
      });
    }

    function setSelectedPlace(place, fromMapClick = false) {
      state.selectedPlace = place;
      renderPlaceSelect();
      renderSelectedPlaceMeta();

      if (state.map) {
        state.map.setView([place.lat, place.lon], 12, { animate: true });
        if (place.id === "custom") {
          if (state.customMarker) {
            state.map.removeLayer(state.customMarker);
          }
          state.customMarker = L.marker([place.lat, place.lon]).addTo(state.map);
          state.customMarker.bindPopup(`Custom map location<br>${place.lat.toFixed(4)}, ${place.lon.toFixed(4)}`).openPopup();
        } else if (state.customMarker) {
          state.map.removeLayer(state.customMarker);
          state.customMarker = null;
        }
      }

      if (!fromMapClick && place.id !== "custom") {
        el.placeSelect.value = place.id;
      }

      focusMarkerForPlace(place);
    }

    // --- Marine Life map ----------------------------------------------------
    // A dedicated Leaflet instance for the Marine Life view, kept separate from
    // the Overview custom-location map so the two never fight over one DOM node.
    function mlColor(varName, fallback) {
      const value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
      return value || fallback;
    }

    function initMarineMap() {
      if (state.marineMap || typeof window.L === "undefined") return;
      const mapEl = document.getElementById("marineMap");
      if (!mapEl) return;

      const center = state.selectedPlace || PLACES[0];
      state.marineMap = L.map("marineMap").setView([center.lat, center.lon], 11);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'
      }).addTo(state.marineMap);
      state.marineMarkers = L.layerGroup().addTo(state.marineMap);
    }

    function clearMarineMarkers() {
      if (state.marineMarkers) state.marineMarkers.clearLayers();
      state.marineMarkerByTaxon = new Map();
    }

    function renderMarineMarkers(sightings) {
      if (!state.marineMap) initMarineMap();
      if (!state.marineMap) return;

      const center = state.selectedPlace || PLACES[0];
      state.marineMap.setView([center.lat, center.lon], 11, { animate: false });
      clearMarineMarkers();
      // The container may have just become visible; recompute its size.
      setTimeout(() => state.marineMap.invalidateSize(), 0);

      const fill = mlColor("--ml-layer-sightings", "#c2562e");

      (sightings || []).forEach((s) => {
        const marker = L.circleMarker([s.lat, s.lon], {
          radius: s.obscured ? 8 : 5,
          color: "#ffffff",
          weight: 1.5,
          fillColor: fill,
          fillOpacity: s.obscured ? 0.35 : 0.9,
          dashArray: s.obscured ? "3" : null
        });
        marker.bindTooltip(s.commonName + (s.obscured ? " (approx.)" : ""));
        marker.on("click", () => {
          if (typeof openSpeciesPanel === "function") openSpeciesPanel(s.taxonId);
        });
        state.marineMarkers.addLayer(marker);

        if (!state.marineMarkerByTaxon.has(s.taxonId)) {
          state.marineMarkerByTaxon.set(s.taxonId, marker);
        }
      });
    }

    function focusSpeciesOnMap(taxonId) {
      if (!state.marineMap || !state.marineMarkerByTaxon) return;
      const marker = state.marineMarkerByTaxon.get(Number(taxonId));
      if (!marker) return;
      state.marineMap.setView(marker.getLatLng(), 13, { animate: true });
      marker.openPopup();
    }

    function initMap() {
      if (typeof window.L === "undefined") {
        const mapEl = document.getElementById("map");
        mapEl.innerHTML = '<div style="display:grid;place-items:center;height:100%;padding:18px;text-align:center;color:var(--muted);background:var(--surface-alt);">Map could not load. The rest of the planner can still run, but custom map selection is unavailable right now.</div>';
        setStatus("Leaflet did not load, so custom map selection is disabled. The planner can still run.");
        return;
      }

      state.map = L.map("map").setView([32.80, -117.25], 11);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'
      }).addTo(state.map);

      PLACES.forEach((place) => {
        const marker = L.marker([place.lat, place.lon]).addTo(state.map);
        marker.bindPopup(`<strong>${place.name}</strong><br>${place.zone}<br>${place.notes}`);
        marker.on("click", async () => {
          setSelectedPlace(place);
          await refreshPlanner();
        });
        state.mapMarkers.set(place.id, marker);
      });

      state.map.on("click", async (event) => {
        const lat = Number(event.latlng.lat.toFixed(5));
        const lon = Number(event.latlng.lng.toFixed(5));
        const custom = {
          id: "custom",
          name: "Custom map location",
          zone: "Selected on map",
          lat,
          lon,
          tideStation: nearestTideStation(lat, lon),
          notes: "Selected by map click."
        };
        setSelectedPlace(custom, true);
        await refreshPlanner();
      });

      const mapDetails = document.querySelector(".map-panel details");
      if (mapDetails) {
        mapDetails.addEventListener("toggle", () => {
          if (mapDetails.open) {
            setTimeout(() => state.map.invalidateSize(), 0);
          }
        });
      }

      setTimeout(() => {
        state.map.invalidateSize();
      }, 140);
    }
