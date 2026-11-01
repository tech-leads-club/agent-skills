#!/usr/bin/env python3
"""
specs.py - the one reader every gate shares.

Each gate reads a feature through this module, so the shape it accepts is written once. The grammar
is strict: a structure a gate reads matches it, or the gate reports the line and the shape it
expected. Nothing is skipped as "not parsed confidently".

Grammar (outside fenced blocks):
  heading     `#` to `####`, then the title
  field       `**Name**: value` at the start of a line, or as a list item `- **Name**: value`
  field list  a field with no value, then `- ` items up to a blank line, a heading or another field
  table       a pipe table: a header row, a separator row, then rows with the header's cell count
  criterion   `N. **ID** <EARS text>` under `**Acceptance Criteria**:` in a `### P<n>: <title>` story
  task        `#### T<n>: <title>` under `### Phase <n>: <title>` in `## Tasks`, with a `**Files**:` list of
              `Create:`, `Modify:`, `Delete:` and `Test:` items, each one path in backticks
  check       `**C<n>** - <claim> (<ID>, <ID>)`, then one `Proof: <proof>` line or more
  decision    `### AD-NNN` under `## Decisions` in .specs/STATE.md, with `- **Field**: value` lines
  approval    `**Approved**: <YYYY-MM-DD> - user: "<their words>" - hash: <12 hex>` in spec.md and tasks.md,
              and in tasks.md an `**Amended**: <YYYY-MM-DD> - <what changed> - hash: <12 hex>` line after it.
              approve.py writes both. The hash covers the file as approved (see content_hash).

It also holds the rules more than one gate applies (vague words, shrink words, approvals, design
locations) and the spin guard: a gate that fails twice in a row with the same errors stops the run.

Pure standard library. Python 3.8 or later.
"""

import hashlib
import json
import os
import re
import subprocess

ID_RE = re.compile(r"^[A-Z][A-Z0-9]*-\d{2,}$")
ID_FIND = re.compile(r"\b[A-Z][A-Z0-9]*-\d{2,}\b")
HEADING_RE = re.compile(r"^(#{1,4})\s+(.*?)\s*$")
FENCE_RE = re.compile(r"^(`{3,}|~{3,})")
FIELD_RE = re.compile(r"^(?:[-*]\s+)?\*\*([A-Za-z][^*:]*?)\*\*\s*:\s*(.*)$")
SPAN_RE = re.compile(r"`([^`\n]+)`")
USER_WORDS_RE = re.compile(r"user:\s*[\"“][^\"”\[]*\S[^\"”]*[\"”]", re.IGNORECASE)
CHECK_RE = re.compile(r"^\**\s*(C\d+)\s*\**\s*[-–—:]\s*(.+)$")
PROOF_RE = re.compile(r"^\**\s*Proof\s*\**\s*:\s*(.+)$", re.IGNORECASE)
CRITERION_RE = re.compile(r"^(\d+)\.\s+(.*)$")
CRITERION_ID_RE = re.compile(r"^\*\*([A-Z][A-Z0-9]*-\d{2,})\*\*\s+(.+)$")
STORY_RE = re.compile(r"^P(\d+)\s*:\s*(.+)$")
PHASE_RE = re.compile(r"^Phase\s+(\d+)\s*:\s*(.+)$", re.IGNORECASE)
TASK_RE = re.compile(r"^T(\d+)\s*:\s*(.+)$")
AD_RE = re.compile(r"^AD-(\d{3,})$")
FILE_ITEM_RE = re.compile(r"^(Create|Modify|Delete|Test)\s*:\s*`([^`]+)`\s*$")
SCOPES = ("Small", "Medium", "Large", "Complex")
APPROVED_FILES = ("spec.md", "tasks.md")
STAMP_FIELDS = ("approved", "amended")
UNHASHED_FIELDS = ("approved", "amended", "status")
STAMP_RE = re.compile(r"^(\d{4}-\d{2}-\d{2})\s+-\s+(\S.*?)\s+-\s+hash:\s*([0-9a-f]{12})$")
STAMP_WORDS_RE = re.compile(r"^user:\s*[\"“]([^\"”]*\S[^\"”]*)[\"”]$", re.IGNORECASE)
TICK_RE = re.compile(r"^(\s*[-*]\s+)\[[xX]\]")
LOCATION_MARK_RE = re.compile(r"\((new|existing)\)", re.IGNORECASE)
OPEN_QUESTIONS_RE = re.compile(r"open questions\W*:\s*none")

