## Why teams use it

Most codebases are organized by technical layer, and the business boundaries are buried in class names and shared entities. domain-analysis has the agent recover those boundaries from the code itself: it collects the business concepts, sorts them by the vocabulary they use, and proposes subdomains and bounded contexts, with a score attached to each grouping instead of a gut call.

What sets it apart in this catalog is that it works from language, not structure. The main test for a boundary is whether a word changes meaning, such as "Patient" in clinical care versus billing. Cohesion is scored on a fixed 10-point rubric: vocabulary and usage are worth up to 3 points each, data relationships and co-change up to 2 each. That makes two groupings comparable and gives a reviewer something concrete to dispute.

It also has a clear stopping point. The skill describes itself as strategic analysis: it names which domains exist and how they should integrate, and leaves aggregate design and refactoring to other skills.

## How a session goes

> Our backend monolith has grown for years and everything imports everything. What are the actual business domains in here, and where would you draw the boundaries?

1. The agent loads `SKILL.md`. The skill has no scripts, so the rest of the session is the agent reading source files directly.
2. It sweeps the codebase for business concepts by naming and annotation patterns: entity markers such as `@Entity`, classes ending in `Service`, `Manager`, `Handler`, `UseCase` or `Command`, and controllers or resolvers. It drops infrastructure classes along the way.
3. It groups the concepts into language clusters (billing terms, content terms, identity terms) and notes any term that means different things in different clusters.
4. It classifies each cluster as Core, Supporting or Generic with a two-question decision tree. Whether something is a competitive advantage can't be read from code, and the skill tells the agent to check with domain experts. This is where the agent should ask you. `QUICK-REFERENCE.md` lists the questions to raise, such as "could we outsource it?" and "how often does it change?"
5. It scores cohesion inside each cluster and between pairs of clusters. Then it checks five rules: linguistic mismatch, cross-domain dependencies, mixed responsibilities, generic logic inside core code, and unclear ownership.
6. It proposes one bounded context per subdomain where possible and picks an integration pattern for each relationship, from Shared Kernel to Anti-corruption Layer.
7. It writes up four artifacts: a domain map, a cross-domain cohesion matrix, a prioritized issue report that points to specific files and classes, and a bounded context map.

## What's in the folder

- `SKILL.md` holds the six-phase process, the cohesion formula, the five detection rules and the four output templates.
- `QUICK-REFERENCE.md` is a lookup sheet. It covers point-by-point guidance for each cohesion dimension, red-flag code snippets (cross-domain entity imports, foreign keys across domains, injected services from another domain) with their preferred alternatives, context sizing guidance, and signal phrases for each subdomain type. The agent opens it, like `EXAMPLES.md`, when it needs more detail than `SKILL.md` gives.
- `EXAMPLES.md` has four worked analyses: e-commerce, healthcare, a SaaS project tool and a video streaming platform. It shows recurring problems like "identity leakage", where a `User` entity is referenced from every domain, and their fixes, such as context-specific IDs (`OwnerId`, `CustomerId`). It ends with a six-step template for writing up an analysis.
- `README.md` is a human-facing overview with sample prompts and customization tips, such as adding framework-specific detection patterns for NestJS.

## Choosing between similar skills

- [Domain Identification and Grouping](/skills/domain-identification-grouping/) starts from components that have already been identified and assigns them to domains, then suggests namespace changes. Pick it when you have a component inventory and need a mapping. Pick domain-analysis when you don't yet know what the domains are. Each skill's description routes to the other on exactly this point.
- [Coupling Analysis](/skills/coupling-analysis/) measures how modules depend on each other by integration strength, distance and volatility, and can use git history for change frequency. Pick it to find out whether a dependency is harmful. Pick domain-analysis to find out whether two concepts belong in the same place at all.
- [Modular Decomposition](/skills/modular-decomposition/) runs a full monolith pipeline and bundles a copy of this skill as reference files for its grouping step. Pick it if you want sizing, duplication, hierarchy and coupling covered in one install. Pick domain-analysis on its own when you only need the DDD layer.
- [Tactical DDD](/skills/tactical-ddd/) works inside one model: it finds anemic entities and refactors them toward aggregates and value objects. It explicitly excludes strategic context mapping, which is what this skill covers.

## Works well with

- Before: [Component Identification and Sizing](/skills/component-identification-sizing/) gives you an inventory of what exists, which helps when the codebase is large.
- After: [Domain Identification and Grouping](/skills/domain-identification-grouping/) can turn the bounded contexts into concrete component assignments.
- After: [Coupling Analysis](/skills/coupling-analysis/) uses the same Core, Supporting and Generic classification to judge volatility. A classification you've already confirmed saves it from guessing.
- After: [Decomposition Planning and Roadmap](/skills/decomposition-planning-roadmap/) turns the boundaries into an extraction order. Its description sends domain questions back to this skill.
- Inside a context: [Tactical DDD](/skills/tactical-ddd/) for the domain model once the boundary is settled.

More options are in the [architecture category](/categories/architecture/).

## Recent changes

- **2026-11-21, v0.17.23:** Removed a stray `/ 10` from the cohesion formula. The four components already add up to 10, so the old formula produced scores that could never reach the "high" and "medium" bands.
- **2026-02-26:** Rewrote the description around trigger questions and added explicit routing to domain-identification-grouping and coupling-analysis.
- **2026-02-06:** Moved the skill from the development category to architecture.
- **2026-02-05:** Added to the catalog as `subdomain-identification`, renamed to `domain-analysis` the same day.
