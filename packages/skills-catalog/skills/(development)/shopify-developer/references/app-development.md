# App Development Reference

Expert guidance for building custom Shopify apps using Shopify CLI, modern frameworks, and best practices.

## Core Capabilities

### 1. Shopify CLI Setup

Install and configure Shopify CLI for app development.

**Install Shopify CLI:**

```bash
# Using npm
npm install -g @shopify/cli @shopify/app

# Using Homebrew (macOS)
brew tap shopify/shopify
brew install shopify-cli

# Verify installation
shopify version
```

**Create New App:**

```bash
# Create app with Node.js/React
shopify app init

# Choose template:
# - React Router 7 (recommended)
# - Node.js + React
# - PHP
# - Ruby

# App structure created:
my-app/
├── app/                    # React Router app routes
├── extensions/             # App extensions
├── shopify.app.toml       # App configuration
├── package.json
└── README.md
```

**Note:** As of Hydrogen 2025.5.0+, Shopify templates default to React Router 7 instead of Remix.

**App Configuration (shopify.app.toml):**

```toml
# This file stores app configuration

name = "my-app"
client_id = "your-client-id"
application_url = "https://your-app.com"
embedded = true

[access_scopes]
# API access scopes
scopes = "write_products,read_orders,read_customers"

[auth]
redirect_urls = [
  "https://your-app.com/auth/callback",
  "https://your-app.com/auth/shopify/callback"
]

[webhooks]
api_version = "2026-01"

[[webhooks.subscriptions]]
topics = ["products/create", "products/update"]
uri = "/webhooks"
```

### 2. Development Workflow

**Start Development Server:**

```bash
# Start dev server with tunnelling
shopify app dev

# Server starts with:
# - Local development URL: http://localhost:3000
# - Public tunnel URL: https://random-subdomain.ngrok.io
# - App installed in development store
```

**Deploy App:**

```bash
# Deploy to production
shopify app deploy

# Generate app version and deploy extensions
```

**Environment Variables (.env):**

```bash
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
SCOPES=write_products,read_orders
HOST=your-app-domain.com
SHOPIFY_APP_URL=https://your-app.com
DATABASE_URL=postgresql://...
```

### 3. App Architecture (React Router 7)

Modern Shopify app using React Router 7 framework.

**app/routes/app._index.jsx (Home Page):**

```javascript
import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import {
  Page,
  Layout,
  Card,
  DataTable,
  Button,
} from "@shopify/polaris";

export async function loader({ request }) {
  const { admin, session } = await authenticate.admin(request);

  // Fetch products using GraphQL
  const response = await admin.graphql(`
    query {
      products(first: 10) {
        edges {
          node {
            id
            title
            handle
            status
          }
        }
      }
    }
  `);

  const { data } = await response.json();

  return {
    products: data.products.edges.map(e => e.node),
    shop: session.shop,
  };
}

export default function Index() {
  const { products, shop } = useLoaderData();

  const rows = products.map((product) => [
    product.title,
    product.handle,
    product.status,
  ]);

  return (
    <Page title="Products">
      <Layout>
        <Layout.Section>
          <Card>
            <DataTable
              columnContentTypes={["text", "text", "text"]}
              headings={["Title", "Handle", "Status"]}
              rows={rows}
            />
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
```

**app/routes/app.product.$id.jsx (Product Detail):**

```javascript
import { data } from "react-router";
import { useLoaderData, useSubmit } from "react-router";
import { authenticate } from "../shopify.server";
import {
  Page,
  Layout,
  Card,
  Form,
  FormLayout,
  TextField,
  Button,
} from "@shopify/polaris";
import { useState } from "react";

export async function loader({ request, params }) {
  const { admin } = await authenticate.admin(request);

  const response = await admin.graphql(`
    query GetProduct($id: ID!) {
      product(id: $id) {
        id
        title
        description
        status
        vendor
      }
    }
  `, {
    variables: { id: `gid://shopify/Product/${params.id}` },
  });

  const { data: responseData } = await response.json();

  return data({ product: responseData.product });
}

export async function action({ request, params }) {
  const { admin } = await authenticate.admin(request);

  const formData = await request.formData();
  const title = formData.get("title");
  const description = formData.get("description");

  const response = await admin.graphql(`
    mutation UpdateProduct($input: ProductInput!) {
      productUpdate(input: $input) {
        product {
          id
          title
        }
        userErrors {
          field
          message
        }
      }
    }
  `, {
    variables: {
      input: {
        id: `gid://shopify/Product/${params.id}`,
        title,
        description,
      },
    },
  });

  const { data: responseData } = await response.json();

  if (responseData.productUpdate.userErrors.length > 0) {
    return data({ errors: responseData.productUpdate.userErrors }, { status: 400 });
  }

  return data({ success: true });
}

