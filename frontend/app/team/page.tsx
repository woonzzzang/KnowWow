"use client";

import {Network, Users} from "lucide-react";
import {useEffect, useState} from "react";

import {ActionBadge, IssueBadge} from "@/components/status-badges";
import {Badge} from "@/components/ui/badge";
import {Card} from "@/components/ui/card";
import {PageHeader} from "@/components/page-header";
import {getPatterns} from "@/lib/api";
import {ACTION_LABELS, labelOf} from "@/lib/labels";
import type {OrganizationPattern} from "@/lib/types";

export default function TeamPage() {
  const [patterns, setPatterns] = useState<OrganizationPattern[]>([]);
  useEffect(() => { getPatterns().then(setPatterns); }, []);

  return (
    <>
      <PageHeader eyebrow="Team Knowledge" title="팀의 관찰 패턴을 비교하세요" description="여러 Case에서 반복된 처리 경향입니다. 개인의 예외 판단을 지우거나 업무 규칙으로 단정하지 않습니다." />
      <div className="mb-5 grid gap-4 sm:grid-cols-3"><Card className="p-5"><p className="text-sm font-semibold text-muted">관찰된 전체 Case</p><p className="mt-2 text-3xl font-extrabold">24</p></Card><Card className="p-5"><p className="text-sm font-semibold text-muted">안정 패턴</p><p className="mt-2 text-3xl font-extrabold">{patterns.filter((item) => item.stable).length}</p></Card><Card className="p-5"><p className="text-sm font-semibold text-muted">참여 담당자</p><p className="mt-2 text-3xl font-extrabold">3</p></Card></div>
      <Card className="overflow-hidden"><div className="flex items-center justify-between border-b border-line px-6 py-5"><div><h2 className="font-bold">Pattern 목록</h2><p className="mt-1 text-sm text-muted">Spring Boot가 동일 Context별 Action 분포를 계산합니다.</p></div><Badge tone="blue"><Network className="mr-1 size-3" /> DETERMINISTIC</Badge></div><div className="overflow-x-auto"><table className="data-table min-w-[920px]"><thead><tr><th>Pattern ID</th><th>상황</th><th>Context</th><th>관찰된 Action</th><th>Support</th><th>담당자</th><th>상태</th></tr></thead><tbody>{patterns.map((pattern) => <tr key={pattern.pattern_id}><td className="font-bold text-primary-700">{pattern.pattern_id}</td><td><IssueBadge value={pattern.signature.issue_type} /></td><td className="text-sm text-slate-600">{pattern.signature.equipment}<br /><span className="text-xs text-muted">자재 {pattern.signature.material_status} · 도면 {pattern.signature.drawing_status}</span></td><td><div className="space-y-1.5">{Object.entries(pattern.action_distribution).map(([action, count]) => <div key={action} className="flex items-center gap-2"><ActionBadge value={action} /><span className="text-xs font-semibold text-muted">{count}건</span>{action === pattern.majority_action && <span className="text-[11px] text-primary-600">가장 많이 관찰됨</span>}</div>)}</div></td><td><strong>{pattern.support_count}건</strong><p className="text-xs text-muted">{Math.round(pattern.majority_ratio * 100)}%</p></td><td><span className="inline-flex items-center gap-1.5 text-sm"><Users className="size-4 text-slate-400" /> {pattern.employee_ids.length || 3}명</span></td><td><Badge tone={pattern.stable ? "green" : "amber"}>{pattern.stable ? "STABLE" : "OBSERVED"}</Badge></td></tr>)}</tbody></table></div></Card>
      <p className="mt-4 text-xs text-muted">“가장 많이 관찰된 Action”은 {labelOf(ACTION_LABELS, "TRANSFER_TO_PRODUCTION")} 같은 과거 빈도를 뜻하며 추천 정답이 아닙니다.</p>
    </>
  );
}

