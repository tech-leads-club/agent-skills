# Service Decision Trees

Quick decision flows for AWS service selection. Use these to guide conversations, then search docs for details.

## IaC Tool Selection

```
What's the priority?
├── Speed / Rapid prototyping →
│   ├── Serverless-focused → Serverless Framework or SST
│   ├── Full-stack with frontend → SST or Amplify
│   └── Quick Lambda + API → SAM
├── Team already uses Terraform → Terraform (consistency wins)
├── Multi-cloud requirement → Terraform or Pulumi
├── Complex AWS infrastructure →
│   ├── Team knows TypeScript/Python/Java → CDK
│   ├── Want programming constructs → CDK or Pulumi
│   └── Prefer declarative → Terraform or CloudFormation
├── Enterprise / Compliance-heavy →
│   ├── Need AWS support → CloudFormation or CDK
│   └── Existing Terraform governance → Terraform
└── Learning AWS → Start with SAM or CloudFormation (foundational)
```

### IaC Comparison Matrix

| Tool                     | Best For                                | Trade-offs                       |
| ------------------------ | --------------------------------------- | -------------------------------- |
| **Serverless Framework** | Fast serverless apps, plugins ecosystem | Less control over non-serverless |
| **SST**                  | Full-stack serverless, local dev        | Newer, smaller community         |
| **SAM**                  | Lambda + API Gateway, AWS native        | Limited to serverless resources  |
| **CDK**                  | Complex infra, type safety, constructs  | Learning curve, AWS-only         |
| **Terraform**            | Multi-cloud, mature ecosystem, state    | HCL syntax, state management     |
| **Pulumi**               | Multi-cloud with real languages         | Smaller community than Terraform |
| **CloudFormation**       | AWS native, no dependencies             | Verbose, slow feedback loop      |

### When to Switch Tools

- **SAM → CDK**: When you need non-serverless resources
- **Serverless → Terraform**: When going multi-cloud
- **CloudFormation → CDK**: When templates get too complex
- **Any → Terraform**: When team standardizes on it

## Compute Selection

```
What's the workload?
├── Event-driven, <15min execution → Lambda
├── Containers →
│   ├── Need Kubernetes? → EKS
│   ├── Need GPU or specific instances? → ECS on EC2
│   ├── Want simplicity? → Fargate
│   └── Simple web app? → App Runner
├── Batch processing → AWS Batch
├── Full VM control needed → EC2
└── Long-running background jobs → ECS/EKS or EC2
```

## Database Selection

```
Data model?
├── Relational (SQL) →
│   ├── Need serverless auto-scale? → Aurora Serverless v2
│   ├── Need global distribution? → Aurora Global
│   ├── PostgreSQL/MySQL standard → RDS
│   └── Legacy Oracle/SQL Server → RDS
├── Key-Value / Document →
│   ├── Need massive scale + single-digit ms? → DynamoDB
│   ├── MongoDB compatibility required? → DocumentDB
│   └── Simple key-value cache → ElastiCache
├── Graph relationships → Neptune
├── Time-series data → Timestream
├── Full-text search → OpenSearch
└── In-memory caching → ElastiCache (Redis/Memcached)
```

## Storage Selection

```
What are you storing?
├── Objects (files, images, backups) →
│   ├── Frequent access → S3 Standard
│   ├── Infrequent access → S3 IA
│   ├── Unknown pattern → S3 Intelligent-Tiering
│   └── Archive → Glacier (Instant/Flexible/Deep)
├── Block storage (databases, OS) →
│   ├── General purpose → gp3
│   ├── High IOPS → io2
│   └── Throughput (big data) → st1
├── Shared file system →
│   ├── Linux workloads → EFS
│   ├── Windows workloads → FSx Windows
│   └── HPC / ML training → FSx Lustre
└── Hybrid (on-prem + cloud) → Storage Gateway
```

## API/Integration Selection

```
What type of API?
├── REST API →
│   ├── Need full features (WAF, caching, transforms)? → API Gateway REST
│   ├── Need low latency + cost? → API Gateway HTTP
│   └── Internal only? → ALB + Lambda
├── GraphQL → AppSync
├── WebSocket → API Gateway WebSocket
├── gRPC → ALB or NLB
└── Event-driven async →
    ├── AWS-to-AWS events → EventBridge
    ├── Queue processing → SQS
    ├── Pub/Sub fanout → SNS
    └── Streaming → Kinesis
```

## Messaging Selection

```
Communication pattern?
├── One-to-one queue → SQS
├── One-to-many (fanout) → SNS
├── Event routing with rules → EventBridge
├── Streaming (ordered, replay) → Kinesis Data Streams
├── Need Kafka → MSK
└── Need RabbitMQ/ActiveMQ → Amazon MQ
```

## Container Orchestration

```
Kubernetes requirement?
├── Yes, need K8s →
│   ├── Managed control plane → EKS
│   ├── Serverless pods → EKS + Fargate
│   └── On-premises → EKS Anywhere
└── No K8s needed →
    ├── Just run containers → ECS
    ├── Don't manage instances → Fargate
    └── Simple single container → App Runner
```

## Serverless vs Containers

```
Considerations:
├── Execution time >15min? → Containers
├── Need persistent connections? → Containers
├── Unpredictable traffic, scale to zero? → Lambda
├── Cost optimization at steady load? → Containers
├── Cold start sensitive? → Containers (or provisioned Lambda)
├── GPU required? → Containers
└── Simplest deployment? → Lambda
```

## Multi-Region Strategy

```
Requirement?
├── Active-Active (both serve traffic) →
│   ├── Database: DynamoDB Global Tables or Aurora Global
│   ├── Routing: Route 53 latency-based
│   └── Compute: Deploy to both regions
├── Active-Passive (DR) →
│   ├── Database: Cross-region replicas
│   ├── Routing: Route 53 failover
│   └── Compute: Standby or pilot light
├── Read replicas only →
│   └── Aurora read replicas in other regions
└── Static content only →
    └── CloudFront with S3 origin
```

## Authentication Selection

```
Who's authenticating?
├── End users (mobile/web app) →
│   ├── Social login + custom → Cognito User Pools
│   ├── Existing IdP (Okta, AD) → Cognito + Federation
│   └── B2C at scale → Cognito
├── Internal users (employees) →
│   ├── AWS Console/CLI → IAM Identity Center
│   ├── Corporate SSO → IAM Identity Center + SAML
│   └── Programmatic access → IAM roles
├── Machine-to-machine →
│   ├── Within AWS → IAM roles
│   ├── External services → Secrets Manager + IAM
│   └── API clients → API Gateway + API keys or Cognito
└── Cross-account → IAM roles with trust policies
```

## Questions to Ask User

### For Architecture Decisions

1. What's the expected traffic pattern? (steady vs spiky)
2. What's acceptable latency? (p99 target)
3. What's the budget constraint?
4. Any compliance requirements? (HIPAA, PCI, SOC2)
5. What regions need to be supported?
6. What's the team's expertise? (K8s? Serverless?)

### For Database Decisions

1. What's the data model? (relational, document, graph)
2. Read/write ratio?
3. Expected data size and growth?
4. Consistency requirements? (strong vs eventual)
5. Need for transactions?

### For Compute Decisions

1. Is the workload event-driven or long-running?
2. Any specific runtime requirements?
3. Need for GPU or specialized hardware?
4. Cold start tolerance?
5. Scaling requirements? (scale to zero?)
