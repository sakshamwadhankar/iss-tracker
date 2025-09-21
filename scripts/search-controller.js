/**
 * SearchController - Manages location search and preview functionality
 * Handles geocoding, search results, and location preview on the globe
 */

import SpaceGlobe from './space-globe.js';

export default class SearchController {
  constructor(primaryGlobe, mapQuestApiKey) {
    this.primaryGlobe = primaryGlobe;
    this.mapQuestApiKey = mapQuestApiKey;
    this.previewGlobe = null;
    this.searchResults = ko.observableArray();
    this.selected = ko.observable();
    this.showApiWarning = ko.observable(!mapQuestApiKey || mapQuestApiKey === "");
    
    this.initializePreviewGlobe();
    this.setupSearchResults();
  }

  /**
   * Initialize preview globe for search results
   */
  initializePreviewGlobe() {
    this.previewGlobe = new SpaceGlobe("preview-canvas", "Mercator");
    
    // Add base layer for preview
    const bingRoadsLayer = new WorldWind.BingRoadsLayer();
    bingRoadsLayer.detailControl = 1.25;
    this.previewGlobe.addLayer(bingRoadsLayer);
    
    // Add results layer
    this.resultsLayer = new WorldWind.RenderableLayer("Search Results");
    this.previewGlobe.addLayer(this.resultsLayer);
  }

  /**
   * Set up search results visualization
   */
  setupSearchResults() {
    // Configure placemark attributes for search results
    this.placemarkAttributes = new WorldWind.PlacemarkAttributes(null);
    this.placemarkAttributes.imageSource = WorldWind.configuration.baseUrl + "images/pushpins/castshadow-red.png";
    this.placemarkAttributes.imageScale = 0.5;
    this.placemarkAttributes.imageOffset = new WorldWind.Offset(
      WorldWind.OFFSET_FRACTION, 0.3,
      WorldWind.OFFSET_FRACTION, 0.0
    );
  }

  /**
   * Preview search results
   */
  previewResults = (results) => {
    if (!results || results.length === 0) {
      console.warn('No search results to preview');
      return;
    }

    console.log(`Previewing ${results.length} search results`);
    
    // Clear previous results
    this.searchResults.removeAll();
    this.resultsLayer.removeAllRenderables();
    
    // Add new results
    results.forEach(item => {
      this.searchResults.push(item);
      this.addResultPlacemark(item);
    });

    // Select first result
    if (results.length > 0) {
      this.previewSelection(results[0]);
    }

    // Show modal
    $('#search-results-modal').modal('show');
    $('#search-results-modal .modal-body-table').scrollTop(0);
  };

  /**
   * Add placemark for search result
   */
  addResultPlacemark(item) {
    try {
      const latitude = parseFloat(item.lat);
      const longitude = parseFloat(item.lon);
      
      if (isNaN(latitude) || isNaN(longitude)) {
        console.warn('Invalid coordinates for search result:', item);
        return;
      }

      const placemark = new WorldWind.Placemark(
        new WorldWind.Position(latitude, longitude, 100)
      );
      
      placemark.altitudeMode = WorldWind.RELATIVE_TO_GROUND;
      placemark.displayName = item.display_name || item.name || 'Unknown Location';
      placemark.attributes = this.placemarkAttributes;
      
      // Add custom properties
      placemark.userProperties = {
        type: item.type || 'location',
        originalData: item
      };
      
      this.resultsLayer.addRenderable(placemark);
      
    } catch (error) {
      console.error('Failed to add placemark for search result:', error);
    }
  }

  /**
   * Preview specific selection
   */
  previewSelection = (selection) => {
    try {
      const latitude = parseFloat(selection.lat);
      const longitude = parseFloat(selection.lon);
      
      if (isNaN(latitude) || isNaN(longitude)) {
        console.warn('Invalid coordinates for selection:', selection);
        return;
      }

      const location = new WorldWind.Location(latitude, longitude);
      this.selected(location);
      this.previewGlobe.setPosition(latitude, longitude, 10000);
      
    } catch (error) {
      console.error('Failed to preview selection:', error);
    }
  };

  /**
   * Go to selected location on main globe
   */
  gotoSelected = () => {
    const selectedLocation = this.selected();
    if (selectedLocation) {
      this.primaryGlobe.setPosition(
        selectedLocation.latitude,
        selectedLocation.longitude,
        10000
      );
      $('#search-results-modal').modal('hide');
    }
  };

