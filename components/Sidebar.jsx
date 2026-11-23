// Clean desktop sidebar navigation & responsive mobile drawer for Atmospheric Field Journal
import React from 'react';
import { Icon } from './Icons';

export const Sidebar = ({
  activeSection,
  setActiveSection,
  mobileNavOpen,
  setMobileNavOpen
}) => {
  const navItems = [
    { id: "overview", label: "Overview", num: "01", icon: "compass", subtitle: "Atmospheric status" },
    { id: "map", label: "Air Map", num: "02", icon: "map", subtitle: "Station network" },
    { id: "simulator", label: "Decision Lab", num: "03", icon: "sliders", badge: "Signature", subtitle: "Exposure simulator" },
    { id: "plan", label: "My Day", num: "04", icon: "calendar", subtitle: "Diurnal planner" },
    { id: "indoor", label: "Indoor Air", num: "05", icon: "home", subtitle: "Sanctuary physics" },
    { id: "sustainable", label: "Better Choices", num: "06", icon: "leaf", subtitle: "Mobility & community" },
    { id: "coach", label: "Air Coach", num: "07", icon: "sparkles", subtitle: "Decision assistant" }
  ];

  const handleSelect = (id) => {
    setActiveSection(id);
    if (setMobileNavOpen) {
      setMobileNavOpen(false);
    }
  };

  return (
    <>
      {/* Desktop Left Sidebar Rail */}
      <aside className="journal-desktop-sidebar" aria-label="Field Journal Sections">
        <div className="sidebar-inner">
          <div className="sidebar-meta-stamp">
            <span className="field-tag">Index of Records</span>
          </div>

          <nav className="sidebar-nav-list">
            {navItems.map(item => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item.id)}
                  className={`sidebar-nav-item ${isActive ? "active" : ""}`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <div className="nav-item-num">{item.num}</div>
                  <div className="nav-item-icon">
                    <Icon name={item.icon} size={17} />
                  </div>
                  <div className="nav-item-text">
                    <span className="nav-item-title">
                      {item.label}
                      {item.badge && <span className="nav-item-badge">{item.badge}</span>}
                    </span>
                    <span className="nav-item-sub">{item.subtitle}</span>
                  </div>
                </button>
              );
            })}
          </nav>

          {/* Environmental Field Note Box in Sidebar */}
          <div className="sidebar-field-note">
            <div className="note-stamp">Field Note</div>
            <p className="note-text">
              Diurnal boundary layer dynamics alter ground pollution concentration throughout the day. Time-shifting high-ventilation activities cuts personal inhalation dose without altering ambient city readings.
            </p>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer Backdrop and Drawer */}
      {mobileNavOpen && (
        <div
          className="mobile-drawer-overlay"
          onClick={() => setMobileNavOpen(false)}
        >
          <div
            className="mobile-drawer-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mobile-drawer-top">
              <span className="field-tag">Index of Records</span>
              <button
                type="button"
                className="drawer-close-btn"
                onClick={() => setMobileNavOpen(false)}
                aria-label="Close navigation"
              >
                ✕
              </button>
            </div>

            <nav className="mobile-drawer-nav">
              {navItems.map(item => {
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item.id)}
                    className={`mobile-drawer-item ${isActive ? "active" : ""}`}
                  >
                    <div className="nav-item-icon">
                      <Icon name={item.icon} size={18} />
                    </div>
                    <div className="nav-item-text">
                      <span className="nav-item-title">
                        {item.label}
                        {item.badge && <span className="nav-item-badge">{item.badge}</span>}
                      </span>
                      <span className="nav-item-sub">{item.subtitle}</span>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Mobile Bottom Quick Navigation Bar */}
      <nav className="mobile-bottom-bar" aria-label="Mobile Quick Nav">
        {navItems.slice(0, 5).map(item => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelect(item.id)}
              className={`mobile-bottom-item ${isActive ? "active" : ""}`}
              aria-label={item.label}
            >
              <Icon name={item.icon} size={18} />
              <span className="bottom-item-label">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
