// Exposure Science and Carbon Delta Calculator
// Grounded in WHO & EPA environmental health equations.

// Minute ventilation rates (VE) converted to m³/hour by activity intensity
export const VENTILATION_RATES = {
  sleep: 0.35,      // Resting sleep rate
  sedentary: 0.55,  // Sitting, office work, driving, gentle indoor leisure
  light: 0.90,      // Casual indoor walking, cooking, shopping, transit passenger
  moderate: 1.40,   // Brisk walking, school commute, gentle cycling
  vigorous: 2.30,   // Commuter cycling, jogging, active playground sports
  intense: 3.40     // Fast running, sprint cycling, intense cardio workout
};

// Microenvironment exposure ratios relative to ambient background station readings
export const MICROENVIRONMENTS = {
  arterial_road: {
    label: "Arterial Road / Busy Highway",
    factor: 1.45,
    description: "Direct proximity to vehicle tailpipe plumes increases exposure by ~45% over background."
  },
  side_street: {
    label: "Residential Side Street",
    factor: 1.0,
    description: "Standard urban background exposure with moderate vehicular dispersion."
  },
  green_corridor: {
    label: "Park / Green Corridor / Canal",
    factor: 0.65,
    description: "Vegetation buffering and vehicle separation cuts particulate concentrations by ~35%."
  },
  metro_train: {
    label: "Underground Metro / Modern Rail",
    factor: 0.45,
    description: "Air-conditioned cabins with filtration significantly reduce ambient particulate ingestion."
  },
  public_bus: {
    label: "City Bus / Electric Transit",
    factor: 0.70,
    description: "Enclosed transit vehicle offering moderate shielding from road-level exhaust."
  },
  car_cabin_filter: {
    label: "Private Car (Recirculate + Cabin Filter)",
    factor: 0.40,
    description: "Cabin filtration with AC on recirculate reduces PM2.5 infiltration by ~60%."
  },
  car_cabin_windows_open: {
    label: "Car / Scooter in Heavy Gridlock",
    factor: 1.75,
    description: "Trapped in bumper-to-bumper stop-and-go traffic; highest acute tailpipe exposure."
  },
  indoor_standard: {
    label: "Indoor Building (Unfiltered)",
    factor: 0.60,
    description: "Standard building envelope blocks ~40% of outdoor particulate matter."
  },
  indoor_hepa: {
    label: "Indoor Space with True HEPA",
    factor: 0.15,
    description: "Active mechanical HEPA filtration removes up to 85% of ambient fine particles."
  }
};

// Mode CO2 emission factors (grams CO2e per passenger-kilometer)
export const TRANSPORT_EMISSIONS = {
  solo_car: { label: "Solo Gasoline Car", gPerKm: 171 },
  electric_car: { label: "Electric Vehicle (Grid mix)", gPerKm: 52 },
  carpool: { label: "Carpool (2+ occupants)", gPerKm: 75 },
  bus: { label: "Public Bus", gPerKm: 68 },
  metro: { label: "Subway / Light Rail", gPerKm: 28 },
  bicycle: { label: "Bicycle / E-bike", gPerKm: 4 },
  walking: { label: "Walking / Foot", gPerKm: 0 }
};

// Activity types for the daily routine builder
export const ACTIVITY_TYPES = [
  { id: "commute", label: "Work / Study Commute", defaultDuration: 45, defaultIntensity: "moderate", defaultMicro: "arterial_road", defaultMode: "solo_car", distanceKm: 12 },
  { id: "exercise", label: "Outdoor Cardio / Exercise", defaultDuration: 45, defaultIntensity: "vigorous", defaultMicro: "side_street", defaultMode: "walking", distanceKm: 6 },
  { id: "school_run", label: "School Run / Children Escort", defaultDuration: 30, defaultIntensity: "moderate", defaultMicro: "arterial_road", defaultMode: "solo_car", distanceKm: 4 },
  { id: "shopping", label: "Errands & Shopping", defaultDuration: 40, defaultIntensity: "light", defaultMicro: "side_street", defaultMode: "solo_car", distanceKm: 5 },
  { id: "park_walk", label: "Leisure Walk & Fresh Air", defaultDuration: 45, defaultIntensity: "light", defaultMicro: "green_corridor", defaultMode: "walking", distanceKm: 3 },
  { id: "indoor_office", label: "Work / Home Office Desk", defaultDuration: 240, defaultIntensity: "sedentary", defaultMicro: "indoor_standard", defaultMode: "walking", distanceKm: 0 }
];

