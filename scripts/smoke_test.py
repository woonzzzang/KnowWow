#!/usr/bin/env python3
"""API smoke test that works before an LLM key is configured."""

from __future__ import annotations

import json
import sys
import urllib.error
import urllib.request


BACKEND = "http://localhost:8080"
AI_SERVICE = "http://localhost:8000"


def get_json(url: str) -> object:
    with urllib.request.urlopen(url, timeout=5) as response:
        return json.load(response)


def main() -> int:
    health = get_json(f"{AI_SERVICE}/health")
    dashboard = get_json(f"{BACKEND}/api/dashboard?employeeId=EMP-001")
    gap = get_json(f"{BACKEND}/api/cases/CASE-008/gap")
    patterns = get_json(f"{BACKEND}/api/organization/patterns")

    assert health["status"] == "ok"
    assert dashboard["total_case_count"] == 24
    assert gap["requires_interview"] is True
    assert gap["status"] == "ACTION_VARIANT"
    assert len(patterns) == 4

    print("OK  AI Service health")
    print("OK  24 synthetic cases loaded")
    print("OK  CASE-008 detected as ACTION_VARIANT")
    print("OK  4 organization patterns mined")
    print(f"INFO LLM configured: {health['configured']}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (AssertionError, urllib.error.URLError, KeyError) as error:
        print(f"Smoke test failed: {error}", file=sys.stderr)
        raise SystemExit(1)
