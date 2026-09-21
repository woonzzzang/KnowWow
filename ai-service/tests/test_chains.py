from langchain_core.language_models.fake_chat_models import FakeListChatModel

from app.config import Settings
from app.knowledge_service import KnowledgeService, compact_json, micro_question_context
from app.models import MicroQuestionRequest


def make_request() -> MicroQuestionRequest:
    return MicroQuestionRequest.model_validate(
        {
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
                    "construction_stage": "INSTALLATION",
                },
                "action": "DRAWING_REVISION",
                "outcome": "ACCEPTED",
                "created_at": "2026-08-08",
            },
            "matched_pattern": {
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
            },
        }
    )


def test_micro_question_prompt_context_contains_only_plain_korean_terms():
    current_case, matched_pattern = micro_question_context(make_request())
    prompt_context = compact_json({"current_case": current_case, "matched_pattern": matched_pattern})

    assert "설치 누락" in prompt_context
    assert "도면 개정" in prompt_context
    assert "생산 부서로 넘겨 처리" in prompt_context
    assert "DRAWING_REVISION" not in prompt_context
    assert "INSTALLATION_MISSING" not in prompt_context
    assert "TRANSFER_TO_PRODUCTION" not in prompt_context


def test_micro_question_uses_lcel_chain_and_hides_internal_terms():
    service = KnowledgeService(Settings(openai_api_key="test-key"))
    service._model = FakeListChatModel(
        responses=[
            "현재 Case의 DRAWING_REVISION은 INSTALLATION_MISSING 사례에서 "
            "TRANSFER_TO_PRODUCTION을 했던 때와 어떤 Context가 달랐나요?"
        ]
    )
    question = service.make_micro_question(make_request())

    assert "도면 개정" in question
    assert "설치 누락" in question
    assert "생산 부서로 넘겨 처리" in question
    assert "상황" in question
    assert "DRAWING_REVISION" not in question
    assert "INSTALLATION_MISSING" not in question
    assert "TRANSFER_TO_PRODUCTION" not in question
    assert "Case" not in question
    assert "Context" not in question
