import type {HTMLAttributes} from "react";
import {cn} from "@/lib/cn";

type Tone = "blue" | "green" | "amber" | "red" | "purple" | "gray";

const tones: Record<Tone, string> = {
  blue: "bg-blue-50 text-blue-700 ring-blue-200",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  amber: "bg-amber-50 text-amber-700 ring-amber-200",
  red: "bg-rose-50 text-rose-700 ring-rose-200",
  purple: "bg-violet-50 text-violet-700 ring-violet-200",
  gray: "bg-slate-50 text-slate-600 ring-slate-200",
};

export function Badge({className, tone = "gray", ...props}: HTMLAttributes<HTMLSpanElement> & {tone?: Tone}) {
  return <span className={cn("inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ring-1 ring-inset", tones[tone], className)} {...props} />;
}

