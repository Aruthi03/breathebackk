// tests/routeRecommendation.test.js
// Automated verification for Route-Aware Recommendation Logic
import test from 'node:test';
import assert from 'node:assert/strict';

import { generateOptimizedAlternative } from '../src/utils/exposureCalculator.js';

test('Route Recommendation - Unverified route DOES NOT invent greenway', (t) => {
  const unverifiedCommute = {
    id: 'commute-1',
    name: 'Office Transit Commute',
    type: 'commute',
    time: '08:30',
    duration: 45,
    intensity: 'moderate',
    micro: 'arterial_road',
    mode: 'solo_car',
    distanceKm: 14,
    origin: 'South Sector Colony',
    destination: 'Central Business District',
    verifiedGreenRoute: false
  };

  const mockHourly = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i.toString().padStart(2, '0')}:00`,
    pm25: i >= 7 && i <= 9 ? 120 : 60
  }));

  const result = generateOptimizedAlternative(unverifiedCommute, mockHourly);

  // Must flag no greenway verified
  assert.equal(result.routeStatus, 'no_greenway_verified');
  // Must NOT invent green_corridor
  assert.notEqual(result.optimizedActivity.micro, 'green_corridor');
  // Rationale must explicitly state lack of continuous greenway
  assert.match(result.rationale, /No verified park or continuous green corridor exists/i);
  // Recommends cabin filtration
  assert.match(result.rationale, /Cabin filtration/i);
  // For solo car >= 6km, recommends transition to metro rail
  assert.equal(result.optimizedActivity.mode, 'metro');
});

test('Route Recommendation - Verified greenway properly applies green corridor microenvironment', (t) => {
  const verifiedWalkingCommute = {
    id: 'commute-walk',
    name: 'Walk to Campus',
    type: 'commute',
    time: '08:30',
    duration: 25,
    intensity: 'moderate',
    micro: 'arterial_road',
    mode: 'walking',
    distanceKm: 2,
    origin: 'Student Hostel',
    destination: 'Faculty Hall',
    verifiedGreenRoute: true
  };

  const mockHourly = Array.from({ length: 24 }, () => ({ pm25: 75 }));

  const result = generateOptimizedAlternative(verifiedWalkingCommute, mockHourly);

  assert.equal(result.routeStatus, 'greenway_verified');
  assert.equal(result.optimizedActivity.micro, 'green_corridor');
  assert.match(result.rationale, /Verified Corridor Applied/i);
});

test('Route Recommendation - Motorized vehicles on verified route remain on roadway', (t) => {
  const verifiedDrivingCommute = {
    id: 'commute-car',
    name: 'Drive to Work',
    type: 'commute',
    time: '08:30',
    duration: 30,
    intensity: 'sedentary',
    micro: 'arterial_road',
    mode: 'solo_car',
    distanceKm: 8,
    origin: 'North Suburb',
    destination: 'Tech Park',
    verifiedGreenRoute: true
  };

  const mockHourly = Array.from({ length: 24 }, () => ({ pm25: 75 }));

  const result = generateOptimizedAlternative(verifiedDrivingCommute, mockHourly);

  assert.equal(result.routeStatus, 'greenway_verified');
  // Cars cannot drive in greenways, so micro is set to filtered cabin, not green corridor
  assert.equal(result.optimizedActivity.micro, 'car_cabin_filter');
  assert.match(result.rationale, /motorized traffic must remain on roadway surfaces/i);
});

test('Route Recommendation - Exercise rescheduling to convective low PM2.5 window', (t) => {
  const morningRun = {
    id: 'exercise-1',
    name: 'Morning Jog',
    type: 'exercise',
    time: '07:30',
    duration: 45,
    intensity: 'vigorous',
    micro: 'arterial_road',
    mode: 'walking',
    distanceKm: 5,
    verifiedGreenRoute: false
  };

  // Peak pollution at 7 AM (140 ug/m3), convective minimum at 1 PM (45 ug/m3)
  const mockHourly = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i.toString().padStart(2, '0')}:00`,
    pm25: i === 13 ? 45 : (i >= 6 && i <= 9 ? 140 : 80)
  }));

  const result = generateOptimizedAlternative(morningRun, mockHourly);

  assert.equal(result.optimizedActivity.time, '13:00');
  assert.match(result.rationale, /Convective Timing: Rescheduled outdoor exertion/i);
});
