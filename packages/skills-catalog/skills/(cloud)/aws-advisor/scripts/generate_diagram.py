#!/usr/bin/env python3
"""
AWS Architecture Diagram Generator

Generates Mermaid diagrams from architecture descriptions.
Usage: python generate_diagram.py --type flowchart --title "My API"
       echo "Lambda API with DynamoDB" | python generate_diagram.py

Outputs Mermaid syntax that can be rendered.
"""

import argparse
import sys
import json
import re

# Architecture patterns with Mermaid templates
PATTERNS = {
    "serverless_api": {
        "keywords": ["lambda", "api gateway", "serverless api", "rest api"],
        "template": """flowchart LR
    subgraph Internet
        Client[Client]
    end
    
    subgraph AWS Cloud
        subgraph API Layer
            APIGW[API Gateway]
        end
        
        subgraph Compute
            Lambda[Lambda Function]
        end
        
        subgraph Data
            {database}
        end
    end
    
    Client --> APIGW
    APIGW --> Lambda
    Lambda --> {database_ref}
    
    style APIGW fill:#FF9900
    style Lambda fill:#FF9900
    style {database_ref} fill:#3B48CC"""
    },
    
    "event_driven": {
        "keywords": ["event", "sqs", "sns", "eventbridge", "async", "queue"],
        "template": """flowchart LR
    subgraph Producers
        Producer1[Producer 1]
        Producer2[Producer 2]
    end
    
    subgraph AWS Cloud
        subgraph Event Bus
            EB[EventBridge]
        end
        
        subgraph Processing
            Rule1[Rule 1]
            Rule2[Rule 2]
            Lambda1[Lambda 1]
            Lambda2[Lambda 2]
        end
        
        subgraph Storage
            {storage}
        end
    end
    
    Producer1 --> EB
    Producer2 --> EB
    EB --> Rule1
    EB --> Rule2
    Rule1 --> Lambda1
    Rule2 --> Lambda2
    Lambda1 --> {storage_ref}
    Lambda2 --> {storage_ref}
    
    style EB fill:#FF4F8B
    style Lambda1 fill:#FF9900
    style Lambda2 fill:#FF9900"""
    },
    
    "microservices": {
        "keywords": ["microservice", "ecs", "fargate", "container", "alb"],
        "template": """flowchart TB
    subgraph Internet
        Client[Client]
    end
    
    subgraph AWS Cloud
        subgraph Load Balancing
            ALB[Application Load Balancer]
        end
        
        subgraph ECS Cluster
            subgraph Service A
                TaskA1[Task A-1]
                TaskA2[Task A-2]
            end
            
            subgraph Service B
                TaskB1[Task B-1]
                TaskB2[Task B-2]
            end
        end
        
        subgraph Data Layer
            RDS[(RDS Database)]
            Cache[(ElastiCache)]
        end
    end
    
    Client --> ALB
    ALB --> TaskA1
    ALB --> TaskA2
    ALB --> TaskB1
    ALB --> TaskB2
    TaskA1 --> RDS
    TaskA2 --> RDS
    TaskB1 --> Cache
    TaskB2 --> Cache
    
    style ALB fill:#FF9900
    style RDS fill:#3B48CC
    style Cache fill:#3B48CC"""
    },
    
    "web_app": {
        "keywords": ["web app", "cloudfront", "s3 website", "static", "spa", "react", "frontend"],
        "template": """flowchart LR
    subgraph Internet
        User[User Browser]
    end
    
    subgraph AWS Cloud
        subgraph CDN
            CF[CloudFront]
        end
        
        subgraph Origin
            S3[S3 Bucket<br/>Static Assets]
        end
        
        subgraph API
            APIGW[API Gateway]
            Lambda[Lambda]
        end
        
        subgraph Data
            {database}
        end
    end
    
    User --> CF
    CF --> S3
    CF --> APIGW
    APIGW --> Lambda
    Lambda --> {database_ref}
    
    style CF fill:#8C4FFF
    style S3 fill:#3F8624
    style APIGW fill:#FF9900
    style Lambda fill:#FF9900"""
    },
    
    "data_pipeline": {
        "keywords": ["data pipeline", "etl", "kinesis", "firehose", "glue", "athena", "data lake"],
        "template": """flowchart LR
    subgraph Sources
        Source1[Data Source 1]
        Source2[Data Source 2]
    end
    
    subgraph AWS Cloud
        subgraph Ingestion
            Kinesis[Kinesis Data Streams]
            Firehose[Kinesis Firehose]
        end
        
        subgraph Storage
            S3Raw[S3 Raw Zone]
            S3Processed[S3 Processed Zone]
        end
        
        subgraph Processing
            Glue[Glue ETL Job]
        end
        
        subgraph Analytics
            Athena[Athena]
            QuickSight[QuickSight]
        end
    end
    
    Source1 --> Kinesis
    Source2 --> Kinesis
    Kinesis --> Firehose
    Firehose --> S3Raw
    S3Raw --> Glue
    Glue --> S3Processed
    S3Processed --> Athena
    Athena --> QuickSight
    
    style Kinesis fill:#FF4F8B
    style S3Raw fill:#3F8624
    style S3Processed fill:#3F8624
    style Glue fill:#FF9900"""
    },
    
    "multi_region": {
        "keywords": ["multi-region", "global", "disaster recovery", "dr", "failover"],
        "template": """flowchart TB
    subgraph Global
        R53[Route 53<br/>Failover Routing]
    end
    
    subgraph us-east-1[Primary - us-east-1]
        ALB1[ALB]
        App1[Application]
        DB1[(Primary DB)]
    end
    
    subgraph us-west-2[Secondary - us-west-2]
        ALB2[ALB]
        App2[Application]
        DB2[(Replica DB)]
    end
    
    R53 --> ALB1
    R53 -.-> ALB2
    ALB1 --> App1
    ALB2 --> App2
    App1 --> DB1
    App2 --> DB2
    DB1 -->|Replication| DB2
    
    style R53 fill:#8C4FFF
    style DB1 fill:#3B48CC
    style DB2 fill:#3B48CC"""
    },
}

