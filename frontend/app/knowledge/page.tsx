"use client";

import {BookOpenCheck, CheckCircle2, ChevronRight, DatabaseZap} from "lucide-react";
import {useEffect, useState} from "react";

import {ActionBadge} from "@/components/status-badges";
import {Badge} from "@/components/ui/badge";
import {Card} from "@/components/ui/card";
import {PageHeader} from "@/components/page-header";
import {getKnowledge} from "@/lib/api";
import type {PersonalKnowledge} from "@/lib/types";

export default function KnowledgePage() {
  const [knowledge, setKnowledge] = useState<PersonalKnowledge[]>([]);
  useEffect(() => { getKnowledge().then(setKnowledge); }, []);

  return (
    <>
      <PageHeader eyebrow="My Knowledge" title="내 판단이 확인된 지식이 됩니다" description="AI가 작성한 추측이 아니라, 담당자가 직접 설명하고 확인한 판단 조건만 모아봅니다." />
      <div className="mb-5 flex gap-3"><Badge tone="green"><CheckCircle2 className="mr-1 size-3" /> HUMAN CONFIRMED {knowledge.length}</Badge><Badge tone="gray"><DatabaseZap className="mr-1 size-3" /> RAG INDEXED</Badge></div>
      <Card className="overflow-hidden">
        <div className="border-b border-line px-6 py-5"><h2 className="font-bold">전체 지식</h2><p className="mt-1 text-sm text-muted">Source Case와 원문 답변을 함께 보존합니다.</p></div>
        {knowledge.length ? <div className="divide-y divide-slate-100">{knowledge.map((item) => <article key={item.knowledge_id} className="group grid gap-4 px-6 py-5 transition hover:bg-primary-50/40 md:grid-cols-[100px_1fr_auto] md:items-center"><div><strong className="text-sm text-primary-700">{item.knowledge_id}</strong><p className="mt-1 text-xs text-muted">{item.source_case_ids.join(", ")}</p></div><div><div className="mb-2 flex flex-wrap items-center gap-2"><h3 className="font-bold">{item.structured_knowledge.new_context?.name ?? "추가 Context 없음"}</h3>{item.structured_knowledge.new_context?.value && <Badge tone="purple">{item.structured_knowledge.new_context.value}</Badge>} {item.structured_knowledge.action && <ActionBadge value={item.structured_knowledge.action} />}</div><p className="text-sm leading-6 text-slate-600">{item.structured_knowledge.rationale}</p><p className="mt-1 text-xs text-slate-400">원문: “{item.raw_answer_text}”</p></div><div className="flex items-center gap-3"><span className="text-xs text-muted">{item.created_at}</span><ChevronRight className="size-4 text-slate-300 group-hover:text-primary-500" /></div></article>)}</div> : <div className="flex min-h-80 flex-col items-center justify-center p-8 text-center"><span className="rounded-2xl bg-primary-50 p-4 text-primary-600"><BookOpenCheck className="size-7" /></span><h2 className="mt-5 font-bold">아직 확인된 개인 지식이 없습니다</h2><p className="mt-2 max-w-sm text-sm leading-6 text-muted">My Work에서 Pattern Gap이 있는 Case에 답변하고, 구조화 결과를 확인 후 저장하면 여기에 표시됩니다.</p></div>}
      </Card>
    </>
  );
}

