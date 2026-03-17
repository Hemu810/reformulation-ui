import React from "react";

export default function Header({ navigate }) {
  return (
    <header className="site-header">
      <div className="header-inner">
        <div className="header-brand" onClick={() => navigate("discovery")}>
          <div className="brand-mark">Rx</div>
          <span className="brand-name">Reform<span>AI</span></span>
        </div>

        <div style={{ flex: 1 }} />

        <div className="header-actions">
          <div className="header-live">
            <div className="live-dot" />
            LIVE
          </div>
          <span className="header-badge">FDA 2025</span>
        </div>
      </div>
    </header>
  );
}
