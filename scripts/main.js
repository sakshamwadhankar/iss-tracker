/**
 * SpaceTracker Pro - Main Application Controller
 * Real-time International Space Station tracking with 3D visualization
 */

import SpaceGlobe from './space-globe.js';
import LayerController from './layer-controller.js';
import SettingsController from './settings-controller.js';
import SearchController from './search-controller.js';

// Application Configuration
const APP_CONFIG = {
  TLE_ENDPOINT: "https://tle.ivanstanojevic.me/api/tle/49044",
  ISS_ORBIT_ALTITUDE: 400000, // meters
  REFRESH_INTERVAL: 1000, // milliseconds
  BING_API_KEY: "",
  MAPQUEST_API_KEY: ""
};

// Global Application State
class SpaceTrackerApp {
  constructor() {
    this.spaceGlobe = null;
    this.layerController = null;
    this.settingsController = null;
    this.searchController = null;
    this.orbitLayer = null;
    this.issLayer = null;
    this.issModel = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the SpaceTracker application
   */
  async initialize() {
    try {
      console.log('🚀 Initializing SpaceTracker Pro...');
      
      // Configure API keys
      this.configureApiKeys();
      
      // Initialize the 3D globe
      await this.initializeGlobe();
      
      // Set up layer management
      this.setupLayerManagement();
      
      // Initialize controllers
      this.initializeControllers();
      
      // Load ISS data and create visualization
      await this.loadISSData();
      
      // Set up event listeners
      this.setupEventListeners();
      
      this.isInitialized = true;
      console.log('✅ SpaceTracker Pro initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize SpaceTracker Pro:', error);
      this.showErrorMessage('Failed to initialize application. Please refresh the page.');
    }
  }

  /**
   * Configure API keys for external services
   */
  configureApiKeys() {
    if (APP_CONFIG.BING_API_KEY) {
      WorldWind.BingMapsKey = APP_CONFIG.BING_API_KEY;
    } else {
      console.warn('⚠️ Bing API key not configured. Some map features may be limited.');
    }
  }

  /**
   * Initialize the 3D globe visualization
   */
  async initializeGlobe() {
    this.spaceGlobe = new SpaceGlobe("globe-canvas");
    
    // Add base map layers
    this.addBaseMapLayers();
    
    // Add overlay layers
    this.addOverlayLayers();
    
    // Add system layers
    this.addSystemLayers();
    
    // Create ISS-specific layers
    this.createISSLayers();
  }

  /**
   * Add base map layers to the globe
   */
  addBaseMapLayers() {
    // Blue Marble Natural Earth
    this.spaceGlobe.addLayer(new WorldWind.BMNGLayer(), {
      category: "base",
      displayName: "Natural Earth"
    });

    // Blue Marble Landsat
    this.spaceGlobe.addLayer(new WorldWind.BMNGLandsatLayer(), {
      category: "base",
      displayName: "Landsat Imagery",
      enabled: false
    });

    // Bing Aerial
    this.spaceGlobe.addLayer(new WorldWind.BingAerialLayer(), {
      category: "base",
      displayName: "Bing Aerial",
      enabled: false
    });

    // Bing Aerial with Labels
    this.spaceGlobe.addLayer(new WorldWind.BingAerialWithLabelsLayer(), {
      category: "base",
      displayName: "Bing Aerial with Labels",
      enabled: false,
      detailControl: 1.5
    });

    // OpenStreetMap via WMS
    this.spaceGlobe.addLayerFromWms("https://tiles.maps.eox.at/wms", "osm", {
      category: "base",
      displayName: "OpenStreetMap",
      enabled: false
    });
  }

  /**
   * Add overlay layers to the globe
   */
  addOverlayLayers() {
    // Bing Roads
    this.spaceGlobe.addLayer(new WorldWind.BingRoadsLayer(), {
      category: "overlay",
      displayName: "Road Networks",
      enabled: false,
      detailControl: 1.5,
      opacity: 0.8
    });

    // OpenStreetMap Overlay
    this.spaceGlobe.addLayerFromWms("https://tiles.maps.eox.at/wms", "overlay", {
      category: "overlay",
      displayName: "OpenStreetMap Overlay",
      enabled: false,
      opacity: 0.8
    });
  }

  /**
   * Add system layers for controls and debugging
   */
  addSystemLayers() {
    // Coordinate display
    this.spaceGlobe.addLayer(new WorldWind.CoordinatesDisplayLayer(this.spaceGlobe.worldWindow), {
      category: "setting",
      displayName: "Coordinate Display"
    });

    // View controls
    this.spaceGlobe.addLayer(new WorldWind.ViewControlsLayer(this.spaceGlobe.worldWindow), {
      category: "setting",
      displayName: "View Controls",
      enabled: false
    });

    // Compass
    this.spaceGlobe.addLayer(new WorldWind.CompassLayer(), {
      category: "setting",
      displayName: "Compass",
      enabled: false
    });

    // Star field
    this.spaceGlobe.addLayer(new WorldWind.StarFieldLayer(), {
      category: "setting",
      displayName: "Star Field",
      enabled: true
    });

    // Atmosphere
    this.spaceGlobe.addLayer(new WorldWind.AtmosphereLayer(), {
      category: "setting",
      displayName: "Atmosphere",
      enabled: true,
      time: new Date()
    });
  }

  /**
   * Create layers specifically for ISS visualization
   */
  createISSLayers() {
    // Orbit path layer
    this.orbitLayer = new WorldWind.RenderableLayer("ISS Orbit");
    this.spaceGlobe.addLayer(this.orbitLayer, {
      category: "data",
      displayName: "ISS Orbit Path",
      enabled: true
    });

    // ISS model layer
    this.issLayer = new WorldWind.RenderableLayer("ISS Model");
    this.spaceGlobe.addLayer(this.issLayer, {
      category: "data",
      displayName: "ISS Model",
      enabled: true
    });
  }

  /**
   * Set up layer management system
   */
  setupLayerManagement() {
    this.layerController = new LayerController(this.spaceGlobe);
    this.settingsController = new SettingsController(this.spaceGlobe);
  }

  /**
   * Initialize all application controllers
   */
  initializeControllers() {
    this.searchController = new SearchController(this.spaceGlobe, APP_CONFIG.MAPQUEST_API_KEY);
    
    // Apply Knockout.js bindings
    ko.applyBindings(this.layerController, document.getElementById('layer-controls'));
    ko.applyBindings(this.settingsController, document.getElementById('system-settings'));
    ko.applyBindings(this.searchController, document.getElementById('search-results-modal'));
  }

  /**
   * Load ISS data and create visualization
   */
  async loadISSData() {
    try {
      console.log('🛰️ Loading ISS data...');
      
      const tleData = await this.fetchTLEData();
      const { line1, line2 } = tleData;
      const tleString = `${line1}\n${line2}`;

      // Create orbit visualization
      await this.createOrbitVisualization(tleString);
      
      // Create ISS model
      await this.createISSModel(tleString);
      
      console.log('✅ ISS data loaded successfully');
      
    } catch (error) {
      console.error('❌ Failed to load ISS data:', error);
      this.showErrorMessage('Failed to load ISS data. Please check your internet connection.');
    }
  }

  /**
   * Fetch Two-Line Element (TLE) data for ISS
   */
  async fetchTLEData() {
    const response = await fetch(APP_CONFIG.TLE_ENDPOINT);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  }

  /**
   * Create orbit path visualization
   */
  async createOrbitVisualization(tleString) {
    const groundTracks = await tlejs.getGroundTracks({
      tle: tleString,
      stepMS: 60000, // 1 minute steps
      isLngLatFormat: false
    });

    const [previous, current, next] = groundTracks;
    const orbitPoints = [...previous, ...current, ...next].map(([lat, lon]) => 
      new WorldWind.Position(lat, lon, APP_CONFIG.ISS_ORBIT_ALTITUDE)
    );

    const orbitPath = new WorldWind.Path(orbitPoints, this.createOrbitAttributes());
    orbitPath.pathType = WorldWind.GREAT_CIRCLE;
    orbitPath.numSubSegments = 100;
    orbitPath.altitudeMode = WorldWind.ABSOLUTE;
    orbitPath.extrude = true;
    orbitPath.useSurfaceShapeFor2D = true;

    this.orbitLayer.addRenderable(orbitPath);
  }

  /**
   * Create visual attributes for orbit path
   */
  createOrbitAttributes() {
    const attributes = new WorldWind.ShapeAttributes(null);
    attributes.interiorColor = new WorldWind.Color(0, 0.8, 1, 0.3);
    attributes.outlineColor = new WorldWind.Color(0, 0.8, 1, 0.8);
    attributes.outlineWidth = 2;
    return attributes;
  }

  /**
   * Create 3D ISS model
   */
  async createISSModel(tleString) {
    const { lat, lng } = tlejs.getLatLngObj(tleString);
    
    const colladaLoader = new WorldWind.ColladaLoader(
      new WorldWind.Position(lat, lng, APP_CONFIG.ISS_ORBIT_ALTITUDE),
      { dirPath: 'images/' }
    );

    try {
      const issModel = await this.loadColladaModel(colladaLoader, "ISS.dae");
      issModel.scale = 2000000; // Scale factor for visibility
      this.issLayer.addRenderable(issModel);
      this.issModel = issModel;

      // Center view on ISS
      this.spaceGlobe.worldWindow.goTo(new WorldWind.Location(lat, lng));

      // Start real-time updates
      this.startRealTimeUpdates(tleString);

    } catch (error) {
      console.error('❌ Failed to load ISS model:', error);
      this.showErrorMessage('Failed to load ISS 3D model.');
    }
  }

  /**
   * Load Collada model with Promise wrapper
   */
  loadColladaModel(loader, modelPath) {
    return new Promise((resolve, reject) => {
      loader.load(modelPath, resolve, null, reject);
    });
  }

  /**
   * Start real-time ISS position updates
   */
  startRealTimeUpdates(tleString) {
    setInterval(() => {
      try {
        const { lat, lng } = tlejs.getLatLngObj(tleString);
        if (this.issModel) {
          this.issModel.position = new WorldWind.Position(lat, lng, APP_CONFIG.ISS_ORBIT_ALTITUDE);
          this.spaceGlobe.refreshLayer(this.issLayer);
        }
      } catch (error) {
        console.warn('⚠️ Failed to update ISS position:', error);
      }
    }, APP_CONFIG.REFRESH_INTERVAL);
  }

  /**
   * Set up application event listeners
   */
  setupEventListeners() {
    // Navigation collapse handlers
    $('.navbar-collapse a[role="button"]').click(() => {
      $('.navbar-collapse').collapse('hide');
    });

    // Panel close buttons
    $('.panel-close').on('click', function() {
      $(this).closest('.collapse').collapse('hide');
    });

    // Close buttons with data-dismiss
    $('button[data-dismiss="collapse"]').on('click', function() {
      $(this).closest('.collapse').collapse('hide');
    });

    // Prediction tool button
    const predictionButton = document.getElementById('prediction-tool');
    if (predictionButton) {
      predictionButton.addEventListener('click', () => {
        const modal = document.getElementById('prediction-modal');
        if (modal) {
          modal.hidden = false;
        }
      });
    }

    // Live stream button
    const liveStreamButton = document.getElementById('live-stream');
    if (liveStreamButton) {
      liveStreamButton.addEventListener('click', () => {
        const modal = document.getElementById('live-stream-modal');
        if (modal) {
          modal.hidden = false;
        }
      });
    }

    // ISS data toggle button
    const issDataButton = document.getElementById('iss-data-toggle');
    if (issDataButton) {
      issDataButton.addEventListener('click', () => {
        // This will be handled by the ISSDataManager
        console.log('ISS data toggle clicked');
      });
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        this.closeAllModals();
      }
    });
  }

  /**
   * Close all open modals
   */
  closeAllModals() {
    $('#search-results-modal').modal('hide');
    document.getElementById('prediction-modal').hidden = true;
    document.getElementById('live-stream-modal').hidden = true;
  }

  /**
   * Show error message to user
   */
  showErrorMessage(message) {
    // Create a simple notification system
    const notification = document.createElement('div');
    notification.className = 'alert alert-danger position-fixed';
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; max-width: 400px;';
    notification.innerHTML = `
      <i class="fas fa-exclamation-triangle"></i>
      <strong>Error:</strong> ${message}
      <button type="button" class="close" onclick="this.parentElement.remove()">
        <span>&times;</span>
      </button>
    `;
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 5000);
  }
}

// Initialize application when DOM is ready
$(document).ready(() => {
  const app = new SpaceTrackerApp();
  app.initialize();
});

// Export for potential external use
window.SpaceTrackerApp = SpaceTrackerApp;
