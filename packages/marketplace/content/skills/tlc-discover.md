## Why teams use it

Most design-doc prompts start from the solution someone walked in with. tlc-discover is built around a different risk: agreeing on turn two. It runs an interview in a fixed order of prerequisites: where the project stands, what the problem is, whether to do it, and only after the user confirms a verdict, how. The interview first sorts the problem into one of three kinds (pain, absence, or construction) and asks a different set of questions for each. That way, a feature for a product that has not shipped yet does not look like a weak case just because nobody can measure its cost today.

The output is a single `.design/<name>.md` file cut into vertical slices instead of separate Flows, Schema and API sections. Each slice carries its own behaviour table, contract, data and open questions, plus a status of `clear`, `blocked by`, `rfc`, `spike` or `design`. A planner can see from one column which work can start. The size is capped: about 2,000 words for the part a team reads together, about 4,000 in total, and five to eight key decisions. A bundled Python validator checks those limits and the document's internal consistency before handover.

## How a session goes

> We keep talking about letting customers pay invoices online instead of by bank transfer. I'm not sure it's worth it yet. Can you help me think it through?

1. **Situation.** The agent establishes whether the product is in use, unshipped, or under construction, and whether someone already committed to the work. It checks what is cheap to check (branches, the issue tracker, earlier `.design/` files) and asks about the rest. If the change is cheap to reverse, small in impact, and uncontested, it gives a one-paragraph recommendation and writes no file.
2. **Problem.** It classifies the problem. For an absence problem like this one, the key question is what customers do instead today. It asks one or two questions at a time, each with a recommended answer.
3. **Evidence and journey.** It names the number that would change the decision before it looks for that number. If nobody tracks it, the agent asks the people involved instead of reading the gap as "small". Then it walks the journey states (first time, retry, expired, abandoned) and asks what should happen in each.
4. **Cheaper paths.** Once, it lists ways to remove the cost without building the proposed thing: change a default, handle it by hand, buy something.
5. **Verdict: stop.** It offers four outcomes (build, build smaller, not now, do not build) and waits for confirmation. If the work was already committed, it records who committed and continues. A declined verdict produces a short document that ends at Scope.
6. **Decide.** Now it reads the repository: churn, author count, recency and conventions, which take precedence over outside ideas. It proposes a lighter and a heavier shape. The lighter one is recommended unless a condition that holds today favors the heavier.
7. **Write and check.** It loads `references/document-format.md` and writes the file. It runs `scripts/validate_design.py` and fixes every error, then gives the document to a fresh subagent to look for contradictions. For designs with an expensive one-way door, a fresh agent also drafts the first slice's spec as a dry run.

## What's in the folder

- `references/document-format.md`: the template, loaded only at write time and never during the interview. It fixes the section order, from the status header through Summary, Key decisions, Open, Slices, Migration and References. It includes a Mermaid sequence-diagram skeleton for slices with a one-way door, lists which sections a declined document keeps, and provides a Portuguese heading table.
- `scripts/validate_design.py`: a standard-library Python 3 checker that exits 1 on errors. It verifies these things:
  - the required sections exist and every anchor resolves
  - the decision index matches the decision sections and the slices that cite each decision as `D2 (name)`
  - the Order line lists every slice once and respects dependencies
  - no slice is marked `clear` while Open says something blocks its spec
  - every success target has a measurement
  - every code such as `Q-03` is defined on the page
  - word counts stay within budget

  It reads English and Portuguese headings.

## Choosing between similar skills

- [Technical Design Doc Creator](/skills/technical-design-doc-creator/) fills a conventional TDD with mandatory sections, among them security, testing, monitoring, rollback and an implementation plan. Pick it when the decision is made and your organization expects that format. Pick tlc-discover when whether to build is still open, or when you want a capped, slice-based document that leaves tasks to planning.
- [tlc-prd](/skills/tlc-prd/) runs the same front half (situation, problem, success, journey states) and stops before any technical design. Pick it for product requirements without architecture.
- [tlc-spec-lean](/skills/tlc-spec-lean/) and [tlc-spec-driven](/skills/tlc-spec-driven/) plan and build one feature that is already clear. tlc-spec-lean explicitly excludes standalone design documents. If you can describe the feature in a paragraph, start there.
- [create-rfc](/skills/create-rfc/) suits the choices tlc-discover refuses to settle in conversation. High-impact, low-clarity decisions become `rfc` rows in Open instead of guesses.

## Works well with

tlc-discover is the first stage of the [TLC AI dev flow](/tlc-ai-dev-flow/), which continues with [tlc-plan](/skills/tlc-plan/), [tlc-implement](/skills/tlc-implement/) and [the-judge](/skills/the-judge/). The hand-off unit is the slice. tlc-plan, or [tlc-spec-lean](/skills/tlc-spec-lean/) for a single feature, starts from one `clear` slice. It takes that slice's behaviour table and cited decisions, then settles method names and error copy against the code. Slices marked `blocked by`, `rfc` or `spike` wait for their Open row to close. If you ask tlc-discover to cut a finished design into tasks, it hands the request off.

## Recent changes

- **2026-11-10 (catalog 0.17.20):** Validator fixes. The script now closes the file it reads, prints UTF-8 on Windows, and corrects five false results, among them underscore anchors, a single slice with no index, and "Pay Invoice" being counted as a mention of "Invoice".
- **2026-11-10 (skill 0.10.0):** The document was rebuilt to be read in one sitting. This release added the status header, the Key decisions index, a single Open table, the word budget, Portuguese headings, the validator and the fresh-reader review.
- **2026-11-02 (catalog 0.17.19):** The description was rewritten to trigger on "design doc" requests and send clear features to tlc-spec-lean or tlc-spec-driven.
- **2026-09-18 (skill 0.9.0):** Slice-based documents replaced the earlier Roadmap and Decisions table.
- **2026-09-09 (catalog 0.17.6):** The skill was added alongside tlc-plan and tlc-implement.
