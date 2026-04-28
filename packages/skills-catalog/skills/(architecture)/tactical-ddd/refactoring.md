# Refactoring Moves

Apply moves in order. Stop when the class passes all detection checks.

---

## Move 1 — Replace setter chain with intent method

**When**: Multiple setters called together to perform one operation.

```typescript
// Before ❌
order.setStatus('CONFIRMED');
order.setConfirmedAt(new Date());
order.setConfirmedBy(userId);

// After ✅
class Order {
  confirm(confirmedBy: UserId): void {
    if (this.status !== OrderStatus.PENDING) {
      throw new Error('Only pending orders can be confirmed.');
    }
    this.status = OrderStatus.CONFIRMED;
    this.confirmedAt = new Date();
    this.confirmedBy = confirmedBy;
    DomainEventPublisher.publish(new OrderConfirmed(this.orderId, confirmedBy));
  }
}
order.confirm(userId);
```

**Rules**:
- The method name must come from the Ubiquitous Language
- All business guards go at the top (fail fast)
- Publish a Domain Event after the state change succeeds

---

## Move 2 — Pull service logic into the Aggregate

**When**: A service method fetches an Aggregate and then does business logic on it.

```typescript
// Before ❌ — logic lives in service
class DiscountService {
  apply(orderId: string, pct: number): void {
    const order = this.repo.find(orderId);
    if (pct < 0 || pct > 100) throw new Error('Invalid discount');
    const discounted = order.getTotal() * (1 - pct / 100);
    order.setTotal(discounted);
    order.setDiscountApplied(true);
  }
}

// After ✅ — logic inside Aggregate
class Order {
  applyDiscount(discount: Discount): void {
    if (this.discountApplied) throw new Error('Discount already applied.');
    this.total = this.total.applyDiscount(discount);
    this.discountApplied = true;
    DomainEventPublisher.publish(new OrderDiscountApplied(this.orderId, discount));
  }
}
// Service becomes a thin coordinator
class DiscountService {
  apply(orderId: string, pct: number): void {
    const order = this.repo.find(orderId);
    order.applyDiscount(new Discount(pct));  // VO validates range
    this.repo.save(order);
  }
}
```

---

## Move 3 — Extract primitive to Value Object

**When**: Primitives carry domain meaning or validation rules.

```typescript
// Before ❌
class Order {
  customerId: string;
  totalAmount: number;
  currency: string;
}

// After ✅
class CustomerId {
  constructor(private readonly value: string) {
    if (!value) throw new Error('CustomerId cannot be empty');
  }
  equals(other: CustomerId): boolean { return this.value === other.value; }
  toString(): string { return this.value; }
}

class Money {
  constructor(readonly amount: number, readonly currency: string) {
    if (amount < 0) throw new Error('Amount cannot be negative');
    if (!currency) throw new Error('Currency required');
  }
  add(other: Money): Money {
    if (this.currency !== other.currency) throw new Error('Currency mismatch');
    return new Money(this.amount + other.amount, this.currency);
  }
  applyDiscount(discount: Discount): Money {
    return new Money(this.amount * (1 - discount.rate), this.currency);
  }
  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }
}

class Order {
  constructor(readonly customerId: CustomerId, private total: Money) {}
}
```

---

## Move 4 — Add business guards

**When**: Methods mutate state without preconditions.

Every intent method should start with:
1. Pre-state validation (`if (this.status !== X) throw`)
2. Cross-field consistency checks
3. Then state mutation
4. Then Domain Event publication

```typescript
cancel(reason: string): void {
  // Guard 1: correct state
  if (this.status === OrderStatus.DELIVERED) {
    throw new Error('Cannot cancel a delivered order.');
  }
  // Guard 2: required data
  if (!reason || reason.trim().length === 0) {
    throw new Error('Cancellation reason is required.');
  }
  this.status = OrderStatus.CANCELLED;
  this.cancellationReason = reason;
  DomainEventPublisher.publish(new OrderCancelled(this.orderId, reason));
}
```

---

## Move 5 — Break Domain Service from Application Service

**When**: An Application Service contains business rules, not just coordination.

| Belongs in Domain Service | Belongs in Application Service |
|--------------------------|-------------------------------|
| Business rules involving multiple Aggregates | Loading Aggregates from repositories |
| Domain calculations | Transaction management |
| Validation spanning Aggregates | Calling Domain Services |
| Stateless business operations | Mapping to/from DTOs |

```typescript
// Domain Service — business logic
class AuthenticationService {
  authenticate(tenantId: TenantId, username: string, password: string): UserDescriptor | null {
    const tenant = this.tenantRepo.findById(tenantId);
    if (!tenant?.isActive()) return null;
    const user = this.userRepo.findByCredentials(tenantId, username, this.encrypt(password));
    return user?.isEnabled() ? user.toDescriptor() : null;
  }
}

// Application Service — coordinates
class UserAppService {
  login(tenantId: string, username: string, password: string): UserDescriptorDto {
    const descriptor = this.authService.authenticate(
      new TenantId(tenantId), username, password
    );
    if (!descriptor) throw new UnauthorizedError();
    return UserDescriptorMapper.toDto(descriptor);
  }
}
```

---

## Domain Event Checklist (after each move)

- [ ] Named in past tense using Ubiquitous Language (`OrderConfirmed`, not `StatusChanged`)
- [ ] Published after successful state change, not before
- [ ] Contains only data the Aggregate already has (no extra repo calls)
- [ ] Immutable (all fields `readonly`)
- [ ] Carries `occurredOn: Date` and optionally `eventVersion`
