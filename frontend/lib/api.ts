import type {
  CommentCase,
  DashboardSummary,
  Employee,
  GapResult,
  OrganizationPattern,
  PersonalKnowledge,
  StructuredKnowledge,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {"Content-Type": "application/json", ...(init?.headers ?? {})},
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message ?? body.detail ?? `요청에 실패했습니다. (${response.status})`);
  }
  return response.json() as Promise<T>;
}

export async function getEmployees(): Promise<Employee[]> {
  return request<Employee[]>("/api/employees");
}

export async function getDashboard(employeeId = "EMP-001"): Promise<DashboardSummary> {
  return request<DashboardSummary>(`/api/dashboard?employeeId=${employeeId}`);
}

export async function getCases(): Promise<CommentCase[]> {
  return request<CommentCase[]>("/api/cases");
}

export async function getCase(caseId: string): Promise<CommentCase> {
  return request<CommentCase>(`/api/cases/${caseId}`);
}

export async function getPattern(caseItem: CommentCase): Promise<OrganizationPattern> {
  return request<OrganizationPattern>(`/api/cases/${caseItem.case_id}/pattern`);
}

export async function getGap(caseItem: CommentCase): Promise<GapResult> {
  return request<GapResult>(`/api/cases/${caseItem.case_id}/gap`);
}

export async function getPatterns(): Promise<OrganizationPattern[]> {
  return request<OrganizationPattern[]>("/api/organization/patterns");
}

export async function getKnowledge(employeeId = "EMP-001"): Promise<PersonalKnowledge[]> {
  return request<PersonalKnowledge[]>(`/api/employees/${employeeId}/knowledge`);
}

export async function createMicroQuestion(caseId: string): Promise<string> {
  const result = await request<{question: string}>(`/api/cases/${caseId}/micro-question`, {method: "POST"});
  return result.question;
}

export async function extractKnowledge(caseId: string, question: string, answer: string): Promise<StructuredKnowledge> {
  const result = await request<{structured_knowledge: StructuredKnowledge}>(`/api/cases/${caseId}/knowledge/extract`, {
    method: "POST",
    body: JSON.stringify({question, answer}),
  });
  return result.structured_knowledge;
}

export async function confirmKnowledge(caseId: string, question: string, rawAnswerText: string, structuredKnowledge: StructuredKnowledge): Promise<PersonalKnowledge> {
  return request<PersonalKnowledge>(`/api/cases/${caseId}/knowledge/confirm`, {
    method: "POST",
    body: JSON.stringify({question, raw_answer_text: rawAnswerText, structured_knowledge: structuredKnowledge}),
  });
}

export async function askAgent(query: string, employeeId = "EMP-001") {
  return request<{answer: string; evidence_ids: string[]; used_tools: string[]}>("/api/agent/chat", {
    method: "POST",
    body: JSON.stringify({query, employee_id: employeeId}),
  });
}
