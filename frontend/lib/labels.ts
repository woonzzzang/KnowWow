export const ISSUE_LABELS: Record<string, string> = {
  INSTALLATION_MISSING: "설치 누락",
  DRAWING_ERROR: "도면 오류",
  MATERIAL_ISSUE: "자재 문제",
  SPEC_CONFLICT: "사양 충돌",
  OTHER: "기타",
};

export const ACTION_LABELS: Record<string, string> = {
  TRANSFER_TO_PRODUCTION: "생산 이관",
  SITE_CHECK_THEN_TRANSFER: "현장 확인 후 이관",
  DRAWING_REVISION: "도면 개정",
  MATERIAL_REQUEST: "자재 요청",
  REQUEST_CLARIFICATION: "확인 요청",
  OTHER: "기타",
};

export const CHAT_ACTION_LABELS: Record<string, string> = {
  TRANSFER_TO_PRODUCTION: "생산 부서로 넘겨 처리",
  SITE_CHECK_THEN_TRANSFER: "현장을 확인한 뒤 생산 부서로 넘겨 처리",
  DRAWING_REVISION: "도면 개정",
  MATERIAL_REQUEST: "필요한 자재를 요청",
  REQUEST_CLARIFICATION: "관련 내용을 추가로 확인",
  OTHER: "다른 방식으로 처리",
};

export const OUTCOME_LABELS: Record<string, string> = {
  ACCEPTED: "승인",
  REJECTED: "반려",
  PENDING: "대기",
};

export const MATERIAL_STATUS_LABELS: Record<string, string> = {
  AVAILABLE: "자재 준비됨",
  UNAVAILABLE: "자재 미확보",
};

export const DRAWING_STATUS_LABELS: Record<string, string> = {
  VALID: "도면상 문제 없음",
  INVALID: "도면 오류",
  OUTDATED: "도면 갱신 필요",
};

export const KNOWLEDGE_CONTEXT_LABELS: Record<string, string> = {
  installation_feasibility: "현장 설치 가능 여부",
  installation_location_issue: "설치 위치의 장비 간섭",
  substitute_material_availability: "대체 자재 확보 여부",
  alternative_material_available: "대체 자재 확보 여부",
  owner_approved_change: "선주 변경 승인 여부",
};

export const KNOWLEDGE_VALUE_LABELS: Record<string, string> = {
  IMPOSSIBLE: "설치 불가능",
  EQUIPMENT_CONFLICT: "다른 장비와 간섭",
  AVAILABLE: "준비되어 있음",
  YES: "확보됨",
  CONFIRMED: "확인됨",
};

export function labelOf(dictionary: Record<string, string>, value: string) {
  return dictionary[value] ?? value;
}

export function friendlyKnowledgeLabel(
  dictionary: Record<string, string>,
  value: string | null | undefined,
  fallback: string,
) {
  return value ? dictionary[value] ?? fallback : "확인되지 않음";
}
