#!/usr/bin/env python3
"""Golden checks for Track A report shape (harness-eval skill)."""

from __future__ import annotations

import json
import subprocess
import sys
import tempfile
from pathlib import Path

SCRIPT = Path(__file__).resolve().parent / "track_a_correctness.py"
INVENTORY = Path(__file__).resolve().parent / "inventory_extract.py"


def run_track_a(root: Path, run_id: str) -> Path:
    proc = subprocess.run(
        [sys.executable, str(SCRIPT), "--root", str(root), "--run-id", run_id],
        capture_output=True,
        text=True,
    )
    if proc.returncode != 0:
        raise RuntimeError(proc.stderr or proc.stdout)
    return root / ".harness-eval" / "runs" / run_id / "04-correctness.md"


def test_report_shape() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        (root / "AGENTS.md").write_text(
            "\n".join(
                [
                    "# Agent guide",
                    "",
                    "See `docs/guide/missing.md` for the check catalog.",
                    "Run `npm run missing-script` before commit.",
                    "",
                ]
            ),
            encoding="utf-8",
        )
        (root / "package.json").write_text(
            json.dumps({"scripts": {"test": "vitest run"}}, indent=2) + "\n",
            encoding="utf-8",
        )
        run_id = "test-track-a-devex"
        out_dir = root / ".harness-eval" / "runs" / run_id
        out_dir.mkdir(parents=True)
        inventory = {
            "t0": ["AGENTS.md"],
            "t1": [],
            "t2": [],
            "manifests": ["package.json"],
            "manifest_commands": ["test"],
        }
        (out_dir / "inventory.json").write_text(json.dumps(inventory, indent=2) + "\n")

        report_path = run_track_a(root, run_id)
        report = report_path.read_text(encoding="utf-8")
        data = json.loads((out_dir / "04-correctness.json").read_text(encoding="utf-8"))

        required_headings = [
            "## At a glance",
            "## What to do next",
            "## Problems (",
            "## Checked and OK (",
            "## What was scanned",
            "## How this check works",
        ]
        for heading in required_headings:
            assert heading in report, f"missing heading: {heading}"

        assert "What these words mean" not in report.split("## How this check works")[0], (
            "glossary must not appear before How this check works"
        )
        assert len(data) >= 2, "expected path + command findings"
        assert all("claim" in row and "evidence" in row for row in data)
        assert any(row.get("kind") == "command" for row in data)
        assert any(row.get("kind") == "path" for row in data)
        assert any(row.get("action") for row in data)
        assert "Do this:" in report
        assert "Known scripts:" in report


def main() -> int:
    test_report_shape()
    print("OK: track_a report shape")
    return 0


if __name__ == "__main__":
    sys.exit(main())
