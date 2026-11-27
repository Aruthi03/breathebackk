// tests/airCoach.test.js
// Automated verification for Grounded Air Coach Decision Engine
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DEFAULT_USER_ACTIVITIES,
  generateAirCoachResponse
} from '../src/utils/airCoachEngine.js';
import { BENCHMARK_CITIES } from '../src/data/mockAirData.js';

test('Air Coach - DEFAULT_USER_ACTIVITIES schema and schedule mix', (t) => {
  assert.equal(DEFAULT_USER_ACTIVITIES.length, 6);

  const fixedActs = DEFAULT_USER_ACTIVITIES.filter(a => a.flexibility === 'fixed');
  const flexibleActs = DEFAULT_USER_ACTIVITIES.filter(a => a.flexibility === 'flexible');

  assert.equal(fixedActs.length, 2, 'Must include 2 fixed commitments (work commute & school pickup)');
  assert.equal(flexibleActs.length, 4, 'Must include 4 flexible windows (cardio, errands, shopping, walk)');

  DEFAULT_USER_ACTIVITIES.forEach(act => {
    assert.ok(act.id, 'Activity must have an id');
    assert.ok(act.name, 'Activity must have a name');
    assert.ok(act.time, 'Activity must have a scheduled time HH:MM');
    assert.ok(act.duration > 0, 'Activity duration must be > 0');
    assert.ok(['fixed', 'flexible'].includes(act.flexibility));
    assert.ok(act.micro, 'Activity must define microenvironment');
  });
});

test('Air Coach - 5-Part Grounded Structure on all query responses', (t) => {
  const city = BENCHMARK_CITIES.delhi;
  const queries = [
    'How should I plan my day with this AQI?',
    'Can I move my outdoor exercise?',
    'What can I do indoors to improve air quality?',
    'How can I reduce unnecessary vehicle emissions?',
    'Should I open windows tonight for ventilation?',
    'Is it safe for children to play soccer outside at 4 PM?',
    'General fallback check about pollution'
  ];

  queries.forEach(q => {
    const res = generateAirCoachResponse(q, city, 'general', DEFAULT_USER_ACTIVITIES);
    assert.ok(res.action, `Response for "${q}" must include action`);
    assert.ok(res.mechanism, `Response for "${q}" must include mechanism`);
    assert.ok(res.grounding, `Response for "${q}" must include grounding`);
    assert.ok(res.assessment, `Response for "${q}" must include assessment`);
    assert.ok(res.limitations, `Response for "${q}" must include limitations`);
  });
});

test('Air Coach - "How should I plan my day" preserves fixed commitments and shifts flexible activities', (t) => {
  const city = BENCHMARK_CITIES.delhi;
  const res = generateAirCoachResponse('How should I plan my day with this AQI?', city, 'general', DEFAULT_USER_ACTIVITIES);

  // References fixed commitments preservation
  assert.match(res.action, /Fixed Commitments/i);
  assert.match(res.action, /Flexible Activities/i);
  // Mechanism explains boundary layer thermal inversion vs convective solar mixing
  assert.match(res.mechanism, /thermal inversion/i);
  assert.match(res.mechanism, /convective/i);
  // Grounding quotes actual city and AQI
  assert.match(res.grounding, /Delhi/i);
  assert.match(res.grounding, /285/i);
});

test('Air Coach - "Can I move my outdoor exercise" honors Fixed vs Flexible label', (t) => {
  const city = BENCHMARK_CITIES.delhi;

  // 1. Flexible exercise: recommends shifting to convective window
  const resFlexible = generateAirCoachResponse('Can I move my outdoor exercise?', city, 'general', DEFAULT_USER_ACTIVITIES);
  assert.match(resFlexible.action, /reschedule/i);
  assert.match(resFlexible.action, /Solar Convective Dispersion Window/i);

  // 2. Fixed exercise: strictly preserves schedule and warns user
  const activitiesWithFixedRun = DEFAULT_USER_ACTIVITIES.map(a =>
    a.id === 'act-1' ? { ...a, flexibility: 'fixed' } : a
  );
  const resFixed = generateAirCoachResponse('Can I move my outdoor exercise?', city, 'general', activitiesWithFixedRun);
  assert.match(resFixed.action, /Fixed Commitment/i);
  assert.match(resFixed.action, /strictly preserves it/i);
  assert.match(resFixed.limitations, /Fixed commitments are never modified without explicit user authorization/i);
});

test('Air Coach - Missing hourly forecast does not hallucinate hourly curves', (t) => {
  // City without hourly array
  const cityNoForecast = {
    ...BENCHMARK_CITIES.chennai,
    hourly: []
  };

  const res = generateAirCoachResponse('Can I move my outdoor exercise?', cityNoForecast, 'general', DEFAULT_USER_ACTIVITIES);

  assert.match(res.limitations, /Hourly Forecast Unavailable/i);
  assert.match(res.limitations, /Specific hourly outdoor windows are not invented/i);
});

test('Air Coach - "What can I do indoors" returns 4-point protocol with infiltration physics', (t) => {
  const city = BENCHMARK_CITIES.delhi;
  const res = generateAirCoachResponse('What can I do indoors to improve air quality?', city, 'general', DEFAULT_USER_ACTIVITIES);

  assert.match(res.action, /Four-Point Indoor Sanctuary Protocol/i);
  assert.match(res.action, /Latch Exterior Windows/i);
  assert.match(res.action, /True HEPA Filtration/i);
  assert.match(res.mechanism, /filtration/i);
  assert.match(res.grounding, /ASHRAE 62.2/i);
});

test('Air Coach - "How can I reduce vehicle emissions" handles unverified routes honestly', (t) => {
  const city = BENCHMARK_CITIES.delhi;
  const res = generateAirCoachResponse('How can I reduce unnecessary vehicle emissions?', city, 'general', DEFAULT_USER_ACTIVITIES);

  // Default act-2 has verifiedGreenRoute: false
  assert.match(res.action, /no verified greenway alternative/i);
  assert.match(res.grounding, /No Greenway Verified/i);
  // Recommends modal transition to metro
  assert.match(res.action, /Electric Metro Rail/i);
});

test('Air Coach - Off-topic query triggered domain guardrail', (t) => {
  const city = BENCHMARK_CITIES.delhi;
  const res = generateAirCoachResponse('What is the capital of Australia and who is the prime minister?', city, 'general', DEFAULT_USER_ACTIVITIES);

  assert.equal(res.action, 'Advisory Scope Notice');
  assert.match(res.limitations, /calibrated specifically for atmospheric science/i);
});
