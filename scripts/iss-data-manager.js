/**
 * ISS Data Manager - Real-time International Space Station data display
 * Handles ISS position updates, crew information, and data visualization
 */

// Configuration constants
const ISS_CONFIG = {
  REFRESH_INTERVAL: 3000,        // Update interval in milliseconds
  GEOCODE_THROTTLE: 15000,        // Geocoding throttle in milliseconds
  MIN_DISTANCE_DELTA: 0.25,       // Minimum distance change for geocoding (degrees)
  NETWORK_TIMEOUT: 6000,          // Network request timeout in milliseconds
  ISS_API_ENDPOINT: 'https://api.wheretheiss.at/v1/satellites/25544',
  REVERSE_GEOCODE_ENDPOINT: 'https://api.bigdatacloud.net/data/reverse-geocode-client',
  FALLBACK_GEOCODE_ENDPOINT: 'https://nominatim.openstreetmap.org/reverse'
};

// Global state management
class ISSDataManager {
  constructor() {
    this.dataPanel = null;
    this.lastGeocodeTime = 0;
    this.lastLatitude = null;
    this.lastLongitude = null;
    this.currentLocation = 'Locating...';
    this.updateInterval = null;
    this.isVisible = false;

    this.initializePanel();
    this.setupEventListeners();
    this.startDataUpdates();
  }

  /**
   * Initialize the ISS data panel
   */
  initializePanel() {
    this.dataPanel = document.getElementById('iss-data-panel');
    if (!this.dataPanel) {
      this.createDataPanel();
    }
    this.renderLoadingState();
  }

  /**
   * Create ISS data panel if it doesn't exist
   */
  createDataPanel() {
    this.dataPanel = document.createElement('div');
    this.dataPanel.id = 'iss-data-panel';
    this.dataPanel.className = 'iss-data-panel';
    document.body.appendChild(this.dataPanel);
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // ISS data toggle button
    const toggleButton = document.getElementById('iss-data-toggle');
    if (toggleButton) {
      toggleButton.addEventListener('click', () => this.togglePanel());
    }

    // Close button (delegated event listener)
    document.addEventListener('click', (event) => {
      if (event.target && event.target.id === 'iss-close-btn') {
        this.hidePanel();
      }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.isVisible) {
        this.hidePanel();
      }
    });

    // Pause updates when prediction modal is open (to avoid rate limits)
    window.addEventListener('prediction-modal-opened', () => {
      console.log('prediction modal opened: pausing ISS data updates');
      this.stopDataUpdates();
    });

