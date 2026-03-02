# Authentication

## Table of Contents

1. Option A: Passport + JWT (line ~15)
2. Option B: Better Auth (line ~120)
3. Choosing Between Options (line ~230)

---

## 1. Option A: Passport + JWT

The most established auth pattern in the NestJS ecosystem. Best for teams already familiar with Passport strategies and standard JWT flows.

### JWT Strategy

```typescript
// libs/identity/infrastructure/strategies/jwt.strategy.ts
import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow('JWT_SECRET'),
    })
  }

  async validate(payload: { sub: string; email: string; role: string }) {
    return { userId: payload.sub, email: payload.email, role: payload.role }
  }
}
```

### Auth Guard

```typescript
// libs/shared/infrastructure/guards/jwt-auth.guard.ts
import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { Reflector } from '@nestjs/core'
import { IS_PUBLIC_KEY } from '../decorators/public.decorator'

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super()
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (isPublic) return true
    return super.canActivate(context)
  }

  handleRequest(err: unknown, user: unknown) {
    if (err || !user) {
      throw err || new UnauthorizedException('Invalid or missing token')
    }
    return user
  }
}
```

### Decorators

```typescript
// libs/shared/infrastructure/decorators/public.decorator.ts
import { SetMetadata } from '@nestjs/common'

export const IS_PUBLIC_KEY = 'isPublic'
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true)

// libs/shared/infrastructure/decorators/roles.decorator.ts
export const ROLES_KEY = 'roles'
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles)
```

### Roles Guard

```typescript
// libs/shared/infrastructure/guards/roles.guard.ts
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (!requiredRoles) return true

    const { user } = context.switchToHttp().getRequest()
    return requiredRoles.includes(user.role)
  }
}
```

### Auth Module Setup

```typescript
// libs/identity/identity.module.ts
@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow('JWT_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
    }),
  ],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class IdentityModule {}
```

### Apply Guards Globally

```typescript
// apps/api/src/app.module.ts
@Module({
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
```

### Usage in Controllers

```typescript
@Controller('billing/plans')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BillingPlanController {
  @Post()
  @Roles('admin')
  create(@Body() dto: CreateBillingPlanDto) {
    /* ... */
  }

  @Get()
  @Public()
  findAll() {
    /* ... */
  }
}
```

---

## 2. Option B: Better Auth

A modern, framework-agnostic authentication library for TypeScript with a plugin ecosystem. Good for teams wanting a batteries-included auth solution with less boilerplate. Uses the `@thallesp/nestjs-better-auth` package for NestJS integration.

### Better Auth Instance

```typescript
// libs/identity/infrastructure/auth/auth.config.ts
import { betterAuth } from 'better-auth'
import { Pool } from 'pg'

export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    sendResetPassword: async ({ user, url, token }) => {
      // Implement password reset email
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      // Implement verification email
    },
  },
  session: {
    expiresIn: 604800, // 7 days
    updateAge: 86400, // 1 day (refresh window)
    cookieCache: {
      enabled: true,
      maxAge: 300, // 5 min cache
    },
  },
})
```

### Social Providers (Optional)

```typescript
// libs/identity/infrastructure/auth/auth.config.ts
export const auth = betterAuth({
  // ...base config above
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },
})
```

### NestJS Module Integration

```typescript
// libs/identity/identity.module.ts
import { Module } from '@nestjs/common'
import { AuthModule } from '@thallesp/nestjs-better-auth'
import { auth } from './infrastructure/auth/auth.config'

@Module({
  imports: [AuthModule.forRoot({ auth })],
  exports: [AuthModule],
})
export class IdentityModule {}

// apps/api/src/app.module.ts
import { Module } from '@nestjs/common'
import { IdentityModule } from '@project/identity'

@Module({
  imports: [IdentityModule],
})
export class AppModule {}
```

### Route Protection with Better Auth

Better Auth's NestJS integration registers an `AuthGuard` globally by default. All routes are protected unless explicitly opted out.

```typescript
import { Controller, Get } from '@nestjs/common'
import { Session, UserSession, AllowAnonymous, OptionalAuth } from '@thallesp/nestjs-better-auth'

@Controller('billing/plans')
export class BillingPlanController {
  // Protected route — session is guaranteed
  @Get('me')
  async getMyPlans(@Session() session: UserSession) {
    return this.planService.findByUser(session.user.id)
  }

  // Public route — no auth required
  @Get('public')
  @AllowAnonymous()
  async getPublicPlans() {
    return this.planService.findPublic()
  }

  // Optional auth — session may be null
  @Get('featured')
  @OptionalAuth()
  async getFeatured(@Session() session: UserSession | null) {
    const plans = await this.planService.findFeatured()
    return { plans, isAuthenticated: !!session }
  }
}
```

### Better Auth with Plugins

Better Auth supports plugins for extended functionality:

```typescript
import { betterAuth } from 'better-auth'
import { admin, twoFactor } from 'better-auth/plugins'

export const auth = betterAuth({
  // ...base config
  plugins: [
    admin(), // Admin dashboard capabilities
    twoFactor(), // Two-factor authentication
  ],
})
```

---

## 3. Choosing Between Options

| Criteria                  | Passport/JWT                                | Better Auth                                          |
| ------------------------- | ------------------------------------------- | ---------------------------------------------------- |
| **Maturity**              | Battle-tested, years in production          | Newer, growing ecosystem                             |
| **NestJS Integration**    | Native, first-party                         | Third-party adapter (`@thallesp/nestjs-better-auth`) |
| **Setup Complexity**      | More boilerplate, more control              | Less boilerplate, convention-based                   |
| **Social Login**          | Via passport-google, passport-github, etc.  | Built-in social providers config                     |
| **Session Management**    | Manual (JWT tokens)                         | Built-in with cookie cache                           |
| **2FA / Admin**           | Requires custom implementation              | Plugin-based (one line)                              |
| **Custom Logic**          | Full control over every step                | Hooks and custom handlers                            |
| **Database**              | You manage user/session tables              | Auto-manages auth tables                             |
| **Fastify Compatibility** | Requires `@nestjs/platform-fastify` adapter | Works with both adapters                             |

**Recommendation:** Use **Passport/JWT** when you need full control, have existing auth infrastructure, or the team is already comfortable with Passport strategies. Use **Better Auth** when you want rapid setup, built-in features (social login, 2FA, sessions), and prefer convention over configuration.

### Quick Reference — Decorators Comparison

| Action        | Passport/JWT                | Better Auth                         |
| ------------- | --------------------------- | ----------------------------------- |
| Protect route | `@UseGuards(JwtAuthGuard)`  | Automatic (global guard)            |
| Public route  | `@Public()`                 | `@AllowAnonymous()`                 |
| Get user      | `@Request() req → req.user` | `@Session() session → session.user` |
| Require role  | `@Roles('admin')`           | Custom guard or plugin              |
| Optional auth | Custom guard                | `@OptionalAuth()`                   |
