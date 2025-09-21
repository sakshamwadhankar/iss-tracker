/**
 * Prediction Manager - ISS position prediction and pass calculation
 * Handles time-based position prediction and location-based pass finding
 */

// Configuration
const PREDICTION_CONFIG = {
  ISS_API_BASE: 'https://api.wheretheiss.at/v1',
  ISS_SATELLITE_ID: 25544,
  REST_COUNTRIES_API: 'https://restcountries.com/v3.1/all',
  NOMINATIM_SEARCH_API: 'https://nominatim.openstreetmap.org/search',
  NOMINATIM_REVERSE_API: 'https://nominatim.openstreetmap.org/reverse',
  BIGDATA_CLOUD_API: 'https://api.bigdatacloud.net/data/reverse-geocode-client',
  NETWORK_TIMEOUT: 8000,
  DEBOUNCE_DELAY: 400
};

// Global state
let countries = [];
let countryCodeMap = {};
let debounceTimer = null;

/**
 * Initialize prediction modal functionality
 */
function initializePredictionModal() {
  const modal = document.getElementById('prediction-modal');
  if (!modal) {
    console.error('Prediction modal element not found');
    return;
  }

  buildModalInterface(modal);
  setupEventListeners();
  loadCountryData();
  setupLocationInputs();
}

/**
 * Build the prediction modal interface
 */
function buildModalInterface(modal) {
  modal.innerHTML = `
    <div class="prediction-card">
      <div class="prediction-header">
        <h2>
          <i class="fas fa-calculator"></i>
          ISS Prediction Tool
        </h2>
        <button id="prediction-close" class="btn-close" aria-label="Close">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <div class="prediction-tabs">
        <button id="time-prediction-tab" class="tab-button active">
          <i class="fas fa-clock"></i>
          Time → Position
        </button>
        <button id="location-prediction-tab" class="tab-button">
          <i class="fas fa-map-marker-alt"></i>
          Location → Passes
        </button>
      </div>
      
      <div id="time-prediction-panel" class="prediction-panel">
        <div class="input-grid">
          <div class="input-group">
            <label class="input-label">Date (UTC)</label>
            <input id="prediction-date" type="date" class="form-input" />
          </div>
          <div class="input-group">
            <label class="input-label">Time (UTC)</label>
            <input id="prediction-time" type="time" step="1" class="form-input" />
          </div>
        </div>
        <button id="calculate-position" class="btn btn-primary">
          <i class="fas fa-calculator"></i>
          Calculate Position
        </button>
        <div id="position-output" class="output-container"></div>
      </div>
      
      <div id="location-prediction-panel" class="prediction-panel" style="display: none;">
        <div class="input-grid">
          <div class="input-group">
            <label class="input-label">Country</label>
            <input id="location-country" list="country-options" class="form-input" placeholder="Enter country name..." />
            <datalist id="country-options"></datalist>
          </div>
          <div class="input-group">
            <label class="input-label">State/Province</label>
            <input id="location-state" list="state-options" class="form-input" placeholder="Enter state/province..." />
            <datalist id="state-options"></datalist>
          </div>
        </div>
        <div class="input-group">
          <label class="input-label">City</label>
          <input id="location-city" list="city-options" class="form-input" placeholder="Enter city name..." />
          <datalist id="city-options"></datalist>
        </div>
        <div class="input-grid">
          <div class="input-group">
            <label class="input-label">Minimum Elevation (°)</label>
            <input id="min-elevation" type="number" min="0" max="30" value="10" class="form-input" />
          </div>
          <div class="input-group">
            <label class="input-label">Time Window (hours)</label>
            <input id="time-window" type="number" min="1" max="240" value="72" class="form-input" />
          </div>
        </div>
        <button id="find-passes" class="btn btn-primary">
          <i class="fas fa-search"></i>
          Find Passes
        </button>
        <div id="passes-output" class="output-container"></div>
      </div>
    </div>
  `;
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  // Modal open/close
  const openButton = document.getElementById('prediction-tool');
  const closeButton = document.getElementById('prediction-close');
  
  if (openButton) {
    openButton.addEventListener('click', () => {
      document.getElementById('prediction-modal').hidden = false;
    });
  }
  
  if (closeButton) {
    closeButton.addEventListener('click', () => {
      document.getElementById('prediction-modal').hidden = true;
    });
  }

  // Tab switching
  const timeTab = document.getElementById('time-prediction-tab');
  const locationTab = document.getElementById('location-prediction-tab');
  const timePanel = document.getElementById('time-prediction-panel');
  const locationPanel = document.getElementById('location-prediction-panel');

  timeTab.addEventListener('click', () => {
    timeTab.classList.add('active');
    locationTab.classList.remove('active');
    timePanel.style.display = 'block';
    locationPanel.style.display = 'none';
  });

  locationTab.addEventListener('click', () => {
    locationTab.classList.add('active');
    timeTab.classList.remove('active');
    timePanel.style.display = 'none';
    locationPanel.style.display = 'block';
  });

  // Action buttons
  document.getElementById('calculate-position').addEventListener('click', calculatePosition);
  document.getElementById('find-passes').addEventListener('click', findPasses);

  // Keyboard shortcuts
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      document.getElementById('prediction-modal').hidden = true;
    }
  });
}

