// Better Choices (Sustainable Mobility & Community Scale) - Atmospheric Field Journal Design
import React, { useState } from 'react';
import { Icon } from './Icons';
import { TRANSPORT_EMISSIONS } from '../utils/exposureCalculator';

export const SustainableChoices = ({ city }) => {
  const [communityMembers, setCommunityMembers] = useState(1200);

  // Commute assumptions: 12 km typical daily roundtrip
  // Shifting from solo car (171 g/km) to electric rail (28 g/km) avoids ~1.71 kg CO2/person/day
  // Eliminates ~0.85g direct tailpipe particulate matter per vehicle/day
  const dailyCo2SavedKg = Math.round(communityMembers * 1.71);
  const annualCo2SavedTons = Math.round((dailyCo2SavedKg * 240) / 1000);
  const directPMAvoidedGrams = Math.round(communityMembers * 0.85);

  const communityActions = [
    {
      id: "transit",
      title: "Mode Shift: Electrified Transit & Metro Rail",
      tag: "Highest Leverage Mode Shift",
      desc: "Replacing single-occupant combustion passenger cars with electric metro or electrified bus fleets eliminates tailpipe exhaust from street canyons.",
      individualBenefit: "Reduces personal tailpipe proximity factor from 1.45 to 0.45, avoiding ~65% of roadway particulate inhalation.",
      communityBenefit: "Diminishes peak rush-hour gridlock duration, preventing stop-and-go acceleration plumes.",
      badgeColor: "var(--accent-moss)"
    },
    {
      id: "school_zones",
      title: "Engine Anti-Idling School Perimeters",
      tag: "Immediate Pediatric Shielding",
      desc: "Establishing strictly enforced zero-idling perimeters within 200 meters of school gates prevents the formation of high-density exhaust micro-clouds at child height.",
      individualBenefit: "Shields developing lung alveoli during curbside morning drop-off and afternoon pickup.",
      communityBenefit: "Reduces curbside black carbon and benzene spikes by up to 70% in 15-minute transition windows.",
      badgeColor: "var(--accent-terracotta)"
    },
    {
      id: "active_greenways",
      title: "Active Mobility via Vegetative Green Corridors",
      tag: "Active Health & Buffer Zones",
      desc: "Selecting separated cycle tracks, canal towpaths, and parkways bordered by continuous tree canopies separates cyclists from tailpipe exhaust cones.",
      individualBenefit: "Combines cardiovascular fitness with 45–60% lower particulate inhalation than road shoulders.",
      communityBenefit: "Zero passenger emissions while promoting urban active mobility corridors.",
      badgeColor: "var(--accent-moss)"
    },
    {
      id: "staggered_timing",
      title: "Staggered Commuting & Workplace Flexibility",
      tag: "Peak Smoothing",
      desc: "Departing 30 to 45 minutes outside the core traffic surge avoids maximum ground inversion overlap and bumper-to-bumper queueing.",
      individualBenefit: "Avoids highest diurnal tailpipe concentration periods and commute gridlock stress.",
      communityBenefit: "Flattens peak highway vehicle counts, avoiding fuel-inefficient acceleration-braking cycles.",
      badgeColor: "var(--text-secondary)"
    }
  ];

  return (
    <section className="better-choices-view">
      <div className="section-journal-header">
        <div>
          <span className="field-tag">Collective Dynamics</span>
          <h2 className="editorial-title">Better Choices — Sustainable Mobility & Collective Scale</h2>
          <p className="editorial-subtitle">
            While individual schedule adaptations directly shield personal lungs, community-wide shifts in transit modes 
            and timing eliminate vehicular emissions from the collective urban airshed of <strong>{city.name}</strong>.
          </p>
        </div>
      </div>

      {/* Community Scaler Interactive Card */}
      <div className="journal-card scaler-card">
        <div className="scaler-header-row">
          <div>
            <span className="field-tag">Neighborhood Dynamics</span>
            <h3 className="scaler-heading">Collective Action Impact Scaler</h3>
            <p className="scaler-desc">
              Simulate aggregate emissions avoidance when neighborhood residents coordinate sustainable transit habits.
            </p>
          </div>
          <span className="scaler-badge-stamp">Aggregation Model</span>
        </div>

        <div className="scaler-slider-group">
          <div className="slider-label-row">
            <span className="field-label">Participating Neighborhood Residents & Families:</span>
            <strong className="slider-count-highlight">{communityMembers.toLocaleString()} people</strong>
          </div>
          <input
            type="range"
            min="100"
            max="10000"
            step="100"
            value={communityMembers}
            onChange={(e) => setCommunityMembers(parseInt(e.target.value, 10))}
            className="journal-range"
          />
          <div className="range-notches">
            <span>Local Street (100)</span>
            <span>Neighborhood (1,000)</span>
            <span>District (5,000)</span>
            <span>Urban Ward (10,000)</span>
          </div>
        </div>

        {/* Collective Output Grid */}
        <div className="scaler-metrics-trio">
          <div className="scaler-metric-cell">
            <span className="smc-label">Daily Carbon Avoided</span>
            <span className="smc-value moss">{dailyCo2SavedKg.toLocaleString()} <small>kg CO2e</small></span>
            <span className="smc-sub">~{annualCo2SavedTons.toLocaleString()} metric tons avoided annually</span>
          </div>

          <div className="scaler-metric-cell">
            <span className="smc-label">Tailpipe PM2.5 Eliminated</span>
            <span className="smc-value terracotta">{directPMAvoidedGrams.toLocaleString()} <small>grams</small></span>
            <span className="smc-sub">Direct carcinogenic soot kept out of street air</span>
          </div>

          <div className="scaler-metric-cell">
            <span className="smc-label">Congestion Peak Relief</span>
            <span className="smc-value">~18–24%</span>
            <span className="smc-sub">Reduction in localized stop-and-go queueing</span>
          </div>
        </div>
      </div>

      {/* Modal Emission Comparison Table */}
      <div className="journal-card">
        <div className="journal-card-header">
          <div>
            <span className="field-tag">Comparative Footprint</span>
            <h3 className="card-journal-title">Transportation Mode Carbon Intensity</h3>
            <p className="card-journal-sub">Grounded passenger-kilometer emission factors (g CO2e / km)</p>
          </div>
        </div>

        <div className="transit-modes-ledger">
          {Object.keys(TRANSPORT_EMISSIONS).map(key => {
            const mode = TRANSPORT_EMISSIONS[key];
            const isZero = mode.gPerKm <= 4;
            return (
              <div key={key} className={`transit-row ${isZero ? "zero-emission-row" : ""}`}>
                <div className="mode-meta-col">
                  <span className="mode-title">{mode.label}</span>
                  <span className="mode-grams-badge">{mode.gPerKm} g CO2e / km</span>
                </div>
                <div className="mode-rail-track">
                  <div
                    className="mode-rail-fill"
                    style={{
                      width: `${Math.min(100, (mode.gPerKm / 171) * 100)}%`,
                      backgroundColor: isZero ? "var(--accent-moss)" : mode.gPerKm < 70 ? "var(--accent-moss-light)" : "var(--accent-terracotta)"
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Playbook Cards */}
      <div className="playbook-block">
        <h3 className="playbook-section-title">High-Leverage Community Protocols</h3>

        <div className="playbook-cards-grid">
          {communityActions.map(act => (
            <div key={act.id} className="journal-card playbook-card-item">
              <div className="playbook-top-bar">
                <span className="playbook-badge-tag" style={{ color: act.badgeColor, borderColor: act.badgeColor }}>
                  {act.tag}
                </span>
                <h4 className="playbook-heading">{act.title}</h4>
              </div>

              <p className="playbook-narrative">{act.desc}</p>

              <div className="playbook-dual-benefits">
                <div className="benefit-line">
                  <Icon name="user" size={13} color="var(--accent-terracotta)" />
                  <span><strong>Individual Benefit:</strong> {act.individualBenefit}</span>
                </div>
                <div className="benefit-line">
                  <Icon name="leaf" size={13} color="var(--accent-moss)" />
                  <span><strong>Community Benefit:</strong> {act.communityBenefit}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
