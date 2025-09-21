/**
 * SpaceGlobe - 3D Globe Visualization Controller
 * Manages WorldWind.js globe instance and layer operations
 */

export default class SpaceGlobe {
  constructor(canvasId, projectionType = null) {
    this.canvasId = canvasId;
    this.worldWindow = new WorldWind.WorldWindow(canvasId);
    this.nextLayerId = 1;
    this.categoryTimestamps = new Map();
    
    // Globe instances for different projections
    this.sphericalGlobe = this.worldWindow.globe;
    this.flatGlobe = null;
    
    // Initialize projection if specified
    if (projectionType) {
      this.setProjection(projectionType);
    }

    // Add background layer
    this.addLayer(new WorldWind.BMNGOneImageLayer(), {
      category: "background",
      minActiveAltitude: 0
    });
  }

  /**
   * Get available projection types
   */
  get availableProjections() {
    return [
      "3D",
      "Equirectangular",
      "Mercator",
      "North Polar",
      "South Polar",
      "North UPS",
      "South UPS",
      "North Gnomonic",
      "South Gnomonic"
    ];
  }

  /**
   * Change globe projection
   */
  setProjection(projectionName) {
    if (projectionName === "3D") {
      this.activateSphericalProjection();
    } else {
      this.activateFlatProjection(projectionName);
    }
  }

  /**
   * Activate spherical (3D) projection
   */
  activateSphericalProjection() {
    if (!this.sphericalGlobe) {
      this.sphericalGlobe = new WorldWind.Globe(new WorldWind.EarthElevationModel());
    }
    if (this.worldWindow.globe !== this.sphericalGlobe) {
      this.worldWindow.globe = this.sphericalGlobe;
    }
  }

  /**
   * Activate flat projection
   */
  activateFlatProjection(projectionName) {
    if (!this.flatGlobe) {
      this.flatGlobe = new WorldWind.Globe2D();
    }
    
    const projectionMap = {
      "Equirectangular": () => new WorldWind.ProjectionEquirectangular(),
      "Mercator": () => new WorldWind.ProjectionMercator(),
      "North Polar": () => new WorldWind.ProjectionPolarEquidistant("North"),
      "South Polar": () => new WorldWind.ProjectionPolarEquidistant("South"),
      "North UPS": () => new WorldWind.ProjectionUPS("North"),
      "South UPS": () => new WorldWind.ProjectionUPS("South"),
      "North Gnomonic": () => new WorldWind.ProjectionGnomonic("North"),
      "South Gnomonic": () => new WorldWind.ProjectionGnomonic("South")
    };

    const projectionFactory = projectionMap[projectionName];
    if (projectionFactory) {
      this.flatGlobe.projection = projectionFactory();
    }

    if (this.worldWindow.globe !== this.flatGlobe) {
      this.worldWindow.globe = this.flatGlobe;
    }
  }

  /**
   * Get layers by category
   */
  getLayersByCategory(category) {
    return this.worldWindow.layers.filter(layer => layer.category === category);
  }

  /**
   * Add layer to globe
   */
  addLayer(layer, options = {}) {
    // Apply options to layer
    if (options) {
      Object.keys(options).forEach(prop => {
        if (options.hasOwnProperty(prop)) {
          layer[prop] = options[prop];
        }
      });
    }

    // Set default category if not specified
    if (typeof layer.category === 'undefined') {
      layer.category = 'overlay';
    }

    // Assign unique ID
    layer.uniqueId = this.nextLayerId++;

    // Find insertion point based on category
    const categoryIndex = this.worldWindow.layers.findIndex(element => 
      element.category === layer.category
    );

    if (categoryIndex < 0) {
      this.worldWindow.addLayer(layer);
    } else {
      const categoryLayers = this.getLayersByCategory(layer.category);
      this.worldWindow.insertLayer(categoryIndex + categoryLayers.length, layer);
    }

    this.updateCategoryTimestamp(layer.category);
  }

  /**
   * Add layer from WMS service
   */
  addLayerFromWms(serviceAddress, layerName, options = {}) {
    const baseUrl = serviceAddress.split('?')[0];
    const capabilitiesUrl = `${baseUrl}?service=wms&request=getcapabilities`;
    
    const parseCapabilities = (xml) => {
      try {
        const wmsCapabilities = new WorldWind.WmsCapabilities(xml);
        const namedLayer = wmsCapabilities.getNamedLayer(layerName);
        
        if (!namedLayer) {
          throw new Error(`Layer '${layerName}' not found in WMS capabilities`);
        }

        const layerConfig = WorldWind.WmsLayer.formLayerConfiguration(namedLayer);
        const wmsLayer = new WorldWind.WmsLayer(layerConfig);
        
        options.bbox = layerConfig.sector;
        this.addLayer(wmsLayer, options);
        
      } catch (error) {
        console.error(`Failed to parse WMS capabilities for ${layerName}:`, error);
      }
    };

    this.fetchWmsCapabilities(capabilitiesUrl, parseCapabilities);
  }

