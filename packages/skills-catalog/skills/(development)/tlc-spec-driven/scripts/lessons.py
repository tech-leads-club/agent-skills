#!/usr/bin/env python3
"""
lessons.py — deterministic bookkeeping for the tlc-spec-driven lessons layer.

The LLM supplies judgment (which failure happened, how to phrase the lesson, what
signal grounds it). This script owns everything mechanical: IDs, distinct-feature
recurrence counting, candidate->confirmed promotion, pruning, demotion, and
rendering the human/agent-readable playbook. Bookkeeping by hand is exactly what
rots a lessons file, so it lives here, not in a prompt.

Canonical state:  .specs/lessons.json   (machine-owned — do NOT hand-edit)
Rendered view:    .specs/LESSONS.md      (regenerated on every write)

Pure standard library. No dependencies. Run from the project root (the dir that
contains .specs), or pass --root.

Commands:
  add        Record a grounded lesson from a verification signal.
  list       Print lessons (default: confirmed) for loading at Specify/Design.
  penalize   Mark a confirmed lesson as having failed when applied (-> quarantine).
  prune      Drop stale uncorroborated candidates (also runs automatically on add/list).
  status     Print counts (used by the self-check in validate.md).
  init       Create empty store + rendered file.

Exit codes: 0 ok, 2 usage/validation error (e.g. missing grounding).
"""

import argparse
import datetime as _dt
import json
import os
import re
import sys

STORE_REL = os.path.join(".specs", "lessons.json")
RENDER_REL = os.path.join(".specs", "LESSONS.md")

SIGNALS = {
    "ac_gap": "Acceptance criterion not covered / failed",
    "surviving_mutant": "Discrimination sensor mutant survived (weak test)",
    "spec_precision_gap": "Spec did not define a precise outcome",
    "spec_deviation": "Implementation diverged from spec/design (SPEC_DEVIATION)",
    "gate_fail": "Build-level gate check failed",
}

DEFAULTS = {"promote_threshold": 2, "window_days": 45, "quarantine_threshold": 2}


