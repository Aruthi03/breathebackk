// Geographical Air Quality Map using Leaflet & OpenStreetMap
// Atmospheric Field Journal design: clearly labelled benchmark stations, custom pins, and station telemetry.
import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Icon } from './Icons';
import { BENCHMARK_CITIES } from '../data/mockAirData';
import { getAQIInfo, AQI_LEVELS } from '../utils/aqiUtils';

export const AirMap = ({ city, onSelectCity, selectedCityKey }) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);

  const [selectedStation, setSelectedStation] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const activeCity = city || BENCHMARK_CITIES[selectedCityKey] || BENCHMARK_CITIES.delhi;
  const stations = activeCity.stations || [];

  // Filter stations by search term
  const filteredStations = stations.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.area && s.area.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (s.stationType && s.stationType.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Initialize and update Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Create map instance if not exists
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [activeCity.coords?.lat || 28.6139, activeCity.coords?.lng || 77.2090],
        zoom: activeCity.defaultZoom || 11,
        zoomControl: true,
        scrollWheelZoom: true
      });

      // OpenStreetMap standard tile layer with proper attribution (100% public, no API key required)
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
      }).addTo(map);

      // Layer group for station markers
      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    } else {
      // Pan to active city
      mapInstanceRef.current.setView(
        [activeCity.coords?.lat || 28.6139, activeCity.coords?.lng || 77.2090],
        activeCity.defaultZoom || 11,
        { animate: true, duration: 0.8 }
      );
    }

    // Refresh markers
    if (markersLayerRef.current) {
      markersLayerRef.current.clearLayers();

      stations.forEach(station => {
        const aqiInfo = getAQIInfo(station.aqi);

        // Custom HTML pin with station AQI number
        const customIcon = L.divIcon({
          className: 'leaflet-station-marker-wrapper',
          html: `
            <div class="map-station-marker" style="background-color: ${aqiInfo.color};" title="${station.name}: AQI ${station.aqi}">
              <span class="marker-aqi-number">${station.aqi}</span>
            </div>
          `,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
          popupAnchor: [0, -18]
        });

        const marker = L.marker([station.lat, station.lng], { icon: customIcon });

        // Popup and click handling
        marker.on('click', () => {
          setSelectedStation(station);
          if (mapInstanceRef.current) {
            mapInstanceRef.current.panTo([station.lat, station.lng], { animate: true });
          }
        });

        markersLayerRef.current.addLayer(marker);
      });
    }
  }, [activeCity]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const handleStationClick = (st) => {
    setSelectedStation(st);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([st.lat, st.lng], 13, { animate: true });
    }
  };

  return (
    <div className="air-map-layout">
      {/* Editorial Section Header */}
      <div className="map-view-header">
        <div>
          <span className="field-tag">Geographical Telemetry</span>
          <h2 className="editorial-title">Air Monitoring Station Network</h2>
          <p className="editorial-subtitle">
            Explore municipal benchmark stations, urban background baseline sites, and roadside monitoring canyons in <strong>{activeCity.name}</strong>.
          </p>
        </div>

        {/* City Quick Switcher */}
        <div className="map-city-controls">
          <label className="field-label" htmlFor="mapCitySelect">Active Territory:</label>
          <select
            id="mapCitySelect"
            value={activeCity.id}
            onChange={(e) => onSelectCity && onSelectCity(e.target.value)}
            className="field-select map-select"
          >
            {Object.keys(BENCHMARK_CITIES).map(k => (
              <option key={k} value={k}>
                {BENCHMARK_CITIES[k].name} ({BENCHMARK_CITIES[k].country})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Benchmark Disclaimer Notice */}
      <div className="field-notice-strip">
        <Icon name="info" size={16} color="var(--accent-terracotta)" />
        <span className="notice-text">
          <strong>Benchmark Telemetry Archive:</strong> All monitoring stations and pollutant readings displayed are representative benchmark simulation data compiled for research and decision modeling. Live sensor telemetry is not claimed.
        </span>
      </div>

      {/* Main Map Workspace: Sidebar + Leaflet Map */}
      <div className="map-workspace-grid">
        {/* Left Station Explorer Drawer */}
        <div className="map-stations-drawer">
          <div className="drawer-header">
            <h3 className="drawer-title">Stations in {activeCity.name}</h3>
            <span className="station-count-pill">{filteredStations.length} recorded</span>
          </div>

          <div className="station-search-box">
            <Icon name="map-pin" size={14} color="var(--text-tertiary)" />
            <input
              type="text"
              placeholder="Filter stations by name or type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="station-search-input"
            />
            {searchTerm && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => setSearchTerm("")}
              >
                ✕
              </button>
            )}
          </div>

          <div className="stations-list">
            {filteredStations.length === 0 && (
              <div className="no-stations-empty">
                <Icon name="compass" size={20} color="var(--text-tertiary)" />
                <span>No monitoring stations match "{searchTerm}".</span>
              </div>
            )}
            {filteredStations.map(st => {
              const aqiInfo = getAQIInfo(st.aqi);
              const isSelected = selectedStation?.id === st.id;

              return (
                <div
                  key={st.id}
                  className={`station-item-card ${isSelected ? "selected" : ""}`}
                  onClick={() => handleStationClick(st)}
                  tabIndex={0}
                  role="button"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') handleStationClick(st);
                  }}
                >
                  <div className="station-badge" style={{ backgroundColor: aqiInfo.color }}>
                    {st.aqi}
                  </div>
                  <div className="station-meta">
                    <h4 className="station-name">{st.name}</h4>
                    <span className="station-type">{st.stationType} • {st.area}</span>
                    <span className="station-pollutant">
                      Dominant: <strong>{st.primaryPollutant}</strong> ({st.pm25} µg/m³)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Station Deep Details */}
          {selectedStation && (
            <div className="station-detail-dossier">
              <div className="dossier-header">
                <div>
                  <span className="field-tag">Station Dossier</span>
                  <h4 className="dossier-title">{selectedStation.name}</h4>
                  <span className="dossier-sub">{selectedStation.stationType} — {selectedStation.area}</span>
                </div>
                <button
                  type="button"
                  className="close-dossier-btn"
                  onClick={() => setSelectedStation(null)}
                  aria-label="Close station dossier"
                >
                  ✕
                </button>
              </div>

              <div className="dossier-metrics-grid">
                <div className="dossier-metric-box">
                  <span className="dossier-metric-label">AQI Reading</span>
                  <span className="dossier-metric-val" style={{ color: getAQIInfo(selectedStation.aqi).color }}>
                    {selectedStation.aqi}
                  </span>
                  <span className="dossier-metric-status">{selectedStation.status}</span>
                </div>
                <div className="dossier-metric-box">
                  <span className="dossier-metric-label">PM2.5 Level</span>
                  <span className="dossier-metric-val">{selectedStation.pm25}</span>
                  <span className="dossier-metric-unit">µg/m³</span>
                </div>
                <div className="dossier-metric-box">
                  <span className="dossier-metric-label">PM10 Level</span>
                  <span className="dossier-metric-val">{selectedStation.pm10}</span>
                  <span className="dossier-metric-unit">µg/m³</span>
                </div>
                <div className="dossier-metric-box">
                  <span className="dossier-metric-label">NO2 Nitrogen</span>
                  <span className="dossier-metric-val">{selectedStation.no2}</span>
                  <span className="dossier-metric-unit">ppb</span>
                </div>
              </div>

              <div className="dossier-citation">
                <div className="citation-row">
                  <span className="citation-key">Source Attribution:</span>
                  <span className="citation-val">{selectedStation.dataSource}</span>
                </div>
                <div className="citation-row">
                  <span className="citation-key">Sampling Method:</span>
                  <span className="citation-val">Continuous Automated Beta-Attenuation Telemetry</span>
                </div>
                <div className="citation-row">
                  <span className="citation-key">Coordinates:</span>
                  <span className="citation-val">{selectedStation.lat.toFixed(4)}° N, {selectedStation.lng.toFixed(4)}° E</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Map Canvas Container */}
        <div className="map-canvas-container">
          <div ref={mapContainerRef} className="leaflet-actual-map" />

          {/* Map Overlay Legend */}
          <div className="map-overlay-legend">
            <span className="legend-title">AQI Scale & Status</span>
            <div className="legend-scale-row">
              {AQI_LEVELS.map(lvl => (
                <div key={lvl.label} className="legend-scale-cell" title={`${lvl.label} (${lvl.min}-${lvl.max})`}>
                  <span className="legend-color-block" style={{ backgroundColor: lvl.color }}></span>
                  <span className="legend-label-text">{lvl.label.split(" ")[0]}</span>
                </div>
              ))}
            </div>
            <div className="legend-footer">
              <span>Interactive stations • Click markers for telemetry</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
