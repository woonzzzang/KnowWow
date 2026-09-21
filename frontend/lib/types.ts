export type CaseContext = {
  material_status: string;
  drawing_status: string;
  construction_stage: string;
};

export type CommentCase = {
  case_id: string;
  project_id: string;
  vessel_type: string;
  employee_id: string;
  comment_text: string;
  response_text: string;
  issue_type: string;
  equipment: string;
  system: string;
  context: CaseContext;
  action: string;
  outcome: string;
  created_at: string;
};

export type PatternSignature = {
  issue_type: string;
  equipment: string;
  system: string;
  material_status: string;
  drawing_status: string;
};

export type OrganizationPattern = {
  pattern_id: string;
  signature: PatternSignature;
  support_count: number;
  action_distribution: Record<string, number>;
  majority_action: string;
  majority_ratio: number;
  supporting_case_ids: string[];
  employee_ids: string[];
  stable: boolean;
};

export type GapResult = {
  case_id: string;
  status: "NO_PATTERN" | "ACTION_VARIANT" | "NONE";
  requires_interview: boolean;
  current_action: string;
  majority_action: string | null;
  pattern_id: string | null;
  reason: string;
};

export type NewContext = {name: string | null; value: string | null};

export type StructuredKnowledge = {
  new_context: NewContext | null;
  action?: string;
  rationale: string | null;
  exception: string | null;
};

export type PersonalKnowledge = {
  knowledge_id: string;
  employee_id: string;
  source_case_ids: string[];
  question: string;
  raw_answer_text: string;
  structured_knowledge: StructuredKnowledge;
  verified_by_user: boolean;
  created_at: string;
};

export type DashboardSummary = {
  employee_id: string;
  my_case_count: number;
  my_knowledge_count: number;
  stable_pattern_count: number;
  pending_interview_count: number;
  total_case_count: number;
};

export type Employee = {
  employee_id: string;
  name: string;
  department: string;
  experience_level: string;
  experience_years: number;
};

