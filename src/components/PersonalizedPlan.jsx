// Your Day, Rebalanced — Daily Exposure Planner (Diurnal Schedule Optimization)
// Atmospheric Field Journal design system: Fixed vs Flexible schedule management,
// intelligent diurnal window shifting, indoor alternatives, user decision controls, and chronological sorting.
import React, { useState, useMemo } from 'react';
import { Icon } from './Icons';
import { USER_PERSONAS } from '../data/mockAirData';
import { getAmbientAtHour, calculateActivityDose } from '../utils/exposureCalculator';
import { ImpactEvidencePanel } from './ImpactEvidencePanel';

const INITIAL_SCHEDULE = [
  {
    id: "plan-1",
    name: "Morning Outdoor Cardio & Jog",
    category: "exercise",
    time: "07:15",
    duration: 45,
    flexibility: "flexible", // Flexible: evaluated for time shifting or indoor alternative
    locationType: "outdoor",
    notes: "Neighborhood roadway and perimeter loop."
  },
  {
    id: "plan-2",
    name: "Workplace / College Transit Commute",
    category: "commute",
    time: "08:30",
    duration: 45,
    flexibility: "fixed", // Fixed commitment: strictly preserved
    locationType: "transit",
    notes: "Mandatory office / college class arrival."
  },
  {
    id: "plan-3",
    name: "Lunch Break & Outdoor Errand Run",
    category: "shopping",
    time: "12:30",
    duration: 30,
    flexibility: "flexible", // Flexible
    locationType: "outdoor",
    notes: "Pharmacy pickup and corner market walk."
  },
  {
    id: "plan-4",
    name: "School Escort & Dismissal Pickup",
    category: "school",
    time: "15:30",
    duration: 35,
    flexibility: "fixed", // Fixed commitment: strictly preserved
    locationType: "transit",
    notes: "Scheduled school dismissal gate pickup."
  },
  {
    id: "plan-5",
    name: "Evening Commercial Errands & Retail",
    category: "shopping",
    time: "18:00",
    duration: 40,
    flexibility: "flexible", // Flexible
    locationType: "outdoor",
    notes: "High-density retail strip and open market stalls."
  },
  {
    id: "plan-6",
    name: "Evening Family Walk & Dog Exercise",
    category: "leisure",
    time: "19:45",
    duration: 35,
    flexibility: "flexible", // Flexible
    locationType: "outdoor",
    notes: "Community residential sidewalks and park avenue."
  }
];

// Chronological sorting helper
function sortByTime(list) {
  return [...list].sort((a, b) => {
    const timeA = (a.time || "00:00").split(":").map(Number);
    const timeB = (b.time || "00:00").split(":").map(Number);
    const minA = (timeA[0] || 0) * 60 + (timeA[1] || 0);
    const minB = (timeB[0] || 0) * 60 + (timeB[1] || 0);
    return minA - minB;
  });
}

