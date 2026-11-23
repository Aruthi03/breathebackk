// Compact Atmospheric Field Journal Header
import React, { useState } from 'react';
import { Icon } from './Icons';
import { BENCHMARK_CITIES, USER_PERSONAS, generateRegionalDemoStations } from '../data/mockAirData';

export const Navbar = ({
  theme,
  toggleTheme,
  selectedCityKey,
  setSelectedCityKey,
  selectedPersonaKey,
  setSelectedPersonaKey,
  customCity,
  setCustomCity,
  mobileNavOpen,
  setMobileNavOpen
}) => {
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customAQI, setCustomAQI] = useState("120");
  const [customPM25, setCustomPM25] = useState("45");

  const currentPersona = USER_PERSONAS[selectedPersonaKey] || USER_PERSONAS.general;

  const handleCityChange = (e) => {
    const val = e.target.value;
    if (val === "custom") {
      setShowCustomModal(true);
    } else {
      setCustomCity(null);
      setSelectedCityKey(val);
    }
  };

  const handleSaveCustomCity = (e) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const aqiNum = parseInt(customAQI, 10) || 100;
    const pmNum = parseInt(customPM25, 10) || 35;

    const generatedHourly = Array.from({ length: 24 }).map((_, h) => {
      const wave = Math.sin((h - 5) * (Math.PI / 12));
      const hourlyAqi = Math.max(20, Math.round(aqiNum + wave * (aqiNum * 0.35)));
      const hourlyPM = Math.max(10, Math.round(pmNum + wave * (pmNum * 0.4)));
      return {
        hour: `${h.toString().padStart(2, "0")}:00`,
        aqi: hourlyAqi,
        pm25: hourlyPM,
        no2: 35,
        o3: 40,
        label: wave > 0.5 ? "Morning Inversion" : wave < -0.3 ? "Solar Convection Window" : "Moderate Ambient"
      };
    });

    const newCity = {
      id: "custom",
      name: customName.trim(),
      country: "Custom Location",
      region: "User Defined Territory",
      climate: "Temperate",
      coords: { lat: 37.7749, lng: -122.4194 },
      defaultZoom: 11,
      aqi: aqiNum,
      status: aqiNum > 200 ? "Very Poor" : aqiNum > 150 ? "Unhealthy" : aqiNum > 100 ? "Unhealthy for Sensitive Groups" : "Moderate",
      primaryPollutant: "PM2.5",
      dataSource: "Custom User-Specified Benchmark Telemetry",
      lastUpdated: "User Configured Simulation Benchmark",
      pollutants: {
        pm25: pmNum,
        pm10: Math.round(pmNum * 1.6),
        no2: 38,
        o3: 42,
        co: 0.9,
        so2: 8
      },
      weather: {
        temp: 22,
        humidity: 55,
        windSpeed: 8.5,
        windDirection: "NW",
        condition: "Calm Atmosphere",
        inversionRisk: "Moderate"
      },
      sources: [
        { name: "Urban Transport", percentage: 48 },
        { name: "Domestic & Commercial Energy", percentage: 26 },
        { name: "Local Silt & Construction", percentage: 26 }
      ],
      stations: [
        {
          id: "custom-central",
          name: `${customName.trim()} Central Station`,
          area: "Urban Core",
          lat: 37.7749,
          lng: -122.4194,
          aqi: aqiNum,
          status: aqiNum > 150 ? "Unhealthy" : "Moderate",
          primaryPollutant: "PM2.5",
          pm25: pmNum,
          pm10: Math.round(pmNum * 1.6),
          no2: 38,
          stationType: "User Defined Benchmark",
          dataSource: "Custom Observation Entry"
        }
      ],
      hourly: generatedHourly,
      diurnalAnalysis: "Custom territory profile. Diurnal particulate variance follows standard urban planetary boundary layer dynamics.",
      ventilationTimingNote: "Midday convective mixing typically presents the most favorable period for short indoor flushes."
    };

    setCustomCity(newCity);
    setShowCustomModal(false);
  };

  return (
    <header className="compact-journal-header">
      <div className="header-inner">
        {/* Logo and Brand */}
        <div className="header-brand-block">
          <button
            type="button"
            className="mobile-nav-toggle"
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            aria-label="Toggle navigation sidebar"
          >
            <div className={`journal-hamburger ${mobileNavOpen ? "open" : ""}`}>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </button>

          <div className="journal-insignia">
            <span className="insignia-mark">§</span>
            <div className="brand-titles">
              <span className="journal-brand-title">BreatheBack</span>
              <span className="journal-edition-tag">Atmospheric Field Journal</span>
            </div>
          </div>
        </div>

        {/* Compact Right Controls: Location, Persona, Theme */}
        <div className="header-controls-block">
          {/* Territory Location Selector */}
          <div className="journal-select-wrapper">
            <label htmlFor="headerCitySelect" className="control-field-label">Territory:</label>
            <div className="field-select-inner">
              <Icon name="map-pin" size={13} color="var(--accent-moss)" />
              <select
                id="headerCitySelect"
                value={customCity ? "custom" : selectedCityKey}
                onChange={handleCityChange}
                className="journal-header-select"
                aria-label="Select territory location"
              >
                {Object.keys(BENCHMARK_CITIES).map(k => (
                  <option key={k} value={k}>
                    {BENCHMARK_CITIES[k].name} ({BENCHMARK_CITIES[k].country})
                  </option>
                ))}
                <option value="custom">
                  {customCity ? `Custom: ${customCity.name}` : "+ Custom Location..."}
                </option>
              </select>
            </div>
          </div>

          {/* Profile Selector */}
          <div className="journal-select-wrapper hide-mobile-sm">
            <label htmlFor="headerPersonaSelect" className="control-field-label">Subject:</label>
            <div className="field-select-inner">
              <Icon name={currentPersona.icon} size={13} color="var(--accent-terracotta)" />
              <select
                id="headerPersonaSelect"
                value={selectedPersonaKey}
                onChange={(e) => setSelectedPersonaKey(e.target.value)}
                className="journal-header-select"
                aria-label="Select vulnerability profile"
              >
                {Object.keys(USER_PERSONAS).map(k => (
                  <option key={k} value={k}>
                    {USER_PERSONAS[k].label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Theme Toggle Button */}
          <button
            type="button"
            className="journal-theme-btn"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${theme === 'dark' ? 'Warm Ivory Light' : 'Forest Charcoal Dark'} theme`}
          >
            <Icon name={theme === 'dark' ? "sun" : "moon"} size={16} />
            <span className="theme-btn-label">{theme === 'dark' ? "Light" : "Dark"}</span>
          </button>
        </div>
      </div>

      {/* Custom Location Modal */}
      {showCustomModal && (
        <div className="field-modal-backdrop">
          <div className="field-modal-card">
            <div className="modal-header">
              <span className="field-tag">Observation Parameters</span>
              <h3 className="modal-title">Define Custom Benchmark Territory</h3>
              <p className="modal-desc">
                Configure ambient particulate baseline for your local research or lifestyle simulation.
              </p>
            </div>

            <form onSubmit={handleSaveCustomCity} className="modal-form-content">
              <div className="form-field-group">
                <label className="field-label">Territory / Neighborhood Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kyoto Highland, Kyoto"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="journal-input"
                />
              </div>

              <div className="form-columns-2">
                <div className="form-field-group">
                  <label className="field-label">Baseline AQI (0–500)</label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={customAQI}
                    onChange={(e) => setCustomAQI(e.target.value)}
                    className="journal-input"
                  />
                </div>
                <div className="form-field-group">
                  <label className="field-label">Ambient PM2.5 (µg/m³)</label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={customPM25}
                    onChange={(e) => setCustomPM25(e.target.value)}
                    className="journal-input"
                  />
                </div>
              </div>

              <div className="modal-button-row">
                <button
                  type="button"
                  className="btn-journal-secondary"
                  onClick={() => setShowCustomModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-journal-primary">
                  Save Territory Benchmark
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
