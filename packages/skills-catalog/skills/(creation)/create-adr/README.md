# ADR Creator

A skill for AI coding agents that creates Architecture Decision Records (ADRs) — concise, durable documents that capture the context, decision, and consequences of significant architectural choices so future engineers understand *why* things are the way they are.

## What It Does

This skill guides AI agents to create well-structured ADRs in three industry-standard formats:

- **MADR** (Markdown Architectural Decision Records) — structured with options comparison, recommended for most teams
- **Nygard** — minimal original format: Context / Decision / Consequences
- **Y-Statement** — single-paragraph compact format for inline documentation

The skill automatically:

- Assigns the next sequential ADR number by scanning your `docs/adr/` directory
- Detects your language (English, Portuguese, Spanish) and generates in that language
- Guides you with questions if context is missing
- Enforces naming conventions (`001-kebab-case-title.md`)
- Links superseded/superseding ADRs correctly

## ADR vs RFC — Which One Do You Need?

| Question | Use |
|----------|-----|
| Should we do X? Which option? | **RFC** |
| We've decided — document it for future engineers | **ADR** |
| Need approval from leadership before acting | **RFC** |
| Need to preserve the rationale of a past choice | **ADR** |

**Rule of thumb**: RFC drives the decision. ADR records it. A common flow is RFC → decision meeting → ADR.

## How to Use

### Basic Usage

Just tell the agent you want an ADR:

**English:**
```
Write an ADR for using PostgreSQL as our primary database
```

**Portuguese:**
```
Escreva um ADR para documentar a decisão de usar PostgreSQL
```

**Spanish:**
```
Escribe un ADR sobre la decisión de usar microservicios
```

### With Rich Context (faster — skips most questions)

```
Write an ADR for adopting GraphQL over REST for our public API.
We evaluated REST, GraphQL, and gRPC. Chose GraphQL because our clients
need flexible queries and we're building a public partner API.
Main trade-off is increased backend complexity. Status: Accepted.
```

### Interactive Mode

If you provide minimal context, the skill will ask:

1. **Format**: MADR (structured), Nygard (minimal), or Y-Statement (compact)?
2. **Status**: Accepted, Proposed, Deprecated, or Superseded?
3. **Supersedes**: Does this replace a previous ADR?

Then it validates mandatory fields before generating the document.

## ADR Formats

### MADR (Recommended)

Best for decisions where multiple options were seriously evaluated. Includes a structured options comparison.

```markdown
# ADR-003: Use Redis for Session Storage

- **Date**: 2026-03-10
- **Status**: Accepted

## Context and Problem Statement
Our API requires fast session lookups at high concurrency...

## Decision Drivers
- Must support 50k concurrent sessions
- TTL-based expiry required

## Considered Options
- Redis (chosen)
- PostgreSQL session table
- JWT stateless tokens

## Decision Outcome
Chosen: **Redis**, because TTL support and in-memory performance...

### Positive Consequences
- Sub-millisecond session reads
- Built-in expiry without cron jobs

### Negative Consequences
- Additional service to operate
- Session data lost on Redis restart without persistence config
```

### Nygard (Minimal)

Best for quick recording of straightforward decisions.

```markdown
# ADR-003: Use Redis for Session Storage

## Status
Accepted

## Context
Our API needs fast, expirable session storage at scale...

## Decision
We will use Redis for session storage, managed via AWS ElastiCache...

## Consequences
Fast reads with native TTL. Adds operational complexity.
```

### Y-Statement (Compact)

Best for embedding decisions inline or in very lean documentation cultures.

```markdown
In the context of **high-concurrency session storage**,
facing **the need for automatic expiry and sub-millisecond reads**,
we decided **to use Redis**,
to achieve **low-latency session lookups with zero manual cleanup**,
accepting **the operational overhead of an additional managed service**.
```

## What the Agent Will Ask (if context is missing)

**About the decision:**
- What was decided? (noun phrase — e.g., "Use PostgreSQL for primary storage")
- What is the current status — Accepted, Proposed, Deprecated, or Superseded?

