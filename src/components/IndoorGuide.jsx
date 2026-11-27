// Indoor Air - Sanctuary Guide and Infiltration Estimator
import React, { useState } from 'react';
import { Icon } from './Icons';
import { ROOM_GUIDES, calculateIndoorAQI } from '../data/indoorAdviceData';

export const IndoorGuide = ({ city }) => {
  const [selectedRoom, setSelectedRoom] = useState("kitchen");

  const [outdoorPM, setOutdoorPM] = useState(city.pollutants.pm25 || 80);
  const [windowsOpen, setWindowsOpen] = useState(false);
  const [weatherStripped, setWeatherStripped] = useState(true);
  const [hepaActive, setHepaActive] = useState(true);
  const [cookingActive, setCookingActive] = useState(false);

  const indoorEstimate = calculateIndoorAQI(outdoorPM, {
    windowsOpen,
    hepaActive,
    cookingActive,
    weatherStripped
  });

  const activeRoomData = ROOM_GUIDES.find(r => r.id === selectedRoom) || ROOM_GUIDES[0];

  return (
    <section className="indoor-sanctuary-view">
      <div className="section-journal-header">
        <div>
          <span className="field-tag">Microclimate Physics</span>
          <h2 className="editorial-title">Indoor Air — Sanctuary Guide & Infiltration Model</h2>
          <p className="editorial-subtitle">
            Urban dwellers spend approximately 85% of their lives indoors. Understand building envelope physics, 
            mechanical filtration, and behavioral controls to create an uncompromised air sanctuary.
          </p>
        </div>
      </div>

      {/* Physics-Based Infiltration Estimator */}
      <div className="journal-card estimator-card">
        <div className="estimator-header">
          <div>
            <span className="field-tag">Building Envelope Simulation</span>
            <h3 className="estimator-title">Indoor Particulate Penetration Estimator</h3>
            <p className="estimator-sub">
              Evaluate how fenestration status, mechanical air delivery, and active cooking determine indoor PM2.5 concentrations.
            </p>
          </div>
          <span className="estimator-stamp">ASHRAE 62.2 Model</span>
        </div>

        <div className="estimator-body-grid">
          {/* Left Controls */}
          <div className="estimator-controls-col">
            <div className="slider-control-group">
              <div className="slider-label-row">
                <span className="field-label">Outdoor Ambient PM2.5 Concentration:</span>
                <strong className="slider-val-highlight">{outdoorPM} µg/m³</strong>
              </div>
              <input
                type="range"
                min="5"
                max="300"
                value={outdoorPM}
                onChange={(e) => setOutdoorPM(parseInt(e.target.value, 10))}
                className="journal-range"
              />
              <div className="range-notches">
                <span>Clean (15)</span>
                <span>Moderate (50)</span>
                <span>Unhealthy (150)</span>
                <span>Severe (300)</span>
              </div>
            </div>

            <div className="toggles-quad-grid">
              <button
                type="button"
                className={`journal-toggle-cell ${windowsOpen ? "active-alert" : ""}`}
                onClick={() => setWindowsOpen(!windowsOpen)}
              >
                <div className="toggle-dot-ring">
                  <span className={`toggle-dot ${windowsOpen ? "alert" : ""}`} />
                </div>
                <div className="toggle-label-wrap">
                  <span className="toggle-head">Exterior Windows</span>
                  <span className="toggle-state">{windowsOpen ? "Open (Ingress)" : "Sealed / Closed"}</span>
                </div>
              </button>

              <button
                type="button"
                className={`journal-toggle-cell ${hepaActive ? "active-moss" : ""}`}
                onClick={() => setHepaActive(!hepaActive)}
              >
                <div className="toggle-dot-ring">
                  <span className={`toggle-dot ${hepaActive ? "moss" : ""}`} />
                </div>
                <div className="toggle-label-wrap">
                  <span className="toggle-head">True HEPA Filtration</span>
                  <span className="toggle-state">{hepaActive ? "Continuous Active" : "Filter Off"}</span>
                </div>
              </button>

              <button
                type="button"
                className={`journal-toggle-cell ${cookingActive ? "active-alert" : ""}`}
                onClick={() => setCookingActive(!cookingActive)}
              >
                <div className="toggle-dot-ring">
                  <span className={`toggle-dot ${cookingActive ? "alert" : ""}`} />
                </div>
                <div className="toggle-label-wrap">
                  <span className="toggle-head">Stovetop Cooking</span>
                  <span className="toggle-state">{cookingActive ? "Active Frying" : "Kitchen Inactive"}</span>
                </div>
              </button>

              <button
                type="button"
                className={`journal-toggle-cell ${weatherStripped ? "active-moss" : ""}`}
                onClick={() => setWeatherStripped(!weatherStripped)}
              >
                <div className="toggle-dot-ring">
                  <span className={`toggle-dot ${weatherStripped ? "moss" : ""}`} />
                </div>
                <div className="toggle-label-wrap">
                  <span className="toggle-head">Weatherstripping</span>
                  <span className="toggle-state">{weatherStripped ? "Tight Seal" : "Standard Draft"}</span>
                </div>
              </button>
            </div>
          </div>

          {/* Right Results Readout */}
          <div className="estimator-readout-col">
            <span className="readout-label">Estimated Indoor Atmosphere</span>

            <div className="readout-numbers-pair">
              <div className="readout-cell">
                <span className="cell-k">Indoor PM2.5</span>
                <span className={`cell-v ${indoorEstimate.indoorPM25 > 35 ? "terracotta" : "moss"}`}>
                  {indoorEstimate.indoorPM25} <small>µg/m³</small>
                </span>
                <span className="cell-sub">Outdoor baseline: {outdoorPM} µg/m³</span>
              </div>

              <div className="readout-cell">
                <span className="cell-k">Indoor Index Equiv.</span>
                <span className="cell-v">
                  {indoorEstimate.indoorAQI}
                </span>
                <span className="cell-sub">Composite Indoor AQI</span>
              </div>
            </div>

            <div className="filtration-efficiency-bar">
              <div className="bar-labels-row">
                <span>Building Infiltration Barrier:</span>
                <strong>{indoorEstimate.protectionPercentage}% Mitigated</strong>
              </div>
              <div className="efficiency-rail">
                <div
                  className="efficiency-fill-moss"
                  style={{ width: `${indoorEstimate.protectionPercentage}%` }}
                />
              </div>
            </div>

            <div className="estimator-verdict-box">
              {indoorEstimate.indoorPM25 <= 15 ? (
                <div className="verdict-line success">
                  <Icon name="check-circle" size={14} color="var(--accent-moss)" />
                  <span><strong>Optimal Sanctuary:</strong> Meets strict WHO 24-hour target (15 µg/m³).</span>
                </div>
              ) : indoorEstimate.indoorPM25 <= 35 ? (
                <div className="verdict-line warning">
                  <Icon name="info" size={14} color="var(--accent-terracotta)" />
                  <span><strong>Acceptable Protection:</strong> Adequate for general population; sensitive individuals benefit from higher fan CADR.</span>
                </div>
              ) : (
                <div className="verdict-line danger">
                  <Icon name="alert-triangle" size={14} color="var(--accent-terracotta)" />
                  <span><strong>Elevated Infiltration:</strong> Seal windows, activate mechanical range hood, and run HEPA filter on high speed.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Room by Room Guide Navigator */}
      <div className="room-guide-block">
        <div className="room-tabs-bar">
          {ROOM_GUIDES.map(room => (
            <button
              key={room.id}
              type="button"
              className={`room-tab-btn ${selectedRoom === room.id ? "active" : ""}`}
              onClick={() => setSelectedRoom(room.id)}
            >
              <Icon name={room.icon} size={15} />
              <span>{room.name}</span>
            </button>
          ))}
        </div>

        {/* Selected Room Dossier */}
        <div className="journal-card room-dossier-card">
          <div className="room-dossier-top">
            <div>
              <span className="field-tag">Room Protocol</span>
              <h3 className="room-dossier-title">{activeRoomData.name}</h3>
              <span className="room-spike-note">Source Magnitude: <strong>{activeRoomData.typicalPollutionSpike}</strong></span>
            </div>
          </div>

          <div className="threats-tags-line">
            <span className="threats-head">Target Pollutants:</span>
            <div className="tags-cluster">
              {activeRoomData.primaryThreats.map((t, i) => (
                <span key={i} className="field-threat-tag">{t}</span>
              ))}
            </div>
          </div>

          <div className="interventions-ledger-grid">
            {activeRoomData.interventions.map((item, i) => (
              <div key={i} className="intervention-dossier-item">
                <div className="int-index-badge">{i + 1}</div>
                <div className="int-details-box">
                  <h4 className="int-heading">{item.title}</h4>
                  <p className="int-text">{item.action}</p>
                  <div className="int-impact-note">
                    <Icon name="shield-check" size={13} color="var(--accent-moss)" />
                    <span><strong>Documented Benefit:</strong> {item.impact}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Myth Buster Field Note */}
          <div className="field-mythbuster-card">
            <div className="myth-stamp">Field Science vs Common Myth</div>
            <p className="myth-body-text">{activeRoomData.mythBuster}</p>
          </div>
        </div>
      </div>
    </section>
  );
};
