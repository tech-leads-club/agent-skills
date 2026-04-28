#!/usr/bin/env python3
"""
Well-Architected Review Generator

Generates relevant review questions based on architecture context.
Usage: python well_architected_review.py --services "Lambda,DynamoDB,API Gateway" --pillars "security,cost"
       python well_architected_review.py --all
       echo "serverless API with Lambda and DynamoDB" | python well_architected_review.py
"""

import argparse
import sys
import json

PILLARS = {
    "operational_excellence": {
        "name": "Operational Excellence",
        "questions": {
            "general": [
                "How do you determine priorities for operational activities?",
                "How do you design workloads to understand their state?",
                "How do you reduce defects, ease remediation, and improve flow?",
                "How do you mitigate deployment risks?",
                "How do you know your workload is healthy?",
            ],
            "Lambda": [
                "Are Lambda functions instrumented with X-Ray tracing?",
                "Are CloudWatch alarms configured for errors and throttles?",
                "Is there a deployment strategy (canary, linear)?",
                "Are Lambda versions and aliases used for safe deployments?",
            ],
            "ECS": [
                "Is container health check configured properly?",
                "Are deployment circuit breakers enabled?",
                "Is container insights enabled for monitoring?",
            ],
            "API Gateway": [
                "Are access logs enabled?",
                "Is there a deployment stage strategy?",
                "Are CloudWatch alarms on 4xx/5xx errors?",
            ],
        }
    },
    "security": {
        "name": "Security",
        "questions": {
            "general": [
                "How do you manage identities for workload resources?",
                "How do you manage permissions for humans and machines?",
                "How do you detect and investigate security events?",
                "How do you protect your network resources?",
                "How do you protect your compute resources?",
                "How do you classify your data?",
                "How do you protect your data at rest?",
                "How do you protect your data in transit?",
            ],
            "Lambda": [
                "Does the execution role follow least privilege?",
                "Are environment variables with secrets encrypted?",
                "Is the function in a VPC if accessing private resources?",
                "Are reserved concurrency limits set to prevent DoS?",
            ],
            "DynamoDB": [
                "Is encryption at rest enabled (KMS CMK if required)?",
                "Are IAM policies scoped to specific tables and actions?",
                "Is point-in-time recovery enabled?",
            ],
            "S3": [
                "Is Block Public Access enabled at account level?",
                "Are bucket policies reviewed for overly permissive access?",
                "Is server-side encryption enabled?",
                "Are access logs enabled for sensitive buckets?",
            ],
            "API Gateway": [
                "Is authentication configured (Cognito, IAM, Lambda authorizer)?",
                "Is throttling configured to prevent abuse?",
                "Is WAF attached for public APIs?",
            ],
            "RDS": [
                "Is encryption at rest enabled?",
                "Is the database in a private subnet?",
                "Are security groups restricting access to app tier only?",
                "Is IAM database authentication considered?",
            ],
            "ECS": [
                "Are container images scanned for vulnerabilities?",
                "Is the task role following least privilege?",
                "Are secrets injected via Secrets Manager?",
            ],
        }
    },
    "reliability": {
        "name": "Reliability",
        "questions": {
            "general": [
                "How do you manage service quotas and constraints?",
                "How do you plan your network topology?",
                "How do you design to prevent failures?",
                "How do you design to mitigate failures?",
                "How do you test reliability?",
                "How do you back up data?",
            ],
            "Lambda": [
                "Is reserved concurrency configured appropriately?",
                "Are retries and DLQ configured for async invocations?",
                "Is error handling implemented for all failure modes?",
            ],
            "DynamoDB": [
                "Is on-demand or provisioned with auto-scaling configured?",
                "Are Global Tables needed for multi-region?",
                "Is backup strategy defined (PITR, on-demand)?",
            ],
            "RDS": [
                "Is Multi-AZ enabled for production?",
                "Are automated backups configured?",
                "Is read replica needed for read scaling?",
            ],
            "ECS": [
                "Are tasks spread across multiple AZs?",
                "Is desired count >1 for production?",
                "Is health check grace period appropriate?",
            ],
            "API Gateway": [
                "Are throttling limits appropriate for downstream capacity?",
                "Is caching configured for applicable endpoints?",
            ],
        }
    },
    "performance": {
        "name": "Performance Efficiency",
        "questions": {
            "general": [
                "How do you select appropriate compute resources?",
                "How do you select appropriate storage solutions?",
                "How do you select appropriate database solutions?",
                "How do you configure networking solutions?",
                "How do you evolve to take advantage of new releases?",
            ],
            "Lambda": [
                "Is memory size optimized (use Lambda Power Tuning)?",
                "Is Graviton (ARM) architecture used for cost/performance?",
                "Is provisioned concurrency needed for latency-sensitive?",
                "Are dependencies optimized (layers, tree-shaking)?",
            ],
            "DynamoDB": [
                "Are access patterns well-defined for key design?",
                "Are GSIs optimized (projection, sparse indexes)?",
                "Is DAX needed for read-heavy microsecond latency?",
            ],
            "RDS": [
                "Is instance class right-sized for workload?",
                "Are Performance Insights enabled?",
                "Is connection pooling implemented (RDS Proxy)?",
            ],
            "API Gateway": [
                "Is HTTP API used instead of REST when features allow?",
                "Is caching configured appropriately?",
                "Is compression enabled?",
            ],
            "S3": [
                "Is S3 Transfer Acceleration needed for distant uploads?",
                "Is CloudFront used for read-heavy workloads?",
                "Is multipart upload used for large objects?",
            ],
        }
    },
    "cost": {
        "name": "Cost Optimization",
        "questions": {
            "general": [
                "How do you implement cloud financial management?",
                "How do you govern usage?",
                "How do you monitor usage and cost?",
                "How do you decommission resources?",
                "How do you evaluate cost when selecting services?",
            ],
            "Lambda": [
                "Is memory optimized for cost (not just performance)?",
                "Is Graviton architecture used (20% cheaper)?",
                "Are unused functions identified and removed?",
                "Is provisioned concurrency really needed?",
            ],
            "DynamoDB": [
                "Is on-demand vs provisioned evaluated based on pattern?",
                "Are reserved capacity units considered for steady-state?",
                "Are unused indexes removed?",
                "Is TTL configured for data that expires?",
            ],
            "RDS": [
                "Is instance right-sized (not over-provisioned)?",
                "Are Reserved Instances purchased for production?",
                "Is Aurora Serverless v2 suitable for variable load?",
            ],
            "ECS": [
                "Are Spot instances used for fault-tolerant workloads?",
                "Is Fargate Spot considered for batch/dev?",
                "Are Savings Plans purchased for steady-state?",
            ],
            "S3": [
                "Are lifecycle policies configured for old data?",
                "Is Intelligent-Tiering used for unknown patterns?",
                "Are incomplete multipart uploads cleaned up?",
            ],
            "NAT Gateway": [
                "Is NAT Gateway really needed (vs VPC endpoints)?",
                "Can workloads use VPC endpoints instead?",
            ],
        }
    },
    "sustainability": {
        "name": "Sustainability",
        "questions": {
            "general": [
                "How do you select Regions to support sustainability goals?",
                "How do you optimize software and architecture for sustainability?",
                "How do you optimize hardware patterns for sustainability?",
            ],
            "Lambda": [
                "Is Graviton (ARM) used (more energy efficient)?",
                "Is function memory right-sized (not over-provisioned)?",
            ],
            "EC2": [
                "Are Graviton instances used where possible?",
                "Are instances right-sized?",
                "Is auto-scaling configured to scale down?",
            ],
        }
    },
}

