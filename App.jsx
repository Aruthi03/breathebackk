// BreatheBack - Atmospheric Field Journal Application Root
import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { AirQualityOverview } from './components/AirQualityOverview';
import { AirMap } from './components/AirMap';
import { DecisionSimulator } from './components/DecisionSimulator';
import { PersonalizedPlan } from './components/PersonalizedPlan';
import { IndoorGuide } from './components/IndoorGuide';
import { SustainableChoices } from './components/SustainableChoices';
import { AirCoach } from './components/AirCoach';
import { BENCHMARK_CITIES } from './data/mockAirData';

export function App() {
  // Theme state: Warm Ivory (light) vs Deep Forest Charcoal (dark)
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('breatheback_theme');
    if (saved) return saved;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light'; // Default to warm ivory light theme
  });

  const [activeSection, setActiveSection] = useState("overview");
  const [selectedCityKey, setSelectedCityKey] = useState("delhi");
  const [selectedPersonaKey, setSelectedPersonaKey] = useState("general");
  const [customCity, setCustomCity] = useState(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Sync theme with document element and localStorage
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('breatheback_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const activeCity = customCity || BENCHMARK_CITIES[selectedCityKey] || BENCHMARK_CITIES.delhi;

  return (
    <div className={`journal-app-shell theme-${theme}`}>
      {/* Compact Top Journal Header */}
      <Navbar
        theme={theme}
        toggleTheme={toggleTheme}
        selectedCityKey={selectedCityKey}
        setSelectedCityKey={setSelectedCityKey}
        selectedPersonaKey={selectedPersonaKey}
        setSelectedPersonaKey={setSelectedPersonaKey}
        customCity={customCity}
        setCustomCity={setCustomCity}
        mobileNavOpen={mobileNavOpen}
        setMobileNavOpen={setMobileNavOpen}
      />

      {/* Primary Journal Framework: Desktop Sidebar + Content Stage */}
      <div className="journal-framework">
        <Sidebar
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          mobileNavOpen={mobileNavOpen}
          setMobileNavOpen={setMobileNavOpen}
        />

        {/* Main Editorial Content Canvas */}
        <main className="journal-content-canvas">
          {activeSection === "overview" && (
            <AirQualityOverview
              city={activeCity}
              personaKey={selectedPersonaKey}
              onNavigateToSimulator={() => setActiveSection("simulator")}
              onNavigateToMap={() => setActiveSection("map")}
            />
          )}

          {activeSection === "map" && (
            <AirMap
              city={activeCity}
              selectedCityKey={selectedCityKey}
              onSelectCity={(key) => {
                setCustomCity(null);
                setSelectedCityKey(key);
              }}
            />
          )}

          {activeSection === "simulator" && (
            <DecisionSimulator
              city={activeCity}
              personaKey={selectedPersonaKey}
            />
          )}

          {activeSection === "plan" && (
            <PersonalizedPlan
              city={activeCity}
              personaKey={selectedPersonaKey}
              onNavigateToSimulator={() => setActiveSection("simulator")}
            />
          )}

          {activeSection === "indoor" && (
            <IndoorGuide
              city={activeCity}
            />
          )}

          {activeSection === "sustainable" && (
            <SustainableChoices
              city={activeCity}
            />
          )}

          {activeSection === "coach" && (
            <AirCoach
              city={activeCity}
              personaKey={selectedPersonaKey}
              onNavigateToSection={setActiveSection}
            />
          )}

          {/* Editorial Colophon / Footer */}
          <footer className="journal-colophon">
            <div className="colophon-inner">
              <div className="colophon-main">
                <div className="colophon-insignia">BreatheBack § Field Journal</div>
                <p className="colophon-purpose">
                  Personalized environmental decision assistant designed for <strong>PromptWars Challenge 6: Urban Air Quality Assistant</strong>.
                </p>
              </div>

              <div className="colophon-columns">
                <div className="colophon-col">
                  <span className="col-title">Methodology & Sources</span>
                  <span className="col-desc">EPA / WHO Minute Inhalation Exposure Factors</span>
                  <span className="col-desc">Boundary Layer Convective Mixing Physics</span>
                  <span className="col-desc">OpenStreetMap Station Telemetry Overlay</span>
                </div>

                <div className="colophon-col">
                  <span className="col-title">Data Notice</span>
                  <p className="col-desc">
                    All telemetry data represents <em>representative benchmark simulation data</em> for algorithmic evaluation and decision modeling.
                  </p>
                </div>
              </div>
            </div>

            <div className="colophon-bottom-rule">
              <span>Published for PromptWars Challenge 6 • Urban Air Quality Assistant</span>
              <span className="colophon-mode-tag">
                {theme === 'dark' ? 'Forest Charcoal Theme' : 'Warm Ivory Theme'} • System Active
              </span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}

export default App;