/**
 * Calculates PM2.5 inhaled dose in micrograms (µg) - MODELED ESTIMATE
 * Dose = Concentration (µg/m³) * Microenvironment Factor * Minute Ventilation (m³/h) * Duration (hours) * Persona Multiplier
 */
export function calculateActivityDose(pm25Ambient, microKey, intensityKey, durationMinutes, personaMultiplier = 1.0) {
  const micro = MICROENVIRONMENTS[microKey]?.factor || 1.0;
  const ventilation = VENTILATION_RATES[intensityKey] || 1.0;
  const hours = Math.max(0.05, durationMinutes / 60);

  const doseUg = pm25Ambient * micro * ventilation * hours * personaMultiplier;
  return Math.round(doseUg * 10) / 10;
}

/**
 * Calculates transportation CO2 footprint in kilograms - MODELED ESTIMATE
 */
export function calculateCarbonKg(modeKey, distanceKm) {
  const gPerKm = TRANSPORT_EMISSIONS[modeKey]?.gPerKm ?? 0;
  const totalGrams = gPerKm * (distanceKm || 0);
  return Math.round((totalGrams / 1000) * 100) / 100;
}

/**
 * Given a city's hourly PM2.5 curve, finds the ambient concentration at a given time "HH:MM"
 */
export function getAmbientAtHour(hourlyArray, timeString) {
  if (!hourlyArray || hourlyArray.length === 0) return 25;
  const timeStr = typeof timeString === "number" ? `${timeString}:00` : (timeString || "08:00");
  const hourNum = parseInt(timeStr.split(":")[0], 10) || 0;
  const safeHour = Math.min(23, Math.max(0, hourNum));
  return hourlyArray[safeHour]?.pm25 || 25;
}

/**
 * Calculates road distance between coordinates using Haversine formula with urban detour factor
 */
export function calculateHaversineKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const urbanWindingFactor = 1.35; // typical street network winding factor
  return Math.round(R * c * urbanWindingFactor * 10) / 10;
}

/**
 * Chronologically sorts activities by scheduled time "HH:MM"
 */
export function sortRoutineChronologically(routineList) {
  return [...routineList].sort((a, b) => {
    const timeA = (a.time || "00:00").split(":").map(Number);
    const timeB = (b.time || "00:00").split(":").map(Number);
    const minA = (timeA[0] || 0) * 60 + (timeA[1] || 0);
    const minB = (timeB[0] || 0) * 60 + (timeB[1] || 0);
    return minA - minB;
  });
}

/**
 * Route-Aware Recommendation Engine
 * Only recommends route shifts if verified as feasible between Origin and Destination.
 * If unverified, does NOT invent a park route; instead recommends cabin protection, timing shifts,
 * or rebalancing other flexible daily activities.
 */
