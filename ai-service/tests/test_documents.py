from app.knowledge_service import case_document, knowledge_document, pattern_document
from app.models import CommentCase, OrganizationPattern


def test_case_document_preserves_evidence_metadata():
    item = CommentCase.model_validate(
        {
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
                "construction_stage": "INSTALLATION",
            },
            "action": "DRAWING_REVISION",
            "outcome": "ACCEPTED",
            "created_at": "2026-08-08",
        }
    )
    document = case_document(item)
    assert document.metadata["source_id"] == "CASE-008"
    assert document.metadata["doc_type"] == "CASE"
    assert "도면 개정" in document.page_content
    assert "DRAWING_REVISION" not in document.page_content


def test_pattern_document_explicitly_warns_that_pattern_is_not_rule():
    item = OrganizationPattern.model_validate(
        {
            "pattern_id": "PATTERN-001",
            "signature": {
                "issue_type": "INSTALLATION_MISSING",
                "equipment": "WASH_BASIN",
                "system": "HOT_FRESH_WATER",
                "material_status": "AVAILABLE",
                "drawing_status": "VALID",
            },
            "support_count": 8,
            "action_distribution": {"TRANSFER_TO_PRODUCTION": 6, "DRAWING_REVISION": 1},
            "majority_action": "TRANSFER_TO_PRODUCTION",
            "majority_ratio": 0.75,
            "supporting_case_ids": ["CASE-001", "CASE-008"],
            "stable": True,
        }
    )
    document = pattern_document(item)
    assert document.metadata["source_id"] == "PATTERN-001"
    assert "공식 업무 규칙이나 정답이 아니라" in document.page_content
    assert "TRANSFER_TO_PRODUCTION" not in document.page_content


def test_only_verified_personal_knowledge_becomes_a_document():
    unverified = {"knowledge_id": "PK-001", "verified_by_user": False}
    assert knowledge_document(unverified) is None

    verified = {
        "knowledge_id": "PK-001",
        "employee_id": "EMP-001",
        "source_case_ids": ["CASE-008"],
        "raw_answer_text": "설치 위치에 다른 장비가 있었습니다.",
        "verified_by_user": True,
        "structured_knowledge": {
            "new_context": {"name": "installation_feasibility", "value": "IMPOSSIBLE"},
            "action": "DRAWING_REVISION",
            "rationale": "현재 위치에 설치할 수 없음",
            "exception": None,
        },
    }
    document = knowledge_document(verified)
    assert document is not None
    assert document.metadata["source_id"] == "PK-001"
    assert "현장 설치 가능 여부=설치 불가능" in document.page_content
    assert "DRAWING_REVISION" not in document.page_content
