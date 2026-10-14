# PRD format

Load this file only when writing `.prd/<slug>.md` — after the user confirms the verdict, or when Situation established the decision was already committed and the problem work does not contradict it. Do not load it during the interview.

Section headings stay as they are. Readers find them by name. The prose follows the language of the conversation. Identifiers are never translated.

The file holds the product bet and nothing a later design can derive on its own. Three rules keep it that size:

1. **Each decision is stated once.** Status is the verdict. Problem does not restate it. Journey does not restate Problem.
2. **No technology.** No library, provider, pattern, schema, API, route, or file path. A substitute people use today is a fact. A proposal for how to build is not.
3. **The file says what must be true for the people involved, not what will be built.** Journey states are product outcomes. Lists of tasks are someone else's job.

Replace every placeholder with a concrete value, or omit the section. A heading with "N/A" under it does not appear.

## Template

Write `.prd/<slug>.md`.

````markdown
# <Title>

> Read this PRD and take the bet as settled. Do not re-derive it.
> Status: <draft | confirmed by <who>, <date> | declined - <reason>, <who>, <date>>

## Situation

- Effort: <in steady use | not shipped yet | in active construction>
- Decision: <open | committed by <who>, <when>, in <roadmap, cycle, document>>
- In flight: <what this copies as precedent; what is specified elsewhere and stays out> - one sentence each
- At stake: <what being wrong costs - cheap to undo | expensive | one-way>

## Problem

<Pain: who hurts, named; what it costs today, in a unit the business feels; what happens if nothing changes. Absence: who cannot do this, and what they do instead. Construction: what this piece was promised to make possible, what stalls without it, and why now rather than after the next piece. The number that moved the decision, in one line, with where it came from - or the line that says it is unmeasured and what people said instead. No solution proposed.>

## Success

- Worked if: <outcome, in the problem's own unit, and roughly by when>
- Going wrong: <what the early signal looks like when the bet is failing>
- Review: <date or trigger> - <who looks>

## Boundary

In: <what this covers>.

Out: <excluded> - <why>. <One line per item.>

Unchanged: <something a reader might expect to change and that does not>.

## Journey

| State | What should happen | Person sees |
|---|---|---|
| <each confirmed state> | <the product outcome> | <what is visible to that person> |

## Open questions

1. <question that is high impact and still unclear> - not decided. <what it blocks>
2. <low-impact question> - default taken: <the default>
````

## Section notes

**Status** in the header is the verdict and the only place it appears. Who confirmed it and when, or that it was declined and why. The cheaper paths and the four outcomes weighed stay in the conversation.

**Problem** carries the number that moved the decision in one line, or the line saying it is unmeasured. It does not describe a solution.

**Success** uses the problem's unit. Where little is at stake, keep only "Worked if". Omit the section entirely when Status is declined.

**Boundary › Out** is what is not in the bet. **Unchanged** is what a reader might expect this PRD to touch and that it does not. For a declined PRD, Boundary also says what would have to become true to reopen it.

**Journey** is the product acceptance criteria. One row per state the user confirmed. Omit the section when Status is declined. Omit the third column when there is no person who sees the outcome. A state confirmed in the interview and missing here is a hole in the file.

**Open questions** appears only when something was left open. High impact and unclear is "not decided". Low impact takes a default and names it. Omit the section when nothing is open.

**Declined** (`not now` or `do not build`) keeps Status, Situation, Problem, and Boundary. Omit Success, Journey, and Open questions.
