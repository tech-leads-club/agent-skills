# Principles in depth

One section per principle: **definition**, **rules for agents**, **abstract example**. No stack or folder assumptions.

---

## 1 — Well-defined boundaries

**Definition.** Consumers depend on a **small, intentional public surface** (operations, events, types that are part of the contract). Everything else is implementation detail.

**Rules for agents.**

- Prefer extending behavior by adding to the **documented** API rather than importing internals.
- When suggesting refactors, preserve or shrink the public surface; do not widen it “for convenience.”
- Name things so **contract vs internal** is obvious in reviews (e.g. “public operation” vs “internal helper” is a conceptual distinction even without tooling).

**Abstract example.** A “Checkout” context exposes `placeOrder(command)` and `OrderPlaced` events. Other contexts must not reach into Checkout’s internal pricing tables; they subscribe to events or call `placeOrder`, not “update row X.”

---

## 2 — Composability

**Definition.** Modules can be **assembled in different products or deployments** without rewriting their core logic for each combination.

**Rules for agents.**

- Avoid hidden assumptions like “this only runs when module B is present” unless expressed as an **optional integration** or **plugin** contract.
- Configuration and feature flags should not become spaghetti that only one deployment understands.

**Abstract example.** The same “Inventory” module works in a small CLI tool and a large web app because its contract does not assume a specific UI or host—only the composition root changes.

---

## 3 — Independence

**Definition.** Modules do not rely on **hidden shared mutable state** across boundaries. Tests can run a module with **fakes** at its edges.

**Rules for agents.**

- Flag “global singletons” that encode cross-module policy without an explicit contract.
- Prefer **passing dependencies explicitly** or **declared injection** over ambient globals for cross-cutting concerns.

**Abstract example.** Two services in different modules both mutate a process-wide cache keyed by “user id” without coordination → independence is violated; replace with an explicit cache interface owned by one module or a documented shared service.

---

## 4 — Individual scale

**Definition.** **Throughput, storage, batching, and limits** can be tuned per module where needed, without forcing one global setting on everyone.

**Rules for agents.**

- When performance tuning, ask **which bounded context** owns the bottleneck; avoid “fixing” by coupling unrelated code paths.
- Suggest **per-module** quotas, pools, or batch sizes when load profiles differ.

**Abstract example.** “Search” needs a large read replica and aggressive caching; “Billing” needs strict serial writes. Scaling policies are not identical, and neither module forces the other’s settings.

---

## 5 — Explicit communication

**Definition.** All **cross-module** interaction goes through **known contracts**: APIs, messages, events, or versioned schemas—not incidental shared files or implicit side channels.

**Rules for agents.**

- Document **inputs, outputs, errors, and versioning** for anything that crosses a boundary.
- Discourage “just import this DTO from their package” when that DTO is really an **internal** persistence shape.

**Abstract example.** Module A notifies Module B via `OrderPlaced { orderId, placedAt }` on a bus, not by writing into B’s database “because it’s faster.”

---

## 6 — Replaceability

**Definition.** Dependencies on other modules are expressed in terms of **interfaces, protocols, or stable contracts** so implementations can be swapped or mocked.

**Rules for agents.**

- At boundaries, prefer **narrow interfaces** (“payment gateway”, “clock”, “id generator”) over concrete vendor types leaking inward.
- Refactors that **pin** a module to one technology everywhere should be questioned unless that is a deliberate platform choice.

**Abstract example.** “Notifications” depends on `Notifier` with `send(recipient, body)`; email vs SMS vs push is replaceable behind that port.

---

## 7 — Deployment independence

**Definition.** Module code does not **assume** co-location in the same process or release unless that is an **explicit** architectural decision.

**Rules for agents.**

- Avoid “call this function directly in their package” as the only integration story when multiple deployments are possible.
- Prefer contracts that work across **in-process, out-of-process, or async** delivery with minimal change.

**Abstract example.** The same domain logic can run in a monolith today and behind a message queue tomorrow because interactions were modeled as operations/events, not as hardcoded in-process singletons.

---

## 8 — State isolation

**Definition.** Each module **owns** its authoritative store and naming for its facts. No silent sharing of the same logical data across boundaries without a **clear rule** (who writes, who reads, how consistency is achieved).

**Rules for agents.**

- Treat **reach-through persistence** (reading/writing another module’s store directly) as a **design smell** unless documented as an exceptional, reviewed pattern.
- Require **unambiguous names** for persisted concepts when multiple modules have similar nouns.

**Abstract example.** “Customer” in CRM and “Customer” in Billing are different aggregates with different IDs or explicit mapping—not two modules updating one ambiguous `customers` row.

---

## 9 — Observability

**Definition.** Logs, metrics, traces, and health checks can be **attributed** to a module (and often a use case) so incidents are diagnosable without reading the whole system.

**Rules for agents.**

- When adding diagnostics, include **context** (which operation, which correlation id), not only “error happened.”
- Avoid log lines that **cannot** be filtered by owning team or subsystem.

**Abstract example.** A failed payment shows `billing.capture` span with `orderId` and clear error code; support does not grep unrelated modules’ noise to find root cause.

---

## 10 — Fail independence

**Definition.** Failures are **bounded**: timeouts, retries with backoff, bulkheads, circuit breaking, idempotency—so one module’s outage does not **cascade blindly**.

**Rules for agents.**

- Cross-module calls should have **explicit** timeout and failure semantics; “hang forever” is a design bug at the boundary.
- Async handlers should be **idempotent** or deduplicated where duplicates are possible.

**Abstract example.** When Recommendations is down, Checkout still completes using defaults or a cached tier; the UI degrades instead of blocking purchase.
