# LetsFG API Reference

Full endpoint details for the LetsFG flight search and booking API.

**Base URL:** `https://api.letsfg.co`

## Authentication

All endpoints (except `register`) require the `X-API-Key` header:

```
X-API-Key: trav_your_api_key
```

## Endpoints

### Register Agent

```
POST /api/v1/agents/register
```

No auth required.

```json
{
  "agent_name": "my-agent",
  "email": "agent@example.com"
}
```

**Response:**

```json
{
  "agent_id": "ag_xxx",
  "api_key": "trav_xxxxx..."
}
```

### Link GitHub (Star Verification)

```
POST /api/v1/agents/link-github
```

```json
{
  "github_username": "your-username"
}
```

### Setup Payment

```
POST /api/v1/agents/setup-payment
```

```json
{
  "token": "tok_visa"
}
```

Required before first booking. Card stays on file.

### Agent Profile

```
GET /api/v1/agents/me
```

Returns agent details, search count, booking count, payment status.

### Resolve Location

```
GET /api/v1/flights/locations/{query}
```

Example: `GET /api/v1/flights/locations/London`

**Response:**

```json
[
  {"iata_code": "LON", "name": "London", "type": "city"},
  {"iata_code": "LHR", "name": "Heathrow", "type": "airport", "city": "London"},
  {"iata_code": "LGW", "name": "Gatwick", "type": "airport", "city": "London"}
]
```

### Search Flights

```
POST /api/v1/flights/search
```

```json
{
  "origin": "LHR",
  "destination": "JFK",
  "date_from": "2026-04-15",
  "adults": 1,
  "children": 0,
  "infants": 0,
  "cabin_class": "M",
  "max_stopovers": 2,
  "currency": "EUR",
  "sort": "price",
  "limit": 20
}
```

**Optional fields:** `date_to`, `return_from`, `return_to` (for round-trip), `cabin_class` (M/W/C/F).

**Response:**

```json
{
  "search_id": "sea_xxx",
  "passenger_ids": ["pas_0"],
  "total_results": 47,
  "offers": [
    {
      "id": "off_xxx",
      "price": 189.50,
      "currency": "EUR",
      "airlines": ["British Airways"],
      "owner_airline": "British Airways",
      "outbound": {
        "segments": [
          {
            "airline": "British Airways",
            "flight_no": "BA178",
            "origin": "LHR",
            "destination": "JFK",
            "departure": "2026-04-15T09:00:00",
            "arrival": "2026-04-15T12:15:00",
            "duration_seconds": 27900
          }
        ],
        "route_str": "LHR → JFK",
        "total_duration_seconds": 27900,
        "stopovers": 0
      },
      "conditions": {
        "refund_before_departure": "allowed_with_fee",
        "change_before_departure": "allowed_with_fee"
      }
    }
  ]
}
```

### Unlock Offer

```
POST /api/v1/bookings/unlock
```

```json
{
  "offer_id": "off_xxx"
}
```

**Response:**

```json
{
  "offer_id": "off_xxx",
  "confirmed_price": 189.50,
  "confirmed_currency": "EUR",
  "offer_expires_at": "2026-04-15T15:30:00Z"
}
```

**Errors:**
- 403 — GitHub star not verified
- 410 — Offer expired (search again)

### Book Flight

```
POST /api/v1/bookings/book
```

```json
{
  "offer_id": "off_xxx",
  "passengers": [
    {
      "id": "pas_0",
      "given_name": "John",
      "family_name": "Doe",
      "born_on": "1990-01-15",
      "gender": "m",
      "title": "mr",
      "email": "john@example.com",
      "phone_number": "+44123456789"
    }
  ],
  "contact_email": "john@example.com",
  "idempotency_key": "unique-key-123"
}
```

**Response:**

```json
{
  "booking_reference": "ABC123",
  "status": "confirmed",
  "flight_price": 189.50,
  "currency": "EUR"
}
```

**Errors:**
- 402 — Payment declined
- 403 — Offer not unlocked
- 409 — Fare changed (re-unlock) or already booked (idempotency match)
- 410 — 30-minute window expired

### Get Booking

```
GET /api/v1/bookings/booking/{booking_id}
```

## Rate Limits

| Endpoint | Rate Limit | Typical Latency |
|----------|-----------|-----------------|
| Search | 60 req/min | 2-15s |
| Resolve location | 120 req/min | <1s |
| Unlock | 20 req/min | 2-5s |
| Book | 10 req/min | 3-10s |

## Error Response Format

```json
{
  "error": {
    "code": "OFFER_EXPIRED",
    "category": "business",
    "message": "This offer is no longer available",
    "is_retryable": false
  }
}
```

### Error Categories

| Category | Action |
|----------|--------|
| `transient` | Retry after 1-5s (exponential backoff) |
| `validation` | Fix the request parameters |
| `business` | Inform user — needs human decision |

### Error Codes

| Code | HTTP | Category | Description |
|------|------|----------|-------------|
| `SUPPLIER_TIMEOUT` | 504 | transient | Airline API timeout |
| `RATE_LIMITED` | 429 | transient | Too many requests |
| `SERVICE_UNAVAILABLE` | 503 | transient | Backend down |
| `INVALID_IATA` | 422 | validation | Bad airport code |
| `INVALID_DATE` | 422 | validation | Bad date format or past date |
| `INVALID_PASSENGERS` | 422 | validation | Bad passenger data |
| `UNSUPPORTED_ROUTE` | 422 | validation | No providers for route |
| `AUTH_INVALID` | 401 | business | Bad API key |
| `PAYMENT_REQUIRED` | 402 | business | No payment method |
| `PAYMENT_DECLINED` | 402 | business | Stripe charge failed |
| `OFFER_EXPIRED` | 410 | business | Seats sold — search again |
| `OFFER_NOT_UNLOCKED` | 403 | business | Must unlock before booking |
| `FARE_CHANGED` | 409 | business | Price changed — re-unlock |
| `ALREADY_BOOKED` | 409 | business | Duplicate (idempotency match) |
