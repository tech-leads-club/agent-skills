# Anemia Detection

## Step 1 — Code Signals to Scan For

Search for these patterns. Each match is a potential anemia indicator:

| Signal | Pattern | Weight |
|--------|---------|--------|
| Public setter | `public set[A-Z]` | +2 |
| Setter chain in caller | `entity.setA(); entity.setB()` | +3 |
| Logic in Application/Service layer that mutates entity | `entity.setX(computedValue)` inside service method | +3 |
| Class with only getters/setters, no domain methods | All methods match `get.*\|set.*\|is.*\|has.*` | +4 |
| Primitive obsession instead of Value Objects | `string customerId`, `number amount` on Entity | +1 |
| Coordinator pattern: service fetches + mutates | `repo.find()` then multiple `entity.setX()` | +2 |
| Missing guards | Methods with no precondition checks | +1 |

## Step 2 — Severity Score

Sum the weights across all signals in the class:

| Score | Severity | Meaning |
|-------|----------|---------|
| 0 | None | Well-modelled |
| 1–3 | Mild | Minor improvements; priorities elsewhere |
| 4–6 | Moderate | Refactor; business logic is leaking |
| 7+ | Severe | Full redesign; domain is just a DTO |

## Step 3 — Class-Level Checklist

For each class under review:

- [ ] Does it have public setters for business-meaningful fields?
- [ ] Do callers set multiple fields to perform a single operation?
- [ ] Is the class used as a parameter bag by services that contain the real logic?
- [ ] Are there zero methods that express domain intent?
- [ ] Are IDs and measures stored as primitives instead of Value Objects?
- [ ] Are there no Domain Events published after state changes?

## Common Anemia Patterns

### The Coordinator Service
```typescript
// ❌ Logic lives outside the entity
class OrderService {
  confirm(orderId: string): void {
    const order = this.repo.find(orderId);
    order.setStatus('CONFIRMED');        // setter
    order.setConfirmedAt(new Date());    // setter
    order.setConfirmedBy(this.userId);  // setter
    this.repo.save(order);
  }
}
```
**Signal**: Three setters to express one business operation.

### The Data Transfer Object Disguised as Entity
```typescript
// ❌ Pure data bag
class Product {
  getName(): string { return this.name; }
  setName(v: string) { this.name = v; }
  getPrice(): number { return this.price; }
  setPrice(v: number) { this.price = v; }
  getStock(): number { return this.stock; }
  setStock(v: number) { this.stock = v; }
}
```
**Signal**: Zero domain behaviour, all methods are accessors.

### Primitive Obsession
```typescript
// ❌ Primitives lose domain meaning and validation
class Order {
  customerId: string;   // Should be CustomerId VO
  totalAmount: number;  // Should be Money VO
  currency: string;     // Part of Money VO
}
```
