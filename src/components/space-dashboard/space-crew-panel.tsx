/**
 * Space Crew Panel - Astronaut and crew information display
 * Shows current crew members aboard the International Space Station
 */

import React from 'react';
import { CrewData, AstronautInfo } from '../../types/space-tracker';

interface SpaceCrewPanelProps {
  crewData: CrewData;
  className?: string;
}

const SpaceCrewPanel: React.FC<SpaceCrewPanelProps> = ({
  crewData,
  className = ''
}) => {
  const formatLastUpdated = (date: Date | undefined) => {
    if (!date) return 'Unknown';
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(date);
  };

  const getCraftIcon = (craft: string) => {
    const craftIcons: { [key: string]: string } = {
      'ISS': '🛰️',
      'Soyuz': '🚀',
      'Dragon': '🐉',
      'Starliner': '⭐',
      'Shenzhou': '🇨🇳',
      'default': '👨‍🚀'
    };
    return craftIcons[craft] || craftIcons.default;
  };

  const getCraftColor = (craft: string) => {
    const craftColors: { [key: string]: string } = {
      'ISS': 'var(--electric-cyan)',
      'Soyuz': 'var(--neon-green)',
      'Dragon': 'var(--electric-blue)',
      'Starliner': 'var(--neon-pink)',
      'Shenzhou': 'var(--cosmic-gray)',
      'default': 'var(--cosmic-white)'
    };
    return craftColors[craft] || craftColors.default;
  };

  const groupCrewByCraft = (crew: AstronautInfo[]) => {
    return crew.reduce((groups, astronaut) => {
      const craft = astronaut.craft;
      if (!groups[craft]) {
        groups[craft] = [];
      }
      groups[craft].push(astronaut);
      return groups;
    }, {} as { [craft: string]: AstronautInfo[] });
  };

  const crewGroups = groupCrewByCraft(crewData.people);

  return (
    <div className={`space-crew-panel ${className}`}>
      <div className="panel-header">
        <h2>
          <i className="fas fa-users"></i>
          Crew in Space
        </h2>
        <div className="crew-count">
          {crewData.number} {crewData.number === 1 ? 'Person' : 'People'}
        </div>
      </div>

      <div className="crew-content">
        {Object.keys(crewGroups).length === 0 ? (
          <div className="no-crew">
            <div className="no-crew-icon">👨‍🚀</div>
            <p>No crew data available</p>
          </div>
        ) : (
          <div className="crew-groups">
            {Object.entries(crewGroups).map(([craft, astronauts]) => (
              <div key={craft} className="crew-group">
                <div className="craft-header">
                  <div className="craft-icon">
                    {getCraftIcon(craft)}
                  </div>
                  <div className="craft-name">{craft}</div>
                  <div className="craft-count">{astronauts.length}</div>
                </div>
                
                <div className="astronauts-list">
                  {astronauts.map((astronaut, index) => (
                    <div key={`${astronaut.name}-${index}`} className="astronaut-item">
                      <div className="astronaut-avatar">
                        <i className="fas fa-user-astronaut"></i>
                      </div>
                      <div className="astronaut-info">
                        <div className="astronaut-name">{astronaut.name}</div>
                        {astronaut.nationality && (
                          <div className="astronaut-nationality">
                            {astronaut.nationality}
                          </div>
                        )}
                        {astronaut.mission && (
                          <div className="astronaut-mission">
                            {astronaut.mission}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="panel-footer">
        <div className="last-updated">
          <i className="fas fa-clock"></i>
          <span>Updated: {formatLastUpdated(crewData.lastUpdated)}</span>
        </div>
        {crewData.message && (
          <div className="crew-message">
            {crewData.message}
          </div>
        )}
      </div>
    </div>
  );
};

export default SpaceCrewPanel;