# Words that leave a criterion without a value a test can hold.
VAGUE_WORDS = [
    "quickly", "fast", "slow", "soon", "gracefully", "properly", "appropriate", "appropriately", "adequate",
    "adequately", "reasonable", "reasonably", "user-friendly", "intuitive", "easy", "easily", "simple", "efficient",
    "efficiently", "robust", "seamless", "seamlessly", "flexible", "optimal", "optimally", "as needed", "if needed",
    "if possible", "as appropriate", "and so on", "normally", "usually", "typically", "generally", "several",
    "various", "approximately", "rapidamente", "rápido", "rapido", "lento", "adequado", "adequada",
    "adequadamente", "apropriado", "apropriada", "apropriadamente", "amigável", "amigavel", "intuitivo",
    "intuitiva", "fácil", "facil", "simples", "eficiente", "eficientemente", "robusto", "robusta", "flexível",
    "flexivel", "se necessário", "se necessario", "conforme necessário", "conforme necessario", "se possível",
    "se possivel", "normalmente", "geralmente", "vários", "varios", "várias", "varias", "aproximadamente",
]
# Words that ship part of a task and call it done.
SHRINK_WORDS = [
    "for now", "placeholder", "todo", "tbd", "temporary", "temporarily", "hardcode", "hardcoded", "hard-coded",
    "wire later", "wired later", "simplified version", "stubbed", "por enquanto", "provisório", "provisorio",
    "provisória", "provisoria", "temporário", "temporario", "temporária", "temporaria", "gambiarra",
]
VAGUE_RE = re.compile(r"(?<![\w-])(" + "|".join(re.escape(w) for w in VAGUE_WORDS) + r")(?![\w-])", re.IGNORECASE)
SHRINK_RE = re.compile(r"(?<![\w-])(" + "|".join(re.escape(w) for w in SHRINK_WORDS) + r")(?![\w-])", re.IGNORECASE)


def norm(text):
    return re.sub(r"\s+", " ", re.sub(r"[*_`]", "", text)).strip().lower()


def without_code(text):
    return SPAN_RE.sub(" ", text)


def split_cells(line):
    """The cells of a pipe-table row. A `|` inside a code span or after a backslash is not a border."""
    s = line.strip()
    if s.startswith("|"):
        s = s[1:]
    if s.endswith("|") and not s.endswith("\\|"):
        s = s[:-1]
    cells, cur, code = [], "", False
    i = 0
    while i < len(s):
        c = s[i]
        if c == "\\" and i + 1 < len(s) and s[i + 1] == "|":
            cur += "|"
            i += 2
            continue
        if c == "`":
            code = not code
        if c == "|" and not code:
            cells.append(cur.strip())
            cur = ""
        else:
            cur += c
        i += 1
    cells.append(cur.strip())
    return cells


class Field:
    def __init__(self, name, value, line, items):
        self.name, self.value, self.line, self.items = name, value, line, items


class Table:
    def __init__(self, block):
        self.line = block[0][0]
        self.errors = []
        cells = [split_cells(text) for _, text in block]
        self.header = [norm(c) for c in cells[0]]
        self.rows = []
        if len(block) < 2 or not all(re.fullmatch(r":?-{3,}:?", c.strip()) for c in cells[1]):
            self.errors.append(f"L{self.line}: a table needs a header row, then a separator row (`| --- |`)")
            return
        for (n, _), row in zip(block[2:], cells[2:]):
            if len(row) != len(self.header):
                self.errors.append(f"L{n}: this row has {len(row)} cells and the header has {len(self.header)}")
            self.rows.append((n, dict(zip(self.header, row + [""] * (len(self.header) - len(row))))))

    def key(self, prefix):
        """The header that starts with `prefix`, or None."""
        prefix = norm(prefix)
        return next((h for h in self.header if h.startswith(prefix)), None)


