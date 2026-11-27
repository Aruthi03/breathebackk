// tests/dataIntegrity.test.js
// Automated verification for Benchmark Cities, Personas & Regional Demo Generator
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  BENCHMARK_CITIES,
  USER_PERSONAS,
  generateRegionalDemoStations
} from '../src/data/mockAirData.js';

test('Data Integrity - All 9 Benchmark Cities exist and have complete telemetry schemas', (t) => {
  const expectedCities = [
    'delhi',
    'tamil_nadu',
    'chennai',
    'coimbatore',
    'los_angeles',
    'london',
    'beijing',
    'paris',
    'jakarta'
  ];

  expectedCities.forEach(cityKey => {
    const city = BENCHMARK_CITIES[cityKey];
    assert.ok(city, `City ${cityKey} must exist in BENCHMARK_CITIES`);
    assert.ok(city.id, `${cityKey} must have an id`);
    assert.ok(city.name, `${cityKey} must have a name`);
    assert.ok(city.coords && typeof city.coords.lat === 'number' && typeof city.coords.lng === 'number', `${cityKey} must have valid coords`);
    assert.ok(typeof city.aqi === 'number' && city.aqi >= 0, `${cityKey} must have numeric aqi`);
    assert.ok(city.status, `${cityKey} must have status`);
    assert.ok(city.primaryPollutant, `${cityKey} must have primaryPollutant`);
    assert.ok(city.dataSource, `${cityKey} must attribute a dataSource`);
    assert.ok(city.lastUpdated, `${cityKey} must have lastUpdated timestamp`);
    assert.ok(city.pollutants && typeof city.pollutants.pm25 === 'number', `${cityKey} must have pollutants.pm25`);
    assert.ok(city.weather && typeof city.weather.temp === 'number', `${cityKey} must have weather.temp`);
  });
});

test('Data Integrity - User Personas and breathing multipliers', (t) => {
  const requiredPersonas = ['general', 'child', 'sensitive', 'athlete'];

  requiredPersonas.forEach(pKey => {
    const p = USER_PERSONAS[pKey];
    assert.ok(p, `Persona ${pKey} must exist`);
    assert.ok(p.label, `${pKey} must have label`);
    assert.ok(p.breathingMultiplier > 0, `${pKey} breathingMultiplier must be > 0`);
    assert.ok(p.aqiWarningThreshold > 0, `${pKey} must define an aqiWarningThreshold`);
  });

  // Specific physiological multipliers
  assert.equal(USER_PERSONAS.general.breathingMultiplier, 1.0);
  assert.equal(USER_PERSONAS.child.breathingMultiplier, 1.35);
  assert.equal(USER_PERSONAS.sensitive.breathingMultiplier, 1.15);
  assert.equal(USER_PERSONAS.athlete.breathingMultiplier, 2.8);
});

test('Data Integrity - generateRegionalDemoStations creates valid labeled demo stations', (t) => {
  const centerLat = 13.0827;
  const centerLng = 80.2707;
  const placeName = 'Demo City';

  const stations = generateRegionalDemoStations(centerLat, centerLng, placeName, 'city');

  assert.equal(stations.length, 6, 'Should generate 6 diverse regional archetype stations');

  stations.forEach(st => {
    assert.ok(st.id.startsWith('demo-'), 'Station ID must indicate demo provenance');
    assert.ok(st.name.includes(placeName), 'Station name must reference placeName');
    assert.ok(st.isDemo === true, 'Station must carry isDemo: true flag');
    assert.match(st.dataSource, /DEMO Station — Sample Benchmark Data/i, 'DataSource must state demo benchmark provenance');
    assert.ok(typeof st.lat === 'number' && typeof st.lng === 'number');
    assert.ok(st.aqi >= 0 && st.aqi <= 500);
    assert.ok(st.pm25 > 0);
  });
});
