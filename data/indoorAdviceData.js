// Indoor Air Quality (IAQ) scientific guidance and room-by-room interventions
// Grounded in WHO, EPA, and ASHRAE ventilation standards.

export const ROOM_GUIDES = [
  {
    id: "kitchen",
    name: "Kitchen & Dining",
    icon: "chef-hat",
    primaryThreats: ["Nitrogen Dioxide (NO2) from gas stoves", "Ultrafine Particles (UFP) from high-heat frying", "Volatile Organics from scorched oils"],
    typicalPollutionSpike: "+80 to +250 µg/m³ during active cooking",
    interventions: [
      {
        title: "Always turn range hood on before heating",
        action: "Turn on extraction hood 1-2 minutes BEFORE ignition and keep running for 5-10 minutes after cooking completes.",
        impact: "Reduces cooking particulate dispersion to the rest of the home by 65-80%."
      },
      {
        title: "Isolate kitchen during high-heat cooking",
        action: "Close connecting doors to living and bedroom spaces when sautéing, frying, or using gas burners.",
        impact: "Prevents toxic ultrafine particles from migrating into sleeping areas."
      },
      {
        title: "Cook on rear burners under the hood",
        action: "Standard range hoods capture 2-3x more fumes from rear burners compared to front burners.",
        impact: "Significantly boosts capture efficiency without requiring higher fan speeds."
      },
      {
        title: "Consider portable induction over gas",
        action: "Gas cooking without high-powered exhaust produces indoor NO2 concentrations that frequently exceed outdoor health standards.",
        impact: "Eliminates combustion emissions entirely."
      }
    ],
    mythBuster: "Myth: Cracking an open window is always sufficient while cooking. Reality: If outdoor air is poor (AQI > 100), opening windows pulls external PM2.5 inside while creating wind drafts that disrupt your range hood's suction cone."
  },
  {
    id: "bedroom",
    name: "Bedrooms & Sleeping Areas",
    icon: "bed",
    primaryThreats: ["Nighttime PM2.5 infiltration during temperature inversions", "Carbon Dioxide (CO2) buildup in closed rooms (>1,200 ppm)", "Dust mite allergens & shed skin particulates"],
    typicalPollutionSpike: "Gradual accumulation over 7-8 hours of continuous breathing",
    interventions: [
      {
        title: "Continuous low-speed HEPA purifier at bedside",
        action: "Run a True HEPA purifier on whisper/quiet mode throughout the night placed within 1.5 - 2 meters of head height.",
        impact: "Maintains bedroom PM2.5 below 5-10 µg/m³ even when outdoor AQI reaches 200+."
      },
      {
        title: "Avoid opening bedroom windows during morning rush",
        action: "Keep bedroom windows firmly closed between 6:00 AM and 9:30 AM when ground-level traffic pollution is most concentrated.",
        impact: "Prevents immediate morning particulate spike into living spaces."
      },
      {
        title: "Micro-ventilation door crack to prevent CO2 spikes",
        action: "Keep the bedroom interior door cracked 2-3 inches to allow indoor CO2 dispersion into larger home volumes without opening outside windows.",
        impact: "Keeps morning CO2 below 900 ppm, improving sleep depth and cognitive alertness."
      }
    ],
    mythBuster: "Myth: Indoor house plants purify bedroom air at night. Reality: NASA clean-air study results apply to sealed mini-chambers with massive root fans. In a normal bedroom, you would need 10 to 100 plants per square meter to equal the particulate removal of one modest HEPA filter!"
  },
  {
    id: "living",
    name: "Living Room & Common Area",
    icon: "sofa",
    primaryThreats: ["Footwear tracking heavy metals & street dust", "Resuspension from rugs and upholstered furniture", "Aerosol sprays, scented candles & synthetic fragrances"],
    typicalPollutionSpike: "+30 to +60 µg/m³ during vacuuming or active foot movement",
    interventions: [
      {
        title: "Strict outdoor shoe removal at entrance",
        action: "Establish a shoe-drop zone with a washable entrance mat right at the doorway.",
        impact: "Stops up to 80% of outdoor soil, lead dust, microplastics, and pesticide residues from entering living areas."
      },
      {
        title: "Use sealed HEPA-filtered vacuum cleaners",
        action: "Standard vacuums blow fine sub-micron dust straight through cloth bags back into breathing air. Ensure your vacuum uses a sealed HEPA exhaust.",
        impact: "Prevents toxic dust resuspension during household cleaning."
      },
      {
        title: "Ban synthetic scented candles and incense",
        action: "Burning paraffin candles or incense sticks releases polycyclic aromatic hydrocarbons (PAHs) and benzene equivalent to passive smoking.",
        impact: "Instantly eliminates a primary source of indoor volatile carcinogens."
      }
    ],
    mythBuster: "Myth: Air fresheners clean the air. Reality: Chemical air fresheners merely mask odors by coating olfactory receptors or spraying volatile organic compounds (VOCs) like phthalates into your lungs."
  },
  {
    id: "office",
    name: "Home Office & Study",
    icon: "laptop",
    primaryThreats: ["Elevated CO2 causing brain fog and sluggish reaction times", "Printer ozone and toner ultra-fine particles", "Low air circulation in closed workrooms"],
    typicalPollutionSpike: "CO2 climbing above 1,500 ppm after 2 hours of closed-door work",
    interventions: [
      {
        title: "Monitor and flush CO2 during optimal outdoor hours",
        action: "When outdoor air is at its daily minimum (e.g., 1:00-3:00 PM in most cities), perform a 5-minute cross-ventilation purge.",
        impact: "Resets CO2 to ambient levels (~420 ppm), boosting cognitive processing speed by up to 15%."
      },
      {
        title: "Keep laser printers away from desk breathing zone",
        action: "Position printers at least 2 meters away from your primary chair and avoid printing large batches while sitting immediately adjacent.",
        impact: "Reduces acute inhalation of fused toner nano-particles."
      }
    ],
    mythBuster: "Myth: Air quality only matters when you have asthma. Reality: Harvard T.H. Chan studies show that even healthy professionals experience a 15-20% drop in strategic thinking and decision scores when indoor CO2 and PM2.5 rise."
  }
];