class Doc:
    """A markdown file with its fenced blocks blanked out, so line numbers stay true."""

    def __init__(self, path=None, text=None):
        self.path = path
        if text is None:
            with open(path, "r", encoding="utf-8") as f:
                text = f.read()
        self.raw = text.splitlines()
        self.lines, fence = [], None
        for ln in self.raw:
            s = ln.strip()
            if fence:
                if re.fullmatch(re.escape(fence[0]) + "{%d,}" % len(fence), s):
                    fence = None
                self.lines.append("")
                continue
            m = FENCE_RE.match(s)
            if m:
                fence = m.group(1)
                self.lines.append("")
                continue
            self.lines.append(ln)
        self.heads = []
        for i, ln in enumerate(self.lines):
            m = HEADING_RE.match(ln.strip())
            if m:
                self.heads.append((i, len(m.group(1)), m.group(2)))

    def bounds(self, index, level):
        end = len(self.lines)
        for j, lv, _ in self.heads:
            if j > index and lv <= level:
                end = j
                break
        return index + 1, end

    def section(self, title, level=2):
        """Body bounds of the first heading at `level` whose title is `title`, or None."""
        for i, lv, t in self.heads:
            if lv == level and norm(t) == norm(title):
                return self.bounds(i, lv)
        return None

    def children(self, start, end, level):
        """(heading line index, title, (body start, body end)) for each heading at `level` in a range."""
        return [(i, t, self.bounds(i, lv)) for i, lv, t in self.heads if start <= i < end and lv == level]

    def fields(self, start, end):
        out, i = [], start
        while i < end:
            m = FIELD_RE.match(self.lines[i].strip())
            if not m:
                i += 1
                continue
            name, value, line, items = m.group(1).strip(), m.group(2).strip(), i + 1, []
            j = i + 1
            if not value:
                k = j
                while k < end and not self.lines[k].strip():
                    k += 1
                if k < end and self.lines[k].strip().startswith(("- ", "* ")) and not FIELD_RE.match(self.lines[k].strip()):
                    j = k
                while j < end:
                    s = self.lines[j].strip()
                    if s.startswith(("- ", "* ")) and not FIELD_RE.match(s):
                        items.append((s[2:].strip(), j + 1))
                        j += 1
                        continue
                    break
            out.append(Field(name, value, line, items))
            i = j if items else i + 1
        return out

    def field(self, start, end, name):
        return next((f for f in self.fields(start, end) if norm(f.name) == norm(name)), None)

    def tables(self, start, end):
        out, i = [], start
        while i < end:
            if self.lines[i].strip().startswith("|"):
                block = []
                while i < end and self.lines[i].strip().startswith("|"):
                    block.append((i + 1, self.lines[i]))
                    i += 1
                out.append(Table(block))
                continue
            i += 1
        return out

    def text(self, start, end):
        return [(i + 1, self.lines[i].strip()) for i in range(start, end) if self.lines[i].strip()]


# ---------------------------------------------------------------- feature files

def feature_dir(target, root, wanted):
    """A feature directory from a path to a file in it, the directory, or a feature name.
    With no target, the single feature that has `wanted`."""
    if target:
        if os.path.isfile(target):
            return os.path.dirname(os.path.abspath(target))
        if os.path.isdir(target):
            return os.path.abspath(target)
        cand = os.path.join(root, ".specs", "features", target)
        return cand if os.path.isdir(cand) else None
    base = os.path.join(root, ".specs", "features")
    if not os.path.isdir(base):
        return None
    found = [d for d in sorted(os.listdir(base)) if os.path.isfile(os.path.join(base, d, wanted))]
    if len(found) > 1:
        raise SystemExit(f"more than one feature has a {wanted}; name one:\n  " + "\n  ".join(found))
    return os.path.join(base, found[0]) if found else None


def project_root(fdir):
    """The folder that holds .specs/."""
    cur = os.path.abspath(fdir)
    while True:
        if os.path.isdir(os.path.join(cur, ".specs")):
            return cur
        parent = os.path.dirname(cur)
        if parent == cur:
            return os.path.abspath(fdir)
        cur = parent


class Criterion:
    def __init__(self, cid, text, line, story):
        self.id, self.text, self.line, self.story = cid, text, line, story


def read_spec(path):
    """The spec's scope, stories and criteria, and the grammar errors in reading them."""
    doc = Doc(path)
    errors, stories, criteria = [], [], []
    scope = doc.field(0, len(doc.lines), "Scope")
    body = doc.section("User Stories")
    if body:
        for _, title, (s, e) in doc.children(body[0], body[1], 3):
            m = STORY_RE.match(re.sub(r"[*_]", "", title).strip())
            if not m:
                errors.append(f"spec.md: story `### {title}` - write it `### P<n>: <title>`")
                continue
            stories.append(title)
            ac = doc.field(s, e, "Acceptance Criteria")
            if not ac:
                errors.append(f"spec.md: story `{title}` has no `**Acceptance Criteria**:` field")
                continue
            for i in range(ac.line, e):
                line = doc.lines[i].strip()
                if FIELD_RE.match(line) or HEADING_RE.match(line):
                    break
                m = CRITERION_RE.match(line)
                if not m:
                    continue
                cm = CRITERION_ID_RE.match(m.group(2).strip())
                if not cm:
                    errors.append(f"spec.md L{i + 1}: a criterion starts with its own ID - `{m.group(1)}. **AUTH-01** "
                                  f"WHEN ... THEN the system SHALL ...`")
                    continue
                criteria.append(Criterion(cm.group(1), cm.group(2).strip(), i + 1, title))
    return {"doc": doc, "scope": scope, "stories": stories, "criteria": criteria, "errors": errors}


