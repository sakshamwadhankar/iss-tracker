/**
 * LayerController - Manages map layer visibility and interactions
 * Handles base layers and overlay layers for the globe visualization
 */

import SpaceGlobe from './space-globe.js';

export default class LayerController {
  constructor(spaceGlobe) {
    this.spaceGlobe = spaceGlobe;
    this.initializeObservables();
    this.setupSubscriptions();
  }

  /**
   * Initialize Knockout.js observables
   */
  initializeObservables() {
    this.baseLayers = ko.observableArray(
      this.spaceGlobe.getLayersByCategory('base').reverse()
    );

    this.overlayLayers = ko.observableArray(
      this.spaceGlobe.getLayersByCategory('overlay').reverse()
    );
  }

  /**
   * Set up subscriptions for layer updates
   */
  setupSubscriptions() {
    // Subscribe to base layer changes
    this.spaceGlobe.getCategoryTimestamp('base').subscribe(() => {
      SpaceGlobe.loadLayersIntoArray(
        this.spaceGlobe.getLayersByCategory('base'),
        this.baseLayers
      );
    });

    // Subscribe to overlay layer changes
    this.spaceGlobe.getCategoryTimestamp('overlay').subscribe(() => {
      SpaceGlobe.loadLayersIntoArray(
        this.spaceGlobe.getLayersByCategory('overlay'),
        this.overlayLayers
      );
    });
  }

  /**
   * Toggle layer visibility
   */
  toggleLayer = (layer) => {
    console.log('LayerController: Toggling layer', layer.displayName);
    this.spaceGlobe.toggleLayer(layer);

    // If layer is enabled and has a bounding box, zoom to it
    if (layer.enabled && layer.bbox) {
      this.spaceGlobe.zoomToLayer(layer);
    }
  };

  /**
   * Get layer display name
   */
  getLayerDisplayName(layer) {
    return layer.displayName || layer.name || 'Unnamed Layer';
  }

  /**
   * Check if layer is enabled
   */
  isLayerEnabled(layer) {
    return layer.enabled === true;
  }

  /**
   * Get layer category
   */
  getLayerCategory(layer) {
    return layer.category || 'overlay';
  }

  /**
   * Get layer opacity
   */
  getLayerOpacity(layer) {
    return layer.opacity || 1.0;
  }

  /**
   * Set layer opacity
   */
  setLayerOpacity(layer, opacity) {
    if (layer.opacity !== undefined) {
      layer.opacity = Math.max(0, Math.min(1, opacity));
      this.spaceGlobe.redraw();
    }
  }

  /**
   * Get layer visibility status text
   */
  getLayerStatusText(layer) {
    return this.isLayerEnabled(layer) ? 'Visible' : 'Hidden';
  }

  /**
   * Get layer type icon
   */
  getLayerIcon(layer) {
    const category = this.getLayerCategory(layer);
    const iconMap = {
      'base': 'fas fa-globe',
      'overlay': 'fas fa-layer-group',
      'data': 'fas fa-database',
      'setting': 'fas fa-cog',
      'debug': 'fas fa-bug'
    };
    return iconMap[category] || 'fas fa-layer-group';
  }

  /**
   * Get layer description
   */
  getLayerDescription(layer) {
    const category = this.getLayerCategory(layer);
    const descriptions = {
      'base': 'Base map layer providing the fundamental geographic reference',
      'overlay': 'Overlay layer with additional geographic information',
      'data': 'Data visualization layer showing specific information',
      'setting': 'System setting layer for application controls',
      'debug': 'Debug layer for development and troubleshooting'
    };
    return descriptions[category] || 'Map layer';
  }

  /**
   * Refresh all layers
   */
  refreshAllLayers() {
    this.spaceGlobe.getAllLayers().forEach(layer => {
      this.spaceGlobe.refreshLayer(layer);
    });
  }

  /**
   * Reset layers to default state
   */
  resetToDefaults() {
    // Enable only the first base layer
    const baseLayers = this.spaceGlobe.getLayersByCategory('base');
    baseLayers.forEach((layer, index) => {
      layer.enabled = index === 0;
    });

    // Disable all overlay layers
    const overlayLayers = this.spaceGlobe.getLayersByCategory('overlay');
    overlayLayers.forEach(layer => {
      layer.enabled = false;
    });

    this.spaceGlobe.redraw();
  }

  /**
   * Get layer statistics
   */
  getLayerStats() {
    const allLayers = this.spaceGlobe.getAllLayers();
    const stats = {
      total: allLayers.length,
      enabled: allLayers.filter(layer => layer.enabled).length,
      byCategory: {}
    };

    // Count by category
    allLayers.forEach(layer => {
      const category = this.getLayerCategory(layer);
      if (!stats.byCategory[category]) {
        stats.byCategory[category] = { total: 0, enabled: 0 };
      }
      stats.byCategory[category].total++;
      if (layer.enabled) {
        stats.byCategory[category].enabled++;
      }
    });

    return stats;
  }

  /**
   * Export layer configuration
   */
  exportLayerConfig() {
    const allLayers = this.spaceGlobe.getAllLayers();
    const config = allLayers.map(layer => ({
      name: layer.displayName || layer.name,
      category: this.getLayerCategory(layer),
      enabled: this.isLayerEnabled(layer),
      opacity: this.getLayerOpacity(layer)
    }));

    return JSON.stringify(config, null, 2);
  }

  /**
   * Import layer configuration
   */
  importLayerConfig(configString) {
    try {
      const config = JSON.parse(configString);

      config.forEach(layerConfig => {
        const layer = this.spaceGlobe.findLayerByName(layerConfig.name);
        if (layer) {
          layer.enabled = layerConfig.enabled;
          if (layerConfig.opacity !== undefined) {
            this.setLayerOpacity(layer, layerConfig.opacity);
          }
        }
      });

      this.spaceGlobe.redraw();
      return true;
    } catch (error) {
      console.error('Failed to import layer configuration:', error);
      return false;
    }
  }

  /**
   * Toggle all layers in category
   */
  toggleCategory(category, enabled) {
    const layers = this.spaceGlobe.getLayersByCategory(category);
    layers.forEach(layer => {
      layer.enabled = enabled;
    });
    this.spaceGlobe.redraw();
  }

  /**
   * Show only specific layer (hide others in same category)
   */
  showOnlyLayer(targetLayer) {
    const category = this.getLayerCategory(targetLayer);
    const categoryLayers = this.spaceGlobe.getLayersByCategory(category);

    categoryLayers.forEach(layer => {
      layer.enabled = (layer === targetLayer);
    });

    this.spaceGlobe.redraw();
  }

  /**
   * Get layer loading status
   */
  getLayerLoadingStatus(layer) {
    if (layer.isLoading) {
      return 'Loading...';
    } else if (layer.loadError) {
      return 'Error loading';
    } else {
      return 'Ready';
    }
  }

  /**
   * Retry loading failed layer
   */
  retryLayer(layer) {
    if (layer.loadError) {
      this.spaceGlobe.refreshLayer(layer);
    }
  }
}
