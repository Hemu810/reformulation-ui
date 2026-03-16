import React from "react";

export default function CandidatesPage({ candidates, selectedRoa, selectedForm, onSelectDrug, onBack, isLoading }) {
  return (
    <div className="container">
      <div className="back-row fade-up fade-up-1">
        <button className="btn btn-ghost btn-sm" onClick={onBack}>
          ← Back to Discovery
        </button>
        <div className="step-pill">Step 02</div>
      </div>

      <div className="page-header fade-up fade-up-1">
        <div className="page-eyebrow">Candidate Molecules</div>
        <h1 className="page-title" style={{ fontSize: "clamp(22px, 3vw, 34px)" }}>
          Molecule <span className="highlight">shortlist</span>
        </h1>
      </div>

      <div className="candidates-toolbar fade-up fade-up-2">
        <div className="candidates-meta">
          <span className="result-count">{candidates.length} result{candidates.length !== 1 ? "s" : ""}</span>
          {selectedRoa && (
            <span className="filter-tag">
              ROA: {selectedRoa}
            </span>
          )}
          {selectedForm && (
            <span className="filter-tag">
              Form: {selectedForm}
            </span>
          )}
        </div>

        <div style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
          Sorted by opportunity score ↓
        </div>
      </div>

      <div className="card fade-up fade-up-3">
        {candidates.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔬</div>
            <div className="empty-title">No candidates found</div>
            <div className="empty-desc">
              No molecules matched your filter criteria. Try a different ROA or dosage form combination.
            </div>
            <button className="btn btn-secondary btn-sm" onClick={onBack} style={{ marginTop: 8 }}>
              Adjust filters
            </button>
          </div>
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Research Code</th>
                  <th>Generic Name</th>
                  <th>Brand</th>
                  <th>505(b)(2)</th>
                  <th>First-to-File ANDA</th>
                  <th>Rare / Unmet</th>
                  <th>Score</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {candidates
                  .slice()
                  .sort((a, b) => (b.opportunity_score || 0) - (a.opportunity_score || 0))
                  .map((c) => (
                    <tr key={c.candidate_id}>
                      <td className="td-code">{c.research_code}</td>
                      <td className="td-primary">{c.generic_name}</td>
                      <td style={{ color: "var(--text-muted)" }}>{c.brand_name}</td>
                      <td>
                        <span className={`badge ${c.opportunity_flags?.["505b2_reformulation_candidate"] ? "badge-yes" : "badge-no"}`}>
                          {c.opportunity_flags?.["505b2_reformulation_candidate"] ? "Yes" : "No"}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${c.opportunity_flags?.["anda_first_to_file_candidate"] ? "badge-blue" : "badge-no"}`}>
                          {c.opportunity_flags?.["anda_first_to_file_candidate"] ? "Yes" : "No"}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${c.opportunity_flags?.rare_disease_focus ? "badge-amber" : "badge-no"}`}>
                          {c.opportunity_flags?.rare_disease_focus ? "Yes" : "No"}
                        </span>
                      </td>
                      <td>
                        {c.opportunity_score ? (
                          <div className="score-chip">
                            <div className="score-bar">
                              <div
                                className="score-fill"
                                style={{ width: `${c.opportunity_score}%` }}
                              />
                            </div>
                            <span className="score-num">{c.opportunity_score}</span>
                          </div>
                        ) : (
                          <span style={{ color: "var(--text-muted)", fontSize: 12 }}>—</span>
                        )}
                      </td>
                      <td>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => onSelectDrug(c.candidate_id)}
                          disabled={isLoading}
                        >
                          {isLoading ? <div className="spinner" style={{ width: 12, height: 12 }} /> : "View →"}
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {candidates.length > 0 && (
        <div className="fade-up fade-up-4" style={{ marginTop: 16, padding: "12px 16px", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", display: "flex", gap: 24, flexWrap: "wrap" }}>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            <span style={{ color: "var(--accent-emerald)", fontWeight: 600 }}>
              {candidates.filter(c => c.opportunity_flags?.["505b2_reformulation_candidate"]).length}
            </span> × 505(b)(2) candidates
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            <span style={{ color: "var(--accent-primary)", fontWeight: 600 }}>
              {candidates.filter(c => c.opportunity_flags?.["anda_first_to_file_candidate"]).length}
            </span> × First-to-file ANDA
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            <span style={{ color: "var(--accent-amber)", fontWeight: 600 }}>
              {candidates.filter(c => c.opportunity_flags?.rare_disease_focus).length}
            </span> × Rare/unmet need
          </div>
        </div>
      )}
    </div>
  );
}
