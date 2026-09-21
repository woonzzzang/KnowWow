"use client";

import Link from "next/link";
import {usePathname} from "next/navigation";
import {BookOpenCheck, Bot, ChevronDown, Factory, Gauge, Menu, PanelLeftClose, Users, X} from "lucide-react";
import {useState} from "react";

import {cn} from "@/lib/cn";

const navigation = [
  {href: "/", label: "대시보드", helper: "전체 현황", icon: Gauge},
  {href: "/work", label: "My Work", helper: "내 업무 처리", icon: Factory},
  {href: "/knowledge", label: "My Knowledge", helper: "나의 지식", icon: BookOpenCheck},
  {href: "/team", label: "Team Knowledge", helper: "조직 지식", icon: Users},
  {href: "/agent", label: "Knowledge Agent", helper: "AI에게 질문하기", icon: Bot},
];

export function AppShell({children}: {children: React.ReactNode}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center border-b border-line bg-white/95 px-4 backdrop-blur lg:px-7">
        <button className="mr-3 rounded-lg p-2 text-muted hover:bg-slate-100 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="메뉴 열기">
          <Menu className="size-5" />
        </button>
        <Link href="/" className="flex items-center gap-3" aria-label="KnowFlow 홈">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary-600 text-white shadow-sm">
            <PanelLeftClose className="size-5" />
          </span>
          <span className="text-xl font-extrabold tracking-tight text-primary-700">KnowFlow</span>
          <span className="hidden text-sm text-muted md:inline">현장의 경험이, 모두의 지식이 되는 제조 지식 플랫폼</span>
        </Link>
        <div className="ml-auto flex items-center gap-3 rounded-xl border border-line bg-white px-3 py-2">
          <span className="flex size-8 items-center justify-center rounded-full bg-primary-50 text-sm font-bold text-primary-700">김</span>
          <span className="hidden text-left sm:block">
            <strong className="block text-sm leading-none">김설계</strong>
            <small className="mt-1 block text-[11px] text-muted">EMP-001 · Senior</small>
          </span>
          <ChevronDown className="size-4 text-muted" />
        </div>
      </header>

      {mobileOpen && <button className="fixed inset-0 z-40 bg-slate-950/35 lg:hidden" onClick={() => setMobileOpen(false)} aria-label="메뉴 닫기" />}
      <aside className={cn("fixed bottom-0 left-0 top-16 z-50 w-64 border-r border-line bg-white p-4 transition-transform lg:translate-x-0", mobileOpen ? "translate-x-0" : "-translate-x-full")}>
        <div className="mb-4 flex items-center justify-between px-2 lg:hidden">
          <span className="font-bold">메뉴</span>
          <button className="rounded-lg p-2 hover:bg-slate-100" onClick={() => setMobileOpen(false)} aria-label="메뉴 닫기"><X className="size-5" /></button>
        </div>
        <nav className="space-y-1.5">
          {navigation.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className={cn("group flex items-center gap-3 rounded-xl px-3 py-3 transition", active ? "bg-primary-50 text-primary-700" : "text-slate-600 hover:bg-slate-50 hover:text-ink")}>
                <item.icon className={cn("size-5", active ? "text-primary-600" : "text-slate-400 group-hover:text-slate-600")} />
                <span>
                  <strong className="block text-sm font-semibold">{item.label}</strong>
                  <small className={cn("block text-[11px]", active ? "text-primary-500" : "text-slate-400")}>{item.helper}</small>
                </span>
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-5 left-4 right-4 rounded-xl border border-blue-100 bg-blue-50 p-3">
          <div className="mb-1 flex items-center gap-2 text-xs font-bold text-primary-700"><span className="size-2 rounded-full bg-emerald-500" /> 시스템 원칙</div>
          <p className="text-xs leading-5 text-slate-600">패턴은 정답이 아닙니다. 사람이 확인한 지식만 저장합니다.</p>
        </div>
      </aside>

      <main className="min-h-screen pt-16 lg:pl-64">
        <div className="mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}

