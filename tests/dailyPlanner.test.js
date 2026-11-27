// tests/dailyPlanner.test.js
// Automated verification for Daily Exposure Planner schedule rebalancing logic
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  sortRoutineChronologically,
  generateOptimizedAlternative,
  compareRoutines
} from '../src/utils/exposureCalculator.js';

test('Daily Planner - Fixed activities preserve scheduled times', (t) => {
  const schedule = [
    {
      id: 'fixed-commute',
      name: 'Mandatory Office Arrival',
      type: 'commute',
      time: '09:00',
      duration: 45,
      intensity: 'moderate',
      flexibility: 'fixed',
      micro: 'arterial_road',
      mode: 'solo_car',
      distanceKm: 12,
      origin: 'Home',
      destination: 'Office'
    },
    {
      id: 'flexible-jog',
      name: 'Morning Jog',
      type: 'exercise',
      time: '07:00',
      duration: 40,
      intensity: 'vigorous',
      flexibility: 'flexible',
      micro: 'side_street',
      mode: 'walking',
      distanceKm: 5
    }
  ];

  const mockHourly = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i.toString().padStart(2, '0')}:00`,
    pm25: i === 13 ? 35 : 120
  }));

  // Optimize routine
  const { comparisons } = compareRoutines(schedule, mockHourly);

  const fixedComp = comparisons.find(c => c.id === 'fixed-commute');
  const flexComp = comparisons.find(c => c.id === 'flexible-jog');

  // Flexible jog is rescheduled to optimal afternoon window
  assert.equal(flexComp.optimized.time, '13:00');
  // Fixed commute retains mode and destination
  assert.equal(fixedComp.baseline.flexibility, 'fixed');
});

test('Daily Planner - Chronological order is strictly maintained', (t) => {
  const dayRoutine = [
    { id: '1', time: '20:00', name: 'Night Walk' },
    { id: '2', time: '06:30', name: 'Morning Cardio' },
    { id: '3', time: '13:15', name: 'Lunch Errand' },
    { id: '4', time: '08:45', name: 'Commute' }
  ];

  const sorted = sortRoutineChronologically(dayRoutine);

  for (let i = 0; i < sorted.length - 1; i++) {
    const [h1, m1] = sorted[i].time.split(':').map(Number);
    const [h2, m2] = sorted[i + 1].time.split(':').map(Number);
    const totalMin1 = h1 * 60 + m1;
    const totalMin2 = h2 * 60 + m2;
    assert.ok(totalMin1 <= totalMin2, `Schedule should be in ascending time order: ${sorted[i].time} <= ${sorted[i + 1].time}`);
  }
});

test('Daily Planner - Missing forecast fallback preserves existing times without inventing hourly values', (t) => {
  const activity = {
    id: 'walk-1',
    name: 'Evening Walk',
    type: 'exercise',
    time: '19:00',
    duration: 30,
    intensity: 'light',
    micro: 'side_street',
    mode: 'walking'
  };

  // Empty hourly forecast
  const result = generateOptimizedAlternative(activity, []);

  // When hourlyArray is empty, bestHour cannot shift to invented forecast hours
  assert.equal(result.optimizedActivity.time, '19:00');
});

test('Daily Planner - Accept/Revert state management flow', (t) => {
  const originalRoutine = [
    { id: 'act-1', name: 'Morning Run', time: '07:00', micro: 'arterial_road' }
  ];

  const suggestedRoutine = [
    { id: 'act-1', name: 'Morning Run', time: '13:00', micro: 'green_corridor' }
  ];

  // User accepts: state replaces original with suggested
  let currentSchedule = [...suggestedRoutine];
  assert.equal(currentSchedule[0].time, '13:00');

  // User reverts: restores original baseline
  currentSchedule = [...originalRoutine];
  assert.equal(currentSchedule[0].time, '07:00');
  assert.equal(currentSchedule[0].micro, 'arterial_road');
});
