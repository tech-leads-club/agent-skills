#!/usr/bin/env python3
"""
Security Review Checklist Generator

Generates security checklist based on architecture components.
Usage: python security_review.py --services "Lambda,DynamoDB,S3"
       echo "API with Lambda, DynamoDB, and S3" | python security_review.py
"""

import argparse
import sys
import json
from datetime import datetime

SECURITY_CHECKS = {
    "IAM": {
        "category": "Identity & Access Management",
        "checks": [
            {"id": "IAM-001", "check": "IAM roles use least privilege principle", "severity": "HIGH"},
            {"id": "IAM-002", "check": "No wildcard (*) in resource ARNs", "severity": "HIGH"},
            {"id": "IAM-003", "check": "No wildcard (*) in actions unless justified", "severity": "MEDIUM"},
            {"id": "IAM-004", "check": "Conditions used where applicable (source IP, MFA, tags)", "severity": "MEDIUM"},
            {"id": "IAM-005", "check": "Cross-account access uses external ID", "severity": "HIGH"},
            {"id": "IAM-006", "check": "Service roles scoped to specific resources", "severity": "HIGH"},
            {"id": "IAM-007", "check": "Permission boundaries for delegated administration", "severity": "MEDIUM"},
            {"id": "IAM-008", "check": "No long-term access keys (use roles instead)", "severity": "HIGH"},
        ]
    },
    "Lambda": {
        "category": "AWS Lambda",
        "checks": [
            {"id": "LAM-001", "check": "Execution role follows least privilege", "severity": "HIGH"},
            {"id": "LAM-002", "check": "Environment variables with secrets use encryption", "severity": "HIGH"},
            {"id": "LAM-003", "check": "Secrets retrieved from Secrets Manager, not env vars", "severity": "MEDIUM"},
            {"id": "LAM-004", "check": "Function in VPC if accessing private resources", "severity": "MEDIUM"},
            {"id": "LAM-005", "check": "Reserved concurrency set to prevent resource exhaustion", "severity": "MEDIUM"},
            {"id": "LAM-006", "check": "Function URL authentication configured (if used)", "severity": "HIGH"},
            {"id": "LAM-007", "check": "No sensitive data in function code or layers", "severity": "HIGH"},
            {"id": "LAM-008", "check": "Input validation on all event data", "severity": "HIGH"},
        ]
    },
    "API Gateway": {
        "category": "API Gateway",
        "checks": [
            {"id": "API-001", "check": "Authentication configured (Cognito/IAM/Lambda authorizer)", "severity": "HIGH"},
            {"id": "API-002", "check": "Throttling configured to prevent abuse", "severity": "HIGH"},
            {"id": "API-003", "check": "WAF attached for public-facing APIs", "severity": "HIGH"},
            {"id": "API-004", "check": "Access logging enabled", "severity": "MEDIUM"},
            {"id": "API-005", "check": "Request validation enabled", "severity": "MEDIUM"},
            {"id": "API-006", "check": "CORS configured restrictively (not wildcard)", "severity": "MEDIUM"},
            {"id": "API-007", "check": "API keys not sole authentication method", "severity": "HIGH"},
            {"id": "API-008", "check": "Private APIs use VPC endpoints", "severity": "MEDIUM"},
        ]
    },
    "DynamoDB": {
        "category": "DynamoDB",
        "checks": [
            {"id": "DDB-001", "check": "Encryption at rest enabled (KMS CMK if required)", "severity": "HIGH"},
            {"id": "DDB-002", "check": "IAM policies scoped to specific tables", "severity": "HIGH"},
            {"id": "DDB-003", "check": "IAM policies scoped to specific actions", "severity": "MEDIUM"},
            {"id": "DDB-004", "check": "Point-in-time recovery enabled for critical tables", "severity": "MEDIUM"},
            {"id": "DDB-005", "check": "Fine-grained access control if multi-tenant", "severity": "HIGH"},
            {"id": "DDB-006", "check": "VPC endpoints used for private access", "severity": "LOW"},
        ]
    },
    "S3": {
        "category": "Amazon S3",
        "checks": [
            {"id": "S3-001", "check": "Block Public Access enabled at account level", "severity": "HIGH"},
            {"id": "S3-002", "check": "Block Public Access enabled at bucket level", "severity": "HIGH"},
            {"id": "S3-003", "check": "Bucket policy does not allow public access", "severity": "HIGH"},
            {"id": "S3-004", "check": "Server-side encryption enabled", "severity": "HIGH"},
            {"id": "S3-005", "check": "Access logging enabled for sensitive buckets", "severity": "MEDIUM"},
            {"id": "S3-006", "check": "Versioning enabled for critical data", "severity": "MEDIUM"},
            {"id": "S3-007", "check": "Object Lock for compliance (if required)", "severity": "LOW"},
            {"id": "S3-008", "check": "CORS policy restrictive (if enabled)", "severity": "MEDIUM"},
            {"id": "S3-009", "check": "Presigned URLs have appropriate expiration", "severity": "MEDIUM"},
        ]
    },
    "RDS": {
        "category": "RDS / Aurora",
        "checks": [
            {"id": "RDS-001", "check": "Encryption at rest enabled", "severity": "HIGH"},
            {"id": "RDS-002", "check": "Database in private subnet (no public IP)", "severity": "HIGH"},
            {"id": "RDS-003", "check": "Security groups restrict access to app tier only", "severity": "HIGH"},
            {"id": "RDS-004", "check": "IAM database authentication considered", "severity": "MEDIUM"},
            {"id": "RDS-005", "check": "SSL/TLS enforced for connections", "severity": "HIGH"},
            {"id": "RDS-006", "check": "Automated backups enabled", "severity": "MEDIUM"},
            {"id": "RDS-007", "check": "Database credentials in Secrets Manager", "severity": "HIGH"},
            {"id": "RDS-008", "check": "Audit logging enabled (if required)", "severity": "MEDIUM"},
        ]
    },
    "ECS": {
        "category": "ECS / Fargate",
        "checks": [
            {"id": "ECS-001", "check": "Container images scanned for vulnerabilities", "severity": "HIGH"},
            {"id": "ECS-002", "check": "Task role follows least privilege", "severity": "HIGH"},
            {"id": "ECS-003", "check": "Secrets injected via Secrets Manager", "severity": "HIGH"},
            {"id": "ECS-004", "check": "No sensitive data in environment variables", "severity": "HIGH"},
            {"id": "ECS-005", "check": "Container runs as non-root user", "severity": "MEDIUM"},
            {"id": "ECS-006", "check": "Read-only root filesystem (where possible)", "severity": "LOW"},
            {"id": "ECS-007", "check": "Network mode appropriate for isolation", "severity": "MEDIUM"},
            {"id": "ECS-008", "check": "ECR repository policy restricts access", "severity": "MEDIUM"},
        ]
    },
    "VPC": {
        "category": "VPC & Networking",
        "checks": [
            {"id": "VPC-001", "check": "Private subnets for databases and app servers", "severity": "HIGH"},
            {"id": "VPC-002", "check": "Security groups default deny (no inbound by default)", "severity": "HIGH"},
            {"id": "VPC-003", "check": "No 0.0.0.0/0 ingress on sensitive ports", "severity": "HIGH"},
            {"id": "VPC-004", "check": "Security groups reference other SGs, not CIDR where possible", "severity": "MEDIUM"},
            {"id": "VPC-005", "check": "VPC Flow Logs enabled", "severity": "MEDIUM"},
            {"id": "VPC-006", "check": "VPC endpoints for AWS services (private access)", "severity": "MEDIUM"},
            {"id": "VPC-007", "check": "NACLs as additional layer for sensitive subnets", "severity": "LOW"},
        ]
    },
    "Cognito": {
        "category": "Amazon Cognito",
        "checks": [
            {"id": "COG-001", "check": "Strong password policy configured", "severity": "HIGH"},
            {"id": "COG-002", "check": "MFA enabled or enforced", "severity": "HIGH"},
            {"id": "COG-003", "check": "Account recovery requires verified email/phone", "severity": "MEDIUM"},
            {"id": "COG-004", "check": "Token expiration appropriately short", "severity": "MEDIUM"},
            {"id": "COG-005", "check": "Advanced security features enabled (if applicable)", "severity": "LOW"},
        ]
    },
    "CloudWatch": {
        "category": "Logging & Monitoring",
        "checks": [
            {"id": "LOG-001", "check": "CloudTrail enabled in all regions", "severity": "HIGH"},
            {"id": "LOG-002", "check": "CloudTrail logs encrypted", "severity": "MEDIUM"},
            {"id": "LOG-003", "check": "CloudTrail log file validation enabled", "severity": "MEDIUM"},
            {"id": "LOG-004", "check": "No sensitive data in application logs", "severity": "HIGH"},
            {"id": "LOG-005", "check": "Log retention configured appropriately", "severity": "MEDIUM"},
            {"id": "LOG-006", "check": "Alarms on security-relevant events", "severity": "MEDIUM"},
            {"id": "LOG-007", "check": "GuardDuty enabled", "severity": "HIGH"},
        ]
    },
}

