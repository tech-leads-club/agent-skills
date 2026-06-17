# Debugging and Troubleshooting Reference

Expert guidance for debugging Shopify themes, apps, and API integrations with practical solutions to common issues.

## Core Capabilities

### 1. Liquid Debugging

Debug Liquid template errors and rendering issues.

**Enable Theme Preview:**
```
1. Go to Online Store > Themes
2. Click "Customise" on your theme
3. Open browser DevTools (F12)
4. Check Console for Liquid errors
```

**Common Liquid Errors:**

**Syntax Error:**
```liquid
{# ❌ Error: Missing endif #}
{% if product.available %}
  <button>Add to Cart</button>
{# Missing {% endif %} #}

{# ✅ Fixed #}
{% if product.available %}
  <button>Add to Cart</button>
{% endif %}
```

**Undefined Variable:**
```liquid
{# ❌ Error: product undefined on collection page #}
{{ product.title }}

{# ✅ Fixed: Check context #}
{% if product %}
  {{ product.title }}
{% else %}
  {# Not on product page #}
{% endif %}
```

**Invalid Filter:**
```liquid
{# ❌ Error: Unknown filter #}
{{ product.price | format_money }}

{# ✅ Fixed: Correct filter name #}
{{ product.price | money }}
```

**Debug Output:**
```liquid
{# Output variable as JSON #}
{{ product | json }}

{# Check variable type #}
{{ product.class }}

{# Check if variable exists #}
{% if product %}
  Product exists
{% else %}
  Product is nil
{% endif %}

{# Output all properties #}
<pre>{{ product | json }}</pre>
```

**Console Logging from Liquid:**
```liquid
<script>
  console.log('Product ID:', {{ product.id }});
  console.log('Product data:', {{ product | json }});
  console.log('Cart:', {{ cart | json }});
</script>
```

### 2. JavaScript Debugging

Debug JavaScript errors in themes and apps.

**Browser Console:**
```javascript
// Log to console
console.log('Debug:', variable);
console.error('Error:', error);
console.warn('Warning:', warning);

// Log object properties
console.table(data);

// Group related logs
console.group('Cart Operations');
console.log('Cart ID:', cartId);
console.log('Items:', items);
console.groupEnd();

// Time operations
console.time('API Call');
await fetch('/api/data');
console.timeEnd('API Call');

// Stack trace
console.trace('Execution path');
```

**Breakpoints:**
```javascript
// Programmatic breakpoint
debugger;

// Set in browser DevTools:
// Sources tab > Click line number
```

**Error Handling:**
```javascript
// ❌ Unhandled error
const data = await fetch('/api/data').then(r => r.json());

// ✅ Proper error handling
try {
  const response = await fetch('/api/data');

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  console.log('Data:', data);
} catch (error) {
  console.error('Failed to fetch data:', error);
  // Show user-friendly error message
  alert('Failed to load data. Please try again.');
}
```

**Network Debugging:**
```
1. Open DevTools > Network tab
2. Filter by XHR or Fetch
3. Click request to see:
   - Request headers
   - Request payload
   - Response headers
   - Response body
   - Timing information
```

### 3. API Error Debugging

Debug GraphQL and REST API errors.

**GraphQL Errors:**

Error response format:
```json
{
  "errors": [
    {
      "message": "Field 'invalidField' doesn't exist on type 'Product'",
      "locations": [{ "line": 3, "column": 5 }],
      "path": ["product", "invalidField"],
      "extensions": {
        "code": "FIELD_NOT_FOUND",
        "typeName": "Product"
      }
    }
  ],
  "data": null
}
```

**Check for errors BEFORE accessing data:**
```javascript
const response = await fetch(graphqlEndpoint, {
  method: 'POST',
  headers: {
    'X-Shopify-Access-Token': accessToken,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ query, variables }),
});

const { data, errors } = await response.json();

// ✅ Always check errors first
if (errors) {
  console.error('GraphQL Errors:');
  errors.forEach(error => {
    console.error('Message:', error.message);
    console.error('Location:', error.locations);
    console.error('Path:', error.path);
    console.error('Code:', error.extensions?.code);
  });
  throw new Error(errors[0].message);
}

// Now safe to use data
console.log('Products:', data.products);
```

**Common GraphQL Errors:**

**Authentication Error:**
```json
{
  "errors": [{
    "message": "Access denied",
    "extensions": { "code": "UNAUTHENTICATED" }
  }]
}
```

