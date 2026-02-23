# Skill Patterns Reference

This document details the five proven patterns for skill architecture.
Read this when deciding how to structure a skill's workflow during the
Architecture phase.

## Table of Contents

1. Sequential Workflow Orchestration (line ~20)
2. Multi-MCP Coordination (line ~70)
3. Iterative Refinement (line ~120)
4. Context-Aware Tool Selection (line ~170)
5. Domain-Specific Intelligence (line ~210)
6. Choosing Between Patterns (line ~250)
7. Combining Patterns (line ~280)

---

## 1. Sequential Workflow Orchestration

**Use when:** Users need multi-step processes executed in a specific order,
where each step depends on the previous one.

**Problem-first framing:** "I need to onboard a new customer" → Skill
orchestrates the right calls in the right sequence.

**Key characteristics:**

- Explicit step ordering with dependencies between steps
- Validation gates between steps (don't proceed if step N fails)
- Rollback instructions for failures
- Data flows from earlier steps to later ones

**Structure template:**

```markdown
## Workflow: [Name]

### Step 1: [Action]
Call tool: `tool_name`
Parameters: [what's needed]
Validation: [how to know it succeeded]
On failure: [what to do]

### Step 2: [Action]
Depends on: Step 1 (uses [specific output])
Call tool: `tool_name`
Parameters: [include output from Step 1]
Validation: [check]

### Step 3: [Action]
...
```

**When to choose this pattern:**

- The workflow has a natural linear order
- Steps have clear dependencies
- Skipping a step would break the workflow
- Users currently do these steps manually in sequence

**Watch out for:**

- Rigid ordering when some steps could be parallel
- Missing rollback logic (what if step 3 fails after step 1 and 2 succeeded?)
- Not validating between steps

---

## 2. Multi-MCP Coordination

**Use when:** Workflows span multiple external services, each connected
via its own MCP server.

**Key characteristics:**

- Clear phase separation by service
- Data passing between MCP servers
- Validation before moving to next phase
- Centralized error handling across services

**Structure template:**

```markdown
## Workflow: [Name]

### Phase 1: [Service A] ([MCP name])
1. [Action using Service A tools]
2. [Action using Service A tools]
Output: [data needed by Phase 2]

### Phase 2: [Service B] ([MCP name])
Input: [data from Phase 1]
1. [Action using Service B tools]
2. [Action using Service B tools]
Output: [data needed by Phase 3]

### Phase 3: [Service C] ([MCP name])
...

## Error Handling
- If Phase 1 fails: [action]
- If Phase 2 fails but Phase 1 succeeded: [action]
```

**When to choose this pattern:**

- The workflow crosses service boundaries
- Multiple MCP servers are involved
- Data needs to flow between services
- Users currently switch between tools manually

**Watch out for:**

- Assuming all MCPs are connected (check availability first)
- Not handling partial failures (Phase 2 fails but Phase 1 already ran)
- Tight coupling between phases (prefer passing data explicitly)

---

## 3. Iterative Refinement

**Use when:** Output quality improves through multiple review-and-fix cycles.

**Key characteristics:**

- Initial draft generation
- Quality check against explicit criteria
- Refinement loop with clear stopping conditions
- Finalization step

**Structure template:**

```markdown
## Workflow: [Name]

### Initial Draft
1. Gather input data
2. Generate first version
3. Save to working file

### Quality Check
Run validation: `scripts/check_quality.py`
Criteria:
- [Criterion 1]: [how to check]
- [Criterion 2]: [how to check]
- [Criterion 3]: [how to check]

### Refinement Loop
For each issue found:
1. Identify the specific problem
2. Fix it
3. Re-validate

STOP when:
- All criteria pass, OR
- 3 iterations completed (diminishing returns), OR
- User signals satisfaction

### Finalization
1. Apply final formatting
2. Generate summary of changes
3. Save final version
```

**When to choose this pattern:**

- Output quality is subjective or multi-dimensional
- First drafts are usually "close but not quite"
- Users currently review and ask for revisions manually
- There are explicit quality criteria to check against

**Watch out for:**

- Infinite loops (always define stopping conditions)
- Over-polishing (3 iterations is usually enough)
- Vague quality criteria (make them checkable)

---

## 4. Context-Aware Tool Selection

**Use when:** The same goal can be achieved with different tools depending
on the input or context.

**Key characteristics:**

- Decision tree based on input properties
- Fallback options when primary choice isn't available
- Transparency about why a particular path was chosen

**Structure template:**

```markdown
## Workflow: [Name]

### Analyze Input
Check: [what properties to examine]
- Property A: [value range or type]
- Property B: [value range or type]

### Decision Tree
IF [condition 1]:
  → Use [Tool/Approach A]
  Rationale: [why this is better for this case]
ELIF [condition 2]:
  → Use [Tool/Approach B]
  Rationale: [why]
ELSE:
  → Use [Tool/Approach C] (default)

### Execute
Based on decision, execute using the selected approach.

### Explain Choice
Tell the user which approach was selected and why.
```

**When to choose this pattern:**

- Multiple valid approaches exist for the same goal
- The "best" approach depends on input characteristics
- Users don't know (or shouldn't need to know) which tool is optimal

