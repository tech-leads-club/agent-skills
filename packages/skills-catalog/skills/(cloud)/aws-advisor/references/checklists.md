# Checklists & Discovery Questions

Things MCP documentation doesn't tell you - context-dependent questions, trade-offs, and validation points.

## Architecture Discovery Questions

Ask these before designing:

### Tech Stack Context

- [ ] What language/runtime does the team prefer? (Node, Python, Go, Java, etc.)
- [ ] What IaC tool is the team using? (Terraform, CDK, Serverless, SAM, etc.)
- [ ] Is there an existing project to integrate with?
- [ ] What's the deployment pipeline? (GitHub Actions, GitLab CI, CodePipeline, etc.)
- [ ] Any framework preferences? (Express, FastAPI, NestJS, etc.)

### Business Context

- [ ] What problem are we solving?
- [ ] Who are the users? (internal, external, B2B, B2C)
- [ ] What's the expected timeline?
- [ ] What's the budget range?
- [ ] Are there existing systems to integrate with?

### Non-Functional Requirements

- [ ] Availability target? (99.9%? 99.99%?)
- [ ] Latency requirements? (p50, p99)
- [ ] Throughput expectations? (RPS, concurrent users)
- [ ] Data retention requirements?
- [ ] Disaster recovery requirements? (RTO, RPO)

### Constraints

- [ ] Regulatory compliance? (HIPAA, PCI-DSS, GDPR, LGPD)
- [ ] Data residency requirements? (specific regions)
- [ ] Existing technology mandates?
- [ ] Team skills and experience?
- [ ] Vendor lock-in concerns?

### Growth & Scale

- [ ] Expected growth rate?
- [ ] Peak vs average load ratio?
- [ ] Seasonal patterns?
- [ ] Multi-region needs now or future?

## Pre-Production Checklist

Before going live:

### Security

- [ ] All secrets in Secrets Manager or Parameter Store
- [ ] IAM roles follow least privilege
- [ ] No hardcoded credentials anywhere
- [ ] Encryption at rest enabled (S3, RDS, EBS, DynamoDB)
- [ ] Encryption in transit (TLS 1.2+)
- [ ] VPC endpoints for AWS services (if private)
- [ ] Security groups reviewed (no 0.0.0.0/0 on sensitive ports)
- [ ] WAF configured (if public-facing)
- [ ] CloudTrail enabled
- [ ] GuardDuty enabled

### Observability

- [ ] CloudWatch alarms on key metrics
- [ ] Dashboards for operations team
- [ ] Log aggregation configured
- [ ] X-Ray tracing enabled (if applicable)
- [ ] Error alerting to on-call

### Reliability

- [ ] Multi-AZ deployment
- [ ] Auto-scaling configured
- [ ] Health checks defined
- [ ] Backups automated and tested
- [ ] Runbooks documented
- [ ] Incident response plan exists

### Cost

- [ ] Budget alerts configured
- [ ] Cost allocation tags applied
- [ ] Right-sizing reviewed
- [ ] Reserved capacity evaluated (if steady-state)
- [ ] Unused resources cleaned up

### Operations

- [ ] CI/CD pipeline tested
- [ ] Rollback procedure documented
- [ ] Database migration strategy defined
- [ ] Feature flags for risky changes
- [ ] Load testing completed

## Security Review Checklist

### IAM

- [ ] No `*` in resource ARNs (be specific)
- [ ] No `*` in actions (use specific actions)
- [ ] Conditions used where possible (IP, MFA, tags)
- [ ] Service roles scoped to specific resources
- [ ] Cross-account access uses external ID
- [ ] Permission boundaries for delegated admins

### Network

- [ ] Private subnets for databases and app servers
- [ ] NAT Gateway for outbound from private subnets
- [ ] VPC Flow Logs enabled
- [ ] Security groups: ingress from specific sources only
- [ ] NACLs as backup layer (if needed)
- [ ] No public IPs unless required

### Data

- [ ] PII identified and protected
- [ ] Encryption keys customer-managed (if required)
- [ ] Backup encryption enabled
- [ ] Cross-region replication encrypted
- [ ] S3 Block Public Access enabled
- [ ] S3 bucket policies reviewed

### Application

- [ ] Input validation on all user input
- [ ] Output encoding for XSS prevention
- [ ] CORS configured correctly
- [ ] Rate limiting implemented
- [ ] Authentication tokens validated properly
- [ ] Session management secure

### Logging & Monitoring

