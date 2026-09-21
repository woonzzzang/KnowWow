#!/usr/bin/env python3
"""Validate that the synthetic dataset demonstrates the intended decisions."""

from __future__ import annotations

import json
from collections import Counter, defaultdict
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"


def load(name: str):
    with (DATA / name).open(encoding="utf-8") as stream:
        return json.load(stream)


def signature(case: dict) -> tuple[str, ...]:
    context = case["context"]
    return (
        case["issue_type"],
        case["equipment"],
        case["system"],
        context["material_status"],
        context["drawing_status"],
    )


def main() -> None:
    employees = load("employees.json")
    cases = load("comment_cases.json")
    scenarios = load("demo_scenarios.json")

    grouped: dict[tuple[str, ...], list[dict]] = defaultdict(list)
    for case in cases:
        grouped[signature(case)].append(case)

    stable_patterns = []
    gap_candidates = []
    for group in grouped.values():
        counts = Counter(item["action"] for item in group)
        majority_action, majority_count = counts.most_common(1)[0]
        ratio = majority_count / len(group)
        if len(group) >= 3 and ratio >= 0.67:
            stable_patterns.append(group)
            gap_candidates.extend(item for item in group if item["action"] != majority_action)

    employee_counts = Counter(case["employee_id"] for case in cases)
    outcomes = Counter(case["outcome"] for case in cases)
    issue_types = {case["issue_type"] for case in cases}

    checks = {
        "employees >= 3": len(employees) >= 3,
        "cases >= 24": len(cases) >= 24,
        "issue types >= 4": len(issue_types) >= 4,
        "stable patterns >= 3": len(stable_patterns) >= 3,
        "gap candidates >= 3": len(gap_candidates) >= 3,
        "each employee has >= 5 cases": min(employee_counts.values()) >= 5,
        "outcomes are mixed": all(outcomes[key] > 0 for key in ("ACCEPTED", "REJECTED", "PENDING")),
        "same context has different actions": any(
            len({item["action"] for item in group}) > 1 for group in grouped.values()
        ),
        "hidden-context demos >= 3": len(scenarios) >= 3,
    }

    for label, passed in checks.items():
        print(f"[{'PASS' if passed else 'FAIL'}] {label}")

    if not all(checks.values()):
        raise SystemExit("Synthetic dataset validation failed")

    print(
        f"Validated {len(cases)} cases, {len(stable_patterns)} stable patterns, "
        f"{len(gap_candidates)} action variants. Outcomes={dict(outcomes)}"
    )


if __name__ == "__main__":
    main()

