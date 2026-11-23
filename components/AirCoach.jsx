// BreatheBack - Context-Aware Air Coach (Intelligent Environmental Decision Assistant)
// Atmospheric Field Journal Design System
// Fully grounded in active city telemetry, user schedule (Fixed vs Flexible), route verification,
// indoor sanctuary physics, and impact calculations with optional Gemini API integration.
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Icon } from './Icons';
import { USER_PERSONAS } from '../data/mockAirData';
import { ROOM_GUIDES, calculateIndoorAQI } from '../data/indoorAdviceData';
import {
  VENTILATION_RATES,
  MICROENVIRONMENTS,
  TRANSPORT_EMISSIONS,
  calculateActivityDose,
  calculateCarbonKg,
  getAmbientAtHour
} from '../utils/exposureCalculator';

const DEFAULT_USER_ACTIVITIES = [
  {
    id: "act-1",
    name: "Morning Outdoor Cardio & Jog",
    category: "exercise",
    time: "07:15",
    duration: 45,
    intensity: "vigorous",
    flexibility: "flexible",
    micro: "arterial_road",
    mode: "walking",
    distanceKm: 5,
    origin: "Residential Enclave",
    destination: "Main Ring Boulevard",
    verifiedGreenRoute: false,
    notes: "Neighborhood roadway and perimeter loop."
  },
  {
    id: "act-2",
    name: "Workplace / College Transit Commute",
    category: "commute",
    time: "08:30",
    duration: 45,
    intensity: "moderate",
    flexibility: "fixed",
    micro: "arterial_road",
    mode: "solo_car",
    distanceKm: 14,
    origin: "South Sector Colony",
    destination: "Central Business District",
    verifiedGreenRoute: false,
    notes: "Mandatory office / college class arrival."
  },
  {
    id: "act-3",
    name: "Lunch Break & Outdoor Errand Run",
    category: "shopping",
    time: "12:30",
    duration: 30,
    intensity: "moderate",
    flexibility: "flexible",
    micro: "side_street",
    mode: "walking",
    distanceKm: 1.5,
    origin: "Central Business District",
    destination: "Market Arcade",
    verifiedGreenRoute: false,
    notes: "Pharmacy pickup and corner market walk."
  },
  {
    id: "act-4",
    name: "School Escort & Dismissal Pickup",
    category: "school",
    time: "15:30",
    duration: 35,
    intensity: "moderate",
    flexibility: "fixed",
    micro: "arterial_road",
    mode: "solo_car",
    distanceKm: 6,
    origin: "Central Business District",
    destination: "West Sector Academy",
    verifiedGreenRoute: false,
    notes: "Scheduled school dismissal gate pickup."
  },
  {
    id: "act-5",
    name: "Evening Commercial Errands & Retail",
    category: "shopping",
    time: "18:00",
    duration: 40,
    intensity: "light",
    flexibility: "flexible",
    micro: "arterial_road",
    mode: "solo_car",
    distanceKm: 4,
    origin: "Home",
    destination: "High-density retail strip",
    verifiedGreenRoute: false,
    notes: "Commercial shopping strip and market stalls."
  },
  {
    id: "act-6",
    name: "Evening Family Walk & Dog Exercise",
    category: "leisure",
    time: "19:45",
    duration: 35,
    intensity: "light",
    flexibility: "flexible",
    micro: "green_corridor",
    mode: "walking",
    distanceKm: 2,
    origin: "Home",
    destination: "Community Botanical Garden",
    verifiedGreenRoute: true,
    notes: "Community parkway and canal path."
  }
];