class Task:
    def __init__(self, num, title, line, phase):
        self.num, self.id, self.title, self.line, self.phase = num, f"T{num}", title, line, phase
        self.fields, self.files, self.deps, self.reqs, self.done_items = {}, [], [], [], []

    @property
    def done(self):
        return bool(self.done_items) and all(x for x in self.done_items)

    def paths(self, *kinds):
        return [p for k, p, _ in self.files if k in kinds]


class Check:
    def __init__(self, cid, claim, line):
        self.id, self.claim, self.line, self.proofs = cid, claim, line, []
        m = re.search(r"\(([^()]*)\)\s*$", claim)
        self.cites = ID_FIND.findall(m.group(1)) if m else []


def read_checks(doc):
    checks, cur = [], None
    body = doc.section("Checks")
    if not body:
        return checks
    for n, s in doc.text(*body):
        m = CHECK_RE.match(s)
        if m:
            cur = Check(m.group(1), m.group(2).strip(), n)
            checks.append(cur)
        elif cur and PROOF_RE.match(s):
            cur.proofs.append(PROOF_RE.match(s).group(1).strip())
    return checks


def read_tasks(path=None, text=None):
    """Phases, tasks and checks of a tasks.md, and the grammar errors in reading them."""
    doc = Doc(path, text)
    errors, phases, tasks = [], [], []
    body = doc.section("Tasks")
    if body:
        for _, ptitle, (ps, pe) in doc.children(body[0], body[1], 3):
            pm = PHASE_RE.match(re.sub(r"[*_]", "", ptitle).strip())
            if not pm:
                errors.append(f"tasks.md: `### {ptitle}` - a phase is `### Phase <n>: <title>`")
                continue
            phase = (int(pm.group(1)), pm.group(2).strip(), [])
            phases.append(phase)
            for i, ttitle, (ts, te) in doc.children(ps, pe, 4):
                tm = TASK_RE.match(re.sub(r"[*_]", "", ttitle).strip())
                if not tm:
                    errors.append(f"tasks.md L{i + 1}: `#### {ttitle}` - a task is `#### T<n>: <title>`")
                    continue
                t = Task(int(tm.group(1)), tm.group(2).strip(), i + 1, phase[0])
                for f in doc.fields(ts, te):
                    t.fields[norm(f.name)] = f
                files = t.fields.get("files")
                for text, n in (files.items if files else []):
                    fm = FILE_ITEM_RE.match(text)
                    if fm:
                        t.files.append((fm.group(1), fm.group(2).strip(), n))
                    else:
                        errors.append(f"tasks.md L{n}: `{text[:60]}` - a Files item is `Create: \\`path\\``, "
                                      f"`Modify: \\`path\\``, `Delete: \\`path\\`` or `Test: \\`path\\``")
                dep = t.fields.get("depends on")
                if dep and norm(dep.value) not in ("none", ""):
                    t.deps = re.findall(r"\bT\d+\b", dep.value)
                req = t.fields.get("requirement")
                if req:
                    t.reqs = ID_FIND.findall(req.value)
                done = t.fields.get("done when")
                for text, _ in (done.items if done else []):
                    if re.match(r"^\[[ xX]\]", text):
                        t.done_items.append(text[1] in "xX")
                tasks.append(t)
                phase[2].append(t)
    elif doc.section("Task Breakdown") or doc.section("Execution Plan"):
        errors.append("tasks.md: the tasks live under `## Tasks`, one `### Phase <n>: <title>` per phase and one "
                      "`#### T<n>: <title>` per task - this file has the old `## Execution Plan` / "
                      "`## Task Breakdown` layout")
    return {"doc": doc, "phases": phases, "tasks": tasks, "checks": read_checks(doc), "errors": errors}


class Decision:
    def __init__(self, num, line, fields):
        self.num, self.id, self.line, self.fields = num, f"AD-{num:03d}", line, fields


