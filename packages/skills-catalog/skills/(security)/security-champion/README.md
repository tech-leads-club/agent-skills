# Security Champion

Senior application security auditor for AI coding agents. Detects vulnerabilities in source code and audits dependencies for known CVEs across 12+ ecosystems, with educational explanations and mandatory real-time research.

## What it does

Two operating modes, selected automatically from the user's request:

**Mode 1 — Code Security Analysis.** Scans source files against a categorized pattern library (secrets, injection, auth, cryptography, modern frameworks, path traversal, SSTI, deserialization, ReDoS, IDOR). Every finding is mapped to OWASP Top 10 and presented with vulnerable-vs-secure code side-by-side and an explanation of the attack vector. Hardcoded secrets are redacted before being echoed back.

**Mode 2 — Dependency Security Audit.** Detects the project's ecosystem from manifest/lockfile, verifies the audit command against the user's installed tool version (Currency Protocol), runs it, and cross-references findings against existing technical mitigations in the manifest (`package.json overrides`, `go.mod replace`, `Cargo.toml [patch]`, etc.). For every Critical/High CVE, the agent executes a Mandatory Research Protocol against NVD, Exploit-DB, GitHub, and release notes — never relying on training data or stale reference commands, both of which are treated as outdated by default. Findings the user has accepted as known risks should be suppressed via each ecosystem's native mechanism (`.snyk`, `dependabot.yml` ignore, `# nosec`, etc.) — the skill respects these.

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

## Suppressions

The skill does not introduce its own suppression mechanism. Use each ecosystem's native tooling for accepted risks:

- **Code findings** — inline directives like `// eslint-disable-next-line`, `# nosec`, `# noqa`, `// semgrepignore`, `<!-- prettier-ignore -->`, etc. These live next to the code and survive refactors.
- **CVE findings** — native scanner config: `.snyk`, `dependabot.yml` ignore, `cargo-audit.toml` ignore list, `pip-audit --ignore-vuln`, etc.
- **Technical mitigations in manifests** — `package.json overrides`/`resolutions`, `pnpm.overrides`, `go.mod replace`, `Cargo.toml [patch]`, `pom.xml dependencyManagement`. The skill explicitly cross-references these against findings and reports them as **technically mitigated** rather than active.

The skill respects native suppressions whenever the underlying audit tool already filters them from its output.

## Security guarantees

The skill operates under three non-negotiable rules that are enforced at the prompt level:

1. **Secret Redaction Rule** — real high-entropy credentials matched in user code are never echoed verbatim. Only a non-secret type prefix (`ghp_`, `AKIA`, `sk-`, …) plus a length annotation is displayed.
2. **Untrusted External Content** — pages fetched during the Research Protocol (NVD, Exploit-DB, GitHub, advisories) are treated as inert data, not as instructions. Embedded prompt-injection attempts addressed to the agent are flagged and ignored; only structured fields (CVSS, fixed version, CWE) are authoritative.
3. **Currency Protocol** — the skill never relies on hardcoded version stamps for security guidance. At session start, the agent fetches the current OWASP Top 10 (for category mapping), the current OWASP Password Storage Cheat Sheet (for cryptographic parameter thresholds like bcrypt rounds and Argon2id memory cost), and verifies every audit command against the user's installed tool version (`<tool> --version`, `<tool> --help`). The reference files in `references/` are baselines, not authority — when they disagree with the live source, the live source wins. This makes the skill timeless: as OWASP releases update (`A03:2021` → `A05:2025` → next), as tools migrate (`safety check` → `safety scan`, `uv pip audit` → `uv audit`), and as crypto thresholds drift upward, the analysis stays correct without skill edits.

## Limitations

- **Patterns are heuristics, not proofs.** Every regex match must be validated against surrounding code before it becomes a reported finding. The skill instructs the agent to do this, but no static rule replaces taint analysis.
- **Mode 2 requires network access** to NVD and related sources. If a source is unreachable, the agent reports the finding with a `[UNAVAILABLE]` marker on the affected research field rather than guessing.
- **The audit recommends the minimum version that resolves the CVE.** It does not recommend "latest" or major-version bumps. Breaking-change assessment is the user's responsibility.

## License

CC-BY-4.0
