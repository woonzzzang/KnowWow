import {Badge} from "@/components/ui/badge";
import {ACTION_LABELS, ISSUE_LABELS, OUTCOME_LABELS, labelOf} from "@/lib/labels";

export function IssueBadge({value}: {value: string}) {
  const tone = value === "MATERIAL_ISSUE" ? "red" : value === "DRAWING_ERROR" ? "purple" : value === "SPEC_CONFLICT" ? "amber" : "green";
  return <Badge tone={tone}>{labelOf(ISSUE_LABELS, value)}</Badge>;
}

export function ActionBadge({value}: {value: string}) {
  const tone = value === "DRAWING_REVISION" ? "purple" : value === "MATERIAL_REQUEST" ? "red" : value === "REQUEST_CLARIFICATION" ? "amber" : "blue";
  return <Badge tone={tone}>{labelOf(ACTION_LABELS, value)}</Badge>;
}

export function OutcomeBadge({value}: {value: string}) {
  const tone = value === "ACCEPTED" ? "green" : value === "REJECTED" ? "red" : "amber";
  return <Badge tone={tone}>{labelOf(OUTCOME_LABELS, value)}</Badge>;
}

