#!/usr/bin/env python3
"""
Cost Considerations Generator

Generates a list of cost factors to evaluate for an AWS architecture.
Does NOT estimate actual costs - use AWS Pricing Calculator for that.

Usage: python cost_considerations.py --services "Lambda,DynamoDB,API Gateway"
       echo "serverless API with Lambda and DynamoDB" | python cost_considerations.py
"""

import argparse
import sys
import json
from datetime import datetime

# Cost factors by service
COST_FACTORS = {
    "Lambda": {
        "category": "Compute - Serverless",
        "pricing_model": "Pay per invocation + duration (GB-seconds)",
        "factors": [
            {"factor": "Number of invocations per month", "unit": "requests", "impact": "HIGH"},
            {"factor": "Average execution duration", "unit": "ms", "impact": "HIGH"},
            {"factor": "Memory allocated", "unit": "MB", "impact": "HIGH"},
            {"factor": "Provisioned Concurrency (if used)", "unit": "concurrent executions", "impact": "MEDIUM"},
            {"factor": "Architecture (ARM vs x86)", "unit": "type", "impact": "MEDIUM", "note": "ARM is ~20% cheaper"},
            {"factor": "Data transfer out", "unit": "GB", "impact": "LOW"},
        ],
        "free_tier": "1M requests, 400,000 GB-seconds per month",
        "optimization_tips": [
            "Use ARM/Graviton architecture for 20% cost reduction",
            "Optimize memory size (use Lambda Power Tuning)",
            "Minimize cold starts to reduce duration",
            "Use Provisioned Concurrency only when needed",
        ],
        "calculator_link": "https://calculator.aws/#/addService/Lambda"
    },
    
    "API Gateway": {
        "category": "API Management",
        "pricing_model": "Pay per request + data transfer",
        "factors": [
            {"factor": "API type (REST vs HTTP)", "unit": "type", "impact": "HIGH", "note": "HTTP API is ~70% cheaper"},
            {"factor": "Number of API calls per month", "unit": "million requests", "impact": "HIGH"},
            {"factor": "Caching enabled", "unit": "GB-hours", "impact": "MEDIUM"},
            {"factor": "WebSocket connection minutes", "unit": "minutes", "impact": "MEDIUM"},
            {"factor": "Data transfer out", "unit": "GB", "impact": "LOW"},
        ],
        "free_tier": "1M REST API calls, 1M HTTP API calls per month (12 months)",
        "optimization_tips": [
            "Use HTTP API instead of REST API when features allow",
            "Enable caching for repeated requests",
            "Use request validation to reject invalid requests early",
        ],
        "calculator_link": "https://calculator.aws/#/addService/APIGateway"
    },
    
    "DynamoDB": {
        "category": "Database - NoSQL",
        "pricing_model": "On-demand OR Provisioned capacity",
        "factors": [
            {"factor": "Capacity mode", "unit": "type", "impact": "HIGH", "note": "On-demand vs Provisioned"},
            {"factor": "Read request units (RRU/RCU)", "unit": "per million / per hour", "impact": "HIGH"},
            {"factor": "Write request units (WRU/WCU)", "unit": "per million / per hour", "impact": "HIGH"},
            {"factor": "Storage size", "unit": "GB", "impact": "MEDIUM"},
            {"factor": "Global Tables (cross-region)", "unit": "replicated writes", "impact": "HIGH"},
            {"factor": "Backup (on-demand, PITR)", "unit": "GB", "impact": "LOW"},
            {"factor": "DAX (if used)", "unit": "node-hours", "impact": "MEDIUM"},
            {"factor": "Streams (if enabled)", "unit": "read request units", "impact": "LOW"},
        ],
        "free_tier": "25 GB storage, 25 RCU, 25 WCU (always free)",
        "optimization_tips": [
            "Use On-demand for unpredictable traffic",
            "Use Provisioned + Auto-scaling for predictable traffic",
            "Consider Reserved Capacity for steady-state (up to 77% savings)",
            "Design for efficient access patterns to minimize RCU/WCU",
            "Use sparse indexes to reduce storage",
        ],
        "calculator_link": "https://calculator.aws/#/addService/DynamoDB"
    },
    
    "S3": {
        "category": "Storage - Object",
        "pricing_model": "Pay per GB stored + requests + data transfer",
        "factors": [
            {"factor": "Storage class", "unit": "type", "impact": "HIGH", "note": "Standard vs IA vs Glacier"},
            {"factor": "Data stored", "unit": "GB", "impact": "HIGH"},
            {"factor": "PUT/COPY/POST/LIST requests", "unit": "per 1,000", "impact": "MEDIUM"},
            {"factor": "GET/SELECT requests", "unit": "per 1,000", "impact": "MEDIUM"},
            {"factor": "Data transfer out", "unit": "GB", "impact": "HIGH"},
            {"factor": "S3 Transfer Acceleration", "unit": "GB transferred", "impact": "LOW"},
        ],
        "free_tier": "5 GB Standard storage, 20,000 GET, 2,000 PUT (12 months)",
        "optimization_tips": [
            "Use S3 Intelligent-Tiering for unknown access patterns",
            "Set lifecycle policies to move to cheaper tiers",
            "Use CloudFront to reduce data transfer costs",
            "Enable S3 Analytics to understand access patterns",
        ],
        "calculator_link": "https://calculator.aws/#/addService/S3"
    },
    
    "RDS": {
        "category": "Database - Relational",
        "pricing_model": "Pay per instance hour + storage + I/O",
        "factors": [
            {"factor": "Instance class", "unit": "type", "impact": "HIGH"},
            {"factor": "Multi-AZ deployment", "unit": "boolean", "impact": "HIGH", "note": "Doubles cost"},
            {"factor": "Storage type and size", "unit": "GB", "impact": "MEDIUM"},
            {"factor": "Provisioned IOPS (if applicable)", "unit": "IOPS", "impact": "MEDIUM"},
            {"factor": "Backup storage", "unit": "GB", "impact": "LOW"},
            {"factor": "Data transfer out", "unit": "GB", "impact": "LOW"},
            {"factor": "Read replicas", "unit": "count", "impact": "HIGH"},
        ],
        "free_tier": "750 hours db.t2.micro, 20 GB storage (12 months)",
        "optimization_tips": [
            "Right-size instances based on actual utilization",
            "Use Reserved Instances for production (up to 72% savings)",
            "Consider Aurora Serverless v2 for variable workloads",
            "Use Graviton instances for better price/performance",
        ],
        "calculator_link": "https://calculator.aws/#/addService/RDS"
    },
    
    "ECS": {
        "category": "Compute - Containers",
        "pricing_model": "Fargate: vCPU + Memory per second | EC2: instance costs",
        "factors": [
            {"factor": "Launch type", "unit": "type", "impact": "HIGH", "note": "Fargate vs EC2"},
            {"factor": "vCPU per task", "unit": "vCPU", "impact": "HIGH"},
            {"factor": "Memory per task", "unit": "GB", "impact": "HIGH"},
            {"factor": "Number of tasks", "unit": "count", "impact": "HIGH"},
            {"factor": "Running hours per month", "unit": "hours", "impact": "HIGH"},
            {"factor": "Fargate Spot (if used)", "unit": "percentage", "impact": "MEDIUM", "note": "Up to 70% savings"},
        ],
        "free_tier": "None for Fargate, EC2 free tier applies",
        "optimization_tips": [
            "Use Fargate Spot for fault-tolerant workloads",
            "Right-size task definitions",
            "Use Savings Plans for steady-state",
            "Consider ARM/Graviton for Fargate",
        ],
        "calculator_link": "https://calculator.aws/#/addService/Fargate"
    },
    
    "CloudFront": {
        "category": "CDN",
        "pricing_model": "Pay per data transfer + requests",
        "factors": [
            {"factor": "Data transfer out to internet", "unit": "GB", "impact": "HIGH"},
            {"factor": "Data transfer to origin", "unit": "GB", "impact": "MEDIUM"},
            {"factor": "HTTP/HTTPS requests", "unit": "per 10,000", "impact": "MEDIUM"},
            {"factor": "Price class", "unit": "type", "impact": "MEDIUM", "note": "All edges vs subset"},
            {"factor": "Lambda@Edge invocations", "unit": "requests", "impact": "LOW"},
        ],
        "free_tier": "1 TB data transfer, 10M requests (12 months)",
        "optimization_tips": [
            "Use Price Class 100 if serving mainly US/Europe",
            "Enable compression to reduce data transfer",
            "Set appropriate cache TTLs",
        ],
        "calculator_link": "https://calculator.aws/#/addService/CloudFront"
    },
    
    "NAT Gateway": {
        "category": "Networking",
        "pricing_model": "Pay per hour + data processed",
        "factors": [
            {"factor": "Number of NAT Gateways", "unit": "count", "impact": "HIGH"},
            {"factor": "Hours running per month", "unit": "hours", "impact": "HIGH"},
            {"factor": "Data processed", "unit": "GB", "impact": "HIGH"},
        ],
        "free_tier": "None",
        "optimization_tips": [
            "Use VPC Endpoints for AWS service traffic (free for S3, DynamoDB)",
            "Consider NAT Instance for low-traffic scenarios",
            "Review if all traffic really needs NAT Gateway",
        ],
        "calculator_link": "https://calculator.aws/#/addService/VPC"
    },
    
    "VPC Endpoints": {
        "category": "Networking",
        "pricing_model": "Gateway: Free | Interface: hourly + data",
        "factors": [
            {"factor": "Endpoint type", "unit": "type", "impact": "HIGH", "note": "Gateway (free) vs Interface"},
            {"factor": "Interface endpoint hours", "unit": "hours per AZ", "impact": "MEDIUM"},
            {"factor": "Data processed", "unit": "GB", "impact": "MEDIUM"},
        ],
        "free_tier": "Gateway endpoints (S3, DynamoDB) are free",
        "optimization_tips": [
            "Use Gateway endpoints for S3 and DynamoDB (free)",
            "Interface endpoints have cost per AZ - minimize AZ count if possible",
        ],
        "calculator_link": "https://calculator.aws/#/addService/VPC"
    },
    
    "Secrets Manager": {
        "category": "Security",
        "pricing_model": "Pay per secret + API calls",
        "factors": [
            {"factor": "Number of secrets stored", "unit": "secrets", "impact": "HIGH"},
            {"factor": "API calls", "unit": "per 10,000", "impact": "LOW"},
        ],
        "free_tier": "None (but Parameter Store standard is free)",
        "optimization_tips": [
            "Use Parameter Store for non-rotating secrets (free)",
            "Batch secrets when possible",
        ],
        "calculator_link": "https://calculator.aws/#/addService/SecretsManager"
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
        "CloudFront": ["cloudfront", "cdn"],
        "NAT Gateway": ["nat gateway", "nat"],
        "VPC Endpoints": ["vpc endpoint", "privatelink"],
        "Secrets Manager": ["secrets manager"],
    }
    
    text_lower = text.lower()
    detected = []
    for service, keywords in service_keywords.items():
        if any(kw in text_lower for kw in keywords):
            detected.append(service)
    
    return detected if detected else ["Lambda", "API Gateway", "DynamoDB"]

def generate_cost_report(services: list) -> dict:
    """Generate cost considerations report for given services."""
    report = {
        "generated_at": datetime.now().isoformat(),
        "services": services,
        "total_factors": 0,
        "service_details": [],
        "general_tips": [
            "Use AWS Pricing Calculator for actual estimates",
            "Enable Cost Explorer for usage analysis",
            "Set up AWS Budgets for alerts",
            "Tag resources for cost allocation",
            "Review monthly for optimization opportunities",
        ],
        "calculator_link": "https://calculator.aws/#/"
    }
    
    for service in services:
        if service in COST_FACTORS:
            details = COST_FACTORS[service].copy()
            report["service_details"].append({
                "service": service,
                **details
            })
            report["total_factors"] += len(details["factors"])
    
    return report

def main():
    parser = argparse.ArgumentParser(description="Generate Cost Considerations Report")
    parser.add_argument("--services", help="Comma-separated list of AWS services")
    parser.add_argument("--json", action="store_true", help="Output as JSON")
    args = parser.parse_args()
    
    # Get services from args or stdin
    if args.services:
        services = [s.strip() for s in args.services.split(",")]
    elif not sys.stdin.isatty():
        text = sys.stdin.read()
        services = detect_services(text)
    else:
        services = ["Lambda", "API Gateway", "DynamoDB", "S3"]
    
    report = generate_cost_report(services)
    
    if args.json:
        print(json.dumps(report, indent=2))
    else:
        print(f"\n{'='*70}")
        print("COST CONSIDERATIONS REPORT")
        print(f"{'='*70}")
        print(f"Generated: {report['generated_at']}")
        print(f"Services: {', '.join(services)}")
        print(f"Total factors to evaluate: {report['total_factors']}")
        print(f"\n⚠️  This report lists WHAT to consider, not actual costs.")
        print(f"    Use AWS Pricing Calculator: {report['calculator_link']}")
        
        for service_data in report["service_details"]:
            print(f"\n{'='*70}")
            print(f"## {service_data['service']}")
            print(f"   Category: {service_data['category']}")
            print(f"   Pricing Model: {service_data['pricing_model']}")
            if service_data.get('free_tier'):
                print(f"   Free Tier: {service_data['free_tier']}")
            
            print(f"\n   📊 Cost Factors to Evaluate:")
            for factor in service_data['factors']:
                impact_icon = {"HIGH": "🔴", "MEDIUM": "🟡", "LOW": "🟢"}[factor["impact"]]
                note = f" ({factor['note']})" if factor.get('note') else ""
                print(f"      {impact_icon} {factor['factor']} [{factor['unit']}]{note}")
            
            print(f"\n   💡 Optimization Tips:")
            for tip in service_data['optimization_tips']:
                print(f"      • {tip}")
            
            print(f"\n   🔗 Calculator: {service_data['calculator_link']}")
        
        print(f"\n{'='*70}")
        print("GENERAL RECOMMENDATIONS")
        print(f"{'='*70}")
        for tip in report["general_tips"]:
            print(f"  • {tip}")
        
        print(f"\n{'='*70}")
        print("Next Steps:")
        print("  1. Gather actual usage estimates for each factor")
        print("  2. Use AWS Pricing Calculator with your estimates")
        print("  3. Consider Reserved Capacity / Savings Plans for production")
        print("  4. Set up Cost Explorer and Budgets after deployment")
        print(f"{'='*70}\n")

if __name__ == "__main__":
    main()