export const PersonalizedPlan = ({ city, personaKey, onNavigateToSimulator }) => {
  const [schedule, setSchedule] = useState(() => sortByTime(INITIAL_SCHEDULE));
  const [acceptedChanges, setAcceptedChanges] = useState({}); // { [id]: boolean }
  const [activeTab, setActiveTab] = useState("comparison"); // "comparison" | "recommended" | "current" | "movement"
  const [simulateNoForecast, setSimulateNoForecast] = useState(false);
  const [isAddingActivity, setIsAddingActivity] = useState(false);

  // New activity form state
  const [newActivity, setNewActivity] = useState({
    name: "",
    category: "exercise",
    time: "09:00",
    duration: 40,
    flexibility: "flexible",
    locationType: "outdoor",
    notes: ""
  });

  const persona = USER_PERSONAS[personaKey] || USER_PERSONAS.general;

  // Determine whether time-specific hourly forecast is genuinely available
  const hasHourlyData = Boolean(!simulateNoForecast && city.hourly && city.hourly.length > 0);

  // Analyze schedule and generate recommendations
  const planAnalysis = useMemo(() => {
    const sorted = sortByTime(schedule);

    const items = sorted.map(item => {
      const currentHour = parseInt(item.time.split(":")[0], 10) || 8;
      const isAccepted = Boolean(acceptedChanges[item.id]);

      // 1. FIXED ACTIVITIES: Preserved strictly at original time
      if (item.flexibility === "fixed") {
        return {
          ...item,
          isFixed: true,
          recommendedTime: item.time,
          recommendedLocation: item.locationType,
          status: "preserved_fixed",
          statusLabel: "Fixed Commitment Preserved",
          changeSuggested: false,
          isAccepted,
          rationale: `Fixed Schedule Commitment: Maintained at ${item.time} without automated time shifting. Personal schedules for work, college, or school arrival are respected. If commuting during high-exposure traffic peaks, in-vehicle cabin recirculation with HEPA filtration or protective transit masks are recommended.`
        };
      }

      // 2. FLEXIBLE ACTIVITIES: Evaluated for optimal timing or indoor substitution
      // CASE A: Time-specific hourly forecast is available
      if (hasHourlyData) {
        const ambientCurrent = getAmbientAtHour(city.hourly, item.time);

        // For outdoor exercise or recreation
        if (item.category === "exercise" || item.category === "leisure") {
          // Scan midday convective window (11:00 to 15:00)
          let bestHour = currentHour;
          let lowestPM25 = ambientCurrent;

          for (let h = 11; h <= 15; h++) {
            const pm = city.hourly[h]?.pm25 || 999;
            if (pm < lowestPM25) {
              lowestPM25 = pm;
              bestHour = h;
            }
          }

          const pctImprovement = ambientCurrent > 0
            ? Math.round(((ambientCurrent - lowestPM25) / ambientCurrent) * 100)
            : 0;

          // If current hour is severely polluted (>180 µg/m³) and no clean outdoor window exists
          if (ambientCurrent > 180 && lowestPM25 > 130) {
            return {
              ...item,
              isFixed: false,
              recommendedTime: item.time,
              recommendedLocation: "indoor",
              status: "indoor_substitute",
              statusLabel: "Indoor Alternative Recommended",
              changeSuggested: true,
              isAccepted,
              ambientCurrent,
              ambientOptimized: Math.round(ambientCurrent * 0.2), // HEPA filtered
              pctImprovement: 80,
              rationale: `Indoor Substitution: High particulate concentrations persist throughout the day (modeled ${ambientCurrent} µg/m³ PM2.5). Exercising indoors with mechanical True HEPA air filtration is recommended over outdoor exertion to prevent deep alveolar particle deposition.`
            };
          }

          // If a substantially cleaner daytime window exists
          if (pctImprovement >= 15 && bestHour !== currentHour) {
            const newTimeStr = `${bestHour.toString().padStart(2, "0")}:00`;
            return {
              ...item,
              isFixed: false,
              recommendedTime: newTimeStr,
              recommendedLocation: item.locationType,
              status: "time_shifted",
              statusLabel: `Shifted to ${newTimeStr}`,
              changeSuggested: true,
              isAccepted,
              ambientCurrent,
              ambientOptimized: lowestPM25,
              pctImprovement,
              rationale: `Diurnal Convective Shift: Rescheduled from ${item.time} to ${newTimeStr}. Solar surface warming expands the planetary boundary layer height between 11:30 AM and 2:30 PM, lowering modeled ambient PM2.5 from ${ambientCurrent} to ${lowestPM25} µg/m³ (~-${pctImprovement}% modeled exposure).`
            };
          }

          return {
            ...item,
            isFixed: false,
            recommendedTime: item.time,
            recommendedLocation: item.locationType,
            status: "already_optimal",
            statusLabel: "Already at Favorable Window",
            changeSuggested: false,
            isAccepted,
            ambientCurrent,
            ambientOptimized: ambientCurrent,
            pctImprovement: 0,
            rationale: `Favorable Timing: Scheduled time at ${item.time} is already within the day's cleaner atmospheric window. Maintain route along residential side streets or tree-lined greenways.`
          };
        }

        // For shopping or errands
        if (item.category === "shopping") {
          // If scheduled during peak evening traffic rush (17:30 to 19:30), shift to early afternoon
          if (currentHour >= 17 && currentHour <= 19) {
            const shiftHour = 14;
            const pmLater = city.hourly[shiftHour]?.pm25 || ambientCurrent;
            const pctDrop = Math.max(0, Math.round(((ambientCurrent - pmLater) / ambientCurrent) * 100));

            return {
              ...item,
              isFixed: false,
              recommendedTime: "14:00",
              recommendedLocation: item.locationType,
              status: "time_shifted",
              statusLabel: "Shifted to 14:00 (Off-Peak)",
              changeSuggested: true,
              isAccepted,
              ambientCurrent,
              ambientOptimized: pmLater,
              pctImprovement: pctDrop,
              rationale: `Traffic & Inversion Avoidance: Moving errands from evening rush hour (18:00) to early afternoon (14:00) avoids both peak vehicle tailpipe congestion and sunset cooling boundary layer re-compression.`
            };
          }
        }

        // Default flexible item
        return {
          ...item,
          isFixed: false,
          recommendedTime: item.time,
          recommendedLocation: item.locationType,
          status: "already_optimal",
          statusLabel: "Optimal Schedule",
          changeSuggested: false,
          isAccepted,
          rationale: "Timing alignment is consistent with baseline diurnal patterns."
        };
      }

      // CASE B: Time-specific hourly forecast is UNAVAILABLE
      // Explicitly follow Requirement 6: State clearly that recommendations are based on current baseline conditions.
      const currentAQI = city.aqi || 120;
      if (item.locationType === "outdoor" && currentAQI > 150) {
        return {
          ...item,
          isFixed: false,
          recommendedTime: item.time,
          recommendedLocation: "indoor",
          status: "indoor_substitute",
          statusLabel: "Indoor Alternative (Baseline AQI)",
          changeSuggested: true,
          isAccepted,
          rationale: `Baseline Guidance (No Hourly Forecast): Time-specific hourly forecast data is unavailable for ${city.name}. Current baseline air quality is ${currentAQI} (${city.status || 'Elevated'}). In the absence of confirmed hourly forecast curves, substituting outdoor physical activity with an indoor filtered environment is recommended.`
        };
      }

      return {
        ...item,
        isFixed: false,
        recommendedTime: item.time,
        recommendedLocation: item.locationType,
        status: "general_guidance",
        statusLabel: "Current Baseline Guidance",
        changeSuggested: false,
        isAccepted,
        rationale: `General Baseline Guidance: Hourly forecast data is unavailable for ${city.name}. Recommendation is grounded in current baseline reading (AQI ${currentAQI}). No speculative hourly curves are invented.`
      };
    });

    const fixedCount = items.filter(i => i.isFixed).length;
    const flexibleCount = items.filter(i => !i.isFixed).length;
    const movedCount = items.filter(i => i.changeSuggested).length;
    const acceptedCount = items.filter(i => i.isAccepted).length;

    return {
      items,
      fixedCount,
      flexibleCount,
      movedCount,
      acceptedCount
    };
  }, [schedule, acceptedChanges, city, hasHourlyData]);

  // Handle toggling activity flexibility (Fixed vs Flexible)
  const handleToggleFlexibility = (id) => {
    setSchedule(prev => prev.map(item => {
      if (item.id === id) {
        const nextFlex = item.flexibility === "fixed" ? "flexible" : "fixed";
        return { ...item, flexibility: nextFlex };
      }
      return item;
    }));
  };

  // Handle accepting an individual recommendation
  const handleAcceptRecommendation = (id) => {
    setAcceptedChanges(prev => ({ ...prev, [id]: true }));
  };

  // Handle keeping original (rejecting recommendation)
  const handleKeepOriginal = (id) => {
    setAcceptedChanges(prev => ({ ...prev, [id]: false }));
  };

  // Accept all suggestions
  const handleAcceptAll = () => {
    const newAccepted = {};
    planAnalysis.items.forEach(item => {
      if (item.changeSuggested) {
        newAccepted[item.id] = true;
      }
    });
    setAcceptedChanges(newAccepted);
  };

  // Revert all to original
  const handleRevertAll = () => {
    setAcceptedChanges({});
  };

  // Delete activity
  const handleDeleteActivity = (id) => {
    setSchedule(prev => prev.filter(i => i.id !== id));
  };

  // Add new activity
  const handleAddActivity = (e) => {
    e.preventDefault();
    if (!newActivity.name.trim()) return;

    const newItem = {
      ...newActivity,
      id: `plan-${Date.now()}`,
      duration: parseInt(newActivity.duration, 10) || 30
    };

    setSchedule(prev => sortByTime([...prev, newItem]));
    setIsAddingActivity(false);
    setNewActivity({
      name: "",
      category: "exercise",
      time: "09:00",
      duration: 40,
      flexibility: "flexible",
      locationType: "outdoor",
      notes: ""
    });
  };

  // Current Schedule list (sorted chronologically)
  const currentScheduleList = sortByTime(planAnalysis.items.map(item => ({
    ...item,
    effectiveTime: item.time,
    effectiveLocation: item.locationType
  })));

  // Recommended Schedule list (incorporates accepted changes, sorted chronologically)
  const recommendedScheduleList = sortByTime(planAnalysis.items.map(item => {
    const isShifted = item.changeSuggested && item.isAccepted;
    return {
      ...item,
      effectiveTime: isShifted ? item.recommendedTime : item.time,
      effectiveLocation: isShifted ? item.recommendedLocation : item.locationType,
      isShifted
    };
  }));

  // Clean, descriptive tab navigation definitions
  const PLANNER_TABS = [
    { id: "comparison", label: "Day Overview", icon: "sliders", desc: "Side-by-side comparison" },
    { id: "recommended", label: "Suggested Plan", icon: "sparkles", desc: "Recommended daily rhythm" },
    { id: "current", label: "Original Plan", icon: "calendar", desc: "Baseline schedule" },
    { id: "movement", label: "Changes & Reasons", icon: "clock", desc: "Schedule audit trail" }
  ];

  return (
    <section className="my-day-view daily-exposure-planner">
      {/* Editorial Section Header: "Your Day, Rebalanced" */}
      <div className="section-journal-header rebalanced-header">
        <div>
          <div className="field-tag-row">
            <span className="field-tag">Diurnal Protocol</span>
            <span className="planner-edition-pill">Exposure Optimization</span>
          </div>
          <h2 className="editorial-title">Your Day, Rebalanced</h2>
          <p className="editorial-subtitle">
            A refined daily routine designed around atmospheric cycles — preserving non-negotiable commitments while aligning flexible windows with periods of natural convective dispersion.
          </p>
        </div>

        <div className="planner-header-actions">
          <button
            type="button"
            className="btn-journal-secondary"
            onClick={onNavigateToSimulator}
            title="Model route and microenvironment factors in Decision Lab"
          >
            <Icon name="sliders" size={14} />
            Model in Decision Lab
          </button>
        </div>
      </div>

      {/* Atmospheric Telemetry & Forecast Notice Strip */}
      <div className="field-notice-strip planner-status-strip">
        <div className="status-strip-left">
          <Icon name="compass" size={15} color="var(--accent-moss)" />
          <span className="notice-text">
            <strong>Territory Telemetry: {city.name}</strong> • Baseline AQI: <strong>{city.aqi}</strong> ({city.status || 'Moderate'}) • Subject Profile: <strong>{persona.label}</strong>
          </span>
        </div>

        {/* Forecast Availability Toggle for Testing Requirement 6 */}
        <div className="status-strip-right">
          <button
            type="button"
            className={`forecast-toggle-btn ${hasHourlyData ? "active" : "disabled"}`}
            onClick={() => setSimulateNoForecast(!simulateNoForecast)}
            title="Toggle between real diurnal hourly curve and simulated unavailable forecast to test Requirement 6"
          >
            <Icon name={hasHourlyData ? "sun" : "alert-triangle"} size={13} />
            <span>{hasHourlyData ? "Diurnal Forecast Active" : "Hourly Forecast Unavailable"}</span>
          </button>
        </div>
      </div>

      {/* Forecast Data Transparency Notice */}
      {!hasHourlyData && (
        <div className="forecast-unavailable-warning">
          <Icon name="alert-triangle" size={16} color="var(--accent-terracotta)" />
          <div className="warning-text-block">
            <span className="warning-title">Diurnal Hourly Forecast Data Unavailable for {city.name}</span>
            <p className="warning-body">
              Time-specific hourly forecast data is not provided by this monitoring station archive. All planner suggestions are derived strictly from the current baseline air quality (AQI {city.aqi}) and general indoor filtration protocols. Specific speculative hourly curves are not invented.
            </p>
          </div>
        </div>
      )}

      {/* Planner Summary Metrics Bar (4 Restrained Metric Cards) */}
      <div className="planner-metrics-grid">
        <div className="planner-stat-card">
          <span className="stat-label">Total Activities</span>
          <span className="stat-value">{planAnalysis.items.length}</span>
          <span className="stat-sub">Daily Routine Scope</span>
        </div>

        <div className="planner-stat-card">
          <span className="stat-label">Fixed Commitments</span>
          <span className="stat-value text-moss">{planAnalysis.fixedCount}</span>
          <span className="stat-sub">Preserved at Scheduled Time</span>
        </div>

        <div className="planner-stat-card">
          <span className="stat-label">Flexible Evaluated</span>
          <span className="stat-value text-terracotta">{planAnalysis.flexibleCount}</span>
          <span className="stat-sub">{planAnalysis.movedCount} Potential Opportunities</span>
        </div>

        <div className="planner-stat-card">
          <span className="stat-label">Accepted Adjustments</span>
          <span className="stat-value text-accent">{planAnalysis.acceptedCount} / {planAnalysis.movedCount}</span>
          <span className="stat-sub">Active Schedule Shifts</span>
        </div>
      </div>

      {/* Redesigned Polished Segmented Tab Navigation Bar */}
      <div className="planner-control-bar">
        <nav className="planner-segmented-tabs" aria-label="Planner Section Navigation">
          {PLANNER_TABS.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`segmented-tab-btn ${isActive ? "active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon name={tab.icon} size={14} />
                <span className="tab-label-text">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="planner-bulk-actions">
          {planAnalysis.movedCount > 0 && (
            <>
              <button
                type="button"
                className="btn-journal-stamp"
                onClick={handleAcceptAll}
                title="Adopt all suggested diurnal shifts"
              >
                <Icon name="check-circle" size={13} />
                Accept All Shifts
              </button>
              <button
                type="button"
                className="btn-journal-secondary btn-sm"
                onClick={handleRevertAll}
                title="Revert all activities to original scheduled times"
              >
                Revert to Original
              </button>
            </>
          )}

          <button
            type="button"
            className="btn-journal-primary btn-sm"
            onClick={() => setIsAddingActivity(!isAddingActivity)}
          >
            <Icon name={isAddingActivity ? "trash" : "plus"} size={13} />
            {isAddingActivity ? "Cancel" : "Add Activity"}
          </button>
        </div>
      </div>

      {/* Add New Activity Form Inset */}
      {isAddingActivity && (
        <form onSubmit={handleAddActivity} className="field-activity-form planner-add-form">
          <div className="form-legend-tag">New Scheduled Activity Protocol</div>
          <div className="form-fields-grid">
            <div className="form-group-journal">
              <label className="field-label">Activity Description</label>
              <input
                type="text"
                required
                placeholder="e.g. Evening Jog, College Lecture, Grocery Run"
                value={newActivity.name}
                onChange={(e) => setNewActivity({ ...newActivity, name: e.target.value })}
                className="journal-input"
              />
            </div>

            <div className="form-group-journal">
              <label className="field-label">Category</label>
              <select
                value={newActivity.category}
                onChange={(e) => setNewActivity({ ...newActivity, category: e.target.value })}
                className="journal-select"
              >
                <option value="commute">Work / College Commute</option>
                <option value="exercise">Outdoor Cardio / Exercise</option>
                <option value="shopping">Errands & Shopping</option>
                <option value="leisure">Leisure Walk & Recreation</option>
                <option value="school">School Escort / Pickup</option>
                <option value="office">Indoor Office / Desk Work</option>
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
                min="10"
                max="480"
                value={newActivity.duration}
                onChange={(e) => setNewActivity({ ...newActivity, duration: e.target.value })}
                className="journal-input"
              />
            </div>

            <div className="form-group-journal">
              <label className="field-label">Environment Type</label>
              <select
                value={newActivity.locationType}
                onChange={(e) => setNewActivity({ ...newActivity, locationType: e.target.value })}
                className="journal-select"
              >
                <option value="outdoor">Outdoor Street / Parkland</option>
                <option value="indoor">Indoor Building / Home</option>
                <option value="transit">In-Transit Vehicle / Cabin</option>
              </select>
            </div>

            {/* Flexibility Selector: Fixed vs Flexible */}
            <div className="form-group-journal">
              <label className="field-label">Schedule Flexibility</label>
              <select
                value={newActivity.flexibility}
                onChange={(e) => setNewActivity({ ...newActivity, flexibility: e.target.value })}
                className="journal-select"
              >
                <option value="fixed">🔒 Fixed Commitment (Never automatically moved)</option>
                <option value="flexible">⚡ Flexible Window (Intelligently evaluated for cleaner air)</option>
              </select>
            </div>
          </div>

          <div className="form-actions-bar">
            <button type="submit" className="btn-journal-primary">
              Add to Schedule
            </button>
          </div>
        </form>
      )}

      {/* ---------------------------------------------------------------------
          TAB 1: Day Overview (Side-by-Side Comparison of Original and Suggested)
          --------------------------------------------------------------------- */}
      {activeTab === "comparison" && (
        <div className="rebalanced-comparison-section">
          {/* Dual-Track Visual Legend Header */}
          <div className="comparison-dual-track-header">
            <div className="track-head original-track">
              <span className="track-badge original">Baseline Routine</span>
              <h3 className="track-title">Original Plan</h3>
              <span className="track-meta">Unadjusted personal commitments</span>
            </div>
            <div className="track-head-divider">
              <span className="divider-tag">Day Overview</span>
            </div>
            <div className="track-head suggested-track">
              <span className="track-badge suggested">Atmospheric Alignment</span>
              <h3 className="track-title">Suggested Plan</h3>
              <span className="track-meta">Optimized for lower inhalation dose</span>
            </div>
          </div>

          {/* Activity Comparison Cards Stack */}
          <div className="rebalanced-card-stack">
            {planAnalysis.items.length === 0 && (
              <div className="planner-empty-state">
                <Icon name="calendar" size={28} color="var(--text-tertiary)" />
                <span className="empty-title">No Activities Scheduled</span>
                <p className="empty-desc">
                  Your daily planner is currently empty. Click <strong>Add Activity</strong> above to add fixed commitments or flexible daily routines.
                </p>
              </div>
            )}
            {planAnalysis.items.map(item => {
              const isShifted = item.changeSuggested;
              const isAccepted = item.isAccepted;
              const isMoved = item.recommendedTime !== item.time || item.recommendedLocation !== item.locationType;

              return (
                <div
                  key={item.id}
                  className={`rebalanced-card ${item.isFixed ? "card-fixed" : "card-flexible"} ${isAccepted ? "shift-accepted" : ""}`}
                >
                  {/* Card Editorial Header */}
                  <div className="rebalanced-card-header">
                    <div className="card-identity-cluster">
                      <span className="card-category-avatar">
                        <Icon
                          name={
                            item.category === "commute" ? "car" :
                            item.category === "exercise" ? "running" :
                            item.category === "school" ? "child" :
                            item.category === "shopping" ? "tag" : "calendar"
                          }
                          size={15}
                        />
                      </span>
                      <div className="card-title-meta">
                        <div className="title-tag-row">
                          <h4 className="activity-editorial-name">{item.name}</h4>
                          <span className="activity-type-pill">{item.category}</span>
                        </div>
                        <span className="activity-sub-notes">
                          Duration: {item.duration} min • Setting: {item.locationType === "outdoor" ? "Outdoor Environment" : item.locationType === "indoor" ? "Indoor Building" : "In-Transit Cabin"}
                        </span>
                      </div>
                    </div>

                    {/* Flexibility Tag & Delete Cluster */}
                    <div className="card-right-controls">
                      {/* Fixed activities visually distinct from flexible activities */}
                      <button
                        type="button"
                        className={`flexibility-badge-btn ${item.isFixed ? "is-fixed" : "is-flexible"}`}
                        onClick={() => handleToggleFlexibility(item.id)}
                        title={item.isFixed ? "Click to switch to Flexible window" : "Click to switch to Fixed commitment"}
                      >
                        <Icon name={item.isFixed ? "lock" : "zap"} size={12} />
                        <span>{item.isFixed ? "Fixed Commitment" : "Flexible Window"}</span>
                      </button>

                      <button
                        type="button"
                        className="btn-journal-icon-delete"
                        onClick={() => handleDeleteActivity(item.id)}
                        title="Delete scheduled activity"
                      >
                        <Icon name="trash" size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Side-by-Side Comparison Grid */}
                  <div className="dual-side-by-side-grid">
                    {/* LEFT PANE: Original Plan */}
                    <div className="side-column original-pane">
                      <div className="pane-top-line">
                        <span className="pane-label">Original Plan</span>
                        <span className="pane-time-mono">{item.time}</span>
                      </div>

                      <div className="pane-spec-list">
                        <div className="spec-row">
                          <span className="spec-k">Scheduled Slot:</span>
                          <span className="spec-v">{item.time} ({item.duration}m)</span>
                        </div>
                        <div className="spec-row">
                          <span className="spec-k">Environment:</span>
                          <span className="spec-v">{item.locationType}</span>
                        </div>
                        <div className="spec-row">
                          <span className="spec-k">Schedule Type:</span>
                          <span className="spec-v">{item.isFixed ? "Preserved Fixed" : "Flexible"}</span>
                        </div>
                      </div>

                      {item.ambientCurrent && (
                        <div className="pane-exposure-meter">
                          <span className="meter-k">Modeled PM2.5:</span>
                          <span className="meter-v text-terracotta">{item.ambientCurrent} µg/m³</span>
                        </div>
                      )}
                    </div>

                    {/* CENTER FLOW BRIDGE: Before -> After OR Unchanged */}
                    <div className="side-flow-bridge">
                      {isMoved ? (
                        <div className="bridge-flow-indicator shifted">
                          <span className="flow-badge-text">Shift Proposed</span>
                          <div className="time-flow-strip">
                            <span className="t-from">{item.time}</span>
                            <span className="t-arrow">→</span>
                            <span className="t-to">{item.recommendedTime}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="bridge-flow-indicator unchanged">
                          <span className="badge-unchanged">
                            <Icon name="check" size={11} /> Unchanged
                          </span>
                          <span className="flow-sub-text">Time preserved</span>
                        </div>
                      )}
                    </div>

                    {/* RIGHT PANE: Suggested Plan */}
                    <div className={`side-column suggested-pane ${isShifted ? "is-improved" : ""}`}>
                      <div className="pane-top-line">
                        <span className={`pane-label ${isShifted ? "text-moss" : ""}`}>Suggested Plan</span>
                        <span className={`pane-time-mono ${isShifted ? "highlight-time-moss" : ""}`}>
                          {item.recommendedTime}
                        </span>
                      </div>

                      <div className="pane-spec-list">
                        <div className="spec-row">
                          <span className="spec-k">Rebalanced Slot:</span>
                          <span className={`spec-v ${isMoved ? "highlight-text-moss" : ""}`}>
                            {item.recommendedTime} ({item.duration}m)
                          </span>
                        </div>
                        <div className="spec-row">
                          <span className="spec-k">Setting:</span>
                          <span className={`spec-v ${item.recommendedLocation !== item.locationType ? "highlight-text-moss" : ""}`}>
                            {item.recommendedLocation === "indoor" ? "Indoor Filtered Space" : item.recommendedLocation}
                          </span>
                        </div>
                        <div className="spec-row">
                          <span className="spec-k">Status:</span>
                          <span className="spec-v">{item.statusLabel}</span>
                        </div>
                      </div>

                      {item.ambientOptimized && (
                        <div className="pane-exposure-meter">
                          <span className="meter-k">Optimized PM2.5 (Est.):</span>
                          <span className="meter-v text-moss">{item.ambientOptimized} µg/m³</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Scientific Rationale Field Dossier */}
                  <div className="field-rationale-dossier">
                    <div className="dossier-top-meta">
                      <div className="dossier-lead">
                        <Icon name="info" size={13} color="var(--accent-moss)" />
                        <span className="dossier-label">Atmospheric & Exposure Mechanism:</span>
                      </div>
                      {item.pctImprovement > 0 && (
                        <span className="dossier-exposure-pill">
                          ~-{item.pctImprovement}% Inhaled PM2.5 (Est.)
                        </span>
                      )}
                      <span className={`dossier-status-stamp ${item.status}`}>
                        {item.statusLabel}
                      </span>
                    </div>
                    <p className="dossier-explanation">{item.rationale}</p>
                  </div>

                  {/* User Control Decision Bar */}
                  {isShifted && (
                    <div className="card-decision-action-strip">
                      <div className="decision-notice-block">
                        <span className="decision-title">
                          {isAccepted ? "Shift Active in Your Rhythm" : "User Confirmation Required"}
                        </span>
                        <span className="decision-subtitle">
                          {isAccepted
                            ? `Confirmed at ${item.recommendedTime}. You can revert to your original plan at any time.`
                            : `Review this diurnal shift to ${item.recommendedTime}. Choose to adopt or keep your baseline.`}
                        </span>
                      </div>

                      <div className="decision-buttons-cluster">
                        {!isAccepted ? (
                          <button
                            type="button"
                            className="btn-journal-primary btn-sm"
                            onClick={() => handleAcceptRecommendation(item.id)}
                          >
                            <Icon name="check-circle" size={13} />
                            Accept Time Shift ({item.recommendedTime})
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn-journal-secondary btn-sm"
                            onClick={() => handleKeepOriginal(item.id)}
                          >
                            Revert to Original ({item.time})
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Activity Impact & Evidence Panel */}
                  <div className="activity-evidence-wrap">
                    <ImpactEvidencePanel
                      city={city}
                      activity={item}
                      recommendation={{
                        status: item.status,
                        statusLabel: item.statusLabel,
                        rationale: item.rationale,
                        recommendedTime: item.recommendedTime,
                        recommendedLocation: item.recommendedLocation
                      }}
                      persona={persona}
                      ambientPM25={item.ambientCurrent}
                      doseUg={item.ambientCurrent ? calculateActivityDose(item.ambientCurrent, item.locationType === "indoor" ? "indoor_standard" : "arterial_road", item.category === "exercise" ? "vigorous" : "moderate", item.duration, persona.breathingMultiplier) : undefined}
                      carbonKg={item.category === "commute" ? 2.39 : 0}
                      durationMinutes={item.duration}
                      compact={true}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------
          TAB 2: Suggested Plan (Recommended Schedule)
          --------------------------------------------------------------------- */}
      {activeTab === "recommended" && (
        <div className="chronological-schedule-view">
          <div className="schedule-timeline-legend">
            <div>
              <span className="timeline-title">Suggested Plan</span>
              <span className="timeline-subtitle">24-hour chronological sequence integrating preserved commitments and accepted air-quality shifts</span>
            </div>
            <span className="timeline-count-badge">{recommendedScheduleList.length} Scheduled Slots</span>
          </div>

          <div className="chronological-timeline-list">
            {recommendedScheduleList.map((item, idx) => (
              <div key={item.id} className={`timeline-slot-row ${item.isShifted ? "slot-shifted" : "slot-standard"}`}>
                <div className="slot-time-col">
                  <span className="slot-time-text">{item.effectiveTime}</span>
                  <span className="slot-idx-tag">#{idx + 1}</span>
                </div>

                <div className="slot-card-body">
                  <div className="slot-title-row">
                    <h4 className="slot-title">{item.name}</h4>
                    <span className="card-category-tag">{item.category}</span>
                    <span className={`slot-flex-pill ${item.isFixed ? "fixed" : "flexible"}`}>
                      {item.isFixed ? "Fixed Commitment" : "Flexible Window"}
                    </span>
                    {item.isShifted ? (
                      <span className="slot-diff-pill">
                        Shifted: {item.time} → {item.effectiveTime}
                      </span>
                    ) : (
                      <span className="badge-unchanged-mini">
                        Unchanged
                      </span>
                    )}
                  </div>
                  <p className="slot-rationale-summary">{item.rationale}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------
          TAB 3: Original Plan (Baseline Schedule)
          --------------------------------------------------------------------- */}
      {activeTab === "current" && (
        <div className="chronological-schedule-view">
          <div className="schedule-timeline-legend">
            <div>
              <span className="timeline-title">Original Plan</span>
              <span className="timeline-subtitle">Unadjusted baseline schedule prior to atmospheric diurnal optimization</span>
            </div>
            <span className="timeline-count-badge">{currentScheduleList.length} Scheduled Slots</span>
          </div>

          <div className="chronological-timeline-list">
            {currentScheduleList.map((item, idx) => (
              <div key={item.id} className="timeline-slot-row slot-standard">
                <div className="slot-time-col">
                  <span className="slot-time-text">{item.time}</span>
                  <span className="slot-idx-tag">#{idx + 1}</span>
                </div>

                <div className="slot-card-body">
                  <div className="slot-title-row">
                    <h4 className="slot-title">{item.name}</h4>
                    <span className="card-category-tag">{item.category}</span>
                    <span className={`slot-flex-pill ${item.isFixed ? "fixed" : "flexible"}`}>
                      {item.isFixed ? "Fixed Commitment" : "Flexible Window"}
                    </span>
                  </div>
                  <span className="slot-notes">{item.notes || "Standard scheduled daily routine."}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------
          TAB 4: Changes & Reasons (Activity Movement Log)
          --------------------------------------------------------------------- */}
      {activeTab === "movement" && (
        <div className="journal-card what-changed-card">
          <div className="movement-header">
            <span className="field-tag">Schedule Audit Dossier</span>
            <h3 className="movement-heading">Changes & Reasons</h3>
            <p className="movement-sub">
              An editorial activity timeline detailing which commitments were preserved, which were shifted to cleaner diurnal windows, and the atmospheric rationale.
            </p>
          </div>

          {/* Change Summary Stats */}
          <div className="what-changed-stats-row">
            <div className="audit-stat-box">
              <span className="as-label">Preserved Fixed</span>
              <span className="as-value text-moss">{planAnalysis.fixedCount}</span>
              <span className="as-sub">Maintained at Scheduled Time</span>
            </div>
            <div className="audit-stat-box">
              <span className="as-label">Rescheduled Windows</span>
              <span className="as-value text-terracotta">{planAnalysis.movedCount}</span>
              <span className="as-sub">Diurnal Exposure Reductions</span>
            </div>
            <div className="audit-stat-box">
              <span className="as-label">Accepted by You</span>
              <span className="as-value text-accent">{planAnalysis.acceptedCount}</span>
              <span className="as-sub">Active in Daily Rhythm</span>
            </div>
          </div>

          {/* Polished Activity Change Timeline Stream */}
          <div className="what-changed-timeline-stream">
            {planAnalysis.items.map((item, idx) => {
              const isMoved = item.changeSuggested;

              return (
                <div key={item.id} className={`timeline-entry-row ${isMoved ? "entry-shifted" : "entry-preserved"}`}>
                  {/* Vertical Track Milestone */}
                  <div className="timeline-track-rail">
                    <div className={`milestone-indicator ${isMoved ? "milestone-shifted" : "milestone-preserved"}`}>
                      <Icon name={isMoved ? "clock" : "check"} size={12} />
                    </div>
                    {idx < planAnalysis.items.length - 1 && <div className="milestone-line" />}
                  </div>

                  {/* Change Entry Card */}
                  <div className="timeline-entry-body">
                    <div className="entry-body-header">
                      <div className="entry-identity">
                        <h4 className="entry-title">{item.name}</h4>
                        <span className="card-category-tag">{item.category}</span>
                        <span className={`badge-mini ${item.isFixed ? "fixed" : "flexible"}`}>
                          {item.isFixed ? "Fixed Commitment" : "Flexible Window"}
                        </span>
                      </div>

                      {/* Time Transition Indicator */}
                      <div className="entry-time-cluster">
                        {isMoved ? (
                          <span className="time-transition-pill">
                            <span className="t-from">{item.time}</span>
                            <span className="t-sep">→</span>
                            <span className="t-to">{item.recommendedTime}</span>
                          </span>
                        ) : (
                          <span className="badge-unchanged">
                            <Icon name="check" size={11} /> Unchanged ({item.time})
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="entry-body-rationale">
                      <div className="rationale-tag-line">
                        <span className={`status-pill ${item.status}`}>{item.statusLabel}</span>
                        {item.pctImprovement > 0 && (
                          <span className="exposure-delta-badge">
                            ~-{item.pctImprovement}% Modeled PM2.5 Exposure
                          </span>
                        )}
                        {item.ambientCurrent && item.ambientOptimized && (
                          <span className="exposure-numbers-note">
                            {item.ambientCurrent} → {item.ambientOptimized} µg/m³
                          </span>
                        )}
                      </div>
                      <p className="entry-rationale-text">{item.rationale}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};
