#!/usr/bin/env python3
"""Mechanical checks for a tlc-discover design document.

Usage: python3 validate_design.py <path-to-design.md>

Checks structure and internal consistency only: sections present, anchors resolve,
decisions and slices agree across the index tables, the header and the sections,
the order respects dependencies, nothing blocked is called clear, every cited code
is defined on the page, and the document is inside its slice count and word budget. It cannot judge whether the design is right.

Exit code 1 when there is at least one error. Warnings do not fail the run.
Headings are recognised in English and Portuguese; a document in another language
gets the checks that do not depend on heading names.
"""
import re
import sys
import unicodedata

READ_BUDGET = 2000   # words, Summary up to Slices, code blocks excluded
TOTAL_BUDGET = 4000  # words, whole document, code blocks excluded, up to BUDGET_SLICES slices
BUDGET_SLICES = 8
PER_SLICE = 250      # words added to TOTAL_BUDGET for each slice beyond BUDGET_SLICES
MAX_SLICES = 10
MAX_DECISIONS = 8
LONG_SENTENCE = 45   # words

H = {  # canonical name -> accepted headings (lowercase)
    "summary": ["summary", "resumo"],
    "context": ["context and problem", "contexto e problema"],
    "success": ["how we will know it worked", "como saberemos que funcionou"],
    "scope": ["scope", "escopo"],
    "how": ["how it works", "como funciona"],
    "vocabulary": ["vocabulary", "vocabulário"],
    "decisions": ["key decisions", "decisões-chave"],
    "open": ["open", "em aberto"],
    "slices": ["slices", "fatias"],
    "references": ["references", "referências"],
}
L = {  # labels inside sections
    "delivers": ["delivers", "entrega"],
    "status": ["status"],
    "applies": ["applies", "aplica"],
    "depends": ["depends on", "depende de"],
    "behaviour": ["behaviour", "behavior", "comportamento"],
    "rule": ["rule", "regra"],
    "order": ["order", "ordem"],
    "ready": ["ready to plan?", "pronto para planejar?"],
}
CLEAR = ("clear", "clara", "claro")
NOTHING = ("nothing", "nada", "none", "—", "-")
DECLINED = ("declined", "recusad", "declinad")
GO_LIVE = ("go-live", "go live", "release", "lançamento", "lancamento")
# codes that look like identifiers but are common notation, not references
NOT_IDS = re.compile(r"^(?:D\d+|Q[1-4]|H[1-6]|V\d+|UTF-?\d+|SHA-?\d+|ISO-?\d+|HTTP-?\d+|TLS-?\d+|OAUTH-?\d+|ES\d+|S3|EC2|K8S|I18N|L10N|X509|B2B|B2C|E2E|U\d+)$")


def slug(text):
    # Drop Markdown formatting, but keep underscores inside identifiers: `pay_invoice` -> #pay_invoice
    text = re.sub(r"[`*]|(?<!\w)_+|_+(?!\w)", "", text.strip().lower())
    out = []
    for ch in text:
        cat = unicodedata.category(ch)
        if ch in " -":
            out.append("-")
        elif cat[0] in "LN" or ch == "_":
            out.append(ch)
    return "".join(out)


def strip_code(lines):
    """Yield (lineno, line) for lines outside fenced code blocks."""
    fenced = False
    for i, line in enumerate(lines, 1):
        if line.lstrip().startswith("```"):
            fenced = not fenced
            continue
        if not fenced:
            yield i, line


def words(text):
    return len(re.findall(r"\w[\w'’-]*", text, flags=re.UNICODE))


def cells(row):
    return [c.strip() for c in row.strip().strip("|").split("|")]


def mentions(text, names):
    """Names (lowercase) referenced in text. Longer names claim their span first, so
    'pay invoice' does not also count as a mention of 'invoice'."""
    found = set()
    for name in sorted(names, key=len, reverse=True):
        pattern = re.compile(r"\b%s\b" % re.escape(name))
        if pattern.search(text):
            found.add(name)
            text = pattern.sub(lambda m: " " * len(m.group(0)), text)
    return found


def label_re(names):
    alt = "|".join(re.escape(n) for n in names)
    return re.compile(r"\*\*(?:%s)[.:]?\*\*[.:]?\s*(.*)" % alt, re.IGNORECASE)


