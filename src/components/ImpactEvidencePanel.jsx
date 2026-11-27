// Impact & Evidence: Understanding Your Numbers
// Transparent methodology panel for BreatheBack:
// - Explains whether AQI is measured/estimated, data source, freshness, and sample vs live distinction.
// - Explains whether Inhaled PM2.5 is measured or estimated, mathematical assumptions, and pulmonary context.
// - Explains Transit CO2 assumptions, per-passenger vs vehicle emissions, distance and mode factors.
// - Details recommendation drivers and transparent limitations when data is missing.
import React, { useState } from 'react';
import { Icon } from './Icons';
import { VENTILATION_RATES, MICROENVIRONMENTS, TRANSPORT_EMISSIONS } from '../utils/exposureCalculator';

export const ImpactEvidencePanel = ({
  city,
  activity,
  recommendation,
  persona,
  ambientPM25,
  doseUg,
  carbonKg,
  modeKey,
  distanceKm,
  durationMinutes,
  intensityKey,
  microKey,
  compact = false,
  defaultExpanded = false
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (!city) return null;

  // 1. AQI & Telemetry Attributes
  const dataSource = city.dataSource || "Municipal Environmental Monitoring Network";
  const dataFreshness = city.lastUpdated || "Archival Simulation Benchmark Record";
  const isDemoOrSample = Boolean(city.isDemo || city.dataSource?.includes("Sample") || city.dataSource?.includes("DEMO") || city.lastUpdated?.includes("Simulated"));
  const hasHourlyData = Boolean(Array.isArray(city.hourly) && city.hourly.length > 0);

  // 2. Inhaled PM2.5 Parameters
  const activeIntensity = intensityKey || activity?.intensity || (activity?.category === "exercise" ? "vigorous" : activity?.category === "commute" ? "moderate" : "light");
  const veRate = VENTILATION_RATES[activeIntensity] || 1.0;
  
  const activeMicro = microKey || activity?.micro || (activity?.locationType === "indoor" ? "indoor_standard" : "arterial_road");
  const microFactor = MICROENVIRONMENTS[activeMicro]?.factor || 1.0;
  const microLabel = MICROENVIRONMENTS[activeMicro]?.label || activeMicro;

  const durationMin = durationMinutes ?? activity?.duration ?? 45;
  const durationHours = Math.round((durationMin / 60) * 100) / 100;
  const ambientConc = ambientPM25 ?? city.pollutants?.pm25 ?? 120;
  const personaMultiplier = persona?.breathingMultiplier ?? 1.0;
  const personaLabel = persona?.label ?? "General Population (Baseline)";

  const calculatedDose = doseUg ?? Math.round(ambientConc * microFactor * veRate * (durationMin / 60) * personaMultiplier * 10) / 10;

  // 3. Transit Carbon Parameters
  const activeMode = modeKey || activity?.mode || (activity?.category === "commute" ? "solo_car" : "walking");
  const gPerKm = TRANSPORT_EMISSIONS[activeMode]?.gPerKm ?? 0;
  const modeLabel = TRANSPORT_EMISSIONS[activeMode]?.label || activeMode;
  const activeDist = distanceKm ?? activity?.distanceKm ?? (activity?.category === "commute" ? 12 : 0);
  const calculatedCO2 = carbonKg ?? Math.round(((gPerKm * activeDist) / 1000) * 100) / 100;

  // 4. Recommendation Basis & Limitation
  let drivingSignal = "Baseline atmospheric monitoring and activity duration";
  let routeStatusText = "Standard urban roadway alignment";
  let limitationNotice = "All suggestions are derived strictly from active territory data and verified corridor geometry. No speculative models are used.";

  if (activity?.verifiedGreenRoute) {
    routeStatusText = "Verified physical off-road greenway / park path";
  } else if (activity?.category === "commute") {
    routeStatusText = "Arterial roadway alignment (no off-road greenway verified)";
  }

  if (recommendation) {
    if (recommendation.status === "time_shifted") {
      drivingSignal = "Solar convective boundary layer height expansion (11:30–14:30) naturally diluting ground-level particulate density.";
    } else if (recommendation.status === "indoor_substitute") {
      drivingSignal = "Severe persistent ambient particulate elevation; mechanical True HEPA filtration recommended to prevent deep alveolar penetration.";
    } else if (recommendation.status === "preserved_fixed") {
      drivingSignal = "User designated fixed schedule commitment. Preserved without automated time shifts; in-vehicle cabin recirculation recommended.";
    }
  }

  if (!hasHourlyData) {
    drivingSignal = `Current baseline reading (AQI ${city.aqi}) and general indoor filtration protocols.`;
    limitationNotice = `Diurnal hourly forecast data is unavailable for ${city.name}. Specific speculative hourly curves are not invented; recommendations are restricted to baseline air quality guidance.`;
  }

  return (
    <div className={`impact-evidence-container ${compact ? "is-compact" : "is-standard"}`}>
      {/* Expand/Collapse Toggle Button */}
      <button
        type="button"
        className={`evidence-toggle-bar ${isExpanded ? "active" : ""}`}
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        title="Inspect mathematical formulas, breathing rates, emission factors, and data source attribution"
      >
        <div className="toggle-left">
          <span className="toggle-info-icon">
            <Icon name="info" size={13} color="var(--accent-moss)" />
          </span>
          <span className="toggle-title">Impact & Evidence: How we calculated this</span>
          <span className="toggle-tag-sample">
            {isDemoOrSample ? "Sample Benchmark Data" : "Verified Monitoring Source"}
          </span>
        </div>
        <div className="toggle-right">
          <span className="toggle-state-text">{isExpanded ? "Hide Evidence Dossier" : "Inspect Assumptions"}</span>
          <Icon name={isExpanded ? "chevron-up" : "chevron-down"} size={13} />
        </div>
      </button>

      {/* Expanded Detailed Evidence Panel */}
      {isExpanded && (
        <div className="impact-evidence-dossier">
          <div className="dossier-intro-banner">
            <div className="intro-title-block">
              <span className="field-tag">Scientific Audit</span>
              <h4 className="dossier-heading">Understanding Your Numbers & Assumptions</h4>
              <p className="dossier-subtext">
                Complete transparency into the mathematical formulations, environmental data sources, minute ventilation rates, and emission factors applied to this calculation.
              </p>
            </div>
            <div className="intro-meta-stamp">
              <span className="stamp-label">Calculation Class</span>
              <span className="stamp-value">Modeled Estimation</span>
            </div>
          </div>

          <div className="evidence-quad-grid">
            {/* Card 1: AQI & Telemetry */}
            <div className="evidence-panel-card aqi-card">
              <div className="panel-card-header">
                <span className="card-header-icon">
                  <Icon name="compass" size={15} color="var(--accent-moss)" />
                </span>
                <div>
                  <h5 className="panel-card-title">Air Quality Index & Telemetry</h5>
                  <span className="panel-card-sub">Data Source & Freshness Attribution</span>
                </div>
              </div>

              <div className="panel-spec-ledger">
                <div className="spec-item">
                  <span className="spec-k">Monitoring Authority:</span>
                  <span className="spec-v">{dataSource}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-k">Telemetry Timestamp:</span>
                  <span className="spec-v">{dataFreshness}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-k">Telemetry Status:</span>
                  <span className={`spec-v ${isDemoOrSample ? "status-benchmark" : "status-verified"}`}>
                    {isDemoOrSample ? "Sample Benchmark Data (Not Live Stream)" : "Verified Station Telemetry"}
                  </span>
                </div>
                <div className="spec-item">
                  <span className="spec-k">Forecast vs Baseline:</span>
                  <span className="spec-v">
                    {hasHourlyData
                      ? "Current baseline (AQI " + city.aqi + ") + Diurnal boundary layer curve"
                      : "Current baseline reading only (no speculative forecast curves)"}
                  </span>
                </div>
              </div>

              <div className="panel-scientific-note">
                <Icon name="info" size={12} color="var(--text-tertiary)" />
                <p>
                  <strong>Data Integrity Rule:</strong> Stale or benchmark sample data is never labeled as live telemetry. Baseline readings reflect municipal stations; hourly diurnal curves model planetary boundary layer expansion.
                </p>
              </div>
            </div>

            {/* Card 2: Inhaled PM2.5 Micro-Mass */}
            <div className="evidence-panel-card dose-card">
              <div className="panel-card-header">
                <span className="card-header-icon">
                  <Icon name="activity" size={15} color="var(--accent-terracotta)" />
                </span>
                <div>
                  <h5 className="panel-card-title">Inhaled PM2.5 Micro-Mass</h5>
                  <span className="panel-card-sub">Respiratory Exposure Formulation</span>
                </div>
              </div>

              <div className="panel-formula-badge">
                <code>Dose (µg) = PM2.5 (µg/m³) × Micro Factor × VE (m³/h) × Duration (h) × Persona</code>
              </div>

              <div className="panel-spec-ledger">
                <div className="spec-item">
                  <span className="spec-k">Estimation Status:</span>
                  <span className="spec-v text-terracotta">Modeled Estimate (Not Direct Measurement)</span>
                </div>
                <div className="spec-item">
                  <span className="spec-k">Ambient Concentration:</span>
                  <span className="spec-v">{ambientConc} µg/m³ PM2.5</span>
                </div>
                <div className="spec-item">
                  <span className="spec-k">Minute Ventilation (VE):</span>
                  <span className="spec-v">{veRate} m³/h ({activeIntensity} exertion)</span>
                </div>
                <div className="spec-item">
                  <span className="spec-k">Microenvironment Ratio:</span>
                  <span className="spec-v">{microFactor}× ({microLabel})</span>
                </div>
                <div className="spec-item">
                  <span className="spec-k">Trip Duration:</span>
                  <span className="spec-v">{durationMin} min ({durationHours} hours)</span>
                </div>
                <div className="spec-item">
                  <span className="spec-k">Subject Sensitivity:</span>
                  <span className="spec-v">{personaMultiplier}× ({personaLabel})</span>
                </div>
              </div>

              <div className="panel-scientific-note">
                <Icon name="info" size={12} color="var(--text-tertiary)" />
                <p>
                  <strong>Physiological Limitation:</strong> Inhaled mass estimates the volume of fine particles passing through the upper airway based on minute ventilation ($V_E$). It is <strong>not</strong> a clinical spirometry measurement of what penetrates or deposits in lung alveoli.
                </p>
              </div>
            </div>

            {/* Card 3: Transit Carbon (CO2e) */}
            <div className="evidence-panel-card carbon-card">
              <div className="panel-card-header">
                <span className="card-header-icon">
                  <Icon name="truck" size={15} color="var(--accent-moss)" />
                </span>
                <div>
                  <h5 className="panel-card-title">Transportation Carbon Footprint</h5>
                  <span className="panel-card-sub">Per-Passenger Trip Emission Modeling</span>
                </div>
              </div>

              <div className="panel-formula-badge">
                <code>Trip CO2e (kg) = Emission Factor (g/pass-km) × Distance (km) ÷ 1000</code>
              </div>

              <div className="panel-spec-ledger">
                <div className="spec-item">
                  <span className="spec-k">Emission Scope:</span>
                  <span className="spec-v">Estimated Passenger Trip Emissions</span>
                </div>
                <div className="spec-item">
                  <span className="spec-k">Allocation Method:</span>
                  <span className="spec-v text-moss">Per-Person Share (Occupancy-Weighted)</span>
                </div>
                <div className="spec-item">
                  <span className="spec-k">Transport Mode:</span>
                  <span className="spec-v">{modeLabel}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-k">Emission Factor:</span>
                  <span className="spec-v">{gPerKm} g CO2e per passenger-km</span>
                </div>
                <div className="spec-item">
                  <span className="spec-k">Trip Distance:</span>
                  <span className="spec-v">{activeDist} km</span>
                </div>
                <div className="spec-item">
                  <span className="spec-k">Estimated Output:</span>
                  <span className="spec-v">{calculatedCO2} kg CO2e</span>
                </div>
              </div>

              <div className="panel-scientific-note">
                <Icon name="info" size={12} color="var(--text-tertiary)" />
                <p>
                  <strong>Per-Person vs Vehicle Distinction:</strong> Values represent passenger-kilometer factors incorporating typical municipal vehicle occupancy (e.g. bus and train ridership), rather than the total tailpipe exhaust of a solo empty vehicle.
                </p>
              </div>
            </div>

            {/* Card 4: Recommendation Basis & Limitations */}
            <div className="evidence-panel-card basis-card">
              <div className="panel-card-header">
                <span className="card-header-icon">
                  <Icon name="sparkles" size={15} color="var(--accent-moss)" />
                </span>
                <div>
                  <h5 className="panel-card-title">Recommendation Basis & Limitations</h5>
                  <span className="panel-card-sub">Data Drivers & Scientific Guardrails</span>
                </div>
              </div>

              <div className="panel-spec-ledger">
                <div className="spec-item">
                  <span className="spec-k">Primary Data Driver:</span>
                  <span className="spec-v">{drivingSignal}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-k">Hourly Forecast Data:</span>
                  <span className="spec-v">
                    {hasHourlyData ? "Available (Diurnal curve active)" : "Unavailable (Baseline guidance only)"}
                  </span>
                </div>
                <div className="spec-item">
                  <span className="spec-k">Route Corridor Status:</span>
                  <span className="spec-v">{routeStatusText}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-k">Optimization Strategy:</span>
                  <span className="spec-v">
                    {activity?.isFixed ? "Fixed commitment preserved (timing locked)" : "Flexible window evaluated for convective timing / filtration"}
                  </span>
                </div>
              </div>

              <div className="panel-scientific-note limitation-note">
                <Icon name="alert-triangle" size={12} color="var(--accent-terracotta)" />
                <p>
                  <strong>Scientific Limitation:</strong> {limitationNotice}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
