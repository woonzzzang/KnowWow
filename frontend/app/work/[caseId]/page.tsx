"use client";

import Link from "next/link";
import {ArrowLeft, ArrowRight, Bot, Check, CircleAlert, LoaderCircle, Send, ShieldCheck, UserRound} from "lucide-react";
import {use, useEffect, useRef, useState} from "react";

import {ActionBadge, IssueBadge, OutcomeBadge} from "@/components/status-badges";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card} from "@/components/ui/card";
import {confirmKnowledge, createMicroQuestion, extractKnowledge, getCase, getGap, getPattern} from "@/lib/api";
import {
  ACTION_LABELS,
  DRAWING_STATUS_LABELS,
  friendlyKnowledgeLabel,
  KNOWLEDGE_CONTEXT_LABELS,
  KNOWLEDGE_VALUE_LABELS,
  labelOf,
  MATERIAL_STATUS_LABELS,
} from "@/lib/labels";
import type {CommentCase, GapResult, OrganizationPattern, PersonalKnowledge, StructuredKnowledge} from "@/lib/types";

export default function WorkDetailPage({params}: {params: Promise<{caseId: string}>}) {
  const {caseId} = use(params);
  const [item, setItem] = useState<CommentCase>();
  const [pattern, setPattern] = useState<OrganizationPattern>();
  const [gap, setGap] = useState<GapResult>();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [extraction, setExtraction] = useState<StructuredKnowledge>();
  const [saved, setSaved] = useState<PersonalKnowledge>();
  const [loading, setLoading] = useState<string | null>("case");
  const [error, setError] = useState("");
  const caseVersion = useRef(0);

  useEffect(() => {
    let active = true;
    caseVersion.current += 1;
    setItem(undefined);
    setPattern(undefined);
    setGap(undefined);
    setQuestion("");
    setAnswer("");
    setExtraction(undefined);
    setSaved(undefined);
    setError("");
    setLoading("case");

    getCase(caseId)
      .then(async (caseItem) => {
        const [matchedPattern, gapResult] = await Promise.all([getPattern(caseItem), getGap(caseItem)]);
        if (!active) return;
        setItem(caseItem);
        setPattern(matchedPattern);
        setGap(gapResult);
      })
      .catch((caught) => {
        if (active) setError(caught instanceof Error ? caught.message : "업무 기록을 불러오지 못했습니다.");
      })
      .finally(() => { if (active) setLoading(null); });

    return () => { active = false; };
  }, [caseId]);

  async function askQuestion() {
    if (!gap?.requires_interview || item?.case_id !== caseId || loading) return;
    const version = caseVersion.current;
    setLoading("question");
    setError("");
    try {
      const generated = (await createMicroQuestion(caseId)).trim();
      if (!generated) throw new Error("AI가 질문을 만들지 못했습니다. 다시 시도해 주세요.");
      if (version === caseVersion.current) setQuestion(generated);
    } catch (caught) {
      if (version === caseVersion.current) setError(caught instanceof Error ? caught.message : "질문을 생성하지 못했습니다.");
    } finally {
      if (version === caseVersion.current) setLoading(null);
    }
  }

  async function analyzeAnswer() {
    if (!gap?.requires_interview || item?.case_id !== caseId || !question || !answer.trim() || loading) return;
    const version = caseVersion.current;
    setLoading("extract");
    setError("");
    try {
      const result = await extractKnowledge(caseId, question, answer.trim());
      if (version === caseVersion.current) setExtraction(result);
    } catch (caught) {
      if (version === caseVersion.current) setError(caught instanceof Error ? caught.message : "답변을 정리하지 못했습니다.");
    } finally {
      if (version === caseVersion.current) setLoading(null);
    }
  }

  async function saveKnowledge() {
    if (!gap?.requires_interview || item?.case_id !== caseId || !extraction || !question || !answer.trim() || loading) return;
    const version = caseVersion.current;
    setLoading("save");
    setError("");
    try {
      const result = await confirmKnowledge(caseId, question, answer.trim(), extraction);
      if (version === caseVersion.current) setSaved(result);
    } catch (caught) {
      if (version === caseVersion.current) setError(caught instanceof Error ? caught.message : "지식을 저장하지 못했습니다.");
    } finally {
      if (version === caseVersion.current) setLoading(null);
    }
  }

  if (loading === "case" || (item && item.case_id !== caseId)) {
    return <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted"><LoaderCircle className="mr-2 size-5 animate-spin" /> 업무 기록을 불러오는 중입니다.</div>;
  }

  if (!item || !pattern || !gap) {
    return <div className="space-y-4">
      <Button variant="ghost" asChild><Link href="/work"><ArrowLeft className="size-4" /> My Work로 돌아가기</Link></Button>
      <Card className="border-amber-200 bg-amber-50 p-6 text-sm text-amber-900" role="alert">업무 내용을 불러오지 못했습니다. {error}</Card>
    </div>;
  }

  const mainCase = item.case_id === "CASE-008";
  const needsQuestion = gap.requires_interview;
  const majorityCount = pattern.action_distribution[pattern.majority_action] ?? 0;
  const maxCount = Math.max(1, ...Object.values(pattern.action_distribution));

  return (
    <>
      <div className="mb-4"><Button variant="ghost" asChild><Link href="/work"><ArrowLeft className="size-4" /> My Work로 돌아가기</Link></Button></div>

      <section className={`mb-6 rounded-2xl border p-6 shadow-panel sm:p-8 ${mainCase ? "border-blue-200 bg-gradient-to-br from-blue-50 via-white to-white" : "border-line bg-white"}`}>
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {mainCase && <Badge tone="blue">대표 시나리오</Badge>}
              <IssueBadge value={item.issue_type} />
              <Badge tone={needsQuestion ? "red" : "green"}>{needsQuestion ? "AI 질문 필요" : "추가 질문 없음"}</Badge>
              <OutcomeBadge value={item.outcome} />
            </div>
            <h1 className="text-2xl font-extrabold leading-tight text-ink sm:text-3xl">
              {item.case_id} <span className="text-slate-400">·</span> {mainCase ? "설치 누락인데 도면 개정" : "업무 처리 기록"}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              {needsQuestion
                ? "비슷한 과거 업무와 다른 처리가 있었습니다. AI 질문으로 당시 판단에 영향을 준 상황을 확인합니다."
                : "이번 처리는 비슷한 과거 업무에서 가장 많이 관찰된 방식과 같습니다. 이 건에는 추가 질문을 만들지 않습니다."}
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 lg:items-end">
            <span className="text-sm text-muted">{item.project_id} · {item.created_at}</span>
            {needsQuestion && <Button asChild><a href="#ai-interview">AI 질문으로 이동 <ArrowRight className="size-4" /></a></Button>}
          </div>
        </div>
        <div className="mt-6 grid gap-3 border-t border-blue-100 pt-5 sm:grid-cols-2">
          <div className="rounded-xl border border-violet-100 bg-white p-4">
            <p className="text-sm font-semibold text-slate-500">이번 업무의 처리</p>
            <p className="mt-1 text-lg font-extrabold text-violet-700">{labelOf(ACTION_LABELS, item.action)}</p>
          </div>
          <div className="rounded-xl border border-blue-100 bg-white p-4">
            <p className="text-sm font-semibold text-slate-500">비슷한 과거 업무에서 가장 많았던 처리</p>
            <p className="mt-1 text-lg font-extrabold text-primary-700">{labelOf(ACTION_LABELS, pattern.majority_action)} <span className="text-sm font-semibold">· {majorityCount}/{pattern.support_count}건</span></p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.86fr_1.14fr]">
        <div className="space-y-6">
          <Card className="p-6">
            <div className="mb-5 flex items-center justify-between gap-3"><h2 className="font-bold">관련 업무 기록</h2><Badge tone="gray">예시 Comment 데이터</Badge></div>
            <dl className="grid gap-5 sm:grid-cols-2">
              <div><dt className="field-label">접수된 내용</dt><dd className="text-sm leading-6 text-slate-700">{item.comment_text}</dd></div>
              <div><dt className="field-label">기록된 처리</dt><dd className="text-sm leading-6 text-slate-700">{item.response_text}</dd></div>
              <div><dt className="field-label">기록상 상황</dt><dd className="space-y-1 text-sm text-slate-700"><span className="block">{labelOf(MATERIAL_STATUS_LABELS, item.context.material_status)}</span><span className="block">{labelOf(DRAWING_STATUS_LABELS, item.context.drawing_status)}</span></dd></div>
              <div><dt className="field-label">이번 처리 방식</dt><dd><ActionBadge value={item.action} /></dd></div>
            </dl>
          </Card>

          <Card className="p-6">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-bold">비슷한 과거 업무의 처리</h2><p className="mt-1 text-sm text-muted">문제 유형·장비·자재·도면 상태가 같은 {pattern.support_count}건</p></div><Badge tone="blue">{pattern.pattern_id}</Badge></div>
            <div className="space-y-4">
              {Object.entries(pattern.action_distribution).map(([action, count]) => (
                <div key={action}>
                  <div className="mb-2 flex items-center justify-between gap-3 text-sm"><span className="font-semibold text-slate-700">{labelOf(ACTION_LABELS, action)} {action === item.action && needsQuestion && <span className="ml-1 text-xs text-violet-600">이번 처리</span>}</span><span className="whitespace-nowrap font-bold">{count}건 <span className="font-normal text-muted">({Math.round(count / pattern.support_count * 100)}%)</span></span></div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${action === item.action && needsQuestion ? "bg-violet-500" : "bg-primary-500"}`} style={{width: `${Math.max(10, count / maxCount * 100)}%`}} /></div>
                </div>
              ))}
            </div>
            <p className="mt-5 rounded-lg bg-slate-50 p-3 text-xs leading-5 text-muted">이 숫자는 과거 기록의 집계일 뿐, 업무의 정답을 뜻하지 않습니다.</p>
          </Card>
        </div>

        <Card id="ai-interview" className="scroll-mt-24 overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-6 py-5"><div><h2 className="font-bold">{needsQuestion ? "AI 질문에 답변하기" : "이 업무의 질문 여부"}</h2><p className="mt-1 text-sm text-muted">{needsQuestion ? "예시 업무 기록을 바탕으로 실제 AI가 질문을 만듭니다." : "질문 여부는 과거 처리 집계와 이번 처리의 차이로 판단합니다."}</p></div><span className="rounded-xl bg-primary-50 p-3 text-primary-600"><Bot className="size-5" /></span></div>
          <div className="min-h-[320px] space-y-5 bg-slate-50/60 p-5 sm:p-6">
            {needsQuestion ? <>
              <div className="flex gap-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600"><CircleAlert className="size-4" /></span><div className="max-w-xl rounded-2xl rounded-tl-sm border border-rose-100 bg-white p-4"><strong className="text-sm text-rose-700">과거와 다른 처리가 발견되었습니다</strong><p className="mt-2 text-sm leading-6 text-slate-600">이번에는 <b>{labelOf(ACTION_LABELS, item.action)}</b>으로 처리했습니다. 비슷한 과거 업무에서는 <b>{labelOf(ACTION_LABELS, pattern.majority_action)}</b>이 {majorityCount}건으로 가장 많았습니다.</p></div></div>

              {!question && <div className="pl-12"><Button onClick={askQuestion} disabled={loading === "question"}>{loading === "question" ? <LoaderCircle className="size-4 animate-spin" /> : <Bot className="size-4" />} AI 질문 생성</Button><p className="mt-2 text-xs text-muted">질문을 만들 수 없으면 예시 질문으로 대체하지 않습니다.</p></div>}

              {question && <div className="flex gap-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-600 text-white"><Bot className="size-4" /></span><div className="max-w-xl rounded-2xl rounded-tl-sm bg-primary-600 p-4 text-sm leading-6 text-white shadow-sm">{question}</div></div>}

              {question && !saved && <div className="flex justify-end gap-3"><div className="w-full max-w-xl"><label htmlFor="case-answer" className="sr-only">당시 판단에 영향을 준 상황</label><textarea id="case-answer" value={answer} onChange={(event) => { setAnswer(event.target.value); setExtraction(undefined); }} disabled={loading === "extract" || loading === "save"} rows={4} placeholder="당시 어떤 상황이 달랐는지 직접 적어주세요. AI가 이유를 추측하지 않습니다." className="w-full resize-none rounded-2xl rounded-tr-sm border border-line bg-white p-4 text-sm leading-6 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100 disabled:opacity-60" /><div className="mt-2 flex justify-end"><Button onClick={analyzeAnswer} disabled={!answer.trim() || loading === "extract" || loading === "save"}>{loading === "extract" ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />} 답변 정리</Button></div></div><span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-800 text-white"><UserRound className="size-4" /></span></div>}

              {error && <div role="alert" className="ml-12 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">{error}</div>}

              {extraction && !saved && <div className="ml-12 rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm"><div className="mb-4 flex items-center gap-2"><ShieldCheck className="size-5 text-emerald-600" /><strong className="text-sm">AI가 정리한 내용 확인</strong><Badge tone="amber">아직 저장되지 않음</Badge></div><div className="grid gap-4 sm:grid-cols-2"><div><span className="field-label">새로 확인한 상황</span><p className="rounded-lg bg-violet-50 p-3 text-sm font-semibold text-violet-700">{friendlyKnowledgeLabel(KNOWLEDGE_CONTEXT_LABELS, extraction.new_context?.name, "담당자가 설명한 추가 상황")} · {friendlyKnowledgeLabel(KNOWLEDGE_VALUE_LABELS, extraction.new_context?.value, "자세한 내용은 판단 이유에서 확인")}</p></div><div><span className="field-label">이번 처리</span><p className="p-3 text-sm font-semibold">{labelOf(ACTION_LABELS, item.action)}</p></div><div className="sm:col-span-2"><span className="field-label">판단 이유</span><p className="rounded-lg bg-slate-50 p-3 text-sm leading-6">{extraction.rationale ?? "명확한 판단 이유를 추출하지 못했습니다."}</p></div></div><div className="mt-5 flex justify-end gap-2"><Button variant="outline" onClick={() => setExtraction(undefined)}>답변 수정</Button><Button onClick={saveKnowledge} disabled={loading === "save"}>{loading === "save" ? <LoaderCircle className="size-4 animate-spin" /> : <Check className="size-4" />} 확인 후 저장</Button></div></div>}

              {saved && <div className="ml-12 rounded-2xl border border-emerald-200 bg-emerald-50 p-5"><div className="flex items-center gap-3"><span className="rounded-full bg-emerald-600 p-2 text-white"><Check className="size-4" /></span><div><strong className="text-sm text-emerald-800">{saved.knowledge_id}로 저장되었습니다</strong><p className="mt-1 text-sm text-emerald-700">직접 확인한 답변만 지식으로 저장됩니다.</p></div></div><Button asChild className="mt-4" size="sm"><Link href="/agent">관련 경험 검색하기</Link></Button></div>}
            </> : <div className="rounded-2xl border border-emerald-200 bg-white p-6"><div className="flex items-center gap-3"><span className="rounded-full bg-emerald-50 p-2 text-emerald-700"><Check className="size-5" /></span><strong className="text-base text-emerald-900">이 건에는 추가 질문이 필요하지 않습니다</strong></div><p className="mt-3 text-sm leading-6 text-slate-600">이번 처리인 <b>{labelOf(ACTION_LABELS, item.action)}</b>은 비슷한 과거 업무에서 가장 많이 관찰된 방식입니다. 이유를 임의로 만들어 묻지 않습니다.</p><Button asChild variant="outline" className="mt-5"><Link href="/work/CASE-008">질문이 필요한 대표 사례 보기 <ArrowRight className="size-4" /></Link></Button></div>}
          </div>
        </Card>
      </div>
    </>
  );
}
