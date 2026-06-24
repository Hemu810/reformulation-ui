"""
Reformulation-UI  |  FastAPI Backend
--------------------------------------
Database : SQL Server — DOLOXE (Azure VM)
Driver   : pyodbc + ODBC Driver 18 for SQL Server
Mode     : READ-ONLY — no inserts, updates, or deletes

Endpoints
---------
GET  /api/options                  → ROA list + Dosage Form list (dropdowns)
GET  /api/analytics                → Dashboard KPI numbers
GET  /api/candidates               → Filtered candidate list
GET  /api/drug/{candidate_id}      → Full drug profile
GET  /api/strategy/{candidate_id}  → Strategy (AI - coming soon)

Run
---
    pip install fastapi uvicorn pyodbc python-dotenv
    uvicorn reformulation_api:app --reload --port 5000
"""

import os
import pyodbc
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional

# Ensure ODBC driver is found on macOS (Homebrew path)
os.environ.setdefault("ODBCINI", "/opt/homebrew/etc/odbc.ini")
os.environ.setdefault("ODBCSYSINI", "/opt/homebrew/etc")

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

# ──────────────────────────────────────────────────────────────
#  APP SETUP
# ──────────────────────────────────────────────────────────────

app = FastAPI(
    title="Reformulation-UI API",
    version="2.0.0",
    docs_url="/docs",
    description="Pharma molecule discovery — powered by DOLOXE database",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)


# ──────────────────────────────────────────────────────────────
#  DATABASE
# ──────────────────────────────────────────────────────────────

def _get_conn() -> pyodbc.Connection:
    server   = os.getenv("DB_SERVER")
    database = os.getenv("DB_DATABASE", "DOLOXE")
    username = os.getenv("DB_USERNAME")
    password = os.getenv("DB_PASSWORD")

    if not all([server, username, password]):
        raise RuntimeError("Missing DB_SERVER / DB_USERNAME / DB_PASSWORD in .env")

    conn_str = (
        "DRIVER={ODBC Driver 18 for SQL Server};"
        f"SERVER={server};"
        f"DATABASE={database};"
        f"UID={username};"
        f"PWD={password};"
        "Encrypt=no;"
        "Connection Timeout=30;"
    )
    return pyodbc.connect(conn_str)


def _rows(cursor: pyodbc.Cursor) -> list[dict]:
    cols = [c[0] for c in cursor.description]
    return [dict(zip(cols, row)) for row in cursor.fetchall()]


def _safe(v):
    """Convert DB types to JSON-safe Python types."""
    if v is None:
        return None
    if hasattr(v, "isoformat"):
        return v.isoformat()
    if hasattr(v, "__float__") and not isinstance(v, (int, float, bool)):
        return float(v)
    return v


def _coerce(row: dict) -> dict:
    return {k: _safe(v) for k, v in row.items()}


# ──────────────────────────────────────────────────────────────
#  HEALTH
# ──────────────────────────────────────────────────────────────

@app.get("/")
def health():
    return {"status": "running", "service": "Reformulation-UI API", "db": os.getenv("DB_DATABASE", "DOLOXE")}


# ──────────────────────────────────────────────────────────────
#  ENDPOINT 1  /api/options
#  ROA + Dosage Form dropdowns using existing DOLOXE lookup SPs
# ──────────────────────────────────────────────────────────────

@app.get("/api/options")
def get_options():
    try:
        conn   = _get_conn()
        cursor = conn.cursor()

        cursor.execute("EXEC [dbo].[sp_DDL_GetRouteOfAdmin]")
        roa_opts = sorted([r[1] for r in cursor.fetchall() if r[3]])

        cursor.execute("EXEC [dbo].[sp_DDL_GetDosageForm]")
        form_opts = sorted([r[1] for r in cursor.fetchall() if r[3]])

        cursor.execute("EXEC [dbo].[sp_DDL_GetDrugType]")
        molecule_opts = sorted([r[1] for r in cursor.fetchall() if r[2] is not False])

        cursor.execute("EXEC [dbo].[sp_DDL_GetDrugInnovation]")
        innovation_opts = [r[1] for r in cursor.fetchall()]

        cursor.close()
        conn.close()

        return {
            "roaOptions":        roa_opts,
            "dosageFormOptions": form_opts,
            "moleculeTypes":     molecule_opts,
            "innovationOptions": innovation_opts,
        }

    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ──────────────────────────────────────────────────────────────
