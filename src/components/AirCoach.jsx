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
import { DEFAULT_USER_ACTIVITIES, generateAirCoachResponse } from '../utils/airCoachEngine';

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
   * Delegated to pure ES module in utils/airCoachEngine.js
   */
  const generateGroundedResponse = (query) => {
    return generateAirCoachResponse(query, city, personaKey, userActivities);
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
