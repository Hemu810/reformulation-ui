import React from "react";

const STEP_ORDER = ["discovery", "candidates", "drug", "strategy", "references"];

const STEPS = [
  { id: "discovery",  label: "Discovery",    desc: "Filter molecules" },
  { id: "candidates", label: "Candidates",   desc: "Review shortlist" },
  { id: "drug",       label: "Drug Profile", desc: "IP & commercial snapshot" },
  { id: "strategy",   label: "Strategy",     desc: "AI recommendations" },
  { id: "references", label: "Evidence",     desc: "Supporting literature" },
];

export default function StepBar({ currentPage, navigate, selectedDrug, strategy }) {
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
    <div className="step-tracker">
      {STEPS.map((step, idx) => {
        const isDone    = idx < currentIndex;
        const isActive  = step.id === currentPage;
        const accessible = isAccessible(step.id);

        return (
          <React.Fragment key={step.id}>
            <button
              className={[
                "step-node",
                isActive   ? "step-node-active"  : "",
                isDone     ? "step-node-done"     : "",
                !accessible && !isDone && !isActive ? "step-node-locked" : "",
              ].filter(Boolean).join(" ")}
              onClick={() => accessible && navigate(step.id)}
              disabled={!accessible}
            >
              <div className="step-node-circle">
                {isDone ? "✓" : idx + 1}
              </div>
              <div className="step-node-text">
                <span className="step-node-label">{step.label}</span>
                <span className="step-node-desc">{step.desc}</span>
              </div>
            </button>

            {idx < STEPS.length - 1 && (
              <div className={`step-line ${isDone ? "step-line-done" : ""}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