// Calculate estimated indoor PM2.5 based on outdoor conditions and home interventions
export function calculateIndoorAQI(outdoorPM25, { windowsOpen, hepaActive, cookingActive, weatherStripped }) {
  // Baseline infiltration rate
  let infiltrationRate = 0.50; // standard home with closed windows
  
  if (windowsOpen) {
    infiltrationRate = 0.88; // large outdoor ingress
  } else if (weatherStripped) {
    infiltrationRate = 0.32; // well sealed
  }

  // Penetrated outdoor pollution
  let indoorPM25 = outdoorPM25 * infiltrationRate;

  // Indoor generation sources
  if (cookingActive) {
    indoorPM25 += 55; // frying or unvented cooking
  }

  // Active mechanical filtration (HEPA clean air delivery)
  if (hepaActive) {
    const removalEfficiency = windowsOpen ? 0.45 : 0.82; // harder to clean if windows constantly introduce fresh dirty air
    indoorPM25 = indoorPM25 * (1 - removalEfficiency);
  }

  const rounded = Math.max(3, Math.round(indoorPM25));
  
  // Return indoor AQI approximation
  let indoorAQI = Math.round(rounded * 2.1);
  if (rounded > 60) indoorAQI = Math.round(rounded * 1.5 + 50);

  return {
    indoorPM25: rounded,
    indoorAQI: Math.min(500, indoorAQI),
    protectionPercentage: Math.max(0, Math.round(((outdoorPM25 - rounded) / Math.max(1, outdoorPM25)) * 100))
  };
}
