from __future__ import annotations

import re
from typing import Any


ISSUE_LABELS = {
    "INSTALLATION_MISSING": "설치 누락",
    "DRAWING_ERROR": "도면 오류",
    "MATERIAL_ISSUE": "필요한 자재가 준비되지 않은 문제",
    "SPEC_CONFLICT": "사양이 서로 맞지 않는 문제",
    "OTHER": "기타 문제",
}

ACTION_LABELS = {
    "TRANSFER_TO_PRODUCTION": "생산 부서로 넘겨 처리",
    "SITE_CHECK_THEN_TRANSFER": "현장을 확인한 뒤 생산 부서로 넘겨 처리",
    "DRAWING_REVISION": "도면 개정",
    "MATERIAL_REQUEST": "필요한 자재 요청",
    "REQUEST_CLARIFICATION": "관련 내용 추가 확인",
    "OTHER": "기타 방식으로 처리",
}

MATERIAL_STATUS_LABELS = {
    "AVAILABLE": "필요한 자재가 준비되어 있음",
    "UNAVAILABLE": "필요한 자재가 준비되지 않음",
}

DRAWING_STATUS_LABELS = {
    "VALID": "현재 도면에 문제가 없음",
    "INVALID": "도면에 오류가 있음",
    "OUTDATED": "도면이 최신 상태가 아님",
}

CONSTRUCTION_STAGE_LABELS = {
    "DESIGN": "설계 단계",
    "INSTALLATION": "설치 단계",
    "PROCUREMENT": "자재 조달 단계",
}

OUTCOME_LABELS = {
    "ACCEPTED": "승인됨",
    "REJECTED": "반려됨",
    "PENDING": "검토 중",
}

KNOWLEDGE_TERM_LABELS = {
    "installation_feasibility": "현장 설치 가능 여부",
    "substitute_material_availability": "대체 자재 확보 여부",
    "owner_approved_change": "선주 변경 승인 여부",
    "IMPOSSIBLE": "설치 불가능",
    "CONFIRMED": "확인됨",
}

CONTROLLED_TERM_LABELS = {
    **ISSUE_LABELS,
    **ACTION_LABELS,
    **MATERIAL_STATUS_LABELS,
    **DRAWING_STATUS_LABELS,
    **CONSTRUCTION_STAGE_LABELS,
    **OUTCOME_LABELS,
    **KNOWLEDGE_TERM_LABELS,
}

SYSTEM_TERM_LABELS = {
    "Majority Action": "가장 많이 선택된 처리 방식",
    "Visible Context": "화면에서 확인되는 상황",
    "Organization Pattern": "조직의 과거 처리 경향",
    "Personal Knowledge": "담당자가 확인한 경험 지식",
    "Case": "업무 사례",
    "Action": "처리 방식",
    "Context": "상황",
    "Pattern": "과거 처리 경향",
    "Outcome": "처리 결과",
    "Rule": "업무 규칙",
    "issue_type": "문제 유형",
    "material_status": "자재 상태",
    "drawing_status": "도면 상태",
    "construction_stage": "진행 단계",
    "outcome": "처리 결과",
    "action": "처리 방식",
}


def label_of(labels: dict[str, str], value: Any, fallback: str) -> str:
    """Return a chat-safe label without leaking an unknown controlled code."""

    return labels.get(str(value), fallback)


def humanize_chat_text(text: str) -> str:
    """Replace internal codes and modeling terms in user-facing AI chat text."""

    result = text
    for source, replacement in sorted(
        CONTROLLED_TERM_LABELS.items(), key=lambda item: len(item[0]), reverse=True
    ):
        result = result.replace(source, replacement)

    for source, replacement in sorted(
        SYSTEM_TERM_LABELS.items(), key=lambda item: len(item[0]), reverse=True
    ):
        result = re.sub(
            rf"(?<![A-Za-z0-9_]){re.escape(source)}(?![A-Za-z0-9_])",
            replacement,
            result,
        )

    return result