def read_state(text):
    doc = Doc(text=text)
    errors, decisions = [], []
    body = doc.section("Decisions")
    if not body:
        return {"doc": doc, "decisions": decisions, "errors": errors, "has_section": False}
    for i, title, (s, e) in doc.children(body[0], body[1], 3):
        m = AD_RE.match(title.strip())
        if not m:
            errors.append(f"STATE.md L{i + 1}: `### {title}` under `## Decisions` - an entry is `### AD-NNN`")
            continue
        decisions.append(Decision(int(m.group(1)), i + 1, {norm(f.name): f.value for f in doc.fields(s, e)}))
    return {"doc": doc, "decisions": decisions, "errors": errors, "has_section": True}


def has_open_questions(spec_doc):
    """True unless the spec's `## Assumptions & Open Questions` says `Open questions: none`."""
    body = spec_doc.section("Assumptions & Open Questions")
    lines = [s for _, s in spec_doc.text(*body) if "open questions" in s.lower()] if body else []
    return not OPEN_QUESTIONS_RE.search(norm(" ".join(lines)))


# ---------------------------------------------------------------- design locations

def is_path(span):
    """A code span that names a file or folder: it has a `/` or ends with an extension."""
    span = span.strip()
    if not span or any(c in span for c in " ()<>{}=,;\"'") or "://" in span:
        return False
    return "/" in span or re.search(r"\.\w{1,8}(:\d+(-\d+)?)?$", span) is not None


def design_locations(doc):
    """(line, mark, [paths]) for each `**Location**:` field of a design: mark is `new`, `existing` or None."""
    out = []
    for f in doc.fields(0, len(doc.lines)):
        if norm(f.name) != "location":
            continue
        m = LOCATION_MARK_RE.search(f.value)
        out.append((f.line, m.group(1).lower() if m else None, [s for s in SPAN_RE.findall(f.value) if is_path(s)]))
    return out


def covers(location, path):
    """True when a task's path builds a design location: the same file, or a file under the folder."""
    loc = location.strip()
    loc = loc[2:] if loc.startswith("./") else loc
    if path == loc.rstrip("/"):
        return True
    folder = loc.endswith("/") or "." not in loc.rsplit("/", 1)[-1]
    return folder and path.startswith(loc.rstrip("/") + "/")


# ---------------------------------------------------------------- approvals

def content_hash(text):
    """The hash an approval carries: the file as the user approved it.

    What changes while the plan is carried out does not count: the `**Approved**`, `**Amended**` and
    `**Status**` lines, the `## Handoff` section and the state of each checkbox. Blank lines and
    trailing spaces do not count either, so an editor that reflows them breaks nothing.
    """
    doc = Doc(text=text)
    handoff = doc.section("Handoff")
    kept = []
    for i, raw in enumerate(doc.raw):
        if handoff and handoff[0] - 1 <= i < handoff[1]:
            continue
        m = FIELD_RE.match(doc.lines[i].strip())
        if m and norm(m.group(1)) in UNHASHED_FIELDS:
            continue
        line = TICK_RE.sub(r"\1[ ]", raw.rstrip())
        if line.strip():
            kept.append(line)
    return hashlib.sha256("\n".join(kept).encode("utf-8")).hexdigest()[:12]


class Stamp:
    def __init__(self, kind, line, date, text, digest):
        self.kind, self.line, self.date, self.text, self.hash = kind, line, date, text, digest


def read_stamps(text, name):
    """The approval and amendment lines of spec.md or tasks.md, and the errors in their shape.
    A line still holding template text (`[written when ...]`) is not an approval yet."""
    doc = Doc(text=text)
    stamps, errors = [], []
    for f in doc.fields(0, len(doc.lines)):
        kind = norm(f.name)
        if kind not in STAMP_FIELDS or not f.value or f.value.startswith("["):
            continue
        m = STAMP_RE.match(f.value.strip())
        words = STAMP_WORDS_RE.match(m.group(2)) if m and kind == "approved" else None
        if not m or (kind == "approved" and not words):
            shape = ('`**Approved**: <YYYY-MM-DD> - user: "<their words>" - hash: <12 hex>`' if kind == "approved"
                     else "`**Amended**: <YYYY-MM-DD> - <what changed> - hash: <12 hex>`")
            errors.append(f"{name} L{f.line}: the line reads {shape} - approve.py writes it")
            continue
        stamps.append(Stamp(kind, f.line, m.group(1), words.group(1) if words else m.group(2), m.group(3)))
    approved = [s for s in stamps if s.kind == "approved"]
    amended = [s for s in stamps if s.kind == "amended"]
    if len(approved) > 1 or len(amended) > 1:
        errors.append(f"{name}: more than one `**Approved**` or `**Amended**` line - approve.py keeps one of each")
    if amended and name != "tasks.md":
        errors.append(f"{name} L{amended[0].line}: the spec is never amended - the user approves it again")
    if amended and not approved:
        errors.append(f"{name} L{amended[0].line}: an `**Amended**` line with no `**Approved**` line above it")
    return stamps, errors