  /**
   * Search for locations using geocoding service
   */
  async searchLocations(query, options = {}) {
    const {
      limit = 10,
      countryCode = null,
      boundingBox = null
    } = options;

    try {
      let searchUrl = 'https://nominatim.openstreetmap.org/search';
      const params = new URLSearchParams({
        q: query,
        format: 'jsonv2',
        limit: limit.toString(),
        addressdetails: '1',
        extratags: '1'
      });

      if (countryCode) {
        params.append('countrycodes', countryCode);
      }

      if (boundingBox) {
        params.append('bounded', '1');
        params.append('viewbox', boundingBox);
      }

      searchUrl += '?' + params.toString();

      const response = await fetch(searchUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'SpaceTracker Pro/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`Search request failed: ${response.status}`);
      }

      const results = await response.json();
      return this.processSearchResults(results);

    } catch (error) {
      console.error('Location search failed:', error);
      throw error;
    }
  }

  /**
   * Process raw search results
   */
  processSearchResults(rawResults) {
    return rawResults.map(result => ({
      display_name: result.display_name,
      name: result.name,
      lat: result.lat,
      lon: result.lon,
      type: result.type || result.class || 'location',
      importance: result.importance || 0,
      address: result.address || {},
      boundingbox: result.boundingbox || null
    })).sort((a, b) => (b.importance || 0) - (a.importance || 0));
  }

  /**
   * Reverse geocode coordinates to address
   */
  async reverseGeocode(latitude, longitude) {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=jsonv2&addressdetails=1`;
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'SpaceTracker Pro/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`Reverse geocoding failed: ${response.status}`);
      }

      const result = await response.json();
      return this.processReverseGeocodeResult(result);

    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      throw error;
    }
  }

  /**
   * Process reverse geocoding result
   */
  processReverseGeocodeResult(result) {
    const address = result.address || {};
    return {
      display_name: result.display_name,
      address: {
        house_number: address.house_number,
        road: address.road,
        neighbourhood: address.neighbourhood,
        suburb: address.suburb,
        city: address.city || address.town || address.village,
        county: address.county,
        state: address.state || address.region,
        postcode: address.postcode,
        country: address.country,
        country_code: address.country_code
      },
      coordinates: {
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon)
      }
    };
  }

  /**
   * Search with MapQuest API (if available)
   */
  async searchWithMapQuest(query, options = {}) {
    if (!this.mapQuestApiKey) {
      throw new Error('MapQuest API key not configured');
    }

    try {
      const url = `https://www.mapquestapi.com/geocoding/v1/address?key=${this.mapQuestApiKey}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          location: query,
          maxResults: options.limit || 10,
          thumbMaps: false
        })
      });

      if (!response.ok) {
        throw new Error(`MapQuest search failed: ${response.status}`);
      }

      const data = await response.json();
      return this.processMapQuestResults(data);

    } catch (error) {
      console.error('MapQuest search failed:', error);
      throw error;
    }
  }

  /**
   * Process MapQuest search results
   */
  processMapQuestResults(data) {
    if (!data.results || data.results.length === 0) {
      return [];
    }

    return data.results[0].locations.map(location => ({
      display_name: location.street + ', ' + location.adminArea5 + ', ' + location.adminArea3 + ', ' + location.adminArea1,
      name: location.street,
      lat: location.latLng.lat.toString(),
      lon: location.latLng.lng.toString(),
      type: 'address',
      importance: location.geocodeQuality === 'A' ? 1 : 0.5,
      address: {
        street: location.street,
        city: location.adminArea5,
        state: location.adminArea3,
        country: location.adminArea1,
        postal_code: location.postalCode
      }
    }));
  }

  /**
   * Get search suggestions
   */
  async getSearchSuggestions(query, limit = 5) {
    if (query.length < 2) {
      return [];
    }

    try {
      const results = await this.searchLocations(query, { limit });
      return results.slice(0, limit);
    } catch (error) {
      console.error('Failed to get search suggestions:', error);
      return [];
    }
  }

  /**
   * Clear search results
   */
  clearResults() {
    this.searchResults.removeAll();
    this.resultsLayer.removeAllRenderables();
    this.selected(null);
  }

  /**
   * Get search statistics
   */
  getSearchStats() {
    return {
      totalResults: this.searchResults().length,
      hasSelection: this.selected() !== null,
      apiConfigured: !!this.mapQuestApiKey
    };
  }

  /**
   * Export search results
   */
  exportResults() {
    const results = this.searchResults().map(result => ({
      name: result.display_name,
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      type: result.type,
      importance: result.importance
    }));

    return JSON.stringify(results, null, 2);
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.clearResults();
    if (this.previewGlobe) {
      // Cleanup preview globe if needed
    }
  }
}
