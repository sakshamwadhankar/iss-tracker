/**
 * SettingsController - Manages application settings and debug options
 * Handles system settings and debug layers for the globe visualization
 */

import SpaceGlobe from './space-globe.js';

export default class SettingsController {
  constructor(spaceGlobe) {
    this.spaceGlobe = spaceGlobe;
    this.initializeObservables();
    this.setupSubscriptions();
    this.initializeSettings();
  }

  /**
   * Initialize Knockout.js observables
   */
  initializeObservables() {
    this.settingLayers = ko.observableArray(
      this.spaceGlobe.getLayersByCategory('setting').reverse()
    );
    
    this.debugLayers = ko.observableArray(
      this.spaceGlobe.getLayersByCategory('debug').reverse()
    );

    // Application settings
    this.showCoordinates = ko.observable(true);
    this.showCompass = ko.observable(false);
    this.showStars = ko.observable(true);
    this.showAtmosphere = ko.observable(true);
    this.autoRotate = ko.observable(false);
    this.rotationSpeed = ko.observable(1.0);
    this.animationSpeed = ko.observable(1.0);
    this.debugMode = ko.observable(false);
  }

  /**
   * Set up subscriptions for layer updates
   */
  setupSubscriptions() {
    // Subscribe to setting layer changes
    this.spaceGlobe.getCategoryTimestamp('setting').subscribe(() => {
      SpaceGlobe.loadLayersIntoArray(
        this.spaceGlobe.getLayersByCategory('setting'),
        this.settingLayers
      );
    });

    // Subscribe to debug layer changes
    this.spaceGlobe.getCategoryTimestamp('debug').subscribe(() => {
      SpaceGlobe.loadLayersIntoArray(
        this.spaceGlobe.getLayersByCategory('debug'),
        this.debugLayers
      );
    });

    // Subscribe to setting changes
    this.setupSettingSubscriptions();
  }

  /**
   * Set up subscriptions for setting changes
   */
  setupSettingSubscriptions() {
    this.showCoordinates.subscribe(enabled => {
      this.toggleSettingLayer('Coordinates', enabled);
    });

    this.showCompass.subscribe(enabled => {
      this.toggleSettingLayer('Compass', enabled);
    });

    this.showStars.subscribe(enabled => {
      this.toggleSettingLayer('Stars', enabled);
    });

    this.showAtmosphere.subscribe(enabled => {
      this.toggleSettingLayer('Atmosphere', enabled);
    });

    this.autoRotate.subscribe(enabled => {
      this.setAutoRotation(enabled);
    });

    this.rotationSpeed.subscribe(speed => {
      this.setRotationSpeed(speed);
    });

    this.animationSpeed.subscribe(speed => {
      this.setAnimationSpeed(speed);
    });

    this.debugMode.subscribe(enabled => {
      this.setDebugMode(enabled);
    });
  }

  /**
   * Initialize default settings
   */
  initializeSettings() {
    // Set initial states based on existing layers
    this.updateSettingStates();
  }

  /**
   * Update setting states based on current layer states
   */
  updateSettingStates() {
    const layers = this.spaceGlobe.getAllLayers();
    
    layers.forEach(layer => {
      const name = layer.displayName || layer.name || '';
      
      if (name.includes('Coordinate')) {
        this.showCoordinates(layer.enabled);
      } else if (name.includes('Compass')) {
        this.showCompass(layer.enabled);
      } else if (name.includes('Star')) {
        this.showStars(layer.enabled);
      } else if (name.includes('Atmosphere')) {
        this.showAtmosphere(layer.enabled);
      }
    });
  }

  /**
   * Toggle layer visibility
   */
  toggleLayer = (layer) => {
    this.spaceGlobe.toggleLayer(layer);
  };

  /**
   * Toggle specific setting layer by name
   */
  toggleSettingLayer(layerName, enabled) {
    const layer = this.findLayerByName(layerName);
    if (layer && layer.enabled !== enabled) {
      layer.enabled = enabled;
      this.spaceGlobe.redraw();
    }
  }

  /**
   * Find layer by name (partial match)
   */
  findLayerByName(name) {
    const layers = this.spaceGlobe.getAllLayers();
    return layers.find(layer => 
      (layer.displayName || layer.name || '').toLowerCase().includes(name.toLowerCase())
    );
  }

  /**
   * Set auto-rotation
   */
  setAutoRotation(enabled) {
    if (enabled) {
      this.startAutoRotation();
    } else {
      this.stopAutoRotation();
    }
  }

  /**
   * Start auto-rotation
   */
  startAutoRotation() {
    this.stopAutoRotation(); // Clear any existing rotation
    
    const rotate = () => {
      const navigator = this.spaceGlobe.worldWindow.navigator;
      const currentHeading = navigator.heading;
      const newHeading = (currentHeading + this.rotationSpeed() * 0.5) % 360;
      navigator.heading = newHeading;
      this.spaceGlobe.redraw();
      
      if (this.autoRotate()) {
        this.rotationInterval = setTimeout(rotate, 50);
      }
    };
    
    rotate();
  }