    window.addEventListener('prediction-modal-closed', () => {
      console.log('prediction modal closed: resuming ISS data updates');
      this.startDataUpdates();
    });
  }

  /**
   * Toggle panel visibility
   */
  togglePanel() {
    if (this.isVisible) {
      this.hidePanel();
    } else {
      this.showPanel();
    }
  }

  /**
   * Show the data panel
   */
  showPanel() {
    this.dataPanel.classList.add('visible');
    this.isVisible = true;

    // Update button state
    const toggleButton = document.getElementById('iss-data-toggle');
    if (toggleButton) {
      toggleButton.classList.add('active');
    }

    // Adjust other UI elements
    this.adjustUIForPanel();
  }

  /**
   * Hide the data panel
   */
  hidePanel() {
    this.dataPanel.classList.remove('visible');
    this.isVisible = false;

    // Update button state
    const toggleButton = document.getElementById('iss-data-toggle');
    if (toggleButton) {
      toggleButton.classList.remove('active');
    }

    // Restore UI elements
    this.restoreUIFromPanel();
  }

  /**
   * Adjust UI elements when panel is visible
   */
  adjustUIForPanel() {
    const layersCard = document.getElementById('layer-controls');
    const settingsCard = document.getElementById('system-settings');

    if (layersCard) layersCard.classList.add('cards-adjusted');
    if (settingsCard) settingsCard.classList.add('cards-adjusted');
  }

  /**
   * Restore UI elements when panel is hidden
   */
  restoreUIFromPanel() {
    const layersCard = document.getElementById('layer-controls');
    const settingsCard = document.getElementById('system-settings');

    if (layersCard) layersCard.classList.remove('cards-adjusted');
    if (settingsCard) settingsCard.classList.remove('cards-adjusted');
  }

  /**
   * Start real-time data updates
   */
  startDataUpdates() {
    this.updateData();
    this.updateInterval = setInterval(() => {
      this.updateData();
    }, ISS_CONFIG.REFRESH_INTERVAL);
  }

  /**
   * Stop data updates
   */
  stopDataUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    // Abort any in-flight request
    if (this.currentController) {
      this.currentController.abort();
      this.currentController = null;
    }
  }

  /**
   * Update ISS data
   */
  async updateData() {
    try {
      const issData = await this.fetchISSPosition();
      this.renderData(issData);

      // Check if we should update location
      if (this.shouldUpdateLocation(issData.latitude, issData.longitude)) {
        this.updateLocation(issData.latitude, issData.longitude);
      }

    } catch (error) {
      if (error.name !== 'AbortError') {
        console.warn('Failed to update ISS data:', error);
      }
      // Keep showing last known data
    }
  }

  /**
   * Fetch ISS position from API
   */
  async fetchISSPosition() {
    // Abort previous request if any
    if (this.currentController) {
      this.currentController.abort();
    }

    this.currentController = new AbortController();
    const timeoutId = setTimeout(() => {
      if (this.currentController) this.currentController.abort();
    }, ISS_CONFIG.NETWORK_TIMEOUT);

    try {
      const response = await fetch(ISS_CONFIG.ISS_API_ENDPOINT, {
        signal: this.currentController.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'SpaceTracker Pro/1.0'
        }
      });

      clearTimeout(timeoutId);
      this.currentController = null;

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      return {
        latitude: parseFloat(data.latitude),
        longitude: parseFloat(data.longitude),
        altitude: parseFloat(data.altitude),
        velocity: parseFloat(data.velocity),
        timestamp: parseInt(data.timestamp)
      };

    } catch (error) {
      clearTimeout(timeoutId);
      this.currentController = null;
      throw error;
    }
  }

  /**
   * Check if location should be updated
   */
  shouldUpdateLocation(latitude, longitude) {
    const now = Date.now();
    const timeDelta = now - this.lastGeocodeTime;
    const latDelta = this.lastLatitude === null ? Infinity : Math.abs(latitude - this.lastLatitude);
    const lonDelta = this.lastLongitude === null ? Infinity : Math.abs(longitude - this.lastLongitude);

    return latDelta > ISS_CONFIG.MIN_DISTANCE_DELTA ||
      lonDelta > ISS_CONFIG.MIN_DISTANCE_DELTA ||
      timeDelta > ISS_CONFIG.GEOCODE_THROTTLE;
  }

  /**
   * Update location description
   */
  async updateLocation(latitude, longitude) {
    try {
      const location = await this.reverseGeocode(latitude, longitude);
      this.currentLocation = location;
      this.lastGeocodeTime = Date.now();
      this.lastLatitude = latitude;
      this.lastLongitude = longitude;

      // Re-render with updated location
      const currentData = this.getCurrentData();
      if (currentData) {
        this.renderData(currentData);
      }

    } catch (error) {
      console.warn('Failed to update location:', error);
    }
  }

  /**
   * Reverse geocode coordinates to location name
   */
  async reverseGeocode(latitude, longitude) {
    // Try primary service first
    try {
      return await this.reverseGeocodePrimary(latitude, longitude);
    } catch (error) {
      console.warn('Primary geocoding failed, trying fallback:', error);
      return await this.reverseGeocodeFallback(latitude, longitude);
    }
  }

  /**
   * Primary reverse geocoding service
   */
  async reverseGeocodePrimary(latitude, longitude) {
    const url = new URL(ISS_CONFIG.REVERSE_GEOCODE_ENDPOINT);
    url.searchParams.set('latitude', latitude);
    url.searchParams.set('longitude', longitude);
    url.searchParams.set('localityLanguage', 'en');

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.status}`);
    }

    const data = await response.json();

    const city = data.city || data.locality || (data.localityInfo?.administrative?.[0]?.name) || '';
    const region = data.principalSubdivision || '';
    const country = data.countryName || '';

    if (city || region || country) {
      return [city, region, country].filter(Boolean).join(', ');
    } else if (data.localityInfo?.informative?.length) {
      return data.localityInfo.informative[0].name || 'Over ocean';
    } else {
      return 'Over ocean';
    }
  }

  /**
   * Fallback reverse geocoding service
   */
  async reverseGeocodeFallback(latitude, longitude) {
    const url = new URL(ISS_CONFIG.FALLBACK_GEOCODE_ENDPOINT);
    url.searchParams.set('lat', latitude);
    url.searchParams.set('lon', longitude);
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('zoom', '10');

    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'SpaceTracker Pro/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Fallback geocoding failed: ${response.status}`);
    }

    const data = await response.json();
    const address = data.address || {};

    const city = address.city || address.town || address.village || address.hamlet || '';
    const state = address.state || address.region || '';
    const country = address.country || '';

    return [city, state, country].filter(Boolean).join(', ') ||
      (data.display_name || 'Unknown location');
  }

  /**
   * Render loading state
   */
  renderLoadingState() {
    this.dataPanel.innerHTML = `
      <div class="iss-panel-header">
        <h2>ISS Position</h2>
        <button id="iss-close-btn" class="iss-close-btn" title="Close Panel">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="data-item">
        <div class="data-icon">⏳</div>
        <div class="data-content">
          <div class="data-label">Status</div>
          <div class="data-value">Loading...</div>
        </div>
      </div>
    `;
  }

  /**
   * Render ISS data
   */
  renderData(data) {
    const latitude = data.latitude.toFixed(4);
    const longitude = data.longitude.toFixed(4);
    const altitude = data.altitude.toFixed(2);
    const velocity = data.velocity.toFixed(2);
    const lastUpdate = this.formatTime(new Date(data.timestamp * 1000));

    this.dataPanel.innerHTML = `
      <div class="iss-panel-header">
        <h2>ISS Position</h2>
        <button id="iss-close-btn" class="iss-close-btn" title="Close Panel">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="data-item">
        <div class="data-icon">🌍</div>
        <div class="data-content">
          <div class="data-label">Latitude</div>
          <div class="data-value">${latitude}°</div>
        </div>
      </div>
      <div class="data-item">
        <div class="data-icon">🌐</div>
        <div class="data-content">
          <div class="data-label">Longitude</div>
          <div class="data-value">${longitude}°</div>
        </div>
      </div>
      <div class="data-item">
        <div class="data-icon">⬆️</div>
        <div class="data-content">
          <div class="data-label">Altitude</div>
          <div class="data-value">${altitude} km</div>
        </div>
      </div>
      <div class="data-item">
        <div class="data-icon">⚡</div>
        <div class="data-content">
          <div class="data-label">Velocity</div>
          <div class="data-value">${velocity} km/h</div>
        </div>
      </div>
      <div class="data-item">
        <div class="data-icon">🕐</div>
        <div class="data-content">
          <div class="data-label">Updated</div>
          <div class="data-value">${lastUpdate}</div>
        </div>
      </div>
      <div class="data-item">
        <div class="data-icon">📍</div>
        <div class="data-content">
          <div class="data-label">Location</div>
          <div class="data-value">${this.currentLocation}</div>
        </div>
      </div>
    `;
  }

  /**
   * Format time for display
   */
  formatTime(date) {
    return new Intl.DateTimeFormat(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  }

  /**
   * Get current data (for re-rendering)
   */
  getCurrentData() {
    // This would store the last fetched data
    // For now, return null to indicate no current data
    return null;
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.stopDataUpdates();
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new ISSDataManager();
  });
} else {
  new ISSDataManager();
}