def detect_services(text: str) -> list:
    """Detect AWS services mentioned in text."""
    service_keywords = {
        "Lambda": ["lambda", "serverless function", "function"],
        "DynamoDB": ["dynamodb", "dynamo", "nosql"],
        "S3": ["s3", "bucket", "object storage"],
        "RDS": ["rds", "postgres", "mysql", "aurora", "database", "sql"],
        "API Gateway": ["api gateway", "apigateway", "rest api", "http api"],
        "ECS": ["ecs", "container", "fargate", "docker"],
        "VPC": ["vpc", "subnet", "security group", "network"],
        "Cognito": ["cognito", "user pool", "authentication"],
        "CloudWatch": ["cloudwatch", "logging", "monitoring"],
    }
    
    text_lower = text.lower()
    detected = []
    for service, keywords in service_keywords.items():
        if any(kw in text_lower for kw in keywords):
            detected.append(service)
    
    # Always include IAM and CloudWatch
    if "IAM" not in detected:
        detected.append("IAM")
    if "CloudWatch" not in detected:
        detected.append("CloudWatch")
    
    return detected

def generate_checklist(services: list, severity_filter: str = None) -> dict:
    """Generate security checklist for given services."""
    checklist = {
        "generated_at": datetime.now().isoformat(),
        "services": services,
        "total_checks": 0,
        "by_severity": {"HIGH": 0, "MEDIUM": 0, "LOW": 0},
        "categories": []
    }
    
    for service in services:
        if service not in SECURITY_CHECKS:
            continue
        
        service_data = SECURITY_CHECKS[service]
        checks = service_data["checks"]
        
        if severity_filter:
            checks = [c for c in checks if c["severity"] == severity_filter.upper()]
        
        if checks:
            category = {
                "name": service_data["category"],
                "checks": checks
            }
            checklist["categories"].append(category)
            
            for check in checks:
                checklist["total_checks"] += 1
                checklist["by_severity"][check["severity"]] += 1
    
    return checklist

