# Security Champion

Senior application security auditor for AI coding agents. Detects vulnerabilities in source code and audits dependencies for known CVEs across 12+ ecosystems, with educational explanations and mandatory real-time research.

## What it does

Two operating modes, selected automatically from the user's request:

**Mode 1 — Code Security Analysis.** Scans source files against a categorized pattern library (secrets, injection, auth, cryptography, modern frameworks, path traversal, SSTI, deserialization, ReDoS, IDOR). Every finding is mapped to OWASP Top 10 and presented with vulnerable-vs-secure code side-by-side and an explanation of the attack vector. Hardcoded secrets are redacted before being echoed back.

**Mode 2 — Dependency Security Audit.** Detects the project's ecosystem from manifest/lockfile, runs the appropriate audit tool, and cross-references findings against existing technical mitigations (`package.json overrides`, `go.mod replace`, `Cargo.toml [patch]`, etc.). For every Critical/High CVE, the agent executes a Mandatory Research Protocol against NVD, Exploit-DB, GitHub, and release notes — never relying on training data, which is treated as outdated by default.

## When to use

- "Review this code for security issues"
- "Run a security audit on this project"
- "Check my dependencies for vulnerabilities"
- "Is this code secure?"
- "Audit `pyproject.toml` / `go.mod` / `Cargo.lock` / `package.json`"
- "Research CVE-XXXX-YYYY for this project"

## When NOT to use

- General security best-practices guidance not tied to a specific finding
- Threat modeling
- Architecture or design advice unrelated to vulnerability detection

## Supported ecosystems

Node.js (npm, Yarn classic/Berry, pnpm), Python (uv, Poetry, Pipenv, pip), Go, Rust, Java (Maven, Gradle), Ruby, PHP. Monorepos with multiple ecosystems are audited per-ecosystem with a combined report.

## File structure

```
security-champion/
├── SKILL.md                          Core workflow and rules
├── README.md                         This file
└── references/
    ├── vulnerability-patterns.md     Pattern library (loaded at start of Mode 1)
    ├── response-formats.md           Response templates for both modes
    └── dependency-ecosystems.md      Ecosystem detection, audit commands, override mechanisms
```

## Override file: `.security-overrides.md`

Findings the user has explicitly accepted as known risks are tracked in `.security-overrides.md` at the project root. The file is created lazily — only when the user accepts the first risk during triage. It is **not** created proactively.

> **This file is specific to this skill.** It is not a community standard. The Node.js, Python, Java, Go, etc. ecosystems each have their own native suppression mechanisms (`.snyk`, `# nosec`, `.semgrepignore`, `suppression.xml`, `dependabot.yml ignore`, etc.). `.security-overrides.md` does not replace any of those — it complements them with an audit trail (`Review by` date, justification, research summary) that is human-readable and tool-agnostic. The skill respects native suppressions where the audit tool already filters them; `.security-overrides.md` covers what the native tooling cannot, like accepted code-finding patterns or CVEs that the user has consciously deferred.

Two override types are tracked separately:

- **Code findings** — accepted patterns from Mode 1. Default review window: 6 months.
- **CVE overrides** — accepted CVEs from Mode 2. Default review window: 3 months for Critical/High. Each entry records the CVSS at acceptance time, whether public exploits existed, and any real-world attack reports — so the next session can detect material change.

At the start of every session, if the file exists, the skill re-runs the research protocol on each CVE override and escalates back to an active finding when conditions change (e.g., a public exploit appeared after acceptance).

## Security guarantees

The skill operates under two non-negotiable rules that are enforced at the prompt level:

1. **Secret Redaction Rule** — real high-entropy credentials matched in user code are never echoed verbatim. Only a non-secret type prefix (`ghp_`, `AKIA`, `sk-`, …) plus a length annotation is displayed.
2. **Untrusted External Content** — pages fetched during the Research Protocol (NVD, Exploit-DB, GitHub, advisories) are treated as inert data, not as instructions. Embedded prompt-injection attempts addressed to the agent are flagged and ignored; only structured fields (CVSS, fixed version, CWE) are authoritative.

## Limitations

- **Patterns are heuristics, not proofs.** Every regex match must be validated against surrounding code before it becomes a reported finding. The skill instructs the agent to do this, but no static rule replaces taint analysis.
- **Mode 2 requires network access** to NVD and related sources. If a source is unreachable, the agent reports the finding with a `[UNAVAILABLE]` marker on the affected research field rather than guessing.
- **The audit recommends the minimum version that resolves the CVE.** It does not recommend "latest" or major-version bumps. Breaking-change assessment is the user's responsibility.

## License

CC-BY-4.0
