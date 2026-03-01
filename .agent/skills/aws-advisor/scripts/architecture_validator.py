#!/usr/bin/env python3
"""
Architecture Validator

Validates architecture description against best practices and identifies gaps.
Usage: python architecture_validator.py
       echo "Lambda API with public S3 bucket" | python architecture_validator.py
"""

import argparse
import sys
import json
import re
from datetime import datetime

# Validation rules organized by category
VALIDATION_RULES = {
    "security": [
        {
            "id": "SEC-001",
            "name": "Public S3 Warning",
            "pattern": r"public\s+s3|s3\s+public|public\s+bucket",
            "severity": "HIGH",
            "message": "Public S3 buckets detected. Ensure Block Public Access is intentionally disabled and bucket policy is restrictive.",
            "recommendation": "Use CloudFront with OAI/OAC for public content distribution instead of public buckets."
        },
        {
            "id": "SEC-002",
            "name": "Missing Authentication",
            "pattern": r"(api|endpoint|gateway)(?!.*(cognito|iam|auth|jwt|oauth|authorizer))",
            "severity": "HIGH",
            "message": "API mentioned without authentication mechanism.",
            "recommendation": "Specify authentication: Cognito, IAM, Lambda Authorizer, or API Keys."
        },
        {
            "id": "SEC-003",
            "name": "Database in Public Subnet",
            "pattern": r"(rds|database|aurora|dynamodb).*(public|internet)",
            "severity": "HIGH",
            "message": "Database may be in public subnet or publicly accessible.",
            "recommendation": "Place databases in private subnets with no public IP."
        },
        {
            "id": "SEC-004",
            "name": "Missing Encryption Mention",
            "pattern": r"^(?!.*(encrypt|kms|ssl|tls|https)).*$",
            "severity": "MEDIUM",
            "message": "No encryption mentioned in architecture.",
            "recommendation": "Explicitly define encryption at rest (KMS) and in transit (TLS)."
        },
        {
            "id": "SEC-005",
            "name": "Hardcoded Credentials Risk",
            "pattern": r"(password|secret|key|credential).*(env|environment|config|code)",
            "severity": "HIGH",
            "message": "Credentials may be hardcoded or in environment variables.",
            "recommendation": "Use AWS Secrets Manager or Parameter Store for all secrets."
        },
    ],
    "reliability": [
        {
            "id": "REL-001",
            "name": "Single AZ Deployment",
            "pattern": r"single\s+az|one\s+az|1\s+az",
            "severity": "HIGH",
            "message": "Single AZ deployment detected. Risk of availability zone failure.",
            "recommendation": "Deploy across multiple AZs for production workloads."
        },
        {
            "id": "REL-002",
            "name": "Missing Backup Strategy",
            "pattern": r"(rds|database|dynamodb|s3)(?!.*(backup|pitr|point-in-time|versioning))",
            "severity": "MEDIUM",
            "message": "Data store mentioned without backup strategy.",
            "recommendation": "Enable automated backups, PITR, or versioning for data stores."
        },
        {
            "id": "REL-003",
            "name": "Missing Error Handling",
            "pattern": r"(lambda|function|api)(?!.*(retry|dlq|dead.letter|error|fallback))",
            "severity": "MEDIUM",
            "message": "Processing component without error handling mentioned.",
            "recommendation": "Implement retries, DLQs, and circuit breakers for resilience."
        },
        {
            "id": "REL-004",
            "name": "No Health Checks",
            "pattern": r"(ecs|ec2|fargate|alb)(?!.*(health|healthcheck|monitoring))",
            "severity": "MEDIUM",
            "message": "Compute resources without health checks mentioned.",
            "recommendation": "Configure health checks for load balancers and container orchestration."
        },
    ],
    "performance": [
        {
            "id": "PERF-001",
            "name": "Missing Caching Layer",
            "pattern": r"(api|database|rds)(?!.*(cache|redis|elasticache|cloudfront|dax))",
            "severity": "LOW",
            "message": "No caching layer mentioned. May impact performance under load.",
            "recommendation": "Consider ElastiCache, DAX, or CloudFront for caching."
        },
        {
            "id": "PERF-002",
            "name": "Potential Cold Start Impact",
            "pattern": r"lambda.*(latency|real-time|low.latency|critical)",
            "severity": "MEDIUM",
            "message": "Lambda used for latency-sensitive workload.",
            "recommendation": "Consider Provisioned Concurrency or container alternatives for latency-critical paths."
        },
        {
            "id": "PERF-003",
            "name": "Missing CDN for Static Content",
            "pattern": r"s3.*(static|website|assets|images|frontend)(?!.*cloudfront)",
            "severity": "LOW",
            "message": "Static content served from S3 without CDN.",
            "recommendation": "Use CloudFront for global distribution and reduced latency."
        },
    ],
    "cost": [
        {
            "id": "COST-001",
            "name": "NAT Gateway Usage",
            "pattern": r"nat\s+gateway|natgateway",
            "severity": "INFO",
            "message": "NAT Gateway detected. This can be expensive for high traffic.",
            "recommendation": "Consider VPC endpoints for AWS services to reduce NAT costs."
        },
        {
            "id": "COST-002",
            "name": "Provisioned Capacity Without Justification",
            "pattern": r"provisioned.*(concurrency|capacity|iops)",
            "severity": "INFO",
            "message": "Provisioned capacity mentioned. Ensure traffic patterns justify this.",
            "recommendation": "Use on-demand unless you have predictable, steady-state traffic."
        },
        {
            "id": "COST-003",
            "name": "Multi-Region Without Requirement",
            "pattern": r"multi.region|global.table|cross.region",
            "severity": "INFO",
            "message": "Multi-region architecture detected. Ensure business requirement justifies cost.",
            "recommendation": "Multi-region doubles infrastructure cost. Confirm DR/latency requirements."
        },
    ],
    "operational": [
        {
            "id": "OPS-001",
            "name": "Missing Observability",
            "pattern": r"^(?!.*(cloudwatch|x-ray|logging|monitoring|metrics|tracing|alarm)).*$",
            "severity": "MEDIUM",
            "message": "No observability components mentioned.",
            "recommendation": "Include CloudWatch, X-Ray, and alerting in architecture."
        },
        {
            "id": "OPS-002",
            "name": "Missing IaC",
            "pattern": r"^(?!.*(cdk|cloudformation|terraform|sam|serverless.framework|iac)).*$",
            "severity": "MEDIUM",
            "message": "No Infrastructure as Code mentioned.",
            "recommendation": "Use CDK, CloudFormation, or Terraform for reproducible deployments."
        },
        {
            "id": "OPS-003",
            "name": "Missing CI/CD",
            "pattern": r"^(?!.*(cicd|ci/cd|pipeline|codepipeline|github.actions|deployment)).*$",
            "severity": "LOW",
            "message": "No CI/CD pipeline mentioned.",
            "recommendation": "Include deployment pipeline in architecture for automated, safe deployments."
        },
    ],
    "completeness": [
        {
            "id": "COMP-001",
            "name": "Missing Network Architecture",
            "pattern": r"^(?!.*(vpc|subnet|security.group|network)).*$",
            "severity": "MEDIUM",
            "message": "Network architecture not specified.",
            "recommendation": "Define VPC, subnets (public/private), and security groups."
        },
        {
            "id": "COMP-002",
            "name": "Missing Data Flow",
            "pattern": r"^(?!.*(flow|connects|calls|invokes|reads|writes|stores)).*$",
            "severity": "LOW",
            "message": "Data flow between components not clear.",
            "recommendation": "Describe how data flows between components."
        },
    ],
}