/**
 * Load country data from REST Countries API
 */
async function loadCountryData() {
  try {
    const response = await fetchWithTimeout(PREDICTION_CONFIG.REST_COUNTRIES_API);
    const data = await response.json();
    
    countries = data
      .map(country => ({
        name: country.name?.common,
        code: country.cca2
      }))
      .filter(country => country.name && country.code)
      .sort((a, b) => a.name.localeCompare(b.name));

    countryCodeMap = Object.fromEntries(
      countries.map(country => [country.name, country.code.toLowerCase()])
    );

    // Populate country datalist
    const countryList = document.getElementById('country-options');
    countryList.innerHTML = countries
      .map(country => `<option value="${country.name}"></option>`)
      .join('');

  } catch (error) {
    console.error('Failed to load country data:', error);
  }
}

/**
 * Set up location input autocomplete
 */
function setupLocationInputs() {
  const stateInput = document.getElementById('location-state');
  const cityInput = document.getElementById('location-city');

  stateInput.addEventListener('input', debounce(() => {
    updateLocationSuggestions(stateInput, 'state');
  }, PREDICTION_CONFIG.DEBOUNCE_DELAY));

  cityInput.addEventListener('input', debounce(() => {
    updateLocationSuggestions(cityInput, 'city');
  }, PREDICTION_CONFIG.DEBOUNCE_DELAY));
}

/**
 * Update location suggestions
 */
async function updateLocationSuggestions(input, type) {
  const countryInput = document.getElementById('location-country');
  const country = countryInput.value.trim();
  
  if (!country || !input.value.trim()) {
    return;
  }

  try {
    const countryCode = countryCodeMap[country] || '';
    const query = encodeURIComponent(input.value.trim());
    const url = `${PREDICTION_CONFIG.NOMINATIM_SEARCH_API}?q=${query}&format=jsonv2&limit=5&addressdetails=1${countryCode ? `&countrycodes=${countryCode}` : ''}`;
    
    const response = await fetchWithTimeout(url, {
      headers: { 'Accept': 'application/json' }
    });
    
    const data = await response.json();
    const listId = type === 'state' ? 'state-options' : 'city-options';
    const list = document.getElementById(listId);
    
    list.innerHTML = data
      .map(item => `<option value="${item.display_name}"></option>`)
      .join('');

  } catch (error) {
    console.warn(`Failed to update ${type} suggestions:`, error);
  }
}

/**
 * Calculate ISS position for given time
 */
