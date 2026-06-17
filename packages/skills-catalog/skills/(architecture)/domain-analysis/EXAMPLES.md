# Subdomain Identification Examples

This document provides practical examples of applying subdomain identification across different types of codebases.

## Example 1: E-Commerce Platform

### Discovered Concepts

**Entities**:
- Product, Category, Inventory, SKU
- Order, OrderItem, Cart, CartItem
- Customer, Address, PaymentMethod
- Shipment, Tracking, Warehouse

**Services**:
- ProductCatalogService, InventoryService
- OrderProcessingService, CartService
- PaymentService, ShippingService
- CustomerService

### Language Groups

**Catalog Language**: product, category, SKU, inventory, stock
**Order Language**: order, cart, checkout, fulfillment
**Payment Language**: payment, transaction, refund, charge
**Shipping Language**: shipment, tracking, delivery, carrier
**Customer Language**: customer, account, profile, address

### Identified Subdomains

#### 1. Product Catalog (Core Domain)
- **Type**: Core (if differentiation is product discovery)
- **Ubiquitous Language**: product, category, catalog, search, browse
- **Concepts**: Product, Category, ProductCatalogService
- **Cohesion**: 9/10
- **Bounded Context**: CatalogContext

#### 2. Inventory Management (Supporting)
- **Type**: Supporting
- **Ubiquitous Language**: stock, inventory, SKU, warehouse, allocation
- **Concepts**: Inventory, SKU, InventoryService, Warehouse
- **Cohesion**: 8/10
- **Bounded Context**: InventoryContext

#### 3. Order Processing (Core Domain)
- **Type**: Core (if differentiation is checkout experience)
- **Ubiquitous Language**: order, cart, checkout, fulfillment
- **Concepts**: Order, Cart, OrderProcessingService
- **Cohesion**: 9/10
- **Bounded Context**: OrderContext

#### 4. Payment Processing (Generic)
- **Type**: Generic (standard payment gateway)
- **Ubiquitous Language**: payment, transaction, charge, refund
- **Concepts**: Payment, PaymentService, PaymentGateway
- **Cohesion**: 7/10
- **Bounded Context**: PaymentContext

#### 5. Shipping (Supporting)
- **Type**: Supporting
- **Ubiquitous Language**: shipment, tracking, delivery, carrier
- **Concepts**: Shipment, Tracking, ShippingService
- **Cohesion**: 8/10
- **Bounded Context**: ShippingContext

### Cohesion Analysis

| Domain A | Domain B | Cohesion | Relationship |
|----------|----------|----------|--------------|
| Catalog | Inventory | 6/10 | ⚠️ Product availability check |
| Order | Catalog | 5/10 | ⚠️ Product reference in order |
| Order | Payment | 7/10 | ✅ Order triggers payment |
| Order | Shipping | 7/10 | ✅ Order triggers shipment |
| Customer | Order | 3/10 | ❌ Direct entity reference |

### Low Cohesion Issues

**Issue 1**: Customer entity directly referenced in Order
- **Problem**: Different contexts (Identity vs Order)
- **Recommendation**: Use CustomerId value object, not entity reference
- **Pattern**: Published Language

**Issue 2**: Catalog service checks Inventory directly
- **Problem**: Core Domain depends on Supporting
- **Recommendation**: Use event-based inventory updates
- **Pattern**: Domain Events

---

## Example 2: Healthcare System

### Discovered Concepts

**Entities**:
- Patient, MedicalRecord, Diagnosis
- Appointment, Schedule, Availability
- Prescription, Medication, Dosage
- Doctor, Nurse, Staff
- Billing, Claim, Insurance

### Language Groups

**Clinical Language**: patient, diagnosis, treatment, medical record
**Scheduling Language**: appointment, schedule, availability, slot
**Pharmacy Language**: prescription, medication, dosage, drug
**Staff Language**: doctor, nurse, practitioner, credential
**Billing Language**: claim, insurance, copay, reimbursement

### Identified Subdomains

#### 1. Patient Care (Core Domain)
- **Type**: Core
- **Ubiquitous Language**: patient, diagnosis, treatment, care plan
- **Concepts**: Patient, MedicalRecord, Diagnosis, CareService
- **Cohesion**: 9/10
- **Bounded Context**: ClinicalContext

#### 2. Appointment Management (Supporting)
- **Type**: Supporting
- **Ubiquitous Language**: appointment, schedule, availability, booking
- **Concepts**: Appointment, Schedule, SchedulingService
- **Cohesion**: 8/10
- **Bounded Context**: SchedulingContext

