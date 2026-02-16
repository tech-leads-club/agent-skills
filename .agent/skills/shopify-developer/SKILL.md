---
name: shopify-developer
description: Complete Shopify development reference for Liquid templating, theme development (OS 2.0), GraphQL Admin API, Storefront API, custom app development, Shopify Functions, Hydrogen, performance optimisation, and debugging. Use when working with .liquid files, creating theme sections and blocks, writing GraphQL queries or mutations for Shopify, building Shopify apps with CLI and Polaris, implementing cart operations via Ajax API, optimising Core Web Vitals for Shopify stores, debugging Liquid or API errors, configuring settings_schema.json, accessing Shopify objects (product, collection, cart, customer), using Liquid filters, creating app extensions, working with webhooks, migrating from Scripts to Functions, or building headless storefronts with Hydrogen and React Router 7. Covers API version 2026-01.
---

# Shopify Developer Reference

Comprehensive reference for professional Shopify development - API version **2026-01**.

## Quick Reference

| Item | Value |
|------|-------|
| API version | `2026-01` (stable) |
| GraphQL Admin | `POST https://{store}.myshopify.com/admin/api/2026-01/graphql.json` |
| Storefront API | `POST https://{store}.myshopify.com/api/2026-01/graphql.json` |
| Ajax API (theme) | `/cart.js`, `/cart/add.js`, `/cart/change.js` |
| CLI install | `npm install -g @shopify/cli` |
| Theme dev | `shopify theme dev --store {store}.myshopify.com` |
| App dev | `shopify app dev` |
| Deploy | `shopify app deploy` |
| Docs | [shopify.dev](https://shopify.dev) |

## Choose Your Path

Read the reference file(s) that match your task:

**Liquid templating** - writing or debugging `.liquid` files:

- [references/liquid-syntax.md](references/liquid-syntax.md) - Tags, control flow, iteration, whitespace, LiquidDoc
- [references/liquid-filters.md](references/liquid-filters.md) - All filter categories with examples
- [references/liquid-objects.md](references/liquid-objects.md) - Product, collection, cart, customer, and global objects

**Theme development** - building or customising themes:

- [references/theme-development.md](references/theme-development.md) - OS 2.0 architecture, sections, blocks, JSON templates, settings schema

**API integration** - fetching or modifying data programmatically:

- [references/api-admin.md](references/api-admin.md) - GraphQL Admin API (primary), REST (legacy), OAuth, webhooks, rate limiting
- [references/api-storefront.md](references/api-storefront.md) - Storefront API, Ajax API, cart operations

**App development** - building Shopify apps:

- [references/app-development.md](references/app-development.md) - Shopify CLI, extensions, Polaris Web Components, App Bridge

**Serverless logic** - custom business rules:

- [references/functions.md](references/functions.md) - Shopify Functions (replacing Scripts), Rust/JS targets, deployment

**Headless commerce** - custom storefronts:

- [references/hydrogen.md](references/hydrogen.md) - Hydrogen framework, React Router 7, Storefront API integration

**Optimisation and troubleshooting**:

- [references/performance.md](references/performance.md) - Images, JS, CSS, fonts, Liquid, Core Web Vitals
- [references/debugging.md](references/debugging.md) - Liquid errors, API errors, cart issues, webhook failures

## Deprecation Notices

| Deprecated | Replacement | Deadline |
|------------|-------------|----------|
| Shopify Scripts | Shopify Functions | August 2025 (migration), sundown TBD |
| checkout.liquid | Checkout Extensibility | August 2024 (Plus), done |
| REST Admin API | GraphQL Admin API | Active deprecation (no removal date yet) |
| Legacy custom apps | New auth model | January 2025 (done) |
| Polaris React | Polaris Web Components | Active migration |
| Remix (app framework) | React Router 7 | Hydrogen 2025.5.0+ |

## Liquid Essentials

Three syntax types:

```liquid
{{ product.title | upcase }}                    {# Output with filter #}
{% if product.available %}In stock{% endif %}   {# Logic tag #}
{% assign sale = product.price | times: 0.8 %}  {# Assignment #}
{%- if condition -%}Stripped whitespace{%- endif -%}
```

Key patterns:

```liquid
{% for product in collection.products limit: 5 %}
  {% render 'product-card', product: product %}
{% endfor %}

{% paginate collection.products by 12 %}
  {% for product in paginate.collection.products %}...{% endfor %}
  {{ paginate | default_pagination }}
{% endpaginate %}
```

## API Essentials

```javascript
// GraphQL Admin - always use GraphQL over REST
const response = await fetch(
  `https://${store}.myshopify.com/admin/api/2026-01/graphql.json`,
  {
    method: 'POST',
    headers: {
      'X-Shopify-Access-Token': accessToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  }
);
const { data, errors } = await response.json();
if (errors) throw new Error(errors[0].message);

// Ajax API (theme-only cart operations)
fetch('/cart/add.js', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ id: variantId, quantity: 1 }),
});
```

## Reference Files

| File | Lines | Coverage |
|------|-------|----------|
| [liquid-syntax.md](references/liquid-syntax.md) | ~600 | Tags, control flow, iteration, variables, whitespace, LiquidDoc |
| [liquid-filters.md](references/liquid-filters.md) | ~870 | String, numeric, array, Shopify-specific, date, URL, colour filters |
| [liquid-objects.md](references/liquid-objects.md) | ~695 | All Shopify objects: product, variant, collection, cart, customer, order, etc. |
| [theme-development.md](references/theme-development.md) | ~1200 | File structure, JSON templates, sections, blocks, settings schema, layout |
| [api-admin.md](references/api-admin.md) | ~595 | GraphQL queries/mutations, REST (legacy), OAuth, webhooks, rate limiting |
| [api-storefront.md](references/api-storefront.md) | ~235 | Storefront API, Ajax API, cart operations, Customer Account API |
| [app-development.md](references/app-development.md) | ~760 | CLI, app architecture, extensions, Polaris Web Components, deployment |
| [functions.md](references/functions.md) | ~300 | Function types, Rust/JS targets, CLI workflow, Scripts migration |
| [hydrogen.md](references/hydrogen.md) | ~375 | Setup, routing, data loading, Storefront API, deployment |
| [performance.md](references/performance.md) | ~605 | Images, JS, CSS, fonts, Liquid, third-party scripts, Core Web Vitals |
| [debugging.md](references/debugging.md) | ~650 | Liquid, JavaScript, API, cart, webhook, theme editor troubleshooting |