export function generateOptimizedAlternative(activity, hourlyArray, allActivities = []) {
  const currentHour = parseInt((activity.time || "08:00").split(":")[0], 10) || 8;
  const isCommute = activity.type === "commute" || activity.type === "school_run";
  const hasOriginDest = Boolean(activity.origin && activity.destination);
  const isGreenVerified = Boolean(activity.verifiedGreenRoute);

  let optimized = { ...activity };
  let rationale = [];
  let routeStatus = "standard";

  if (isCommute) {
    // ROUTE VERIFICATION LOGIC
    if (!isGreenVerified) {
      // DO NOT invent a greenway route!
      routeStatus = "no_greenway_verified";
      if (hasOriginDest) {
        rationale.push(
          `Route Verification: No verified park or continuous green corridor exists between "${activity.origin}" and "${activity.destination}". Roadway alignment remains on the arterial road corridor.`
        );
      } else {
        rationale.push(
          "Route Verification: Commute corridor has not been verified for off-road greenway connectivity. Roadway environment remains arterial."
        );
      }

      // Actionable, realistic alternatives for arterial corridors:
      // A) In-Cabin Protection (for vehicles)
      if (activity.mode === "solo_car" || activity.mode === "carpool") {
        if (activity.micro === "car_cabin_windows_open" || activity.micro === "arterial_road") {
          optimized.micro = "car_cabin_filter";
          rationale.push(
            "Cabin Filtration: Keep windows sealed and operate air conditioning on internal recirculation mode. Cabin filter attenuation reduces in-vehicle fine particulate infiltration by ~60% without requiring an unfeasible route change."
          );
        }
      }

      // B) Public Transit Shift (if solo car and distance allows)
      if (activity.mode === "solo_car" && (activity.distanceKm || 0) >= 6) {
        optimized.mode = "metro";
        optimized.micro = "metro_train";
        rationale.push(
          "Transit Efficiency: Transitioning to electric metro rail avoids ~83% in transit carbon emissions and leverages filtered train carriage ventilation."
        );
      }

      // C) Departure Timing Shift (avoiding ground thermal inversion)
      if (currentHour >= 7 && currentHour <= 9) {
        const ambientNow = getAmbientAtHour(hourlyArray, activity.time);
        const ambientLater = getAmbientAtHour(hourlyArray, "09:30");
        if (ambientLater < ambientNow * 0.88) {
          optimized.time = "09:30";
          rationale.push(
            `Timing Shift: Adjusting departure from ${activity.time} to 09:30 AM avoids peak morning boundary layer trapping as daytime solar heating deepens the mixing layer (modeled PM2.5 ~` +
            `${Math.round(ambientLater)} µg/m³ vs ~${Math.round(ambientNow)} µg/m³).`
          );
        }
      }

      // D) Schedule Rebalancing Across Other Daily Activities
      // If the commute corridor cannot change route, suggest adjusting flexible outdoor exercise/errands
      const flexibleOther = allActivities.find(
        a => (a.type === "exercise" || a.type === "park_walk" || a.type === "shopping") && a.id !== activity.id
      );
      if (flexibleOther) {
        rationale.push(
          `Schedule Rebalancing: Since your commute corridor is fixed, shift flexible outdoor activities like "${flexibleOther.name}" to the midday convective window (12:00–14:30) to reduce your cumulative daily lung exposure.`
        );
      }
    } else {
      // User or map verified that a green corridor / separated path actually exists!
      routeStatus = "greenway_verified";
      if (activity.mode === "walking" || activity.mode === "bicycle") {
        optimized.micro = "green_corridor";
        rationale.push(
          `Verified Corridor Applied: Using verified park connector between "${activity.origin || 'Origin'}" and "${activity.destination || 'Destination'}". Separation from vehicle exhaust plumes cuts inhaled particulate density by ~35%.`
        );
      } else {
        rationale.push(
          `Verified Corridor Note: A separated greenway is confirmed between "${activity.origin}" and "${activity.destination}", but motorized traffic must remain on roadway surfaces. Keeping cabin windows closed is recommended.`
        );
        if (activity.micro === "arterial_road" || activity.micro === "car_cabin_windows_open") {
          optimized.micro = "car_cabin_filter";
        }
      }
    }
  } else if (activity.type === "exercise" || activity.type === "park_walk") {
    // For exercise: Look for the daily optimal convective window
    let bestHour = currentHour;
    let lowestPM25 = getAmbientAtHour(hourlyArray, activity.time);

    for (let h = 11; h <= 15; h++) {
      const pm = hourlyArray[h]?.pm25 || 999;
      if (pm < lowestPM25) {
        lowestPM25 = pm;
        bestHour = h;
      }
    }

    if (bestHour !== currentHour) {
      optimized.time = `${bestHour.toString().padStart(2, "0")}:00`;
      const currentAmbient = getAmbientAtHour(hourlyArray, activity.time);
      const pctDrop = Math.round(((currentAmbient - lowestPM25) / currentAmbient) * 100);
      rationale.push(
        `Convective Timing: Rescheduled outdoor exertion from ${activity.time} to ${optimized.time} to capitalize on the daytime convective boundary layer (modeled ambient PM2.5 drops by ~${pctDrop}%).`
      );
    }

    if (activity.verifiedGreenRoute) {
      optimized.micro = "green_corridor";
      rationale.push("Routing through verified green canopy reduces particulate concentrations by ~35% relative to roadside streets.");
    } else {
      rationale.push("Keep route on residential side streets away from arterial truck/bus corridors.");
    }
  } else {
    // Other activities (shopping, indoor desk, etc.)
    if (activity.micro === "indoor_standard") {
      optimized.micro = "indoor_hepa";
      rationale.push("Operating a mechanical True HEPA purifier in the indoor space attenuates infiltration by up to 75%.");
    } else if (activity.micro === "arterial_road") {
      if (activity.verifiedGreenRoute) {
        optimized.micro = "side_street";
        rationale.push("Diverted to confirmed neighborhood secondary streets.");
      } else {
        rationale.push("Arterial alignment maintained; keep trip duration concise.");
      }
    }
  }

  return {
    optimizedActivity: optimized,
    rationale: rationale.join(" "),
    routeStatus
  };
}

