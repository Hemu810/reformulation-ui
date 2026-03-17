import React from "react";

const CAT_META = {
  Clinical:     { icon: "🧬", badge: "badge-yes",    color: "var(--green)" },
  Regulatory:   { icon: "📋", badge: "badge-blue",   color: "var(--blue)" },
  Preclinical:  { icon: "⚗️",  badge: "badge-violet", color: "var(--violet)" },
  Commercial:   { icon: "📊", badge: "badge-amber",  color: "var(--amber)" },
  Default:      { icon: "📄", badge: "badge-no",     color: "var(--slate-mid)" },
};

export default function ReferencesPage({ references, drug, onBack }) {
  const grouped = references.reduce((acc, ref) => {
    const cat = ref.category || "Default";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(ref);
    return acc;
  }, {});

  const categories = Object.keys(grouped);

  return (
    <>
      <div className="page-top-bar">
        <div className="page-top-inner">
          <div>
            <div className="page-breadcrumb">
              <span style={{ cursor: "pointer", color: "var(--green)" }} onClick={onBack}>Strategy</span>
              <span className="breadcrumb-sep">/</span>
              <span className="breadcrumb-active">Evidence</span>
            </div>
            <h1 className="page-title">
              Evidence &amp; References
              {drug && <span style={{ fontWeight: 400, color: "var(--text-muted)", fontStyle: "italic" }}> — {drug.generic_name}</span>}
            </h1>
            <div className="page-subtitle">Supporting literature · FDA guidances · Regulatory databases</div>
          </div>
          <div className="page-actions">
            <button className="btn btn-secondary btn-sm" onClick={onBack}>← Strategy</button>
            <span className="badge badge-navy">{references.length} source{references.length !== 1 ? "s" : ""}</span>
          </div>
        </div>
      </div>

      <div className="container">
        {/* KPI row */}
        <div className="kpi-grid fade-up delay-1">
          <div className="kpi-card kpi-accent-green">
            <div className="kpi-label">Total Sources</div>
            <div className="kpi-value">{references.length}</div>
            <div className="kpi-sub">Across all categories</div>
          </div>
          {categories.map((cat, i) => {
            const meta = CAT_META[cat] || CAT_META.Default;
            const accents = ["kpi-accent-blue", "kpi-accent-amber", "kpi-accent-navy"];
            return (
              <div key={cat} className={`kpi-card ${accents[i % accents.length]}`}>
                <div className="kpi-label">{cat}</div>
                <div className="kpi-value">{grouped[cat].length}</div>
                <div className="kpi-sub">{meta.icon} {cat} references</div>
              </div>
            );
          })}
        </div>

        {references.length === 0 ? (
          <div className="card fade-up delay-2">
            <div className="empty-state">
              <div className="empty-icon">📚</div>
              <div className="empty-title">No references available</div>
              <div className="empty-desc">References appear after a strategy is generated.</div>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {categories.map((cat, catIdx) => {
              const meta = CAT_META[cat] || CAT_META.Default;
              return (
                <div key={cat} className={`fade-up delay-${Math.min(catIdx + 2, 5)}`}>
                  <div className="section-header">
                    <div className="section-title" style={{ "--section-color": meta.color }}>
                      {meta.icon} {cat} References
                    </div>
                    <span className={`badge ${meta.badge}`}>{grouped[cat].length}</span>
                  </div>
                  <div className="card">
                    {grouped[cat].map((ref, idx) => (
                      <div key={idx} className="ref-card">
                        <div className="ref-icon" style={{ background: `${meta.color}15`, borderColor: `${meta.color}30` }}>
                          {meta.icon}
                        </div>
                        <div className="ref-content">
                          <div className="ref-category" style={{ color: meta.color }}>{ref.category}</div>
                          <div className="ref-desc">{ref.description}</div>
                          <div className="ref-source">Source: {ref.source}</div>
                        </div>
                        <div style={{ flexShrink: 0 }}>
                          <span className={`badge ${meta.badge}`}>{ref.source}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="disclaimer fade-up delay-5">
          <span className="disclaimer-icon">⚠️</span>
          <div>
            <div className="disclaimer-title">Research Use Only — Not Regulatory or Legal Advice</div>
            <div className="disclaimer-text">
              All information is generated for research and informational purposes only under 21 CFR Part 314. It does not constitute legal, regulatory, or medical advice. Always consult qualified regulatory affairs professionals and review primary source materials before making any submission or business decisions. ReformAI makes no warranties as to accuracy or completeness.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
