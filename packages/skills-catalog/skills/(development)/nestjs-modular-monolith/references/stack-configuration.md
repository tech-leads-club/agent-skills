# Stack Configuration

## Table of Contents

1. NestJS + Fastify Bootstrap (line ~10)
2. Prisma Setup (line ~60)
3. DTOs and Validation (line ~100)
4. Exception Filter (line ~170)
5. Biome Configuration (line ~250)
6. NestJS Module Definition (line ~290)

---

## 1. NestJS + Fastify Bootstrap

Fastify is the recommended HTTP adapter for modular monoliths. It's ~2-3x faster than Express with better TypeScript support and a plugin architecture that aligns with the modular philosophy.

```typescript
// apps/api/src/main.ts
import { NestFactory } from '@nestjs/core'
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify'
import { ValidationPipe, Logger } from '@nestjs/common'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { AppModule } from './app.module'
import { HttpExceptionFilter } from '@project/shared/infrastructure'

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter({ logger: true }))

  // Global prefix
  app.setGlobalPrefix('api')

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  )

  // Exception filter
  app.useGlobalFilters(new HttpExceptionFilter())

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('Modular Monolith API')
    .setDescription('API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build()
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config))

  const port = process.env.PORT ?? 3000
  await app.listen(port, '0.0.0.0')
  Logger.log(`Application running on port ${port}`, 'Bootstrap')
}

bootstrap()
```

### Express Alternative

If the team prefers Express or needs Express-specific middleware:

```typescript
// apps/api/src/main.ts
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  // ... same configuration as above, without FastifyAdapter
  await app.listen(process.env.PORT ?? 3000)
}

bootstrap()
```

---

## 2. Prisma Setup

### PrismaService

```typescript
// libs/shared/infrastructure/src/database/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name)

  async onModuleInit() {
    await this.$connect()
    this.logger.log('Database connection established')
  }

  async onModuleDestroy() {
    await this.$disconnect()
    this.logger.log('Database connection closed')
  }
}
```

### PrismaModule

```typescript
// libs/shared/infrastructure/src/database/prisma.module.ts
import { Global, Module } from '@nestjs/common'
import { PrismaService } from './prisma.service'

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

---

## 3. DTOs and Validation

### Create DTO with Swagger

```typescript
// libs/billing/application/dtos/create-billing-plan.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsString, IsInt, IsEnum, IsNotEmpty, Min, MinLength, MaxLength } from 'class-validator'
import { Transform } from 'class-transformer'

export class CreateBillingPlanDto {
  @ApiProperty({ example: 'Pro Plan', minLength: 2, maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  name: string

  @ApiProperty({ example: 2999, description: 'Price in cents' })
  @IsInt()
  @Min(0)
  priceInCents: number

  @ApiProperty({ enum: ['MONTHLY', 'YEARLY'] })
  @IsEnum(['MONTHLY', 'YEARLY'])
  interval: string
}
```

### Pagination DTO (Reusable)

```typescript
// libs/shared/domain/src/dtos/pagination.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator'
import { Type, Transform } from 'class-transformer'

export class PaginationDto {
  @ApiPropertyOptional({ description: 'Cursor for pagination' })
  @IsOptional()
  @IsString()
  cursor?: string

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => value ?? 20)
  limit: number = 20
}
```

### Response DTO

```typescript
// libs/billing/application/dtos/billing-plan-response.dto.ts
import { ApiProperty } from '@nestjs/swagger'
import { BillingPlan } from '../../domain/entities/billing-plan.entity'

export class BillingPlanResponseDto {
  @ApiProperty() id: string
  @ApiProperty() name: string
  @ApiProperty() priceInCents: number
  @ApiProperty() interval: string
  @ApiProperty() createdAt: Date

