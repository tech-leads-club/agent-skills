# MCP Usage Guide

Efficient patterns for AWS MCP tools to minimize tokens and maximize accuracy.

## aws\_\_\_search_documentation

### Query Optimization

**Good queries** (specific, 2-5 words):

```
"Lambda cold start optimization"
"S3 bucket policy examples"
"DynamoDB single table design"
"ECS Fargate networking"
```

**Bad queries** (too vague or verbose):

```
"How do I make my Lambda faster" → Too conversational
"AWS" → Too broad
"I need to understand how to configure..." → Too verbose
```

### Topic Selection Matrix

| User Says             | Topic                     | Query Example                  |
| --------------------- | ------------------------- | ------------------------------ |
| "How do I use SDK..." | `reference_documentation` | "S3 PutObject SDK v3"          |
| "What's new in..."    | `current_awareness`       | "Lambda 2024 features"         |
| "Getting error..."    | `troubleshooting`         | "AccessDenied S3 GetObject"    |
| "CDK how to..."       | `cdk_docs`                | "CDK Lambda Python"            |
| "CDK example..."      | `cdk_constructs`          | "API Gateway Lambda CDK"       |
| "CloudFormation..."   | `cloudformation`          | "DynamoDB table template"      |
| "Best practice..."    | `general`                 | "serverless security patterns" |

### Multi-Topic Searches

Use multiple topics (max 3) when query spans areas:

```python
# User: "How do I fix this Lambda timeout and what's the best practice?"
topics=["troubleshooting", "general"]
query="Lambda timeout"

# User: "Show me CDK examples and explain the concepts"
topics=["cdk_constructs", "cdk_docs"]
query="Lambda function CDK"
```

## aws\_\_\_read_documentation

### When to Use

- Search returned snippet isn't enough
- Need complete code examples
- Need to understand full context

### Pagination for Long Docs

```python
# First call
aws___read_documentation(url="...", max_length=5000)

# If truncated, continue
aws___read_documentation(url="...", start_index=5000, max_length=5000)
```

**Stop early** if you found the answer - don't read entire doc.

## aws\_\_\_get_regional_availability

### Query Patterns

**Check service availability**:

```python
resource_type="product"
filters=["Amazon Aurora Serverless v2", "AWS AppSync"]
region="sa-east-1"
```

**Check API availability**:

```python
resource_type="api"
filters=["Lambda+CreateFunction", "S3+PutObject"]
region="eu-west-1"
```

**Check CloudFormation support**:

```python
resource_type="cfn"
filters=["AWS::Lambda::Function", "AWS::DynamoDB::GlobalTable"]
region="ap-southeast-1"
```

### Common Use Cases

1. **Before recommending a service**: Verify it's available in user's region
2. **Multi-region architectures**: Check consistency across regions
3. **New features**: Verify regional rollout status

## aws\_\_\_recommend

### When to Use

- After reading a doc, find related content
- Discover "New" features for a service
- Find commonly-viewed-next pages

```python
# Find new Lambda features
aws___recommend(url="https://docs.aws.amazon.com/lambda/latest/dg/welcome.html")
# Check "New" category in results
```

## AWS Marketplace MCPs

### ask_aws_marketplace

Use for third-party solution discovery:

```python
# Good queries
"monitoring tools for Kubernetes"
"log management SOC2 compliant"
"compare Datadog vs New Relic"

# Bad queries
"AWS Lambda" → Use Knowledge MCP instead
"How do I..." → Not for how-to questions
```

### Polling Pattern

```python
# Initial call
response = ask_aws_marketplace(query="...")

# Poll until complete
while response.next_cursor:
    response = ask_aws_marketplace(
        last_request_id=response.request_id,
        cursor=response.next_cursor
    )
    # Display each message immediately to user!

# Then get structured report
report = get_aws_marketplace_recommendations_report(last_request_id=response.request_id)
```

## Token Optimization Tips

1. **Search before read**: Search results often have enough context
2. **Specific queries**: Fewer results = less to process
3. **Right topic**: Avoid general when specific topic exists
4. **Stop early**: Don't paginate if answer found
5. **Cache mentally**: Don't re-search same thing in conversation
