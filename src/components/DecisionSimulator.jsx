// Decision Lab (Pollution Decision Simulator) - Atmospheric Field Journal Design
// Signature Feature: Evaluates personal micro-exposure inhalation vs transit carbon emissions
// Enhanced with Realistic Route-Aware Commute Recommendation Logic & Chronological Ordering
import React, { useState, useMemo } from 'react';
import { Icon } from './Icons';
import { ImpactEvidencePanel } from './ImpactEvidencePanel';
import {
  ACTIVITY_TYPES,
  getAmbientAtHour,
  MICROENVIRONMENTS,
  TRANSPORT_EMISSIONS,
  compareRoutines,
  calculateHaversineKm,
  sortRoutineChronologically
} from '../utils/exposureCalculator';
import { USER_PERSONAS } from '../data/mockAirData';

const INITIAL_ROUTINE = [
  {
    id: "act-1",
    name: "Morning Outdoor Cardio",
    type: "exercise",
    time: "07:30",
    duration: 45,
    intensity: "vigorous",
    micro: "arterial_road",
    mode: "walking",
    distanceKm: 5,
    origin: "Residential Enclave",
    destination: "Main Ring Boulevard",
    verifiedGreenRoute: false
  },
  {
    id: "act-2",
    name: "Workplace Transit Commute",
    type: "commute",
    time: "08:30",
    duration: 45,
    intensity: "moderate",
    micro: "arterial_road",
    mode: "solo_car",
    distanceKm: 14,
    origin: "South Sector Colony",
    destination: "Central Business District",
    verifiedGreenRoute: false
  },
  {
    id: "act-3",
    name: "School Escort & Errands",
    type: "school_run",
    time: "17:30",
    duration: 35,
    intensity: "moderate",
    micro: "arterial_road",
    mode: "solo_car",
    distanceKm: 6,
    origin: "Central Business District",
    destination: "West Sector Academy",
    verifiedGreenRoute: false
  },
  {
    id: "act-4",
    name: "Evening Neighborhood Stroll",
    type: "park_walk",
    time: "19:30",
    duration: 30,
    intensity: "light",
    micro: "green_corridor",
    mode: "walking",
    distanceKm: 2,
    origin: "Home",
    destination: "Community Botanical Garden",
    verifiedGreenRoute: true
  }
];

