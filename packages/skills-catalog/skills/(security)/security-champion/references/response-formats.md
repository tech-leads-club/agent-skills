# Response Formats

Use these templates for structuring security analysis responses. Adapt language to match the user's detected language.

---

## Mode 1: Code Security Analysis

```
## Security Analysis: [filename or scope]

**Risk Level**: Critical | High | Medium | Low
**Vulnerabilities Found**: X
**OWASP Categories**: [e.g. A03:2021, A07:2021]

---

### [SEVERITY] — [Vulnerability Type] (Line X–Y)

**Why This Matters**
- Attack Vector: [How an attacker exploits this]
- Real-World Impact: [Specific business consequence]
- OWASP: [Category + reason]

**Vulnerable Code**
[code block]
// Dangerous because: [explanation]
// An attacker could: [specific attack]

**Secure Implementation**
[code block]
// Prevents attack by: [security mechanism]
// Best practice applied: [pattern name]

**Next Steps**
- Immediate Fix: [what to change now]
- Pattern Recognition: [how to spot similar issues]
- Test Strategy: [how to verify the fix works]
- OWASP Reference: [link or guide name]

---

[repeat block for each finding, ordered Critical → Low]

---

## Security Checklist (apply in future reviews)
- [ ] Is user input validated at entry point?
- [ ] Are we using parameterized queries / safe APIs?
- [ ] Is output properly encoded for context?
- [ ] Do we have monitoring for these attack patterns?
```

---

## Mode 2: Dependency Security Audit

```
## Dependency Security Audit

**Package Manager**: npm | Yarn | pnpm
**Total Vulnerabilities**: X (Critical: X, High: X, Medium: X, Low: X)
**Technically Mitigated** (via overrides/resolutions): X
**Packages Requiring Updates**: X (security-justified updates only)
**Supply Chain Risk**: [assessment based on research]

---

### Technically Mitigated via [overrides | resolutions | pnpm.overrides]

| Package | CVE | Pinned Version | Status |
|---------|-----|----------------|--------|
| [pkg]   | [CVE-ID] | [version] | Resolved — override covers the fix |
| [pkg]   | [CVE-ID] | [version] | INSUFFICIENT — [explain why version still vulnerable] |

Note: "INSUFFICIENT" entries appear again as active findings below.

---

### CRITICAL — [Package Name] v[current] → v[minimum-fix]

**Understanding This Vulnerability**
- Why It's Critical: [vulnerability class explanation]
- Attack Scenario: [how this would be exploited]
- Business Impact: [consequences for this application]

**Research Completed**
- NVD Verified: CVSS X.X — [impact description]
- Public Exploits: [count / none available]
- Patch Validated: Fixed in v[version] (released [date])
- Breaking Changes: [assessment]
- Real-World Usage: [confirmed attacks / theoretical only]

**Fix Commands**
```bash
# Step 1: Update to minimum secure version
npm install [package]@[exact-version] --save-exact

# Step 2: Verify resolution
npm audit | grep [package]

# Step 3: Test functionality
npm test
```

**Learning Point**: [key dependency security concept this CVE illustrates]

---

[repeat HIGH block with same structure but abbreviated research section]

---

### MEDIUM — Batch Updates

| Package | Current | Fix Version | CVE | CVSS |
|---------|---------|-------------|-----|------|
| ...     | ...     | ...         | ... | ...  |

---

## Execution Sequence

```bash
# 1. Backup current lockfile
cp package-lock.json package-lock.backup.json

# 2. Apply patches in priority order
[commands from each finding above]

# 3. Verify all CVEs resolved
npm audit

# 4. Run tests
npm test && npm run build

# 5. Commit
git add package*.json
git commit -m "fix: security patches for [CVE list]"
```

---

## Supply Chain Safety Applied
- Rejected: Updates without security justification
- Rejected: Major version jumps
- Applied: Minimum viable security patches only
```
