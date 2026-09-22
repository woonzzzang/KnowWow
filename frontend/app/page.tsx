"use client";

import Link from "next/link";
import {ArrowRight, Bot, BookOpenCheck, CircleAlert, Factory, Network, Sparkles} from "lucide-react";
import {useEffect, useState} from "react";

import {PageHeader} from "@/components/page-header";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card} from "@/components/ui/card";
import {getCase, getDashboard, getPattern} from "@/lib/api";
import {ACTION_LABELS, ISSUE_LABELS, labelOf} from "@/lib/labels";
import type {CommentCase, DashboardSummary, OrganizationPattern} from "@/lib/types";

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary>();
  const [mainCase, setMainCase] = useState<CommentCase>();
  const [mainPattern, setMainPattern] = useState<OrganizationPattern>();
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    Promise.all([getDashboard(), getCase("CASE-008").then(async (item) => ({item, pattern: await getPattern(item)}))])
      .then(([loadedSummary, featured]) => {
        if (!active) return;
        setSummary(loadedSummary);
        setMainCase(featured.item);
        setMainPattern(featured.pattern);
      })
      .catch((caught) => { if (active) setError(caught instanceof Error ? caught.message : "현황을 불러오지 못했습니다."); });
    return () => { active = false; };
  }, []);

  if (!summary || !mainCase || !mainPattern) return <>
    <PageHeader eyebrow="Dashboard" title="안녕하세요, 김설계님" description="확인이 필요한 업무를 살펴보세요." />
    <Card className="p-6 text-sm text-muted" role={error ? "alert" : undefined}>{error ? `현황을 불러오지 못했습니다. ${error}` : "업무 현황을 불러오는 중입니다."}</Card>
    <Button asChild className="mt-4"><Link href="/work/CASE-008">대표 사례로 이동 <ArrowRight className="size-4" /></Link></Button>
  </>;

  const metrics = [
    {label: "내가 처리한 Case", value: summary.my_case_count, note: "Synthetic 업무 로그", icon: Factory, tone: "text-blue-600 bg-blue-50"},
    {label: "확인된 내 지식", value: summary.my_knowledge_count, note: "Human-confirmed", icon: BookOpenCheck, tone: "text-violet-600 bg-violet-50"},
    {label: "안정적인 패턴", value: summary.stable_pattern_count, note: "코드로 집계", icon: Network, tone: "text-emerald-600 bg-emerald-50"},
    {label: "확인이 필요한 차이", value: summary.pending_interview_count, note: "Micro-interview", icon: CircleAlert, tone: "text-rose-600 bg-rose-50"},
  ];

  return (
    <>
      <PageHeader eyebrow="Dashboard" title="안녕하세요, 김설계님" description="평소 업무 기록 속에서 설명되지 않은 판단만 골라 확인합니다. 확인한 경험은 팀이 다시 찾을 수 있는 지식이 됩니다." />

      <section aria-labelledby="dashboard-main-case" className="mb-6 rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-white p-6 shadow-panel sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-4"><span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white text-primary-600 shadow-sm"><Sparkles className="size-5" /></span><div><Badge tone="blue">대표 시나리오 · {mainCase.case_id}</Badge><h2 id="dashboard-main-case" className="mt-3 text-xl font-extrabold leading-snug sm:text-2xl">{labelOf(ISSUE_LABELS, mainCase.issue_type)}인데, 이번에는 {labelOf(ACTION_LABELS, mainCase.action)}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">비슷한 업무 {mainPattern.support_count}건 중 {mainPattern.action_distribution[mainPattern.majority_action] ?? 0}건은 {labelOf(ACTION_LABELS, mainPattern.majority_action)}이었습니다. 이번 판단이 달랐던 이유를 AI 질문으로 확인해 보세요.</p></div></div>
          <Button asChild size="lg" className="w-full shrink-0 sm:w-auto"><Link href="/work/CASE-008">대표 사례 살펴보기 <ArrowRight className="size-4" /></Link></Button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => <Card key={metric.label} className="p-5"><div className="flex items-start justify-between"><div><p className="text-sm font-semibold text-muted">{metric.label}</p><p className="mt-3 text-3xl font-extrabold">{metric.value}</p><p className="mt-1 text-xs text-slate-400">{metric.note}</p></div><span className={`rounded-xl p-3 ${metric.tone}`}><metric.icon className="size-5" /></span></div></Card>)}
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-6 py-5"><div><h2 className="font-bold">지식 생성 흐름</h2><p className="mt-1 text-sm text-muted">CASE-008에서 전체 과정을 확인할 수 있습니다.</p></div><Badge tone="blue">LANGCHAIN FLOW</Badge></div>
          <div className="grid gap-3 p-6 md:grid-cols-5">
            {[{n:"01",t:"Pattern Mining",d:"코드로 집계"},{n:"02",t:"Gap Detection",d:"Action 차이"},{n:"03",t:"Micro-question",d:"LCEL Chain"},{n:"04",t:"Human Confirm",d:"사람이 검증"},{n:"05",t:"RAG Agent",d:"근거 재사용"}].map((step, index) => <div key={step.n} className="relative rounded-xl border border-line bg-slate-50 p-4"><span className="text-xs font-extrabold text-primary-500">{step.n}</span><h3 className="mt-5 text-sm font-bold">{step.t}</h3><p className="mt-1 text-xs text-muted">{step.d}</p>{index < 4 && <ArrowRight className="absolute -right-5 top-1/2 z-10 hidden size-4 text-slate-300 md:block" />}</div>)}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between"><div><h2 className="font-bold">이번 MVP의 원칙</h2><p className="mt-1 text-sm text-muted">추측보다 출처, 추천보다 검토</p></div><Bot className="size-6 text-primary-600" /></div>
          <div className="mt-6 space-y-4">
            {["LLM은 Pattern을 계산하지 않습니다.", "Action이 다를 때만 질문합니다.", "사용자가 말하지 않은 이유는 만들지 않습니다.", "확인 후 저장한 지식만 RAG에 포함합니다.", "모든 답변에 실제 Evidence ID를 남깁니다."].map((text, index) => <div key={text} className="flex gap-3"><span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-50 text-xs font-bold text-primary-700">{index + 1}</span><p className="pt-1 text-sm leading-5 text-slate-600">{text}</p></div>)}
          </div>
          <div className="mt-6 rounded-xl bg-slate-900 p-4 text-sm leading-6 text-slate-200">총 <strong className="text-white">{summary.total_case_count}건</strong>의 의도적으로 설계된 더미 데이터만 사용합니다. 실제 회사·직원 정보는 포함하지 않습니다.</div>
        </Card>
      </section>
    </>
  );
}
