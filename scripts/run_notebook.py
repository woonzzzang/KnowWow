#!/usr/bin/env python3
"""Execute the existing submission notebook without regenerating its source cells."""

from __future__ import annotations

from contextlib import redirect_stderr, redirect_stdout
from io import StringIO
import json
import os
from pathlib import Path
import sys
import tempfile


ROOT = Path(__file__).resolve().parents[1]
NOTEBOOK = ROOT / "제출파일" / "3반_정다운_KnowWow.ipynb"


def main() -> None:
    notebook = json.loads(NOTEBOOK.read_text(encoding="utf-8"))
    # Pydantic resolves forward references via the defining module's globals.
    namespace = sys.modules["__main__"].__dict__
    os.chdir(ROOT)
    execution_count = 0

    for index, cell in enumerate(notebook["cells"]):
        if cell["cell_type"] != "code":
            continue
        execution_count += 1
        source = cell["source"]
        if isinstance(source, list):
            source = "".join(source)
        stdout = StringIO()
        stderr = StringIO()
        try:
            with redirect_stdout(stdout), redirect_stderr(stderr):
                exec(compile(source, f"notebook cell {index}", "exec"), namespace)
        except Exception as exc:
            raise RuntimeError(f"Notebook cell {index} failed; original notebook was not overwritten") from exc

        outputs = []
        if stdout.getvalue():
            outputs.append({"output_type": "stream", "name": "stdout", "text": stdout.getvalue().splitlines(keepends=True)})
        if stderr.getvalue():
            outputs.append({"output_type": "stream", "name": "stderr", "text": stderr.getvalue().splitlines(keepends=True)})
        cell["execution_count"] = execution_count
        cell["outputs"] = outputs
        print(f"Executed cell {index} ({execution_count})")

    notebook["metadata"]["language_info"]["version"] = ".".join(map(str, sys.version_info[:3]))
    rendered = json.dumps(notebook, ensure_ascii=False, indent=1) + "\n"
    with tempfile.NamedTemporaryFile("w", encoding="utf-8", dir=ROOT, prefix=".knowwow-", suffix=".ipynb", delete=False) as temporary:
        temporary.write(rendered)
        temporary_path = Path(temporary.name)
    temporary_path.replace(NOTEBOOK)
    print(f"Saved actual outputs to {NOTEBOOK.name}")


if __name__ == "__main__":
    main()
