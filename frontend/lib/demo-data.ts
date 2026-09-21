import type {
  CommentCase,
  DashboardSummary,
  Employee,
  GapResult,
  OrganizationPattern,
  PersonalKnowledge,
} from "./types";

export const DEMO_EMPLOYEES: Employee[] = [
  {employee_id: "EMP-001", name: "김설계", department: "Accommodation Design / Piping", experience_level: "SENIOR", experience_years: 8},
  {employee_id: "EMP-002", name: "박설계", department: "Accommodation Design / Piping", experience_level: "MID", experience_years: 4},
  {employee_id: "EMP-003", name: "이설계", department: "Accommodation Design / Piping", experience_level: "JUNIOR", experience_years: 1},
];

const baseContext = {material_status: "AVAILABLE", drawing_status: "VALID", construction_stage: "INSTALLATION"};

export const DEMO_CASES: CommentCase[] = [
  {case_id: "CASE-008", project_id: "SHIP-C01", vessel_type: "TANKER", employee_id: "EMP-001", comment_text: "Wash basin hot water pipe is missing although material and drawing are ready.", response_text: "Revised the drawing before installation.", issue_type: "INSTALLATION_MISSING", equipment: "WASH_BASIN", system: "HOT_FRESH_WATER", context: baseContext, action: "DRAWING_REVISION", outcome: "ACCEPTED", created_at: "2026-08-08"},
  {case_id: "CASE-007", project_id: "SHIP-B01", vessel_type: "CONTAINER", employee_id: "EMP-002", comment_text: "Hot water piping is missing near the wash basin foundation.", response_text: "Checked the work area before sending the installation request.", issue_type: "INSTALLATION_MISSING", equipment: "WASH_BASIN", system: "HOT_FRESH_WATER", context: baseContext, action: "SITE_CHECK_THEN_TRANSFER", outcome: "ACCEPTED", created_at: "2026-08-07"},
  {case_id: "CASE-006", project_id: "SHIP-A02", vessel_type: "LNGC", employee_id: "EMP-003", comment_text: "The specified hot water pipe is absent at the wash basin.", response_text: "Transferred the item to production based on the current drawing.", issue_type: "INSTALLATION_MISSING", equipment: "WASH_BASIN", system: "HOT_FRESH_WATER", context: baseContext, action: "TRANSFER_TO_PRODUCTION", outcome: "PENDING", created_at: "2026-08-06"},
  {case_id: "CASE-013", project_id: "SHIP-A01", vessel_type: "LNGC", employee_id: "EMP-003", comment_text: "Valve orientation differs between two approved documents.", response_text: "Requested clarification before changing the drawing.", issue_type: "DRAWING_ERROR", equipment: "VALVE", system: "FRESH_WATER", context: {material_status: "AVAILABLE", drawing_status: "INVALID", construction_stage: "DESIGN"}, action: "REQUEST_CLARIFICATION", outcome: "ACCEPTED", created_at: "2026-08-13"},
  {case_id: "CASE-018", project_id: "SHIP-A02", vessel_type: "LNGC", employee_id: "EMP-003", comment_text: "Original hot water pipe material is unavailable.", response_text: "Transferred the work package to production.", issue_type: "MATERIAL_ISSUE", equipment: "PIPE", system: "HOT_FRESH_WATER", context: {material_status: "UNAVAILABLE", drawing_status: "VALID", construction_stage: "PROCUREMENT"}, action: "TRANSFER_TO_PRODUCTION", outcome: "ACCEPTED", created_at: "2026-08-18"},
  {case_id: "CASE-024", project_id: "SHIP-C01", vessel_type: "TANKER", employee_id: "EMP-003", comment_text: "Shower grey water specification conflicts with an earlier approved owner decision.", response_text: "Applied the confirmed change to a drawing revision.", issue_type: "SPEC_CONFLICT", equipment: "SHOWER", system: "GREY_WATER", context: {material_status: "AVAILABLE", drawing_status: "OUTDATED", construction_stage: "DESIGN"}, action: "DRAWING_REVISION", outcome: "PENDING", created_at: "2026-08-24"},
];