  /**
   * Fetch WMS capabilities
   */
  fetchWmsCapabilities(url, callback) {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.onreadystatechange = () => {
      if (xhr.readyState === XMLHttpRequest.DONE) {
        if (xhr.status === 200) {
          callback(xhr.responseXML);
        } else {
          console.error(`Failed to fetch WMS capabilities: ${xhr.status}`);
        }
      }
    };
    xhr.send();
  }

  /**
   * Toggle layer visibility
   */
  toggleLayer(layer) {
    // For base layers, disable others in the same category
    if (layer.category === 'base') {
      this.worldWindow.layers.forEach(item => {
        if (item.category === 'base' && item !== layer) {
          item.enabled = false;
        }
      });
    }
    
    layer.enabled = !layer.enabled;
    this.worldWindow.redraw();
    this.updateCategoryTimestamp(layer.category);
  }

  /**
   * Refresh specific layer
   */
  refreshLayer(layer) {
    layer.refresh();
    this.worldWindow.redraw();
  }

  /**
   * Get category timestamp observable
   */
  getCategoryTimestamp(category) {
    if (!this.categoryTimestamps.has(category)) {
      this.categoryTimestamps.set(category, ko.observable());
    }
    return this.categoryTimestamps.get(category);
  }

  /**
   * Update category timestamp
   */
  updateCategoryTimestamp(category) {
    const timestamp = this.getCategoryTimestamp(category);
    timestamp(new Date());
  }

  /**
   * Find layer by display name
   */
  findLayerByName(name) {
    const layers = this.worldWindow.layers.filter(layer => 
      layer.displayName === name
    );
    return layers.length > 0 ? layers[0] : null;
  }

  /**
   * Zoom to layer extent
   */
  zoomToLayer(layer) {
    const layerSector = layer.bbox;
    if (!layerSector) {
      console.warn("No bounding box defined for layer:", layer.displayName);
      return;
    }

    // Check if layer covers full globe
    if (this.isFullGlobeSector(layerSector)) {
      console.log("Layer covers full globe, no zoom needed");
      return;
    }

    const center = this.calculateSectorCenter(layerSector);
    const range = this.calculateZoomRange(layerSector);
    const position = new WorldWind.Position(center.latitude, center.longitude, range);
    
    this.worldWindow.goTo(position);
  }

  /**
   * Check if sector covers full globe
   */
  isFullGlobeSector(sector) {
    return sector.maxLatitude >= 90 &&
           sector.minLatitude <= -90 &&
           sector.maxLongitude >= 180 &&
           sector.minLongitude <= -180;
  }

  /**
   * Calculate center of sector
   */
  calculateSectorCenter(sector) {
    const latitude = (sector.maxLatitude + sector.minLatitude) / 2;
    const longitude = (sector.maxLongitude + sector.minLongitude) / 2;
    return new WorldWind.Location(latitude, longitude);
  }

  /**
   * Calculate appropriate zoom range for sector
   */
  calculateZoomRange(sector) {
    const verticalSpan = sector.maxLatitude - sector.minLatitude;
    const horizontalSpan = sector.maxLongitude - sector.minLongitude;
    const diagonalAngle = Math.sqrt(
      Math.pow(verticalSpan, 2) + Math.pow(horizontalSpan, 2)
    );

    if (diagonalAngle >= 180) {
      return null; // Don't zoom for very large areas
    }

    const diagonalArcLength = (diagonalAngle / 360) * (2 * Math.PI * 6371000);
    return diagonalArcLength;
  }

  /**
   * Load layers into observable array
   */
  static loadLayersIntoArray(layers, observableArray) {
    observableArray.removeAll();
    layers.reverse().forEach(layer => observableArray.push(layer));
  }

  /**
   * Get current camera position
   */
  getCurrentPosition() {
    return this.worldWindow.navigator.position;
  }

  /**
   * Set camera position
   */
  setPosition(latitude, longitude, altitude) {
    const position = new WorldWind.Position(latitude, longitude, altitude);
    this.worldWindow.goTo(position);
  }

  /**
   * Animate camera to position
   */
  animateToPosition(latitude, longitude, altitude, duration = 2000) {
    const position = new WorldWind.Position(latitude, longitude, altitude);
    this.worldWindow.goTo(position, duration);
  }

  /**
   * Get all layers
   */
  getAllLayers() {
    return this.worldWindow.layers;
  }

  /**
   * Remove layer
   */
  removeLayer(layer) {
    this.worldWindow.removeLayer(layer);
    this.updateCategoryTimestamp(layer.category);
  }

  /**
   * Clear all layers of a category
   */
  clearCategory(category) {
    const layers = this.getLayersByCategory(category);
    layers.forEach(layer => this.removeLayer(layer));
  }

  /**
   * Redraw globe
   */
  redraw() {
    this.worldWindow.redraw();
  }
}