export default function ProductDetail() {
  const { product } = useLoaderData();
  const submit = useSubmit();

  const [title, setTitle] = useState(product.title);
  const [description, setDescription] = useState(product.description);

  const handleSubmit = () => {
    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);

    submit(formData, { method: "post" });
  };

  return (
    <Page title="Edit Product" backAction={{ url: "/app" }}>
      <Layout>
        <Layout.Section>
          <Card>
            <FormLayout>
              <TextField
                label="Title"
                value={title}
                onChange={setTitle}
                autoComplete="off"
              />
              <TextField
                label="Description"
                value={description}
                onChange={setDescription}
                multiline={4}
                autoComplete="off"
              />
              <Button primary onClick={handleSubmit}>
                Save
              </Button>
            </FormLayout>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
```

### 4. App Extensions

Extend Shopify functionality with various extension types.

**Admin Action Extension:**

Create button in admin product page:

```bash
shopify app generate extension

# Choose: Admin action
# Name: Export Product
```

**extensions/export-product/src/index.jsx:**

```javascript
import { extend, AdminAction } from "@shopify/admin-ui-extensions";

extend("Admin::Product::SubscriptionAction", (root, { data }) => {
  const { id, title } = data.selected[0];

  const button = root.createComponent(AdminAction, {
    title: "Export Product",
    onPress: async () => {
      // Call your app API
      const response = await fetch("/api/export", {
        method: "POST",
        body: JSON.stringify({ productId: id }),
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        root.toast.show("Product exported successfully!");
      } else {
        root.toast.show("Export failed", { isError: true });
      }
    },
  });

  root.append(button);
});
```

**Theme App Extension:**

Add app block to themes:

```bash
shopify app generate extension

# Choose: Theme app extension
# Name: Product Reviews
```

**extensions/product-reviews/blocks/reviews.liquid:**

```liquid
{% schema %}
{
  "name": "Product Reviews",
  "target": "section",
  "settings": [
    {
      "type": "text",
      "id": "heading",
      "label": "Heading",
      "default": "Customer Reviews"
    },
    {
      "type": "range",
      "id": "reviews_to_show",
      "label": "Reviews to Show",
      "min": 1,
      "max": 10,
      "default": 5
    }
  ]
}
{% endschema %}

<div class="product-reviews">
  <h2>{{ block.settings.heading }}</h2>

  {% comment %}
    Fetch reviews from your app API
  {% endcomment %}

  <div id="reviews-container" data-product-id="{{ product.id }}"></div>
</div>

<script>
  // Fetch and render reviews
  // Note: In production, sanitise HTML to prevent XSS vulnerabilities
  fetch(`/apps/reviews/api/reviews?product_id={{ product.id }}&limit={{ block.settings.reviews_to_show }}`)
    .then(r => r.json())
    .then(reviews => {
      const container = document.getElementById('reviews-container');
      container.innerHTML = reviews.map(review => `
        <div class="review">
          <div class="rating">${'⭐'.repeat(review.rating)}</div>
          <h3>${review.title}</h3>
          <p>${review.content}</p>
          <p class="author">- ${review.author}</p>
        </div>
      `).join('');
    });
</script>

{% stylesheet %}
  .product-reviews {
    padding: 2rem;
  }

  .review {
    margin-bottom: 1.5rem;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid #eee;
  }

  .rating {
    color: #ffa500;
    margin-bottom: 0.5rem;
  }
{% endstylesheet %}
```

### 5. Webhooks in Apps

Handle Shopify events in your app.

**app/routes/webhooks.jsx:**

```javascript
import { authenticate } from "../shopify.server";
import db from "../db.server";

export async function action({ request }) {
  const { topic, shop, session, admin, payload } = await authenticate.webhook(request);

  console.log(`Webhook received: ${topic} from ${shop}`);

  switch (topic) {
    case "APP_UNINSTALLED":
      // Clean up app data
      await db.session.deleteMany({ where: { shop } });
      break;

    case "PRODUCTS_CREATE":
      // Handle new product
      console.log("New product created:", payload.id, payload.title);
      await handleProductCreated(payload);
      break;

    case "PRODUCTS_UPDATE":
      // Handle product update
      console.log("Product updated:", payload.id);
      await handleProductUpdated(payload);
      break;

    case "ORDERS_CREATE":
      // Handle new order
      console.log("New order:", payload.id, payload.email);
      await handleOrderCreated(payload);
      break;

    case "CUSTOMERS_CREATE":
      // Handle new customer
      await handleCustomerCreated(payload);
      break;

    default:
      console.log("Unhandled webhook topic:", topic);
  }

  return new Response("OK", { status: 200 });
}

async function handleProductCreated(product) {
  // Process new product
  await db.product.create({
    data: {
      shopifyId: product.id,
      title: product.title,
      handle: product.handle,
    },
  });
}

async function handleOrderCreated(order) {
  // Send email notification, update inventory, etc.
  console.log(`Order ${order.id} received for ${order.email}`);
}
```

**Register Webhooks (app/shopify.server.js):**

```javascript
import "@shopify/shopify-app-remix/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  shopifyApp,
  DeliveryMethod,
} from "@shopify/shopify-app-remix/server";

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET,
  scopes: process.env.SCOPES?.split(","),
  appUrl: process.env.SHOPIFY_APP_URL,
  authPathPrefix: "/auth",
  sessionStorage: new SQLiteSessionStorage(),
  distribution: AppDistribution.AppStore,
  apiVersion: ApiVersion.January26,

  webhooks: {
    APP_UNINSTALLED: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/webhooks",
    },
    PRODUCTS_CREATE: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/webhooks",
    },
    PRODUCTS_UPDATE: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/webhooks",
    },
    ORDERS_CREATE: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/webhooks",
    },
  },
});

