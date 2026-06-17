# Hydrogen Reference

Hydrogen is Shopify's framework for building custom headless storefronts, powered by React Router 7 (since Hydrogen 2025.5.0, replacing Remix).

## Overview

| Item | Value |
|------|-------|
| Framework | React Router 7 (formerly Remix) |
| React version | React 19 |
| API | Storefront API (GraphQL) |
| Hosting | Shopify Oxygen (default) or any Node.js host |
| CLI | `npx shopify hydrogen` |
| Docs | [hydrogen.shopify.dev](https://hydrogen.shopify.dev) |

## Getting Started

### Create a Hydrogen project

```bash
# Create new project
npx shopify hydrogen init

# Options:
# - Template: skeleton, demo-store
# - Language: TypeScript (recommended), JavaScript
# - Styling: Tailwind CSS, vanilla CSS

# Project structure:
my-store/
├── app/
│   ├── components/          # Shared components
│   ├── lib/                 # Utilities and helpers
│   ├── routes/              # File-based routing
│   │   ├── _index.tsx       # Homepage
│   │   ├── products.$handle.tsx  # Product page
│   │   ├── collections.$handle.tsx
│   │   └── cart.tsx
│   ├── entry.client.tsx     # Client entry
│   ├── entry.server.tsx     # Server entry
│   └── root.tsx             # Root layout
├── public/                  # Static assets
├── .env                     # Environment variables
├── hydrogen.config.ts       # Hydrogen config
├── react-router.config.ts   # Route config
├── package.json
└── vite.config.ts
```

### Environment variables

```bash
# .env
SESSION_SECRET=your-secret
PUBLIC_STOREFRONT_API_TOKEN=your-public-token
PUBLIC_STORE_DOMAIN=your-store.myshopify.com

# Optional: for authenticated Storefront API
PRIVATE_STOREFRONT_API_TOKEN=your-private-token
```

## Routing

Hydrogen uses React Router 7 file-based routing:

| File | URL | Description |
|------|-----|-------------|
| `routes/_index.tsx` | `/` | Homepage |
| `routes/products.$handle.tsx` | `/products/snowboard` | Product page |
| `routes/collections.$handle.tsx` | `/collections/winter` | Collection page |
| `routes/collections._index.tsx` | `/collections` | Collections list |
| `routes/cart.tsx` | `/cart` | Cart page |
| `routes/search.tsx` | `/search` | Search results |
| `routes/pages.$handle.tsx` | `/pages/about` | CMS pages |
| `routes/account.tsx` | `/account` | Customer account (layout) |
| `routes/account.orders.$id.tsx` | `/account/orders/123` | Order detail |

## Data Loading

### Loader pattern (server-side data fetching)

```tsx
import { useLoaderData, type LoaderFunctionArgs } from 'react-router';

export async function loader({ params, context }: LoaderFunctionArgs) {
  const { storefront } = context;

  const { product } = await storefront.query(PRODUCT_QUERY, {
    variables: { handle: params.handle },
  });

  if (!product) {
    throw new Response('Product not found', { status: 404 });
  }

  return { product };
}

export default function ProductPage() {
  const { product } = useLoaderData<typeof loader>();

  return (
    <div>
      <h1>{product.title}</h1>
      <p>{product.description}</p>
      <ProductPrice price={product.priceRange.minVariantPrice} />
    </div>
  );
}

const PRODUCT_QUERY = `#graphql
  query Product($handle: String!) {
    product(handle: $handle) {
      id
      title
      handle
      description
      priceRange {
        minVariantPrice {
          amount
          currencyCode
        }
      }
      images(first: 10) {
        nodes {
          url
          altText
          width
          height
        }
      }
      variants(first: 100) {
        nodes {
          id
          title
          availableForSale
          price {
            amount
            currencyCode
          }
          selectedOptions {
            name
            value
          }
        }
      }
    }
  }
`;
```

### Action pattern (form submissions)

```tsx
import { type ActionFunctionArgs } from 'react-router';

export async function action({ request, context }: ActionFunctionArgs) {
  const formData = await request.formData();
  const variantId = formData.get('variantId') as string;
  const quantity = parseInt(formData.get('quantity') as string) || 1;

  const { cart } = context;

  const result = await cart.addLines([
    { merchandiseId: variantId, quantity },
  ]);

  return { cart: result.cart };
}
```

## Storefront API Client

Hydrogen provides a typed Storefront API client:

```tsx
// app/lib/storefront.ts - automatically configured

// Usage in loaders:
export async function loader({ context }: LoaderFunctionArgs) {
  const { storefront } = context;

  // Simple query
  const { products } = await storefront.query(PRODUCTS_QUERY, {
    variables: { first: 10 },
  });

  // With cache control
  const { collection } = await storefront.query(COLLECTION_QUERY, {
    variables: { handle: 'winter' },
    cache: storefront.CacheLong(),  // Cache for 1 hour
  });

  return { products, collection };
}
```

### Cache strategies

```tsx
// Built-in cache strategies
storefront.CacheNone()     // No caching (default for mutations)
storefront.CacheShort()    // 1 second stale, 60 seconds max
storefront.CacheLong()     // 1 hour stale, 1 day max
storefront.CacheCustom({
  mode: 'public',
  maxAge: 60,              // seconds
  staleWhileRevalidate: 300,
})
```

## Cart Operations

Hydrogen provides a cart API abstraction:

```tsx
// In loaders/actions, use context.cart
export async function action({ request, context }: ActionFunctionArgs) {
  const { cart } = context;
  const formData = await request.formData();

  switch (formData.get('action')) {
    case 'add':
      return cart.addLines([{
        merchandiseId: formData.get('variantId') as string,
        quantity: 1,
      }]);

    case 'update':
      return cart.updateLines([{
        id: formData.get('lineId') as string,
        quantity: parseInt(formData.get('quantity') as string),
      }]);

    case 'remove':
      return cart.removeLines([
        formData.get('lineId') as string,
      ]);

    case 'updateNote':
      return cart.updateNote(
        formData.get('note') as string,
      );

    default:
      throw new Error('Unknown cart action');
  }
}
```

### Cart component

```tsx
import { useFetcher } from 'react-router';
import { CartLineQuantity, CartLinePrice, Money } from '@shopify/hydrogen';

function AddToCartButton({ variantId }: { variantId: string }) {
  const fetcher = useFetcher();
  const isAdding = fetcher.state !== 'idle';

  return (
    <fetcher.Form method="post" action="/cart">
      <input type="hidden" name="action" value="add" />
      <input type="hidden" name="variantId" value={variantId} />
      <button type="submit" disabled={isAdding}>
        {isAdding ? 'Adding...' : 'Add to Cart'}
      </button>
    </fetcher.Form>
  );
}
```

## Hydrogen Components

Built-in components for common e-commerce patterns:

```tsx
import {
  Image,
  Money,
  ShopPayButton,
  Video,
  ExternalVideo,
  ModelViewer,
  MediaFile,
  CartLineQuantity,
  CartLinePrice,
} from '@shopify/hydrogen';

// Optimised image with CDN sizing
<Image
  data={product.images.nodes[0]}
  sizes="(min-width: 768px) 50vw, 100vw"
  aspectRatio="1/1"
/>

// Formatted price
<Money data={product.priceRange.minVariantPrice} />

// Shop Pay button
<ShopPayButton
  variantIds={[selectedVariant.id]}
  storeDomain={shop.primaryDomain.url}
/>
```

## SEO

```tsx
// In root.tsx or individual routes
import { getSeoMeta } from '@shopify/hydrogen';

export const meta = ({ data }) => {
  return getSeoMeta({
    title: data.product.title,
    description: data.product.description,
    url: `https://store.com/products/${data.product.handle}`,
    image: data.product.images.nodes[0]?.url,
  });
};
```

## Deployment

### Shopify Oxygen (recommended)

```bash
# Deploy to Oxygen
npx shopify hydrogen deploy

# Environment variables managed in Shopify admin:
# Settings > Hydrogen > Environment variables
```

### Self-hosted (Cloudflare Workers, Vercel, etc.)

```bash
# Build for production
npm run build

# Cloudflare Workers
npx wrangler deploy

# Node.js server
npm start
```

### Vite configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import { hydrogen } from '@shopify/hydrogen/vite';
import { reactRouter } from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    tailwindcss(),
    hydrogen(),
    reactRouter(),
  ],
});
```

## Best Practices

1. **Use cache strategies** - `CacheLong()` for collections, `CacheShort()` for cart
2. **Minimise Storefront API queries** - request only needed fields
3. **Use `defer`** for non-critical data to improve time-to-first-byte
4. **Implement SEO** with `getSeoMeta` on all public routes
5. **Use Hydrogen components** (Image, Money) for built-in optimisations
6. **Handle loading states** with `useFetcher` for cart operations
7. **Set up analytics** with Hydrogen's built-in analytics utilities
8. **Test with Oxygen** before deploying to production
9. **Use TypeScript** for type safety with Storefront API responses
10. **Keep queries colocated** with route files for maintainability