DATABASE_COMPONENTS = {
    "dynamodb": ("DDB[(DynamoDB)]", "DDB"),
    "rds": ("RDS[(RDS Database)]", "RDS"),
    "aurora": ("Aurora[(Aurora)]", "Aurora"),
    "s3": ("S3[S3 Bucket]", "S3"),
    "elasticache": ("Cache[(ElastiCache)]", "Cache"),
    "documentdb": ("DocDB[(DocumentDB)]", "DocDB"),
}

def detect_pattern(text: str) -> str:
    """Detect which architecture pattern matches the text."""
    text_lower = text.lower()
    
    for pattern_name, pattern_data in PATTERNS.items():
        if any(kw in text_lower for kw in pattern_data["keywords"]):
            return pattern_name
    
    return "serverless_api"  # Default

def detect_database(text: str) -> tuple:
    """Detect database type from text."""
    text_lower = text.lower()
    
    for db_name, (component, ref) in DATABASE_COMPONENTS.items():
        if db_name in text_lower:
            return component, ref
    
    return "DDB[(DynamoDB)]", "DDB"  # Default

def generate_diagram(text: str, diagram_type: str = None, title: str = None) -> str:
    """Generate Mermaid diagram from architecture description."""
    
    # Detect pattern if not specified
    if diagram_type is None:
        diagram_type = detect_pattern(text)
    
    if diagram_type not in PATTERNS:
        diagram_type = "serverless_api"
    
    template = PATTERNS[diagram_type]["template"]
    
    # Detect and replace database component
    db_component, db_ref = detect_database(text)
    template = template.replace("{database}", db_component)
    template = template.replace("{database_ref}", db_ref)
    
    # Replace storage placeholder
    if "s3" in text.lower():
        template = template.replace("{storage}", "S3[S3 Bucket]")
        template = template.replace("{storage_ref}", "S3")
    else:
        template = template.replace("{storage}", "DDB[(DynamoDB)]")
        template = template.replace("{storage_ref}", "DDB")
    
    # Add title if provided
    if title:
        template = f"---\ntitle: {title}\n---\n{template}"
    
    return template

def generate_custom(components: list, connections: list, title: str = None) -> str:
    """Generate custom diagram from components and connections."""
    
    lines = ["flowchart TB"]
    
    if title:
        lines.insert(0, f"---\ntitle: {title}\n---")
    
    # Add components
    lines.append("    %% Components")
    for comp in components:
        lines.append(f"    {comp}")
    
    # Add connections
    lines.append("    %% Connections")
    for conn in connections:
        lines.append(f"    {conn}")
    
    return "\n".join(lines)

def main():
    parser = argparse.ArgumentParser(description="Generate AWS Architecture Diagrams")
    parser.add_argument("--type", choices=list(PATTERNS.keys()), help="Diagram pattern type")
    parser.add_argument("--title", help="Diagram title")
    parser.add_argument("--list-patterns", action="store_true", help="List available patterns")
    parser.add_argument("--json", action="store_true", help="Output as JSON with metadata")
    args = parser.parse_args()
    
    if args.list_patterns:
        print("\nAvailable Patterns:\n")
        for name, data in PATTERNS.items():
            print(f"  {name}")
            print(f"    Keywords: {', '.join(data['keywords'])}")
            print()
        return
    
    # Get description from stdin
    if not sys.stdin.isatty():
        text = sys.stdin.read().strip()
    else:
        text = "serverless api with lambda and dynamodb"
    
    diagram = generate_diagram(text, args.type, args.title)
    
    if args.json:
        output = {
            "input": text,
            "pattern": args.type or detect_pattern(text),
            "title": args.title,
            "mermaid": diagram
        }
        print(json.dumps(output, indent=2))
    else:
        print("\n```mermaid")
        print(diagram)
        print("```\n")
        print("Copy the mermaid code above to visualize the diagram.")
        print("Or use the Mermaid Chart MCP: validate_and_render_mermaid_diagram")

if __name__ == "__main__":
    main()