def validate_architecture(text: str) -> dict:
    """Validate architecture description against rules."""
    text_lower = text.lower()
    
    results = {
        "validated_at": datetime.now().isoformat(),
        "input_length": len(text),
        "findings": [],
        "summary": {
            "HIGH": 0,
            "MEDIUM": 0,
            "LOW": 0,
            "INFO": 0
        },
        "categories_checked": list(VALIDATION_RULES.keys())
    }
    
    for category, rules in VALIDATION_RULES.items():
        for rule in rules:
            try:
                if re.search(rule["pattern"], text_lower, re.IGNORECASE | re.MULTILINE):
                    finding = {
                        "id": rule["id"],
                        "category": category,
                        "name": rule["name"],
                        "severity": rule["severity"],
                        "message": rule["message"],
                        "recommendation": rule["recommendation"]
                    }
                    results["findings"].append(finding)
                    results["summary"][rule["severity"]] += 1
            except re.error:
                pass  # Skip invalid regex
    
    # Add positive findings for good practices detected
    good_practices = []
    if re.search(r"multi.az|multiple.az", text_lower):
        good_practices.append("✅ Multi-AZ deployment mentioned")
    if re.search(r"encrypt|kms", text_lower):
        good_practices.append("✅ Encryption mentioned")
    if re.search(r"cognito|auth|iam", text_lower):
        good_practices.append("✅ Authentication mechanism mentioned")
    if re.search(r"cloudwatch|monitoring|x-ray", text_lower):
        good_practices.append("✅ Observability mentioned")
    if re.search(r"cdk|cloudformation|terraform", text_lower):
        good_practices.append("✅ Infrastructure as Code mentioned")
    if re.search(r"private.subnet|private\s+subnet", text_lower):
        good_practices.append("✅ Private subnets mentioned")
    
    results["good_practices"] = good_practices
    
    return results

