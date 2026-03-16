import React from "react";

const STEP_ORDER = ["discovery", "candidates", "drug", "strategy", "references"];

export default function Header({ currentPage, steps, navigate, selectedDrug, strategy }) {
  const currentIndex = STEP_ORDER.indexOf(currentPage);

  const isAccessible = (stepId) => {
    const stepIndex = STEP_ORDER.indexOf(stepId);
    if (stepIndex === 0) return true;
    if (stepIndex === 1) return true; // always accessible once visited
    if (stepId === "drug" && selectedDrug) return true;
    if (stepId === "strategy" && strategy) return true;
    if (stepId === "references" && strategy) return true;
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
                {idx > 0 && <span className="nav-chevron">›</span>}
                <div className="nav-step">
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
                </div>
              </React.Fragment>
            );
          })}
        </nav>

        <div className="header-actions">
          <span className="header-badge">Beta v0.9</span>
        </div>
      </div>
    </header>
  );
}
