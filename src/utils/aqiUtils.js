// Atmospheric Field Journal - AQI grading, palettes, and health context
// Official Central Pollution Control Board (CPCB) India NAQI Scale:
// Good (0-50), Satisfactory (51-100), Moderate (101-200), Poor (201-300), Very Poor (301-400), Severe (401-500)

export const AQI_LEVELS = [
  {
    min: 0,
    max: 50,
    label: "Good",
    code: "good",
    color: "#2d7a52", // Deep botanical green
    bgLight: "#edf6f0",
    bgDark: "rgba(45, 122, 82, 0.25)",
    textLight: "#165334",
    textDark: "#a7e3c1",
    borderLight: "#b7dfc7",
    borderDark: "#2d7a52",
    advice: "Minimal health impact. Air quality is considered clean and safe for all outdoor physical activities."
  },
  {
    min: 51,
    max: 100,
    label: "Satisfactory",
    code: "satisfactory",
    color: "#65a30d", // Olive / Meadow Green
    bgLight: "#f4f9e8",
    bgDark: "rgba(101, 163, 13, 0.22)",
    textLight: "#3f6212",
    textDark: "#bef264",
    borderLight: "#d9f99d",
    borderDark: "#65a30d",
    advice: "Minor breathing discomfort may develop in highly sensitive individuals on prolonged exertion."
  },
  {
    min: 101,
    max: 200,
    label: "Moderate",
    code: "moderate",
    color: "#b07a1c", // Warm Ochre / Amber
    bgLight: "#fef8ee",
    bgDark: "rgba(176, 122, 28, 0.22)",
    textLight: "#7c5410",
    textDark: "#fde68a",
    borderLight: "#fde68a",
    borderDark: "#b07a1c",
    advice: "Breathing discomfort to individuals with asthma, respiratory illness, or cardiac conditions."
  },
  {
    min: 201,
    max: 300,
    label: "Poor",
    code: "poor",
    color: "#c85a32", // Terracotta / Earthy Orange
    bgLight: "#fff4ed",
    bgDark: "rgba(200, 90, 50, 0.22)",
    textLight: "#8c3819",
    textDark: "#fdba74",
    borderLight: "#fed7aa",
    borderDark: "#c85a32",
    advice: "Breathing discomfort to most people on prolonged outdoor exposure; avoid heavy cardio near traffic."
  },
  {
    min: 301,
    max: 400,
    label: "Very Poor",
    code: "very_poor",
    color: "#b83a2d", // Burnt Crimson / Brick Red
    bgLight: "#fef2f2",
    bgDark: "rgba(184, 58, 45, 0.24)",
    textLight: "#7f241a",
    textDark: "#fca5a5",
    borderLight: "#fecaca",
    borderDark: "#b83a2d",
    advice: "Respiratory illness on prolonged exposure. Significant cardiovascular and pulmonary stress."
  },
  {
    min: 401,
    max: 999,
    label: "Severe",
    code: "severe",
    color: "#6b2144", // Deep Maroon Basalt
    bgLight: "#fbf0f4",
    bgDark: "rgba(107, 33, 68, 0.28)",
    textLight: "#47102b",
    textDark: "#fbcfe8",
    borderLight: "#f472b6",
    borderDark: "#6b2144",
    advice: "Emergency advisory: Affects healthy individuals and causes serious health impacts on vulnerable groups. Seal windows and run HEPA filtration."
  }
];

export function getAQIInfo(aqi) {
  const value = Math.max(0, Math.round(aqi || 0));
  const level = AQI_LEVELS.find(l => value >= l.min && value <= l.max) || AQI_LEVELS[AQI_LEVELS.length - 1];
  return { ...level, value };
}

export function getPM25Warning(pm25, persona = "general") {
  if (persona === "sensitive" || persona === "child") {
    if (pm25 > 60) return { severity: "high", text: "Sensitive population notice: Concentrations exceed safe limits. Consider high-filtration N95/FFP2 protection during active transit." };
    if (pm25 > 30) return { severity: "moderate", text: "Mild irritation threshold: Individuals with airway sensitivity may benefit from moderating prolonged outdoor cardio." };
  } else if (persona === "athlete") {
    if (pm25 > 75) return { severity: "high", text: "Athletic notice: Vigorous oral ventilation substantially multiplies deep alveolar particulate deposition. Align training with diurnal convective lows." };
  }

  if (pm25 > 150) return { severity: "severe", text: "Severe particulate density: Keep windows sealed and operate indoor HEPA purifiers continuously." };
  if (pm25 > 60) return { severity: "high", text: "Elevated particulate concentration: Prefer indoor exercise or shaded park corridors over arterial roadways." };
  return { severity: "normal", text: "Ambient conditions are generally favorable for standard daily outdoor routines." };
}
