#!/usr/bin/env python3
"""
lint_prose.py - hold the skill's own text to its writing rules.

The reader of this skill is a model with nobody beside it to ask what a sentence meant. Short
sentences, one term per thing and no ambiguous punctuation leave it less to guess. Every rule here is
a count or an exact match, so the result is the same on every run.

Rules (prose only: fenced blocks, headings, front matter, HTML comments and inline code are skipped):
  W1  a sentence over 20 words
  W2  a paragraph, list item or table cell over 6 sentences
  W3  a semicolon (two sentences joined into one)
  W4  e.g., i.e., etc., vs. or cf. (an abbreviation whose period reads as the end of a sentence)
  W5  an em dash or an en dash (a sentence that wants splitting)
  W6  a term outside the glossary below, where the skill uses one name for one thing

Usage:
  python3 <skill-dir>/scripts/lint_prose.py FILE [FILE ...]
  python3 <skill-dir>/scripts/lint_prose.py --skill        (this skill's SKILL.md and references/*.md)

Exit codes: 0 clean, 1 findings, 2 usage error.
"""

import argparse
import glob
import os
import re
import sys

from specs import Doc

MAX_WORDS, MAX_SENTENCES = 20, 6
GLOSSARY = [
    (r"\bsubagents?\b", "sub-agent"),
    (r"\bACs?\b", "criterion"),
    (r"\bacceptance criteri(on|a)\b", "criterion"),
    (r"\bhuman\b", "user"),
    (r"\bimplementers?\b", "author"),
    (r"\bbuilders?\b", "author"),
]
ABBREV_RE = re.compile(r"\b(e\.g|i\.e|etc|vs|cf)\.", re.IGNORECASE)
LIST_RE = re.compile(r"^\s*([-*+]|\d+[.)])\s+")


def blocks(doc):
    """(first line number, text) for each paragraph, list item and table cell outside fenced blocks."""
    out, cur, start, front = [], [], 0, False
    lines = doc.lines
    if lines and lines[0].strip() == "---":
        front = True

    def flush():
        if cur:
            out.append((start, " ".join(cur)))
        cur.clear()

    in_comment = False
    for i, ln in enumerate(lines):
        s = ln.strip()
        if front:
            if i > 0 and s == "---":
                front = False
            continue
        if "<!--" in s:
            in_comment = "-->" not in s
            flush()
            continue
        if in_comment:
            in_comment = "-->" not in s
            continue
        if not s or s.startswith("#") or re.fullmatch(r"[-*_]{3,}", s):
            flush()
            continue
        if s.startswith("|"):
            flush()
            if not re.fullmatch(r"\|?[\s:|-]+\|?", s):
                for cell in re.split(r"(?<!\\)\|", re.sub(r"`[^`]*`", "C", s).strip("|")):
                    if cell.strip():
                        out.append((i + 1, cell.strip()))
            continue
        if LIST_RE.match(ln):
            flush()
            start = i + 1
            cur.append(LIST_RE.sub("", ln).strip())
            continue
        if not cur:
            start = i + 1
        cur.append(s.lstrip("> "))
    flush()
    return out


def clean(text):
    text = re.sub(r"`[^`]*`", "C", text)
    text = re.sub(r"!?\[([^\]]*)\]\([^)]*\)", r"\1", text)
    text = re.sub(r"<[^>]+>", " ", text)
    return re.sub(r"[*_]{1,3}", "", text)


def sentences(text):
    return [s for s in re.split(r"(?<=[.!?])[\"')\]]*\s+(?=\S)", text) if re.search(r"[^\W_]", s)]


def lint(path):
    doc = Doc(path)
    found = []
    for line, raw in blocks(doc):
        text = clean(raw)
        rel = os.path.basename(os.path.dirname(path)) + "/" + os.path.basename(path) \
            if os.path.basename(os.path.dirname(path)) == "references" else os.path.basename(path)
        ss = sentences(text)
        for s in ss:
            n = len(re.findall(r"[^\W_][\w'’-]*", s))
            if n > MAX_WORDS:
                found.append(f"{rel}:{line} W1 {n} words: {s[:90]}")
        if len(ss) > MAX_SENTENCES:
            found.append(f"{rel}:{line} W2 {len(ss)} sentences in one block")
        if ";" in text:
            found.append(f"{rel}:{line} W3 semicolon: {text[max(0, text.index(';') - 40):text.index(';') + 20]}")
        for m in ABBREV_RE.finditer(text):
            found.append(f"{rel}:{line} W4 `{m.group(0)}`")
        if "—" in text or "–" in text:
            found.append(f"{rel}:{line} W5 dash")
        for pattern, term in GLOSSARY:
            for m in re.finditer(pattern, text, re.IGNORECASE if not pattern.startswith(r"\bAC") else 0):
                found.append(f"{rel}:{line} W6 `{m.group(0)}` - write `{term}`")
    return found


def main(argv=None):
    p = argparse.ArgumentParser(prog="lint_prose.py", description="Hold markdown to the skill's writing rules.")
    p.add_argument("files", nargs="*")
    p.add_argument("--skill", action="store_true", help="lint this skill's SKILL.md and references/*.md")
    args = p.parse_args(argv)
    files = list(args.files)
    if args.skill:
        here = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        files += [os.path.join(here, "SKILL.md")] + sorted(glob.glob(os.path.join(here, "references", "*.md")))
    if not files:
        print("lint_prose: name files, or pass --skill", file=sys.stderr)
        return 2
    found = []
    for f in files:
        found += lint(f)
    for x in found:
        print(f"  ERROR {x}")
    print(f"\nlint_prose: {len(found)} finding(s) in {len(files)} file(s)")
    return 1 if found else 0


if __name__ == "__main__":
    raise SystemExit(main())
