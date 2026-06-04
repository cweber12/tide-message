// Shared utility helpers.
function pad2(n) {
      return String(n).padStart(2, "0");
    }

    function metersToFeet(meters) {
      return meters == null ? null : meters * 3.28084;
    }

    function cToF(c) {
      return c == null ? null : (c * 9 / 5) + 32;
    }

    function toYmd(date) {
      return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
    }

    function toYmdNoDash(date) {
      return `${date.getFullYear()}${pad2(date.getMonth() + 1)}${pad2(date.getDate())}`;
    }

    function fromYmd(ymd) {
      const [y, m, d] = ymd.split("-").map(Number);
      return new Date(y, m - 1, d, 12, 0, 0);
    }

    function dateInputValue(date = new Date()) {
      const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: TZ,
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      }).formatToParts(date).reduce((acc, p) => {
        acc[p.type] = p.value;
        return acc;
      }, {});
      return `${parts.year}-${parts.month}-${parts.day}`;
    }

    function parseNoaaLocalTime(value) {
      const [datePart, timePart] = value.split(" ");
      const [y, m, d] = datePart.split("-").map(Number);
      const [hh, mm] = timePart.split(":").map(Number);
      return new Date(y, m - 1, d, hh, mm);
    }

    function parseApiTime(value) {
      if (!value) return null;
      return new Date(value);
    }

    function formatDate(date) {
      if (!date) return "Unknown";
      return new Intl.DateTimeFormat("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric"
      }).format(date);
    }

    function formatTime(date) {
      if (!date) return "unknown";
      return new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit"
      }).format(date);
    }

    function formatHourLabel(date) {
      if (!date) return "";
      return new Intl.DateTimeFormat("en-US", { hour: "numeric" }).format(date);
    }

    function formatNumber(value, digits = 1) {
      return value == null || Number.isNaN(value) ? "n/a" : Number(value).toFixed(digits);
    }

    function getDayWindow(dateYmd) {
      const start = new Date(`${dateYmd}T00:00:00`);
      const end = new Date(`${dateYmd}T23:59:59`);
      return { start, end };
    }

    function isInDaylight(time, sunrise, sunset) {
      if (!time || !sunrise || !sunset) return true;
      return time >= sunrise && time <= sunset;
    }

    function addWarning(condition, message) {
      if (!condition.warnings.includes(message)) {
        condition.warnings.push(message);
      }
    }

    function average(values) {
      const nums = values.filter((v) => typeof v === "number" && Number.isFinite(v));
      if (!nums.length) return null;
      return nums.reduce((sum, v) => sum + v, 0) / nums.length;
    }

    function minValue(values) {
      const nums = values.filter((v) => typeof v === "number" && Number.isFinite(v));
      if (!nums.length) return null;
      return Math.min(...nums);
    }

    function maxValue(values) {
      const nums = values.filter((v) => typeof v === "number" && Number.isFinite(v));
      if (!nums.length) return null;
      return Math.max(...nums);
    }

    function haversineMiles(lat1, lon1, lat2, lon2) {
      const toRad = (deg) => (deg * Math.PI) / 180;
      const R = 3958.8;
      const dLat = toRad(lat2 - lat1);
      const dLon = toRad(lon2 - lon1);
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    }

    function nearestTideStation(lat, lon) {
      const refs = Object.values(TIDE_STATIONS);
      let nearest = refs[0];
      let bestDistance = Infinity;
      refs.forEach((station) => {
        const distance = haversineMiles(lat, lon, station.lat, station.lon);
        if (distance < bestDistance) {
          bestDistance = distance;
          nearest = station;
        }
      });
      return nearest.id;
    }

    function getPlaceById(placeId) {
      return PLACES.find((p) => p.id === placeId) || null;
    }

    function getLocationById(locationId) {
      return LOCATIONS.find((location) => location.id === locationId) || null;
    }

    function getPlacesForLocation(locationId) {
      const location = getLocationById(locationId);
      if (!location) return [];
      return location.placeIds.map(getPlaceById).filter(Boolean);
    }

    function getActivityBySlug(slug) {
      return ACTIVITIES.find((activity) => activity.slug === slug) || null;
    }

    function addDays(date, amount) {
      const next = new Date(date);
      next.setDate(next.getDate() + amount);
      return next;
    }

    function selectedDateOrToday() {
      return el.dateInput.value || dateInputValue();
    }
