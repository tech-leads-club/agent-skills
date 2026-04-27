# Dependency Ecosystems

Detection rules, audit commands, and override/pin mechanisms per ecosystem. Read this file at the start of Mode 2 to identify the ecosystem and retrieve the correct instructions.

---

## Command Currency (READ BEFORE RUNNING ANY COMMAND)

The audit commands in this file are **reference baselines**, not authoritative current syntax. Audit tooling evolves: subcommands get renamed (`safety check` → `safety scan`), tools get retired and replaced (Python `safety` ↔ `pip-audit`), native subcommands replace third-party wrappers (e.g. `uv pip audit` → `uv audit` on recent uv versions), and flags change between major versions.

For every ecosystem you intend to audit, perform these checks before running the reference command (this is the Mode 2 currency check from the SKILL.md Currency Protocol):

1. Run `<tool> --version` and capture the installed version in the audit report header.
2. Run `<tool> --help` (and `<tool> audit --help` / `<tool> <subcommand> --help` where relevant) to confirm the command syntax matches the user's installed version.
3. If the reference command is deprecated, removed, or renamed, prefer the current canonical syntax and document the discrepancy in the report so this file can be updated.

When a command listed below is annotated as "(legacy)", "(superseded)", or "(verify against `--help`)", treat that as a strong signal that the syntax may have moved on since this file was last edited. Never run a deprecated command silently — surface the migration to the user.

---

## Detection

Scan the project root for ALL of the following lockfiles and manifest files. Collect every match before proceeding — do not stop at the first one found.

| File                                            | Ecosystem                |
| ----------------------------------------------- | ------------------------ |
| `package-lock.json`                             | Node.js — npm            |
| `yarn.lock` + `"resolutions"` in `package.json` | Node.js — Yarn           |
| `pnpm-lock.yaml`                                | Node.js — pnpm           |
| `yarn.lock` (no `resolutions`)                  | Node.js — Yarn (classic) |
| `uv.lock`                                       | Python — uv              |
| `poetry.lock`                                   | Python — Poetry          |
| `Pipfile.lock`                                  | Python — Pipenv          |
| `requirements.txt` (no lockfile)                | Python — pip             |
| `go.mod`                                        | Go                       |
| `Cargo.lock`                                    | Rust                     |
| `pom.xml`                                       | Java — Maven             |
| `build.gradle` or `build.gradle.kts`            | Java — Gradle            |
| `Gemfile.lock`                                  | Ruby                     |
| `composer.lock`                                 | PHP                      |

When multiple ecosystems are detected (monorepo), audit all of them. Run ecosystems in this order: Node.js → Python → Go → Rust → Java → Ruby → PHP. Present a combined report with a section per ecosystem.

When the same language appears with multiple package managers (e.g. both `package-lock.json` and `yarn.lock`), audit only the one whose lockfile is most recently modified — they represent the same dependency tree.

---

## Node.js — npm

**Audit command:**

```bash
npm audit --json
npm outdated --json
```

**Override mechanism:** `overrides` field in `package.json`

```json
{ "overrides": { "vulnerable-pkg": "1.2.3" } }
```

**How to verify fix:** Run `npm audit` after update — CVE should no longer appear.

---

## Node.js — Yarn

**Audit command:**

```bash
yarn audit --json
```

**Override mechanism:** `resolutions` field in `package.json`

```json
{ "resolutions": { "vulnerable-pkg": "1.2.3" } }
```

**Note:** Yarn classic (v1) and Yarn Berry (v2+) both use `resolutions`.

---

## Node.js — pnpm

**Audit command:**

```bash
pnpm audit --json
```

**Override mechanism:** `pnpm.overrides` field in `package.json`

```json
{ "pnpm": { "overrides": { "vulnerable-pkg": "1.2.3" } } }
```

---

## Python — uv