**About the context:**
- What situation or forces led to this decision?
- What constraints existed (technical, business, team)?

**About alternatives:**
- What other options were considered?
- Why were they rejected?

**About consequences:**
- What becomes easier or better as a result?
- What trade-offs or downsides are you accepting?

**About history:**
- Does this supersede a previous ADR?

## The Generated ADR

Every ADR includes:

1. **Title** — noun phrase recording the decision (not a question)
2. **Metadata** — date, status, deciders, tags
3. **Context** — the forces and constraints that made this decision necessary
4. **Decision** — what was chosen and why, with honest rationale
5. **Consequences** — positive and negative consequences of this choice
6. **Options** (MADR) — alternatives considered with pros/cons per option
7. **Links** — related ADRs, RFCs, tickets, and supersession relationships

## File Naming Convention

ADRs live in a dedicated directory, numbered sequentially:

```
docs/adr/
├── 001-use-postgresql-for-primary-storage.md
├── 002-adopt-event-driven-architecture.md
├── 003-use-redis-for-session-storage.md
└── README.md   ← optional index
```

The skill scans your existing ADRs to assign the correct next number.

Common directory locations: `docs/adr/`, `docs/decisions/`, `adr/`, `.adr/`

## Tips for Best Results

### 1. Title is a noun phrase, not a question

```
❌ Should we use Redis for sessions?
✅ Use Redis for Session Storage
```

### 2. Context explains the *forces*, not just the facts

```
❌ We needed a session store.
✅ Our API must support 50k concurrent sessions with automatic expiry.
   The team evaluated Redis, PostgreSQL, and stateless JWTs. PostgreSQL
   was ruled out due to TTL complexity; JWTs were ruled out because
   server-side revocation is required for security compliance.
```

### 3. Consequences are honest about trade-offs

```
❌ Redis is fast and easy to use.
✅ Fast session reads with native TTL support.
   Adds an additional managed service to our infrastructure.
   Session data is at risk if Redis persistence is misconfigured.
```

### 4. Always supersede, never edit

When a decision changes, create a new ADR and mark the old one as superseded. This preserves the historical context — the old decision was correct *given what was known at the time*.

### 5. Keep it short

Target 200–500 words. If the decision needs extensive explanation, link to the RFC or TDD that drove it. ADRs are memory aids, not implementation guides.

## Common Use Cases

### Good use cases for an ADR

- Choosing a database, message broker, or infrastructure technology
- Adopting a new framework or language
- Selecting an architectural pattern (event-driven, CQRS, BFF, etc.)
- Deciding on an API style (REST, GraphQL, gRPC)
- Choosing a deployment strategy (blue-green, canary, feature flags)
- Picking a testing strategy or CI/CD toolchain
- Recording a security or compliance decision

### Not ideal for an ADR

- Decisions not yet made — use **RFC** to drive the decision first
- Implementation plans — use **TDD** for how to build something
- Trivial choices (naming conventions, minor config values)
- Exploratory spikes — write up findings separately, then record the decision in an ADR

## Language Support

| Language | Example Trigger |
|----------|-----------------|
| English | "Write an ADR for using PostgreSQL" |
| Portuguese | "Escreva um ADR para documentar o uso do PostgreSQL" |
| Spanish | "Escribe un ADR sobre la decisión de usar PostgreSQL" |

All section headers and content are automatically generated in the detected language.

## Next Steps After Creating an ADR

1. **Commit** the ADR to your repository alongside the code it documents
2. **Link** from the relevant code, PR, or RFC that triggered it
3. **Update** your ADR index (`docs/adr/README.md`) if you maintain one
4. **Reference** the ADR in PR descriptions when implementing the decision
5. **Supersede** it with a new ADR if the decision changes — never edit the old one

## Support

For issues or questions about this skill, refer to the main [agent-skills repository](https://github.com/tech-leads-club/agent-skills).
