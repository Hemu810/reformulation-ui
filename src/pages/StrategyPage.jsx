import React from "react";

const ITEMS = [
  { key: "scientific",  label: "Scientific Rationale", icon: "🔬", accent: "var(--blue)" },
  { key: "technology",  label: "Technology Platform",  icon: "⚙️", accent: "var(--violet)" },
  { key: "commercial",  label: "Commercial Thesis",    icon: "📈", accent: "var(--green)" },
  { key: "patient",     label: "Patient Benefit",      icon: "💊", accent: "var(--amber)" },
  { key: "regulatory",  label: "Regulatory & IP",      icon: "⚖️", accent: "var(--red)" },
];

export default function StrategyPage({ strategy, drug, onViewReferences, onBack }) {
  if (!strategy) return null;

  return (
    <>
      <div className="page-top-bar">
        <div className="page-top-inner">
          <div>
            <div className="page-breadcrumb">
              <span style={{ cursor: "pointer", color: "var(--green)" }} onClick={onBack}>{drug?.brand_name || "Drug Profile"}</span>
              <span className="breadcrumb-sep">/</span>
              <span className="breadcrumb-active">Strategy</span>
            </div>
            <h1 className="page-title">
              Reformulation Strategy
              {drug && <span style={{ fontWeight: 400, color: "var(--text-muted)", fontStyle: "italic" }}> — {drug.generic_name}</span>}
            </h1>
            <div className="page-subtitle">AI-generated playbook · FDA 505(b)(2) pathway · Bridging study recommendations</div>
          </div>
          <div className="page-actions">
            <button className="btn btn-secondary btn-sm" onClick={onBack}>← Drug Profile</button>
            <button className="btn btn-primary" onClick={onViewReferences}>View Evidence →</button>
          </div>
        </div>
      </div>

      <div className="container">
        {/* Summary banner */}
        <div className="summary-banner fade-up delay-1">
          <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
            <div style={{ fontSize: 28, flexShrink: 0 }}>🎯</div>
            <div>
              <div className="summary-banner-title">Recommended Opportunity</div>
              <div className="summary-banner-text">{strategy.summary}</div>
            </div>
          </div>
        </div>

        {/* Strategy rationale */}
        <div className="section-header fade-up delay-2">
          <div className="section-title">Strategic Rationale</div>
          <span className="badge badge-navy">{ITEMS.filter(i => strategy[i.key]).length} dimensions</span>
        </div>

        <div className="strategy-grid fade-up delay-2" style={{ marginBottom: 24 }}>
          {ITEMS.map((item) => {
            const val = strategy[item.key];
            if (!val) return null;
            return (
              <div key={item.key} className="strategy-item" style={{ borderTop: `3px solid ${item.accent}` }}>
                <span className="strategy-item-icon">{item.icon}</span>
                <div className="strategy-item-label">{item.label}</div>
                <div className="strategy-item-text">{val}</div>
              </div>
            );
          })}
        </div>

        {/* Bridging studies */}
        {strategy.bridging_studies?.length > 0 && (
          <div className="card fade-up delay-3" style={{ marginBottom: 24 }}>
            <div className="card-header">
              <span className="card-title">Suggested Bridging Studies</span>
              <span className="badge badge-blue">{strategy.bridging_studies.length} required</span>
            </div>
            <div className="card-body">
              <div className="section-header" style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
                  Studies required to support the 505(b)(2) application based on FDA guidance for the target formulation type.
                </div>
              </div>
              <div className="study-tags-wrap">
                {strategy.bridging_studies.map((s, i) => (
                  <div key={i} className="study-tag">
                    <div className="study-tag-dot" />
                    {s}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Timeline estimate */}
        <div className="card fade-up delay-4" style={{ marginBottom: 24 }}>
          <div className="card-header"><span className="card-title">Development Timeline Estimate</span><span>📅</span></div>
          <div className="card-body">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px,1fr))", gap: 1, background: "var(--slate-line)", border: "1px solid var(--slate-line)", borderRadius: "var(--radius-sm)", overflow: "hidden" }}>
              {[
                { phase: "Pre-formulation", duration: "3–6 mo", color: "var(--blue)" },
                { phase: "Bridging Studies", duration: "6–12 mo", color: "var(--green)" },
                { phase: "NDA Filing", duration: "3–6 mo", color: "var(--amber)" },
                { phase: "FDA Review", duration: "10–12 mo", color: "var(--navy)" },
              ].map((t) => (
                <div key={t.phase} style={{ background: "var(--bg-white)", padding: "14px 16px", borderTop: `3px solid ${t.color}` }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: 1, textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 5 }}>{t.phase}</div>
                  <div style={{ fontFamily: "var(--font-serif)", fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>{t.duration}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <button className="btn btn-primary btn-lg" onClick={onViewReferences}>
            View Evidence &amp; References →
          </button>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Peer-reviewed literature · FDA guidances · Clinical sources</span>
        </div>
      </div>
    </>
  );
}
