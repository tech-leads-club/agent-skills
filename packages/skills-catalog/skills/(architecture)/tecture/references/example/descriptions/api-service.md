Node.js REST API backing both the storefront and the admin app.

## Responsibilities

- Authentication and session management
- Catalog reads and mutations
- Order creation (publishes `order.created` to the event bus)

## Tech Stack

- Node.js, Express, Prisma

## Order Creation Flow

```mermaid
sequenceDiagram
  participant SF as Storefront
  participant API as API Service
  participant DB as Postgres
  participant EB as Event Bus
  SF->>API: POST /orders
  API->>DB: INSERT order
  DB-->>API: order id
  API->>EB: publish order.created
  API-->>SF: 201 Created
```
