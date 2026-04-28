# Testing Patterns

## Table of Contents

1. Domain Layer Tests (line ~10)
2. Service / Handler Tests (line ~60)
3. Controller Tests (line ~130)
4. Module Integration Tests (line ~180)
5. E2E Tests (line ~220)
6. Mock Factories (line ~280)

---

## 1. Domain Layer Tests

Domain entities should be tested purely — no framework dependencies.

```typescript
// libs/billing/domain/__tests__/billing-plan.entity.spec.ts
import { BillingPlan, BillingInterval } from '../entities/billing-plan.entity'

describe('BillingPlan', () => {
  const createPlan = (overrides?: Partial<ConstructorParameters<typeof BillingPlan>>) =>
    new BillingPlan(
      'plan-1',
      'Pro Plan',
      2999,
      BillingInterval.MONTHLY,
      new Date('2024-01-01'),
      ...Object.values(overrides ?? {}),
    )

  describe('isActive', () => {
    it('returns true when price is positive', () => {
      const plan = createPlan()
      expect(plan.isActive()).toBe(true)
    })

    it('returns false when price is zero', () => {
      const plan = new BillingPlan('p-1', 'Free', 0, BillingInterval.MONTHLY, new Date())
      expect(plan.isActive()).toBe(false)
    })
  })

  describe('canUpgradeTo', () => {
    it('allows upgrade to higher-priced plan', () => {
      const basic = new BillingPlan('p-1', 'Basic', 999, BillingInterval.MONTHLY, new Date())
      const pro = new BillingPlan('p-2', 'Pro', 2999, BillingInterval.MONTHLY, new Date())
      expect(basic.canUpgradeTo(pro)).toBe(true)
    })

    it('rejects downgrade', () => {
      const pro = new BillingPlan('p-2', 'Pro', 2999, BillingInterval.MONTHLY, new Date())
      const basic = new BillingPlan('p-1', 'Basic', 999, BillingInterval.MONTHLY, new Date())
      expect(pro.canUpgradeTo(basic)).toBe(false)
    })
  })
})
```

---

## 2. Service / Handler Tests

Test business logic through services (default) or handlers (CQRS). Mock repository interfaces, not Prisma.

### Service Test (Default Approach)

```typescript
// libs/billing/application/__tests__/billing-plan.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing'
import { BillingPlanService } from '../services/billing-plan.service'
import { BILLING_PLAN_REPOSITORY } from '../../domain/repositories/billing-plan.repository'
import { EVENT_PUBLISHER } from '@project/shared/contracts'

describe('BillingPlanService', () => {
  let service: BillingPlanService
  let repository: jest.Mocked<BillingPlanRepository>
  let events: jest.Mocked<EventPublisher>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingPlanService,
        {
          provide: BILLING_PLAN_REPOSITORY,
          useValue: { findById: jest.fn(), findAll: jest.fn(), save: jest.fn(), delete: jest.fn() },
        },
        {
          provide: EVENT_PUBLISHER,
          useValue: { publish: jest.fn() },
        },
      ],
    }).compile()

    service = module.get(BillingPlanService)
    repository = module.get(BILLING_PLAN_REPOSITORY)
    events = module.get(EVENT_PUBLISHER)
  })

  afterEach(() => jest.clearAllMocks())

  it('creates a billing plan and publishes event', async () => {
    repository.save.mockImplementation(async (plan) => plan)

    const result = await service.create('Pro', 2999, BillingInterval.MONTHLY)

    expect(result.name).toBe('Pro')
    expect(result.priceInCents).toBe(2999)
    expect(repository.save).toHaveBeenCalledTimes(1)
    expect(events.publish).toHaveBeenCalledWith(
      'billing.plan.created',
      expect.objectContaining({ planId: expect.any(String) }),
    )
  })

  it('throws when plan not found', async () => {
    repository.findById.mockResolvedValue(null)
    await expect(service.findById('nonexistent')).rejects.toThrow(BillingPlanNotFoundError)
  })
})
```

### CQRS Handler Test (When Using CQRS)

```typescript
// libs/billing/application/__tests__/create-billing-plan.handler.spec.ts
import { Test, TestingModule } from '@nestjs/testing'
import { EventBus } from '@nestjs/cqrs'
import { CreateBillingPlanHandler } from '../handlers/create-billing-plan.handler'
import { CreateBillingPlanCommand } from '../commands/create-billing-plan.command'
import { BILLING_PLAN_REPOSITORY } from '../../domain/repositories/billing-plan.repository'

describe('CreateBillingPlanHandler', () => {
  let handler: CreateBillingPlanHandler
  let repository: jest.Mocked<BillingPlanRepository>
  let eventBus: jest.Mocked<EventBus>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateBillingPlanHandler,
        { provide: BILLING_PLAN_REPOSITORY, useValue: { findById: jest.fn(), save: jest.fn(), delete: jest.fn() } },
        { provide: EventBus, useValue: { publish: jest.fn() } },
      ],
    }).compile()

    handler = module.get(CreateBillingPlanHandler)
    repository = module.get(BILLING_PLAN_REPOSITORY)
    eventBus = module.get(EventBus)
  })

  afterEach(() => jest.clearAllMocks())

  it('creates a billing plan and publishes event', async () => {
    const command = new CreateBillingPlanCommand('Pro', 2999, BillingInterval.MONTHLY)
    repository.save.mockImplementation(async (plan) => plan)

    const result = await handler.execute(command)

    expect(result.name).toBe('Pro')
    expect(repository.save).toHaveBeenCalledTimes(1)
    expect(eventBus.publish).toHaveBeenCalledTimes(1)
  })
})
```