export const DEMO_PATTERNS: OrganizationPattern[] = [
  {pattern_id: "PATTERN-001", signature: {issue_type: "INSTALLATION_MISSING", equipment: "WASH_BASIN", system: "HOT_FRESH_WATER", material_status: "AVAILABLE", drawing_status: "VALID"}, support_count: 8, action_distribution: {TRANSFER_TO_PRODUCTION: 6, SITE_CHECK_THEN_TRANSFER: 1, DRAWING_REVISION: 1}, majority_action: "TRANSFER_TO_PRODUCTION", majority_ratio: 0.75, supporting_case_ids: ["CASE-001", "CASE-002", "CASE-003", "CASE-004", "CASE-005", "CASE-006", "CASE-007", "CASE-008"], employee_ids: ["EMP-001", "EMP-002", "EMP-003"], stable: true},
  {pattern_id: "PATTERN-002", signature: {issue_type: "DRAWING_ERROR", equipment: "VALVE", system: "FRESH_WATER", material_status: "AVAILABLE", drawing_status: "INVALID"}, support_count: 5, action_distribution: {DRAWING_REVISION: 4, REQUEST_CLARIFICATION: 1}, majority_action: "DRAWING_REVISION", majority_ratio: 0.8, supporting_case_ids: ["CASE-009", "CASE-010", "CASE-011", "CASE-012", "CASE-013"], employee_ids: ["EMP-001", "EMP-002", "EMP-003"], stable: true},
  {pattern_id: "PATTERN-003", signature: {issue_type: "MATERIAL_ISSUE", equipment: "PIPE", system: "HOT_FRESH_WATER", material_status: "UNAVAILABLE", drawing_status: "VALID"}, support_count: 5, action_distribution: {MATERIAL_REQUEST: 4, TRANSFER_TO_PRODUCTION: 1}, majority_action: "MATERIAL_REQUEST", majority_ratio: 0.8, supporting_case_ids: ["CASE-014", "CASE-015", "CASE-016", "CASE-017", "CASE-018"], employee_ids: ["EMP-001", "EMP-002", "EMP-003"], stable: true},
  {pattern_id: "PATTERN-004", signature: {issue_type: "SPEC_CONFLICT", equipment: "SHOWER", system: "GREY_WATER", material_status: "AVAILABLE", drawing_status: "OUTDATED"}, support_count: 6, action_distribution: {REQUEST_CLARIFICATION: 5, DRAWING_REVISION: 1}, majority_action: "REQUEST_CLARIFICATION", majority_ratio: 5 / 6, supporting_case_ids: ["CASE-019", "CASE-020", "CASE-021", "CASE-022", "CASE-023", "CASE-024"], employee_ids: ["EMP-001", "EMP-002", "EMP-003"], stable: true},
];

export const DEMO_KNOWLEDGE: PersonalKnowledge[] = [
  {knowledge_id: "PK-001", employee_id: "EMP-001", source_case_ids: ["CASE-008"], question: "기존 사례와 달랐던 핵심 조건은 무엇인가요?", raw_answer_text: "실제 설치 위치에 다른 장비가 있어서 그대로 설치할 수 없었습니다.", structured_knowledge: {new_context: {name: "installation_feasibility", value: "IMPOSSIBLE"}, action: "DRAWING_REVISION", rationale: "실제 설치 위치에 다른 장비가 있어 현재 위치에 설치할 수 없었음", exception: null}, verified_by_user: true, created_at: "2026-09-21"},
  {knowledge_id: "PK-002", employee_id: "EMP-003", source_case_ids: ["CASE-018"], question: "자재 요청 대신 생산 이관을 선택한 핵심 조건은 무엇인가요?", raw_answer_text: "동일 사양 대체 자재가 현장에 확보되어 있었습니다.", structured_knowledge: {new_context: {name: "substitute_material_availability", value: "AVAILABLE"}, action: "TRANSFER_TO_PRODUCTION", rationale: "동일 사양의 대체 자재가 현장에 확보되어 있었음", exception: null}, verified_by_user: true, created_at: "2026-09-21"},
];

export const DEMO_DASHBOARD: DashboardSummary = {
  employee_id: "EMP-001",
  my_case_count: 8,
  my_knowledge_count: 1,
  stable_pattern_count: 4,
  pending_interview_count: 2,
  total_case_count: 24,
};

export function demoPatternFor(caseItem: CommentCase): OrganizationPattern {
  return DEMO_PATTERNS.find((item) => item.signature.issue_type === caseItem.issue_type) ?? DEMO_PATTERNS[0];
}

export function demoGapFor(caseItem: CommentCase): GapResult {
  const pattern = demoPatternFor(caseItem);
  const variant = caseItem.action !== pattern.majority_action;
  return {
    case_id: caseItem.case_id,
    status: variant ? "ACTION_VARIANT" : "NONE",
    requires_interview: variant,
    current_action: caseItem.action,
    majority_action: pattern.majority_action,
    pattern_id: pattern.pattern_id,
    reason: variant ? "안정적인 패턴과 다른 처리가 관찰되어 판단 조건 확인이 필요합니다." : "현재 처리는 관찰된 패턴 범위 안에 있습니다.",
  };
}

