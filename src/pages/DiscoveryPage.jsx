import React, { useEffect, useState, useRef, useCallback } from "react";
import ReactDOM from "react-dom";
import StepBar from "../components/StepBar";

const BASE = process.env.REACT_APP_API_URL || "";

function TypeaheadInput({ value, onChange, onSelect, endpoint, placeholder, style }) {
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen]               = useState(false);
  const [dropPos, setDropPos]         = useState({ top: 0, left: 0, width: 0 });
  const inputRef = useRef(null);
  const abortRef = useRef(null);

  const fetchSuggestions = useCallback((q) => {
    if (!q || q.length < 3) { setSuggestions([]); setOpen(false); return; }

    // cancel any in-flight request immediately
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    // capture position now (synchronous, always fresh)
    if (inputRef.current) {
      const r = inputRef.current.getBoundingClientRect();
      setDropPos({ top: r.bottom + window.scrollY + 2, left: r.left + window.scrollX, width: r.width });
    }

    fetch(`${endpoint}?q=${encodeURIComponent(q)}`, { signal: abortRef.current.signal })
      .then(r => r.json())
      .then(d => { const list = d.suggestions || []; setSuggestions(list); setOpen(true); })
      .catch(() => {});
  }, [endpoint]);

  useEffect(() => {
    const close = () => setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const dropdown = open && ReactDOM.createPortal(
    <ul onMouseDown={e => e.preventDefault()} style={{
      position: "absolute", top: dropPos.top, left: dropPos.left, width: dropPos.width,
      zIndex: 99999, background: "#fff", border: "1px solid #d1d5db",
      borderRadius: 6, margin: 0, padding: 0,
      listStyle: "none", boxShadow: "0 6px 20px rgba(0,0,0,0.13)",
      maxHeight: 220, overflowY: "auto",
    }}>
      {suggestions.length > 0 ? suggestions.map((s, i) => (
        <li key={i}
          onMouseDown={() => { onSelect(s); setSuggestions([]); setOpen(false); }}
          style={{
            padding: "8px 12px", fontSize: 13, cursor: "pointer",
            color: "#111", borderBottom: i < suggestions.length - 1 ? "1px solid #f0f0f0" : "none",
            background: "#fff",
          }}
          onMouseEnter={e => e.currentTarget.style.background = "#f0f4ff"}
          onMouseLeave={e => e.currentTarget.style.background = "#fff"}
        >{s}</li>
      )) : (
        <li style={{
          padding: "8px 12px",
          fontSize: 13,
          color: "var(--text-faint)",
          fontFamily: "var(--font-mono)",
          cursor: "default",
        }}>
          No results found
        </li>
      )}
    </ul>,
    document.body
  );

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <input
        ref={inputRef}
        style={style}
        placeholder={placeholder}
        value={value}
        onChange={e => { onChange(e); fetchSuggestions(e.target.value); }}
        onFocus={() => { if (inputRef.current && suggestions.length > 0) {
          const r = inputRef.current.getBoundingClientRect();
          setDropPos({ top: r.bottom + window.scrollY + 2, left: r.left + window.scrollX, width: r.width });
          setOpen(true);
        }}}
        autoComplete="off"
      />
      {dropdown}
    </div>
  );
}

const fmt = (n) => (n != null ? Number(n).toLocaleString() : "—");

const OPP_TYPES = [
  {
    id: "reformulation",
    number: "1",
    label: "Reformulation",
    icon: "⚗️",
    desc: "505(b)(2) pathway — novel delivery, improved bioavailability, patient compliance",
    badge: "505(b)(2)",
    accentVar: "--green",
    bgVar: "--green-bg",
    borderVar: "--green-border",
  },
  {
    id: "repurpose",
    number: "2",
    label: "Repurpose",
    icon: "🔄",
    desc: "New indication for an approved molecule — accelerated development path",
    badge: "NDA / sNDA",
    accentVar: "--blue",
    bgVar: "--blue-bg",
    borderVar: "--blue-border",
  },
  {
    id: "first-to-file",
    number: "3",
    label: "First-To-File",
    icon: "📋",
    desc: "Para IV ANDA — 180-day generic exclusivity window",
    badge: "Para IV",
    accentVar: "--amber",
    bgVar: "--amber-bg",
    borderVar: "--amber-border",
  },
];

const EMPTY_FILTERS = {
  drugName: "",
  indication: "",
  roa: "",
  dosageForm: "",
  approvalDateFrom: "",
  approvalDateTo: "",
  litigationStatus: "",
  patentExpiryFrom: "",
  patentExpiryTo: "",
  sales: "",
  fyYear: "",
};



