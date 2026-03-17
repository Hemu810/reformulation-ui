import React, { useEffect, useState } from "react";

const BASE = process.env.REACT_APP_API_URL || "";

const ANALYTICS = [
  { label: "Molecules Tracked", value: "10,482", change: "+124", dir: "up" },
  { label: "505(b)(2) Eligible", value: "3,871", change: "+18", dir: "up" },
  { label: "ANDA Opportunities", value: "2,340", change: "+7", dir: "up" },
  { label: "Avg Opp. Score", value: "74.2", change: "-0.3", dir: "down" },
  { label: "Rare Disease", value: "412", change: "+5", dir: "up" },
];

export default function DiscoveryPage({ onFilter, isLoading }) {
  const [roas, setRoas] = useState([]);
  const [dosageForms, setDosageForms] = useState([]);
  const [selectedRoa, setSelectedRoa] = useState("");
  const [selectedForm, setSelectedForm] = useState("");

  useEffect(() => {
    fetch(`${BASE}/api/options`)
      .then((r) => r.json())
      .then((d) => {
        setRoas(d.roaOptions || []);
        setDosageForms(d.dosageFormOptions || []);
      })
      .catch(console.error);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedRoa || !selectedForm) return;
    onFilter(selectedRoa, selectedForm);
  };

  return (
    <>
      {/* Analytics ticker */}
      <div className="analytics-strip">
        <div className="analytics-strip-inner">
          {ANALYTICS.map((a) => (
            <div key={a.label} className="strip-item">
              <span className="strip-label">{a.label}</span>
              <span className="strip-value">{a.value}</span>
              <span className={`strip-change strip-${a.dir}`}>
                {a.dir === "up" ? "▲" : "▼"} {a.change}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Page top bar */}
      <div className="page-top-bar">
        <div className="page-top-inner">
          <div>
            <div className="page-breadcrumb">
              <span>ReformAI</span>
              <span className="breadcrumb-sep">/</span>
              <span className="breadcrumb-active">Discovery</span>
            </div>
            <h1 className="page-title">Molecule Discovery Engine</h1>
            <div className="page-subtitle">505(b)(2) and first-to-file ANDA opportunity screening · 10,000+ molecules</div>
          </div>
          <div className="page-actions">
            <span className="badge badge-navy">US Market</span>
            <span className="badge badge-yes">FDA 2025 Data</span>
          </div>
        </div>
      </div>

      <div className="container">
        {/* KPI row */}
        <div className="kpi-grid fade-up delay-1">
          <div className="kpi-card kpi-accent-green">
            <div className="kpi-label">Total Molecules</div>
            <div className="kpi-value">10,482</div>
            <div className="kpi-sub">Across all routes &amp; forms</div>
          </div>
          <div className="kpi-card kpi-accent-blue">
            <div className="kpi-label">505(b)(2) Candidates</div>
            <div className="kpi-value">3,871</div>
            <div className="kpi-sub">Reformulation eligible</div>
          </div>
          <div className="kpi-card kpi-accent-amber">
            <div className="kpi-label">First-to-File ANDA</div>
            <div className="kpi-value">2,340</div>
            <div className="kpi-sub">Para IV opportunity window</div>
          </div>
          <div className="kpi-card kpi-accent-navy">
            <div className="kpi-label">Rare / Unmet Need</div>
            <div className="kpi-value">412</div>
            <div className="kpi-sub">Orphan &amp; unmet indications</div>
          </div>
        </div>

        {/* Main layout */}
        <div className="discovery-layout fade-up delay-2">
          {/* Left copy */}
          <div className="discovery-copy">
            <div className="discovery-eyebrow">Step 01 — Opportunity Discovery</div>
            <h2 className="discovery-heading">
              Find your next<br /><em>reformulation play</em>
            </h2>
            <p className="discovery-desc">
              Screen the full US pharmaceutical landscape for high-value 505(b)(2) reformulation and ANDA first-to-file opportunities. Filter by delivery route and target dosage form to surface scored candidates with full IP and litigation intelligence.
            </p>

            <div className="discovery-stats">
              <div>
                <div className="d-stat-value">98.4%</div>
                <div className="d-stat-label">NDA coverage</div>
              </div>
              <div>
                <div className="d-stat-value">2015–32</div>
                <div className="d-stat-label">Sales horizon</div>
              </div>
              <div>
                <div className="d-stat-value">Live</div>
                <div className="d-stat-label">Orange Book sync</div>
              </div>
            </div>
          </div>

          {/* Filter panel */}
          <div className="filter-panel fade-up delay-3">
            <div className="filter-panel-header">
              <div className="filter-panel-title">Configure Search Parameters</div>
              <div className="filter-panel-sub">Select target delivery route and dosage form to begin screening</div>
            </div>
            <div className="filter-panel-body">
              <form onSubmit={handleSubmit}>
                <div className="filter-row">
                  <div className="form-field">
                    <label className="form-label">Route of Administration</label>
                    <select
                      className="form-select"
                      value={selectedRoa}
                      onChange={(e) => setSelectedRoa(e.target.value)}
                    >
                      <option value="">Select ROA</option>
                      {roas.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div className="form-field">
                    <label className="form-label">Target Dosage Form</label>
                    <select
                      className="form-select"
                      value={selectedForm}
                      onChange={(e) => setSelectedForm(e.target.value)}
                    >
                      <option value="">Select dosage form</option>
                      {dosageForms.map((f) => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                </div>

                {selectedRoa && selectedForm && (
                  <div style={{
                    padding: "10px 14px", background: "#f0fdf9",
                    border: "1px solid var(--green-border)", borderRadius: "var(--radius-sm)",
                    marginBottom: 16, fontSize: 12.5, color: "var(--green)",
                    fontFamily: "var(--font-mono)", display: "flex", alignItems: "center", gap: 8
                  }}>
                    <span>▶</span>
                    Screening <strong>{selectedForm}</strong> via <strong>{selectedRoa}</strong> route
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                  disabled={!selectedRoa || !selectedForm || isLoading}
                  style={{ width: "100%" }}
                >
                  {isLoading
                    ? <><div className="spinner" />Scanning molecule library…</>
                    : <>Screen Molecules →</>
                  }
                </button>
              </form>

              <div className="divider" />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                {[
                  { icon: "⚗️", label: "505(b)(2)", desc: "Reformulation pathway" },
                  { icon: "📋", label: "Para IV", desc: "Litigation tracker" },
                  { icon: "🧬", label: "AI Strategy", desc: "Bridging studies" },
                ].map((f) => (
                  <div key={f.label} style={{
                    padding: "12px", background: "var(--bg-surface)",
                    border: "1px solid var(--slate-line)", borderRadius: "var(--radius-sm)",
                    textAlign: "center"
                  }}>
                    <div style={{ fontSize: 20, marginBottom: 4 }}>{f.icon}</div>
                    <div style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 11.5, color: "var(--text-primary)", marginBottom: 2 }}>{f.label}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{f.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
