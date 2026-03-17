import React from "react";

const STEP_ORDER = ["discovery", "candidates", "drug", "strategy", "references"];

export default function Header({ currentPage, steps, navigate, selectedDrug, strategy }) {
  const currentIndex = STEP_ORDER.indexOf(currentPage);

  const isAccessible = (stepId) => {
    const i = STEP_ORDER.indexOf(stepId);
    if (i === 0) return true;
    if (i === 1) return currentIndex >= 1;
    if (stepId === "drug") return !!selectedDrug;
    if (stepId === "strategy") return !!strategy;
    if (stepId === "references") return !!strategy;
    return false;
  };

  return (
    <header className="site-header">
      <div className="header-inner">
        <div className="header-brand" onClick={() => navigate("discovery")}>
          <div className="brand-mark">Rx</div>
          <span className="brand-name">Reform<span>AI</span></span>
        </div>

        <nav className="header-nav">
          {steps.map((step, idx) => {
            const isDone = STEP_ORDER.indexOf(step.id) < currentIndex;
            const isActive = step.id === currentPage;
            const accessible = isAccessible(step.id);

            return (
              <React.Fragment key={step.id}>
                {idx > 0 && <div className="nav-divider" />}
                <button
                  className={`nav-step-btn ${isActive ? "active" : ""} ${isDone ? "done" : ""} ${accessible ? "accessible" : ""}`}
                  onClick={() => accessible && navigate(step.id)}
                  disabled={!accessible}
                >
                  <span className="nav-step-num">
                    {isDone ? "✓" : idx + 1}
                  </span>
                  {step.label}
                </button>
              </React.Fragment>
            );
          })}
        </nav>

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