def main(path):
    with open(path, encoding="utf-8") as f:
        raw = f.read()
    lines = raw.splitlines()
    prose = list(strip_code(lines))
    errors, warnings = [], []

    def err(msg, ln=None):
        errors.append(("line %d: " % ln if ln else "") + msg)

    def warn(msg, ln=None):
        warnings.append(("line %d: " % ln if ln else "") + msg)

    # ---- headings -------------------------------------------------------
    heads = []  # (lineno, level, text)
    for ln, line in prose:
        m = re.match(r"^(#{1,4})\s+(.*\S)\s*$", line)
        if m:
            heads.append((ln, len(m.group(1)), m.group(2)))
    slugs = {slug(t) for _, _, t in heads}

    def find(canon, level=None):
        for ln, lv, text in heads:
            if text.strip().lower() in H[canon] and (level is None or lv == level):
                return ln
        return None

    def section(canon, level=2):
        """(start, end) line numbers of a section, or None."""
        start = find(canon, level)
        if start is None:
            return None
        end = len(lines) + 1
        for ln, lv, _ in heads:
            if ln > start and lv <= level:
                end = ln
                break
        return start, end

    def body(span):
        return [(ln, l) for ln, l in prose if span[0] < ln < span[1]]

    status_line = next((l for _, l in prose[:30] if re.match(r"\|\s*\*\*status\*\*", l, re.IGNORECASE)), "")
    status_cell = cells(status_line)[1].lower() if status_line else ""
    declined = any(status_cell.startswith(d) for d in DECLINED)
    required = ["summary", "context", "scope"] if declined else [
        "summary", "context", "success", "scope", "how", "decisions", "slices"]
    known = sum(1 for c in H if find(c))
    if known == 0:
        warn("no known section headings found (document in another language?): "
             "heading-based checks skipped")
    else:
        for canon in required:
            if not find(canon, 2):
                err("required section missing: %s" % H[canon][0].title())

    # ---- placeholders, N/A, anchors --------------------------------------
    for ln, line in prose:
        for m in re.finditer(r"<([a-zA-Z][^<>\n]{3,})>", line):
            inner = m.group(1)
            if re.match(r"(br|/|a |img|details|summary|sub|sup|kbd)", inner):
                continue
            if "`" in line[:m.start()] and line[:m.start()].count("`") % 2 == 1:
                continue
            warn("looks like a template placeholder left in: <%s>" % inner[:40], ln)
        if re.match(r"^\s*(n/a|n\.a\.|tbd|todo)\s*$", line, re.IGNORECASE):
            err("empty section filler (%s): omit the section instead" % line.strip(), ln)
        for m in re.finditer(r"\]\(#([^)]+)\)", line):
            if m.group(1) not in slugs:
                err("anchor does not resolve: #%s" % m.group(1), ln)

    # ---- key decisions ----------------------------------------------------
    dec_index = {}   # code -> set of slice names (lowercase) from the index table
    dec_names = {}
    span = section("decisions")
    if span:
        dec_sections = {}
        for ln, lv, text in heads:
            if span[0] < ln < span[1] and lv == 3:
                m = re.match(r"(D\d+)\b", text)
                if m:
                    dec_sections[m.group(1)] = ln
        for ln, line in body(span):
            if line.startswith("|") and re.match(r"\|\s*D\d+\s*\|", line):
                c = cells(line)
                dec_index[c[0]] = {s.strip().lower() for s in c[2].split(",")} if len(c) > 2 else set()
                dec_names[c[0]] = c[1] if len(c) > 1 else ""
        for code in dec_index:
            if code not in dec_sections:
                err("decision %s is in the index table and has no section" % code)
        for code, ln in dec_sections.items():
            if code not in dec_index:
                err("decision %s has a section and is missing from the index table" % code, ln)
        if len(dec_sections) > MAX_DECISIONS:
            warn("%d key decisions: more than %d means the shape has not been found"
                 % (len(dec_sections), MAX_DECISIONS))
        rule = label_re(L["rule"])
        ordered = sorted(dec_sections.items(), key=lambda kv: kv[1])
        for i, (code, ln) in enumerate(ordered):
            end = ordered[i + 1][1] if i + 1 < len(ordered) else span[1]
            if not any(rule.search(l) for n, l in prose if ln < n < end):
                warn("decision %s has no Rule line" % code, ln)

    # ---- slices -----------------------------------------------------------
    slices = {}      # lowercase name -> dict
    order_names = []
    span = section("slices")
    if span:
        index_rows = []
        for ln, line in body(span):
            m = re.match(r"\|\s*\[([^\]]+)\]\(#[^)]+\)\s*\|", line)
            if m:
                c = cells(line)
                index_rows.append((m.group(1).strip(), c[-1], ln))
        sect = [(ln, text) for ln, lv, text in heads if span[0] < ln < span[1] and lv == 3]
        # one slice is one section and no index
        single_without_index = not index_rows and len(sect) == 1
        if not single_without_index and [n.lower() for n, _, _ in index_rows] != [t.lower() for _, t in sect]:
            err("slice index and slice sections differ in names or order: index=%s sections=%s"
                % ([n for n, _, _ in index_rows], [t for _, t in sect]))
        idx_status = {n.lower(): s for n, s, _ in index_rows}
        pat = {k: label_re(L[k]) for k in ("delivers", "status", "applies", "depends", "behaviour")}
        for i, (ln, name) in enumerate(sect):
            end = sect[i + 1][0] if i + 1 < len(sect) else span[1]
            text = [(n, l) for n, l in prose if ln < n < end]
            head = " ".join(l.lstrip("> ").strip() for n, l in text if l.lstrip().startswith(">"))
            info = {"line": ln, "name": name, "status": "", "applies": [], "depends": ""}
            parts = re.split(r"\s·\s", head)
            for part in parts:
                for key in ("status", "applies", "depends"):
                    m = pat[key].search(part)
                    if m:
                        info[key] = m.group(1).strip()
            if not pat["delivers"].search(head):
                err("slice '%s' has no Delivers line in its header" % name, ln)
            if not info["status"]:
                err("slice '%s' has no Status in its header" % name, ln)
            if not info["depends"]:
                err("slice '%s' does not say what it depends on" % name, ln)
            if not any(pat["behaviour"].search(l) for n, l in text):
                warn("slice '%s' has no Behaviour part" % name, ln)
            applies = info["applies"] if isinstance(info["applies"], str) else ""
            codes = re.findall(r"\bD\d+\b", applies)
            for code in codes:
                if dec_index and code not in dec_index:
                    err("slice '%s' applies %s, which is not a key decision" % (name, code), ln)
                if not re.search(r"\b%s\s*\(" % code, applies):
                    err("slice '%s' cites %s without its name beside it" % (name, code), ln)
            info["applies"] = set(codes)
            st = idx_status.get(name.lower(), "")
            if st and info["status"] and st.split()[0].lower() != info["status"].split()[0].lower():
                err("slice '%s': status in the index (%s) differs from its header (%s)"
                    % (name, st, info["status"]), ln)
            slices[name.lower()] = info
        for code, names in dec_index.items():
            for key, info in slices.items():
                listed = key in names
                applied = code in info["applies"]
                if listed and not applied:
                    err("decision index says %s affects '%s', but the slice does not apply it"
                        % (code, info["name"]), info["line"])
                if applied and not listed:
                    err("slice '%s' applies %s, but the decision index does not list the slice"
                        % (info["name"], code), info["line"])
        # order line and dependencies
        order = label_re(L["order"])
        for ln, line in body(span):
            m = order.search(line)
            if m:
                first = re.split(r"[.;]", m.group(1))[0]
                order_names = [s.strip().lower() for s in re.split(r"→|->", first) if s.strip()]
                break
        if len(slices) > 1 and not order_names:
            err("no Order line under the slice index")
        elif len(slices) > 1:
            missing = [slices[k]["name"] for k in slices if k not in order_names]
            unknown = [n for n in order_names if n not in slices]
            repeated = sorted({n for n in order_names if order_names.count(n) > 1})
            if missing:
                err("Order line leaves out slices: %s" % ", ".join(missing))
            if unknown:
                err("Order line names what is not a slice: %s" % ", ".join(unknown))
            if repeated:
                err("Order line names a slice more than once: %s" % ", ".join(repeated))
        pos = {n: i for i, n in enumerate(order_names)}
        for key, info in slices.items():
            for other in mentions(info["depends"].lower(), slices) - {key}:
                if key in pos and other in pos and pos[other] > pos[key]:
                    err("order does not hold: '%s' depends on '%s', which comes later"
                        % (info["name"], slices[other]["name"]), info["line"])

    # ---- open table against slice status and header ------------------------
    span = section("open")
    if span and slices:
        for ln, line in body(span):
            if not line.startswith("|") or set(line) <= set("|-: "):
                continue
            c = cells(line)
            if len(c) < 3:
                continue
            cell = c[2].lower()
            # "go-live of A, B and C" blocks only release; a mixed cell separates with ";".
            # Release-only segments are dropped here, so what remains blocks the spec, and a
            # slice it names cannot be clear, whatever its status says about go-live.
            parts = cell.split(";")
            segments = [seg for seg in parts if not any(g in seg for g in GO_LIVE)
                        or re.search(r"\bspec\b", seg)]
            for key in mentions(" ; ".join(segments), slices):
                info = slices[key]
                if info["status"].lower().startswith(CLEAR):
                    err("Open says something blocks '%s', but the slice status is '%s'"
                        % (info["name"], info["status"]), ln)
    ready = label_re(L["ready"])
    for ln, line in prose[:40]:
        m = ready.search(line)
        if m and slices:
            n_clear = sum(1 for i in slices.values() if i["status"].lower().startswith(CLEAR))
            claim = re.search(r"(\d+)\s+(?:\w+\s+)?(?:%s)" % "|".join(CLEAR + ("claras", "claros")),
                              m.group(1).lower())
            n_exact = sum(1 for i in slices.values() if i["status"].strip().lower() in CLEAR)
            if claim and int(claim.group(1)) not in (n_clear, n_exact):
                err("header says %s clear slices; the slice headers show %d"
                    % (claim.group(1), n_clear), ln)

    # ---- success table ------------------------------------------------------
    span = section("success")
    if span:
        rows = [(ln, cells(l)) for ln, l in body(span)
                if l.startswith("|") and not set(l) <= set("|-: ")]
        for ln, c in rows[1:]:
            if len(c) < 3 or not c[-1] or c[-1] in NOTHING:
                err("a success target has no measurement beside it", ln)

    # ---- cited codes defined on the page ------------------------------------
    # A code such as Q-03 or S4 taken from an input document must be defined somewhere
    # on the page: as the first cell of a table row, or followed by an explanation.
    code_re = re.compile(r"\b([A-Z]{1,6}-?\d{1,3})\b")
    first_seen, defined = {}, set()
    for ln, line in prose:
        plain = re.sub(r"`[^`]*`|\]\([^)]*\)", "", line)
        if plain.startswith("|"):
            c = cells(plain)
            if c:
                for m in code_re.finditer(c[0]):
                    defined.add(m.group(1))
        for m in code_re.finditer(plain):
            code = m.group(1)
            if NOT_IDS.match(code):
                continue
            first_seen.setdefault(code, ln)
            after = plain[m.end():m.end() + 4]
            if re.match(r"\s*(?:\(|:|—|–|\*\*\s*[:(—])", after) or \
                    re.search(r"\*\*%s\*\*" % re.escape(code), plain):
                defined.add(code)
    undefined = sorted(set(first_seen) - defined, key=lambda k: first_seen[k])
    for code in undefined:
        warn("%s is cited and never defined on the page (a table row, or the code followed by "
             "what it is)" % code, first_seen[code])

    # ---- budget and density ---------------------------------------------------
    total = words("\n".join(l for _, l in prose))
    n_slices = len(slices) if slices else 0
    budget = TOTAL_BUDGET + PER_SLICE * max(0, n_slices - BUDGET_SLICES)
    if n_slices > MAX_SLICES:
        warn("%d slices, over about %d: this is usually two designs sharing a decision"
             % (n_slices, MAX_SLICES))
    start, stop = find("summary", 2), find("slices", 2)
    report = ["words: %d in all (budget about %d for %d slices)" % (total, budget, n_slices)]
    if total > budget:
        warn("whole document is %d words, over the %d budget" % (total, budget))
    if start and stop:
        reading = words("\n".join(l for ln, l in prose if start <= ln < stop))
        report.append("words: %d from Summary to Slices (budget about %d)" % (reading, READ_BUDGET))
        if reading > READ_BUDGET:
            warn("the part read together is %d words, over the %d budget" % (reading, READ_BUDGET))
    for ln, line in prose:
        if line.startswith(("|", "#", ">", "-", "*", " ")) or not line.strip():
            continue
        for sentence in re.split(r"(?<=[.!?])\s+", line):
            if words(sentence) > LONG_SENTENCE:
                warn("sentence of %d words: split it, or make it a list" % words(sentence), ln)
                break

    for r in report:
        print(r)
    for w in warnings:
        print("WARN  " + w)
    for e in errors:
        print("ERROR " + e)
    print("%d error(s), %d warning(s)" % (len(errors), len(warnings)))
    return 1 if errors else 0


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(__doc__)
        sys.exit(2)
    sys.exit(main(sys.argv[1]))
