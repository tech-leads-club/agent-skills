# Storefront and Ajax API Reference

## Storefront API

Public API for headless/custom storefronts.

**Endpoint:**
```
POST https://{store}.myshopify.com/api/2026-01/graphql.json
```

### Authentication

The Storefront API supports three types of access tokens:

**1. Public Access Token (Client-Side)**
- Limited scope, safe for browser-side code
- Create in Shopify Admin: Apps > Manage private apps > Storefront API
- Exposes only public storefront data (products, collections, cart)
- Cannot access customer data or admin functions

```javascript
{
  'Content-Type': 'application/json',
  'X-Shopify-Storefront-Access-Token': '{public_token}'
}
```

**2. Private Access Token (Server-Side)**
- Broader scope, for server-side implementations
- Must be kept secure, never exposed to client
- Can access additional resources based on app permissions

**3. Delegate Access Tokens**
- Customer-specific tokens for authenticated operations
- Used for customer login, order history, profile management
- Short-lived, scoped to individual customer sessions

### Headers (Public Access)

```javascript
{
  'Content-Type': 'application/json',
  'X-Shopify-Storefront-Access-Token': '{public_token}' // Optional for public stores
}
```

### Query Products

```graphql
query GetProducts($first: Int!) {
  products(first: $first) {
    edges {
      node {
        id
        title
        handle
        description
        priceRange {
          minVariantPrice { amount currencyCode }
          maxVariantPrice { amount currencyCode }
        }
        images(first: 3) {
          edges {
            node {
              url
              altText
            }
          }
        }
        variants(first: 10) {
          edges {
            node {
              id
              title
              price { amount currencyCode }
              availableForSale
              sku
            }
          }
        }
      }
    }
  }
}
```

### Cart Operations

Create cart:
```graphql
mutation CreateCart($input: CartInput!) {
  cartCreate(input: $input) {
    cart {
      id
      checkoutUrl
      lines(first: 10) {
        edges {
          node {
            id
            quantity
            merchandise {
              ... on ProductVariant {
                id
                title
                price { amount }
              }
            }
          }
        }
      }
      cost {
        totalAmount { amount currencyCode }
        subtotalAmount { amount }
        totalTaxAmount { amount }
      }
    }
  }
}
```

Add to cart:
```graphql
mutation AddToCart($cartId: ID!, $lines: [CartLineInput!]!) {
  cartLinesAdd(cartId: $cartId, lines: $lines) {
    cart {
      id
      lines(first: 10) {
        edges {
          node {
            id
            quantity
          }
        }
      }
    }
  }
}
```

## Ajax API (Theme-Only)

JavaScript API for cart operations in themes.

**Get Cart:**
```javascript
fetch('/cart.js')
  .then(response => response.json())
  .then(cart => {
    console.log('Cart:', cart);
    console.log('Item count:', cart.item_count);
    console.log('Total:', cart.total_price);
    console.log('Items:', cart.items);
  });
```

**Add to Cart:**
```javascript
fetch('/cart/add.js', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id: variantId,              // Required: variant ID
    quantity: 1,                 // Optional: default 1
    properties: {                // Optional: custom data
      'Gift wrap': 'Yes',
      'Note': 'Happy Birthday!'
    }
  })
})
  .then(response => response.json())
  .then(item => {
    console.log('Added to cart:', item);
  })
  .catch(error => {
    console.error('Error:', error);
  });
```

**Update Cart:**
```javascript
fetch('/cart/change.js', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    line: 1,          // Line item index (1-based)
    quantity: 2       // New quantity (0 = remove)
  })
})
  .then(response => response.json())
  .then(cart => console.log('Updated cart:', cart));
```

**Clear Cart:**
```javascript
fetch('/cart/clear.js', { method: 'POST' })
  .then(response => response.json())
  .then(cart => console.log('Cart cleared'));
```

**Update Cart Attributes:**
```javascript
fetch('/cart/update.js', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    attributes: {
      'gift_wrap': 'true',
      'gift_message': 'Happy Birthday!'
    },
    note: 'Please handle with care'
  })
})
  .then(response => response.json())
  .then(cart => console.log('Cart updated'));
```

## Customer Account API

Shopify's newer API for customer-facing account operations (replaces legacy customer endpoints):

**Endpoint:**
```
POST https://{store}.myshopify.com/account/customer/api/2026-01/graphql
```

**Key operations:**
- Customer login and registration
- Order history and tracking
- Address management
- Profile updates

**Note:** This API uses a different authentication flow via customer access tokens. See [Shopify docs](https://shopify.dev/docs/api/customer) for implementation details.
