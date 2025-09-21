/**
 * Space Dashboard - Main dashboard component for space tracking
 * Central component that orchestrates all space tracking features
 */

import React from 'react';
import { ISSPositionData, UserLocation } from '../../types/space-tracker';
import SpaceDataPanel from './space-data-panel';
import SpaceCrewPanel from './space-crew-panel';
import { useISSDistance } from '../../hooks/use-space-data';

interface SpaceDashboardProps {
  issPosition: ISSPositionData | null;
  userLocation: UserLocation | null;
  crewData?: any;
  className?: string;
}

const SpaceDashboard: React.FC<SpaceDashboardProps> = ({
  issPosition,
  userLocation,
  crewData,
  className = ''
}) => {
  const { distance, formattedDistance, bearing, elevation, isVisible } = useISSDistance(
    issPosition,
    userLocation || { latitude: null, longitude: null, altitude: null, accuracy: null, error: null }
  );

  return (
    <div className={`space-dashboard ${className}`}>
      <div className="dashboard-grid">
        <SpaceDataPanel
          issPosition={issPosition}
          userLocation={userLocation}
          distance={distance}
          formattedDistance={formattedDistance}
          bearing={bearing}
          elevation={elevation}
          isVisible={isVisible}
        />
        {crewData && (
          <SpaceCrewPanel
            crewData={crewData}
            className="crew-panel"
          />
        )}
      </div>
    </div>
  );
};

export default SpaceDashboard;
