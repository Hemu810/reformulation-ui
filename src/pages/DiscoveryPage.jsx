import React, { useEffect, useState } from "react";

export default function DiscoveryPage({ onFilter, isLoading }) {
  const [roas, setRoas] = useState([]);
  const [dosageForms, setDosageForms] = useState([]);
  const [selectedRoa, setSelectedRoa] = useState("");
  const [selectedForm, setSelectedForm] = useState("");

  useEffect(() => {
    fetch("/api/options")
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

  const canSubmit = selectedRoa && selectedForm && !isLoading;

  return (
    <div className="container">
      <div className="discovery-hero">
        <div className="discovery-hero-bg" />

        <div className="page-header fade-up fade-up-1">
          <div className="page-eyebrow">Step 01 — Opportunity Discovery</div>
          <h1 className="page-title">
            Find your next<br />
            <span className="highlight">reformulation play</span>
          </h1>
          <p className="page-desc">
            Screen 10,000+ molecules across 505(b)(2) and first-to-file ANDA pathways.
            Filter by route of administration and target dosage form to surface high-score candidates.
          </p>
        </div>

        <div className="discovery-filter-panel fade-up fade-up-2">
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, color: "var(--text-primary)", marginBottom: 4 }}>
              Configure your search
            </div>
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
              Select target delivery parameters to filter the molecule library
            </div>
          </div>

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
                  {roas.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label className="form-label">Dosage Form</label>
                <select
                  className="form-select"
                  value={selectedForm}
                  onChange={(e) => setSelectedForm(e.target.value)}
                >
                  <option value="">Select dosage form</option>
                  {dosageForms.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
            </div>

            {selectedRoa && selectedForm && (
              <div style={{ marginBottom: 20, padding: "10px 14px", background: "var(--accent-glow)", border: "1px solid var(--border-medium)", borderRadius: "var(--radius-md)", display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                  Searching for <strong style={{ color: "var(--accent-secondary)" }}>{selectedForm}</strong> formulations via <strong style={{ color: "var(--accent-secondary)" }}>{selectedRoa}</strong> route
                </div>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={!canSubmit}
              style={{ width: "100%" }}
            >
              {isLoading ? (
                <>
                  <div className="spinner" />
                  Scanning molecule library…
                </>
              ) : (
                <>
                  <span>→</span>
                  Screen molecules
                </>
              )}
            </button>
          </form>
        </div>

        {/* Feature callouts */}
        <div className="grid-3 fade-up fade-up-3" style={{ marginTop: 40, maxWidth: 680 }}>
          {[
            { icon: "⚗️", label: "505(b)(2) Ready", desc: "Pre-filtered for reformulation pathway eligibility" },
            { icon: "📋", label: "ANDA Tracker", desc: "Live paragraph IV litigation & FTF filer status" },
            { icon: "🧠", label: "AI Strategy", desc: "Bridging study recommendations backed by evidence" },
          ].map((f) => (
            <div key={f.label} style={{ padding: "16px", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)" }}>
              <div style={{ fontSize: 22, marginBottom: 8 }}>{f.icon}</div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 4 }}>{f.label}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
