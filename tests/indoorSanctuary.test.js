// tests/indoorSanctuary.test.js
// Automated verification for Indoor Air Quality (IAQ) and Sanctuary Interventions
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ROOM_GUIDES,
  calculateIndoorAQI
} from '../src/data/indoorAdviceData.js';

test('Indoor Sanctuary - ROOM_GUIDES schema and content integrity', (t) => {
  assert.equal(ROOM_GUIDES.length, 4);

  const roomIds = ROOM_GUIDES.map(r => r.id);
  assert.ok(roomIds.includes('kitchen'));
  assert.ok(roomIds.includes('bedroom'));
  assert.ok(roomIds.includes('living'));
  assert.ok(roomIds.includes('office'));

  ROOM_GUIDES.forEach(guide => {
    assert.ok(guide.name, 'Room must have a name');
    assert.ok(guide.primaryThreats.length > 0, 'Room must list primary threats');
    assert.ok(guide.interventions.length > 0, 'Room must list actionable interventions');
    assert.ok(guide.mythBuster, 'Room must have a scientific mythbuster explanation');

    guide.interventions.forEach(item => {
      assert.ok(item.title, 'Intervention must have a title');
      assert.ok(item.action, 'Intervention must have actionable instructions');
      assert.ok(item.impact, 'Intervention must have quantified or qualitative impact');
    });
  });
});

test('calculateIndoorAQI - Infiltration dynamics for sealed vs open windows', (t) => {
  const outdoorPM25 = 100;

  // 1. Standard home with closed windows (infiltration ~50%)
  const standard = calculateIndoorAQI(outdoorPM25, {
    windowsOpen: false,
    hepaActive: false,
    cookingActive: false,
    weatherStripped: false
  });
  assert.equal(standard.indoorPM25, 50);
  assert.equal(standard.protectionPercentage, 50);

  // 2. Open windows (infiltration increases to ~88%)
  const openWindows = calculateIndoorAQI(outdoorPM25, {
    windowsOpen: true,
    hepaActive: false,
    cookingActive: false,
    weatherStripped: false
  });
  assert.equal(openWindows.indoorPM25, 88);
  assert.equal(openWindows.protectionPercentage, 12);

  // 3. Weatherstripped / tightly sealed envelope (infiltration drops to ~32%)
  const sealed = calculateIndoorAQI(outdoorPM25, {
    windowsOpen: false,
    hepaActive: false,
    cookingActive: false,
    weatherStripped: true
  });
  assert.equal(sealed.indoorPM25, 32);
  assert.equal(sealed.protectionPercentage, 68);
});

test('calculateIndoorAQI - Active True HEPA filtration attenuation', (t) => {
  const outdoorPM25 = 150;

  // HEPA active with closed windows removes 82% of infiltrated PM2.5
  // Outdoor (150) * 0.50 (infiltrated) = 75
  // HEPA removal (82%): 75 * (1 - 0.82) = 13.5 -> 14
  const hepaClosed = calculateIndoorAQI(outdoorPM25, {
    windowsOpen: false,
    hepaActive: true,
    cookingActive: false,
    weatherStripped: false
  });

  assert.equal(hepaClosed.indoorPM25, 14);
  assert.ok(hepaClosed.protectionPercentage > 85, `Expected protection > 85%, got ${hepaClosed.protectionPercentage}%`);

  // HEPA active with open windows has reduced removal efficiency (45%)
  const hepaOpen = calculateIndoorAQI(outdoorPM25, {
    windowsOpen: true,
    hepaActive: true,
    cookingActive: false,
    weatherStripped: false
  });
  // 150 * 0.88 = 132 -> 132 * (1 - 0.45) = 72.6 -> 73
  assert.equal(hepaOpen.indoorPM25, 73);
});

test('calculateIndoorAQI - Indoor cooking emissions increase fine particulates', (t) => {
  const outdoorPM25 = 40;

  // Without cooking: 40 * 0.5 = 20
  const baseline = calculateIndoorAQI(outdoorPM25, {
    windowsOpen: false,
    hepaActive: false,
    cookingActive: false,
    weatherStripped: false
  });

  // With active frying/cooking (+55 ug/m3): 20 + 55 = 75
  const cooking = calculateIndoorAQI(outdoorPM25, {
    windowsOpen: false,
    hepaActive: false,
    cookingActive: true,
    weatherStripped: false
  });

  assert.equal(cooking.indoorPM25, baseline.indoorPM25 + 55);
  assert.ok(cooking.indoorAQI > baseline.indoorAQI);
});

test('calculateIndoorAQI - Minimum safe floor constraint', (t) => {
  // Even with 0 outdoor PM2.5 and HEPA active, indoor PM2.5 should not drop below 3 µg/m³
  const pristine = calculateIndoorAQI(0, {
    windowsOpen: false,
    hepaActive: true,
    cookingActive: false,
    weatherStripped: true
  });

  assert.ok(pristine.indoorPM25 >= 3, `Expected minimum floor of 3 µg/m³, got ${pristine.indoorPM25}`);
});
