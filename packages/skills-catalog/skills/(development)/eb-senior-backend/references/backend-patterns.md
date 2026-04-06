# Backend Patterns Reference

## Middleware Stack (Recommended Order)

```
1. Request ID (tracing)
2. Logging (request/response)
3. CORS
4. Rate limiting
5. Body parsing
6. Authentication (optional — per route)
7. Authorization (optional — per route)
8. Validation (per route)
9. Route handler
10. Error handler (global)
```

## Rate Limiting Patterns

### Token Bucket (Recommended)

```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'), // 10 requests per 10 seconds
});

async function rateLimitMiddleware(c, next) {
  const ip = c.req.header('x-forwarded-for') || 'unknown';
  const { success } = await ratelimit.limit(ip);
  if (!success) return c.json({ error: 'Too many requests' }, 429);
  await next();
}
```

### Per-User vs Per-IP
- **Unauthenticated endpoints**: Rate limit by IP
- **Authenticated endpoints**: Rate limit by user ID
- **Sensitive endpoints** (login, signup): Stricter limits (5/min)

## File Upload Pattern

```typescript
// Use presigned URLs for large files — never proxy through your server
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

async function getUploadUrl(fileName: string, contentType: string) {
  const key = `uploads/${crypto.randomUUID()}/${fileName}`;
  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key,
    ContentType: contentType,
  });
  const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  return { url, key };
}
```

## Webhook Pattern

```typescript
// Receiving webhooks (e.g., Stripe)
app.post('/webhooks/stripe', async (c) => {
  const signature = c.req.header('stripe-signature');
  const body = await c.req.text();

  const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

  // Idempotency: check if already processed
  const processed = await db.findWebhookEvent(event.id);
  if (processed) return c.json({ received: true });

  // Process event
  await processStripeEvent(event);

  // Record as processed
  await db.recordWebhookEvent(event.id);

  return c.json({ received: true });
});
```

## Background Jobs Pattern

### BullMQ (Redis-based)

```typescript
import { Queue, Worker } from 'bullmq';

const emailQueue = new Queue('emails', { connection: redis });

// Producer
await emailQueue.add('welcome', { userId, email });

// Consumer (separate process or worker)
const worker = new Worker('emails', async (job) => {
  if (job.name === 'welcome') {
    await sendWelcomeEmail(job.data.email);
  }
}, { connection: redis });
```

### Simple Alternative (No Redis)

For solo founders who don't need Redis:
```typescript
// In-process queue with setTimeout
async function enqueueJob(fn: () => Promise<void>) {
  setTimeout(async () => {
    try { await fn(); }
    catch (err) { console.error('Job failed:', err); }
  }, 0);
}

// Usage
enqueueJob(() => sendWelcomeEmail(user.email));
```

## Caching Strategies

| Strategy | When to Use | How |
|----------|------------|-----|
| **Cache-Aside** | Default for most reads | Check cache → miss → read DB → populate cache |
| **Write-Through** | Data must always be fresh | Write to cache + DB simultaneously |
| **TTL-Based** | Data that can be slightly stale | Set expiration on cache keys |

```typescript
async function getCachedUser(id: string) {
  const cached = await redis.get(`user:${id}`);
  if (cached) return JSON.parse(cached);

  const user = await db.findUser(id);
  await redis.set(`user:${id}`, JSON.stringify(user), 'EX', 300); // 5 min TTL
  return user;
}
```