export const DecisionSimulator = ({ city, personaKey }) => {
  const [routine, setRoutine] = useState(() => sortRoutineChronologically(INITIAL_ROUTINE));
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [showAssumptionsModal, setShowAssumptionsModal] = useState(false);

  // Form State
  const [newActivity, setNewActivity] = useState({
    name: "",
    type: "commute",
    time: "09:00",
    duration: 35,
    intensity: "moderate",
    micro: "arterial_road",
    mode: "solo_car",
    distanceKm: 8,
    origin: "",
    destination: "",
    verifiedGreenRoute: false
  });

  const persona = USER_PERSONAS[personaKey] || USER_PERSONAS.general;
  const stations = city.stations || [];

  // Compute chronologically sorted simulations
  const simulationResults = useMemo(() => {
    return compareRoutines(routine, city.hourly, persona.breathingMultiplier);
  }, [routine, city.hourly, persona.breathingMultiplier]);

  const { totals, comparisons } = simulationResults;

  // Handle Origin selection & auto-distance calculation
  const handleOriginChange = (val) => {
    const matchedStation = stations.find(s => s.name === val || s.id === val);
    const originName = matchedStation ? matchedStation.name : val;
    const destStation = stations.find(s => s.name === newActivity.destination || s.id === newActivity.destination);

    let updatedDistance = newActivity.distanceKm;
    if (matchedStation && destStation) {
      const calcDist = calculateHaversineKm(matchedStation.lat, matchedStation.lng, destStation.lat, destStation.lng);
      if (calcDist > 0) updatedDistance = calcDist;
    }

    setNewActivity(prev => ({
      ...prev,
      origin: originName,
      originCoords: matchedStation ? { lat: matchedStation.lat, lng: matchedStation.lng } : null,
      distanceKm: updatedDistance
    }));
  };

  // Handle Destination selection & auto-distance calculation
  const handleDestinationChange = (val) => {
    const matchedStation = stations.find(s => s.name === val || s.id === val);
    const destName = matchedStation ? matchedStation.name : val;
    const originStation = stations.find(s => s.name === newActivity.origin || s.id === newActivity.origin);

    let updatedDistance = newActivity.distanceKm;
    if (originStation && matchedStation) {
      const calcDist = calculateHaversineKm(originStation.lat, originStation.lng, matchedStation.lat, matchedStation.lng);
      if (calcDist > 0) updatedDistance = calcDist;
    }

    setNewActivity(prev => ({
      ...prev,
      destination: destName,
      destinationCoords: matchedStation ? { lat: matchedStation.lat, lng: matchedStation.lng } : null,
      distanceKm: updatedDistance
    }));
  };

  const handleAddActivity = (e) => {
    e.preventDefault();
    if (!newActivity.name.trim()) return;

    const activityItem = {
      ...newActivity,
      id: `act-${Date.now()}`,
      duration: parseInt(newActivity.duration, 10) || 30,
      distanceKm: parseFloat(newActivity.distanceKm) || 0
    };

    const updatedRoutine = sortRoutineChronologically([...routine, activityItem]);
    setRoutine(updatedRoutine);
    setIsAddingNew(false);

    setNewActivity({
      name: "",
      type: "commute",
      time: "09:00",
      duration: 35,
      intensity: "moderate",
      micro: "arterial_road",
      mode: "solo_car",
      distanceKm: 8,
      origin: "",
      destination: "",
      verifiedGreenRoute: false
    });
  };

  const handleDeleteActivity = (id) => {
    setRoutine(prev => prev.filter(a => a.id !== id));
  };

  const handleApplyAllOptimizations = () => {
    const updated = simulationResults.comparisons.map(c => ({
      ...c.optimized,
      id: c.id,
      name: c.name,
      origin: c.baseline.origin,
      destination: c.baseline.destination,
      verifiedGreenRoute: c.baseline.verifiedGreenRoute
    }));
    setRoutine(sortRoutineChronologically(updated));
  };

  const handleApplySingleOptimization = (id) => {
    const comp = simulationResults.comparisons.find(c => c.id === id);
    if (!comp) return;

    setRoutine(prev => sortRoutineChronologically(prev.map(item => {
      if (item.id === id) {
        return {
          ...comp.optimized,
          id: item.id,
          name: item.name,
          origin: item.origin,
          destination: item.destination,
          verifiedGreenRoute: item.verifiedGreenRoute
        };
      }
      return item;
    })));
  };

  // Update an existing activity's time directly
  const handleUpdateActivityTime = (id, newTime) => {
    setRoutine(prev => sortRoutineChronologically(prev.map(item => {
      if (item.id === id) {
        return { ...item, time: newTime };
      }
      return item;
    })));
  };

  // Berkeley Earth reference conversion: ~18 µg fine particulate inhaled mass equivalent
  const equivalentCigarettesAvoided = Math.max(0, Math.round((totals.totalDoseReductionUg / 18) * 10) / 10);

  return (
    <section className="decision-lab-view">
      {/* Editorial Header */}
      <div className="lab-header-dossier">
        <div className="lab-header-text">
          <div className="field-meta-stamp">
            <span className="field-tag">Signature Simulator</span>
            <span className="field-coord">Physiological Inhalation & Emissions Modeling</span>
          </div>

          <h2 className="lab-title">Pollution Decision Lab</h2>
          <p className="lab-subtitle">
            Urban air pollution is spatially and diurnally variable. Simulate how realistic adjustments in 
            <strong> route corridors, cabin protection, commute timing, and transit modes</strong> attenuate your 
            personal inhaled particulate dose while mitigating vehicle carbon emissions.
          </p>
        </div>

        <div className="lab-header-cta-group">
          <button
            type="button"
            className="btn-journal-secondary"
            onClick={() => setShowAssumptionsModal(true)}
            title="Inspect scientific model equations, ventilation rates, and emission factors"
          >
            <Icon name="info" size={14} />
            Model Assumptions
          </button>

          <button
            type="button"
            className="btn-journal-primary"
            onClick={handleApplyAllOptimizations}
          >
            <Icon name="check-circle" size={15} />
            Adopt Optimized Routine
          </button>
        </div>
      </div>

      {/* Scientific Distinction Notice */}
      <div className="field-distinction-note">
        <Icon name="info" size={15} color="var(--accent-moss)" />
        <span className="distinction-text">
          <strong>Exposure vs. Emissions Distinction:</strong> Personal particulate exposure represents the micro-mass of fine particles ($\\mu g$ of $PM_{2.5}$) entering your bronchial airways, governed by respiration exertion ($V_E$), travel duration, and route proximity to tailpipes. Transit emissions represent the mass of greenhouse gases ($kg \\, CO_2e$) expelled into the collective airshed. All metric values are <strong>modeled estimates</strong>.
        </span>
      </div>

      {/* Aggregate Impact Ledger (3 Cards) */}
      <div className="simulation-ledger-grid">
        <div className="ledger-summary-card">
          <div className="card-top-row">
            <span className="summary-card-label">Personal Inhaled Dose (PM2.5)</span>
            <span className="summary-pill moss">-{totals.totalDoseReductionPct}% Exposure</span>
          </div>
          <div className="summary-values-row">
            <div className="val-unit-block">
              <span className="val-label">Current Routine</span>
              <span className="val-num danger">{totals.baselineTotalDose} <small>µg</small></span>
            </div>
            <div className="val-arrow">→</div>
            <div className="val-unit-block">
              <span className="val-label">Optimized Plan</span>
              <span className="val-num success">{totals.optimizedTotalDose} <small>µg</small></span>
            </div>
          </div>
          <p className="summary-card-footer">
            Modeled pulmonary deposition attenuation: <strong>{totals.totalDoseReductionUg} µg</strong> fine particulate mass.
          </p>
        </div>

        <div className="ledger-summary-card">
          <div className="card-top-row">
            <span className="summary-card-label">Transportation Carbon</span>
            <span className="summary-pill terracotta">Emissions Delta</span>
          </div>
          <div className="summary-values-row">
            <div className="val-unit-block">
              <span className="val-label">Current Transit</span>
              <span className="val-num">{totals.baselineTotalCarbon} <small>kg</small></span>
            </div>
            <div className="val-arrow">→</div>
            <div className="val-unit-block">
              <span className="val-label">Optimized Transit</span>
              <span className="val-num success">{totals.optimizedTotalCarbon} <small>kg</small></span>
            </div>
          </div>
          <p className="summary-card-footer">
            Avoids <strong>{totals.totalCarbonSavedKg} kg CO2e</strong> in estimated daily passenger transit output.
          </p>
        </div>

        <div className="ledger-summary-card">
          <div className="card-top-row">
            <span className="summary-card-label">Health Burden Context</span>
            <span className="summary-pill neutral">Modeled Equivalence</span>
          </div>
          <div className="summary-single-val">
            <span className="big-stat-num">{equivalentCigarettesAvoided}</span>
            <span className="big-stat-desc">Passive Cig. Eq. Inhalation Avoided</span>
          </div>
          <p className="summary-card-footer">
            Ground-level mass equivalence (~18 µg fine particulate mass per passive unit reference).
          </p>
        </div>
      </div>

      {/* Aggregate Impact & Evidence Panel */}
      <div className="aggregate-evidence-wrap">
        <ImpactEvidencePanel
          city={city}
          persona={persona}
          doseUg={totals.baselineTotalDose}
          carbonKg={totals.baselineTotalCarbon}
          compact={false}
          defaultExpanded={false}
        />
      </div>

      {/* Routine Activities Workspace */}
      <div className="journal-card workspace-card">
        <div className="workspace-header-row">
          <div>
            <div className="field-tag-row">
              <span className="field-tag">Schedule Protocol</span>
              <span className="chronological-badge">Chronologically Ordered</span>
            </div>
            <h3 className="workspace-heading">Daily Schedule & Route Recommendations</h3>
            <p className="workspace-desc">
              Modeling for <strong>{city.name}</strong> • Calibrated for <strong>{persona.label}</strong> (Breathing multiplier: {persona.breathingMultiplier}x)
            </p>
          </div>
          <button
            type="button"
            className="btn-journal-secondary"
            onClick={() => setIsAddingNew(!isAddingNew)}
          >
            <Icon name={isAddingNew ? "trash" : "plus"} size={14} />
            {isAddingNew ? "Cancel" : "Add Activity"}
          </button>
        </div>

        {/* Add Activity Form with Route Awareness */}
        {isAddingNew && (
          <form onSubmit={handleAddActivity} className="field-activity-form">
            <div className="form-legend-tag">New Activity & Route Corridor Entry</div>
            
            <div className="form-fields-grid">
              <div className="form-group-journal">
                <label className="field-label">Activity Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Workplace Commute, Morning Jog"
                  value={newActivity.name}
                  onChange={(e) => setNewActivity({ ...newActivity, name: e.target.value })}
                  className="journal-input"
                />
              </div>

              <div className="form-group-journal">
                <label className="field-label">Category</label>
                <select
                  value={newActivity.type}
                  onChange={(e) => {
                    const selectedType = ACTIVITY_TYPES.find(t => t.id === e.target.value);
                    setNewActivity({
                      ...newActivity,
                      type: e.target.value,
                      duration: selectedType?.defaultDuration || 30,
                      intensity: selectedType?.defaultIntensity || "moderate",
                      micro: selectedType?.defaultMicro || "side_street",
                      mode: selectedType?.defaultMode || "walking",
                      distanceKm: selectedType?.distanceKm || 0
                    });
                  }}
                  className="journal-select"
                >
                  {ACTIVITY_TYPES.map(t => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group-journal">
                <label className="field-label">Scheduled Time</label>
                <input
                  type="time"
                  required
                  value={newActivity.time}
                  onChange={(e) => setNewActivity({ ...newActivity, time: e.target.value })}
                  className="journal-input"
                />
              </div>

              <div className="form-group-journal">
                <label className="field-label">Duration (Minutes)</label>
                <input
                  type="number"
                  min="5"
                  max="480"
                  value={newActivity.duration}
                  onChange={(e) => setNewActivity({ ...newActivity, duration: e.target.value })}
                  className="journal-input"
                />
              </div>

              {/* Commute Origin Selection */}
              <div className="form-group-journal">
                <label className="field-label">
                  Commute Origin (Optional)
                  {stations.length > 0 && <small className="label-hint">Pick from map stations or type</small>}
                </label>
                <div className="input-with-datalist">
                  <input
                    type="text"
                    list="origin-stations-list"
                    placeholder="e.g. R.K. Puram, Velachery, Home"
                    value={newActivity.origin}
                    onChange={(e) => handleOriginChange(e.target.value)}
                    className="journal-input"
                  />
                  <datalist id="origin-stations-list">
                    {stations.map(s => (
                      <option key={s.id} value={s.name}>{s.area || s.name}</option>
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Commute Destination Selection */}
              <div className="form-group-journal">
                <label className="field-label">
                  Commute Destination (Optional)
                  {stations.length > 0 && <small className="label-hint">Pick from map stations or type</small>}
                </label>
                <div className="input-with-datalist">
                  <input
                    type="text"
                    list="dest-stations-list"
                    placeholder="e.g. Central Business District, Office"
                    value={newActivity.destination}
                    onChange={(e) => handleDestinationChange(e.target.value)}
                    className="journal-input"
                  />
                  <datalist id="dest-stations-list">
                    {stations.map(s => (
                      <option key={s.id} value={s.name}>{s.area || s.name}</option>
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="form-group-journal">
                <label className="field-label">Travel Distance (km)</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={newActivity.distanceKm}
                  onChange={(e) => setNewActivity({ ...newActivity, distanceKm: e.target.value })}
                  className="journal-input"
                />
              </div>

              <div className="form-group-journal">
                <label className="field-label">Transit Mode</label>
                <select
                  value={newActivity.mode}
                  onChange={(e) => setNewActivity({ ...newActivity, mode: e.target.value })}
                  className="journal-select"
                >
                  {Object.keys(TRANSPORT_EMISSIONS).map(k => (
                    <option key={k} value={k}>{TRANSPORT_EMISSIONS[k].label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group-journal">
                <label className="field-label">Road Environment</label>
                <select
                  value={newActivity.micro}
                  onChange={(e) => setNewActivity({ ...newActivity, micro: e.target.value })}
                  className="journal-select"
                >
                  {Object.keys(MICROENVIRONMENTS).map(k => (
                    <option key={k} value={k}>{MICROENVIRONMENTS[k].label}</option>
                  ))}
                </select>
              </div>

              {/* Route Verification Checkbox */}
              <div className="form-group-journal span-all-cols">
                <label className="field-checkbox-container">
                  <input
                    type="checkbox"
                    checked={newActivity.verifiedGreenRoute}
                    onChange={(e) => setNewActivity({ ...newActivity, verifiedGreenRoute: e.target.checked })}
                    className="journal-checkbox"
                  />
                  <span className="checkbox-label-text">
                    <strong>Confirmed Feasible Alternative Route:</strong> I verify that a continuous off-road park connector, greenway, or quiet secondary street physically exists between my Origin and Destination.
                  </span>
                </label>
                <span className="field-sub-note">
                  If left unchecked, BreatheBack will not assume an off-road park path exists and will maintain the transit corridor on roadway surfaces while optimizing timing and vehicle cabin protection.
                </span>
              </div>
            </div>

            <div className="form-actions-bar">
              <button type="submit" className="btn-journal-primary">
                Add to Daily Schedule
              </button>
            </div>
          </form>
        )}

        {/* Chronologically Sorted Activity Comparison Cards */}
        <div className="comparison-ledger-list">
          {comparisons.length === 0 && (
            <div className="planner-empty-state">
              <Icon name="calendar" size={28} color="var(--text-tertiary)" />
              <span className="empty-title">No Activities in Daily Routine</span>
              <p className="empty-desc">
                Your routine ledger is currently empty. Click <strong>Add Activity</strong> above to schedule your commute, workouts, or errands and model personal particulate exposure.
              </p>
            </div>
          )}
          {comparisons.map((comp) => {
            const hasShift = comp.doseReductionPct > 0 || comp.carbonSavedKg > 0;
            const hasOriginDest = comp.baseline.origin && comp.baseline.destination;
            const isGreenVerified = comp.baseline.verifiedGreenRoute;

            return (
              <div key={comp.id} className="activity-comparison-record">
                <div className="record-header">
                  <div className="record-title-group">
                    <span className="record-icon-badge">
                      <Icon name={comp.baseline.type === "exercise" ? "running" : comp.baseline.type === "commute" ? "car" : "activity"} size={16} />
                    </span>
                    <div>
                      <div className="record-title-row">
                        <h4 className="record-name">{comp.name}</h4>
                        <span className="record-time-pill">{comp.baseline.time}</span>
                      </div>
                      
                      {/* Origin & Destination Display */}
                      {hasOriginDest && (
                        <div className="record-route-pill">
                          <Icon name="map-pin" size={12} color="var(--accent-terracotta)" />
                          <span className="route-origin">{comp.baseline.origin}</span>
                          <span className="route-arrow">→</span>
                          <span className="route-dest">{comp.baseline.destination}</span>
                          <span className="route-distance">({comp.baseline.distanceKm} km)</span>
                        </div>
                      )}

                      <div className="record-sub-row">
                        <span className="record-sub">
                          {comp.baseline.duration} min duration • {comp.baseline.distanceKm > 0 ? `${comp.baseline.distanceKm} km transit` : "Stationary exposure"}
                        </span>
                        
                        {/* Route Verification Badge */}
                        {comp.baseline.type === "commute" && (
                          <span className={`route-verification-badge ${isGreenVerified ? "verified" : "unverified"}`}>
                            {isGreenVerified ? "✔ Feasible Greenway Confirmed" : "⚠ Arterial Roadway Alignment (No Greenway Verified)"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="record-actions">
                    {/* Time Quick Adjuster */}
                    <div className="record-time-adjust">
                      <label htmlFor={`time-${comp.id}`} className="time-adjust-label">Time:</label>
                      <input
                        id={`time-${comp.id}`}
                        type="time"
                        value={comp.baseline.time}
                        onChange={(e) => handleUpdateActivityTime(comp.id, e.target.value)}
                        className="inline-time-input"
                        title="Adjust scheduled time"
                      />
                    </div>

                    {hasShift && (
                      <button
                        type="button"
                        className="btn-journal-stamp"
                        onClick={() => handleApplySingleOptimization(comp.id)}
                        title="Adopt recommended alternative for this activity"
                      >
                        <Icon name="check-circle" size={13} color="var(--accent-moss)" />
                        Adopt Recommendation
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn-journal-icon-delete"
                      onClick={() => handleDeleteActivity(comp.id)}
                      title="Remove activity record"
                    >
                      <Icon name="trash" size={14} />
                    </button>
                  </div>
                </div>

                {/* Side-by-Side Routine Pillars */}
                <div className="pillars-side-by-side">
                  {/* Baseline Pillar */}
                  <div className="routine-column baseline-col">
                    <div className="column-header">
                      <span className="col-status-tag">Current Schedule</span>
                      <span className="col-time">{comp.baseline.time}</span>
                    </div>
                    <div className="col-details">
                      <div className="detail-item">
                        <span className="detail-k">Environment:</span>
                        <span className="detail-v">{MICROENVIRONMENTS[comp.baseline.micro]?.label || comp.baseline.micro}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-k">Transit Mode:</span>
                        <span className="detail-v">{TRANSPORT_EMISSIONS[comp.baseline.mode]?.label || comp.baseline.mode}</span>
                      </div>
                    </div>
                    <div className="col-metrics">
                      <div className="col-metric-entry">
                        <span className="cm-k">Inhaled PM2.5 (Est.)</span>
                        <span className="cm-v danger">{comp.baselineDose} µg</span>
                      </div>
                      <div className="col-metric-entry">
                        <span className="cm-k">Transit CO2 (Est.)</span>
                        <span className="cm-v">{comp.baselineCO2} kg</span>
                      </div>
                    </div>
                  </div>

                  {/* Transition Indicator */}
                  <div className="column-connector">
                    <Icon name="arrow-right" size={18} color="var(--accent-moss)" />
                  </div>

                  {/* Optimized Alternative Pillar */}
                  <div className={`routine-column optimized-col ${hasShift ? "improved" : ""}`}>
                    <div className="column-header">
                      <span className="col-status-tag recommended">
                        <Icon name="sparkles" size={12} />
                        BreatheBack Recommendation
                      </span>
                      <span className="col-time highlight-moss">{comp.optimized.time}</span>
                    </div>
                    <div className="col-details">
                      <div className="detail-item">
                        <span className="detail-k">Environment:</span>
                        <span className="detail-v highlight-moss">{MICROENVIRONMENTS[comp.optimized.micro]?.label || comp.optimized.micro}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-k">Transit Mode:</span>
                        <span className="detail-v highlight-moss">{TRANSPORT_EMISSIONS[comp.optimized.mode]?.label || comp.optimized.mode}</span>
                      </div>
                    </div>
                    <div className="col-metrics">
                      <div className="col-metric-entry">
                        <span className="cm-k">Inhaled PM2.5 (Est.)</span>
                        <span className="cm-v success">{comp.optDose} µg</span>
                      </div>
                      <div className="col-metric-entry">
                        <span className="cm-k">Transit CO2 (Est.)</span>
                        <span className="cm-v success">{comp.optCO2} kg</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Scientific Rationale Dossier */}
                <div className="scientific-rationale-strip">
                  <div className="rationale-top">
                    <Icon name="info" size={14} color="var(--accent-moss)" />
                    <span className="rationale-label">Scientific Rationale & Route Guidance:</span>
                    {comp.doseReductionPct > 0 && (
                      <span className="rationale-metric-pill moss">
                        -{comp.doseReductionPct}% Modeled Exposure (-{comp.doseReductionUg} µg)
                      </span>
                    )}
                    {comp.carbonSavedKg > 0 && (
                      <span className="rationale-metric-pill terracotta">
                        -{comp.carbonSavedKg} kg CO2e
                      </span>
                    )}
                  </div>
                  <p className="rationale-body">{comp.rationale}</p>
                </div>

                {/* Per-Activity Impact & Evidence Panel */}
                <div className="activity-evidence-wrap">
                  <ImpactEvidencePanel
                    city={city}
                    activity={comp.baseline}
                    recommendation={{
                      status: comp.optimized.time !== comp.baseline.time ? "time_shifted" : "route_optimized",
                      rationale: comp.rationale
                    }}
                    persona={persona}
                    ambientPM25={getAmbientAtHour(city.hourly, comp.baseline.time)}
                    doseUg={comp.baselineDose}
                    carbonKg={comp.baselineCO2}
                    modeKey={comp.baseline.mode}
                    distanceKm={comp.baseline.distanceKm}
                    durationMinutes={comp.baseline.duration}
                    intensityKey={comp.baseline.intensity}
                    microKey={comp.baseline.micro}
                    compact={true}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Model Assumptions & Equations Modal */}
      {showAssumptionsModal && (
        <div className="field-modal-backdrop">
          <div className="field-modal-card model-assumptions-modal">
            <div className="modal-header">
              <span className="field-tag">Scientific Methodology</span>
              <h3 className="modal-title">Inhaled Exposure & Emission Modeling Assumptions</h3>
              <p className="modal-desc">
                Mathematical formulations and reference constants grounded in WHO and EPA environmental health equations.
              </p>
            </div>

            <div className="modal-body-scrollable">
              {/* Formula Section */}
              <div className="assumption-block">
                <h4 className="assumption-title">1. Personal Inhaled Dose Equation</h4>
                <div className="equation-display-card">
                  <code>Inhaled Dose (µg) = Ambient PM2.5 (µg/m³) × Microenvironment Factor × Ventilation Rate (m³/h) × Duration (h) × Vulnerability Multiplier</code>
                </div>
                <p className="assumption-text">
                  Inhaled particulate mass is governed by the volume of ambient air inhaled over time. Ambient $PM_{2.5}$ reflects the active territory's diurnal benchmark telemetry at the scheduled departure hour.
                </p>
              </div>

              {/* Minute Ventilation Rates */}
              <div className="assumption-block">
                <h4 className="assumption-title">2. Minute Ventilation Rates ($V_E$) by Exertion</h4>
                <div className="assumption-table-wrapper">
                  <table className="assumption-table">
                    <thead>
                      <tr>
                        <th>Activity Intensity</th>
                        <th>Ventilation ($m^3/h$)</th>
                        <th>Physiological Context</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr><td>Sedentary (Driving, Desk)</td><td>0.55</td><td>Basal resting respiration</td></tr>
                      <tr><td>Light (Walking, Shopping)</td><td>0.90</td><td>Normal conversational cadence</td></tr>
                      <tr><td>Moderate (Brisk Walk, Commute)</td><td>1.40</td><td>Elevated aerobic minute volume</td></tr>
                      <tr><td>Vigorous (Jogging, Cycling)</td><td>2.30</td><td>High minute oral airflow, bypasses nasal filtering</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Microenvironment Factors */}
              <div className="assumption-block">
                <h4 className="assumption-title">3. Microenvironment Ratios Relative to Ambient Background</h4>
                <div className="assumption-table-wrapper">
                  <table className="assumption-table">
                    <thead>
                      <tr>
                        <th>Microenvironment</th>
                        <th>Ratio vs Ambient</th>
                        <th>Physical Mechanism</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr><td>Arterial Road / Highway</td><td>1.45x</td><td>Proximity to concentrated tailpipe plumes and tire silt</td></tr>
                      <tr><td>Car Cabin (Windows Open / Gridlock)</td><td>1.75x</td><td>Direct canyon entrapment in vehicle exhaust wake</td></tr>
                      <tr><td>Residential Side Street</td><td>1.00x</td><td>Standard urban background baseline</td></tr>
                      <tr><td>City Bus / Transit</td><td>0.70x</td><td>Enclosed vehicle cabin buffering</td></tr>
                      <tr><td>Park / Green Corridor</td><td>0.65x</td><td>Vegetation foliage filtration and vehicle separation</td></tr>
                      <tr><td>Underground Metro</td><td>0.45x</td><td>Filtered subterranean train car air handling</td></tr>
                      <tr><td>Car Cabin (AC Recirculate + Filter)</td><td>0.40x</td><td>Cabin filter removal of fine ambient particulates</td></tr>
                      <tr><td>Indoor Building (True HEPA)</td><td>0.15x</td><td>Mechanical HEPA interception and diffusion</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Transit Carbon Emissions */}
              <div className="assumption-block">
                <h4 className="assumption-title">4. Transportation Carbon Emission Factors</h4>
                <p className="assumption-text">
                  Emissions are modeled using standard passenger-kilometer factors: Solo Gasoline Car: <strong>171 g $CO_2e$/km</strong>; Carpool (2+): <strong>75 g/km</strong>; Electric Public Bus: <strong>68 g/km</strong>; Metro Rail: <strong>28 g/km</strong>; Walking / Bicycle: <strong>0 g/km</strong>.
                </p>
              </div>

              {/* Transparent Disclaimer */}
              <div className="assumption-disclaimer-box">
                <Icon name="info" size={16} color="var(--accent-terracotta)" />
                <span className="disclaimer-text">
                  <strong>Important Scientific Notice:</strong> All values presented are modeled estimates intended for personal lifestyle planning and research comparison. Acute local weather, street canyon geometry, vehicle model variations, and individual respiratory physiology vary. Guaranteed health outcomes or precise sensor readings are not claimed.
                </span>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-journal-primary"
                onClick={() => setShowAssumptionsModal(false)}
              >
                Close Methodology
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
