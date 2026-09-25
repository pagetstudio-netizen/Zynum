---
name: zynum-api
description: Integrate applications and AI agents with ZyNum's v1 REST API. Use when building, reviewing, or troubleshooting a ZyNum API client.
---

# ZyNum API integration

Use this skill when an application or coding agent needs to discover ZyNum services and countries, purchase a virtual number using an account balance, or manage the resulting order and SMS data.

## Base URL and authentication

- Base URL: `https://zynum.net/api`
- Current API version: v1. Do not invent v2 routes.
- Public catalog calls do not need authentication.
- Private calls require `Authorization: Bearer <ZYNUM_API_KEY>`. ZyNum keys begin with `zyn_`.
- The account owner manages the key in the ZyNum developer area.
- Keep the key on a trusted server and in a secrets manager or environment variable. Never put it in browser code, logs, source control, or a chat prompt. Do not ask a user to paste a key into chat.
- Send `Content-Type: application/json` on JSON requests.

## Available routes

### Public catalog

| Method | Path | Request | Response |
| --- | --- | --- | --- |
| `GET` | `/v1/services` | None | `{ "services": [{ "id": "telegram", "name": "Telegram", "icon": "telegram", "category": "messaging" }] }` |
| `GET` | `/v1/countries?service=telegram` | Optional `service` query; defaults to `telegram` | `{ "countries": [{ "code": "senegal", "name": "Senegal", "flag": "SN", "priceUsd": 0.42, "priceFcfa": 260, "available": 0 }] }` |

Country and service availability can change. Treat `available` and prices as a response snapshot, not a reservation or quote guarantee.

### Authenticated catalog and account

| Method | Path | Request | Response |
| --- | --- | --- | --- |
| `GET` | `/v1/operators?service={service}&country={country}` | Both query parameters required | `{ "operators": [{ "name": "operator-id", "label": "Operator", "priceUsd": 0.42, "priceFcfa": 260, "available": 0 }] }` |
| `GET` | `/v1/balance` | None | `{ "balance": 12.75, "currency": "USD" }` |

### Purchase and order management

| Method | Path | Request | Response |
| --- | --- | --- | --- |
| `POST` | `/v1/buy` | JSON: required `service` and `country` strings; optional `currency` (`USD` or `FCFA`, defaults to `USD`), `operator`, and `discountCode` | `{ "order": { ... } }` |
| `GET` | `/v1/check/{orderId}` | `orderId` is the ZyNum `order.id` | `{ "order": { ... }, "autocanceled": false, "refundPending": false }` |
| `GET` | `/v1/orders?page=1&limit=20` | Optional numeric `page` and `limit`; defaults to 1 and 20 | `{ "orders": [{ ... }], "total": 1, "page": 1, "limit": 20 }` |
| `POST` | `/v1/cancel/{orderId}` | No body; use the ZyNum `order.id` | `{ "order": { ... }, "refundPending": false }` |
| `POST` | `/v1/finish/{orderId}` | No body; use the ZyNum `order.id` | `{ "order": { ... } }` |

Order objects include fields such as `id`, `phone`, `service`, `serviceName`, `country`, `countryName`, `status`, nullable `smsCode` and `smsText`, `priceUsd`, `priceFcfa`, `currency`, `createdAt`, and `updatedAt`. Dates are ISO 8601 strings. Use `id` for all order routes; do not substitute an opaque external reference.

Order statuses are `PENDING`, `RECEIVED`, `FINISHED`, `TIMEOUT`, `BANNED`, and `CANCELED`.

## Order lifecycle

1. Read the public service and country catalog. Check the balance before attempting a purchase.
2. Submit `POST /v1/buy` from a trusted server. A successful response contains `order.id`; store this id for follow-up calls.
3. Poll `GET /v1/check/{orderId}` from the backend to read the order status and SMS fields. A successful response can contain the existing saved order if a live status check fails, so HTTP 200 alone does not prove the data is fresh.
4. Call `POST /v1/finish/{orderId}` only after the order is `RECEIVED` and has an SMS code.
5. Call `POST /v1/cancel/{orderId}` only while the order is `PENDING`, or `RECEIVED` with no SMS code. Refund confirmation may be pending.

Orders are scoped to the authenticated account. Do not retry a purchase blindly after an ambiguous network failure; first inspect the account's order history to reduce the risk of creating a duplicate order.

## Errors and edge cases

- `400`: validation or purchase failure; purchase failures can include insufficient balance.
- `401`: missing or invalid authentication.
- `404`: order or account resource not found for the current account.
- `409`: number unavailable, or an order action is not valid for its current state.
- `502`: order finish could not be confirmed.
- `503`: refund is still pending.
- Error bodies commonly contain `error` and `message`; use the specific endpoint response rather than assuming every route has an identical error body.
- A check on an order older than six minutes with no SMS code can trigger automatic cancellation/refund handling. The response may include `autocanceled` and `refundPending`, or return `503` while refund handling is retried.
- Do not promise filtering, webhooks, SDKs, rate limits, or endpoints not listed here.

## Server-side JavaScript example

```js
const apiKey = process.env.ZYNUM_API_KEY;
if (!apiKey) throw new Error("Missing ZYNUM_API_KEY");

const response = await fetch("https://zynum.net/api/v1/balance", {
  headers: { Authorization: `Bearer ${apiKey}` },
});

if (!response.ok) {
  throw new Error(`ZyNum API returned ${response.status}`);
}

const balance = await response.json();
console.log(balance.currency, balance.balance);
```

Use the live catalog and current response values to choose a service, country, and operator. Do not hardcode sample prices or availability as guarantees.