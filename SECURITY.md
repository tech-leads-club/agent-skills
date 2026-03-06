# 🛡️ Security Policy

## Philosophy

Agent Skills is a **managed, hardened** skill registry. Unlike open marketplaces where [over 13% of skills contain critical issues](https://github.com/snyk/agent-scan/blob/main/.github/reports/skills-report.pdf), every skill and every tool in this repository is designed with security as a first-class constraint — not an afterthought.

Security here means three things: protecting **your environment** (CLI defense-in-depth), protecting **your context window** (MCP progressive disclosure), and protecting **your trust** (supply chain integrity).

## 🎯 Threat Model

We directly address the threats identified in the [Snyk 2026 Agent Threat Report](https://github.com/snyk/agent-scan/blob/main/.github/reports/skills-report.pdf):

| Threat                   | Public Marketplaces                                         | Agent Skills Guarantee                                                                                          |
| :----------------------- | :---------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------- |
| **Malicious Payloads**   | Obfuscated code, binaries, or "black box" instructions      | **100% Open Source**: No binaries, fully readable text/code. Every line is auditable.                           |
| **Credential Theft**     | Skills silently exfiltrating env vars to remote servers     | **Static Analysis**: CI/CD pipeline blocks skills with suspicious network calls or secret access.               |
| **Supply Chain Attacks** | Authors pushing malicious updates to existing skills        | **Immutable Integrity**: Lockfiles and content-hashing ensure code never changes without your explicit upgrade. |
| **Prompt Injection**     | Hidden instructions to hijack agent behavior ("jailbreaks") | **Human Curation**: Every prompt is manually code-reviewed by maintainers for safety boundaries.                |

## 🔐 CLI Defense-in-Depth

The CLI installer (`packages/cli`) implements multiple independent security layers. Each operation passes through **all** of them — defense-in-depth means no single bypass is enough.

### 1. Input Sanitization

Every skill name and file path is sanitized before use:

```typescript
// packages/cli/src/services/installer.ts
const sanitizeName = (name: string): string => {
  return (
    name
      .replace(/[/\\]/g, '') // Remove path separators
      .replace(/[\0:*?"<>|]/g, '') // Remove null bytes and Windows-forbidden chars
      .replace(/^[.\s]+|[.\s]+$/g, '') // Strip leading/trailing dots and spaces
      .replace(/\.{2,}/g, '') // Collapse consecutive dots (no "..")
      .replace(/^\.+/, '') // No leading dots (hidden files)
      .substring(0, 255) || // Enforce filesystem name length limit
    'unnamed-skill'
  )
}
```

This blocks: `../../../etc/passwd`, `skill\0name`, `/etc/passwd`, `skill:name`, `.hidden`, `a`.repeat(300).

### 2. Filesystem Isolation (Path Traversal Protection)

Even after sanitization, every resolved path is verified to be strictly inside the allowed base directory:

```typescript
// packages/cli/src/services/installer.ts
const isPathSafe = (basePath: string, targetPath: string): boolean => {
  const normalizedBase = normalize(resolve(basePath))
  const normalizedTarget = normalize(resolve(targetPath))
  return normalizedTarget.startsWith(normalizedBase + sep) || normalizedTarget === normalizedBase
}
```

Both paths are **fully resolved** (`resolve()`) before comparison — relative paths, symlinks, and `..` sequences are eliminated before the check. The OS-specific separator (`sep`) is used to prevent tricks like `/allowed/dir../escape`.

This guard is applied at every write, read, and delete operation: `installSkillForAgent()`, `getInstallPath()`, `getCanonicalPath()`, `removeSkill()`, and `isSkillInstalled()`.

### 3. Symlink Guard

Symlinks are treated as untrusted by default:

- **`lstat()` not `stat()`** — detects symlinks without following them, preventing TOCTOU attacks
- **Target validation** — resolves the final target and verifies it is within the allowed base directory, even for chained symlinks
- **Loop detection** — `ELOOP` errors (circular symlink chains) are caught and the link is forcibly removed
- **Windows junctions** — on Windows, directory junctions are used instead of symlinks for better OS-level containment

```typescript
const validateSymlinkTarget = async (linkPath: string, baseDir: string): Promise<boolean> => {
  const stats = await lstat(linkPath) // Never follows the link
  if (stats.isSymbolicLink()) {
    const target = await readlink(linkPath)
    const resolvedTarget = resolve(join(linkPath, '..'), target)
    return isPathSafe(baseDir, resolvedTarget) // Target must stay inside allowed dir
  }
  return true
}
```

### 4. Lockfile Integrity

The lockfile (`.agents/.skill-lock.json`) is the source of truth for installed skills. It is protected by:

**Schema validation (Zod):** Every lockfile read is parsed through a strict Zod schema. Invalid or malformed entries are rejected and the file gracefully migrates to a clean state — no silent corruption.

**Atomic writes:** The lockfile is never written in-place:

```
1. Backup existing file → .skill-lock.json.bak
2. Write new content   → .skill-lock.json.tmp
3. Atomic rename       → .skill-lock.json.tmp → .skill-lock.json
```

If the process is killed mid-write, the old file is intact. If the rename fails, the temp file is cleaned up.

**Content hashing:** Each installed skill records a SHA-256 content hash computed from all its files. This enables tamper detection: if a skill file changes on disk after installation, the hash mismatch is detectable on the next operation.

**Removal authorization:** Skills cannot be removed unless they appear in the lockfile. The `--force` flag bypasses this check and is audit-logged.

### 5. Audit Trail

Every install, update, and remove operation is appended to an audit log at `~/.config/agent-skills/audit.log` (JSON Lines format):

```json
{"action":"install","skillName":"codenavi","agents":["cursor"],"success":1,"failed":0,"timestamp":"2026-02-25T10:00:00Z"}
{"action":"remove","skillName":"codenavi","agents":["cursor"],"success":1,"failed":0,"forced":false,"timestamp":"2026-02-25T11:00:00Z"}
```

The log is **append-only** — entries are never overwritten. It is the forensic record of all agent skill operations on the machine.

## 🔍 Security Scanning

Every skill in the catalog is scanned with [`mcp-scan`](https://github.com/invariantlabs-ai/mcp-scan) before publishing. The scan is **incremental** — only skills whose content has changed since the last run are re-scanned.

```bash
npm run scan              # Incremental (default — only changed skills)
npm run scan -- --force   # Force full re-scan of all skills
```

### How It Works

Each skill has a SHA-256 content hash computed from all its files. Results are cached in `.security-scan-cache.json` (gitignored). On the next run:

```
Content hash unchanged → load from cache (fast, no re-scan)
Content hash changed   → re-scan with mcp-scan, update cache
```

This makes the scan fast enough to run on every PR and release without slowing CI/CD.

### Handling False Positives

If `mcp-scan` flags a finding that is intentional (e.g. a first-party MCP server integration), add it to the allowlist at `packages/skills-catalog/security-scan-allowlist.yaml`:

```yaml
version: '1.0.0'

entries:
  - skill: my-skill
    code: W011
    reason: >
      Fetches from trusted first-party API at api.example.com — expected behavior,
      not a credential exfiltration vector. Reviewed by maintainers on 2026-01-01.
    allowedBy: github.com/username
    allowedAt: '2026-01-01'
    expiresAt: '2027-01-01' # Optional but strongly recommended
```

**Rules:**

- Matching is `skill + code` — no re-scan needed, takes effect immediately
- `expiresAt` is optional but **strongly recommended** — forces periodic review of exceptions
- Expired entries automatically re-activate the finding, ensuring exceptions don't become permanent
- The allowlist is committed and reviewed in every PR — no exceptions are invisible

### Security Scan in CI/CD

The scan must pass before any release. The release pipeline (`release.yml`) runs `npm run scan` as a required step. A failed scan blocks the release.

## 🔌 MCP Server Security

The `@tech-leads-club/agent-skills-mcp` server (`packages/mcp`) has a narrower threat surface by design:

- **Read-only** — the server has no write access to the registry; it only reads from CDN
- **No authentication** — the server runs locally over stdio; there is no network-exposed endpoint
- **Path validation** — `fetch_skill_files` validates every requested file path against the registry's `files[]` array before any network call; it is impossible to fetch an arbitrary URL
- **No local filesystem access** — the server fetches from CDN only; it never reads or writes local files
- **Stdout reserved for JSON-RPC** — all logging goes exclusively to `stderr` to prevent protocol corruption

## 🛡️ Content Trust & Authorship

This repository is a collection of curated skills intended to benefit the community. We deeply respect the intellectual property and wishes of all creators.

**If you are the author of any content included here** and would like it removed or updated, please [open an issue](https://github.com/tech-leads-club/agent-skills/issues/new) or contact the maintainers directly. We will act promptly.

For licensing details, see **[📄 License and Attribution](README.md#-license-and-attribution)** in the README.

## 🚨 Reporting a Vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.**

To report a vulnerability, open a [GitHub Security Advisory](https://github.com/tech-leads-club/agent-skills/security/advisories/new) (private, only visible to maintainers).

Include:

- A description of the vulnerability
- Steps to reproduce
- Affected component (`cli`, `mcp`, `skills-catalog`, a specific skill)
- Potential impact

We aim to acknowledge reports within **48 hours** and resolve confirmed vulnerabilities within **14 days**. We will credit reporters in the fix commit unless anonymity is requested.
