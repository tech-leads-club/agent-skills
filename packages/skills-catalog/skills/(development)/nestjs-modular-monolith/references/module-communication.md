# Module Communication

## Table of Contents

1. Domain Events Interface (line ~10)
2. In-Memory Publisher (Development) (line ~40)
3. Production Publishers (line ~70)
4. Cross-Module Contracts (line ~160)
5. Event Handler Pattern (line ~200)
6. Choosing an Event System (line ~240)

---

## 1. Domain Events Interface

All events implement a shared interface. This is the contract between modules.

```typescript
// libs/shared/contracts/src/events/domain-event.interface.ts
export interface DomainEvent {
  readonly aggregateId: string
  readonly eventType: string
  readonly occurredAt: Date
  readonly version: number
  readonly payload: Record<string, unknown>
}

// libs/shared/contracts/src/events/event-publisher.interface.ts
export interface EventPublisher {
  publish<T extends Record<string, unknown>>(eventName: string, payload: T): Promise<void>
}

export const EVENT_PUBLISHER = Symbol('EventPublisher')
```

## 2. In-Memory Publisher (Development)

For local development and testing. Switch to production publishers via DI.

```typescript
// libs/shared/infrastructure/src/events/in-memory-event-publisher.ts
import { Injectable, Logger } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { EventPublisher } from '@project/shared/contracts'

@Injectable()
export class InMemoryEventPublisher implements EventPublisher {
  private readonly logger = new Logger(InMemoryEventPublisher.name)

  constructor(private readonly eventEmitter: EventEmitter2) {}

  async publish<T extends Record<string, unknown>>(eventName: string, payload: T): Promise<void> {
    this.logger.debug(`Publishing event: ${eventName}`, payload)
    this.eventEmitter.emit(eventName, payload)
  }
}
```

> ⚠️ **Never use in-memory events for production inter-module communication.** In-memory events don't survive process restarts, don't scale across instances, and have no delivery guarantees.

---

## 3. Production Publishers

### Kafka — For high-throughput and event sourcing

```typescript
// libs/shared/infrastructure/src/events/kafka-event-publisher.ts
import { Injectable, Logger } from '@nestjs/common'
import { Producer } from 'kafkajs'
import { EventPublisher } from '@project/shared/contracts'

@Injectable()
export class KafkaEventPublisher implements EventPublisher {
  private readonly logger = new Logger(KafkaEventPublisher.name)

  constructor(private readonly producer: Producer) {}

  async publish<T extends Record<string, unknown>>(eventName: string, payload: T): Promise<void> {
    const topic = `events.${eventName.replace(/\./g, '-')}`
    await this.producer.send({
      topic,
      messages: [
        {
          key: eventName,
          value: JSON.stringify(payload),
          headers: { eventType: eventName, timestamp: new Date().toISOString() },
        },
      ],
    })
    this.logger.log(`Event published to ${topic}: ${eventName}`)
  }
}
```

### SQS — For AWS-native, simple queuing

```typescript
// libs/shared/infrastructure/src/events/sqs-event-publisher.ts
import { Injectable } from '@nestjs/common'
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs'
import { EventPublisher } from '@project/shared/contracts'

@Injectable()
export class SQSEventPublisher implements EventPublisher {
  constructor(
    private readonly sqsClient: SQSClient,
    private readonly queueUrlResolver: QueueUrlResolver,
  ) {}

  async publish<T extends Record<string, unknown>>(eventName: string, payload: T): Promise<void> {
    const queueUrl = this.queueUrlResolver.resolve(eventName)
    await this.sqsClient.send(
      new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify(payload),
        MessageAttributes: {
          eventType: { StringValue: eventName, DataType: 'String' },
        },
      }),
    )
  }
}
```

### Redis — For real-time, pub/sub scenarios