def main():
    parser = argparse.ArgumentParser(description="Validate AWS Architecture Description")
    parser.add_argument("--json", action="store_true", help="Output as JSON")
    parser.add_argument("--severity", choices=["HIGH", "MEDIUM", "LOW", "INFO"], 
                        help="Filter by minimum severity")
    args = parser.parse_args()
    
    # Get description from stdin
    if not sys.stdin.isatty():
        text = sys.stdin.read().strip()
    else:
        print("Please provide architecture description via stdin.")
        print("Example: echo 'Lambda API with DynamoDB' | python architecture_validator.py")
        return
    
    results = validate_architecture(text)
    
    # Filter by severity if requested
    if args.severity:
        severity_order = ["HIGH", "MEDIUM", "LOW", "INFO"]
        min_index = severity_order.index(args.severity)
        allowed = severity_order[:min_index + 1]
        results["findings"] = [f for f in results["findings"] if f["severity"] in allowed]
    
    if args.json:
        print(json.dumps(results, indent=2))
    else:
        print(f"\n{'='*70}")
        print("ARCHITECTURE VALIDATION REPORT")
        print(f"{'='*70}")
        print(f"Validated: {results['validated_at']}")
        print(f"Findings: {len(results['findings'])} issues found")
        print(f"  HIGH: {results['summary']['HIGH']} | MEDIUM: {results['summary']['MEDIUM']} | LOW: {results['summary']['LOW']} | INFO: {results['summary']['INFO']}")
        
        if results["good_practices"]:
            print(f"\n{'='*70}")
            print("GOOD PRACTICES DETECTED")
            print(f"{'='*70}")
            for practice in results["good_practices"]:
                print(f"  {practice}")
        
        if results["findings"]:
            print(f"\n{'='*70}")
            print("FINDINGS")
            print(f"{'='*70}")
            
            for finding in sorted(results["findings"], 
                                 key=lambda x: ["HIGH", "MEDIUM", "LOW", "INFO"].index(x["severity"])):
                severity_icon = {
                    "HIGH": "🔴",
                    "MEDIUM": "🟡", 
                    "LOW": "🟢",
                    "INFO": "ℹ️"
                }[finding["severity"]]
                
                print(f"\n{severity_icon} [{finding['id']}] {finding['name']}")
                print(f"   Category: {finding['category']}")
                print(f"   Issue: {finding['message']}")
                print(f"   Recommendation: {finding['recommendation']}")
        else:
            print("\n✅ No issues found!")
        
        print(f"\n{'='*70}")
        print("Note: This is an automated check. Use aws___search_documentation for detailed guidance.")
        print(f"{'='*70}\n")

if __name__ == "__main__":
    main()
