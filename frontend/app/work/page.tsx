"use client";

import Link from "next/link";
import {ArrowRight, Filter, Search} from "lucide-react";
import {useEffect, useMemo, useState} from "react";

import {ActionBadge, IssueBadge, OutcomeBadge} from "@/components/status-badges";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card} from "@/components/ui/card";
import {PageHeader} from "@/components/page-header";
import {getCases} from "@/lib/api";
import {DEMO_PATTERNS} from "@/lib/demo-data";
import type {CommentCase} from "@/lib/types";

type Tab = "all" | "variant" | "pending";

function isVariant(item: CommentCase) {
  const pattern = DEMO_PATTERNS.find((candidate) => candidate.signature.issue_type === item.issue_type);
  return pattern ? item.action !== pattern.majority_action : false;
}

export default function WorkPage() {
  const [cases, setCases] = useState<CommentCase[]>([]);
  const [tab, setTab] = useState<Tab>("all");
  const [query, setQuery] = useState("");
  useEffect(() => { getCases().then(setCases); }, []);

  const visible = useMemo(() => cases.filter((item) => {
    const tabMatch = tab === "all" || (tab === "variant" && isVariant(item)) || (tab === "pending" && item.outcome === "PENDING");
    const queryMatch = !query || `${item.case_id} ${item.comment_text} ${item.project_id}`.toLowerCase().includes(query.toLowerCase());
    return tabMatch && queryMatch;
  }), [cases, tab, query]);

  return (
    <>
      <PageHeader eyebrow="My Work" title="업무 패턴과 차이를 확인하세요" description="Pattern은 과거의 관찰 결과입니다. 다수 Action과 다른 처리는 정답·오답이 아니라 추가 Context를 확인할 기회입니다." />
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-line px-5 pt-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex gap-6">
            {([{id:"all", label:"전체 Case"},{id:"variant", label:"패턴과 다른 처리"},{id:"pending", label:"처리 대기"}] as const).map((item) => <button key={item.id} onClick={() => setTab(item.id)} className={`border-b-2 pb-4 text-sm font-bold transition ${tab === item.id ? "border-primary-600 text-primary-700" : "border-transparent text-muted hover:text-ink"}`}>{item.label}{item.id === "variant" && <span className="ml-2 rounded-full bg-rose-50 px-2 py-0.5 text-xs text-rose-600">{cases.filter(isVariant).length}</span>}</button>)}
          </div>
          <div className="mb-4 flex gap-2">
            <label className="flex h-9 items-center gap-2 rounded-lg border border-line bg-white px-3 text-sm text-muted focus-within:border-primary-500"><Search className="size-4" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Case 또는 Comment 검색" className="w-52 outline-none" /></label>
            <Button variant="outline" size="sm"><Filter className="size-4" /> 필터</Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table min-w-[900px]">
            <thead><tr><th>ID</th><th>프로젝트</th><th>이슈 유형</th><th className="w-[32%]">Comment 요약</th><th>처리 Action</th><th>패턴 대비</th><th>결과</th><th>작업일</th><th /></tr></thead>
            <tbody>
              {visible.map((item) => <tr key={item.case_id}>
                <td className="font-bold text-primary-700">{item.case_id}</td><td>{item.project_id}</td><td><IssueBadge value={item.issue_type} /></td><td><p className="line-clamp-2 max-w-md text-slate-600">{item.comment_text}</p></td><td><ActionBadge value={item.action} /></td><td>{isVariant(item) ? <Badge tone="red">다름 · 질문 필요</Badge> : <Badge tone="green">패턴 범위</Badge>}</td><td><OutcomeBadge value={item.outcome} /></td><td className="whitespace-nowrap text-muted">{item.created_at}</td><td><Button asChild variant="ghost" size="sm"><Link href={`/work/${item.case_id}`} aria-label={`${item.case_id} 상세 보기`}><ArrowRight className="size-4" /></Link></Button></td>
              </tr>)}
              {!visible.length && <tr><td colSpan={9} className="py-12 text-center text-muted">조건에 맞는 Case가 없습니다.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
      <p className="mt-4 text-xs text-muted">백엔드에 연결되지 않으면 화면 확인용 대표 데이터가 표시됩니다. Pattern/Gap 판단은 실제 실행 시 Spring Boot에서 계산됩니다.</p>
    </>
  );
}