async function calculatePosition() {
  const dateInput = document.getElementById('prediction-date');
  const timeInput = document.getElementById('prediction-time');
  const output = document.getElementById('position-output');

  if (!dateInput.value) {
    output.innerHTML = '<div class="output-label">Please select a date</div>';
    return;
  }

  output.innerHTML = '<div class="output-label loading">Calculating position...</div>';

  try {
    const timestamp = convertToUnixTimestamp(dateInput.value, timeInput.value);
    const position = await fetchISSPositionAtTime(timestamp);
    const location = await reverseGeocodeLocation(position.latitude, position.longitude);
    
    const formattedTime = formatDateTime(new Date(timestamp * 1000));
    
    output.innerHTML = `
      <div class="output-row">
        <span class="output-label">Time (UTC):</span>
        <span class="output-value">${formattedTime}</span>
      </div>
      <div class="output-row">
        <span class="output-label">Latitude:</span>
        <span class="output-value">${position.latitude.toFixed(4)}°</span>
      </div>
      <div class="output-row">
        <span class="output-label">Longitude:</span>
        <span class="output-value">${position.longitude.toFixed(4)}°</span>
      </div>
      <div class="output-row">
        <span class="output-label">Altitude:</span>
        <span class="output-value">${position.altitude.toFixed(2)} km</span>
      </div>
      <div class="output-row">
        <span class="output-label">Velocity:</span>
        <span class="output-value">${position.velocity.toFixed(2)} km/h</span>
      </div>
      <div class="output-row">
        <span class="output-label">Location:</span>
        <span class="output-value">${location}</span>
      </div>
    `;

  } catch (error) {
    console.error('Position calculation failed:', error);
    output.innerHTML = '<div class="output-label">Calculation failed. Please try again.</div>';
  }
}

/**
 * Find ISS passes for given location
 */
async function findPasses() {
  const countryInput = document.getElementById('location-country');
  const stateInput = document.getElementById('location-state');
  const cityInput = document.getElementById('location-city');
  const minElevation = parseFloat(document.getElementById('min-elevation').value) || 10;
  const timeWindow = parseInt(document.getElementById('time-window').value) || 72;
  const output = document.getElementById('passes-output');

  const country = countryInput.value.trim();
  const city = cityInput.value.trim();

  if (!country || !city) {
    output.innerHTML = '<div class="output-label">Please enter country and city</div>';
    return;
  }

  output.innerHTML = '<div class="output-label loading">Finding passes...</div>';

  try {
    const coordinates = await geocodeLocation(country, stateInput.value.trim(), city);
    const passes = await calculateISSPasses(coordinates.lat, coordinates.lon, minElevation, timeWindow);
    
    if (passes.length === 0) {
      output.innerHTML = `<div class="output-label">No passes found in the next ${timeWindow} hours</div>`;
      return;
    }

    const passesHtml = passes.slice(0, 10).map(pass => `
      <div style="padding: 8px 0; border-bottom: 1px solid rgba(0, 212, 255, 0.2);">
        <div class="output-row">
          <span class="output-label">AOS (rise):</span>
          <span class="output-value">${formatDateTime(pass.aos)}</span>
        </div>
        <div class="output-row">
          <span class="output-label">Max elevation:</span>
          <span class="output-value">${pass.maxEl.toFixed(1)}° @ ${formatTime(pass.tca)}</span>
        </div>
        <div class="output-row">
          <span class="output-label">LOS (set):</span>
          <span class="output-value">${formatDateTime(pass.los)}</span>
        </div>
        <div class="output-row">
          <span class="output-label">Observer:</span>
          <span class="output-value">${coordinates.label}</span>
        </div>
      </div>
    `).join('');

    output.innerHTML = passesHtml;

  } catch (error) {
    console.error('Pass calculation failed:', error);
    output.innerHTML = '<div class="output-label">Pass calculation failed. Please try a simpler query.</div>';
  }
}

/**
 * Convert date and time to Unix timestamp
 */
function convertToUnixTimestamp(date, time) {
  const [hours = '00', minutes = '00', seconds = '00'] = (time || '00:00:00').split(':');
  const dateTime = new Date(`${date}T${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}Z`);
  return Math.floor(dateTime.getTime() / 1000);
}

/**
 * Fetch ISS position at specific timestamp
 */
async function fetchISSPositionAtTime(timestamp) {
  const url = `${PREDICTION_CONFIG.ISS_API_BASE}/satellites/${PREDICTION_CONFIG.ISS_SATELLITE_ID}?timestamp=${timestamp}`;
  const response = await fetchWithTimeout(url);
  return await response.json();
}

