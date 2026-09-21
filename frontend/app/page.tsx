"use client";

import Link from "next/link";
import {ArrowRight, Bot, BookOpenCheck, CircleAlert, Factory, Network, Sparkles} from "lucide-react";
import {useEffect, useState} from "react";

import {PageHeader} from "@/components/page-header";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card} from "@/components/ui/card";
import {getDashboard} from "@/lib/api";
import type {DashboardSummary} from "@/lib/types";

const fallback: DashboardSummary = {employee_id: "EMP-001", my_case_count: 8, my_knowledge_count: 0, stable_pattern_count: 4, pending_interview_count: 2, total_case_count: 24};

export default function DashboardPage() {
  const [summary, setSummary] = useState(fallback);
  useEffect(() => { getDashboard().then(setSummary); }, []);

  const metrics = [
    {label: "내가 처리한 Case", value: summary.my_case_count, note: "Synthetic 업무 로그", icon: Factory, tone: "text-blue-600 bg-blue-50"},
    {label: "확인된 내 지식", value: summary.my_knowledge_count, note: "Human-confirmed", icon: BookOpenCheck, tone: "text-violet-600 bg-violet-50"},
    {label: "안정적인 패턴", value: summary.stable_pattern_count, note: "코드로 집계", icon: Network, tone: "text-emerald-600 bg-emerald-50"},
    {label: "확인이 필요한 차이", value: summary.pending_interview_count, note: "Micro-interview", icon: CircleAlert, tone: "text-rose-600 bg-rose-50"},
  ];

  return (
    <>
      <PageHeader eyebrow="Dashboard" title="안녕하세요, 김설계님" description="평소 업무 기록 속에서 설명되지 않은 판단만 골라 확인합니다. 확인한 경험은 팀이 다시 찾을 수 있는 지식이 됩니다." action={<Button asChild><Link href="/work/CASE-008">메인 시나리오 실행 <ArrowRight className="size-4" /></Link></Button>} />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => <Card key={metric.label} className="p-5"><div className="flex items-start justify-between"><div><p className="text-sm font-semibold text-muted">{metric.label}</p><p className="mt-3 text-3xl font-extrabold">{metric.value}</p><p className="mt-1 text-xs text-slate-400">{metric.note}</p></div><span className={`rounded-xl p-3 ${metric.tone}`}><metric.icon className="size-5" /></span></div></Card>)}
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-6 py-5"><div><h2 className="font-bold">지식 생성 흐름</h2><p className="mt-1 text-sm text-muted">CASE-008에서 전체 과정을 확인할 수 있습니다.</p></div><Badge tone="blue">LANGCHAIN FLOW</Badge></div>
          <div className="grid gap-3 p-6 md:grid-cols-5">
            {[{n:"01",t:"Pattern Mining",d:"코드로 집계"},{n:"02",t:"Gap Detection",d:"Action 차이"},{n:"03",t:"Micro-question",d:"LCEL Chain"},{n:"04",t:"Human Confirm",d:"사람이 검증"},{n:"05",t:"RAG Agent",d:"근거 재사용"}].map((step, index) => <div key={step.n} className="relative rounded-xl border border-line bg-slate-50 p-4"><span className="text-xs font-extrabold text-primary-500">{step.n}</span><h3 className="mt-5 text-sm font-bold">{step.t}</h3><p className="mt-1 text-xs text-muted">{step.d}</p>{index < 4 && <ArrowRight className="absolute -right-5 top-1/2 z-10 hidden size-4 text-slate-300 md:block" />}</div>)}
          </div>
          <div className="mx-6 mb-6 flex flex-col gap-4 rounded-xl border border-blue-100 bg-blue-50 p-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-3"><span className="rounded-xl bg-white p-3 text-primary-600 shadow-sm"><Sparkles className="size-5" /></span><div><strong className="text-sm">CASE-008 · 설치 누락인데 도면을 개정한 사례</strong><p className="mt-1 text-sm text-slate-600">같은 조건 8건 중 6건은 생산 이관이었습니다. 이번 판단의 숨은 조건을 확인해보세요.</p></div></div><Button asChild size="sm"><Link href="/work/CASE-008">확인하기</Link></Button></div>
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

