from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})
# ----------------------------
# Hardcoded test dataset
# ----------------------------

ROA_OPTIONS = [
    "Oral",
    "Injection",
    "Topical",
    "Inhalation"
]

DOSAGE_FORM_OPTIONS = [
    "Tablet",
    "Capsule",
    "Solution",
    "Cream",
    "Injection"
]


CANDIDATES = [
    {
        "candidate_id": "C001",
        "research_code": "RX-101",
        "generic_name": "Metformin",
        "brand_name": "Glucophage",
        "opportunity_flags": {
            "505b2_reformulation_candidate": True,
            "anda_first_to_file_candidate": False,
            "rare_disease_focus": False
        },
        "opportunity_score": 82,
        "route_of_administration": "Oral",
        "dosage_form": "Tablet"
    },
    {
        "candidate_id": "C002",
        "research_code": "RX-202",
        "generic_name": "Albuterol",
        "brand_name": "Ventolin",
        "opportunity_flags": {
            "505b2_reformulation_candidate": True,
            "anda_first_to_file_candidate": True,
            "rare_disease_focus": False
        },
        "opportunity_score": 91,
        "route_of_administration": "Inhalation",
        "dosage_form": "Solution"
    }
]


DRUG_DETAILS = {
    "C001": {
        "candidate_id": "C001",
        "brand_name": "Glucophage",
        "generic_name": "Metformin",
        "indication_original": "Type 2 Diabetes",
        "route_of_administration_original": "Oral",
        "route_of_administration_new": "Oral",
        "dosage_form_original": "Tablet",
        "dosage_form_new": "Extended Release Tablet",
        "regulatory_pathway": "505(b)(2)",
        "ip_and_commercials": {
            "nda_number": "NDA020357",
            "patent_numbers": ["US1234567", "US2345678"],
            "patent_expiry_dates": ["2028-05-12"],
            "exclusivity_codes": ["NCE"],
            "anda_filers": [
                {
                    "company_name": "Teva Pharmaceuticals",
                    "first_to_file_flag": True,
                    "litigation_status": "Paragraph IV litigation"
                }
            ]
        }
    },
    "C002": {
        "candidate_id": "C002",
        "brand_name": "Ventolin",
        "generic_name": "Albuterol",
        "indication_original": "Asthma",
        "route_of_administration_original": "Inhalation",
        "route_of_administration_new": "Inhalation",
        "dosage_form_original": "Solution",
        "dosage_form_new": "Dry Powder Inhaler",
        "regulatory_pathway": "ANDA",
        "ip_and_commercials": {
            "nda_number": "NDA018908",
            "patent_numbers": ["US9988776"],
            "patent_expiry_dates": ["2027-03-01"],
            "exclusivity_codes": [],
            "anda_filers": []
        }
    }
}


STRATEGIES = {
    "C001": {
        "strategy": {
            "summary": "Develop an extended-release metformin formulation via 505(b)(2) pathway to improve patient compliance.",
            "scientific": "Extended release reduces GI side effects and improves adherence.",
            "technology": "Use hydrophilic polymer matrix controlled release technology.",
            "commercial": "Large diabetes market with high patient base.",
            "patient": "Once-daily dosing improves compliance.",
            "regulatory": "505(b)(2) allows bridging to existing clinical data.",
            "bridging_studies": [
                "Relative bioavailability study",
                "Food effect study",
                "PK comparison vs reference listed drug"
            ]
        },
        "references": [
            {
                "category": "Clinical",
                "description": "Metformin XR improves GI tolerability",
                "source": "PubMed"
            },
            {
                "category": "Regulatory",
                "description": "FDA guidance on modified release formulations",
                "source": "FDA.gov"
            }
        ]
    }
}


# ----------------------------
# API ROUTES
# ----------------------------

@app.route("/api/options")
def options():
    return jsonify({
        "roaOptions": ROA_OPTIONS,
        "dosageFormOptions": DOSAGE_FORM_OPTIONS
    })


@app.route("/api/candidates")
def candidates():
    roa = request.args.get("roa")
    dosage = request.args.get("dosageForm")

    results = [
        c for c in CANDIDATES
        if (not roa or c["route_of_administration"] == roa)
        and (not dosage or c["dosage_form"] == dosage)
    ]

    return jsonify({"candidates": results})


@app.route("/api/drug/<candidate_id>")
def drug(candidate_id):
    data = DRUG_DETAILS.get(candidate_id)
    if not data:
        return jsonify({"error": "Drug not found"}), 404

    return jsonify(data)


@app.route("/api/strategy/<candidate_id>")
def strategy(candidate_id):
    data = STRATEGIES.get(candidate_id)
    if not data:
        return jsonify({
            "strategy": {"summary": "No strategy available"},
            "references": []
        })

    return jsonify(data)


# ----------------------------
# RUN SERVER
# ----------------------------

import os

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=False, host="0.0.0.0", port=port)


