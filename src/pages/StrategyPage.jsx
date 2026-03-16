import React from "react";

const STRATEGY_ITEMS = [
  { key: "scientific", label: "Scientific Rationale", icon: "🔬", color: "rgba(79,142,255,0.15)" },
  { key: "technology", label: "Technology Platform", icon: "⚙️", color: "rgba(139,92,246,0.12)" },
  { key: "commercial", label: "Commercial Thesis", icon: "📈", color: "rgba(16,217,160,0.1)" },
  { key: "patient", label: "Patient Benefit", icon: "💊", color: "rgba(245,158,11,0.1)" },
  { key: "regulatory", label: "Regulatory & IP", icon: "⚖️", color: "rgba(244,63,94,0.08)" },
];

export default function StrategyPage({ strategy, drug, onViewReferences, onBack }) {
  if (!strategy) return null;

  return (
    <div className="container">
      <div className="back-row fade-up fade-up-1">
        <button className="btn btn-ghost btn-sm" onClick={onBack}>
          ← Back to Drug Profile
        </button>
        <div className="step-pill">Step 04</div>
      </div>

      <div className="page-header fade-up fade-up-1">
        <div className="page-eyebrow">Strategy & Recommendations</div>
        <h1 className="page-title" style={{ fontSize: "clamp(22px, 3vw, 36px)" }}>
          Reformulation <span className="highlight">playbook</span>
          {drug && <span style={{ color: "var(--text-secondary)", fontWeight: 400 }}> for {drug.generic_name}</span>}
        </h1>
      </div>

      {/* Summary */}
      <div className="card fade-up fade-up-2" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <span className="card-title">Recommended Opportunity</span>
          <span style={{ fontSize: 18 }}>🎯</span>
        </div>
        <div className="card-body">
          <p style={{ fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.7, maxWidth: 800 }}>
            {strategy.summary}
          </p>
        </div>
      </div>

      {/* Rationale grid */}
      <div style={{ marginBottom: 8 }}>
        <div className="page-eyebrow" style={{ fontSize: 11, marginBottom: 14 }}>Strategic Rationale</div>
      </div>
      <div className="strategy-grid fade-up fade-up-3" style={{ marginBottom: 24 }}>
        {STRATEGY_ITEMS.map((item) => {
          const val = strategy[item.key];
          if (!val) return null;
          return (
            <div key={item.key} className="strategy-item" style={{ borderLeft: `3px solid ${item.color.replace("0.1)", "0.6)").replace("0.12)", "0.6)").replace("0.15)", "0.6)").replace("0.08)", "0.5)")}` }}>
              <div className="strategy-item-icon" style={{ background: item.color }}>{item.icon}</div>
              <div className="strategy-item-label">{item.label}</div>
              <div className="strategy-item-text">{val}</div>
            </div>
          );
        })}
      </div>

      {/* Bridging studies */}
      {strategy.bridging_studies?.length > 0 && (
        <div className="card fade-up fade-up-4" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <span className="card-title">Suggested Bridging Studies</span>
            <span className="badge badge-blue">{strategy.bridging_studies.length} studies</span>
          </div>
          <div className="card-body">
            <div className="study-tags-wrap">
              {strategy.bridging_studies.map((s, idx) => (
                <div key={idx} className="study-tag">
                  <div className="study-tag-dot"></div>
                  {s}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="fade-up fade-up-5" style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <button
          className="btn btn-primary btn-lg"
          onClick={onViewReferences}
        >
          View Evidence & References →
        </button>
        <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
          Peer-reviewed literature, FDA guidances, and clinical sources
        </p>
      </div>
    </div>
  );
}