```typescript
// libs/shared/infrastructure/src/events/redis-event-publisher.ts
import { Injectable } from '@nestjs/common'
import { Redis } from 'ioredis'
import { EventPublisher } from '@project/shared/contracts'

@Injectable()
export class RedisEventPublisher implements EventPublisher {
  constructor(private readonly redis: Redis) {}

  async publish<T extends Record<string, unknown>>(eventName: string, payload: T): Promise<void> {
    await this.redis.publish(eventName, JSON.stringify(payload))
  }
}
```

### Registering Publishers via DI

```typescript
// libs/shared/infrastructure/src/events/event-publisher.module.ts
@Module({
  providers: [
    {
      provide: EVENT_PUBLISHER,
      useFactory: (config: ConfigService) => {
        const driver = config.get('EVENT_DRIVER', 'in-memory')
        switch (driver) {
          case 'kafka':
            return new KafkaEventPublisher(/* ... */)
          case 'sqs':
            return new SQSEventPublisher(/* ... */)
          case 'redis':
            return new RedisEventPublisher(/* ... */)
          default:
            return new InMemoryEventPublisher(/* ... */)
        }
      },
      inject: [ConfigService],
    },
  ],
  exports: [EVENT_PUBLISHER],
})
export class EventPublisherModule {}
```

---

## 4. Cross-Module Contracts

Events are the ONLY way modules should communicate. Define event contracts in the shared contracts library.

```typescript
// libs/shared/contracts/src/events/identity.events.ts
export class IdentityUserCreatedEvent implements DomainEvent {
  readonly eventType = 'identity.user.created'
  readonly version = 1
  readonly occurredAt = new Date()

  constructor(
    public readonly aggregateId: string,
    public readonly payload: { userId: string; email: string; name: string },
  ) {}
}

// libs/shared/contracts/src/events/billing.events.ts
export class BillingSubscriptionActivatedEvent implements DomainEvent {
  readonly eventType = 'billing.subscription.activated'
  readonly version = 1
  readonly occurredAt = new Date()

  constructor(
    public readonly aggregateId: string,
    public readonly payload: { subscriptionId: string; planId: string; userId: string },
  ) {}
}
```

**Rules for event contracts:**

- Event types use dot notation: `module.aggregate.action`
- Payloads contain only serializable, primitive data
- Never include domain entity references in events (use IDs)
- Version events when their schema changes
- Events are immutable after creation

---

## 5. Event Handler Pattern

Handlers in other modules react to events. Always idempotent.

```typescript
// libs/billing/application/handlers/on-user-created.handler.ts
import { OnEvent } from '@nestjs/event-emitter'
import { Injectable, Logger } from '@nestjs/common'

@Injectable()
export class OnUserCreatedHandler {
  private readonly logger = new Logger(OnUserCreatedHandler.name)

  @OnEvent('identity.user.created')
  async handle(event: IdentityUserCreatedEvent): Promise<void> {
    this.logger.log(`Setting up billing for user: ${event.payload.userId}`)
    await this.billingService.createDefaultProfile(event.payload.userId)
  }
}
```

**Idempotency rules:**

- Check if the action was already performed before executing
- Use `aggregateId` + `eventType` as deduplication key
- Log all event processing for observability

---

## 6. Choosing an Event System

| Criteria        | Kafka                      | SQS                      | Redis              | In-Memory     |
| --------------- | -------------------------- | ------------------------ | ------------------ | ------------- |
| **Delivery**    | At-least-once              | At-least-once            | At-most-once       | Best-effort   |
| **Ordering**    | Per-partition              | FIFO queues              | No guarantee       | Synchronous   |
| **Persistence** | Yes (configurable)         | Yes (14 days)            | No                 | No            |
| **Throughput**  | Very high                  | High                     | Very high          | N/A           |
| **Complexity**  | High                       | Low                      | Low                | Minimal       |
| **Use Case**    | Event sourcing, high scale | AWS-native, simple flows | Real-time, pub/sub | Dev/test only |

**Recommendation:** Start with In-Memory for development, SQS or Redis for production (depending on cloud provider), Kafka only when you've outgrown simpler solutions.
