// tests/aqiUtils.test.js
// Automated verification for Official CPCB NAQI Scale & Warning Logic
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  AQI_LEVELS,
  getAQIInfo,
  getPM25Warning
} from '../src/utils/aqiUtils.js';

test('AQI Utils - Official CPCB NAQI Bands Constants', (t) => {
  assert.equal(AQI_LEVELS.length, 6);

  const labels = AQI_LEVELS.map(l => l.label);
  assert.deepEqual(labels, [
    'Good',
    'Satisfactory',
    'Moderate',
    'Poor',
    'Very Poor',
    'Severe'
  ]);
});

test('getAQIInfo - Accurate categorization and boundary values', (t) => {
  // Good: 0 - 50
  assert.equal(getAQIInfo(0).label, 'Good');
  assert.equal(getAQIInfo(25).label, 'Good');
  assert.equal(getAQIInfo(50).label, 'Good');

  // Satisfactory: 51 - 100
  assert.equal(getAQIInfo(51).label, 'Satisfactory');
  assert.equal(getAQIInfo(75).label, 'Satisfactory');
  assert.equal(getAQIInfo(100).label, 'Satisfactory');

  // Moderate: 101 - 200
  assert.equal(getAQIInfo(101).label, 'Moderate');
  assert.equal(getAQIInfo(150).label, 'Moderate');
  assert.equal(getAQIInfo(200).label, 'Moderate');

  // Poor: 201 - 300
  assert.equal(getAQIInfo(201).label, 'Poor');
  assert.equal(getAQIInfo(250).label, 'Poor');
  assert.equal(getAQIInfo(300).label, 'Poor');

  // Very Poor: 301 - 400
  assert.equal(getAQIInfo(301).label, 'Very Poor');
  assert.equal(getAQIInfo(350).label, 'Very Poor');
  assert.equal(getAQIInfo(400).label, 'Very Poor');

  // Severe: 401+
  assert.equal(getAQIInfo(401).label, 'Severe');
  assert.equal(getAQIInfo(500).label, 'Severe');
  assert.equal(getAQIInfo(850).label, 'Severe');

  // Negative or undefined gracefully defaults to Good (0)
  assert.equal(getAQIInfo(-10).label, 'Good');
  assert.equal(getAQIInfo(null).label, 'Good');
});

test('getPM25Warning - Health warnings calibrated by vulnerability profile', (t) => {
  // Sensitive profile (asthmatic/child) warnings at > 60 µg/m³
  const sensitiveHigh = getPM25Warning(65, 'sensitive');
  assert.equal(sensitiveHigh.severity, 'high');
  assert.match(sensitiveHigh.text, /Sensitive population notice/i);

  // Sensitive profile warning at > 30 µg/m³
  const sensitiveMod = getPM25Warning(35, 'child');
  assert.equal(sensitiveMod.severity, 'moderate');
  assert.match(sensitiveMod.text, /Mild irritation threshold/i);

  // Athlete profile warning at > 75 µg/m³
  const athleteWarn = getPM25Warning(80, 'athlete');
  assert.equal(athleteWarn.severity, 'high');
  assert.match(athleteWarn.text, /Athletic notice/i);

  // General population severe threshold (> 150 µg/m³)
  const generalSevere = getPM25Warning(180, 'general');
  assert.equal(generalSevere.severity, 'severe');
  assert.match(generalSevere.text, /Severe particulate density/i);

  // Normal conditions
  const normal = getPM25Warning(15, 'general');
  assert.equal(normal.severity, 'normal');
});