const LITIGATION_OPTIONS = ["Yes", "No"];

const fieldStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
};

const labelStyle = {
  fontFamily: "var(--font-sans)",
  fontSize: 11,
  fontWeight: 700,
  color: "var(--text-primary)",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const inputStyle = {
  height: 32,
  padding: "0 10px",
  border: "1px solid var(--slate-line)",
  borderRadius: "var(--radius-sm)",
  fontFamily: "var(--font-sans)",
  fontSize: 13,
  color: "var(--text-primary)",
  background: "var(--bg-white)",
  outline: "none",
  width: "100%",
};

const sectionHeadStyle = {
  fontFamily: "var(--font-mono)",
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: "1px",
  textTransform: "uppercase",
  color: "var(--text-faint)",
  padding: "10px 0 6px",
  borderBottom: "1px solid var(--slate-line)",
  marginBottom: 10,
};

export default function DiscoveryPage({ onFilter, isLoading, stepProps }) {
  const [selectedType, setSelectedType] = useState("reformulation");
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [fyYears, setFyYears] = useState([]);
  const [salesRange, setSalesRange] = useState({ minSale: 0, maxSale: 0 });
  const [patentRange, setPatentRange] = useState({ minExpiry: null, maxExpiry: null });

  useEffect(() => {
    fetch(`${BASE}/api/analytics`)
        .then(r => r.json())
        .then(d => setAnalyticsData(d))
        .catch(console.error);

    // ADD THESE:
    fetch(`${BASE}/api/autocomplete/fyear`)
        .then(r => r.json())
        .then(d => setFyYears(d.years || []))
        .catch(console.error);

    fetch(`${BASE}/api/autocomplete/sales`)
        .then(r => r.json())
        .then(d => setSalesRange(d))
        .catch(console.error);

    fetch(`${BASE}/api/autocomplete/patentexpiry`)
        .then(r => r.json())
        .then(d => setPatentRange(d))
        .catch(console.error);
}, []);

  const activeFilterKey = Object.keys(filters).find(k => filters[k] !== "");


const PAIR_GROUPS = {
  approvalDateFrom: "approvalDate",
  approvalDateTo:   "approvalDate",
  patentExpiryFrom: "patentExpiry",
  patentExpiryTo:   "patentExpiry",
  fyYear:           "sales",
  sales:          "sales",
};

const activeGroup = activeFilterKey
  ? (PAIR_GROUPS[activeFilterKey] || activeFilterKey)
  : null;

const isLocked = (key) => {
  if (!activeGroup) return false;
  const keyGroup = PAIR_GROUPS[key] || key;
  return keyGroup !== activeGroup;
};
const set = (key) => (e) => {
  const val = e.target.value;

  if (val === "") {
    // If clearing a paired field, only clear that field
    // If the other field in the pair is also empty, reset everything
    const newFilters = { ...filters, [key]: "" };
    const anyValue = Object.keys(newFilters).find(k => newFilters[k] !== "");
    setFilters(anyValue ? newFilters : EMPTY_FILTERS);
  } else {
    // Preserve all fields in the same group, clear everything else
    const keyGroup = PAIR_GROUPS[key] || key;
    const preserved = Object.keys(filters).reduce((acc, k) => {
      const kGroup = PAIR_GROUPS[k] || k;
      acc[k] = kGroup === keyGroup ? filters[k] : "";
      return acc;
    }, {});
    setFilters({ ...preserved, [key]: val });
  }
};

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedType || isLoading) return;
    onFilter({ opportunityType: selectedType, ...filters });
  };

  const activeType = OPP_TYPES.find((t) => t.id === selectedType);

  return (
    <>
      {/* Analytics data bar — flush under header, highlighted with borders */}
      <div style={{
        marginTop: -32,
        background: "var(--bg-white)",
        borderTop: "3px solid var(--green)",
        borderBottom: "1.5px solid var(--green-border)",
        boxShadow: "0 2px 8px rgba(0,122,94,0.08)",
      }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          maxWidth: 1280,
          margin: "0 auto",
          padding: "0 32px",
        }}>
          {[
            { label: "Molecules Tracked",  value: analyticsData?.moleculesTracked,  growth: analyticsData?.moleculesGrowth },
            { label: "505(b)(2) Eligible", value: analyticsData?.eligible505b2,      growth: analyticsData?.eligible505b2Growth },
            { label: "ANDA Opportunities", value: analyticsData?.ftfAnda,            growth: analyticsData?.ftfAndaGrowth },
            { label: "Rare Disease",       value: analyticsData?.rareDisease,        growth: analyticsData?.rareDiseaseGrowth },
          ].map((a, i, arr) => (
            <div key={a.label} style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              padding: "11px 0",
              borderRight: i < arr.length - 1 ? "2px solid var(--green-border)" : "none",
            }}>
              <span style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                fontWeight: 600,
                color: "var(--text-faint)",
                textTransform: "uppercase",
                letterSpacing: "0.8px",
                whiteSpace: "nowrap",
              }}>{a.label}</span>
              <span style={{
                fontFamily: "var(--font-mono)",
                fontSize: 15,
                fontWeight: 700,
                color: "var(--text-primary)",
              }}>{fmt(a.value)}</span>
              {a.growth != null && (
                <span style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  fontWeight: 600,
                  color: "var(--green)",
                  background: "var(--green-bg)",
                  border: "1px solid var(--green-border)",
                  borderRadius: 3,
                  padding: "2px 6px",
                  whiteSpace: "nowrap",
                }}>
                  ▲ +{fmt(a.growth)}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Page top bar */}
      <div className="page-top-bar" style={{ marginBottom: 0 }}>
        <div className="page-top-inner">
          <div>
            <h1 className="page-title">Molecule Screener</h1>
            <div className="page-subtitle">505(b)(2), Repurpose &amp; First-To-File ANDA opportunity screening · FDA 2026 Data · {analyticsData ? `${fmt(analyticsData.moleculesTracked)} molecules` : "10,000+ molecules"}</div>
          </div>
        </div>
      </div>

      {/* KPI row — data count first */}
      <div className="container" style={{ paddingTop: 16, paddingBottom: 0 }}>
        <div className="kpi-grid fade-up delay-1" style={{ marginBottom: 0 }}>
          <div className="kpi-card kpi-accent-green">
            <div className="kpi-label">Total Molecules</div>
            <div className="kpi-value">{fmt(analyticsData?.moleculesTracked)}</div>
            <div className="kpi-sub">Branded &amp; commercialized</div>
          </div>
          <div className="kpi-card kpi-accent-blue">
            <div className="kpi-label">505(b)(2) Candidates</div>
            <div className="kpi-value">{fmt(analyticsData?.eligible505b2)}</div>
            <div className="kpi-sub">Reformulation eligible</div>
          </div>
          <div className="kpi-card kpi-accent-amber">
            <div className="kpi-label">First-to-File ANDA</div>
            <div className="kpi-value">{fmt(analyticsData?.ftfAnda)}</div>
            <div className="kpi-sub">Active US patents eligible</div>
          </div>
          <div className="kpi-card kpi-accent-navy">
            <div className="kpi-label">Rare / Unmet Need</div>
            <div className="kpi-value">{fmt(analyticsData?.rareDisease)}</div>
            <div className="kpi-sub">Orphan &amp; unmet indications</div>
          </div>
        </div>
      </div>

      {/* Step tracker — below KPI */}
      <StepBar {...stepProps} />

      {/* Filter panel */}
      <div className="container" style={{ paddingTop: 20 }}>
        <div className="filter-panel fade-up delay-2" style={{ width: "100%" }}>
          <div className="filter-panel-header">
            <div className="filter-panel-title">Step 1 · Opportunity Discovery</div>
            <div className="filter-panel-sub">Select a type, then apply filters to screen molecules</div>
          </div>
          <div className="filter-panel-body">
            <form onSubmit={handleSubmit}>

              {/* Opportunity Type cards */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
                {OPP_TYPES.map((t) => {
                  const active = selectedType === t.id;
                  const dimmed = selectedType && !active;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedType(active ? "" : t.id)}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                        gap: 5,
                        padding: "12px 12px 10px",
                        background: active ? `var(${t.accentVar})` : "var(--bg-white)",
                        border: `1.5px solid ${active ? `var(${t.accentVar})` : "var(--slate-line)"}`,
                        boxShadow: active ? "0 4px 14px rgba(0,0,0,0.18)" : "none",
                        opacity: dimmed ? 0.45 : 1,
                        filter: dimmed ? "saturate(0.6)" : "none",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "all 150ms ease",
                        
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                        <span style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: 9,
                          fontWeight: 700,
                          color: active ? "#fff" : "var(--text-faint)",
                          letterSpacing: "0.8px",
                        }}>
                          {t.number}
                        </span>
                        <span style={{ fontSize: 14 }}>{t.icon}</span>
                      </div>
                      <div style={{
                        fontFamily: "var(--font-sans)",
                        fontWeight: 700,
                        fontSize: 12,
                        color: active ? "#fff" : "var(--text-primary)",
                        letterSpacing: "-0.2px",
                      }}>
                        {t.label}
                      </div>
                      <div style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 9,
                        fontWeight: 600,
                        padding: "2px 6px",
                        borderRadius: "var(--radius-xs)",
                        background: active ? "rgba(255,255,255,0.2)" : "var(--bg-panel)",
                        color: active ? "#fff" : "var(--text-faint)",
                      }}>
                        {t.badge}
                      </div>
                      <div style={{
                        fontSize: 10.5,
                        color: active ? "rgba(255,255,255,0.85)" : "var(--text-faint)",
                        lineHeight: 1.4,
                        marginTop: 2,
                      }}>
                        {t.desc}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Selection confirmation */}
              {activeType && (
                <div style={{
                  padding: "8px 12px",
                  background: `var(${activeType.bgVar})`,
                  border: `1px solid var(${activeType.borderVar})`,
                  borderRadius: "var(--radius-sm)",
                  marginBottom: 16,
                  fontSize: 12,
                  color: `var(${activeType.accentVar})`,
                  fontFamily: "var(--font-mono)",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}>
                  <span>▶</span>
                  Screening for <strong>{activeType.label}</strong> opportunities · {activeType.badge} pathway
                </div>
              )}

              {/* Filters */}
              <div style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--slate-line)",
                borderRadius: "var(--radius-md)",
                padding: "14px 16px",
                marginTop: 4,
              }}>
                <div style={sectionHeadStyle}>
                  Filters <span style={{ fontWeight: 400, letterSpacing: 0 }}>(all optional)</span>
                </div>

                {/* Row 1: Drug Name | Indication | Route of Administration */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
                  <div style={fieldStyle}>
                    <label style={labelStyle}>Drug Name</label>
                    <TypeaheadInput
                      style={{ ...inputStyle, opacity: isLocked("drugName") ? 0.35 : 1, pointerEvents: isLocked("drugName") ? "none" : "auto", transition: "opacity 120ms" }}
                      placeholder="Generic, brand or research code"
                      value={filters.drugName}
                      onChange={set("drugName")}
                      onSelect={(s) => { if (!isLocked("drugName")) setFilters({ ...EMPTY_FILTERS, drugName: s }); }}
                      endpoint={`${BASE}/api/autocomplete/drug`}
                    />
                  </div>
                  <div style={fieldStyle}>
                    <label style={labelStyle}>Indication</label>
                    <TypeaheadInput
                      style={{ ...inputStyle, opacity: isLocked("indication") ? 0.35 : 1, pointerEvents: isLocked("indication") ? "none" : "auto", transition: "opacity 120ms" }}
                      placeholder="e.g. Type 2 Diabetes"
                      value={filters.indication}
                      onChange={set("indication")}
                      onSelect={(s) => { if (!isLocked("indication")) setFilters({ ...EMPTY_FILTERS, indication: s }); }}
                      endpoint={`${BASE}/api/autocomplete/indication`}
                    />
                  </div>
                  <div style={fieldStyle}>
                    <label style={labelStyle}>Route of Administration</label>
                    <TypeaheadInput
                      style={{ ...inputStyle, opacity: isLocked("roa") ? 0.35 : 1, pointerEvents: isLocked("roa") ? "none" : "auto", transition: "opacity 120ms" }}
                      placeholder="e.g. Oral, Intravenous"
                      value={filters.roa}
                      onChange={set("roa")}
                      onSelect={(s) => { if (!isLocked("roa")) setFilters({ ...EMPTY_FILTERS, roa: s }); }}
                      endpoint={`${BASE}/api/autocomplete/roa`}
                    />
                  </div>
                </div>

                {/* Row 2: Dosage Form */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
                  <div style={fieldStyle}>
                    <label style={labelStyle}>Dosage Form</label>
                    <TypeaheadInput
                      style={{ ...inputStyle, opacity: isLocked("dosageForm") ? 0.35 : 1, pointerEvents: isLocked("dosageForm") ? "none" : "auto", transition: "opacity 120ms" }}
                      placeholder="e.g. Tablet, Capsule"
                      value={filters.dosageForm}
                      onChange={set("dosageForm")}
                      onSelect={(s) => { if (!isLocked("dosageForm")) setFilters({ ...EMPTY_FILTERS, dosageForm: s }); }}
                      endpoint={`${BASE}/api/autocomplete/dosageform`}
                    />
                  </div>
                  <div style={fieldStyle}>
                    <label style={labelStyle}>Litigation Status</label>
                    <select
                      style={{ ...inputStyle, opacity: isLocked("litigationStatus") ? 0.35 : 1, transition: "opacity 120ms" }}
                      disabled={isLocked("litigationStatus")}
                      value={filters.litigationStatus}
                      onChange={set("litigationStatus")}
                    >
                      <option value="">Yes &amp; No</option>
                      {LITIGATION_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                </div>

                {/* Row 3: Approval Date From | Approval Date To | Litigation Status */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                  <div style={fieldStyle}>
                    <label style={labelStyle}>Approval Date From</label>
                    <input
                      type="date"
                      style={{ ...inputStyle, opacity: isLocked("approvalDateFrom") ? 0.35 : 1, transition: "opacity 120ms" }}
                      disabled={isLocked("approvalDateFrom")}
                      value={filters.approvalDateFrom}
                      onChange={set("approvalDateFrom")}
                    />
                  </div>
                  <div style={fieldStyle}>
                    <label style={labelStyle}>Approval Date To</label>
                    <input
                      type="date"
                      style={{ ...inputStyle, opacity: isLocked("approvalDateTo") ? 0.35 : 1, transition: "opacity 120ms" }}
                      disabled={isLocked("approvalDateTo")}
                      value={filters.approvalDateTo}
                      onChange={set("approvalDateTo")}
                    />
                  
                  </div>
                </div>

                {/* Row 4: Patent Expiry From | Patent Expiry To */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                <div style={fieldStyle}>
                <label style={labelStyle}>Patent Expiry From</label>
                <input
                  type="date"
                  style={{ ...inputStyle, opacity: isLocked("patentExpiryFrom") ? 0.35 : 1, transition: "opacity 120ms" }}
                  disabled={isLocked("patentExpiryFrom")}
                  min={patentRange.minExpiry ? patentRange.minExpiry.split("T")[0] : ""}
                  max={patentRange.maxExpiry ? patentRange.maxExpiry.split("T")[0] : ""}
                  value={filters.patentExpiryFrom}
                  onChange={set("patentExpiryFrom")}
                />
                  </div>
                  <div style={fieldStyle}>
                  <label style={labelStyle}>Patent Expiry To</label>
                  <input
                    type="date"
                    style={{ ...inputStyle, opacity: isLocked("patentExpiryTo") ? 0.35 : 1, transition: "opacity 120ms" }}
                    disabled={isLocked("patentExpiryTo")}
                    min={patentRange.minExpiry ? patentRange.minExpiry.split("T")[0] : ""}
                    max={patentRange.maxExpiry ? patentRange.maxExpiry.split("T")[0] : ""}
                    value={filters.patentExpiryTo}
                    onChange={set("patentExpiryTo")}
                  />
                  </div>
                </div>

                {/* Row 5: FY Year | Sales */}
                <div style={{ display: "grid", gridTemplateColumns: "100px 1fr 1fr", gap: 10 }}>
                <div style={fieldStyle}>
                <label style={labelStyle}>FY Year</label>
                <select
                  style={{ ...inputStyle, opacity: isLocked("fyYear") ? 0.35 : 1, transition: "opacity 120ms" }}
                  disabled={isLocked("fyYear")}
                  value={filters.fyYear}
                  onChange={set("fyYear")}
                >
                  <option value="">All Years</option>
                  {fyYears.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div style={fieldStyle}>
              <label style={labelStyle}>Sales($, in Millions)</label>
              <input
                type="number"
                style={{ ...inputStyle, opacity: isLocked("sales") ? 0.35 : 1, transition: "opacity 120ms" }}
                disabled={isLocked("sales")}
                placeholder={salesRange.maxSale ? `Up to ${Number(salesRange.maxSale).toLocaleString()}` : "e.g. 100,000"}
                value={filters.sales}
                onChange={set("sales")}
              />
            </div>
                </div>
              </div>
              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={!selectedType || isLoading}
                style={{ width: "100%", marginTop: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
              >
                {isLoading
                  ? <><div className="spinner" />Scanning molecule library…</>
                  : <>Screen Molecules →</>}
              </button>

              {!selectedType && (
                <div style={{ textAlign: "center", fontSize: 11.5, color: "var(--text-faint)", marginTop: 8, fontFamily: "var(--font-mono)" }}>
                  Select an opportunity type above to enable screening
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
