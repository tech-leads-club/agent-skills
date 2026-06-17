# Phase: Codebase Concerns

**Trigger:** Part of brownfield mapping, or explicitly "document concerns", "find tech debt", "what's risky in this codebase"

**Purpose:** Surface actionable warnings about the codebase. Focused on "what to watch out for when making changes." This is living documentation, not a complaint list.

## When to Generate

CONCERNS.md is generated as part of the brownfield mapping flow (alongside STACK.md, ARCHITECTURE.md, etc.). It can also be created or updated independently when:

- Exploring a new area of the codebase reveals risks
- A bug investigation uncovers systemic issues
- A feature implementation hits unexpected fragility
- A dependency audit reveals risks

## Process

### 1. Gather Evidence

During codebase exploration, look for concrete signals — not opinions. Evidence sources:

- Code patterns that indicate shortcuts (TODO/FIXME/HACK comments, duplicated logic, missing error handling)
- Test coverage gaps (untested critical paths, missing edge cases)
- Dependency manifests (outdated packages, deprecated libraries, security advisories)
- Performance indicators (N+1 queries, missing indexes, synchronous blocking calls)
- Security patterns (client-side-only auth checks, unvalidated inputs, exposed secrets)

### 2. Classify and Document

Each concern must have: **what** the problem is, **where** it lives (file paths), **why** it matters (impact), and **how** to fix it (approach).

### 3. Prioritize by Risk

Focus on concerns that could cause real damage — data loss, security breaches, user-facing failures, scaling walls. Minor style issues and normal TODOs do not belong here.

---

## Template: `.specs/codebase/CONCERNS.md`

**Size limit:** 5,000 tokens (~3,000 words)

```markdown
# Codebase Concerns

**Analysis Date:** [YYYY-MM-DD]

## Tech Debt

**[Area/Component]:**

- Issue: [What's the shortcut/workaround]
- Files: [Specific file paths with backticks]
- Why: [Why it was done this way]
- Impact: [What breaks or degrades because of it]
- Fix approach: [How to properly address it]

## Known Bugs

**[Bug description]:**

- Symptoms: [What happens]
- Trigger: [How to reproduce]
- Files: [Where the bug lives]
- Workaround: [Temporary mitigation if any]
- Root cause: [If known]
- Blocked by: [If waiting on something]

## Security Considerations

**[Area requiring security care]:**

- Risk: [What could go wrong]
- Files: [Where the risk lives]
- Current mitigation: [What's in place now]
- Recommendations: [What should be added]

## Performance Bottlenecks

**[Slow operation/endpoint]:**

- Problem: [What's slow]
- Files: [Where the bottleneck lives]
- Measurement: [Actual numbers: "500ms p95", "2s load time"]
- Cause: [Why it's slow]
- Improvement path: [How to speed it up]

## Fragile Areas

**[Component/Module]:**

- Files: [Where the fragility lives]
- Why fragile: [What makes it break easily]
- Common failures: [What typically goes wrong]
- Safe modification: [How to change it without breaking]
- Test coverage: [Is it tested? Gaps?]

## Scaling Limits

**[Resource/System]:**

- Current capacity: [Numbers: "100 req/sec", "10k users"]
- Limit: [Where it breaks]
- Symptoms at limit: [What happens]
- Scaling path: [How to increase capacity]

## Dependencies at Risk

**[Package/Service]:**

- Risk: [e.g., "deprecated", "unmaintained", "breaking changes coming"]
- Impact: [What breaks if it fails]
- Migration plan: [Alternative or upgrade path]

## Missing Critical Features

**[Feature gap]:**

- Problem: [What's missing]
- Current workaround: [How users cope]
- Blocks: [What can't be done without it]
- Implementation complexity: [Rough effort estimate]

## Test Coverage Gaps

**[Untested area]:**

- What's not tested: [Specific functionality]
- Risk: [What could break unnoticed]
- Priority: [High/Medium/Low]
- Difficulty to test: [Why it's not tested yet]

---

_Concerns audit: [date]_
_Update as issues are fixed or new ones discovered_
```

**Include only sections that have findings.** Empty sections should be omitted entirely.

---

## What Belongs vs. What Doesn't

**Include:**

- Tech debt with clear impact and fix approach
- Known bugs with reproduction steps
- Security gaps and mitigation recommendations
- Performance bottlenecks with measurements
- Fragile code that breaks easily
- Scaling limits with numbers
- Dependencies that need attention
- Missing features that block workflows
- Test coverage gaps

**Exclude:**

- Opinions without evidence ("code is messy")
- Complaints without solutions ("auth sucks")
- Future feature ideas (that's for product planning)
- Normal TODOs (those live in code comments)
- Architectural decisions that are working fine
- Minor code style issues

---

## Writing Guidelines

- **Always include file paths** — Concerns without locations are not actionable. Use backticks: `src/file.ts`
- Be specific with measurements ("500ms p95" not "slow")
- Include reproduction steps for bugs
- Suggest fix approaches, not just problems
- Focus on actionable items
- Prioritize by risk/impact

**Tone:** Professional, not emotional. Solution-oriented. Risk-focused. Factual.

- ✅ "N+1 query pattern in `app/api/courses/route.ts` — 1.2s p95 with 50+ courses"
- ❌ "Terrible queries, everything is slow"
- ✅ "Fix: add index on `user_id` in `subscriptions` table"
- ❌ "Needs fixing"

---

## How CONCERNS.md Gets Used

- **Feature planning:** Check CONCERNS.md before designing features that touch flagged areas
- **Risk estimation:** Use fragile areas and scaling limits to estimate change risk
- **Onboarding new sessions:** Load CONCERNS.md to give context about what to watch out for
- **Refactoring prioritization:** Use tech debt and test coverage gaps to plan improvement sprints
- **Implementation phase:** Consult before modifying any flagged component

This is living documentation. Update as issues are fixed or new ones discovered during any workflow phase.
