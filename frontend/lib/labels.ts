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

export const OUTCOME_LABELS: Record<string, string> = {
  ACCEPTED: "승인",
  REJECTED: "반려",
  PENDING: "대기",
};

export function labelOf(dictionary: Record<string, string>, value: string) {
  return dictionary[value] ?? value;
}