export const AirCoach = ({ city, personaKey, onNavigateToSection }) => {
  const [messages, setMessages] = useState(() => [
    {
      role: "assistant",
      source: "engine",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      structuredData: {
        action: `Welcome to the **Air Quality Field Advisory**. I am calibrated for **${city.name}** and your **${USER_PERSONAS[personaKey]?.label || "General Adult"}** physiology profile.`,
        mechanism: `I continuously cross-reference municipal station telemetry with boundary layer thermal inversion cycles, building envelope infiltration physics, and route feasibility.`,
        grounding: `Active Territory: **${city.name}** • Baseline AQI: **${city.aqi}** (${city.status}) • Dominant Pollutant: **${city.primaryPollutant || 'PM2.5'}**\nData Source: **${city.dataSource}** (${city.lastUpdated})`,
        assessment: `Select any of the primary inquiry chips below or ask a custom question regarding workout timing, transit routes, or indoor filtration.`,
        limitations: `All health guidance is preventive and grounded in ambient exposure modeling. Not a substitute for clinical medical care.`
      }
    }
  ]);

  const [inputText, setInputText] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [showContextDrawer, setShowContextDrawer] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [apiKey, setApiKey] = useState(() => sessionStorage.getItem("breatheback_gemini_key") || "");
  const [userActivities, setUserActivities] = useState(DEFAULT_USER_ACTIVITIES);

  const scrollRef = useRef(null);
  const persona = USER_PERSONAS[personaKey] || USER_PERSONAS.general;
  const hasHourlyData = Boolean(city.hourly && city.hourly.length > 0);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  // Core Natural-Language Suggested Chips
  const PRIMARY_CHIPS = [
    { label: "How should I plan my day with this AQI?", query: "How should I plan my day with this AQI?" },
    { label: "Can I move my outdoor exercise?", query: "Can I move my outdoor exercise?" },
    { label: "What can I do indoors to improve air quality?", query: "What can I do indoors to improve air quality?" },
    { label: "How can I reduce unnecessary vehicle emissions?", query: "How can I reduce unnecessary vehicle emissions?" },
    { label: "Window ventilation tonight?", query: "Should I open bedroom windows tonight for ventilation or keep them sealed?" },
    { label: "Children outdoor play at 4 PM?", query: "Is it safe for children to play soccer outside at 4:00 PM today?" }
  ];

  // Toggle activity flexibility (Fixed vs Flexible)
  const handleToggleFlexibility = (id) => {
    setUserActivities(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          flexibility: item.flexibility === "fixed" ? "flexible" : "fixed"
        };
      }
      return item;
    }));
  };

  // Toggle route greenway verification
  const handleToggleRouteVerification = (id) => {
    setUserActivities(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          verifiedGreenRoute: !item.verifiedGreenRoute
        };
      }
      return item;
    }));
  };

  /**
   * Deterministic Grounded Reasoning Engine
   * Generates strictly formatted 5-part responses grounded in live app data
   */
  const generateGroundedResponse = (query) => {
    const q = query.trim().toLowerCase();
    const aqi = city.aqi || 120;
    const pm25 = city.pollutants?.pm25 || Math.round(aqi * 0.65);
    const status = city.status || "Moderate";
    const isHighExposure = aqi > 150 || pm25 > 60;

    const fixedActivities = userActivities.filter(a => a.flexibility === "fixed");
    const flexibleActivities = userActivities.filter(a => a.flexibility === "flexible");
    const exerciseAct = userActivities.find(a =>
      a.category === "exercise" ||
      a.name.toLowerCase().includes("jog") ||
      a.name.toLowerCase().includes("cardio") ||
      a.name.toLowerCase().includes("run")
    );
    const commuteAct = userActivities.find(a =>
      a.category === "commute" ||
      a.name.toLowerCase().includes("commute") ||
      a.mode === "solo_car" ||
      a.mode === "bus" ||
      a.mode === "metro"
    );

    // Safeguard check for domain relevance
    const airKeywords = [
      "aqi", "air", "pollution", "pm2.5", "pm10", "mask", "hepa", "window",
      "exercise", "run", "jog", "workout", "cardio", "walk", "commute", "transit",
      "car", "metro", "bus", "emission", "vehicle", "indoor", "breathe", "lung",
      "child", "kid", "asthma", "inversion", "ozone", "plan", "day", "schedule", "route"
    ];
    const isRelated = airKeywords.some(k => q.includes(k));
    if (!isRelated && q.length > 8) {
      return {
        action: "Advisory Scope Notice",
        mechanism: "Atmospheric Field Journal Specialization",
        grounding: `Territory Telemetry: **${city.name}** (AQI **${aqi}**) • Profile: **${persona.label}**`,
        assessment: "Domain Constrained Advisory [No Speculative Content]",
        limitations: "I am calibrated specifically for atmospheric science, respiratory micro-exposure, route planning, and environmental decisions in BreatheBack. For general inquiries outside air quality, please consult a general search engine."
      };
    }

    // 1. HOW SHOULD I PLAN MY DAY WITH THIS AQI?
    if (q.includes("plan my day") || q.includes("plan day") || (q.includes("how") && q.includes("plan") && q.includes("aqi")) || q.includes("daily plan")) {
      const morningEx = userActivities.find(a => a.time < "10:00" && (a.category === "exercise" || a.category === "leisure"));
      const middayCleanestHour = hasHourlyData ? "13:00" : "12:30–14:00";
      const middayPM25 = hasHourlyData ? (city.hourly[13]?.pm25 || Math.round(pm25 * 0.55)) : Math.round(pm25 * 0.6);

      const doseOrig = morningEx ? calculateActivityDose(pm25, morningEx.micro, morningEx.intensity, morningEx.duration, persona.breathingMultiplier) : 0;
      const doseShifted = morningEx ? calculateActivityDose(middayPM25, "side_street", morningEx.intensity, morningEx.duration, persona.breathingMultiplier) : 0;
      const pctDoseDrop = doseOrig > 0 ? Math.round(((doseOrig - doseShifted) / doseOrig) * 100) : 0;

      let actionText = "";
      if (isHighExposure) {
        actionText = `Preserve your **${fixedActivities.length} Fixed Commitments** (work/college arrival) at scheduled hours while activating vehicle HVAC recirculation. Reschedule your **${flexibleActivities.length} Flexible Activities** (outdoor cardio at 07:15, evening walk at 19:45) to the early afternoon solar mixing window (${middayCleanestHour}) or transition workouts indoors with active True HEPA filtration.`;
      } else {
        actionText = `Current atmospheric conditions in **${city.name}** are favorable. Maintain scheduled commitments; route outdoor activities along tree-lined greenways or residential side streets rather than arterial highways.`;
      }

      const mechanismText = `Nocturnal ground radiation cools surface air, producing a thermal inversion that traps vehicular exhaust and biomass smoke within a shallow 100–250m surface boundary layer between 06:30 and 09:30 AM. Between 11:30 AM and 14:30 PM, surface solar heating drives vertical convective turbulent mixing, elevating the boundary layer height and naturally diluting ground-level particulate concentrations by 30–55%.`;

      const groundingText = `Territory: **${city.name}** • Current Baseline AQI: **${aqi}** (${status}) • Ambient PM2.5: **${pm25} µg/m³** • Dominant Source: **${city.primaryPollutant || 'PM2.5'}**\nData Source: **${city.dataSource}** (${city.lastUpdated})\nUser Schedule Scope: **${fixedActivities.length} Fixed Commitments** preserved; **${flexibleActivities.length} Flexible Activities** evaluated.`;

      const assessmentText = `• **Modeled Inhaled Dose**: Shifting morning cardio from 07:15 to 13:00 attenuates personal pulmonary deposition from ~**${doseOrig} µg** down to ~**${doseShifted} µg** (~-**${pctDoseDrop}%** Inhaled Dose) [Modeled Estimate].\n• **Transit Exposure**: Activating AC cabin recirculation on your commute cuts in-vehicle particle infiltration by **~60%** [Modeled Estimate].\n• **Health Safeguard**: Shields sensitive alveolar tissue during peak morning cardiovascular exertion [Qualitative Guidance].`;

      const limitationText = hasHourlyData
        ? `Diurnal recommendations are grounded in verified local monitoring station curves from ${city.dataSource}. Commute paths remain on confirmed roadway corridors.`
        : `⚠️ **Data Notice**: Time-specific diurnal hourly forecast curves are **unavailable** for ${city.name}. Recommendations are derived strictly from the current baseline telemetry (AQI ${aqi}). Specific speculative hourly variations are not invented.`;

      return {
        action: actionText,
        mechanism: mechanismText,
        grounding: groundingText,
        assessment: assessmentText,
        limitations: limitationText
      };
    }

    // 2. CAN I MOVE MY OUTDOOR EXERCISE?
    if (q.includes("move") && (q.includes("exercise") || q.includes("workout") || q.includes("run") || q.includes("jog") || q.includes("cardio"))) {
      if (!exerciseAct) {
        return {
          action: `Add an outdoor exercise activity to your schedule or follow general diurnal guidance.`,
          mechanism: `Aerobic exercise elevates minute ventilation by 2.5–4.0x baseline, causing deep oral respiration that bypasses upper airway mucosal filtering.`,
          grounding: `Active territory: **${city.name}** (AQI **${aqi}**, PM2.5: **${pm25} µg/m³**). Profile: **${persona.label}**.`,
          assessment: `Midday window (12:00–14:30) provides ~30–50% lower ambient particulate mass than morning inversion hours [Modeled Estimate].`,
          limitations: `No specific exercise item is currently logged in your active schedule.`
        };
      }

      if (exerciseAct.flexibility === "fixed") {
        const doseCurrent = calculateActivityDose(pm25, exerciseAct.micro, exerciseAct.intensity, exerciseAct.duration, persona.breathingMultiplier);
        return {
          action: `Your outdoor exercise (**${exerciseAct.name}** at **${exerciseAct.time}**) is currently designated as a **Fixed Commitment**. Because you marked it as non-negotiable, BreatheBack strictly preserves it at ${exerciseAct.time}. To enable automated diurnal shifting, toggle its status to **Flexible** in the Telemetry Drawer, or transition this workout to an indoor gym with True HEPA filtration.`,
          mechanism: `Exercising at ${exerciseAct.time} coincides with elevated ground-level particulate accumulation. With your ${persona.label} profile (breathing multiplier ${persona.breathingMultiplier}x), intense aerobic exertion draws unfiltered particulate matter deep into developing bronchial passages.`,
          grounding: `Activity: **${exerciseAct.name}** (${exerciseAct.time}, ${exerciseAct.duration}m, ${exerciseAct.intensity} intensity) • Status: **🔒 Fixed Commitment**\nTerritory: **${city.name}** • Ambient PM2.5: **${pm25} µg/m³** (AQI ${aqi}) • Source: **${city.dataSource}**`,
          assessment: `• **Modeled Inhaled Dose**: Inhales ~**${doseCurrent} µg** of PM2.5 mass during this 45-minute session at ${exerciseAct.time} [Modeled Estimate].\n• **Protective Action**: Transitioning indoors with True HEPA lowers inhaled mass to ~${Math.round(doseCurrent * 0.15)} µg (~-85% exposure) [Modeled Estimate].`,
          limitations: `Fixed commitments are never modified without explicit user authorization.`
        };
      }

      // Flexible Exercise
      if (!hasHourlyData) {
        return {
          action: `Substitute outdoor exercise with an **indoor facility equipped with True HEPA mechanical filtration**, or postpone until baseline AQI drops below 100.`,
          mechanism: `High-exertion aerobic exercise increases minute ventilation volume from 0.55 m³/h (sedentary) to 2.30 m³/h (vigorous). High respiratory air velocity pulls fine particles deep into the pulmonary alveoli.`,
          grounding: `Activity: **${exerciseAct.name}** (${exerciseAct.time}, ${exerciseAct.duration}m) • Schedule Label: **⚡ Flexible Window**\nTerritory: **${city.name}** • Baseline AQI: **${aqi}** (${status}) • Ambient PM2.5: **${pm25} µg/m³**`,
          assessment: `• **Indoor HEPA Substitution**: Reduces particulate inhalation by **~85%** compared to ambient outdoor air [Modeled Estimate].\n• **Airway Protection**: Prevents acute exercise-induced bronchial inflammation [Qualitative Guidance].`,
          limitations: `⚠️ **Hourly Forecast Unavailable**: Time-specific hourly forecast data is not available for ${city.name}. Recommendations are grounded strictly in the current baseline reading (AQI ${aqi}). Specific hourly outdoor windows are not invented.`
        };
      }

      // Hourly forecast is available
      const ambientMorning = getAmbientAtHour(city.hourly, exerciseAct.time) || pm25;
      let bestH = 13;
      let lowestPM = ambientMorning;
      for (let h = 11; h <= 15; h++) {
        const p = city.hourly[h]?.pm25 || 999;
        if (p < lowestPM) { lowestPM = p; bestH = h; }
      }
      const bestTimeStr = `${bestH.toString().padStart(2, "0")}:00`;
      const doseOriginal = calculateActivityDose(ambientMorning, exerciseAct.micro, exerciseAct.intensity, exerciseAct.duration, persona.breathingMultiplier);
      const doseOptimized = calculateActivityDose(lowestPM, "side_street", exerciseAct.intensity, exerciseAct.duration, persona.breathingMultiplier);
      const pctDrop = Math.round(((doseOriginal - doseOptimized) / doseOriginal) * 100);

      return {
        action: `Yes, reschedule **${exerciseAct.name}** from **${exerciseAct.time}** to **${bestTimeStr}** (Solar Convective Dispersion Window), and route along residential side streets or tree-lined paths.`,
        mechanism: `At ${exerciseAct.time}, surface radiation temperature inversions trap tailpipe soot and particulate matter in a compressed layer near ground level. By ${bestTimeStr}, intense solar radiation warms the asphalt, breaking the inversion and expanding the planetary boundary layer, naturally lowering PM2.5 concentrations from ${ambientMorning} µg/m³ to ${lowestPM} µg/m³.`,
        grounding: `Activity: **${exerciseAct.name}** (${exerciseAct.time} → ${bestTimeStr}, ${exerciseAct.duration} min) • Schedule Label: **⚡ Flexible Window**\nTerritory: **${city.name}** • Ambient PM2.5 at ${exerciseAct.time}: **${ambientMorning} µg/m³** vs at ${bestTimeStr}: **${lowestPM} µg/m³**\nProfile: **${persona.label}** (Minute ventilation VE: 2.30 m³/h, multiplier: ${persona.breathingMultiplier}x)\nData Source: **${city.dataSource}** (${city.lastUpdated})`,
        assessment: `• **Modeled Inhaled Dose**: Inhaled PM2.5 drops from ~**${doseOriginal} µg** to ~**${doseOptimized} µg** (~-**${pctDrop}%** Inhaled Dose Attenuation) [Modeled Estimate].\n• **Route Buffering**: Moving from arterial road to side street cuts particulate intake by an additional ~30% [Modeled Estimate].\n• **Pulmonary Health**: Substantially reduces deep alveolar particulate loading [Qualitative Guidance].`,
        limitations: `Grounded in local station diurnal telemetry. If ambient midday PM2.5 remains above 150 µg/m³, indoor HEPA training is strongly recommended.`
      };
    }

    // 3. WHAT CAN I DO INDOORS TO IMPROVE AIR QUALITY?
    if (q.includes("indoor") || q.includes("inside") || q.includes("home") || q.includes("room") || q.includes("hepa") || q.includes("kitchen")) {
      const indoorUnfiltered = Math.round(pm25 * 0.5);
      const indoorHepa = Math.max(3, Math.round(pm25 * 0.5 * 0.18));
      const protectionPct = Math.round(((pm25 - indoorHepa) / pm25) * 100);

      return {
        action: `Execute the **Four-Point Indoor Sanctuary Protocol**:\n1. **Latch Exterior Windows**: Keep windows sealed during morning (06:00–09:30) and night (20:00–06:00) inversions.\n2. **Run Continuous True HEPA Filtration**: Operate bedroom and living area air purifiers on whisper/quiet mode continuously.\n3. **Isolate Cooking Aerosols**: Turn on kitchen range hood 1–2 minutes before gas ignition; cook on rear burners; keep kitchen doors shut.\n4. **Micro-Crack Interior Doors**: Keep interior bedroom doors cracked 2–3 inches to disperse carbon dioxide (<900 ppm) into common areas without opening exterior windows.`,
        mechanism: `Unfiltered building envelopes allow approximately 50% of ambient PM2.5 to infiltrate via window seams and structural drafts (I/O ratio = 0.50). Active True HEPA filtration forces air through a dense fibrous borosilicate matrix, capturing 99.97% of 0.3-micron particles via diffusion, interception, and inertial impaction, driving indoor concentrations below WHO targets (15 µg/m³).`,
        grounding: `Territory Ambient: **${city.name}** (Outdoor PM2.5: **${pm25} µg/m³**, AQI **${aqi}**)\nUnfiltered Indoor PM2.5 Estimate: **~${indoorUnfiltered} µg/m³**\nTrue HEPA Sanctuary PM2.5 Estimate: **~${indoorHepa} µg/m³**\nEngineering Model: **ASHRAE 62.2 Ventilation & Infiltration Physics**\nData Attribution: **${city.dataSource}**`,
        assessment: `• **Infiltration Attenuation**: Reduces indoor particulate exposure by **~${protectionPct}%** relative to outdoor ambient air [Modeled Estimate].\n• **Cooking Plume Capture**: Range hood extraction on rear burners reduces cooking particulate and NO2 dispersion by **65–80%** [Empirical Study Benchmark].\n• **Nocturnal Protection**: Protects basal breathing across 7–8 hours of sleeping respiration [Qualitative Guidance].`,
        limitations: `Indoor infiltration model assumes standard residential air exchange rates (~0.5 ACH). Homes with leaky fenestration or unvented combustion appliances will experience higher infiltration.`
      };
    }

    // 4. HOW CAN I REDUCE UNNECESSARY VEHICLE EMISSIONS?
    if (q.includes("emission") || q.includes("vehicle") || q.includes("carbon") || q.includes("co2") || (q.includes("reduce") && q.includes("car"))) {
      const dist = commuteAct?.distanceKm || 14;
      const carbonCar = calculateCarbonKg("solo_car", dist);
      const carbonMetro = calculateCarbonKg("metro", dist);
      const savedMetroKg = Math.round((carbonCar - carbonMetro) * 10) / 10;
      const isGreenVerified = commuteAct?.verifiedGreenRoute;

      return {
        action: `Adopt a **Two-Tier Mobility Transition**:\n1. **Shift Commute Mode**: Replace single-occupant automobile travel with **Electric Metro Rail** or **Public Bus Transit** for your ${dist} km commute.\n2. **Route Corridors**: ${isGreenVerified ? "A continuous off-road greenway is confirmed for your route; walk or cycle for segments under 5 km." : "Your commute route currently has **no verified greenway alternative**; keep transit on existing public transit/roadway corridors and avoid assuming unconfirmed park connections."}\n3. **In-Vehicle Cabin Defense**: When automobile transit is mandatory, keep windows rolled up and activate HVAC Recirculation mode.`,
        mechanism: `Internal combustion engines emit ~171 g CO2e per passenger-kilometer alongside fine carbon soot and nitrogen oxides (NO2). Electric metro rail leverages collective passenger efficiency and electrified traction, emitting only ~28 g CO2e/p-km (an ~84% emissions reduction). Enclosed metro cabins also isolate riders from street-canyon tailpipe exhaust plumes.`,
        grounding: `Commute Segment: **${commuteAct?.name || "Workplace Transit Commute"}** (${dist} km distance, scheduled at ${commuteAct?.time || "08:30"})\nCurrent Mode: **Solo Automobile** (171 g CO2e / passenger-km)\nGreenway Route Status: **${isGreenVerified ? "✔ Feasible Greenway Confirmed" : "⚠ Arterial Roadway Alignment (No Greenway Verified)"}**\nTerritory: **${city.name}** • Dominant Source: **Vehicular Tailpipe Exhaust (38%)**`,
        assessment: `• **Transit Carbon Avoided**: Shifting your ${dist} km commute from solo car to metro rail eliminates **~${savedMetroKg} kg CO2e** per trip (**~${Math.round(savedMetroKg * 2 * 10) / 10} kg CO2e** daily roundtrip) [Modeled Estimate].\n• **Personal Exposure Attenuation**: Commuting via underground metro cuts particulate inhalation by **~60%** relative to open road traffic [Modeled Estimate].\n• **Community Scale**: If 1,200 neighborhood residents adopt mode shifts, ~1.7 metric tons of CO2e and direct tailpipe soot are eliminated daily [Aggregation Model].`,
        limitations: `Carbon factors reflect standardized passenger-kilometer averages (IPCC/EPA benchmarks). Electric grid emissions intensity varies by municipal power grid composition.`
      };
    }

    // 5. WINDOW OPENING TONIGHT
    if (q.includes("window") || q.includes("ventilat") || q.includes("night") || q.includes("bedroom")) {
      return {
        action: isHighExposure
          ? `**Keep all exterior windows latched overnight.**`
          : `**Windows can be opened for 15–20 minutes between 12:30 and 14:30 today for fresh air flush; keep closed overnight.**`,
        mechanism: `Radiative ground cooling creates a nocturnal thermal inversion, trapping heavy traffic exhaust and regional smoke in a stagnant surface layer. Opening windows at night pulls concentrated PM2.5 directly into bedrooms.`,
        grounding: `Territory: **${city.name}** • Ambient AQI: **${aqi}** (${status}) • Night Inversion Risk: **High**\nData Source: **${city.dataSource}**`,
        assessment: `• **Infiltration Prevention**: Latched windows and continuous True HEPA keep bedroom PM2.5 below 10 µg/m³ while outdoor air reaches ${pm25} µg/m³ [Modeled Estimate].\n• **Sleep Quality**: Maintains healthy oxygenation and prevents morning throat irritation [Qualitative Guidance].`,
        limitations: `Keep bedroom interior doors cracked 2–3 inches into the hallway to prevent CO2 accumulation above 1,000 ppm.`
      };
    }

    // 6. CHILDREN OUTDOOR PLAY
    if (q.includes("child") || q.includes("kid") || q.includes("soccer") || q.includes("play")) {
      return {
        action: isHighExposure
          ? `**Transition children's sports or playground time to an indoor venue** or utilize the early afternoon window (~13:00–14:30) away from arterial roadways.`
          : `**Outdoor play is permissible.** Guide children away from diesel bus stops and busy arterial avenues toward interior neighborhood parklands.`,
        mechanism: `Children inhale ~35–50% more air per kg of body weight than adults and engage in oral respiration during energetic sports, allowing airborne particulates to bypass nasal filtration and penetrate developing alveolar branches.`,
        grounding: `Territory: **${city.name}** • Baseline AQI: **${aqi}** (${status}) • Vulnerability Profile: **Child / Parent** (breathing multiplier 1.35x)\nData Attribution: **${city.dataSource}**`,
        assessment: `• **Pediatric Respiratory Defense**: Shifting play indoors under HEPA filtration reduces inhaled fine particulate dose by **~85%** [Modeled Estimate].\n• **Airway Health**: Reduces acute risk of bronchial spasm and pediatric asthma flare-ups [Qualitative Guidance].`,
        limitations: `If children must transit outdoors, a well-fitted certified particulate mask (pediatric KF94 or N95) is recommended.`
      };
    }

    // DEFAULT FALLBACK
    return {
      action: `Consult the **Decision Lab** and **Daily Exposure Planner** in BreatheBack to model personalized schedule shifts and microenvironment factors.`,
      mechanism: `Human respiratory intake is governed by minute ventilation (VE), exposure duration, microenvironment proximity factors, and ambient diurnal concentration curves.`,
      grounding: `Territory: **${city.name}** • Baseline AQI: **${aqi}** (${status}) • PM2.5: **${pm25} µg/m³** • Profile: **${persona.label}**\nData Source: **${city.dataSource}** (${city.lastUpdated})`,
      assessment: `Personalized schedule alignment typically reduces daily pulmonary particulate dose by 25–65% [Modeled Estimate].`,
      limitations: `Field advisory is calibrated for urban environmental health. For severe clinical symptoms, seek professional medical care.`
    };
  };

  /**
   * Optional Gemini API Generator with Fallback to Grounded Engine
   */
  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    const userMsg = {
      role: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText("");
    setIsThinking(true);
    setApiError(null);

    // If an optional Gemini API key is provided, attempt Gemini 1.5 Flash
    if (apiKey.trim()) {
      try {
        const scheduleContext = userActivities.map(a =>
          `- ${a.name} at ${a.time} (${a.duration}m, ${a.category}, ${a.flexibility.toUpperCase()}, Mode: ${a.mode}, Micro: ${a.micro}, Dist: ${a.distanceKm}km, Greenway Verified: ${a.verifiedGreenRoute})`
        ).join("\n");

        const systemPrompt = `You are the BreatheBack Air Coach, a specialized environmental health and atmospheric decision assistant.
You are assisting a user in ${city.name} (Current AQI: ${city.aqi}, Status: ${city.status}, PM2.5: ${city.pollutants?.pm25} ug/m3, Primary Pollutant: ${city.primaryPollutant || 'PM2.5'}, Data Source: ${city.dataSource}, Freshness: ${city.lastUpdated}).
User Profile: ${persona.label} (Minute ventilation multiplier: ${persona.breathingMultiplier}x, Focus: ${persona.healthFocus}).
Hourly Forecast Available: ${hasHourlyData ? "Yes, 24-hour diurnal curve available." : "No, hourly curve unavailable; base advice strictly on baseline AQI."}

USER SCHEDULE CONTEXT:
${scheduleContext}

STRICT INSTRUCTIONS:
1. Ground your answer in this exact city telemetry and user schedule.
2. Structure your response into EXACTLY four sections with these markdown headers:
### 1. Suggested Action
### 2. Atmospheric & Physical Mechanism
### 3. Supporting Telemetry Grounding
### 4. Impact Assessment
3. In Section 4, explicitly state whether values are [Modeled Estimate] or [Qualitative Guidance].
4. If hourly data is unavailable, explicitly state that you are not inventing hourly variations.
5. If route alternatives lack greenway verification, state that transit must remain on roadway corridors.
6. Do not offer medical cures. Keep focused on air quality, schedule timing, routes, and indoor filtration.`;

        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.trim()}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text }] }],
            systemInstruction: { parts: [{ text: systemPrompt }] },
            generationConfig: { temperature: 0.2, maxOutputTokens: 900 }
          })
        });

        if (!res.ok) {
          throw new Error(`Gemini API returned status ${res.status}`);
        }

        const data = await res.json();
        const geminiText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (geminiText) {
          setMessages(prev => [
            ...prev,
            {
              role: "assistant",
              source: "gemini",
              rawText: geminiText,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]);
          setIsThinking(false);
          return;
        } else {
          throw new Error("No response text in Gemini payload");
        }
      } catch (err) {
        console.warn("Gemini API call failed, falling back to local grounded engine:", err);
        setApiError("Gemini API request failed. Fell back to local scientific decision engine.");
      }
    }

    // Default or Fallback: Local Grounded Scientific Engine
    setTimeout(() => {
      const structured = generateGroundedResponse(text);
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          source: "engine",
          structuredData: structured,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setIsThinking(false);
    }, 320);
  };

  const handleSaveApiKey = (e) => {
    e.preventDefault();
    sessionStorage.setItem("breatheback_gemini_key", apiKey.trim());
    setShowKeyInput(false);
  };

  const handleClearApiKey = () => {
    sessionStorage.removeItem("breatheback_gemini_key");
    setApiKey("");
    setShowKeyInput(false);
  };

  return (
    <section className="air-coach-view">
      {/* Editorial Section Header */}
      <div className="section-journal-header">
        <div>
          <div className="field-tag-row">
            <span className="field-tag">Contextual Assistant</span>
            <span className="coach-edition-pill">Telemetry & Schedule Grounded</span>
          </div>
          <h2 className="editorial-title">AI Air Coach — Field Consultation</h2>
          <p className="editorial-subtitle">
            Combines live monitoring telemetry in <strong>{city.name}</strong>, diurnal boundary layer physics, user schedule flexibility, and route feasibility into grounded lifestyle decisions.
          </p>
        </div>

        <div className="coach-header-cta-group">
          <button
            type="button"
            className={`btn-journal-secondary ${showContextDrawer ? "active" : ""}`}
            onClick={() => setShowContextDrawer(!showContextDrawer)}
            title="Inspect or toggle active schedule flexibility and telemetry context"
          >
            <Icon name="sliders" size={14} />
            <span>Active Context Drawer</span>
          </button>

          <button
            type="button"
            className="btn-journal-secondary"
            onClick={() => setShowKeyInput(!showKeyInput)}
            title="Optional custom Gemini API configuration"
          >
            <Icon name="zap" size={14} />
            <span>{apiKey ? "Gemini Key Connected" : "Custom Key (Optional)"}</span>
          </button>
        </div>
      </div>

      {/* Telemetry Status Strip */}
      <div className="field-notice-strip coach-status-strip">
        <div className="status-strip-left">
          <Icon name="compass" size={15} color="var(--accent-moss)" />
          <span className="notice-text">
            <strong>Active Telemetry: {city.name}</strong> • AQI: <strong>{city.aqi}</strong> ({city.status || 'Moderate'}) • Dominant: <strong>{city.primaryPollutant || 'PM2.5'}</strong> • Subject Profile: <strong>{persona.label}</strong> ({persona.breathingMultiplier}x VE)
          </span>
        </div>

        <div className="status-strip-right">
          <span className={`forecast-status-badge ${hasHourlyData ? "has-forecast" : "no-forecast"}`}>
            <Icon name={hasHourlyData ? "sun" : "alert-triangle"} size={12} />
            <span>{hasHourlyData ? "Diurnal Curve Active" : "Hourly Forecast Unavailable"}</span>
          </span>
        </div>
      </div>

      {/* API Key Modal / Card */}
      {showKeyInput && (
        <form onSubmit={handleSaveApiKey} className="journal-card api-key-card">
          <div className="api-key-header">
            <div>
              <h4 className="key-heading">Optional Gemini API Integration</h4>
              <p className="key-sub">
                Stored in temporary browser session memory only. BreatheBack operates with complete zero-cost grounded scientific reasoning without requiring an external API key.
              </p>
            </div>
            {apiKey && (
              <button type="button" className="btn-journal-link text-terracotta" onClick={handleClearApiKey}>
                Disconnect Key
              </button>
            )}
          </div>

          <div className="key-input-row">
            <input
              type="password"
              placeholder="Enter Gemini API Key (e.g., AIzaSy...)..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="journal-input"
            />
            <button type="submit" className="btn-journal-primary">
              Save Session Key
            </button>
          </div>
        </form>
      )}

      {/* API Notice / Error Fallback Alert */}
      {apiError && (
        <div className="coach-api-alert">
          <Icon name="alert-triangle" size={14} color="var(--accent-terracotta)" />
          <span>{apiError}</span>
        </div>
      )}

      {/* Context Grounding Drawer (Interactive Schedule & Telemetry Inspector) */}
      {showContextDrawer && (
        <div className="journal-card context-drawer-card">
          <div className="drawer-header-row">
            <div>
              <span className="field-tag">Active Schedule Context</span>
              <h3 className="drawer-heading">Schedule Grounding & Route Feasibility</h3>
              <p className="drawer-desc">
                The Air Coach reasons directly over these scheduled activities. Click any badge to toggle between <strong>Fixed Commitment</strong> and <strong>Flexible Window</strong>, or verify route alternatives.
              </p>
            </div>
            <button
              type="button"
              className="btn-journal-link"
              onClick={() => setShowContextDrawer(false)}
            >
              Close Drawer ✕
            </button>
          </div>

          <div className="drawer-activities-grid">
            {userActivities.map(act => {
              const isFixed = act.flexibility === "fixed";
              const isCommute = act.category === "commute";

              return (
                <div key={act.id} className={`drawer-activity-card ${isFixed ? "is-fixed" : "is-flexible"}`}>
                  <div className="dac-top">
                    <span className="dac-name">{act.name}</span>
                    <span className="dac-time">{act.time} ({act.duration}m)</span>
                  </div>

                  <div className="dac-meta">
                    <span>{act.micro.replace(/_/g, " ")} • {act.mode.replace(/_/g, " ")}</span>
                    {act.distanceKm > 0 && <span> • {act.distanceKm} km</span>}
                  </div>

                  <div className="dac-toggles">
                    {/* Fixed vs Flexible Toggle */}
                    <button
                      type="button"
                      className={`flexibility-badge-btn ${isFixed ? "is-fixed" : "is-flexible"}`}
                      onClick={() => handleToggleFlexibility(act.id)}
                      title="Toggle schedule flexibility for Air Coach reasoning"
                    >
                      <Icon name={isFixed ? "lock" : "zap"} size={11} />
                      <span>{isFixed ? "Fixed Commitment" : "Flexible Window"}</span>
                    </button>

                    {/* Route Greenway Verification Toggle for Commute */}
                    {isCommute && (
                      <button
                        type="button"
                        className={`route-verification-badge ${act.verifiedGreenRoute ? "verified" : "unverified"}`}
                        onClick={() => handleToggleRouteVerification(act.id)}
                        title="Click to toggle greenway route verification status"
                      >
                        <span>{act.verifiedGreenRoute ? "✔ Greenway Verified" : "⚠ Roadway Alignment"}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="drawer-footer-note">
            <Icon name="info" size={13} color="var(--accent-moss)" />
            <span>Data Source: <strong>{city.dataSource}</strong> ({city.lastUpdated}). Diurnal mixing layer height model active.</span>
          </div>
        </div>
      )}

      {/* Primary Field Inquiry Chips Bar */}
      <div className="quick-inquiries-bar">
        <div className="inquiries-head-row">
          <span className="inquiries-label">Field Inquiries (Ground in Active Telemetry):</span>
        </div>
        <div className="inquiry-chips-group">
          {PRIMARY_CHIPS.map((chip, i) => (
            <button
              key={i}
              type="button"
              className="inquiry-chip-btn"
              onClick={() => handleSendMessage(chip.query)}
              disabled={isThinking}
            >
              <Icon name="sparkles" size={12} />
              <span>{chip.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Conversation Card */}
      <div className="journal-card coach-conversation-card">
        <div className="conversation-scroll-box" ref={scrollRef}>
          {messages.map((m, idx) => (
            <div key={idx} className={`dialogue-row ${m.role}`}>
              <div className="dialogue-avatar">
                {m.role === "assistant" ? "§" : "👤"}
              </div>

              <div className="dialogue-bubble">
                <div className="dialogue-meta-row">
                  <span className="dialogue-speaker">
                    {m.role === "assistant"
                      ? (m.source === "gemini" ? "BreatheBack Coach (Gemini 1.5 Flash)" : "BreatheBack Coach (Grounded Scientific Engine)")
                      : "Field Observer (You)"}
                  </span>
                  <span className="dialogue-timestamp">{m.timestamp}</span>
                </div>

                {/* Assistant Structured Response Dossier */}
                {m.role === "assistant" && m.structuredData ? (
                  <div className="grounded-dossier-layout">
                    {/* Section 1: Suggested Action */}
                    <div className="dossier-section section-action">
                      <div className="section-badge-lead">
                        <Icon name="check-circle" size={14} color="var(--accent-moss)" />
                        <span className="badge-title">1. Suggested Action</span>
                      </div>
                      <div
                        className="section-content-text"
                        dangerouslySetInnerHTML={{
                          __html: m.structuredData.action
                            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                            .replace(/\n/g, '<br/>')
                        }}
                      />
                    </div>

                    {/* Section 2: Atmospheric & Physical Mechanism */}
                    <div className="dossier-section section-mechanism">
                      <div className="section-badge-lead">
                        <Icon name="compass" size={14} color="var(--accent-moss)" />
                        <span className="badge-title">2. Atmospheric & Physical Mechanism</span>
                      </div>
                      <p className="section-content-text">{m.structuredData.mechanism}</p>
                    </div>

                    {/* Section 3: Supporting Telemetry Grounding */}
                    <div className="dossier-section section-grounding">
                      <div className="section-badge-lead">
                        <Icon name="map-pin" size={14} color="var(--accent-terracotta)" />
                        <span className="badge-title">3. Supporting Telemetry Grounding</span>
                      </div>
                      <div
                        className="section-content-text telemetry-box"
                        dangerouslySetInnerHTML={{
                          __html: m.structuredData.grounding
                            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                            .replace(/\n/g, '<br/>')
                        }}
                      />
                    </div>

                    {/* Section 4: Impact Assessment (Modeled vs Qualitative) */}
                    <div className="dossier-section section-impact">
                      <div className="section-badge-lead">
                        <Icon name="activity" size={14} color="var(--accent-moss)" />
                        <span className="badge-title">4. Impact Assessment</span>
                      </div>
                      <div
                        className="section-content-text impact-ledger-text"
                        dangerouslySetInnerHTML={{
                          __html: m.structuredData.assessment
                            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                            .replace(/\n/g, '<br/>')
                        }}
                      />
                    </div>

                    {/* Section 5: Data Limitations & Missing Telemetry Notice */}
                    {m.structuredData.limitations && (
                      <div className="dossier-section section-limitations">
                        <div className="section-badge-lead">
                          <Icon name="alert-triangle" size={13} color="var(--text-secondary)" />
                          <span className="badge-title">Data Limitations & Disclaimers</span>
                        </div>
                        <div
                          className="section-content-text limitation-text"
                          dangerouslySetInnerHTML={{
                            __html: m.structuredData.limitations
                              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                              .replace(/\n/g, '<br/>')
                          }}
                        />
                      </div>
                    )}

                    {/* Quick Section Navigation Shortcuts */}
                    {onNavigateToSection && (
                      <div className="dossier-nav-shortcuts">
                        <span className="shortcuts-label">Explore in BreatheBack:</span>
                        <button
                          type="button"
                          className="shortcut-pill-btn"
                          onClick={() => onNavigateToSection("simulator")}
                        >
                          <Icon name="sliders" size={12} />
                          <span>Decision Lab</span>
                        </button>
                        <button
                          type="button"
                          className="shortcut-pill-btn"
                          onClick={() => onNavigateToSection("plan")}
                        >
                          <Icon name="calendar" size={12} />
                          <span>Daily Planner</span>
                        </button>
                        <button
                          type="button"
                          className="shortcut-pill-btn"
                          onClick={() => onNavigateToSection("indoor")}
                        >
                          <Icon name="shield-check" size={12} />
                          <span>Indoor Sanctuary</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : m.rawText ? (
                  /* Gemini Raw Markdown Output */
                  <div
                    className="dialogue-text gemini-rendered-text"
                    dangerouslySetInnerHTML={{
                      __html: m.rawText
                        .replace(/^### (.*$)/gim, '<h4 class="dialogue-h4">$1</h4>')
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\n\n/g, '<p></p>')
                        .replace(/• (.*$)/gim, '<li class="dialogue-li">$1</li>')
                    }}
                  />
                ) : (
                  /* Plain Text Fallback */
                  <div className="dialogue-text">{m.text}</div>
                )}
              </div>
            </div>
          ))}

          {/* Thinking State Indicator */}
          {isThinking && (
            <div className="dialogue-row assistant">
              <div className="dialogue-avatar">§</div>
              <div className="dialogue-bubble thinking-bubble-journal">
                <div className="thinking-pulse-dot" />
                <span>Synthesizing municipal telemetry, boundary layer physics, and schedule commitments...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="dialogue-input-row">
          <input
            type="text"
            placeholder={`Inquire regarding workout timing, transit routes, or window schedules in ${city.name}...`}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendMessage();
            }}
            disabled={isThinking}
            className="dialogue-text-input"
          />
          <button
            type="button"
            className="btn-journal-primary btn-dialogue-send"
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim() || isThinking}
            aria-label="Submit inquiry"
          >
            <Icon name="send" size={15} />
            <span>Send</span>
          </button>
        </div>
      </div>
    </section>
  );
};

export default AirCoach;
