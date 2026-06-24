import React from "react";

export default function Header({ navigate }) {
  return (
    <header className="site-header">
      <div className="header-inner">
        <div className="header-brand" onClick={() => navigate("discovery")}>
          <div className="brand-mark">Rx</div>
          <span className="brand-name">Molecule<span>Screener</span></span>
        </div>
      </div>
    </header>
  );
}