#  AUTOCOMPLETE ENDPOINTS
# ──────────────────────────────────────────────────────────────

@app.get("/api/autocomplete/drug")
def autocomplete_drug(q: str = Query("", min_length=1)):
    try:
        conn = _get_conn()
        cursor = conn.cursor()
        cursor.execute("EXEC [dbo].[sp_GetDrugNameAutoComplete] @DrugName = ?", (q,))
        rows = cursor.fetchall()
        cursor.close(); conn.close()
        return {"suggestions": list(dict.fromkeys([r[1] for r in rows if r[1]]))[:10]}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.get("/api/autocomplete/indication")
def autocomplete_indication(q: str = Query("", min_length=1)):
    try:
        conn = _get_conn()
        cursor = conn.cursor()
        cursor.execute("EXEC [dbo].[sp_GetIndicationAutoComplete] @IndicationName = ?", (q,))
        rows = cursor.fetchall()
        cursor.close(); conn.close()
        return {"suggestions": list(dict.fromkeys([r[1] for r in rows if r[1]]))[:10]}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.get("/api/autocomplete/roa")
def autocomplete_roa(q: str = Query("", min_length=1)):
    try:
        conn = _get_conn()
        cursor = conn.cursor()
        cursor.execute("EXEC [dbo].[sp_GetRouteOfAdminAutoComplete] @RouteOfAdminName = ?", (q,))
        rows = cursor.fetchall()
        cursor.close(); conn.close()
        return {"suggestions": list(dict.fromkeys([r[1] for r in rows if r[1]]))[:10]}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.get("/api/autocomplete/dosageform")