- [ ] No sensitive data in logs
- [ ] Log retention configured
- [ ] Security events trigger alerts
- [ ] Failed login attempts monitored
- [ ] API throttling monitored

## Cost Optimization Review

### Compute

- [ ] Right-sized instances (CPU, memory utilization <70%?)
- [ ] Spot instances for fault-tolerant workloads
- [ ] Savings Plans or Reserved Instances for steady-state
- [ ] Lambda memory optimized (power tuning)
- [ ] Graviton (ARM) considered for compatible workloads

### Storage

- [ ] S3 lifecycle policies (transition to IA, Glacier)
- [ ] EBS volumes right-sized
- [ ] Unused EBS snapshots cleaned
- [ ] S3 Intelligent-Tiering for unknown access patterns

### Database

- [ ] Right-sized instance class
- [ ] Reserved capacity for production
- [ ] Aurora Serverless v2 for variable workloads
- [ ] DynamoDB on-demand vs provisioned evaluated
- [ ] Read replicas only if needed

### Network

- [ ] NAT Gateway usage minimized (expensive!)
- [ ] VPC endpoints for high-volume AWS API calls
- [ ] CloudFront for static content (reduce origin load)
- [ ] Data transfer between regions minimized

### General

- [ ] Unused resources identified and removed
- [ ] Cost anomaly detection enabled
- [ ] Tagging strategy for cost allocation
- [ ] Regular cost reviews scheduled

## Trade-offs to Discuss

### IaC Tool Selection

| Factor           | Serverless/SST | SAM       | CDK            | Terraform      |
| ---------------- | -------------- | --------- | -------------- | -------------- |
| Setup speed      | Fast           | Fast      | Medium         | Medium         |
| Learning curve   | Low            | Low       | Medium         | Medium         |
| Serverless focus | Excellent      | Excellent | Good           | Good           |
| Non-serverless   | Limited        | Limited   | Excellent      | Excellent      |
| Local dev        | Good (SST)     | Good      | Limited        | N/A            |
| Multi-cloud      | No             | No        | No             | Yes            |
| Team adoption    | Easy           | Easy      | Needs training | Needs training |
| AWS support      | Community      | AWS       | AWS            | Community      |

### Serverless vs Containers

| Factor               | Serverless         | Containers            |
| -------------------- | ------------------ | --------------------- |
| Cold start           | Yes (can mitigate) | No                    |
| Max execution        | 15 min             | Unlimited             |
| Cost at low traffic  | Lower              | Higher (min capacity) |
| Cost at high traffic | Can be higher      | Often lower           |
| Operational overhead | Lower              | Higher                |
| Customization        | Limited            | Full control          |

### SQL vs NoSQL

| Factor       | SQL                      | NoSQL (DynamoDB)       |
| ------------ | ------------------------ | ---------------------- |
| Schema       | Fixed, migrations needed | Flexible               |
| Queries      | Complex joins, ad-hoc    | Access pattern focused |
| Transactions | Full ACID                | Limited (single table) |
| Scaling      | Vertical (limited)       | Horizontal (unlimited) |
| Cost model   | Per hour                 | Per request/capacity   |

### Single-Region vs Multi-Region

| Factor           | Single     | Multi                 |
| ---------------- | ---------- | --------------------- |
| Complexity       | Low        | High                  |
| Cost             | Lower      | Higher (2x+ infra)    |
| Availability     | 99.99% max | 99.999%+ possible     |
| Latency          | One region | Global low latency    |
| Data consistency | Simple     | Complex (CAP theorem) |

### Managed vs Self-Managed

| Factor               | Managed Service      | Self-Managed                |
| -------------------- | -------------------- | --------------------------- |
| Operational overhead | Low                  | High                        |
| Customization        | Limited              | Full                        |
| Cost                 | Predictable, premium | Variable, potentially lower |
| Scaling              | Automatic            | Manual or custom            |
| Updates/Patches      | Automatic            | Your responsibility         |

## Common Pitfalls

### Architecture

- Designing for scale you don't have yet (over-engineering)
- Not designing for the scale you will have (under-engineering)
- Ignoring operational complexity
- Choosing technology based on hype, not fit

### Security

- Overly permissive IAM policies "to make it work"
- Forgetting to rotate credentials
- Not enabling encryption "because it's internal"
- Security groups with 0.0.0.0/0 "temporarily"

### Cost

- Leaving dev/test resources running
- Not using Savings Plans for production
- NAT Gateway for everything (expensive!)
- Oversized instances "just in case"

### Operations

- No runbooks before production
- No alerting until something breaks
- No load testing until launch
- No rollback plan