#### 3. Pharmacy (Supporting)
- **Type**: Supporting (or Core if pharmacy is differentiator)
- **Ubiquitous Language**: prescription, medication, dosage, drug interaction
- **Concepts**: Prescription, Medication, PharmacyService
- **Cohesion**: 8/10
- **Bounded Context**: PharmacyContext

#### 4. Medical Billing (Supporting)
- **Type**: Supporting
- **Ubiquitous Language**: claim, insurance, billing, reimbursement
- **Concepts**: Claim, Insurance, BillingService
- **Cohesion**: 7/10
- **Bounded Context**: BillingContext

### Key Insight

**"Patient" Concept Has Different Meanings**:

| Context | Patient Meaning | Properties |
|---------|-----------------|------------|
| Clinical | Medical subject | Diagnosis, vitals, allergies |
| Scheduling | Appointment holder | Availability, preferences |
| Billing | Payer/beneficiary | Insurance, balance, claims |

→ These are different bounded contexts despite sharing the term "Patient"

---

## Example 3: SaaS Project Management Tool

### Discovered Concepts

**Entities**:
- Project, Task, Milestone, Sprint
- User, Team, Role, Permission
- Comment, Attachment, Activity
- Subscription, Plan, Invoice
- Notification, Alert

### Language Groups

**Project Language**: project, task, milestone, sprint, backlog
**Collaboration Language**: comment, discussion, mention, activity
**Access Language**: user, team, role, permission, access
**Billing Language**: subscription, plan, invoice, payment
**Notification Language**: notification, alert, reminder

### Identified Subdomains

#### 1. Project Management (Core Domain)
- **Type**: Core
- **Ubiquitous Language**: project, task, milestone, workflow
- **Concepts**: Project, Task, Milestone, ProjectService
- **Cohesion**: 9/10
- **Bounded Context**: ProjectContext

#### 2. Collaboration (Core/Supporting)
- **Type**: Core if differentiator, Supporting otherwise
- **Ubiquitous Language**: comment, discussion, activity, collaboration
- **Concepts**: Comment, Activity, CollaborationService
- **Cohesion**: 8/10
- **Bounded Context**: CollaborationContext

#### 3. Identity & Access (Generic)
- **Type**: Generic
- **Ubiquitous Language**: user, authentication, authorization, role
- **Concepts**: User, Role, Permission, AuthService
- **Cohesion**: 9/10
- **Bounded Context**: IdentityContext

#### 4. Billing (Supporting)
- **Type**: Supporting
- **Ubiquitous Language**: subscription, plan, invoice, billing
- **Concepts**: Subscription, Invoice, BillingService
- **Cohesion**: 8/10
- **Bounded Context**: BillingContext

#### 5. Notifications (Generic)
- **Type**: Generic
- **Ubiquitous Language**: notification, alert, message, reminder
- **Concepts**: Notification, NotificationService
- **Cohesion**: 7/10
- **Bounded Context**: NotificationContext

### Low Cohesion Issue

**Issue**: User entity used everywhere
```typescript
// Project domain
class Project {
  owner: User;        // ❌ Direct reference
  members: User[];    // ❌ Direct reference
}

// Collaboration domain
class Comment {
  author: User;       // ❌ Direct reference
}

// Billing domain
class Subscription {
  subscriber: User;   // ❌ Direct reference
}
```

**Problem**: Identity context concept leaked into all domains

**Recommendation**: Use context-specific concepts
```typescript
// Project domain
class Project {
  ownerId: OwnerId;           // ✅ Value object
  members: MemberId[];        // ✅ Value object
}

// Collaboration domain
class Comment {
  authorId: ParticipantId;    // ✅ Context-specific
}

// Billing domain
class Subscription {
  subscriberId: CustomerId;   // ✅ Context-specific
}
```

---

## Example 4: Streaming Video Platform

### Discovered Concepts

**Entities**:
- Movie, TVShow, Episode, Season
- Video, Stream, Encoding, Quality
- Watchlist, Viewing, Progress
- Recommendation, Preference
- Subscription, Plan, Billing

### Language Groups

**Content Language**: movie, show, episode, season, catalog
**Streaming Language**: video, stream, encoding, bitrate, quality
**Engagement Language**: watchlist, viewing, progress, rating
**Recommendation Language**: recommendation, preference, algorithm
**Billing Language**: subscription, plan, billing, payment