/**
 * Get TLE data for pass calculations
 */
async function getTLEData() {
  const url = `${PREDICTION_CONFIG.ISS_API_BASE}/satellites/${PREDICTION_CONFIG.ISS_SATELLITE_ID}/tles`;
  const response = await fetchWithTimeout(url);
  const data = await response.json();
  return [data.line1, data.line2];
}

/**
 * Geocode location to coordinates
 */
async function geocodeLocation(country, state, city) {
  const countryCode = countryCodeMap[country] || '';
  const queryParts = [city, state, country].filter(Boolean).join(', ');
  const url = `${PREDICTION_CONFIG.NOMINATIM_SEARCH_API}?q=${encodeURIComponent(queryParts)}&format=jsonv2&limit=1&addressdetails=1${countryCode ? `&countrycodes=${countryCode}` : ''}`;
  
  const response = await fetchWithTimeout(url, {
    headers: { 'Accept': 'application/json' }
  });
  
  const data = await response.json();
  if (!data.length) {
    throw new Error('Location not found');
  }
  
  return {
    lat: parseFloat(data[0].lat),
    lon: parseFloat(data[0].lon),
    label: data[0].display_name
  };
}

/**
 * Reverse geocode coordinates to location name
 */
async function reverseGeocodeLocation(lat, lon) {
  try {
    const url = new URL(PREDICTION_CONFIG.BIGDATA_CLOUD_API);
    url.searchParams.set('latitude', lat);
    url.searchParams.set('longitude', lon);
    url.searchParams.set('localityLanguage', 'en');
    
    const response = await fetchWithTimeout(url.toString());
    const data = await response.json();
    
    const city = data.city || data.locality || '';
    const region = data.principalSubdivision || '';
    const country = data.countryName || '';
    
    return [city, region, country].filter(Boolean).join(', ') || 'Over ocean';
    
  } catch (error) {
    return 'Unknown location';
  }
}

/**
 * Calculate ISS passes for given location
 */
async function calculateISSPasses(lat, lon, minElevation, hours, stepSeconds = 30) {
  const [line1, line2] = await getTLEData();
  const satrec = window.satellite.twoline2satrec(line1, line2);
  
  const startTime = new Date();
  const endTime = new Date(startTime.getTime() + hours * 3600 * 1000);
  const observer = {
    latitude: lat * Math.PI / 180,
    longitude: lon * Math.PI / 180,
    height: 0
  };

  const passes = [];
  let inPass = false;
  let aos = null;
  let tca = null;
  let maxEl = -90;

  for (let t = new Date(startTime); t <= endTime; t = new Date(t.getTime() + stepSeconds * 1000)) {
    const gmst = window.satellite.gstime(t);
    const pv = window.satellite.propagate(satrec, t);
    
    if (!pv || !pv.position) continue;
    
    const ecf = window.satellite.eciToEcf(pv.position, gmst);
    const look = window.satellite.ecfToLookAngles(observer, ecf);
    const elevation = look.elevation * 180 / Math.PI;

    if (elevation >= minElevation) {
      if (!inPass) {
        inPass = true;
        aos = new Date(t);
        maxEl = elevation;
        tca = new Date(t);
      }
      if (elevation > maxEl) {
        maxEl = elevation;
        tca = new Date(t);
      }
    } else if (inPass) {
      passes.push({
        aos,
        tca,
        los: new Date(t),
        maxEl: Number(maxEl.toFixed(1))
      });
      inPass = false;
      aos = null;
      tca = null;
      maxEl = -90;
    }
  }

  return passes;
}

/**
 * Fetch with timeout
 */
async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PREDICTION_CONFIG.NETWORK_TIMEOUT);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Debounce function
 */
function debounce(func, delay) {
  return function(...args) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => func.apply(this, args), delay);
  };
}

/**
 * Format date and time
 */
function formatDateTime(date) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'long'
  }).format(date);
}

/**
 * Format time only
 */
function formatTime(date) {
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(date);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializePredictionModal);
} else {
  initializePredictionModal();
}
