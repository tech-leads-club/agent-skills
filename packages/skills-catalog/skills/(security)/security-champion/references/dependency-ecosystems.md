# Dependency Ecosystems

Detection rules, audit commands, and override/pin mechanisms per ecosystem. Read this file at the start of Mode 2 to identify the ecosystem and retrieve the correct instructions.

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

**Audit command:**

```bash
uv pip audit
```

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

**Audit command:**

```bash
pip-audit --json
# or
safety check --json
```

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