**Audit command** — verify against `uv --help` per the Currency Protocol; recent uv versions ship a native `uv audit` subcommand, while older versions delegate to `pip-audit` via `uv pip audit`. The native subcommand was introduced in mid-2025 uv releases — confirm presence by grepping `uv --help` output for `audit` rather than relying on a version-string comparison (uv's release cadence is fast and the threshold may shift). Use whichever is current for the installed version:

```bash
# Preferred when available — native subcommand on recent uv releases
uv audit

# Fallback for older uv versions (delegates to pip-audit; install pip-audit if needed)
uv pip audit
```

If neither command is available on the user's installed uv, fall back to running `pip-audit` directly against `uv.lock` (export to `requirements.txt` first if pip-audit cannot read `uv.lock`). Install pip-audit inside a uv-managed project with `uv tool install pip-audit` (do **not** use bare `pip install pip-audit` in a uv project — it may install into the wrong environment).

**Override mechanism:** Version constraints in `pyproject.toml` under `[tool.uv.sources]` or direct pins in `[project.dependencies]`. uv does not support transitive overrides natively — direct pinning only.

**Lockfile:** `uv.lock` — check for pinned versions of vulnerable packages.

---

## Python — Poetry

**Audit command:**

```bash
pip-audit --json   # install with: pip install pip-audit
```

**Override mechanism:** Version constraints in `pyproject.toml` under `[tool.poetry.dependencies]`. Poetry does not have a dedicated transitive override field — use exact version pinning (`package = "==1.2.3"`) for direct deps only.

**Lockfile:** `poetry.lock` — check resolved versions of vulnerable packages.

---

## Python — pip / Pipenv

**Audit command** — `pip-audit` is the primary recommended tool. Safety CLI is also valid but its command surface changed in v3 (the legacy `safety check` was superseded by `safety scan`, which requires authentication against the Safety service). Verify the installed Safety version via `safety --version` and `safety --help` per the Currency Protocol before running:

```bash
# Primary — pip-audit (no account required, uses PyPI advisory DB)
pip-audit --json

# Alternative — Safety CLI v3+ (requires authenticated Safety account; verify with `safety --help`)
safety scan

# (legacy — DO NOT use on Safety v3+; only kept as a marker for older environments)
# safety check --json   # superseded by `safety scan`
```

**Auth-failure fallback:** if `safety scan` exits with an authentication error (no Safety account, no `safety auth login` performed), fall back to `pip-audit --json`. Do not prompt the user to create a Safety account during an audit — `pip-audit` provides equivalent CVE coverage without account requirements. Only escalate to Safety when the user explicitly requests it or has already authenticated.

**Override mechanism:** Direct version pinning in `requirements.txt` (`package==1.2.3`) or `Pipfile`. No transitive override support — if a transitive dep is vulnerable, the direct dependency must release a fix.

---

## Go

**Audit command:**

```bash
govulncheck ./...
```

**Override mechanism:** `replace` directive in `go.mod`

```
replace vulnerable-module v1.2.3 => safe-fork v1.2.4
replace vulnerable-module v1.2.3 => ../local-patched-version
```

**Important:** `replace` can point to a fork, a local path, or a different version. When reviewing, verify the replacement is a legitimate source, not a supply chain risk itself.

---

## Rust

**Audit command:**

```bash
cargo audit --json
```

**Override mechanism:** `[patch]` section in `Cargo.toml`

```toml
[patch.crates-io]
vulnerable-crate = { version = "1.2.3" }
# or from git:
vulnerable-crate = { git = "https://github.com/owner/crate", branch = "fix-branch" }
```

**Note:** `[patch]` applies globally to the workspace. Verify git sources are trustworthy.

---

## Java — Maven

**Audit command:**

```bash
mvn org.owasp:dependency-check-maven:check -Dformat=JSON
```

**Override mechanism:** `<dependencyManagement>` section in `pom.xml`

```xml
<dependencyManagement>
  <dependencies>
    <dependency>
      <groupId>com.example</groupId>
      <artifactId>vulnerable-lib</artifactId>
      <version>1.2.3</version>
    </dependency>
  </dependencies>
</dependencyManagement>
```

**Note:** `dependencyManagement` sets the version for all transitive uses of that artifact across the project.

---

## Java — Gradle

**Audit command:**

```bash
./gradlew dependencyCheckAnalyze
```

**Override mechanism:** `resolutionStrategy` in `build.gradle`

```groovy
configurations.all {
  resolutionStrategy {
    force 'com.example:vulnerable-lib:1.2.3'
  }
}
```

Kotlin DSL (`build.gradle.kts`):

```kotlin
configurations.all {
  resolutionStrategy {
    force("com.example:vulnerable-lib:1.2.3")
  }
}
```

---

## Ruby

**Audit command:**

```bash
bundle audit check --update
```

**Override mechanism:** Direct version pinning in `Gemfile`

```ruby
gem 'vulnerable-gem', '1.2.3'
```

No transitive override support — if a transitive dependency is vulnerable, the parent gem must release a fix.

---

## PHP

**Audit command:**

```bash
composer audit
```

**Override mechanism:** Version constraints in `composer.json`

```json
{
  "require": {
    "vendor/vulnerable-package": "^1.2.3"
  }
}
```

For transitive deps: use `conflict` to block vulnerable versions or `replace` to substitute a package:

```json
{
  "replace": {
    "vendor/vulnerable-package": "1.2.3"
  }
}
```