**Watch out for:**

- Decision criteria that overlap (ambiguous routing)
- Missing fallback for edge cases
- Not explaining the choice to the user

---

## 5. Domain-Specific Intelligence

**Use when:** The skill's value comes from specialized knowledge, not just
tool orchestration.

**Key characteristics:**

- Domain rules and constraints embedded in logic
- Compliance or validation checks before action
- Comprehensive audit trails
- Expert-level decision making

**Structure template:**

```markdown
## Workflow: [Name]

### Pre-Check ([Domain] Rules)
Before proceeding, verify:
1. [Domain rule 1]: [how to check]
2. [Domain rule 2]: [how to check]
3. [Domain rule 3]: [how to check]

IF any rule fails:
  → [Escalation or alternative path]
  → Document the failure

### Execute
Only if pre-checks pass:
1. [Action with domain context]
2. [Action with domain context]

### Audit Trail
Log:
- All checks performed and results
- Decisions made and rationale
- Actions taken
```

**When to choose this pattern:**

- The skill needs expert knowledge to execute correctly
- There are compliance, safety, or quality rules to enforce
- Getting it wrong has significant consequences
- Users benefit from the skill's "expertise" more than its automation

**Watch out for:**

- Outdated domain knowledge (plan for updates)
- Over-encoding rules that change frequently (reference external docs instead)
- Not documenting the reasoning for decisions

---

## 6. Choosing Between Patterns

| Signal | Suggested Pattern |
|--------|------------------|
| "Do A, then B, then C" | Sequential Workflow |
| "Get data from X, send to Y, notify in Z" | Multi-MCP Coordination |
| "Make it good, then review and improve" | Iterative Refinement |
| "Handle PDFs differently from CSVs" | Context-Aware Selection |
| "Follow our compliance rules" | Domain-Specific Intelligence |
| Steps have no dependencies | Consider parallel execution |
| User says "it depends" a lot | Context-Aware Selection |
| Quality is subjective | Iterative Refinement |

---

## 7. Combining Patterns

Most real skills combine patterns. Common combinations:

- **Sequential + Domain Intelligence:** Follow steps in order, but embed
  expert checks at critical points (e.g., compliance check before payment)
- **Multi-MCP + Iterative:** Coordinate across services, then refine the
  combined output
- **Context-Aware + Sequential:** Choose the right tool first, then follow
  a sequential workflow specific to that tool
- **Domain Intelligence + Iterative:** Apply domain rules, generate output,
  review against domain criteria, refine

When combining, identify the PRIMARY pattern (the one that shapes the
overall flow) and SECONDARY patterns (the ones that apply within specific
steps).
