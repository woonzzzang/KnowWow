import {
  DEMO_CASES,
  DEMO_DASHBOARD,
  DEMO_EMPLOYEES,
  DEMO_KNOWLEDGE,
  DEMO_PATTERNS,
  demoGapFor,
  demoPatternFor,
} from "./demo-data";
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
  try { return await request<Employee[]>("/api/employees"); } catch { return DEMO_EMPLOYEES; }
}

export async function getDashboard(employeeId = "EMP-001"): Promise<DashboardSummary> {
  try { return await request<DashboardSummary>(`/api/dashboard?employeeId=${employeeId}`); }
  catch { return {...DEMO_DASHBOARD, employee_id: employeeId}; }
}

export async function getCases(): Promise<CommentCase[]> {
  try { return await request<CommentCase[]>("/api/cases"); } catch { return DEMO_CASES; }
}

export async function getCase(caseId: string): Promise<CommentCase> {
  try { return await request<CommentCase>(`/api/cases/${caseId}`); }
  catch { return DEMO_CASES.find((item) => item.case_id === caseId) ?? DEMO_CASES[0]; }
}

export async function getPattern(caseItem: CommentCase): Promise<OrganizationPattern> {
  try { return await request<OrganizationPattern>(`/api/cases/${caseItem.case_id}/pattern`); }
  catch { return demoPatternFor(caseItem); }
}

export async function getGap(caseItem: CommentCase): Promise<GapResult> {
  try { return await request<GapResult>(`/api/cases/${caseItem.case_id}/gap`); }
  catch { return demoGapFor(caseItem); }
}

export async function getPatterns(): Promise<OrganizationPattern[]> {
  try { return await request<OrganizationPattern[]>("/api/organization/patterns"); }
  catch { return DEMO_PATTERNS; }
}

export async function getKnowledge(employeeId = "EMP-001"): Promise<PersonalKnowledge[]> {
  try { return await request<PersonalKnowledge[]>(`/api/employees/${employeeId}/knowledge`); }
  catch { return DEMO_KNOWLEDGE.filter((item) => item.employee_id === employeeId); }
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