def main():
    parser = argparse.ArgumentParser(description="Generate Security Review Checklist")
    parser.add_argument("--services", help="Comma-separated list of AWS services")
    parser.add_argument("--severity", choices=["HIGH", "MEDIUM", "LOW"], help="Filter by severity")
    parser.add_argument("--json", action="store_true", help="Output as JSON")
    args = parser.parse_args()
    
    # Get services from args or stdin
    if args.services:
        services = [s.strip() for s in args.services.split(",")]
    elif not sys.stdin.isatty():
        text = sys.stdin.read()
        services = detect_services(text)
    else:
        # Default to common serverless stack
        services = ["IAM", "Lambda", "API Gateway", "DynamoDB", "S3", "CloudWatch"]
    
    checklist = generate_checklist(services, args.severity)
    
    if args.json:
        print(json.dumps(checklist, indent=2))
    else:
        print(f"\n{'='*70}")
        print(f"SECURITY REVIEW CHECKLIST")
        print(f"Generated: {checklist['generated_at']}")
        print(f"Services: {', '.join(services)}")
        print(f"Total Checks: {checklist['total_checks']} (HIGH: {checklist['by_severity']['HIGH']}, MEDIUM: {checklist['by_severity']['MEDIUM']}, LOW: {checklist['by_severity']['LOW']})")
        print(f"{'='*70}")
        
        for category in checklist["categories"]:
            print(f"\n## {category['name']}\n")
            for check in category["checks"]:
                severity_icon = {"HIGH": "🔴", "MEDIUM": "🟡", "LOW": "🟢"}[check["severity"]]
                print(f"  [ ] {severity_icon} [{check['id']}] {check['check']}")
        
        print(f"\n{'='*70}")
        print("Legend: 🔴 HIGH | 🟡 MEDIUM | 🟢 LOW")
        print("Note: Use aws___search_documentation for implementation guidance.")
        print(f"{'='*70}\n")

if __name__ == "__main__":
    main()
