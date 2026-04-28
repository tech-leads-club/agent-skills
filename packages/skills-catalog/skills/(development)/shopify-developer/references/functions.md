# Shopify Functions Reference

Shopify Functions replace Scripts as the way to customise backend logic. They run in a WebAssembly sandbox with strict performance guarantees.

## Overview

| Item | Value |
|------|-------|
| Runtime | WebAssembly (Wasm) |
| Languages | Rust (recommended), JavaScript (via Javy) |
| Execution limit | 11ms instruction count limit |
| Memory limit | 64 KB linear memory |
| Input/Output | JSON (stdin/stdout) |
| API version | 2026-01 |

## Function Types

| Type | Purpose | Replaces |
|------|---------|----------|
| `product_discounts` | Automatic product discounts | Shopify Scripts (line item) |
| `order_discounts` | Order-level discounts | Shopify Scripts (order) |
| `shipping_discounts` | Shipping rate discounts | Shopify Scripts (shipping) |
| `payment_customization` | Hide/reorder payment methods | Shopify Scripts |
| `delivery_customization` | Hide/reorder/rename delivery options | Shopify Scripts |
| `cart_transform` | Merge/expand/update cart lines | New |
| `fulfillment_constraints` | Constrain fulfillment locations | New |
| `order_routing_location_rule` | Custom order routing | New |
| `cart_checkout_validation` | Validate cart at checkout | New |

## Getting Started

### Create a Function

```bash
# Generate a new function extension
shopify app generate extension --template discount_function_rust
# or
shopify app generate extension --template discount_function_javascript

# Structure created:
extensions/my-discount/
├── src/
│   ├── main.rs          # Rust: function logic
│   └── run.graphql      # Input query
├── Cargo.toml           # Rust dependencies
├── shopify.extension.toml
└── schema.graphql       # Generated API schema
```

### Input Query (run.graphql)

Define what data your function receives:

```graphql
query RunInput {
  cart {
    lines {
      quantity
      merchandise {
        ... on ProductVariant {
          id
          product {
            id
            hasAnyTag(tags: ["VIP"])
          }
        }
      }
      cost {
        amountPerQuantity {
          amount
          currencyCode
        }
      }
    }
  }
  discountNode {
    metafield(namespace: "discount", key: "config") {
      value
    }
  }
}
```

### Rust Implementation

```rust
use shopify_function::prelude::*;
use shopify_function::Result;

#[shopify_function_target(rename = "function")]
fn function(input: input::ResponseData) -> Result<output::FunctionRunResult> {
    let config: serde_json::Value = serde_json::from_str(
        input.discount_node.metafield
            .as_ref()
            .map(|m| m.value.as_str())
            .unwrap_or("{}"),
    )?;

    let percentage = config.get("percentage")
        .and_then(|v| v.as_f64())
        .unwrap_or(0.0);

    let targets: Vec<output::Target> = input
        .cart
        .lines
        .iter()
        .filter_map(|line| {
            let variant = match &line.merchandise {
                input::InputCartLinesMerchandise::ProductVariant(v) => v,
                _ => return None,
            };

            if variant.product.has_any_tag {
                Some(output::Target::ProductVariant(
                    output::ProductVariantTarget {
                        id: variant.id.clone(),
                        quantity: None,
                    },
                ))
            } else {
                None
            }
        })
        .collect();

    if targets.is_empty() {
        return Ok(output::FunctionRunResult {
            discounts: vec![],
            discount_application_strategy:
                output::DiscountApplicationStrategy::FIRST,
        });
    }

    Ok(output::FunctionRunResult {
        discounts: vec![output::Discount {
            message: Some(format!("{}% VIP discount", percentage)),
            targets,
            value: output::Value::Percentage(output::Percentage {
                value: percentage.to_string(),
            }),
        }],
        discount_application_strategy:
            output::DiscountApplicationStrategy::FIRST,
    })
}
```

### JavaScript Implementation

```javascript
// src/run.js
export function run(input) {
  const config = JSON.parse(
    input?.discountNode?.metafield?.value ?? "{}"
  );

  const percentage = parseFloat(config.percentage) || 0;

  const targets = input.cart.lines
    .filter((line) => {
      return line.merchandise?.__typename === "ProductVariant"
        && line.merchandise.product.hasAnyTag;
    })
    .map((line) => ({
      productVariant: { id: line.merchandise.id },
    }));

  if (targets.length === 0) {
    return { discounts: [], discountApplicationStrategy: "FIRST" };
  }

  return {
    discounts: [
      {
        message: `${percentage}% VIP discount`,
        targets,
        value: {
          percentage: { value: percentage.toString() },
        },
      },
    ],
    discountApplicationStrategy: "FIRST",
  };
}
```

## Configuration

### shopify.extension.toml

```toml
api_version = "2026-01"

[[extensions]]
name = "VIP Discount"
handle = "vip-discount"
type = "function"

  [extensions.build]
  command = "cargo wasi build --release"
  path = "target/wasm32-wasi/release/vip-discount.wasm"

  # For JavaScript:
  # command = "npx javy compile src/run.js -o dist/function.wasm"
  # path = "dist/function.wasm"

  [extensions.targeting]
  target = "purchase.product-discount.run"

  [extensions.ui]
  handle = "vip-discount-ui"

  [extensions.input.variables]
  namespace = "discount"
  key = "config"
```

## Testing

### Unit tests (Rust)

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_no_discount_without_tag() {
        let input = input::ResponseData {
            cart: input::InputCart {
                lines: vec![/* line without VIP tag */],
            },
            discount_node: input::InputDiscountNode {
                metafield: Some(input::InputDiscountNodeMetafield {
                    value: r#"{"percentage": 10}"#.to_string(),
                }),
            },
        };

        let result = function(input).unwrap();
        assert!(result.discounts.is_empty());
    }
}
```

### Local testing

```bash
# Test with sample input
shopify app function run --path extensions/my-discount

# Build and preview
shopify app dev
```

## Deployment

```bash
# Deploy function with app
shopify app deploy

# Functions are versioned with the app
# Each deploy creates a new function version
```

## Migration from Scripts

| Scripts | Functions |
|---------|-----------|
| Ruby-like DSL | Rust or JavaScript (Wasm) |
| Online Store only | All channels (POS, B2B, headless) |
| Limited to 3 types | 10+ function types |
| No version control | Git-based, CI/CD ready |
| Script Editor app | Shopify CLI |
| Shopify-hosted | Developer-hosted logic |

**Migration steps:**

1. Identify Scripts in use (Settings > Apps > Script Editor)
2. Map each Script to a Function type (see table above)
3. Rewrite logic in Rust or JavaScript
4. Test with `shopify app function run`
5. Deploy and activate via Shopify admin
6. Disable old Scripts

## Performance Guidelines

- Functions must complete within the instruction count limit (~11ms equivalent)
- Minimise allocations - reuse buffers where possible
- Avoid complex string operations in hot paths
- Rust compiles to smaller, faster Wasm than JavaScript
- Use `cargo wasi build --release` for optimised builds
- Profile with `shopify app function run --export-timing`

## Best Practices

1. **Use Rust for production** - smaller binaries, faster execution
2. **Use JavaScript for prototyping** - faster iteration, familiar syntax
3. **Keep input queries minimal** - request only the fields you need
4. **Store configuration in metafields** - avoid hardcoded values
5. **Test edge cases** - empty carts, missing metafields, zero quantities
6. **Version your functions** - use semantic versioning with app deploys
7. **Monitor execution** - check function logs in Partner Dashboard
