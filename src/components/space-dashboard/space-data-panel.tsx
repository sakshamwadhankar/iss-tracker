/**
 * Space Data Panel - ISS position and tracking data display
 * Shows real-time ISS position, distance, and tracking information
 */

import React from 'react';
import { ISSPositionData, UserLocation } from '../../types/space-tracker';
import { formatDateTime } from '../../utils/date-utils';

interface SpaceDataPanelProps {
  issPosition: ISSPositionData | null;
  userLocation: UserLocation | null;
  distance: number | null;
  formattedDistance: string;
  bearing: number | null;
  elevation: number | null;
  isVisible: boolean;
  className?: string;
}

const SpaceDataPanel: React.FC<SpaceDataPanelProps> = ({
  issPosition,
  userLocation,
  distance,
  formattedDistance,
  bearing,
  elevation,
  isVisible,
  className = ''
}) => {
  if (!issPosition) {
    return (
      <div className={`space-data-panel loading ${className}`}>
        <div className="panel-header">
          <h2>
            <i className="fas fa-satellite"></i>
            ISS Position
          </h2>
        </div>
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p>Loading ISS data...</p>
        </div>
      </div>
    );
  }

  const formatCoordinate = (value: number, precision: number = 4) => {
    return `${value.toFixed(precision)}°`;
  };

  const formatSpeed = (speed: number) => {
    return `${speed.toFixed(2)} km/h`;
  };

  const formatAltitude = (altitude: number) => {
    return `${altitude.toFixed(2)} km`;
  };

  const formatBearing = (bearing: number | null) => {
    if (bearing === null) return 'N/A';
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(bearing / 45) % 8;
    return `${directions[index]} (${bearing.toFixed(1)}°)`;
  };

  const formatElevation = (elevation: number | null) => {
    if (elevation === null) return 'N/A';
    return `${elevation.toFixed(1)}°`;
  };

  const getVisibilityStatus = () => {
    if (isVisible) {
      return { text: 'Visible', class: 'visible', icon: '👁️' };
    } else {
      return { text: 'Not Visible', class: 'not-visible', icon: '👁️‍🗨️' };
    }
  };

  const visibility = getVisibilityStatus();

  return (
    <div className={`space-data-panel ${className}`}>
      <div className="panel-header">
        <h2>
          <i className="fas fa-satellite"></i>
          ISS Position
        </h2>
        <div className="last-updated">
          {formatDateTime(new Date(issPosition.timestamp * 1000))}
        </div>
      </div>

      <div className="data-grid">
        <div className="data-item">
          <div className="data-icon">🌍</div>
          <div className="data-content">
            <div className="data-label">Latitude</div>
            <div className="data-value">{formatCoordinate(issPosition.latitude)}</div>
          </div>
        </div>

        <div className="data-item">
          <div className="data-icon">🌐</div>
          <div className="data-content">
            <div className="data-label">Longitude</div>
            <div className="data-value">{formatCoordinate(issPosition.longitude)}</div>
          </div>
        </div>

        <div className="data-item">
          <div className="data-icon">⬆️</div>
          <div className="data-content">
            <div className="data-label">Altitude</div>
            <div className="data-value">{formatAltitude(issPosition.altitude)}</div>
          </div>
        </div>

        <div className="data-item">
          <div className="data-icon">⚡</div>
          <div className="data-content">
            <div className="data-label">Velocity</div>
            <div className="data-value">{formatSpeed(issPosition.velocity)}</div>
          </div>
        </div>

        {userLocation && (
          <>
            <div className="data-item">
              <div className="data-icon">📏</div>
              <div className="data-content">
                <div className="data-label">Distance</div>
                <div className="data-value">{formattedDistance}</div>
              </div>
            </div>

            <div className="data-item">
              <div className="data-icon">🧭</div>
              <div className="data-content">
                <div className="data-label">Bearing</div>
                <div className="data-value">{formatBearing(bearing)}</div>
              </div>
            </div>

            <div className="data-item">
              <div className="data-icon">📐</div>
              <div className="data-content">
                <div className="data-label">Elevation</div>
                <div className="data-value">{formatElevation(elevation)}</div>
              </div>
            </div>

            <div className="data-item">
              <div className={`data-icon ${visibility.class}`}>
                {visibility.icon}
              </div>
              <div className="data-content">
                <div className="data-label">Visibility</div>
                <div className={`data-value ${visibility.class}`}>
                  {visibility.text}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="panel-footer">
        <div className="status-indicator">
          <div className="status-dot active"></div>
          <span>Live Data</span>
        </div>
      </div>
    </div>
  );
};

export default SpaceDataPanel;
