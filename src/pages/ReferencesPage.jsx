import React from "react";

const CATEGORY_META = {
  Clinical: { icon: "🧬", badge: "badge-yes" },
  Regulatory: { icon: "📋", badge: "badge-blue" },
  Preclinical: { icon: "⚗️", badge: "badge-violet" },
  Commercial: { icon: "📊", badge: "badge-amber" },
  Default: { icon: "📄", badge: "badge-no" },
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
    <div className="container">
      <div className="back-row fade-up fade-up-1">
        <button className="btn btn-ghost btn-sm" onClick={onBack}>
          ← Back to Strategy
        </button>
        <div className="step-pill">Step 05</div>
      </div>

      <div className="page-header fade-up fade-up-1">
        <div className="page-eyebrow">Evidence & References</div>
        <h1 className="page-title" style={{ fontSize: "clamp(22px, 3vw, 36px)" }}>
          Supporting <span className="highlight">evidence base</span>
          {drug && <span style={{ color: "var(--text-secondary)", fontWeight: 400 }}> — {drug.generic_name}</span>}
        </h1>
        <p className="page-desc">
          Peer-reviewed publications, FDA guidance documents, and regulatory databases underpinning the recommended strategy.
        </p>
      </div>

      {/* Summary bar */}
      <div className="fade-up fade-up-2" style={{ display: "flex", gap: 16, marginBottom: 28, flexWrap: "wrap" }}>
        <div style={{ padding: "10px 16px", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", display: "flex", gap: 20 }}>
          {categories.map((cat) => {
            const meta = CATEGORY_META[cat] || CATEGORY_META.Default;
            return (
              <div key={cat} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span>{meta.icon}</span>
                <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                  <strong style={{ color: "var(--text-primary)" }}>{grouped[cat].length}</strong> {cat}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {references.length === 0 ? (
        <div className="card fade-up fade-up-3">
          <div className="empty-state">
            <div className="empty-icon">📚</div>
            <div className="empty-title">No references available</div>
            <div className="empty-desc">References will appear here once a strategy is generated.</div>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          {categories.map((cat, catIdx) => {
            const meta = CATEGORY_META[cat] || CATEGORY_META.Default;
            return (
              <div key={cat} className={`fade-up fade-up-${Math.min(catIdx + 3, 5)}`}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 16 }}>{meta.icon}</span>
                  <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    {cat}
                  </span>
                  <span className={`badge ${meta.badge}`}>{grouped[cat].length}</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {grouped[cat].map((ref, idx) => (
                    <div key={idx} className="ref-card">
                      <div className="ref-icon">{meta.icon}</div>
                      <div className="ref-content">
                        <div className="ref-category">{ref.category}</div>
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

      {/* Disclaimer */}
      <div className="fade-up fade-up-5" style={{ marginTop: 40, padding: "16px 20px", background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.15)", borderRadius: "var(--radius-md)", display: "flex", gap: 12 }}>
        <span style={{ fontSize: 18, flexShrink: 0 }}>⚠️</span>
        <div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13, color: "var(--accent-amber)", marginBottom: 4 }}>
            Disclaimer
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>
            This information is generated for research and informational purposes only. It does not constitute legal, regulatory, or medical advice. Always consult qualified professionals and review primary source materials before making any regulatory or business decisions.
          </div>
        </div>
      </div>
    </div>
  );
}
