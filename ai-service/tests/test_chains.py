from langchain_core.language_models.fake_chat_models import FakeListChatModel

from app.config import Settings
from app.knowledge_service import KnowledgeService
from app.models import MicroQuestionRequest


def test_micro_question_uses_lcel_chain_and_returns_only_the_question():
    service = KnowledgeService(Settings(openai_api_key="test-key"))
    service._model = FakeListChatModel(
        responses=["기존 사례와 달리 도면 개정을 선택하게 된 핵심 조건은 무엇인가요?"]
    )
    request = MicroQuestionRequest.model_validate(
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
    question = service.make_micro_question(request)
    assert question == "기존 사례와 달리 도면 개정을 선택하게 된 핵심 조건은 무엇인가요?"

