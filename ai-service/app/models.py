from __future__ import annotations

from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class FlexibleModel(BaseModel):
    model_config = ConfigDict(extra="allow")


class CaseContext(FlexibleModel):
    material_status: str
    drawing_status: str
    construction_stage: str


class CommentCase(FlexibleModel):
    case_id: str
    project_id: str
    vessel_type: str
    employee_id: str
    comment_text: str
    response_text: str
    issue_type: str
    equipment: str
    system: str
    context: CaseContext
    action: str
    outcome: str
    created_at: str


class PatternSignature(FlexibleModel):
    issue_type: str
    equipment: str
    system: str
    material_status: str
    drawing_status: str


class OrganizationPattern(FlexibleModel):
    pattern_id: str
    signature: PatternSignature
    support_count: int
    action_distribution: dict[str, int]
    majority_action: str
    majority_ratio: float
    supporting_case_ids: list[str]
    employee_ids: list[str] = Field(default_factory=list)
    stable: bool = True


class NewContext(BaseModel):
    name: str | None = Field(
        default=None,
        description="사용자 답변에서 직접 확인된 새로운 판단 조건의 snake_case 이름",
    )
    value: str | None = Field(
        default=None,
        description="사용자 답변에서 직접 확인된 조건 값. 모르면 null",
    )


class PersonalKnowledgeExtraction(BaseModel):
    new_context: NewContext | None = Field(
        default=None,
        description="기존 Case 스키마에 없던 판단 조건. 명확하지 않으면 null",
    )
    rationale: str | None = Field(
        default=None,
        description="사용자가 직접 밝힌 처리 이유만 간결하게 정리. 추측 금지",
    )
    exception: str | None = Field(
        default=None,
        description="사용자가 직접 언급한 예외 조건. 없으면 null",
    )


class MicroQuestionRequest(BaseModel):
    current_case: CommentCase
    matched_pattern: OrganizationPattern


class ExtractKnowledgeRequest(MicroQuestionRequest):
    question: str
    answer: str


class IndexPayload(BaseModel):
    cases: list[CommentCase]
    patterns: list[OrganizationPattern]
    knowledge: list[dict[str, Any]]


class AgentChatRequest(IndexPayload):
    query: str
    employee_id: str | None = None