**Fix:** Check access token:
```javascript
// Verify token is valid
const token = 'shpat_...';

// Check token format (should start with shpat_)
if (!token.startsWith('shpat_')) {
  console.error('Invalid token format');
}

// Verify in headers
headers: {
  'X-Shopify-Access-Token': token,  // ✅ Correct header
  'Authorization': `Bearer ${token}`, // ❌ Wrong for Admin API
}
```

**Field Not Found:**
```json
{
  "errors": [{
    "message": "Field 'invalidField' doesn't exist on type 'Product'"
  }]
}
```

**Fix:** Check field name in API docs:
```graphql
# ❌ Wrong field name
query {
  product(id: "gid://shopify/Product/123") {
    invalidField
  }
}

# ✅ Correct field name
query {
  product(id: "gid://shopify/Product/123") {
    title
    handle
    status
  }
}
```

**Rate Limit Error:**
```javascript
// Check rate limit header
const response = await fetch(graphqlEndpoint, options);

const rateLimit = response.headers.get('X-Shopify-GraphQL-Admin-Api-Call-Limit');
console.log('Rate limit:', rateLimit); // "42/50"

if (response.status === 429) {
  const retryAfter = response.headers.get('Retry-After');
  console.log(`Rate limited. Retry after ${retryAfter} seconds`);
}
```

**REST API Errors:**

**404 Not Found:**
```javascript
const response = await fetch(`https://${shop}/admin/api/2026-01/products/999999.json`, {
  headers: { 'X-Shopify-Access-Token': token },
});

if (response.status === 404) {
  console.error('Product not found');
  // Check:
  // 1. Product ID is correct
  // 2. Product exists in store
  // 3. Using correct endpoint
}
```

**422 Unprocessable Entity:**
```json
{
  "errors": {
    "title": ["can't be blank"],
    "price": ["must be greater than 0"]
  }
}
```

**Fix:** Validate input:
```javascript
const response = await fetch(endpoint, {
  method: 'POST',
  headers: {
    'X-Shopify-Access-Token': token,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    product: {
      title: '',  // ❌ Empty title
      price: -10, // ❌ Negative price
    },
  }),
});

if (response.status === 422) {
  const { errors } = await response.json();
  console.error('Validation errors:', errors);

  // Fix data
  const validProduct = {
    title: 'Product Name',  // ✅ Valid title
    price: 19.99,           // ✅ Valid price
  };
}
```

### 4. Cart Debugging

Debug cart and Ajax API issues.

**Cart Not Updating:**
```javascript
// ❌ Common mistake: Wrong variant ID
fetch('/cart/add.js', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id: '123',  // ❌ Wrong: using product ID instead of variant ID
    quantity: 1,
  }),
});

// ✅ Fixed: Use variant ID
fetch('/cart/add.js', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id: 123456789,  // ✅ Variant ID (numeric)
    quantity: 1,
  }),
})
  .then(response => {
    if (!response.ok) {
      return response.json().then(err => {
        console.error('Cart error:', err);
        throw err;
      });
    }
    return response.json();
  })
  .then(item => {
    console.log('Added to cart:', item);
    // Update cart UI
  })
  .catch(error => {
    console.error('Failed to add to cart:', error);
  });
```

**Get Current Cart:**
```javascript
// Debug current cart state
fetch('/cart.js')
  .then(r => r.json())
  .then(cart => {
    console.log('Cart:', cart);
    console.log('Item count:', cart.item_count);
    console.log('Total:', cart.total_price);
    console.log('Items:', cart.items);

    cart.items.forEach(item => {
      console.log('Item:', item.product_id, item.variant_id, item.quantity);
    });
  });
```

**Cart AJAX Errors:**
```javascript
// Common error: Insufficient inventory
{
  "status": 422,
  "message": "You can only add 5 of this item to your cart",
  "description": "Cannot add more than 5 to cart"
}

// Fix: Check inventory before adding
const variant = product.variants.find(v => v.id === variantId);

if (variant.inventory_quantity < quantity) {
  alert(`Only ${variant.inventory_quantity} available`);
} else {
  // Add to cart
}
```

### 5. Theme Preview Debugging

Debug issues in the theme customiser.

**Theme Editor Console:**
```
1. Open theme customiser
2. Open DevTools (F12)
3. Check Console for errors
4. Look for:
   - Liquid errors (red text)
   - JavaScript errors
   - Network failures