  static from(plan: BillingPlan): BillingPlanResponseDto {
    const dto = new BillingPlanResponseDto()
    dto.id = plan.id
    dto.name = plan.name
    dto.priceInCents = plan.priceInCents
    dto.interval = plan.interval
    dto.createdAt = plan.createdAt
    return dto
  }
}
```

---

## 4. Exception Filter

Maps domain exceptions to HTTP status codes. Keeps domain logic free from HTTP concerns.

```typescript
// libs/shared/infrastructure/src/filters/http-exception.filter.ts
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common'

type DomainErrorClass = new (...args: unknown[]) => Error
type HttpExceptionCreator = (message: string) => HttpException

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name)

  /** Map domain exceptions to HTTP status codes. Add new domain exceptions here as your modules grow. */
  private readonly errorMap = new Map<DomainErrorClass, HttpExceptionCreator>()

  /** Register a domain error to HTTP exception mapping. Call this from module initialization to register module-specific errors. */
  registerError(errorClass: DomainErrorClass, creator: HttpExceptionCreator): void {
    this.errorMap.set(errorClass, creator)
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse()
    const request = ctx.getRequest()

    const httpException = this.resolveHttpException(exception)
    const status = httpException.getStatus()
    const body = httpException.getResponse()

    response.status(status).send({
      ...(typeof body === 'object' ? body : { message: body }),
      timestamp: new Date().toISOString(),
      path: request.url,
    })
  }

  private resolveHttpException(exception: unknown): HttpException {
    if (exception instanceof HttpException) return exception

    if (exception instanceof Error) {
      const mapped = this.mapDomainError(exception)
      if (mapped) return mapped
      this.logger.error(exception.message, exception.stack)
    } else {
      this.logger.error('Unknown exception', exception)
    }

    return new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR)
  }

  private mapDomainError(error: Error): HttpException | null {
    for (const [errorType, creator] of this.errorMap.entries()) {
      if (error instanceof errorType) return creator(error.message)
    }
    return null
  }
}
```

### Usage — Registering Module Errors

```typescript
// libs/billing/billing.module.ts
import { Module, OnModuleInit } from '@nestjs/common'
import { HttpExceptionFilter } from '@project/shared/infrastructure'
import { NotFoundException, ConflictException } from '@nestjs/common'
import { BillingPlanNotFoundError } from './domain/exceptions'

@Module({
  /* ... */
})
export class BillingModule implements OnModuleInit {
  constructor(private readonly exceptionFilter: HttpExceptionFilter) {}

  onModuleInit() {
    this.exceptionFilter.registerError(BillingPlanNotFoundError, (msg) => new NotFoundException(msg))
  }
}
```

---

## 5. Biome Configuration

Biome replaces both ESLint and Prettier with a single, significantly faster tool.

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.0/schema.json",
  "organizeImports": { "enabled": true },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "style": { "useConst": "error", "useTemplate": "error" },
      "complexity": { "noForEach": "off" },
      "suspicious": { "noExplicitAny": "error" }
    }
  },
  "formatter": {
    "enabled": true,
    "formatWithErrors": false,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100,
    "lineEnding": "lf"
  },
  "javascript": {
    "formatter": { "quoteStyle": "single", "trailingCommas": "all", "semicolons": "always" }
  },
  "files": {
    "include": ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
    "ignore": ["node_modules", "dist", "coverage", ".nx"]
  }
}
```

### Package.json Scripts

```json
{
  "scripts": {
    "lint": "biome check .",
    "lint:fix": "biome check --write .",
    "format": "biome format --write ."
  }
}
```

---

## 6. NestJS Module Definition Pattern

Every domain module follows this structure. This example shows the **simple service pattern** (default):

```typescript
// libs/billing/billing.module.ts
import { Module } from '@nestjs/common'
import { EventEmitterModule } from '@nestjs/event-emitter'

// Presentation
import { BillingPlanController } from './presentation/billing-plan.controller'

// Application — Services
import { BillingPlanService } from './application/services/billing-plan.service'

// Application — Event Handlers
import { OnUserCreatedHandler } from './application/handlers/on-user-created.handler'

// Infrastructure — Repositories
import { PrismaBillingPlanRepository } from './infrastructure/repositories/prisma-billing-plan.repository'

// Domain — Constants
import { BILLING_PLAN_REPOSITORY } from './domain/repositories/billing-plan.repository'

// Shared — Events
import { EVENT_PUBLISHER } from '@project/shared/contracts'
import { EventPublisherModule } from '@project/shared/infrastructure'

@Module({
  imports: [EventPublisherModule],
  controllers: [BillingPlanController],
  providers: [
    BillingPlanService,
    OnUserCreatedHandler,
    { provide: BILLING_PLAN_REPOSITORY, useClass: PrismaBillingPlanRepository },
  ],
  // Only export what other modules need (contracts, not internals)
  exports: [],
})
export class BillingModule {}
```

For CQRS modules, add `CqrsModule` to imports and replace the service with command/query handlers:

```typescript
import { CqrsModule } from '@nestjs/cqrs'

const CommandHandlers = [CreateBillingPlanHandler]
const QueryHandlers = [GetBillingPlanHandler]

@Module({
  imports: [CqrsModule, EventPublisherModule],
  controllers: [BillingPlanController],
  providers: [
    ...CommandHandlers,
    ...QueryHandlers,
    OnUserCreatedHandler,
    { provide: BILLING_PLAN_REPOSITORY, useClass: PrismaBillingPlanRepository },
  ],
  exports: [],
})
export class BillingModule {}
```

**Key points:**

- Bind repository interface to implementation via DI
- Export NOTHING unless another module genuinely needs it
- Cross-module communication goes through events, not exports
- Use simple services by default; upgrade to CQRS only when the module's complexity warrants it
