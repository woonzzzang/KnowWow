"use client";

import {BookOpenCheck, CheckCircle2, ChevronRight, DatabaseZap} from "lucide-react";
import {useEffect, useState} from "react";

import {ActionBadge} from "@/components/status-badges";
import {Badge} from "@/components/ui/badge";
import {Card} from "@/components/ui/card";
import {PageHeader} from "@/components/page-header";
import {getKnowledge} from "@/lib/api";
import {friendlyKnowledgeLabel, KNOWLEDGE_CONTEXT_LABELS, KNOWLEDGE_VALUE_LABELS} from "@/lib/labels";
import type {PersonalKnowledge} from "@/lib/types";

export default function KnowledgePage() {
  const [knowledge, setKnowledge] = useState<PersonalKnowledge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    getKnowledge()
      .then(setKnowledge)
      .catch((caught) => setError(caught instanceof Error ? caught.message : "지식을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <PageHeader eyebrow="My Knowledge" title="내 판단이 확인된 지식이 됩니다" description="AI가 작성한 추측이 아니라, 담당자가 직접 설명하고 확인한 판단 조건만 모아봅니다." />
      <div className="mb-5 flex gap-3"><Badge tone="green"><CheckCircle2 className="mr-1 size-3" /> 직접 확인한 지식 {knowledge.length}</Badge><Badge tone="gray"><DatabaseZap className="mr-1 size-3" /> 검색 가능</Badge></div>
      {error && <Card className="mb-5 border-amber-200 bg-amber-50 p-5 text-sm text-amber-900" role="alert">저장된 지식을 불러오지 못했습니다. {error}</Card>}
      {!error && <Card className="overflow-hidden">
        <div className="border-b border-line px-6 py-5"><h2 className="font-bold">전체 지식</h2><p className="mt-1 text-sm text-muted">어떤 업무에서 나온 판단인지와 담당자의 원문 답변을 함께 보존합니다.</p></div>
        {loading ? <p className="p-6 text-sm text-muted">확인된 지식을 불러오는 중입니다.</p> : knowledge.length ? <div className="divide-y divide-slate-100">{knowledge.map((item) => <article key={item.knowledge_id} className="group grid gap-4 px-6 py-5 transition hover:bg-primary-50/40 md:grid-cols-[100px_1fr_auto] md:items-center"><div><strong className="text-sm text-primary-700">{item.knowledge_id}</strong><p className="mt-1 text-xs text-muted">{item.source_case_ids.join(", ")}</p></div><div><div className="mb-2 flex flex-wrap items-center gap-2"><h3 className="font-bold">{friendlyKnowledgeLabel(KNOWLEDGE_CONTEXT_LABELS, item.structured_knowledge.new_context?.name, "담당자가 설명한 추가 상황")}</h3>{item.structured_knowledge.new_context?.value && <Badge tone="purple">{friendlyKnowledgeLabel(KNOWLEDGE_VALUE_LABELS, item.structured_knowledge.new_context.value, "자세한 내용은 판단 이유 참고")}</Badge>} {item.structured_knowledge.action && <ActionBadge value={item.structured_knowledge.action} />}</div><p className="text-sm leading-6 text-slate-600">{item.structured_knowledge.rationale}</p><p className="mt-1 text-xs text-slate-400">원문: “{item.raw_answer_text}”</p></div><div className="flex items-center gap-3"><span className="text-xs text-muted">{item.created_at}</span><ChevronRight className="size-4 text-slate-300 group-hover:text-primary-500" /></div></article>)}</div> : <div className="flex min-h-80 flex-col items-center justify-center p-8 text-center"><span className="rounded-2xl bg-primary-50 p-4 text-primary-600"><BookOpenCheck className="size-7" /></span><h2 className="mt-5 font-bold">아직 확인된 개인 지식이 없습니다</h2><p className="mt-2 max-w-sm text-sm leading-6 text-muted">My Work에서 과거와 다른 처리가 있는 업무에 답하고, 정리된 결과를 직접 확인한 뒤 저장하면 여기에 표시됩니다.</p></div>}
      </Card>}
    </>
  );
}