  /**
   * Stop auto-rotation
   */
  stopAutoRotation() {
    if (this.rotationInterval) {
      clearTimeout(this.rotationInterval);
      this.rotationInterval = null;
    }
  }

  /**
   * Set rotation speed
   */
  setRotationSpeed(speed) {
    this.rotationSpeed(Math.max(0.1, Math.min(5.0, speed)));
  }

  /**
   * Set animation speed
   */
  setAnimationSpeed(speed) {
    this.animationSpeed(Math.max(0.1, Math.min(3.0, speed)));
    
    // Apply to any existing animations
    const navigator = this.spaceGlobe.worldWindow.navigator;
    if (navigator.animationSpeed !== undefined) {
      navigator.animationSpeed = speed;
    }
  }

  /**
   * Set debug mode
   */
  setDebugMode(enabled) {
    this.debugMode(enabled);
    
    // Toggle debug layers
    const debugLayers = this.spaceGlobe.getLayersByCategory('debug');
    debugLayers.forEach(layer => {
      layer.enabled = enabled;
    });
    
    this.spaceGlobe.redraw();
  }

  /**
   * Reset all settings to defaults
   */
  resetToDefaults() {
    this.showCoordinates(true);
    this.showCompass(false);
    this.showStars(true);
    this.showAtmosphere(true);
    this.autoRotate(false);
    this.rotationSpeed(1.0);
    this.animationSpeed(1.0);
    this.debugMode(false);
  }

  /**
   * Export settings configuration
   */
  exportSettings() {
    const settings = {
      showCoordinates: this.showCoordinates(),
      showCompass: this.showCompass(),
      showStars: this.showStars(),
      showAtmosphere: this.showAtmosphere(),
      autoRotate: this.autoRotate(),
      rotationSpeed: this.rotationSpeed(),
      animationSpeed: this.animationSpeed(),
      debugMode: this.debugMode()
    };

    return JSON.stringify(settings, null, 2);
  }

  /**
   * Import settings configuration
   */
  importSettings(settingsString) {
    try {
      const settings = JSON.parse(settingsString);
      
      if (settings.showCoordinates !== undefined) this.showCoordinates(settings.showCoordinates);
      if (settings.showCompass !== undefined) this.showCompass(settings.showCompass);
      if (settings.showStars !== undefined) this.showStars(settings.showStars);
      if (settings.showAtmosphere !== undefined) this.showAtmosphere(settings.showAtmosphere);
      if (settings.autoRotate !== undefined) this.autoRotate(settings.autoRotate);
      if (settings.rotationSpeed !== undefined) this.rotationSpeed(settings.rotationSpeed);
      if (settings.animationSpeed !== undefined) this.animationSpeed(settings.animationSpeed);
      if (settings.debugMode !== undefined) this.debugMode(settings.debugMode);
      
      return true;
    } catch (error) {
      console.error('Failed to import settings:', error);
      return false;
    }
  }

  /**
   * Get current camera information
   */
  getCameraInfo() {
    const navigator = this.spaceGlobe.worldWindow.navigator;
    return {
      latitude: navigator.lookAtLocation.latitude,
      longitude: navigator.lookAtLocation.longitude,
      altitude: navigator.range,
      heading: navigator.heading,
      tilt: navigator.tilt,
      roll: navigator.roll
    };
  }

  /**
   * Set camera position
   */
  setCameraPosition(latitude, longitude, altitude, heading = 0, tilt = 0) {
    const position = new WorldWind.Position(latitude, longitude, altitude);
    const navigator = this.spaceGlobe.worldWindow.navigator;
    
    navigator.lookAtLocation = position;
    navigator.range = altitude;
    navigator.heading = heading;
    navigator.tilt = tilt;
    
    this.spaceGlobe.redraw();
  }

  /**
   * Animate camera to position
   */
  animateCameraTo(latitude, longitude, altitude, duration = 2000) {
    const position = new WorldWind.Position(latitude, longitude, altitude);
    this.spaceGlobe.worldWindow.goTo(position, duration);
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats() {
    const stats = {
      frameRate: this.getFrameRate(),
      layerCount: this.spaceGlobe.getAllLayers().length,
      enabledLayers: this.spaceGlobe.getAllLayers().filter(layer => layer.enabled).length,
      memoryUsage: this.getMemoryUsage()
    };

    return stats;
  }

  /**
   * Get current frame rate (approximate)
   */
  getFrameRate() {
    // This is a simplified implementation
    // In a real application, you'd track frame times
    return 60; // Placeholder
  }

  /**
   * Get memory usage (if available)
   */
  getMemoryUsage() {
    if (performance.memory) {
      return {
        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
      };
    }
    return null;
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.stopAutoRotation();
  }
}
