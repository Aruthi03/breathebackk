// Interactive 24-Hour Diurnal Pollution Curve
// Atmospheric Field Journal styling: clean technical axes, contour reference lines, and calm observation telemetry.
import React, { useState } from 'react';

export const DiurnalChart = ({ hourlyData = [], onSelectHour }) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  if (!hourlyData || hourlyData.length === 0) {
    return <div className="chart-empty">No diurnal telemetry available</div>;
  }

  const width = 800;
  const height = 240;
  const paddingX = 44;
  const paddingTop = 32;
  const paddingBottom = 42;

  const innerWidth = width - paddingX * 2;
  const innerHeight = height - paddingTop - paddingBottom;

  const maxVal = Math.max(...hourlyData.map(d => d.aqi), 150);
  const minVal = 0;

  const points = hourlyData.map((d, i) => {
    const x = paddingX + (i / (hourlyData.length - 1)) * innerWidth;
    const y = paddingTop + innerHeight - ((d.aqi - minVal) / (maxVal - minVal)) * innerHeight;
    return { x, y, data: d, index: i };
  });

  // Construct smooth curve path
  const pathD = points.reduce((acc, p, i, arr) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = arr[i - 1];
    const cp1x = prev.x + (p.x - prev.x) / 2;
    const cp1y = prev.y;
    const cp2x = prev.x + (p.x - prev.x) / 2;
    const cp2y = p.y;
    return `${acc} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p.x} ${p.y}`;
  }, "");

  // Area under curve
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`;

  // Find lowest and highest hours
  let lowestIdx = 0;
  let highestIdx = 0;
  hourlyData.forEach((d, i) => {
    if (d.aqi < hourlyData[lowestIdx].aqi) lowestIdx = i;
    if (d.aqi > hourlyData[highestIdx].aqi) highestIdx = i;
  });

  const activePoint = hoveredIndex !== null ? points[hoveredIndex] : points[lowestIdx];

  // Grid steps (e.g. 50, 100, 200)
  const gridSteps = [50, 100, 200].filter(val => val < maxVal);

  return (
    <div className="diurnal-chart-journal">
      <div className="diurnal-header-journal">
        <div>
          <span className="field-tag">Diurnal Fluctuation Record</span>
          <h4 className="chart-journal-title">24-Hour Planetary Boundary Layer & AQI Curve</h4>
          <p className="chart-journal-subtitle">
            Ground-level concentration fluctuates with solar convection and thermal inversion dynamics.
          </p>
        </div>
        <div className="chart-journal-legend">
          <span className="legend-entry">
            <span className="legend-indicator optimal"></span> Convective Minimum
          </span>
          <span className="legend-entry">
            <span className="legend-indicator peak"></span> Inversion / Traffic Peak
          </span>
        </div>
      </div>

      <div className="svg-container-journal">
        <svg viewBox={`0 0 ${width} ${height}`} className="diurnal-svg-journal" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="journalCurveFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent-moss)" stopOpacity="0.22" />
              <stop offset="60%" stopColor="var(--accent-moss)" stopOpacity="0.08" />
              <stop offset="100%" stopColor="var(--accent-moss)" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {/* Background grid & threshold lines */}
          {gridSteps.map(step => {
            const yPos = paddingTop + innerHeight - ((step - minVal) / (maxVal - minVal)) * innerHeight;
            return (
              <g key={step}>
                <line
                  x1={paddingX}
                  y1={yPos}
                  x2={width - paddingX}
                  y2={yPos}
                  stroke="var(--border-subtle)"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x={paddingX + 6}
                  y={yPos - 5}
                  fill="var(--text-tertiary)"
                  fontSize="10"
                  fontFamily="inherit"
                >
                  AQI {step}
                </text>
              </g>
            );
          })}

          {/* Area fill */}
          <path d={areaD} fill="url(#journalCurveFill)" />

          {/* Main curve stroke */}
          <path
            d={pathD}
            fill="none"
            stroke="var(--accent-moss)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Optimal convective period badge */}
          {points[lowestIdx] && (
            <g transform={`translate(${points[lowestIdx].x}, ${points[lowestIdx].y})`}>
              <circle r="5" fill="var(--accent-moss)" stroke="var(--bg-surface)" strokeWidth="2" />
              <text y="-12" textAnchor="middle" fill="var(--accent-moss)" fontSize="10" fontWeight="700">
                LOWER PERIOD
              </text>
            </g>
          )}

          {/* Peak spike badge */}
          {points[highestIdx] && (
            <g transform={`translate(${points[highestIdx].x}, ${points[highestIdx].y})`}>
              <circle r="5" fill="var(--accent-terracotta)" stroke="var(--bg-surface)" strokeWidth="2" />
              <text y="-12" textAnchor="middle" fill="var(--accent-terracotta)" fontSize="10" fontWeight="700">
                PEAK SPIKE
              </text>
            </g>
          )}

          {/* Interactive hour points */}
          {points.map((p, i) => (
            <g key={i}>
              <circle
                cx={p.x}
                cy={p.y}
                r={hoveredIndex === i ? 5.5 : 3}
                fill={hoveredIndex === i ? "var(--accent-terracotta)" : "var(--accent-moss)"}
                stroke="var(--bg-surface)"
                strokeWidth="1.5"
                style={{ cursor: "pointer", transition: "all 0.15s ease" }}
                onMouseEnter={() => setHoveredIndex(i)}
                onClick={() => onSelectHour && onSelectHour(p.data.hour)}
              />
              {/* X-axis time labels */}
              {i % 3 === 0 && (
                <text
                  x={p.x}
                  y={height - 12}
                  textAnchor="middle"
                  fill="var(--text-tertiary)"
                  fontSize="11"
                  fontFamily="inherit"
                >
                  {p.data.hour}
                </text>
              )}
            </g>
          ))}
        </svg>
      </div>

      {/* Observation Telemetry Strip for Hovered / Lowest Hour */}
      {activePoint && (
        <div className="diurnal-observation-bar">
          <div className="obs-item">
            <span className="obs-label">Observation Window</span>
            <span className="obs-val">{activePoint.data.hour}</span>
          </div>
          <div className="obs-item">
            <span className="obs-label">Estimated AQI</span>
            <span className="obs-val highlight-moss">{activePoint.data.aqi}</span>
          </div>
          <div className="obs-item">
            <span className="obs-label">Ambient PM2.5</span>
            <span className="obs-val">{activePoint.data.pm25} µg/m³</span>
          </div>
          <div className="obs-item">
            <span className="obs-label">Ground Ozone</span>
            <span className="obs-val">{activePoint.data.o3} ppb</span>
          </div>
          <div className="obs-item">
            <span className="obs-label">Atmospheric Phase</span>
            <span className="obs-val">{activePoint.data.label}</span>
          </div>
        </div>
      )}
    </div>
  );
};
