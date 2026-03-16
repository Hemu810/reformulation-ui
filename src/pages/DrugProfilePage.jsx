import React from "react";

export default function DrugProfilePage({ drug, onGetStrategy, onBack, isLoading }) {
  if (!drug) return null;

  const ip = drug.ip_and_commercials || {};
  const pathway = drug.regulatory_pathway || "";
  const is505b2 = pathway.includes("505");

  return (
    <div className="container">
      <div className="back-row fade-up fade-up-1">
        <button className="btn btn-ghost btn-sm" onClick={onBack}>
          ← Back to Candidates
        </button>
        <div className="step-pill">Step 03</div>
      </div>

      <div className="page-header fade-up fade-up-1">
        <div className="page-eyebrow">Commercial & IP Snapshot</div>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 20, flexWrap: "wrap" }}>
          <div>
            <h1 className="page-title" style={{ fontSize: "clamp(24px, 3vw, 38px)" }}>
              {drug.brand_name}
              <span style={{ color: "var(--text-muted)", fontWeight: 400 }}> / </span>
              <span style={{ color: "var(--text-secondary)" }}>{drug.generic_name}</span>
            </h1>
            <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap", alignItems: "center" }}>
              <span className={`pathway-badge ${is505b2 ? "pathway-505b2" : "pathway-anda"}`}>
                {is505b2 ? "⚗️" : "📋"} {pathway}
              </span>
              <span className="badge badge-blue">{drug.indication_original}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="stat-grid fade-up fade-up-2" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-label">NDA Number</div>
          <div className="nda-code" style={{ fontSize: 16, fontFamily: "var(--font-mono)", color: "var(--accent-amber)" }}>
            {ip.nda_number || "—"}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Patents on File</div>
          <div className="stat-value">{ip.patent_numbers?.length || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">ANDA Filers</div>
          <div className="stat-value">{ip.anda_filers?.length || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Exclusivity Codes</div>
          <div className="stat-value">{ip.exclusivity_codes?.length || 0}</div>
        </div>
      </div>

      <div className="profile-grid fade-up fade-up-3">
        {/* Formulation Details */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Formulation Details</span>
            <span style={{ fontSize: 18 }}>⚗️</span>
          </div>
          <div className="card-body">
            <div className="info-list">
              <div className="info-row">
                <span className="info-key">Original ROA</span>
                <span className="info-val">{drug.route_of_administration_original}</span>
              </div>
              <div className="info-row">
                <span className="info-key">Target ROA</span>
                <span className="info-val" style={{ color: "var(--accent-secondary)" }}>
                  {drug.route_of_administration_new || drug.route_of_administration_original}
                </span>
              </div>
              <div className="info-row">
                <span className="info-key">Original Dosage Form</span>
                <span className="info-val">{drug.dosage_form_original}</span>
              </div>
              <div className="info-row">
                <span className="info-key">Target Dosage Form</span>
                <span className="info-val" style={{ color: "var(--accent-secondary)" }}>
                  {drug.dosage_form_new || drug.dosage_form_original}
                </span>
              </div>
              <div className="info-row">
                <span className="info-key">Indication</span>
                <span className="info-val">{drug.indication_original}</span>
              </div>
              <div className="info-row">
                <span className="info-key">Regulatory Pathway</span>
                <span className="info-val">
                  <span className={`badge ${is505b2 ? "badge-blue" : "badge-yes"}`}>{pathway}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* IP & Exclusivity */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">IP & Exclusivity</span>
            <span style={{ fontSize: 18 }}>🔒</span>
          </div>
          <div className="card-body">
            <div className="info-list">
              <div className="info-row">
                <span className="info-key">NDA</span>
                <span className="info-val">
                  <span className="nda-code">{ip.nda_number || "—"}</span>
                </span>
              </div>
              <div className="info-row">
                <span className="info-key">Patent Numbers</span>
                <div className="info-val" style={{ display: "flex", flexWrap: "wrap", gap: 4, justifyContent: "flex-end" }}>
                  {ip.patent_numbers?.length
                    ? ip.patent_numbers.map((p) => (
                        <span key={p} className="badge badge-violet">{p}</span>
                      ))
                    : <span style={{ color: "var(--text-muted)" }}>None</span>}
                </div>
              </div>
              <div className="info-row">
                <span className="info-key">Patent Expiry</span>
                <div className="info-val" style={{ display: "flex", flexWrap: "wrap", gap: 4, justifyContent: "flex-end" }}>
                  {ip.patent_expiry_dates?.length
                    ? ip.patent_expiry_dates.map((d) => (
                        <span key={d} className="badge badge-amber">{d}</span>
                      ))
                    : <span style={{ color: "var(--text-muted)" }}>—</span>}
                </div>
              </div>
              <div className="info-row">
                <span className="info-key">Exclusivity Codes</span>
                <div className="info-val" style={{ display: "flex", flexWrap: "wrap", gap: 4, justifyContent: "flex-end" }}>
                  {ip.exclusivity_codes?.length
                    ? ip.exclusivity_codes.map((e) => (
                        <span key={e} className="badge badge-blue">{e}</span>
                      ))
                    : <span style={{ color: "var(--text-muted)" }}>None</span>}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ANDA Filers / Litigation */}
        <div className="card profile-full">
          <div className="card-header">
            <span className="card-title">ANDA Filers & Litigation</span>
            <span style={{ fontSize: 18 }}>⚖️</span>
          </div>
          <div className="card-body">
            {ip.anda_filers?.length ? (
              <div className="data-table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Company</th>
                      <th>First-to-File</th>
                      <th>Litigation Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ip.anda_filers.map((a, idx) => (
                      <tr key={idx}>
                        <td className="td-primary">{a.company_name}</td>
                        <td>
                          <span className={`badge ${a.first_to_file_flag ? "badge-yes" : "badge-no"}`}>
                            {a.first_to_file_flag ? "FTF" : "Non-FTF"}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${a.litigation_status?.toLowerCase().includes("paragraph iv") ? "badge-rose" : "badge-no"}`}>
                            {a.litigation_status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state" style={{ padding: "32px 24px" }}>
                <div className="empty-icon">📭</div>
                <div className="empty-title">No ANDA filers recorded</div>
                <div className="empty-desc">This molecule currently has no ANDA submissions on record — potentially a clean runway.</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="fade-up fade-up-4" style={{ marginTop: 28, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <button
          className="btn btn-primary btn-lg"
          onClick={onGetStrategy}
          disabled={isLoading}
        >
          {isLoading ? (
            <><div className="spinner" /> Generating strategy…</>
          ) : (
            <>Generate Strategy & Recommendations →</>
          )}
        </button>
        <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
          AI-powered bridging study recommendations based on FDA guidance
        </p>
      </div>
    </div>
  );
}
