import React from "react";
import StepBar from "../components/StepBar";

export default function DrugProfilePage({ drug, onGetStrategy, onBack, isLoading, stepProps }) {
  if (!drug) return null;
  const ip = drug.ip_and_commercials || {};
  const is505b2 = (drug.regulatory_pathway || "").includes("505");

  return (
    <>
      <div className="page-top-bar">
        <div className="page-top-inner">
          <div>
            <div className="page-breadcrumb">
              <span style={{ cursor: "pointer", color: "var(--green)" }} onClick={onBack}>Candidates</span>
              <span className="breadcrumb-sep">/</span>
              <span className="breadcrumb-active">{drug.brand_name}</span>
            </div>
            <h1 className="page-title">
              {drug.brand_name}
              <span style={{ fontWeight: 400, color: "var(--text-muted)", fontStyle: "italic" }}> / {drug.generic_name}</span>
            </h1>
            <div className="page-subtitle">{drug.indication_original} · {drug.route_of_administration_original}</div>
          </div>
          <div className="page-actions">
            <button className="btn btn-secondary btn-sm" onClick={onBack}>← Back</button>
            <span className={`pathway-badge ${is505b2 ? "pathway-505b2" : "pathway-anda"}`}>
              {is505b2 ? "⚗️" : "📋"} {drug.regulatory_pathway}
            </span>
            <button className="btn btn-primary" onClick={onGetStrategy} disabled={isLoading}>
              {isLoading ? <><div className="spinner" /> Generating…</> : "Generate Strategy →"}
            </button>
          </div>
        </div>
      </div>

      <StepBar {...stepProps} />

      <div className="container" style={{ paddingTop: 28 }}>
        <div className="kpi-grid fade-up delay-1">
          <div className="kpi-card kpi-accent-amber">
            <div className="kpi-label">NDA Number</div>
            <div style={{ marginTop: 4 }}><span className="nda-code">{ip.nda_number || "—"}</span></div>
            <div className="kpi-sub">Reference listed drug</div>
          </div>
          <div className="kpi-card kpi-accent-navy">
            <div className="kpi-label">Patents on File</div>
            <div className="kpi-value">{ip.patent_numbers?.length || 0}</div>
            <div className="kpi-sub">{ip.patent_expiry_dates?.[0] ? `Expires ${ip.patent_expiry_dates[0]}` : "No expiry data"}</div>
          </div>
          <div className="kpi-card kpi-accent-blue">
            <div className="kpi-label">ANDA Filers</div>
            <div className="kpi-value">{ip.anda_filers?.length || 0}</div>
            <div className="kpi-sub">{ip.anda_filers?.filter(a => a.first_to_file_flag).length || 0} first-to-file</div>
          </div>
          <div className="kpi-card kpi-accent-green">
            <div className="kpi-label">Exclusivity</div>
            <div className="kpi-value">{ip.exclusivity_codes?.length || 0}</div>
            <div className="kpi-sub">{ip.exclusivity_codes?.join(", ") || "None recorded"}</div>
          </div>
        </div>

        <div className="profile-layout fade-up delay-2">
          <div className="profile-sidebar">
            <div className="card">
              <div className="card-header"><span className="card-title">Formulation</span><span>⚗️</span></div>
              <div className="card-body-sm">
                <div className="info-list">
                  {[
                    ["Indication",     drug.indication_original],
                    ["Pathway",        drug.regulatory_pathway],
                    ["Original ROA",   drug.route_of_administration_original],
                    ["Target ROA",     drug.route_of_administration_new || "Unchanged"],
                    ["Original Form",  drug.dosage_form_original],
                    ["Target Form",    drug.dosage_form_new || "Unchanged"],
                  ].map(([k, v]) => (
                    <div className="info-row" key={k}>
                      <span className="info-key">{k}</span>
                      <span className="info-val">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header"><span className="card-title">IP &amp; Exclusivity</span><span>🔒</span></div>
              <div className="card-body-sm">
                <div className="info-list">
                  <div className="info-row">
                    <span className="info-key">NDA</span>
                    <span className="info-val"><span className="nda-code">{ip.nda_number || "—"}</span></span>
                  </div>
                  <div className="info-row">
                    <span className="info-key">Patents</span>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, justifyContent: "flex-end" }}>
                      {ip.patent_numbers?.length ? ip.patent_numbers.map(p => <span key={p} className="badge badge-violet">{p}</span>) : <span className="info-val">None</span>}
                    </div>
                  </div>
                  <div className="info-row">
                    <span className="info-key">Expiry</span>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, justifyContent: "flex-end" }}>
                      {ip.patent_expiry_dates?.length ? ip.patent_expiry_dates.map(d => <span key={d} className="badge badge-amber">{d}</span>) : <span className="info-val">—</span>}
                    </div>
                  </div>
                  <div className="info-row">
                    <span className="info-key">Excl. Codes</span>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, justifyContent: "flex-end" }}>
                      {ip.exclusivity_codes?.length ? ip.exclusivity_codes.map(e => <span key={e} className="badge badge-blue">{e}</span>) : <span className="info-val">None</span>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="profile-main">
            <div className="card">
              <div className="card-header">
                <span className="card-title">ANDA Filers &amp; Litigation</span>
                <span className="badge badge-red">{ip.anda_filers?.filter(a => a.litigation_status?.toLowerCase().includes("iv")).length || 0} Para IV</span>
              </div>
              {ip.anda_filers?.length ? (
                <div className="data-table-wrap">
                  <table className="data-table">
                    <thead><tr><th>Company</th><th>Status</th><th>Litigation</th></tr></thead>
                    <tbody>
                      {ip.anda_filers.map((a, i) => (
                        <tr key={i}>
                          <td className="td-primary">{a.company_name}</td>
                          <td><span className={`badge ${a.first_to_file_flag ? "badge-yes" : "badge-no"}`}>{a.first_to_file_flag ? "First-to-File" : "Non-FTF"}</span></td>
                          <td><span className={`badge ${a.litigation_status?.toLowerCase().includes("paragraph iv") ? "badge-red" : "badge-no"}`}>{a.litigation_status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state" style={{ padding: "32px" }}>
                  <div className="empty-icon">📭</div>
                  <div className="empty-title">No ANDA Filers</div>
                  <div className="empty-desc">No ANDA submissions on record — potentially a clean runway opportunity.</div>
                </div>
              )}
            </div>

            <div className="card">
              <div className="card-header"><span className="card-title">Market &amp; Commercial Context</span><span>📊</span></div>
              <div className="card-body">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                  {[
                    { label: "Market Horizon",   value: "2015–2032",            sub: "Historical + forecast" },
                    { label: "Sales Data",        value: "US$",                  sub: "USD annual revenue" },
                    { label: "Indication Class",  value: drug.indication_original, sub: "Primary therapeutic area" },
                  ].map((m) => (
                    <div key={m.label} style={{ padding: "14px", background: "var(--bg-surface)", border: "1px solid var(--slate-line)", borderRadius: "var(--radius-sm)" }}>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: 1, textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 6 }}>{m.label}</div>
                      <div style={{ fontFamily: "var(--font-serif)", fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 2 }}>{m.value}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{m.sub}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <button className="btn btn-primary btn-lg" onClick={onGetStrategy} disabled={isLoading}>
                {isLoading ? <><div className="spinner" /> Generating Strategy…</> : "Generate AI Strategy & Recommendations →"}
              </button>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>AI-powered bridging study plan · FDA-aligned</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