/**
 * Computes comparative metrics between baseline day routine and the optimized routine
 * Returns chronologically sorted schedule entries and aggregate totals.
 */
export function compareRoutines(routineList, hourlyArray, personaMultiplier = 1.0) {
  const sortedRoutine = sortRoutineChronologically(routineList);

  let baselineTotalDose = 0;
  let baselineTotalCarbon = 0;
  let optimizedTotalDose = 0;
  let optimizedTotalCarbon = 0;

  const comparisons = sortedRoutine.map(item => {
    const baselineAmbient = getAmbientAtHour(hourlyArray, item.time);
    const baselineDose = calculateActivityDose(baselineAmbient, item.micro, item.intensity, item.duration, personaMultiplier);
    const baselineCO2 = calculateCarbonKg(item.mode, item.distanceKm);

    const { optimizedActivity, rationale, routeStatus } = generateOptimizedAlternative(item, hourlyArray, sortedRoutine);
    const optAmbient = getAmbientAtHour(hourlyArray, optimizedActivity.time);
    const optDose = calculateActivityDose(optAmbient, optimizedActivity.micro, optimizedActivity.intensity, optimizedActivity.duration, personaMultiplier);
    const optCO2 = calculateCarbonKg(optimizedActivity.mode, optimizedActivity.distanceKm);

    baselineTotalDose += baselineDose;
    baselineTotalCarbon += baselineCO2;
    optimizedTotalDose += optDose;
    optimizedTotalCarbon += optCO2;

    const doseReductionUg = Math.round((baselineDose - optDose) * 10) / 10;
    const doseReductionPct = baselineDose > 0 ? Math.round((doseReductionUg / baselineDose) * 100) : 0;
    const carbonSavedKg = Math.round((baselineCO2 - optCO2) * 100) / 100;

    return {
      id: item.id,
      name: item.name,
      baseline: item,
      optimized: optimizedActivity,
      baselineDose,
      optDose,
      doseReductionUg,
      doseReductionPct,
      baselineCO2,
      optCO2,
      carbonSavedKg,
      rationale,
      routeStatus
    };
  });

  const totalDoseReductionUg = Math.round((baselineTotalDose - optimizedTotalDose) * 10) / 10;
  const totalDoseReductionPct = baselineTotalDose > 0 ? Math.round((totalDoseReductionUg / baselineTotalDose) * 100) : 0;
  const totalCarbonSavedKg = Math.round((baselineTotalCarbon - optimizedTotalCarbon) * 100) / 100;

  return {
    comparisons,
    totals: {
      baselineTotalDose: Math.round(baselineTotalDose * 10) / 10,
      optimizedTotalDose: Math.round(optimizedTotalDose * 10) / 10,
      totalDoseReductionUg,
      totalDoseReductionPct,
      baselineTotalCarbon: Math.round(baselineTotalCarbon * 100) / 100,
      optimizedTotalCarbon: Math.round(optimizedTotalCarbon * 100) / 100,
      totalCarbonSavedKg
    }
  };
}