def detect_services(text: str) -> list:
    """Detect AWS services mentioned in text."""
    service_keywords = {
        "Lambda": ["lambda", "serverless function"],
        "DynamoDB": ["dynamodb", "dynamo"],
        "S3": ["s3", "bucket", "object storage"],
        "RDS": ["rds", "postgres", "mysql", "aurora", "database"],
        "API Gateway": ["api gateway", "apigateway", "rest api", "http api"],
        "ECS": ["ecs", "container", "fargate"],
        "EKS": ["eks", "kubernetes", "k8s"],
        "SQS": ["sqs", "queue"],
        "SNS": ["sns", "notification", "pub/sub"],
        "CloudFront": ["cloudfront", "cdn"],
        "NAT Gateway": ["nat gateway", "nat"],
        "EC2": ["ec2", "instance", "virtual machine"],
    }
    
    text_lower = text.lower()
    detected = []
    for service, keywords in service_keywords.items():
        if any(kw in text_lower for kw in keywords):
            detected.append(service)
    return detected if detected else ["general"]

def generate_review(services: list, pillars: list = None) -> dict:
    """Generate review questions for given services and pillars."""
    if pillars is None:
        pillars = list(PILLARS.keys())
    
    review = {}
    for pillar_key in pillars:
        if pillar_key not in PILLARS:
            continue
        pillar = PILLARS[pillar_key]
        questions = []
        
        # Always add general questions
        questions.extend(pillar["questions"].get("general", []))
        
        # Add service-specific questions
        for service in services:
            service_questions = pillar["questions"].get(service, [])
            questions.extend(service_questions)
        
        if questions:
            review[pillar["name"]] = questions
    
    return review

def main():
    parser = argparse.ArgumentParser(description="Generate Well-Architected Review questions")
    parser.add_argument("--services", help="Comma-separated list of AWS services")
    parser.add_argument("--pillars", help="Comma-separated list of pillars (security,cost,reliability,performance,operational_excellence,sustainability)")
    parser.add_argument("--all", action="store_true", help="Include all pillars")
    parser.add_argument("--json", action="store_true", help="Output as JSON")
    args = parser.parse_args()
    
    # Get services from args or stdin
    if args.services:
        services = [s.strip() for s in args.services.split(",")]
    elif not sys.stdin.isatty():
        text = sys.stdin.read()
        services = detect_services(text)
    else:
        services = ["general"]
    
    # Get pillars
    if args.all:
        pillars = list(PILLARS.keys())
    elif args.pillars:
        pillars = [p.strip().lower().replace(" ", "_") for p in args.pillars.split(",")]
    else:
        pillars = ["security", "reliability", "cost"]  # Default to most critical
    
    review = generate_review(services, pillars)
    
    if args.json:
        print(json.dumps(review, indent=2))
    else:
        print(f"\n{'='*60}")
        print(f"WELL-ARCHITECTED REVIEW")
        print(f"Services: {', '.join(services)}")
        print(f"{'='*60}\n")
        
        for pillar_name, questions in review.items():
            print(f"\n## {pillar_name}\n")
            for i, q in enumerate(questions, 1):
                print(f"  {i}. {q}")
        
        print(f"\n{'='*60}")
        print("Note: Search AWS documentation for detailed guidance on each question.")
        print(f"{'='*60}\n")

if __name__ == "__main__":
    main()