```

**Section Not Rendering:**
```liquid
{# Check section schema #}
{% schema %}
{
  "name": "My Section",
  "settings": [...]  {# ✅ Must have settings #}
}
{% endschema %}

{# ❌ Missing schema = won't show in customiser #}
```

**Settings Not Updating:**
```liquid
{# ❌ Wrong: Using hardcoded value #}
<h1>Hardcoded Title</h1>

{# ✅ Fixed: Use setting #}
<h1>{{ section.settings.title }}</h1>

{% schema %}
{
  "name": "Hero",
  "settings": [
    {
      "type": "text",
      "id": "title",
      "label": "Title",
      "default": "Welcome"
    }
  ]
}
{% endschema %}
```

**Block Attributes Missing:**
```liquid
{# ❌ Missing shopify_attributes #}
<div class="block">
  {{ block.settings.text }}
</div>

{# ✅ Fixed: Add shopify_attributes for theme editor #}
<div class="block" {{ block.shopify_attributes }}>
  {{ block.settings.text }}
</div>
```

### 6. Webhook Debugging

Debug webhook delivery and processing.

**Webhook Not Received:**

Check in Shopify Admin:
```
1. Settings > Notifications > Webhooks
2. Click webhook
3. Check "Recent deliveries"
4. Look for delivery status:
   - ✅ Success (200 OK)
   - ❌ Failed (4xx/5xx errors)
```

**Verify Webhook HMAC:**
```javascript
import crypto from 'crypto';

function verifyWebhook(body, hmac, secret) {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(body, 'utf8')
    .digest('base64');

  return hash === hmac;
}

// Express example
app.post('/webhooks/orders', (req, res) => {
  const hmac = req.headers['x-shopify-hmac-sha256'];
  const body = JSON.stringify(req.body);

  if (!verifyWebhook(body, hmac, process.env.SHOPIFY_WEBHOOK_SECRET)) {
    console.error('Invalid webhook HMAC');
    return res.status(401).send('Unauthorised');
  }

  console.log('Webhook verified');

  // Process webhook
  const order = req.body;
  console.log('Order:', order.id, order.email);

  // Respond quickly (< 5 seconds)
  res.status(200).send('OK');
});
```

**Webhook Timeout:**
```javascript
// ❌ Processing takes too long (> 5 seconds)
app.post('/webhooks/orders', async (req, res) => {
  await processOrder(req.body);  // Slow operation
  res.send('OK');  // Response delayed
});

// ✅ Respond immediately, process async
app.post('/webhooks/orders', async (req, res) => {
  const order = req.body;

  // Respond quickly
  res.status(200).send('OK');

  // Process in background
  processOrder(order).catch(console.error);
});
```

### 7. Common Error Messages

**Liquid Errors:**

```
Error: Liquid syntax error: Unknown tag 'section'
Fix: Use {% section %} only in JSON templates, not .liquid files
```

```
Error: undefined method 'title' for nil:NilClass
Fix: Variable is nil. Add {% if %} check or provide default:
{{ product.title | default: "No title" }}
```

```
Error: Exceeded maximum number of allowed iterations
Fix: Infinite loop detected. Check loop conditions.
```

**JavaScript Errors:**

```
TypeError: Cannot read property 'forEach' of undefined
Fix: Array is undefined. Check:
if (items && Array.isArray(items)) {
  items.forEach(item => { ... });
}
```

```
ReferenceError: $ is not defined
Fix: jQuery not loaded or script runs before jQuery loads
```

```
SyntaxError: Unexpected token <
Fix: API returned HTML error page instead of JSON. Check API endpoint.
```

**API Errors:**

```
Access denied - check your access scopes
Fix: App needs additional permissions. Update scopes in Partner Dashboard.
```

```
Throttled: Exceeded API rate limit
Fix: Implement rate limit handling with exponential backoff.
```

```
Field doesn't exist on type
Fix: Check API version and field availability in docs.
```

## Debugging Toolkit

**Browser DevTools:**
```
- Console: View errors and logs
- Network: Inspect API requests
- Sources: Set breakpoints
- Application: View cookies, localStorage
- Performance: Profile page load
```

**Shopify Tools:**
```
- Theme Preview: Test changes before publishing
- Theme Inspector: View section data
- API Explorer: Test GraphQL queries
- Webhook Logs: Check delivery status
```

**Useful Console Commands:**
```javascript
// Get all form data
new FormData(document.querySelector('form'))

// View all cookies
document.cookie

// Check localStorage
localStorage

// View all global variables
console.log(window)

// Get computed styles
getComputedStyle(element)
```

## Best Practices

1. **Always check for errors** before accessing data (API responses)
2. **Use try-catch blocks** for all async operations
3. **Log meaningful messages** with context
4. **Verify HMAC** for all webhooks
5. **Test in theme preview** before publishing
6. **Monitor API rate limits** and implement backoff
7. **Handle edge cases** (nil values, empty arrays)
8. **Use browser DevTools** for network debugging
9. **Check API version** compatibility
10. **Validate input** before API calls
