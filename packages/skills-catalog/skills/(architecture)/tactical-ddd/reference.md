# Tactical DDD Reference

## Entity

**Use when**: Object needs individual identity tracked over time, even if attributes change.

```typescript
class Entity<T> {
  constructor(protected readonly id: T) {}
  equals(other: Entity<T>): boolean {
    if (!other || this.constructor !== other.constructor) return false;
    return this.id === other.id;  // identity only
  }
}
```

**Rules**:
- Identity is `readonly`, set once in constructor, never changed
- Setters are `private`; public API uses expressive methods
- Publishes Domain Events on significant state changes
- Validates invariants in constructor and in each mutating method

**Checklist**:
- [ ] Unique immutable identity?
- [ ] Equality by identity (not attributes)?
- [ ] Methods express Ubiquitous Language?
- [ ] Setters private/protected?
- [ ] Domain Events on significant changes?
- [ ] Invariants validated on construction and mutation?

---

## Value Object

**Use when**: Concept is described by its attributes, has no individual identity.

```typescript
class Money {
  constructor(readonly amount: number, readonly currency: string) {
    if (amount < 0) throw new Error('Amount cannot be negative');
  }
  add(other: Money): Money {                     // side-effect-free
    if (this.currency !== other.currency) throw new Error('Currency mismatch');
    return new Money(this.amount + other.amount, this.currency);
  }
  equals(other: Money): boolean {               // value equality
    return this.amount === other.amount && this.currency === other.currency;
  }
}
// Mutation = replacement
let price = new Money(100, 'USD');
price = price.add(new Money(20, 'USD'));  // new object, not mutation
```

**Rules**:
- All fields `readonly` — never mutate after construction
- Side-effect-free methods return new instances
- Equality compares all attributes
- Validates on construction

**Common VOs**: `UserId`, `OrderId`, `Money`, `Address`, `EmailAddress`, `DateRange`, `FullName`

**Checklist**:
- [ ] Fully immutable (all fields `readonly`)?
- [ ] Equality by value?
- [ ] Methods return new instances?
- [ ] Forms a conceptual whole?
- [ ] Validated on construction?

---

## Aggregate

**Use when**: A group of Entities + VOs must be consistent as a unit.

**Four rules**:

| Rule | Description |
|------|-------------|
| **True invariants only** | Only group objects when there's a business rule requiring them to be consistent in the same transaction |
| **Keep it small** | Root + VOs by default. Add child Entities only for true invariants |
| **Reference by ID** | `sprintId: SprintId` not `sprint: Sprint` |
| **One Aggregate per transaction** | Cross-Aggregate coordination uses Domain Events |

```typescript
// ✅ Small Aggregate with true invariant
class BacklogItem {
  private tasks: Task[] = [];
  private status: BacklogItemStatus;
  private productId: ProductId;   // reference by ID — not Product object
  private sprintId: SprintId | null;

  estimateTaskHours(taskId: TaskId, hours: number): void {
    this.findTask(taskId).estimateHoursRemaining(hours);
    if (this.allTasksCompleted()) {
      this.status = BacklogItemStatus.DONE;
    }
    // Invariant: task hours affect item status — true invariant justifying grouping
  }

  commitTo(sprint: Sprint): void {
    if (!this.isScheduledForRelease()) throw new Error('Must be scheduled.');
    if (this.isCommittedToSprint() && sprint.sprintId !== this.sprintId) {
      this.uncommitFromSprint();
    }
    this.sprintId = sprint.sprintId;
    this.status = BacklogItemStatus.COMMITTED;
    DomainEventPublisher.publish(new BacklogItemCommitted(this.backlogItemId, sprint.sprintId));
  }
}
```

**When to break the one-transaction rule** (rare):
- UI batch creation with no invariants between items
- No messaging infrastructure available
- Explicit global transaction policy (document the reason in code)

**Checklist**:
- [ ] Clear Root Entity?
- [ ] True invariant justifies the grouping?
- [ ] Small enough (no large collections)?
- [ ] Other Aggregates referenced by ID only?
- [ ] One Aggregate per transaction?
- [ ] Eventual consistency via Domain Events for cross-Aggregate rules?

---

## Domain Service

**Use when**: A business operation involves multiple Aggregates or doesn't naturally belong to any single one.

**Warning**: Overuse leads back to anemic model. Ask first: "Can this live in the Aggregate?"

| Criterion | Belongs in Entity/Aggregate | Belongs in Domain Service |
|-----------|-----------------------------|--------------------------|
| Involves only one Aggregate's state | ✅ | — |
| Requires loading multiple Aggregates | — | ✅ |
| Calculation needs context from many objects | — | ✅ |
| Stateless business rule | ✅ (if single aggregate) | ✅ (if multi-aggregate) |

```typescript
// ✅ Domain Service: authentication spans Tenant + User
class AuthenticationService {
  authenticate(tenantId: TenantId, username: string, password: string): UserDescriptor | null {
    const tenant = this.tenantRepo.findById(tenantId);
    if (!tenant?.isActive()) return null;
    const encrypted = this.encryptionService.encrypt(password);
    const user = this.userRepo.findByCredentials(tenantId, username, encrypted);
    return user?.isEnabled() ? user.toDescriptor() : null;
  }
}
```

**Checklist**:
- [ ] Operation doesn't belong to any single Entity or VO?
- [ ] Stateless?
- [ ] Expresses Ubiquitous Language?
- [ ] NOT being used to avoid behaviour in Entities?
- [ ] Business rules here, not in Application Service?

---

## Domain Events

**Naming**: Past tense + Ubiquitous Language. `OrderConfirmed`, `BacklogItemCommitted`, `UserRegistered`.

```typescript
interface DomainEvent {
  readonly occurredOn: Date;
  readonly eventVersion: number;
}

class OrderConfirmed implements DomainEvent {
  readonly occurredOn = new Date();
  readonly eventVersion = 1;
  constructor(
    readonly orderId: OrderId,
    readonly confirmedBy: UserId,
  ) {}
}
```

**Publication pattern**:
1. Complete state change
2. Publish event (state is already consistent)
3. Subscribers run in separate transactions for cross-Aggregate consistency

**Checklist**:
- [ ] Named in past tense?
- [ ] All fields `readonly`?
- [ ] Published after (not during) state change?
- [ ] Carries only data the Aggregate already owns?
- [ ] Cross-Aggregate handlers run in separate transactions?