---

## 3. Controller Tests

Test HTTP layer independently from services.

```typescript
// libs/billing/presentation/__tests__/billing-plan.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing'
import { BillingPlanController } from '../billing-plan.controller'
import { BillingPlanService } from '../../application/services/billing-plan.service'

describe('BillingPlanController', () => {
  let controller: BillingPlanController
  let service: jest.Mocked<BillingPlanService>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BillingPlanController],
      providers: [
        { provide: BillingPlanService, useValue: { create: jest.fn(), findById: jest.fn(), findAll: jest.fn() } },
      ],
    }).compile()

    controller = module.get(BillingPlanController)
    service = module.get(BillingPlanService)
  })

  it('creates a plan via service', async () => {
    const expectedPlan = { id: 'p-1', name: 'Pro', priceInCents: 2999 }
    service.create.mockResolvedValue(expectedPlan as any)

    const dto = { name: 'Pro', priceInCents: 2999, interval: 'MONTHLY' }
    const result = await controller.create(dto as any)

    expect(service.create).toHaveBeenCalledTimes(1)
    expect(result).toBeDefined()
  })
})
```

---

## 4. Module Integration Tests

Test that modules work correctly WITHIN their boundaries. These tests verify that DI, repos, and services work together.

```typescript
// libs/billing/__tests__/billing.module.integration.spec.ts
import { Test, TestingModule } from '@nestjs/testing'
import { BillingModule } from '../billing.module'
import { PrismaModule } from '@project/shared/infrastructure'
import { BillingPlanService } from '../application/services/billing-plan.service'
import { BILLING_PLAN_REPOSITORY } from '../domain/repositories/billing-plan.repository'

describe('BillingModule (integration)', () => {
  let module: TestingModule

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [BillingModule, PrismaModule],
    }).compile()
  })

  afterAll(async () => {
    await module.close()
  })

  it('resolves BillingPlanService', () => {
    const service = module.get(BillingPlanService)
    expect(service).toBeDefined()
  })

  it('resolves BillingPlanRepository', () => {
    const repo = module.get(BILLING_PLAN_REPOSITORY)
    expect(repo).toBeDefined()
  })
})
```

---

## 5. E2E Tests

Test the full HTTP lifecycle including auth, validation, and response.

```typescript
// apps/api/test/billing.e2e-spec.ts
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import * as request from 'supertest'
import { AppModule } from '../src/app.module'
import { ValidationPipe } from '@nestjs/common'

describe('Billing (e2e)', () => {
  let app: INestApplication
  let authToken: string

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = module.createNestApplication()
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    await app.init()

    // Obtain auth token
    const authResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@test.com', password: 'TestPass123!' })
    authToken = authResponse.body.access_token
  })

  afterAll(() => app.close())

  it('POST /billing/plans — creates plan', async () => {
    const response = await request(app.getHttpServer())
      .post('/billing/plans')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Pro', priceInCents: 2999, interval: 'MONTHLY' })
      .expect(201)

    expect(response.body).toHaveProperty('id')
    expect(response.body.name).toBe('Pro')
  })

  it('POST /billing/plans — rejects invalid data', async () => {
    await request(app.getHttpServer())
      .post('/billing/plans')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: '', priceInCents: -1 })
      .expect(400)
  })

  it('GET /billing/plans — returns 401 without auth', async () => {
    await request(app.getHttpServer()).get('/billing/plans').expect(401)
  })
})
```

---

## 6. Mock Factories

Reusable mock creators for consistent test setup.

```typescript
// libs/shared/infrastructure/src/testing/mock-factories.ts

export function createMockRepository<T>() {
  return {
    findById: jest.fn(),
    findAll: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  } as jest.Mocked<any>
}

export function createMockEventPublisher() {
  return { publish: jest.fn() } as jest.Mocked<any>
}

export function createMockService(methods: string[]) {
  return Object.fromEntries(methods.map((m) => [m, jest.fn()])) as jest.Mocked<any>
}
```

## Quick Reference

| Test Level  | What to Test                     | Where                                   | Dependencies             |
| ----------- | -------------------------------- | --------------------------------------- | ------------------------ |
| Domain      | Entity logic, value objects      | `libs/[module]/domain/__tests__/`       | None                     |
| Service     | Business rules via services      | `libs/[module]/application/__tests__/`  | Mocked repos + events    |
| Handler     | Business rules via CQRS handlers | `libs/[module]/application/__tests__/`  | Mocked repos + event bus |
| Controller  | HTTP interface                   | `libs/[module]/presentation/__tests__/` | Mocked service           |
| Integration | Module DI, full chain            | `libs/[module]/__tests__/`              | Real module, test DB     |
| E2E         | Full HTTP lifecycle              | `apps/api/test/`                        | Full app, test DB        |