def autocomplete_dosageform(q: str = Query("", min_length=1)):
    try:
        conn = _get_conn()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT TOP 10 DosageFormName
            FROM DosageForm
            WHERE DosageFormName LIKE '%' + ? + '%' AND IsActive = 1
            ORDER BY DosageFormName
        """, (q,))
        rows = cursor.fetchall()
        cursor.close(); conn.close()
        return {"suggestions": [r[0] for r in rows if r[0]]}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.get("/api/autocomplete/moleculetype")
def autocomplete_moleculetype(q: str = Query("", min_length=1)):
    try:
        conn = _get_conn()
        cursor = conn.cursor()
        cursor.execute("EXEC [dbo].[sp_GetMoleculeNatureAutoComplete] @MoleculeNatureName = ?", (q,))
        rows = cursor.fetchall()
        cursor.close(); conn.close()
        return {"suggestions": list(dict.fromkeys([r[1] for r in rows if r[1]]))[:10]}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ──────────────────────────────────────────────────────────────
#  ENDPOINT 2  /api/analytics
#  Dashboard KPI counts from DOLOXE Drug table
# ──────────────────────────────────────────────────────────────

@app.get("/api/analytics")
def get_analytics():
    try:
        conn   = _get_conn()
        cursor = conn.cursor()

        MS = "DATEADD(month, DATEDIFF(month, 0, GETDATE()), 0)"   # first day of current month

        cursor.execute(f"""
            SELECT
                -- ── primary metrics ──────────────────────────────────────────────
                (SELECT COUNT(DISTINCT Id)
                 FROM Drug WHERE StageofDevelopmentId = 18 AND DrugTypeId = 2)                      AS molecules_tracked,

                (SELECT COUNT(DISTINCT dd.DrugId)
                 FROM DrugDevelopment dd
                 JOIN Drug d ON d.Id = dd.DrugId
                 WHERE dd.DevelopmentApprovalPath LIKE '%505%'
                   AND d.StageOfDevelopmentId = 18)                                    AS eligible_505b2,

                -- Para IV ANDA proxy: active US patents for approved/commercialized drugs
                (SELECT COUNT(DISTINCT de.DrugId)
                 FROM DrugExpiry de
                 JOIN Drug d2 ON d2.Id = de.DrugId
                 WHERE de.CountryId = 231
                   AND de.PatentExpiry > GETDATE()
                   AND d2.StageOfDevelopmentId = 18)                                   AS ftf_anda,

                (SELECT COUNT(DISTINCT rd.DrugId)
                 FROM DrugReviewDesignation rd
                 JOIN ReviewDesignation rdesig ON rdesig.Id = rd.ReviewDesignationId
                 JOIN Drug d ON d.Id = rd.DrugId
                 WHERE rdesig.ReviewDesignationName LIKE '%Orphan%'
                   AND d.StageOfDevelopmentId = 18)                                    AS rare_disease,

                (SELECT CAST(AVG(CAST(NoveltyScore AS FLOAT)) AS DECIMAL(5,1))
                 FROM Drug WHERE StageOfDevelopmentId = 18 AND NoveltyScore IS NOT NULL) AS avg_opp_score,

                -- ── month-to-date growth badges ──────────────────────────────────
                -- molecules: same strict filter as primary metric
                (SELECT COUNT(DISTINCT Id)
                 FROM Drug
                 WHERE StageOfDevelopmentId = 18 AND DrugTypeId = 2
                   AND AddedDate >= {MS})                                              AS molecules_growth,

                (SELECT COUNT(DISTINCT dd.DrugId)
                 FROM DrugDevelopment dd
                 JOIN Drug d ON d.Id = dd.DrugId
                 WHERE dd.DevelopmentApprovalPath LIKE '%505%'
                   AND d.AddedDate >= {MS})                                            AS eligible_505b2_growth,

                (SELECT COUNT(DISTINCT de.DrugId)
                 FROM DrugExpiry de
                 JOIN Drug d2 ON d2.Id = de.DrugId
                 WHERE de.CountryId = 231
                   AND de.PatentExpiry > GETDATE()
                   AND d2.AddedDate >= {MS})                                           AS ftf_anda_growth,

                (SELECT COUNT(DISTINCT rd.DrugId)
                 FROM DrugReviewDesignation rd
                 JOIN ReviewDesignation rdesig ON rdesig.Id = rd.ReviewDesignationId
                 JOIN Drug d3 ON d3.Id = rd.DrugId
                 WHERE rdesig.ReviewDesignationName LIKE '%Orphan%'
                   AND d3.AddedDate >= {MS})                                           AS rare_disease_growth
        """)
        row = cursor.fetchone()
        cursor.close()
        conn.close()

        if not row:
            return {}

        return {
            "moleculesTracked":    row[0] or 0,
            "eligible505b2":       row[1] or 0,
            "ftfAnda":             row[2] or 0,
            "rareDisease":         row[3] or 0,
            "avgOppScore":         float(row[4]) if row[4] else 0,
            "moleculesGrowth":     row[5] or 0,
            "eligible505b2Growth": row[6] or 0,
            "ftfAndaGrowth":       row[7] or 0,
            "rareDiseaseGrowth":   row[8] or 0,
        }

    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))



# ──────────────────────────────────────────────────────────────
#  ENDPOINT 3  /api/candidates
#  Drug search using DOLOXE Drug + DrugDevelopment tables
#  All filters are optional. Returns up to 100 results.
# ──────────────────────────────────────────────────────────────

@app.get("/api/candidates")
def get_candidates(
    opportunityType:  Optional[str] = Query(None),
    genericName:      Optional[str] = Query(None),
    brandName:        Optional[str] = Query(None),
    researchCode:     Optional[str] = Query(None),
    drugName:         Optional[str] = Query(None),   # generic OR brand OR alias combined
    moleculeType:     Optional[str] = Query(None),
    indication:       Optional[str] = Query(None),
    innovation:       Optional[str] = Query(None),
    roa:              Optional[str] = Query(None),
    dosageForm:       Optional[str] = Query(None),
    approvalDate:     Optional[str] = Query(None),
    litigationStatus: Optional[str] = Query(None),
    patentExpiryFrom: Optional[str] = Query(None),
    patentExpiryTo:   Optional[str] = Query(None),
    diseaseArea:      Optional[str] = Query(None),
):
    try:
        conn   = _get_conn()
        cursor = conn.cursor()

        # Map opportunity type to approval path keyword for filtering
        opp_path_filter = {
            "reformulation":  "505",
            "repurpose":      "",         # no strict path filter for repurpose
            "first-to-file":  "ANDA",
        }.get((opportunityType or "").lower(), "")

        # drugName is a catch-all (generic, brand, alias)
        name_search = drugName or genericName or brandName or researchCode or ""

        cursor.execute("""
            SELECT TOP 100
                dd.Id                                                        AS candidate_id,
                d.Id                                                         AS drug_id,
                ISNULL(dd.GenericName, d.GenericName)                        AS generic_name,
                ISNULL(dd.BrandName,  d.BrandName)                          AS brand_name,
                ISNULL(dd.DevelopmentRouteOfAdmin,
                       roa.RouteOfAdminName)                                 AS route_of_administration,
                ISNULL(dd.DevelopmentDosageForm,
                       df.DosageFormName)                                    AS dosage_form,
                ISNULL(dd.DevelopmentApprovalPath, '')                       AS regulatory_pathway,
                ISNULL(dd.DevelopmentIndication, '')                         AS indication_text,
                dd.ApprovalDate                                              AS approval_date,
                inv.InnovationName                                           AS innovation,
                CASE
                    WHEN dd.DevelopmentApprovalPath LIKE '%505%'  THEN 1
                    ELSE 0
                END                                                          AS is_505b2,
                CASE
                    WHEN dd.DevelopmentApprovalPath LIKE '%ANDA%'
                      OR dd.DevelopmentApprovalPath LIKE '%Para%'           THEN 1
                    ELSE 0
                END                                                          AS is_anda,
                0                                                            AS is_rare_disease,
                CASE
                    WHEN inv.InnovationName = 'NME'
                     AND dd.ApprovalDate IS NOT NULL
                     AND dd.DevelopmentApprovalPath LIKE '%505%'             THEN 92
                    WHEN inv.InnovationName = 'NME'
                     AND dd.ApprovalDate IS NOT NULL                         THEN 80
                    WHEN dd.DevelopmentApprovalPath LIKE '%ANDA%'
                      OR dd.DevelopmentApprovalPath LIKE '%Para%'           THEN 75
                    WHEN dd.ApprovalDate IS NOT NULL                         THEN 65
                    ELSE 50
                END                                                          AS opportunity_score
            FROM DrugDevelopment dd
            JOIN Drug d ON d.Id = dd.DrugId
            LEFT JOIN RouteOfAdmin  roa ON roa.Id = dd.RouteOfAdminId
            LEFT JOIN DosageForm    df  ON df.Id  = dd.DosageFormId
            LEFT JOIN Innovation    inv ON inv.Id  = d.InnovationId
            WHERE
                d.StatusId = 2
                AND (? = '' OR dd.DevelopmentApprovalPath LIKE '%' + ? + '%')
                AND (? = '' OR d.GenericName  LIKE '%' + ? + '%'
                            OR d.BrandName    LIKE '%' + ? + '%'
                            OR d.AliasName    LIKE '%' + ? + '%'
                            OR dd.GenericName LIKE '%' + ? + '%'
                            OR dd.BrandName   LIKE '%' + ? + '%')
                AND (? = '' OR dd.DevelopmentIndication LIKE '%' + ? + '%')
                AND (? = '' OR dd.DevelopmentRouteOfAdmin LIKE '%' + ? + '%'
                            OR roa.RouteOfAdminName       LIKE '%' + ? + '%')
                AND (? = '' OR dd.DevelopmentDosageForm  LIKE '%' + ? + '%'
                            OR df.DosageFormName          LIKE '%' + ? + '%')
                AND (? = '' OR inv.InnovationName = ?)
                AND (? IS NULL OR dd.ApprovalDate >= ?)
                AND (? IS NULL OR EXISTS (
                        SELECT 1 FROM DrugExpiry de
                        WHERE de.DrugId = d.Id
                          AND de.PatentExpiry >= ?
                    ))
                AND (? IS NULL OR EXISTS (
                        SELECT 1 FROM DrugExpiry de
                        WHERE de.DrugId = d.Id
                          AND de.PatentExpiry <= ?
                    ))
            ORDER BY opportunity_score DESC, dd.ApprovalDate DESC
        """,
        (
            opp_path_filter, opp_path_filter,
            name_search, name_search, name_search, name_search, name_search, name_search,
            indication or "",   indication or "",
            roa or "",          roa or "",          roa or "",
            dosageForm or "",   dosageForm or "",   dosageForm or "",
            innovation or "",   innovation or "",
            approvalDate,       approvalDate,
            patentExpiryFrom,   patentExpiryFrom,
            patentExpiryTo,     patentExpiryTo,
        ))

        rows = _rows(cursor)
        cursor.close()
        conn.close()

        opp_label = {
            "reformulation":  "Reformulation",
            "repurpose":      "Repurpose",
            "first-to-file":  "First-To-File",
        }.get((opportunityType or "").lower(), "Reformulation")

        candidates = []
        seen = set()
        for r in rows:
            key = (r.get("generic_name"), r.get("route_of_administration"), r.get("dosage_form"))
            if key in seen:
                continue
            seen.add(key)

            reg_path = r.get("regulatory_pathway") or ""
            if not reg_path:
                if opp_label == "First-To-File":
                    reg_path = "ANDA Para IV"
                elif opp_label == "Reformulation":
                    reg_path = "505(b)(2)"
                else:
                    reg_path = "NDA / sNDA"

            candidates.append({
                "candidate_id":            r["candidate_id"],
                "research_code":           None,
                "generic_name":            r.get("generic_name") or "",
                "brand_name":              r.get("brand_name") or "",
                "route_of_administration": r.get("route_of_administration") or "",
                "dosage_form":             r.get("dosage_form") or "",
                "opportunity_type":        opp_label,
                "regulatory_pathway":      reg_path,
                "opportunity_score":       r.get("opportunity_score") or 50,
                "opportunity_flags": {
                    "505b2_reformulation_candidate": bool(r.get("is_505b2")),
                    "anda_first_to_file_candidate":  bool(r.get("is_anda")),
                    "rare_disease_focus":             bool(r.get("is_rare_disease")),
                },
            })

        return {"candidates": candidates}

    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ──────────────────────────────────────────────────────────────
#  ENDPOINT 4  /api/drug/{candidate_id}
#  Full drug profile from DrugDevelopment + Drug + DrugExpiry
# ──────────────────────────────────────────────────────────────

@app.get("/api/drug/{candidate_id}")
def get_drug_profile(candidate_id: int):
    try:
        conn   = _get_conn()
        cursor = conn.cursor()

        # ── Main profile ─────────────────────────────────────
        cursor.execute("""
            SELECT
                dd.Id                                            AS candidate_id,
                d.Id                                             AS drug_id,
                ISNULL(dd.GenericName, d.GenericName)            AS generic_name,
                ISNULL(dd.BrandName,  d.BrandName)              AS brand_name,
                d.Description                                    AS description,
                ISNULL(dd.DevelopmentIndication, '')             AS indication_original,
                c.CompanyName                                    AS sponsor_company,
                dd.ApprovalDate                                  AS approval_date,
                inv.InnovationName                               AS innovation_type,
                ISNULL(dd.DevelopmentApprovalPath, '')           AS regulatory_pathway,
                roa.RouteOfAdminName                             AS route_of_administration_original,
                df.DosageFormName                                AS dosage_form_original,
                ISNULL(dd.DevelopmentRouteOfAdmin, roa.RouteOfAdminName)  AS route_of_administration_new,
                ISNULL(dd.DevelopmentDosageForm,  df.DosageFormName)      AS dosage_form_new,
                ISNULL(dd.DevelopmentStage, '')                  AS stage_of_development,
                d.ATC                                            AS atc_code
            FROM DrugDevelopment dd
            JOIN Drug d           ON d.Id   = dd.DrugId
            LEFT JOIN Company   c   ON c.Id   = dd.CompanyId
            LEFT JOIN RouteOfAdmin roa ON roa.Id = dd.RouteOfAdminId
            LEFT JOIN DosageForm   df  ON df.Id  = dd.DosageFormId
            LEFT JOIN Innovation   inv ON inv.Id  = d.InnovationId
            WHERE dd.Id = ?
        """, (candidate_id,))

        profile_rows = _rows(cursor)
        if not profile_rows:
            raise HTTPException(status_code=404, detail="Candidate not found")
        profile = _coerce(profile_rows[0])
        drug_id = profile.get("drug_id")

        # ── Patents ──────────────────────────────────────────
        cursor.execute("""
            SELECT de.PatentNumber, de.PatentExpiry
            FROM DrugExpiry de
            WHERE de.DrugId = ?
            ORDER BY de.PatentExpiry
        """, (drug_id,))
        patent_rows = _rows(cursor)
        patent_numbers = [p["PatentNumber"] for p in patent_rows if p.get("PatentNumber")]
        patent_expiry  = [_safe(p["PatentExpiry"]) for p in patent_rows if p.get("PatentExpiry")]

        # ── NDA number from DrugDevelopment ─────────────────
        cursor.execute("""
            SELECT TOP 1 NDABLAMAASubmissionDate
            FROM DrugDevelopment
            WHERE DrugId = ? AND NDABLAMAASubmissionDate IS NOT NULL
            ORDER BY NDABLAMAASubmissionDate DESC
        """, (drug_id,))
        nda_row = cursor.fetchone()

        cursor.close()
        conn.close()

        return {
            "candidate_id":                    profile.get("candidate_id"),
            "research_code":                   None,
            "generic_name":                    profile.get("generic_name") or "",
            "brand_name":                      profile.get("brand_name") or "",
            "description":                     profile.get("description") or "",
            "indication_original":             profile.get("indication_original") or "",
            "sponsor_company":                 profile.get("sponsor_company") or "",
            "approval_date":                   profile.get("approval_date"),
            "innovation_type":                 profile.get("innovation_type") or "",
            "regulatory_pathway":              profile.get("regulatory_pathway") or "",
            "stage_of_development":            profile.get("stage_of_development") or "",
            "atc_code":                        profile.get("atc_code") or "",
            "route_of_administration_original": profile.get("route_of_administration_original") or "",
            "route_of_administration_new":      profile.get("route_of_administration_new") or "",
            "dosage_form_original":            profile.get("dosage_form_original") or "",
            "dosage_form_new":                 profile.get("dosage_form_new") or "",
            "ip_and_commercials": {
                "nda_submission_date": _safe(nda_row[0]) if nda_row else None,
                "patent_numbers":      patent_numbers,
                "patent_expiry_dates": patent_expiry,
                "exclusivity_codes":   [],
                "anda_filers":         [],
                "sales_history":       [],
            },
        }

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ──────────────────────────────────────────────────────────────
#  ENDPOINT 5  /api/strategy/{candidate_id}
#  Placeholder — AI intelligence coming next
# ──────────────────────────────────────────────────────────────

@app.get("/api/strategy/{candidate_id}")
def get_strategy(candidate_id: int):
    return {
        "strategy": {
            "summary":          "AI strategy generation coming soon.",
            "scientific":       None,
            "technology":       None,
            "commercial":       None,
            "patient":          None,
            "regulatory":       None,
            "bridging_studies": [],
            "generated_by":     "pending",
            "generated_at":     None,
        },
        "references": [],
    }


# ──────────────────────────────────────────────────────────────
#  ENTRY POINT
# ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("reformulation_api:app", host="0.0.0.0", port=5000, reload=True)
