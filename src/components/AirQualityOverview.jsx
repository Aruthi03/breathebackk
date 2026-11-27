// Overview Dashboard - Atmospheric Field Journal Design
import React from 'react';
import { Icon } from './Icons';
import { DiurnalChart } from './DiurnalChart';
import { getAQIInfo, getPM25Warning } from '../utils/aqiUtils';
import { USER_PERSONAS } from '../data/mockAirData';

export const AirQualityOverview = ({ city, personaKey, onNavigateToSimulator, onNavigateToMap }) => {
  if (!city) return null;

  const aqiInfo = getAQIInfo(city.aqi);
  const persona = USER_PERSONAS[personaKey] || USER_PERSONAS.general;
  const pmWarning = getPM25Warning(city.pollutants?.pm25 ?? 0, personaKey);

  // WHO 24-hour guideline: 15 µg/m³
  const whoPm25Guideline = 15;
  const whoMultiple = Math.round(((city.pollutants?.pm25 ?? 0) / whoPm25Guideline) * 10) / 10;

  return (
    <section className="journal-overview-view">
      {/* Benchmark Simulation Disclaimer */}
      <div className="field-notice-strip">
        <Icon name="info" size={16} color="var(--accent-terracotta)" />
        <span className="notice-text">
          <strong>Benchmark Telemetry Archive:</strong> Data for <em>{city.name}</em> represents peer-reviewed urban diurnal curves and municipal benchmark stations for reproducible decision modeling. Live sensor telemetry is not claimed.
        </span>
      </div>

      {/* Hero Field Dossier Card */}
      <div className="hero-journal-dossier">
        <div className="dossier-main-content">
          <div className="dossier-meta-stamp">
            <span className="field-tag">Observation Dossier</span>
            <span className="field-coord">{city.region}, {city.country}</span>
          </div>

          <h1 className="dossier-territory-title">{city.name}</h1>
          <p className="dossier-climate-line">
            Climate Classification: <strong>{city.climate}</strong> • Dominant Contaminant: <strong>{city.primaryPollutant}</strong>
          </p>

          {/* Subject Persona Evaluation Box */}
          <div className="subject-profile-box">
            <div className="subject-header">
              <Icon name={persona.icon} size={15} color="var(--accent-moss)" />
              <span className="subject-title">Subject Assessment: {persona.label}</span>
            </div>
            <p className="subject-notes">{pmWarning.text}</p>
          </div>

          {/* Diurnal Window Context */}
          <div className="diurnal-context-card">
            <div className="context-item">
              <span className="context-label">Diurnal Atmospheric Mixing:</span>
              <p className="context-value">{city.diurnalAnalysis}</p>
            </div>
            <div className="context-item">
              <span className="context-label">Ventilation Considerations:</span>
              <p className="context-value">{city.ventilationTimingNote}</p>
            </div>
          </div>
        </div>

        {/* Traditional Air Index Instrument Card */}
        <div className="aqi-instrument-card">
          <span className="instrument-label">Composite Air Quality Index</span>
          <div className="instrument-dial" style={{ borderColor: aqiInfo.color }}>
            <span className="dial-num" style={{ color: aqiInfo.color }}>{city.aqi}</span>
            <span className="dial-status" style={{ backgroundColor: aqiInfo.color }}>{city.status}</span>
          </div>

          <div className="instrument-footnote">
            <span className="footnote-prefix">WHO 24h Baseline:</span>
            <span><strong>{whoMultiple}×</strong> target exposure</span>
          </div>

          <div className="instrument-actions">
            <button
              type="button"
              className="btn-journal-secondary btn-full"
              onClick={onNavigateToMap}
            >
              <Icon name="map" size={15} />
              Inspect Station Map
            </button>
          </div>
        </div>
      </div>

      {/* Diurnal Curve Section */}
      <div className="journal-card diurnal-section-card">
        <DiurnalChart hourlyData={city.hourly} />
      </div>

      {/* Two-Column Detail Grid */}
      <div className="journal-two-col-grid">
        {/* Criteria Pollutants Ledger */}
        <div className="journal-card">
          <div className="journal-card-header">
            <div>
              <span className="field-tag">Analytical Ledger</span>
              <h3 className="card-journal-title">Criteria Pollutant Concentrations</h3>
            </div>
          </div>

          <div className="pollutant-ledger-list">
            <div className="ledger-entry">
              <div className="ledger-info">
                <span className="pollutant-code">PM2.5</span>
                <span className="pollutant-fullname">Fine Respirable Particulates (&lt;2.5µm)</span>
              </div>
              <div className="ledger-measurement">
                <span className="measurement-val" style={{ color: city.pollutants.pm25 > 35 ? "var(--accent-terracotta)" : "var(--accent-moss)" }}>
                  {city.pollutants.pm25} µg/m³
                </span>
                <span className="measurement-sub">WHO target: 15 µg/m³</span>
              </div>
            </div>

            <div className="ledger-entry">
              <div className="ledger-info">
                <span className="pollutant-code">PM10</span>
                <span className="pollutant-fullname">Inhalable Silt & Mechanical Dust (&lt;10µm)</span>
              </div>
              <div className="ledger-measurement">
                <span className="measurement-val">{city.pollutants.pm10} µg/m³</span>
                <span className="measurement-sub">WHO target: 45 µg/m³</span>
              </div>
            </div>

            <div className="ledger-entry">
              <div className="ledger-info">
                <span className="pollutant-code">NO2</span>
                <span className="pollutant-fullname">Nitrogen Dioxide (Vehicular combustion)</span>
              </div>
              <div className="ledger-measurement">
                <span className="measurement-val">{city.pollutants.no2} ppb</span>
                <span className="measurement-sub">Airway oxidant</span>
              </div>
            </div>

            <div className="ledger-entry">
              <div className="ledger-info">
                <span className="pollutant-code">O3</span>
                <span className="pollutant-fullname">Tropospheric Ozone (Photochemical reaction)</span>
              </div>
              <div className="ledger-measurement">
                <span className="measurement-val">{city.pollutants.o3} ppb</span>
                <span className="measurement-sub">Afternoon peak oxidizer</span>
              </div>
            </div>

            <div className="ledger-entry">
              <div className="ledger-info">
                <span className="pollutant-code">CO</span>
                <span className="pollutant-fullname">Carbon Monoxide (Incomplete combustion)</span>
              </div>
              <div className="ledger-measurement">
                <span className="measurement-val">{city.pollutants.co} ppm</span>
                <span className="measurement-sub">Cellular oxygen binding</span>
              </div>
            </div>

            <div className="ledger-entry">
              <div className="ledger-info">
                <span className="pollutant-code">SO2</span>
                <span className="pollutant-fullname">Sulfur Dioxide (Industrial & marine fuel)</span>
              </div>
              <div className="ledger-measurement">
                <span className="measurement-val">{city.pollutants.so2} ppb</span>
                <span className="measurement-sub">Bronchial irritant</span>
              </div>
            </div>
          </div>
        </div>

        {/* Meteorological Factors & Source Apportionment */}
        <div className="journal-card">
          <div className="journal-card-header">
            <div>
              <span className="field-tag">Atmospheric Dynamics</span>
              <h3 className="card-journal-title">Meteorology & Source Apportionment</h3>
            </div>
          </div>

          <div className="weather-field-metrics">
            <div className="weather-cell">
              <span className="weather-cell-label">Ambient Temperature</span>
              <span className="weather-cell-value">{city.weather.temp}°C</span>
            </div>
            <div className="weather-cell">
              <span className="weather-cell-label">Relative Humidity</span>
              <span className="weather-cell-value">{city.weather.humidity}%</span>
            </div>
            <div className="weather-cell">
              <span className="weather-cell-label">Wind Velocity</span>
              <span className="weather-cell-value">{city.weather.windSpeed} km/h ({city.weather.windDirection})</span>
            </div>
            <div className="weather-cell">
              <span className="weather-cell-label">Inversion Assessment</span>
              <span className="weather-cell-value highlight-terracotta">{city.weather.inversionRisk}</span>
            </div>
          </div>

          <div className="source-apportionment-block">
            <h4 className="sub-heading-journal">Primary Source Apportionment</h4>
            <div className="source-bars-group">
              {city.sources.map((src, i) => (
                <div key={i} className="source-record">
                  <div className="source-meta">
                    <span className="src-name">{src.name}</span>
                    <span className="src-val">{src.percentage}%</span>
                  </div>
                  <div className="source-bar-rail">
                    <div
                      className="source-bar-fill-moss"
                      style={{ width: `${src.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Call to Decision Lab */}
          <div className="decision-lab-callout">
            <div className="callout-text">
              <span className="callout-tag">Signature Tool</span>
              <h4 className="callout-title">Model Your Day in the Decision Lab</h4>
              <p className="callout-desc">
                Evaluate your personal inhaled dose across different transit routes, workout hours, and commute modes.
              </p>
            </div>
            <button
              type="button"
              className="btn-journal-primary"
              onClick={onNavigateToSimulator}
            >
              Open Decision Lab <Icon name="arrow-right" size={14} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
