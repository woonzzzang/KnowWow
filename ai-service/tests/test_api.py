from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health_works_without_an_api_key():
    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert "configured" in body


def test_ai_endpoint_explains_missing_api_key():
    payload = {
        "current_case": {
            "case_id": "CASE-008",
            "project_id": "SHIP-C01",
            "vessel_type": "TANKER",
            "employee_id": "EMP-001",
            "comment_text": "Pipe missing",
            "response_text": "Drawing revised",
            "issue_type": "INSTALLATION_MISSING",
            "equipment": "WASH_BASIN",
            "system": "HOT_FRESH_WATER",
            "context": {
                "material_status": "AVAILABLE",
                "drawing_status": "VALID",
                "construction_stage": "INSTALLATION"
            },
            "action": "DRAWING_REVISION",
            "outcome": "ACCEPTED",
            "created_at": "2026-08-08"
        },
        "matched_pattern": {
            "pattern_id": "PATTERN-001",
            "signature": {
                "issue_type": "INSTALLATION_MISSING",
                "equipment": "WASH_BASIN",
                "system": "HOT_FRESH_WATER",
                "material_status": "AVAILABLE",
                "drawing_status": "VALID"
            },
            "support_count": 8,
            "action_distribution": {"TRANSFER_TO_PRODUCTION": 6, "DRAWING_REVISION": 1},
            "majority_action": "TRANSFER_TO_PRODUCTION",
            "majority_ratio": 0.75,
            "supporting_case_ids": ["CASE-001", "CASE-008"],
            "stable": True
        }
    }
    response = client.post("/ai/micro-question", json=payload)
    assert response.status_code == 503
    assert response.json()["code"] == "AI_NOT_CONFIGURED"