export default shopify;
export const authenticate = shopify.authenticate;
```

### 6. App Proxy

Create custom storefront routes that access your app.

**Setup in Partner Dashboard:**

```
Subpath prefix: apps
Subpath: reviews
Proxy URL: https://your-app.com/api/proxy
```

**Result:**

```
https://store.com/apps/reviews → proxies to → https://your-app.com/api/proxy
```

**Handle Proxy Requests (app/routes/api.proxy.jsx):**

```javascript
import { data } from "react-router";

export async function loader({ request }) {
  const url = new URL(request.url);

  // Verify proxy request
  const signature = url.searchParams.get("signature");
  const shop = url.searchParams.get("shop");

  if (!verifyProxySignature(signature, request)) {
    return data({ error: "Invalid signature" }, { status: 401 });
  }

  // Handle different paths
  const path = url.searchParams.get("path_prefix");

  if (path === "/apps/reviews/product") {
    const productId = url.searchParams.get("product_id");
    const reviews = await getProductReviews(productId);

    return data({ reviews });
  }

  return data({ message: "App Proxy" });
}

function verifyProxySignature(signature, request) {
  // Verify HMAC signature
  // Implementation depends on your setup
  return true;
}
```

### 7. Polaris UI Components

Use Shopify's design system for consistent admin UI.

**Common Components:**

```javascript
import {
  Page,
  Layout,
  Card,
  Button,
  TextField,
  Select,
  Checkbox,
  Badge,
  Banner,
  DataTable,
  Modal,
  Toast,
  Frame,
} from "@shopify/polaris";

export default function MyPage() {
  return (
    <Page
      title="Settings"
      primaryAction={{ content: "Save", onAction: handleSave }}
      secondaryActions={[{ content: "Cancel", onAction: handleCancel }]}
    >
      <Layout>
        <Layout.Section>
          <Card title="General Settings" sectioned>
            <TextField
              label="App Name"
              value={name}
              onChange={setName}
            />

            <Select
              label="Status"
              options={[
                { label: "Active", value: "active" },
                { label: "Draft", value: "draft" },
              ]}
              value={status}
              onChange={setStatus}
            />

            <Checkbox
              label="Enable notifications"
              checked={notifications}
              onChange={setNotifications}
            />
          </Card>
        </Layout.Section>

        <Layout.Section secondary>
          <Card title="Status" sectioned>
            <Badge status="success">Active</Badge>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
```

### Polaris Web Components (Preview)

Shopify is migrating from Polaris React to framework-agnostic Web Components:

```html
<!-- Web Component syntax (replacing React components) -->
<ui-page title="Settings">
  <ui-layout>
    <ui-layout-section>
      <ui-card>
        <ui-text-field label="App Name" value="My App"></ui-text-field>
        <ui-select label="Status">
          <option value="active">Active</option>
          <option value="draft">Draft</option>
        </ui-select>
        <ui-checkbox label="Enable notifications"></ui-checkbox>
      </ui-card>
    </ui-layout-section>
  </ui-layout>
</ui-page>
```

**Migration status:** Polaris React remains fully supported. Web Components are in preview for new projects. Existing apps do not need to migrate immediately.

### 8. Shopify Dev MCP Server

The `@anthropic/shopify-dev-mcp` server provides AI-assisted Shopify development:

```json
{
  "mcpServers": {
    "shopify-dev": {
      "command": "npx",
      "args": ["@anthropic/shopify-dev-mcp"]
    }
  }
}
```

Provides tools for querying Shopify documentation, generating GraphQL queries, and scaffolding app components.

### 9. Deployment

Deploy Shopify apps to production.

**Deploy to Cloudflare Workers:**

**wrangler.toml:**

```toml
name = "shopify-app"
compatibility_date = "2026-01-10"
main = "build/index.js"

[vars]
SHOPIFY_API_KEY = "your_api_key"

[[kv_namespaces]]
binding = "SESSIONS"
id = "your_kv_namespace_id"
```

**Deploy:**

```bash
# Build app
npm run build

# Deploy to Cloudflare
wrangler deploy
```

**Environment Secrets:**

```bash
# Add secrets
wrangler secret put SHOPIFY_API_SECRET
wrangler secret put DATABASE_URL
```

## Best Practices

1. **Use Shopify CLI** for app scaffolding and development
2. **Implement proper OAuth** with HMAC verification
3. **Handle webhook events** for real-time updates
4. **Use Polaris** for consistent admin UI
5. **Test in development store** before production
6. **Implement error handling** for all API calls
7. **Store session data securely** (encrypted database)
8. **Follow Shopify app requirements** for listing
9. **Implement app billing** for monetisation
10. **Use app extensions** to enhance merchant experience
