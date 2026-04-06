# Deployment Guides Reference

## Vercel (Next.js Full-Stack)

```bash
# Install CLI
npm i -g vercel

# Deploy (first time — interactive setup)
vercel

# Deploy to production
vercel --prod

# Set environment variables
vercel env add DATABASE_URL production
```

`vercel.json` (optional customization):
```json
{
  "framework": "nextjs",
  "regions": ["iad1"],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "no-store" }
      ]
    }
  ]
}
```

## Railway (Backend + DB)

```bash
# Install CLI
npm i -g @railway/cli

# Login and init
railway login
railway init

# Add PostgreSQL
railway add --plugin postgresql

# Deploy
railway up

# Set variables
railway variables set JWT_SECRET=xxx
```

## Fly.io (Global Distribution)

```bash
# Install CLI
curl -L https://fly.io/install.sh | sh

# Launch (creates fly.toml)
fly launch

# Deploy
fly deploy

# Add PostgreSQL
fly postgres create
fly postgres attach

# Scale
fly scale count 2  # 2 instances
fly scale vm shared-cpu-2x  # bigger VM
```

## Database Backup Strategy

### Automated Daily Backups

```bash
#!/bin/bash
# backup.sh — run via cron daily
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="backup_${DATE}.sql.gz"

pg_dump $DATABASE_URL | gzip > /tmp/$FILENAME
aws s3 cp /tmp/$FILENAME s3://my-backups/$FILENAME
rm /tmp/$FILENAME

# Keep only last 30 days
aws s3 ls s3://my-backups/ | sort | head -n -30 | awk '{print $4}' | xargs -I {} aws s3 rm s3://my-backups/{}
```

### Test Restore (Monthly)

```bash
# Download latest backup
aws s3 cp s3://my-backups/latest.sql.gz /tmp/

# Restore to test database
gunzip /tmp/latest.sql.gz
psql $TEST_DATABASE_URL < /tmp/latest.sql

# Verify data integrity
psql $TEST_DATABASE_URL -c "SELECT count(*) FROM users;"
```

## Rollback Procedures

### Vercel
```bash
# List deployments
vercel ls

# Promote a previous deployment
vercel promote [deployment-url]
```

### Railway
```bash
# Rollback to previous deployment
railway rollback
```

### Docker/Custom
```bash
# Tag releases
docker tag app:latest app:v1.2.3

# Rollback
docker stop app && docker run -d app:v1.2.2
```

## Zero-Downtime Deployment

Most PaaS platforms handle this automatically. For custom deployments:

1. Start new version alongside old
2. Health check new version
3. Switch traffic to new version
4. Stop old version

```yaml
# Docker Compose with rolling update
services:
  app:
    deploy:
      replicas: 2
      update_config:
        parallelism: 1
        delay: 10s
        order: start-first
```

## Health Check Endpoint

Every service MUST have this:

```typescript
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION || 'unknown',
  });
});
```