def _now():
    return _dt.datetime.now(_dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _parse_date(s):
    try:
        return _dt.datetime.strptime(s, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=_dt.timezone.utc)
    except Exception:
        return _dt.datetime.now(_dt.timezone.utc)


def _store_path(root):
    return os.path.join(root, STORE_REL)


def _render_path(root):
    return os.path.join(root, RENDER_REL)


def _load(root):
    path = _store_path(root)
    if not os.path.exists(path):
        return {
            "schema": 1,
            "promote_threshold": DEFAULTS["promote_threshold"],
            "window_days": DEFAULTS["window_days"],
            "quarantine_threshold": DEFAULTS["quarantine_threshold"],
            "next_id": 1,
            "lessons": [],
        }
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    for k, v in DEFAULTS.items():
        data.setdefault(k, v)
    data.setdefault("schema", 1)
    data.setdefault("next_id", 1)
    data.setdefault("lessons", [])
    return data


def _save(root, data):
    os.makedirs(os.path.join(root, ".specs"), exist_ok=True)
    with open(_store_path(root), "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")
    _render(root, data)


def _norm(text):
    """Normalized dedup key: lowercase, strip punctuation, collapse whitespace.
    Exact-after-normalization only — no semantic matching (stdlib-only limitation).
    Phrase lessons tersely and canonically so recurrences actually merge."""
    t = text.lower().strip()
    t = re.sub(r"[^a-z0-9\s]", " ", t)
    t = re.sub(r"\s+", " ", t).strip()
    return t


def _key(signal, text):
    return signal + "::" + _norm(text)


def _auto_prune(data):
    """Drop candidates that never recurred within the window. Mutates data."""
    threshold = data["promote_threshold"]
    window = data["window_days"]
    now = _dt.datetime.now(_dt.timezone.utc)
    kept = []
    dropped = []
    for l in data["lessons"]:
        if l["status"] == "candidate" and l["recurrence"] < threshold:
            age_days = (now - _parse_date(l.get("last_seen", l.get("created", _now())))).days
            if age_days > window:
                dropped.append(l["id"])
                continue
        kept.append(l)
    data["lessons"] = kept
    return dropped


def _find(data, signal, text):
    k = _key(signal, text)
    for l in data["lessons"]:
        if l.get("key") == k:
            return l
    return None


def _render(root, data):
    lines = []
    lines.append("# LESSONS — auto-maintained by scripts/lessons.py")
    lines.append("")
    lines.append("> Machine-owned. Do NOT hand-edit. Changes are overwritten on the next `lessons.py` write.")
    lines.append("> Canonical state lives in `.specs/lessons.json`. Edit lessons only via the script.")
    lines.append(f"> promote_threshold={data['promote_threshold']} distinct features · window_days={data['window_days']} · quarantine_threshold={data['quarantine_threshold']}")
    lines.append("")

    by_status = {"confirmed": [], "candidate": [], "quarantined": []}
    for l in data["lessons"]:
        by_status.get(l["status"], by_status["candidate"]).append(l)

    def block(title, items, note):
        out = [f"## {title}", ""]
        if note:
            out.append(note)
            out.append("")
        if not items:
            out.append("_none_")
            out.append("")
            return out
        for l in sorted(items, key=lambda x: x["id"]):
            scope = f" · scope: `{l['scope']}`" if l.get("scope") else ""
            out.append(f"### {l['id']} — {l['text']}")
            out.append(
                f"- signal: `{l['signal']}` · recurrence: {l['recurrence']} feature(s){scope} · harmful: {l.get('harmful', 0)}"
            )
            feats = ", ".join(l.get("features", [])) or "—"
            out.append(f"- features: {feats}")
            ev = l.get("evidence", [])
            if ev:
                out.append(f"- evidence: {ev[0]}" + (f" (+{len(ev) - 1} more)" if len(ev) > 1 else ""))
            out.append(f"- last seen: {l.get('last_seen', '—')}")
            out.append("")
        return out

    lines += block(
        "Confirmed (load these at Specify/Design)",
        by_status["confirmed"],
        "Corroborated across multiple features. Safe to apply as guidance.",
    )
    lines += block(
        "Candidates (under observation — do NOT load as guidance yet)",
        by_status["candidate"],
        "Seen once or not yet corroborated. Tracked, not trusted.",
    )
    lines += block(
        "Quarantined (failed when applied — ignore)",
        by_status["quarantined"],
        "A confirmed lesson that recurred alongside failure. Kept for the maintainer to review.",
    )

    with open(_render_path(root), "w", encoding="utf-8") as f:
        f.write("\n".join(lines).rstrip() + "\n")


# ----------------------------- commands -----------------------------

def cmd_init(root, args):
    data = _load(root)
    _save(root, data)
    print(f"Initialized lessons store at {_store_path(root)} and {_render_path(root)}")
    return 0


def cmd_add(root, args):
    signal = args.signal
    source = (args.source or "").strip()
    text = (args.text or "").strip()
    feature = (args.feature or "").strip()

    # Grounding is enforced here, deterministically — not left to the prompt.
    if signal not in SIGNALS:
        print(f"ERROR: --signal must be one of {sorted(SIGNALS)}", file=sys.stderr)
        return 2
    if not feature:
        print("ERROR: --feature is required (the feature the signal came from).", file=sys.stderr)
        return 2
    if not source:
        print("ERROR: --source is required (file:line / AC id / mutant id / SPEC_DEVIATION ref).", file=sys.stderr)
        print("       A lesson with no grounding in validation.md is an opinion, not a lesson. Refused.", file=sys.stderr)
        return 2
    if len(text) < 12:
        print("ERROR: --text too short. State the actionable lesson in one terse sentence.", file=sys.stderr)
        return 2

    data = _load(root)
    _auto_prune(data)
    existing = _find(data, signal, text)
    now = _now()

    if existing:
        if feature not in existing["features"]:
            existing["features"].append(feature)
        existing["recurrence"] = len(existing["features"])
        existing["last_seen"] = now
        ev = source if not args.scope else f"{source} ({args.scope})"
        if ev not in existing["evidence"]:
            existing["evidence"].append(ev)
        promoted = False
        if existing["status"] == "candidate" and existing["recurrence"] >= data["promote_threshold"]:
            existing["status"] = "confirmed"
            promoted = True
        _save(root, data)
        msg = f"UPDATED {existing['id']} (recurrence={existing['recurrence']}, status={existing['status']})"
        if promoted:
            msg += " — PROMOTED to confirmed"
        print(msg)
    else:
        lid = f"L-{data['next_id']:03d}"
        data["next_id"] += 1
        data["lessons"].append(
            {
                "id": lid,
                "key": _key(signal, text),
                "text": text,
                "signal": signal,
                "scope": (args.scope or "").strip(),
                "status": "candidate",
                "features": [feature],
                "recurrence": 1,
                "harmful": 0,
                "evidence": [source if not args.scope else f"{source} ({args.scope})"],
                "created": now,
                "last_seen": now,
            }
        )
        _save(root, data)
        print(f"ADDED {lid} (status=candidate, recurrence=1)")
    return 0


def cmd_penalize(root, args):
    data = _load(root)
    target = None
    for l in data["lessons"]:
        if l["id"].lower() == args.id.lower():
            target = l
            break
    if not target:
        print(f"ERROR: no lesson with id {args.id}", file=sys.stderr)
        return 2
    target["harmful"] = target.get("harmful", 0) + 1
    target["last_seen"] = _now()
    if target["harmful"] >= data["quarantine_threshold"]:
        target["status"] = "quarantined"
    _save(root, data)
    print(f"PENALIZED {target['id']} (harmful={target['harmful']}, status={target['status']})")
    return 0


def cmd_list(root, args):
    data = _load(root)
    if _auto_prune(data):
        _save(root, data)
    want = args.status
    q = (args.query or "").lower().strip()
    scope = (args.scope or "").lower().strip()
    rows = []
    for l in data["lessons"]:
        if want != "all" and l["status"] != want:
            continue
        if q and q not in l["text"].lower():
            continue
        if scope and scope not in (l.get("scope", "").lower()):
            continue
        rows.append(l)
    if not rows:
        print(f"(no {want} lessons" + (f" matching '{q or scope}'" if (q or scope) else "") + ")")
        return 0
    for l in sorted(rows, key=lambda x: x["id"]):
        sc = f" [scope:{l['scope']}]" if l.get("scope") else ""
        print(f"{l['id']} ({l['status']}, x{l['recurrence']}){sc}: {l['text']}")
    return 0


def cmd_prune(root, args):
    data = _load(root)
    dropped = _auto_prune(data)
    _save(root, data)
    print(f"Pruned {len(dropped)} stale candidate(s): {', '.join(dropped) if dropped else '—'}")
    return 0


def cmd_status(root, args):
    data = _load(root)
    counts = {"confirmed": 0, "candidate": 0, "quarantined": 0}
    for l in data["lessons"]:
        counts[l["status"]] = counts.get(l["status"], 0) + 1
    total = len(data["lessons"])
    print(f"lessons: {total} total | confirmed={counts['confirmed']} candidate={counts['candidate']} quarantined={counts['quarantined']}")
    return 0


def main(argv=None):
    p = argparse.ArgumentParser(prog="lessons.py", description="Deterministic lessons bookkeeping for tlc-spec-driven.")
    p.add_argument("--root", default=".", help="Project root containing .specs/ (default: current dir)")
    sub = p.add_subparsers(dest="cmd", required=True)

    sp = sub.add_parser("init", help="Create empty store + rendered file")
    sp.set_defaults(fn=cmd_init)

    sp = sub.add_parser("add", help="Record a grounded lesson")
    sp.add_argument("--feature", required=True)
    sp.add_argument("--signal", required=True, choices=sorted(SIGNALS))
    sp.add_argument("--source", required=True, help="file:line / AC id / mutant id / SPEC_DEVIATION ref")
    sp.add_argument("--text", required=True, help="One terse, actionable sentence")
    sp.add_argument("--scope", default="", help="Optional: path/layer/tag for retrieval filtering")
    sp.set_defaults(fn=cmd_add)

    sp = sub.add_parser("penalize", help="Mark a confirmed lesson as failed-when-applied")
    sp.add_argument("--id", required=True)
    sp.set_defaults(fn=cmd_penalize)

    sp = sub.add_parser("list", help="Print lessons for loading")
    sp.add_argument("--status", default="confirmed", choices=["confirmed", "candidate", "quarantined", "all"])
    sp.add_argument("--query", default="", help="Substring filter on lesson text")
    sp.add_argument("--scope", default="", help="Substring filter on scope")
    sp.set_defaults(fn=cmd_list)

    sp = sub.add_parser("prune", help="Drop stale uncorroborated candidates")
    sp.set_defaults(fn=cmd_prune)

    sp = sub.add_parser("status", help="Print counts")
    sp.set_defaults(fn=cmd_status)

    args = p.parse_args(argv)
    root = os.path.abspath(args.root)
    return args.fn(root, args)


if __name__ == "__main__":
    raise SystemExit(main())