def approval_errors(fdir, required, texts=None, only=APPROVED_FILES):
    """What stands between spec.md and tasks.md and the approval each carries.

    `required`: a file that exists owes an approval. Before that point, only a stale one is an error.
    `texts`: {name: text} read instead of the file, such as the staged version a commit carries.
    """
    errors = []
    feature = os.path.basename(os.path.abspath(fdir))
    for name in only:
        if texts is not None and name in texts:
            text = texts[name]
        else:
            path = os.path.join(fdir, name)
            text = None
            if os.path.isfile(path):
                with open(path, encoding="utf-8") as f:
                    text = f.read()
        if text is None:
            continue
        stamps, e = read_stamps(text, name)
        errors += e
        if e:
            continue
        kind = name.split(".")[0]
        if not stamps:
            if required:
                errors.append(f"{name} is not approved - present it and stop. When the user approves, run `approve.py "
                              f"{feature} {kind} --user \"<their words>\"`. Never stamp words the user did not give")
            continue
        last = next((s for s in stamps if s.kind == "amended"), stamps[0])
        now = content_hash(text)
        if now == last.hash:
            continue
        if name == "spec.md":
            errors.append(f"spec.md changed after the user approved it (L{last.line}) - show the user the change. When "
                          f"they approve it, run `approve.py {feature} spec --user \"<their words>\"`, in a commit of "
                          f"its own")
        else:
            errors.append(f"tasks.md changed after it was approved (L{last.line}) - commit the plan change alone and "
                          f"record it: `approve.py {feature} tasks --amend \"<what changed and why>\"`. A change to "
                          f"what the user decided goes back to them")
    return errors


# ---------------------------------------------------------------- spin guard and report

def _state_file(fdir):
    try:
        out = subprocess.run(["git", "rev-parse", "--absolute-git-dir"], cwd=fdir, capture_output=True,
                             text=True, timeout=10)
        if out.returncode == 0 and out.stdout.strip():
            return os.path.join(out.stdout.strip(), "tlc-spec-driven-gates.json")
    except (OSError, subprocess.SubprocessError):
        pass
    return os.path.join(project_root(fdir), ".specs", ".gates.json")


def spin_guard(gate, fdir, errors):
    """True when this gate failed on its last run for this feature with exactly these errors.
    A pass clears the record. The record lives in the git directory, so no commit carries it."""
    if not fdir:
        return False
    path = _state_file(fdir)
    key = f"{gate}:{os.path.abspath(fdir)}"
    try:
        with open(path, "r", encoding="utf-8") as f:
            state = json.load(f)
    except (OSError, ValueError):
        state = {}
    sig = hashlib.sha1("\n".join(sorted(errors)).encode("utf-8")).hexdigest() if errors else None
    repeated = bool(sig) and state.get(key) == sig
    if sig:
        state[key] = sig
    else:
        state.pop(key, None)
    try:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(state, f, indent=1, sort_keys=True)
    except OSError:
        pass
    return repeated


def stop_text(gate):
    return (f"\nSTOP - {gate} failed twice with the same errors. Do not run it again with the same change.\n"
            f"Write this in the `## Handoff` of tasks.md (of spec.md when there is no tasks.md), then tell the user:\n"
            f"  **Blocked:** <the one thing in the way>\n"
            f"  **Tried:** <what you changed, read and searched>\n"
            f"  **Need:** <the one input that unblocks it>")


def finish(gate, fdir, errors, warnings, strict=False, where=""):
    """Print the findings and return the exit code: 0 pass, 1 errors, 3 the same errors twice in a row."""
    for w in warnings:
        print(f"  WARN  {w}")
    for e in errors:
        print(f"  ERROR {e}")
    print(f"\n{gate}: {len(errors)} error(s), {len(warnings)} warning(s){' in ' + where if where else ''}")
    if spin_guard(gate, fdir, errors):
        print(stop_text(gate))
        return 3
    return 1 if errors or (warnings and strict) else 0
