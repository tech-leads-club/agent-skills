---
name: context7-skill
description: 'Leverage the Context7 MCP as a persistent cognitive layer for memory, state management, and documentation retrieval. Use when starting a new session, resuming a previous task, resolving ambiguous references, fetching library docs, storing decisions or milestones, or optimizing session context. Triggers on "context7", "retrieve context", "store memory", "session state", "library docs", "resolve library".'
metadata:
  author: edmarpaulino
  version: '0.0.1'
---

# Context7 Skill Cheat Sheet

Use the Context7 MCP not just for information retrieval, but as a persistent cognitive layer. Actively manage state, map relationships, and optimize context flow using the Superpower Framework below.

## 1. Tool Mapping & Trigger Logic

Select the correct Context7 tool based on the user's scenario:

| User Scenario                | Context7 Tool / Action                                     | Trigger Condition                                                |
| ---------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------- |
| **New Task / Project Start** | `retrieve_context` (Query: "Project State & Architecture") | User initiates a new session or switches topics.                 |
| **Ambiguous Reference**      | `graph_relation_search` (Query: Entity Name)               | User mentions a term/person (e.g., "@Ryan") without defining it. |
| **Complex Logic / Code**     | `resolve_library_id` + `query_docs`                        | User requests implementation details for specific libraries.     |
| **Decision / Milestone**     | `store_memory` (Tag: `#decision`, `#milestone`)            | User confirms a choice, fixes a bug, or finalizes a design.      |
| **Session End**              | `optimize_state` (Summarize & Store)                       | User says "we're done" or task is complete.                      |

## 2. Context Injection Logic (Anti-Stuffing Protocol)

Do not dump all memory into the context. Follow this injection flow:

- **Reactive (Default)**: Wait for a specific entity mention. _Example: User asks about "the auth bug". -> Retrieve memory tagged `#auth` + `#bug`._
- **Proactive (High Value)**: If the user enters a high-risk zone (e.g., database migration, production deployment), _automatically_ inject relevant constraints and past failure modes from memory.
- **Silence**: If memory confidence is low (<70%), do not inject. Ask clarifying questions instead.

## 3. Structured Storage Guidelines

When saving information to Context7, follow this metadata schema for high-precision future retrieval:

- **Format**: `[Category] : [Entity] -> [Action/State] | #tags`
- **Semantic Tags**:
  - `#core` — Immutable facts
  - `#state` — Current progress
  - `#preference` — User constraints
  - `#debt` — Known issues/TODOs
- **Example**: `[Arch] : AuthSystem -> Switched to JWT for statelessness | #decision #security #v2.1`

## 4. The Superpower Framework

Treat the conversation as a continuous, living graph.

### A. Persistence (Infinite Thread Mindset)

- **Rule**: Never assume a blank slate. Always check `retrieve_context` for "Active Threads" at the start of a turn.
- **Action**: If a user resumes a task from days ago, acknowledge the last state explicitly: _"Resuming the API refactor where we left off—specifically the rate-limiter logic."_

### B. Relationship Mapping (Graph Thinking)

- **Connect Entities**: Explicitly link disparate items in storage.
  - _Bad_: "Ryan is working on the frontend."
  - _Good_: `Link: Ryan -> OWNS -> Frontend_Repo ; Context: Assigned during Q3 sprint.`
- **Trace Dependencies**: When a core component changes, query the graph for dependent entities (`Who/What relies on X?`) and warn the user of potential side effects.

### C. Optimization (Token Economy)

- **Summarization Strategy**: Before storing a long conversation, distill it into Decision Records (ADRs).
  - _Input_: 50 turns of debugging a React hook.
  - _Output (Storage)_: `[Fix] : useAuthHook -> Added dependency array to prevent infinite loop | #react #bugfix`
- **Pruning**: Mark old `#state` memories as `archived` when a new `#milestone` is reached to prevent stale context retrieval.
