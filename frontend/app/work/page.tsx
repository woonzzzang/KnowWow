"use client";

import Link from "next/link";
import {ArrowRight, Search, Sparkles} from "lucide-react";
import {useEffect, useMemo, useState} from "react";

import {ActionBadge, IssueBadge, OutcomeBadge} from "@/components/status-badges";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card} from "@/components/ui/card";
import {PageHeader} from "@/components/page-header";
import {getCases, getPatterns} from "@/lib/api";
import {ACTION_LABELS, labelOf} from "@/lib/labels";
import type {CommentCase, OrganizationPattern} from "@/lib/types";

type Tab = "all" | "variant" | "pending";

function matchesPattern(item: CommentCase, pattern: OrganizationPattern) {
  const signature = pattern.signature;
  return signature.issue_type === item.issue_type
    && signature.equipment === item.equipment
    && signature.system === item.system
    && signature.material_status === item.context.material_status
    && signature.drawing_status === item.context.drawing_status;
}

function requiresInterview(item: CommentCase, patterns: OrganizationPattern[]) {
  const pattern = patterns.find((candidate) => matchesPattern(item, candidate));
  return Boolean(pattern?.stable && item.action !== pattern.majority_action);
}

export default function WorkPage() {
  const [cases, setCases] = useState<CommentCase[]>([]);
  const [patterns, setPatterns] = useState<OrganizationPattern[]>([]);
  const [tab, setTab] = useState<Tab>("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([getCases(), getPatterns()])
      .then(([loadedCases, loadedPatterns]) => {
        if (!active) return;
        setCases(loadedCases);
        setPatterns(loadedPatterns);
      })
      .catch((caught) => {
        if (active) setError(caught instanceof Error ? caught.message : "업무 기록을 불러오지 못했습니다.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const mainCase = cases.find((item) => item.case_id === "CASE-008");
  const mainPattern = mainCase && patterns.find((pattern) => matchesPattern(mainCase, pattern));
  const variantCount = cases.filter((item) => requiresInterview(item, patterns)).length;

  const visible = useMemo(() => cases.filter((item) => {
    const tabMatch = tab === "all"
      || (tab === "variant" && requiresInterview(item, patterns))
      || (tab === "pending" && item.outcome === "PENDING");
    const queryMatch = !query
      || `${item.case_id} ${item.comment_text} ${item.project_id}`.toLowerCase().includes(query.toLowerCase());
    return tabMatch && queryMatch;
  }), [cases, patterns, tab, query]);

  return (
    <>
      <PageHeader
        eyebrow="My Work"
        title="확인이 필요한 업무를 살펴보세요"
        description="과거와 다른 처리가 있는 건에만 AI가 이유를 묻습니다. 기록은 예시 데이터지만 질문과 답변 처리는 실제로 실행됩니다."
      />

      {loading && <Card className="mb-6 p-6 text-sm text-muted">업무 기록과 처리 경향을 불러오는 중입니다.</Card>}
      {error && <Card className="mb-6 border-amber-200 bg-amber-50 p-6 text-sm text-amber-900" role="alert">업무 기록을 불러오지 못했습니다. {error}</Card>}

      {!loading && !error && mainCase && mainPattern && (
        <section aria-labelledby="main-case-title" className="mb-6 overflow-hidden rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-white shadow-panel">
          <div className="grid gap-6 p-6 lg:grid-cols-[1fr_auto] lg:items-center lg:p-8">
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge tone="blue"><Sparkles className="mr-1 size-3" /> 대표 시나리오</Badge>
                <IssueBadge value={mainCase.issue_type} />
                <span className="text-sm font-semibold text-slate-500">{mainCase.case_id}</span>
              </div>
              <h2 id="main-case-title" className="text-xl font-extrabold leading-snug text-ink sm:text-2xl">
                같은 설치 누락인데, 이번에는 도면을 개정했습니다
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                비슷한 업무 {mainPattern.support_count}건 중 {mainPattern.action_distribution[mainPattern.majority_action] ?? 0}건은 {labelOf(ACTION_LABELS, mainPattern.majority_action)}이었습니다.
                이번 판단에 어떤 차이가 있었는지 담당자에게 확인해 보세요.
              </p>
            </div>
            <Button asChild size="lg" className="w-full lg:w-auto">
              <Link href={`/work/${mainCase.case_id}`}>CASE-008 살펴보기 <ArrowRight className="size-4" /></Link>
            </Button>
          </div>
        </section>
      )}

      {!loading && !error && <Card className="overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-line px-5 pt-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex gap-5 overflow-x-auto">
            {([
              {id: "all", label: "전체 업무"},
              {id: "variant", label: "질문이 필요한 업무"},
              {id: "pending", label: "처리 대기"},
            ] as const).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`shrink-0 border-b-2 pb-4 text-sm font-bold transition ${tab === item.id ? "border-primary-600 text-primary-700" : "border-transparent text-muted hover:text-ink"}`}
                aria-pressed={tab === item.id}
              >
                {item.label}
                {item.id === "variant" && <span className="ml-2 rounded-full bg-rose-50 px-2 py-0.5 text-xs text-rose-600">{variantCount}</span>}
              </button>
            ))}
          </div>
          <label className="mb-4 flex h-10 items-center gap-2 rounded-lg border border-line bg-white px-3 text-sm text-muted focus-within:border-primary-500">
            <Search className="size-4" />
            <span className="sr-only">업무 검색</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="사례 번호 또는 내용 검색" className="min-w-0 flex-1 outline-none sm:w-56" />
          </label>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table min-w-[900px]">
            <thead><tr><th>ID</th><th>프로젝트</th><th>문제 유형</th><th className="w-[32%]">기록 내용</th><th>이번 처리</th><th>과거와 비교</th><th>결과</th><th>작업일</th><th /></tr></thead>
            <tbody>
              {visible.map((item) => {
                const variant = requiresInterview(item, patterns);
                return <tr key={item.case_id} className={item.case_id === "CASE-008" ? "bg-blue-50/70" : undefined}>
                  <td className="font-bold text-primary-700">
                    {item.case_id}
                    {item.case_id === "CASE-008" && <span className="mt-1 block text-xs font-semibold text-primary-600">대표 사례</span>}
                  </td>
                  <td>{item.project_id}</td>
                  <td><IssueBadge value={item.issue_type} /></td>
                  <td><p className="line-clamp-2 max-w-md text-slate-600">{item.comment_text}</p></td>
                  <td><ActionBadge value={item.action} /></td>
                  <td><Badge tone={variant ? "red" : "green"}>{variant ? "질문 필요" : "추가 질문 없음"}</Badge></td>
                  <td><OutcomeBadge value={item.outcome} /></td>
                  <td className="whitespace-nowrap text-muted">{item.created_at}</td>
                  <td><Button asChild variant="ghost" size="sm"><Link href={`/work/${item.case_id}`} aria-label={`${item.case_id} 상세 보기`}><ArrowRight className="size-4" /></Link></Button></td>
                </tr>;
              })}
              {!visible.length && <tr><td colSpan={9} className="py-12 text-center text-muted">조건에 맞는 업무가 없습니다.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>}
    </>
  );
}
