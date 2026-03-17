import React from "react";
import StepBar from "../components/StepBar";

export default function CandidatesPage({ candidates, selectedRoa, selectedForm, onSelectDrug, onBack, isLoading, stepProps }) {
  const sorted = [...candidates].sort((a, b) => (b.opportunity_score || 0) - (a.opportunity_score || 0));
  const count505  = candidates.filter(c => c.opportunity_flags?.["505b2_reformulation_candidate"]).length;
  const countFTF  = candidates.filter(c => c.opportunity_flags?.["anda_first_to_file_candidate"]).length;
  const countRare = candidates.filter(c => c.opportunity_flags?.rare_disease_focus).length;
  const avgScore  = candidates.length
    ? Math.round(candidates.reduce((s, c) => s + (c.opportunity_score || 0), 0) / candidates.length) : 0;

  return (
    <>
      <div className="page-top-bar">
        <div className="page-top-inner">
          <div>
            <div className="page-breadcrumb">
              <span style={{ cursor: "pointer", color: "var(--green)" }} onClick={onBack}>Discovery</span>
              <span className="breadcrumb-sep">/</span>
              <span className="breadcrumb-active">Candidates</span>
            </div>
            <h1 className="page-title">Candidate Molecules</h1>
            <div className="page-subtitle">
              {selectedRoa && selectedForm
                ? <>{candidates.length} result{candidates.length !== 1 ? "s" : ""} · {selectedForm} · {selectedRoa}</>
                : "All screened candidates"}
            </div>
          </div>
          <div className="page-actions">
            <button className="btn btn-secondary btn-sm" onClick={onBack}>← Modify Filters</button>
            <span className="badge badge-navy">{candidates.length} molecules</span>
          </div>
        </div>
      </div>

      <StepBar {...stepProps} />

      <div className="container" style={{ paddingTop: 28 }}>
        <div className="kpi-grid fade-up delay-1">
          <div className="kpi-card kpi-accent-green">
            <div className="kpi-label">Total Results</div>
            <div className="kpi-value">{candidates.length}</div>
            <div className="kpi-sub">{selectedRoa} · {selectedForm}</div>
          </div>
          <div className="kpi-card kpi-accent-blue">
            <div className="kpi-label">505(b)(2) Eligible</div>
            <div className="kpi-value">{count505}</div>
            <div className="kpi-sub">Reformulation candidates</div>
          </div>
          <div className="kpi-card kpi-accent-amber">
            <div className="kpi-label">First-to-File ANDA</div>
            <div className="kpi-value">{countFTF}</div>
            <div className="kpi-sub">Para IV opportunity</div>
          </div>
          <div className="kpi-card kpi-accent-navy">
            <div className="kpi-label">Avg Opp. Score</div>
            <div className="kpi-value">{avgScore || "—"}</div>
            <div className="kpi-sub">{countRare} rare/unmet need</div>
          </div>
        </div>

        <div className="card fade-up delay-2">
          <div className="card-header">
            <span className="card-title">Molecule Shortlist</span>
            <div style={{ display: "flex", gap: 8 }}>
              <span className="badge badge-yes">{count505} × 505(b)(2)</span>
              <span className="badge badge-blue">{countFTF} × FTF ANDA</span>
            </div>
          </div>

          {candidates.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔬</div>
              <div className="empty-title">No candidates found</div>
              <div className="empty-desc">No molecules matched your filter criteria. Adjust the ROA or dosage form and try again.</div>
              <button className="btn btn-secondary btn-sm" onClick={onBack} style={{ marginTop: 12 }}>← Modify Filters</button>
            </div>
          ) : (
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Research Code</th>
                    <th>Generic Name</th>
                    <th>Brand</th>
                    <th>ROA</th>
                    <th>Form</th>
                    <th>505(b)(2)</th>
                    <th>FTF ANDA</th>
                    <th>Rare/Unmet</th>
                    <th>Opp. Score</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((c, idx) => (
                    <tr key={c.candidate_id}>
                      <td className="td-muted" style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>{String(idx + 1).padStart(2, "0")}</td>
                      <td className="td-code">{c.research_code}</td>
                      <td className="td-primary">{c.generic_name}</td>
                      <td className="td-muted">{c.brand_name}</td>
                      <td><span className="badge badge-no">{c.route_of_administration}</span></td>
                      <td><span className="badge badge-no">{c.dosage_form}</span></td>
                      <td><span className={`badge ${c.opportunity_flags?.["505b2_reformulation_candidate"] ? "badge-yes" : "badge-no"}`}>{c.opportunity_flags?.["505b2_reformulation_candidate"] ? "Yes" : "No"}</span></td>
                      <td><span className={`badge ${c.opportunity_flags?.["anda_first_to_file_candidate"] ? "badge-blue" : "badge-no"}`}>{c.opportunity_flags?.["anda_first_to_file_candidate"] ? "Yes" : "No"}</span></td>
                      <td><span className={`badge ${c.opportunity_flags?.rare_disease_focus ? "badge-amber" : "badge-no"}`}>{c.opportunity_flags?.rare_disease_focus ? "Yes" : "No"}</span></td>
                      <td>
                        {c.opportunity_score ? (
                          <div className="score-chip">
                            <div className="score-bar"><div className="score-fill" style={{ width: `${c.opportunity_score}%` }} /></div>
                            <span className="score-num">{c.opportunity_score}</span>
                          </div>
                        ) : <span className="td-muted">—</span>}
                      </td>
                      <td>
                        <button className="btn btn-navy btn-sm" onClick={() => onSelectDrug(c.candidate_id)} disabled={isLoading}>
                          {isLoading ? <div className="spinner" style={{ width: 10, height: 10 }} /> : "Profile →"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
