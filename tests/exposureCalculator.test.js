// tests/exposureCalculator.test.js
// Automated verification for BreatheBack Exposure & Carbon Calculation Engine
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  VENTILATION_RATES,
  MICROENVIRONMENTS,
  TRANSPORT_EMISSIONS,
  calculateActivityDose,
  calculateCarbonKg,
  calculateHaversineKm,
  getAmbientAtHour,
  sortRoutineChronologically,
  compareRoutines,
  generateOptimizedAlternative
} from '../src/utils/exposureCalculator.js';

test('Exposure Calculator - Ventilation Rates & Microenvironments Constants', (t) => {
  assert.equal(VENTILATION_RATES.sedentary, 0.55);
  assert.equal(VENTILATION_RATES.vigorous, 2.30);
  assert.equal(VENTILATION_RATES.intense, 3.40);

  assert.equal(MICROENVIRONMENTS.arterial_road.factor, 1.45);
  assert.equal(MICROENVIRONMENTS.green_corridor.factor, 0.65);
  assert.equal(MICROENVIRONMENTS.indoor_hepa.factor, 0.15);
  assert.equal(MICROENVIRONMENTS.car_cabin_filter.factor, 0.40);
});

test('calculateActivityDose - Inhaled PM2.5 calculation', (t) => {
  // Dose = Concentration (µg/m³) * Micro Factor * Ventilation (m³/h) * Duration (hours) * Multiplier
  // 100 µg/m³ * 1.45 (arterial) * 2.30 (vigorous) * 0.75h (45 min) * 1.0 = 250.125 -> 250.1
  const dose = calculateActivityDose(100, 'arterial_road', 'vigorous', 45, 1.0);
  assert.equal(dose, 250.1);

  // Child persona multiplier 1.35
  const childDose = calculateActivityDose(100, 'arterial_road', 'vigorous', 45, 1.35);
  assert.equal(childDose, Math.round(250.125 * 1.35 * 10) / 10);

  // Indoor HEPA: 100 * 0.15 * 0.55 (sedentary) * 1.0h (60 min) = 8.25 -> 8.3
  const hepaDose = calculateActivityDose(100, 'indoor_hepa', 'sedentary', 60, 1.0);
  assert.equal(hepaDose, 8.3);

  // Minimum duration constraint (at least 0.05h / 3 minutes)
  const zeroDurationDose = calculateActivityDose(100, 'side_street', 'moderate', 0, 1.0);
  assert.ok(zeroDurationDose > 0, 'Zero duration should be constrained to minimum exposure floor');
});

test('calculateCarbonKg - Transit Carbon footprint calculation', (t) => {
  // Solo car: 171 g/km * 10 km = 1710 g = 1.71 kg
  assert.equal(calculateCarbonKg('solo_car', 10), 1.71);

  // Metro: 28 g/km * 10 km = 280 g = 0.28 kg
  assert.equal(calculateCarbonKg('metro', 10), 0.28);

  // Walking & Bicycle: zero or minimal
  assert.equal(calculateCarbonKg('walking', 10), 0);
  assert.equal(calculateCarbonKg('bicycle', 10), 0.04);

  // Zero distance
  assert.equal(calculateCarbonKg('solo_car', 0), 0);
  assert.equal(calculateCarbonKg('unknown_mode', 15), 0);
});

test('calculateHaversineKm - Coordinates distance with urban winding factor', (t) => {
  // Missing or incomplete coordinates return 0
  assert.equal(calculateHaversineKm(null, null, 28.6, 77.2), 0);
  assert.equal(calculateHaversineKm(28.6, 77.2, null, null), 0);

  // Distance between Delhi Center (28.6139, 77.2090) and IGI Airport (28.5562, 77.1000)
  const dist = calculateHaversineKm(28.6139, 77.2090, 28.5562, 77.1000);
  assert.ok(dist > 10 && dist < 25, `Expected distance ~15-20 km with winding factor, got ${dist}`);
});

test('getAmbientAtHour - Hourly PM2.5 lookup', (t) => {
  const mockHourly = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i.toString().padStart(2, '0')}:00`,
    pm25: 50 + i * 5
  }));

  // Hour 8 should have 50 + 8*5 = 90
  assert.equal(getAmbientAtHour(mockHourly, '08:30'), 90);
  // Hour 14 should have 50 + 14*5 = 120
  assert.equal(getAmbientAtHour(mockHourly, '14:00'), 120);

  // Fallback on empty or missing data
  assert.equal(getAmbientAtHour([], '08:00'), 25);
  assert.equal(getAmbientAtHour(null, '08:00'), 25);
});

test('sortRoutineChronologically - Preserves order and does not mutate', (t) => {
  const unsorted = [
    { id: 1, time: '18:30', name: 'Dinner' },
    { id: 2, time: '07:15', name: 'Jog' },
    { id: 3, time: '12:00', name: 'Lunch' },
    { id: 4, time: '08:45', name: 'Commute' }
  ];

  const sorted = sortRoutineChronologically(unsorted);

  assert.equal(sorted[0].time, '07:15');
  assert.equal(sorted[1].time, '08:45');
  assert.equal(sorted[2].time, '12:00');
  assert.equal(sorted[3].time, '18:30');

  // Verify non-destructive sorting
  assert.equal(unsorted[0].time, '18:30');
});

test('compareRoutines - Computes baseline vs optimized totals accurately', (t) => {
  const mockHourly = Array.from({ length: 24 }, () => ({ pm25: 80 }));
  const routine = [
    {
      id: 'act-1',
      name: 'Work Commute',
      type: 'commute',
      time: '08:30',
      duration: 45,
      intensity: 'moderate',
      micro: 'arterial_road',
      mode: 'solo_car',
      distanceKm: 14,
      verifiedGreenRoute: false
    }
  ];

  const result = compareRoutines(routine, mockHourly, 1.0);

  assert.ok(result.comparisons.length === 1);
  assert.ok(result.totals.baselineTotalDose > 0);
  assert.ok(result.totals.baselineTotalCarbon > 0);
  assert.ok(result.totals.totalCarbonSavedKg >= 0);
});