### Identified Subdomains

#### 1. Content Catalog (Supporting)
- **Type**: Supporting (unless unique content is differentiator)
- **Ubiquitous Language**: movie, show, episode, catalog, metadata
- **Concepts**: Movie, TVShow, Episode, CatalogService
- **Cohesion**: 9/10
- **Bounded Context**: CatalogContext

#### 2. Video Streaming (Supporting)
- **Type**: Supporting
- **Ubiquitous Language**: video, stream, encoding, playback, quality
- **Concepts**: Video, Stream, StreamingService
- **Cohesion**: 8/10
- **Bounded Context**: StreamingContext

#### 3. User Engagement (Supporting)
- **Type**: Supporting
- **Ubiquitous Language**: watchlist, viewing, progress, rating
- **Concepts**: Watchlist, Viewing, EngagementService
- **Cohesion**: 8/10
- **Bounded Context**: EngagementContext

#### 4. Recommendation Engine (Core Domain)
- **Type**: Core (if algorithm is competitive advantage)
- **Ubiquitous Language**: recommendation, preference, algorithm, personalization
- **Concepts**: Recommendation, RecommendationEngine
- **Cohesion**: 9/10
- **Bounded Context**: RecommendationContext

#### 5. Video Processing (Generic)
- **Type**: Generic
- **Ubiquitous Language**: transcoding, encoding, compression
- **Concepts**: VideoProcessor, EncodingService
- **Cohesion**: 7/10
- **Bounded Context**: ProcessingContext

### Integration Pattern

```
Catalog Context → publishes → ContentPublished event
                              ↓
                   Recommendation Context ← consumes
                              ↓
Engagement Context → publishes → UserWatched event
                              ↓
                   Recommendation Context ← consumes
```

**Pattern**: Event-Driven Architecture with Domain Events

---

## Common Patterns Across Examples

### Pattern 1: Identity Leakage

**Problem**: User/Identity entities used directly everywhere

**Solution**: Context-specific identifiers
- Project context: OwnerId, MemberId
- Billing context: CustomerId, SubscriberId
- Content context: CreatorId, ViewerId

### Pattern 2: Shared Kernel Overuse

**Problem**: Large shared models used everywhere

**Solution**: Minimal shared kernel, mostly value objects
- Share: UserId (as string/UUID), Email (as value object)
- Don't share: User entity, Customer entity

### Pattern 3: Core vs Supporting Confusion

**Key Question**: "Is this our competitive advantage?"
- If YES → Core Domain (best team, most attention)
- If NO but business-specific → Supporting
- If NO and standard → Generic

### Pattern 4: Bounded Context Size

**Too Small**:
```
OrderContext
OrderItemContext        ❌ Gaping holes
OrderStatusContext      ❌ Fragmented
```

**Right Size**:
```
OrderContext            ✅ Complete language
├── Order
├── OrderItem
└── OrderStatus
```

**Too Large**:
```
SalesContext            ❌ Mixed concerns
├── Order
├── Product
├── Customer
└── Invoice
```

### Pattern 5: Integration Types

**Synchronous** (use sparingly):
- When immediate consistency required
- Example: Order → Payment (need immediate response)

**Asynchronous** (prefer):
- When eventual consistency acceptable
- Example: Order → Shipping (can be delayed)

**Event-Driven** (best for decoupling):
- When multiple contexts need to react
- Example: OrderPlaced → [Billing, Shipping, Analytics]

---

## Quick Analysis Template

Use this template when analyzing any codebase:

```markdown
## Codebase: {Name}

### Step 1: Concepts Extracted
- Entities: [list]
- Services: [list]
- Use Cases: [list]
- Controllers: [list]

### Step 2: Language Groups
- Group 1: {name} - terms: [list]
- Group 2: {name} - terms: [list]

### Step 3: Subdomains Identified
1. {Subdomain} (Core/Supporting/Generic)
   - Language: [terms]
   - Concepts: [list]
   - Cohesion: X/10
   - Bounded Context: {Name}Context

### Step 4: Cohesion Matrix
| Domain A | Domain B | Cohesion | Issue |
|----------|----------|----------|-------|
| ... | ... | X/10 | ... |

### Step 5: Issues Found
- Priority High: [list]
- Priority Medium: [list]
- Priority Low: [list]

### Step 6: Recommendations
1. [recommendation]
2. [recommendation]
```
