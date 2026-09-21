"use client";

import {Bot, Braces, Database, LoaderCircle, Search, Send, ShieldCheck, UserRound} from "lucide-react";
import {FormEvent, useState} from "react";

import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card} from "@/components/ui/card";
import {PageHeader} from "@/components/page-header";
import {askAgent} from "@/lib/api";

type Message = {role: "assistant" | "user"; content: string; evidence?: string[]; tools?: string[]};

const initial: Message = {
  role: "assistant",
  content: "과거 Case, 사람이 확인한 Personal Knowledge, 코드로 집계된 Organization Pattern을 구분해 검색합니다. 제조 업무 상황을 입력해주세요.",
};

export default function AgentPage() {
  const [messages, setMessages] = useState<Message[]>([initial]);
  const [query, setQuery] = useState("설치 누락인데 자재와 도면은 정상입니다. 추가로 무엇을 확인할 수 있나요?");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    const text = query.trim(); if (!text || loading) return;
    setMessages((current) => [...current, {role: "user", content: text}]); setQuery(""); setLoading(true); setError("");
    try {
      const response = await askAgent(text);
      setMessages((current) => [...current, {role: "assistant", content: response.answer, evidence: response.evidence_ids, tools: response.used_tools}]);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Agent 응답 생성에 실패했습니다."); }
    finally { setLoading(false); }
  }

  return (
    <>
      <PageHeader eyebrow="Knowledge Agent" title="근거를 찾고, 검토할 조건을 제안합니다" description="Agent는 답을 정해주지 않습니다. 과거 사례와 확인된 경험지식을 찾아 현재 판단에 참고할 차이를 보여줍니다." />
      <div className="grid gap-6 xl:grid-cols-[1fr_280px]">
        <Card className="overflow-hidden"><div className="flex items-center justify-between border-b border-line px-6 py-4"><div className="flex items-center gap-3"><span className="rounded-xl bg-primary-600 p-2.5 text-white"><Bot className="size-5" /></span><div><strong className="block text-sm">KnowFlow Agent</strong><span className="flex items-center gap-1.5 text-xs text-emerald-600"><i className="size-2 rounded-full bg-emerald-500" /> 검색 준비됨</span></div></div><Badge tone="blue">TOOL CALLING</Badge></div><div className="min-h-[520px] space-y-5 bg-slate-50/60 p-6">{messages.map((message, index) => <div key={index} className={`flex gap-3 ${message.role === "user" ? "justify-end" : ""}`}>{message.role === "assistant" && <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-600 text-white"><Bot className="size-4" /></span>}<div className={`max-w-3xl rounded-2xl p-4 text-sm leading-7 ${message.role === "user" ? "rounded-tr-sm bg-slate-800 text-white" : "rounded-tl-sm border border-line bg-white text-slate-700 shadow-sm"}`}><div className="whitespace-pre-wrap">{message.content}</div>{message.tools?.length ? <div className="mt-4 border-t border-line pt-3"><p className="mb-2 text-xs font-bold text-slate-400">사용한 LangChain Tools</p><div className="flex flex-wrap gap-2">{message.tools.map((tool) => <Badge key={tool} tone="gray"><Braces className="mr-1 size-3" />{tool}</Badge>)}</div></div> : null}{message.evidence?.length ? <div className="mt-3 flex flex-wrap gap-2">{message.evidence.map((id) => <Badge key={id} tone="blue"><ShieldCheck className="mr-1 size-3" />{id}</Badge>)}</div> : null}</div>{message.role === "user" && <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-800 text-white"><UserRound className="size-4" /></span>}</div>)}{loading && <div className="flex gap-3"><span className="flex size-9 items-center justify-center rounded-full bg-primary-600 text-white"><Bot className="size-4" /></span><div className="rounded-2xl rounded-tl-sm border border-line bg-white p-4 text-sm text-muted"><LoaderCircle className="mr-2 inline size-4 animate-spin" /> 관련 Case와 Pattern을 검색하고 있습니다.</div></div>}{error && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">{error}<br /><span className="text-xs">루트 `.env`에 API 키를 입력하고 Backend와 AI Service를 실행했는지 확인해주세요.</span></div>}</div><form onSubmit={submit} className="flex gap-2 border-t border-line bg-white p-4"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="업무 상황을 자유롭게 질문하세요" className="h-11 flex-1 rounded-xl border border-line px-4 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100" /><Button type="submit" disabled={!query.trim() || loading}><Send className="size-4" /> 전송</Button></form></Card>

        <div className="space-y-4"><Card className="p-5"><h2 className="flex items-center gap-2 text-sm font-bold"><Search className="size-4 text-primary-600" /> 검색 범위</h2><div className="mt-4 space-y-3">{[{label:"Past Case",note:"실제 업무 기록"},{label:"Personal Knowledge",note:"사람 확인 지식"},{label:"Organization Pattern",note:"코드 집계 결과"}].map((item) => <div key={item.label} className="rounded-xl border border-line bg-slate-50 p-3"><strong className="text-xs">{item.label}</strong><p className="mt-1 text-xs text-muted">{item.note}</p></div>)}</div></Card><Card className="p-5"><h2 className="flex items-center gap-2 text-sm font-bold"><Database className="size-4 text-violet-600" /> 답변 원칙</h2><ul className="mt-4 space-y-3 text-xs leading-5 text-muted"><li>• 검색되지 않은 이유는 생성하지 않음</li><li>• Pattern과 확정 지식을 구분</li><li>• 모든 Evidence ID를 서버에서 검증</li><li>• 결정이 아닌 검토 제안 제공</li></ul></Card></div>
      </div>
    </>
  );
}

