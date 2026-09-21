"use client";

import Link from "next/link";
import {ArrowLeft, Bot, Check, CircleAlert, LoaderCircle, Send, ShieldCheck, UserRound} from "lucide-react";
import {use, useEffect, useState} from "react";

import {ActionBadge, IssueBadge, OutcomeBadge} from "@/components/status-badges";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card} from "@/components/ui/card";
import {ACTION_LABELS, CHAT_ACTION_LABELS, friendlyKnowledgeLabel, KNOWLEDGE_CONTEXT_LABELS, KNOWLEDGE_VALUE_LABELS, labelOf} from "@/lib/labels";
import {confirmKnowledge, createMicroQuestion, extractKnowledge, getCase, getGap, getPattern} from "@/lib/api";
import type {CommentCase, GapResult, OrganizationPattern, PersonalKnowledge, StructuredKnowledge} from "@/lib/types";

const DEMO_QUESTION = "비슷한 설치 누락 사례는 주로 생산 부서로 넘겨 처리했는데, 이번에는 도면 개정을 하게 된 상황이 무엇이 달랐나요?";

export default function WorkDetailPage({params}: {params: Promise<{caseId: string}>}) {
  const {caseId} = use(params);
  const [item, setItem] = useState<CommentCase>();
  const [pattern, setPattern] = useState<OrganizationPattern>();
  const [gap, setGap] = useState<GapResult>();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [extraction, setExtraction] = useState<StructuredKnowledge>();
  const [saved, setSaved] = useState<PersonalKnowledge>();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getCase(caseId).then(async (caseItem) => {
      setItem(caseItem);
      const [matchedPattern, gapResult] = await Promise.all([getPattern(caseItem), getGap(caseItem)]);
      setPattern(matchedPattern);
      setGap(gapResult);
    });
  }, [caseId]);

  async function askQuestion() {
    setLoading("question"); setError("");
    try { setQuestion(await createMicroQuestion(caseId)); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "질문 생성에 실패했습니다."); setQuestion(DEMO_QUESTION); }
    finally { setLoading(null); }
  }

  async function analyzeAnswer() {
    if (!question || !answer.trim()) return;
    setLoading("extract"); setError("");
    try { setExtraction(await extractKnowledge(caseId, question, answer)); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "답변 구조화에 실패했습니다."); }
    finally { setLoading(null); }
  }

  async function saveKnowledge() {
    if (!extraction) return;
    setLoading("save"); setError("");
    try { setSaved(await confirmKnowledge(caseId, question, answer, extraction)); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "지식 저장에 실패했습니다."); }
    finally { setLoading(null); }
  }

  if (!item || !pattern || !gap) return <div className="flex min-h-[60vh] items-center justify-center text-muted"><LoaderCircle className="mr-2 size-5 animate-spin" /> Case를 불러오는 중입니다.</div>;

  const maxCount = Math.max(...Object.values(pattern.action_distribution));
  return (
    <>
      <div className="mb-5"><Button variant="ghost" asChild><Link href="/work"><ArrowLeft className="size-4" /> My Work로 돌아가기</Link></Button></div>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><div className="mb-3 flex flex-wrap gap-2"><IssueBadge value={item.issue_type} /><Badge tone={gap.requires_interview ? "red" : "green"}>{gap.status}</Badge><OutcomeBadge value={item.outcome} /></div><h1 className="text-2xl font-extrabold">{item.case_id} · 판단 조건 확인</h1><p className="mt-2 text-sm text-muted">비슷한 과거 업무와 다른 처리를 발견했을 때만 AI가 짧게 질문합니다.</p></div><span className="text-sm text-muted">{item.project_id} · {item.created_at}</span></div>

      <div className="grid gap-6 xl:grid-cols-[0.86fr_1.14fr]">
        <div className="space-y-6">
          <Card className="p-6"><div className="mb-5 flex items-center justify-between"><h2 className="font-bold">관련 Comment 정보</h2><Badge tone="gray">OBSERVED CASE</Badge></div><dl className="grid gap-4 sm:grid-cols-2"><div><dt className="field-label">Comment</dt><dd className="text-sm leading-6 text-slate-700">{item.comment_text}</dd></div><div><dt className="field-label">Response</dt><dd className="text-sm leading-6 text-slate-700">{item.response_text}</dd></div><div><dt className="field-label">Visible Context</dt><dd className="text-sm text-slate-700">자재 {item.context.material_status} · 도면 {item.context.drawing_status}</dd></div><div><dt className="field-label">현재 Action</dt><dd><ActionBadge value={item.action} /></dd></div></dl></Card>

          <Card className="p-6"><div className="mb-5 flex items-center justify-between"><div><h2 className="font-bold">기존 유사 사례 Pattern</h2><p className="mt-1 text-xs text-muted">동일한 Visible Context · {pattern.support_count}건</p></div><Badge tone="blue">{pattern.pattern_id}</Badge></div><div className="space-y-4">{Object.entries(pattern.action_distribution).map(([action, count]) => <div key={action}><div className="mb-2 flex justify-between text-sm"><span className="font-medium">{labelOf(ACTION_LABELS, action)}</span><span className="font-bold">{count}건 <span className="font-normal text-muted">({Math.round(count / pattern.support_count * 100)}%)</span></span></div><div className="h-2.5 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${action === item.action ? "bg-violet-500" : "bg-primary-500"}`} style={{width: `${Math.max(10, count / maxCount * 100)}%`}} /></div></div>)}</div><p className="mt-5 rounded-lg bg-slate-50 p-3 text-xs leading-5 text-muted">이 분포는 과거 관찰 결과이며 공식 업무 Rule 또는 정답이 아닙니다.</p></Card>
        </div>

        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-6 py-5"><div><h2 className="font-bold">AI 질문에 답변하기</h2><p className="mt-1 text-sm text-muted">답변은 구조화한 뒤 직접 확인해야만 저장됩니다.</p></div><span className="rounded-xl bg-primary-50 p-3 text-primary-600"><Bot className="size-5" /></span></div>
          <div className="min-h-[540px] space-y-5 bg-slate-50/60 p-6">
            <div className="flex gap-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600"><CircleAlert className="size-4" /></span><div className="max-w-xl rounded-2xl rounded-tl-sm border border-rose-100 bg-white p-4"><strong className="text-sm text-rose-700">과거와 다른 처리가 발견되었습니다</strong><p className="mt-2 text-sm leading-6 text-slate-600">이번에는 <b>{labelOf(CHAT_ACTION_LABELS, item.action)}</b>했습니다. 비슷한 과거 업무에서는 <b>{labelOf(CHAT_ACTION_LABELS, pattern.majority_action)}</b>한 경우가 가장 많았습니다.</p></div></div>

            {!question && <div className="pl-12"><Button onClick={askQuestion} disabled={loading === "question"}>{loading === "question" && <LoaderCircle className="size-4 animate-spin" />} LangChain 질문 생성</Button><p className="mt-2 text-xs text-muted">API 키가 없으면 예시 질문을 표시하고 설정 오류를 안내합니다.</p></div>}
            {question && <div className="flex gap-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-600 text-white"><Bot className="size-4" /></span><div className="max-w-xl rounded-2xl rounded-tl-sm bg-primary-600 p-4 text-sm leading-6 text-white shadow-sm">{question}</div></div>}
            {question && <div className="flex justify-end gap-3"><div className="w-full max-w-xl"><textarea value={answer} onChange={(event) => setAnswer(event.target.value)} rows={4} placeholder="담당자가 직접 판단한 조건을 입력하세요. 시스템이 이유를 추측하지 않습니다." className="w-full resize-none rounded-2xl rounded-tr-sm border border-line bg-white p-4 text-sm leading-6 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100" /><div className="mt-2 flex justify-end"><Button onClick={analyzeAnswer} disabled={!answer.trim() || loading === "extract"}>{loading === "extract" ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />} 답변 구조화</Button></div></div><span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-800 text-white"><UserRound className="size-4" /></span></div>}

            {error && <div className="ml-12 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">{error}</div>}

            {extraction && !saved && <div className="ml-12 rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm"><div className="mb-4 flex items-center gap-2"><ShieldCheck className="size-5 text-emerald-600" /><strong className="text-sm">저장 전 확인</strong><Badge tone="amber">아직 저장되지 않음</Badge></div><div className="grid gap-4 sm:grid-cols-2"><div><span className="field-label">새로 확인한 상황</span><p className="rounded-lg bg-violet-50 p-3 text-sm font-semibold text-violet-700">{friendlyKnowledgeLabel(KNOWLEDGE_CONTEXT_LABELS, extraction.new_context?.name, "담당자가 설명한 추가 상황")} · {friendlyKnowledgeLabel(KNOWLEDGE_VALUE_LABELS, extraction.new_context?.value, "자세한 내용은 판단 이유에서 확인")}</p></div><div><span className="field-label">이번 처리</span><p className="p-3 text-sm font-semibold">{labelOf(ACTION_LABELS, item.action)}</p></div><div className="sm:col-span-2"><span className="field-label">판단 이유</span><p className="rounded-lg bg-slate-50 p-3 text-sm leading-6">{extraction.rationale ?? "명확한 판단 근거를 추출하지 못했습니다."}</p></div></div><div className="mt-5 flex justify-end gap-2"><Button variant="outline" onClick={() => setExtraction(undefined)}>수정</Button><Button onClick={saveKnowledge} disabled={loading === "save"}>{loading === "save" ? <LoaderCircle className="size-4 animate-spin" /> : <Check className="size-4" />} 확인 후 저장</Button></div></div>}
            {saved && <div className="ml-12 rounded-2xl border border-emerald-200 bg-emerald-50 p-5"><div className="flex items-center gap-3"><span className="rounded-full bg-emerald-600 p-2 text-white"><Check className="size-4" /></span><div><strong className="text-sm text-emerald-800">{saved.knowledge_id}로 저장되었습니다</strong><p className="mt-1 text-sm text-emerald-700">이제 Knowledge Agent가 확인된 경험지식으로 검색할 수 있습니다.</p></div></div><Button asChild className="mt-4" size="sm"><Link href="/agent">Agent에서 질문하기</Link></Button></div>}
          </div>
        </Card>
      </div>
    </>
  );
}
