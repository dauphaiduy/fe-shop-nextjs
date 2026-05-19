# NestJS Backend — Application Documentation

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Environment Variables](#environment-variables)
5. [Database Schema](#database-schema)
6. [API Reference](#api-reference)
   - [Auth](#auth)
   - [Users](#users)
   - [Roles](#roles)
   - [Permissions](#permissions)
   - [Audit Log](#audit-log)
   - [Dashboard](#dashboard)
   - [Categories](#categories)
   - [Products](#products)
   - [Customer Profile](#customer-profile)
   - [Cart](#cart)
   - [Orders](#orders)
   - [Payments](#payments)
7. [Full Shopping & Payment Flow](#full-shopping--payment-flow)
8. [Payment Gateway — SePay (Bank Transfer QR)](#payment-gateway--sepay-bank-transfer-qr)
9. [WebSocket — Real-time Payment Status](#websocket--real-time-payment-status)
10. [Standard Response Format](#standard-response-format)
11. [Authentication & Authorization](#authentication--authorization)
12. [Global Providers](#global-providers)
13. [Data Layer — Queries & Repositories](#data-layer--queries--repositories)
14. [Running the Application](#running-the-application)
15. [Docker](#docker)

---

## Overview

A RESTful NestJS API providing:

- JWT-based authentication — separate login flows for admin panel and shop
- Role-based access control (RBAC) with fine-grained permission strings (admin/staff only)
- User type system: `ADMIN`, `STAFF`, `CUSTOMER`
- Full user and role management
- Customer profile management (customers update their own profile after registration)
- Automatic audit logging for every request/response
- Dashboard analytics (summary counts, recent logs, user registration trend)
- Product catalogue management with category organisation — public read access
- **Shopping flow** — cart management, atomic checkout with stock reservation, order lifecycle state machine, abandoned-order auto-release scheduler
- **Payment flow** — multi-provider gateway adapter (SePay, MoMo, ZaloPay, VNPay), webhook handling with idempotency, transaction lifecycle, refund support
- **Real-time payment updates** — Socket.IO WebSocket gateway pushes `payment:pending`, `payment:success`, and `payment:failed` events to subscribed clients
- Standardised API response envelope and global exception handling

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | NestJS 11 |
| Language | TypeScript (`module: nodenext`) |
| ORM | Prisma 6 |
| Database | PostgreSQL 16 |
| Auth | JWT (`@nestjs/jwt`) |
| Validation | `class-validator` + `class-transformer` |
| Password hashing | `bcrypt` |
| Scheduler | `@nestjs/schedule` |
| WebSocket | `@nestjs/websockets` + `socket.io` |
| Tunnel (dev) | ngrok |
| Runtime | Node.js 22 |
| Container | Docker + Docker Compose |

---

## Project Structure

```
src/
├── main.ts                        Entry point — ValidationPipe, CORS, global prefix
├── app.module.ts                  Root module — all feature modules + global providers
├── config/
│   └── config.ts                  Config factories: app, database, jwt
│
├── common/
│   ├── decorators/
│   │   ├── public.decorator.ts        @Public() — skip auth guard
│   │   ├── permission.decorator.ts    @Permissions() — declare required permissions
│   │   └── current-user.decorator.ts  @CurrentUser() — inject req.user
│   ├── filters/
│   │   └── all-exceptions.filter.ts   Global exception filter — unified error responses
│   ├── guard/
│   │   └── auth.guard.ts              Global auth + permission guard
│   ├── interceptors/
│   │   ├── transform.interceptor.ts   Wraps success responses in standard envelope
│   │   └── audit-log.interceptor.ts   Records every request/response to audit_logs
│   ├── middlewares/
│   │   └── permission-val.middleware.ts  Attaches PermissionVal + AsyncLocalStorage context
│   ├── models/
│   │   └── permission-val.model.ts    Carries accessToken + permissions per request
│   ├── prisma/
│   │   └── prisma.service.ts          Extended PrismaClient
│   ├── shared/
│   │   ├── queries/                   Read-only DB access (find, findOne, count)
│   │   └── repositories/              Write DB access (create, update, delete)
│   ├── storage/
│   │   └── app.storage.ts             AsyncLocalStorage — per-request context propagation
│   └── utils/
│       └── hash.util.ts               hashPassword / comparePassword (bcrypt)
│
└── modules/
    ├── auth/               Login (shop + admin), Register
    ├── user/               User CRUD
    ├── roles/              Role CRUD
    ├── permissions/        In-memory permission registry
    ├── audit-log/          Audit log query endpoint
    ├── dashboard/          Analytics endpoints
    ├── category/           Category CRUD
    ├── product/            Product CRUD
    ├── customer-profile/   Customer self-service profile
    ├── cart/               Cart management
    ├── order/              Checkout, order lifecycle, abandoned-order scheduler
    └── payment/
        ├── dto/              CheckoutPaymentDto, QueryPaymentDto, RefundPaymentDto
        ├── gateways/         PaymentGateway interface + SePay, MoMo, ZaloPay, VNPay adapters
        ├── permissions/      PaymentPermissions class
        ├── pipes/            ParsePaymentProviderPipe (case-insensitive enum)
        ├── queues/           BullMQ processor stub (ready to activate)
        └── payment.gateway.ts  Socket.IO WebSocket gateway — real-time payment events
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Runtime environment |
| `PORT` | `3000` | HTTP server port |
| `API_PREFIX` | `v1` | Global route prefix |
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_USERNAME` | `postgres` | PostgreSQL user |
| `DB_PASSWORD` | `postgres` | PostgreSQL password |
| `DB_NAME` | `nestjs` | Database name |
| `DATABASE_URL` | *(derived)* | Full Prisma connection string |
| `JWT_SECRET` | `secret` | JWT signing secret — **change in production** |
| `JWT_EXPIRES_IN` | `7d` | JWT expiry duration |
| `NGROK_AUTHTOKEN` | `token` | ngrok auth token for webhook tunnelling |
| `SEPAY_BANK` | — | Bank code used in SePay QR URL |
| `SEPAY_ACCOUNT` | — | Bank account number for SePay QR |

---

## Database Schema

### `users`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `Int` PK | |
| `email` | `String` unique | |
| `username` | `String?` unique | |
| `password` | `String?` | Null for OAuth accounts |
| `name` | `String?` | |
| `isActive` | `Boolean` | Default `false` |
| `accountType` | `AccountType` | `LOCAL` \| `GOOGLE` \| `GITHUB` |
| `userType` | `UserType` | `ADMIN` \| `STAFF` \| `CUSTOMER` |
| `roleId` | `Int?` FK → `roles.id` | Null for `CUSTOMER` users |

### `roles`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `Int` PK | |
| `name` | `String` unique | |
| `permissions` | `Json?` | Array of permission strings. `["*"]` = admin |
| `description` | `String?` | |

### `customer_profiles`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `Int` PK | |
| `userId` | `Int` unique FK | One-to-one with user |
| `fullName` | `String?` | |
| `phone` | `String?` | |
| `address` | `String?` | |

### `categories`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `Int` PK | |
| `name` | `String` unique | |
| `description` | `String?` | |

### `products`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `Int` PK | |
| `name` | `String` | |
| `price` | `Decimal(10,2)` | |
| `stock` | `Int` | Default `0` |
| `status` | `ProductStatus` | `ACTIVE` \| `INACTIVE` |
| `images` | `String[]` | Array of image URLs |
| `categoryId` | `Int` FK | |

### `carts` / `cart_items`

| Column | Type | Notes |
|--------|------|-------|
| `carts.status` | `CartStatus` | `ACTIVE` \| `ORDERED` \| `ABANDONED` |
| `cart_items.cartId` | `Int` FK | |
| `cart_items.productId` | `Int` FK | |
| `cart_items.quantity` | `Int` | |

### `orders` / `order_items`

| Column | Type | Notes |
|--------|------|-------|
| `orders.status` | `OrderStatus` | `PENDING` → `CONFIRMED` → `SHIPPED` → `DELIVERED` \| `CANCELLED` \| `REFUNDED` |
| `orders.totalAmount` | `Decimal(10,2)` | Snapshot at checkout |
| `order_items.priceAtTime` | `Decimal(10,2)` | Price snapshot |

### `payment_transactions`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `Int` PK | |
| `orderId` | `Int` FK → `orders.id` | |
| `provider` | `PaymentProvider` | `MOMO` \| `ZALOPAY` \| `VNPAY` \| `SEPAY` |
| `transactionId` | `String?` | Provider reference / our ref code |
| `amount` | `Decimal(12,2)` | |
| `status` | `PaymentStatus` | `PENDING` → `PROCESSING` → `SUCCESS` \| `FAILED` \| `EXPIRED` \| `CANCELLED` \| `REFUNDED` |
| `rawRequest` | `Json?` | Gateway request payload snapshot |
| `rawResponse` | `Json?` | Gateway response snapshot |
| `callbackPayload` | `Json?` | Raw webhook payload from gateway |

### `audit_logs`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `Int` PK | |
| `userId` | `Int?` | |
| `action` | `String` | HTTP method |
| `resource` | `String` | URL path |
| `statusCode` | `Int?` | |
| `ipAddress` | `String?` | |
| `metadata` | `Json?` | Extra info |

---

## API Reference

All endpoints are prefixed with `/v1`. Authenticated routes require `Authorization: Bearer <token>`.

### Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/auth/register` | Public | Register new customer account |
| `POST` | `/auth/login` | Public | Customer login → JWT |
| `POST` | `/auth/admin/login` | Public | Admin/Staff login → JWT |

```bash
# Register
curl -X POST /v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{ "email": "user@test.com", "password": "Pass1234!", "name": "Test User" }'

# Login
curl -X POST /v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{ "email": "user@test.com", "password": "Pass1234!" }'
```

---

### Users

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| `GET` | `/users` | `user:read` | List users |
| `GET` | `/users/:id` | `user:read` | Get user by id |
| `POST` | `/users` | `user:create` | Create user |
| `PATCH` | `/users/:id` | `user:update` | Update user |
| `DELETE` | `/users/:id` | `user:delete` | Delete user |

---

### Roles

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| `GET` | `/roles` | `role:read` | List roles |
| `GET` | `/roles/:id` | `role:read` | Get role |
| `POST` | `/roles` | `role:create` | Create role |
| `PATCH` | `/roles/:id` | `role:update` | Update role |
| `DELETE` | `/roles/:id` | `role:delete` | Delete role |

```bash
# Create admin role
curl -X POST /v1/roles \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{ "name": "superadmin", "permissions": ["*"], "description": "Full access" }'
```

---

### Permissions

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/permissions` | JWT | List all registered permission strings |

---

### Audit Log

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| `GET` | `/audit-log` | `audit-log:read` | Query audit logs (paginated) |

---

### Dashboard

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| `GET` | `/dashboard` | `dashboard:read` | Summary counts, recent logs, registration trend |

---

### Categories

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/categories` | Public | List categories |
| `GET` | `/categories/:id` | Public | Get category |
| `POST` | `/categories` | `category:create` | Create category |
| `PATCH` | `/categories/:id` | `category:update` | Update category |
| `DELETE` | `/categories/:id` | `category:delete` | Delete category |

---

### Products

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/products` | Public | List products (filter by category, status, search) |
| `GET` | `/products/:id` | Public | Get product |
| `POST` | `/products` | `product:create` | Create product |
| `PATCH` | `/products/:id` | `product:update` | Update product |
| `DELETE` | `/products/:id` | `product:delete` | Delete product |

---

### Customer Profile

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/customer/profile` | JWT | Get own profile |
| `PUT` | `/customer/profile` | JWT | Update own profile |

---

### Cart

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/cart` | JWT | Get active cart with items |
| `POST` | `/cart/items` | JWT | Add item (creates cart if none) |
| `PATCH` | `/cart/items/:productId` | JWT | Update item quantity |
| `DELETE` | `/cart/items/:productId` | JWT | Remove item |
| `DELETE` | `/cart` | JWT | Clear entire cart |

---

### Orders

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/orders/checkout` | JWT | Create order from active cart (atomic stock deduction) |
| `GET` | `/orders` | JWT | List orders — customers see own, staff/admin see all |
| `GET` | `/orders/:id` | JWT | Get order detail |
| `PATCH` | `/orders/:id/status` | `order:update_status` | Advance order status |

**Order state machine:**

```
PENDING → CONFIRMED → SHIPPED → DELIVERED
     ↘           ↘
   CANCELLED    CANCELLED / REFUNDED
                DELIVERED → REFUNDED
```

**Abandoned-order scheduler:** every 5 minutes, `PENDING` orders older than 15 minutes are cancelled and stock is restored.

---

### Payments

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/payments/checkout` | JWT | Initiate payment for an order |
| `POST` | `/payments/webhook/:provider` | **Public** | Gateway webhook callback |
| `GET` | `/payments/status/:orderId` | JWT | Query payment transactions for an order |
| `POST` | `/payments/refund` | JWT | Refund a SUCCESS transaction |

**Providers:** `SEPAY` \| `MOMO` \| `ZALOPAY` \| `VNPAY` (case-insensitive)

```bash
# Initiate payment
curl -X POST /v1/payments/checkout \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
    "orderId": 42,
    "provider": "SEPAY",
    "returnUrl": "https://yourfrontend.com/payment/result"
  }'

# Webhook simulation
curl -X POST /v1/payments/webhook/sepay \
  -H 'Content-Type: application/json' \
  -d '{
    "id": 99999,
    "gateway": "VietcomBank",
    "content": "THANHTOAN42",
    "transferAmount": 200000,
    "transferType": "in"
  }'

# Query status
curl /v1/payments/status/42 \
  -H 'Authorization: Bearer <token>'
```

---

## Full Shopping & Payment Flow

```
1. POST /auth/register          → create account
2. POST /auth/login             → get JWT
3. GET  /products               → browse products
4. POST /cart/items             → add items to cart
5. POST /orders/checkout        → create order (stock deducted atomically)
6. WS   connect /payment        → subscribe to payment:42 room
7. POST /payments/checkout      → initiate payment → get QR / payment URL
         └─ WS event: payment:pending  → frontend shows QR / spinner
8.      [Customer pays]
9. POST /payments/webhook/:provider  → gateway notifies server
         └─ verifyCallback()    → validate signature / content match
         └─ DB transaction      → PaymentTransaction.status = SUCCESS
                                → Order.status = CONFIRMED
         └─ WS event: payment:success → frontend redirects to confirmed page
10. GET /payments/status/:id    → confirm SUCCESS (polling fallback)
```

---

## Payment Gateway — SePay (Bank Transfer QR)

SePay works differently from card gateways — no API call is needed to create a payment. Instead:

1. **`createPayment`** — generates a reference code (`THANHTOAN{orderId}`), builds a QR URL, stores the ref code as `transactionId` in `payment_transactions`
2. **Customer scans QR**, transfers money, and types the reference code in the transfer description
3. **SePay fires a webhook** `POST /payments/webhook/sepay` with the transfer details
4. **`verifyCallback`** — reads `payload.content` (what the customer typed) and matches it against DB `transactionId`
5. **`handleWebhook`** — on match, marks transaction `SUCCESS` and order `CONFIRMED` atomically

**Key SePay webhook fields:**

| Field | Type | Description |
|-------|------|-------------|
| `content` | `string` | Customer transfer description — **must match ref code** |
| `transferAmount` | `number` | Transfer amount in VND |
| `transferType` | `string` | `in` = incoming transfer |
| `gateway` | `string` | Bank name |
| `referenceCode` | `string` | Bank's own reference |

**Environment variables required:**

```env
SEPAY_BANK=VCB          # Bank code (e.g. VCB, TCB, MB)
SEPAY_ACCOUNT=1234567890  # Your bank account number
```

---

## WebSocket — Real-time Payment Status

The server exposes a Socket.IO namespace at `/payment` (same port as the HTTP server). Clients connect with a valid JWT and subscribe to a per-order room to receive live payment status updates.

### Connection

```js
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000/payment', {
  // Pass JWT in handshake auth OR Authorization header
  auth: { token: 'Bearer <accessToken>' },
});
```

If the token is missing or invalid the server immediately disconnects the client.

### Subscribe to an order

```js
// Tell the server which order to watch
socket.emit('subscribe_payment', { orderId: 42 });

// Server acknowledges
socket.on('subscribed', (data) => {
  console.log(data); // { orderId: 42, room: 'payment:42' }
});
```

### Incoming events

| Event | When fired | Payload |
|-------|-----------|--------|
| `payment:pending` | Immediately after `POST /payments/checkout` succeeds | `{ orderId, transactionId, status: "PROCESSING", paymentUrl, qrCode, provider }` |
| `payment:success` | After the gateway webhook confirms payment | `{ orderId, transactionId, status: "SUCCESS" }` |
| `payment:failed` | After the gateway signals failure/cancellation | `{ orderId, transactionId, status: "FAILED" }` |

### Full frontend example

```js
const socket = io('http://localhost:3000/payment', {
  auth: { token: `Bearer ${accessToken}` },
});

socket.emit('subscribe_payment', { orderId: 42 });

socket.on('payment:pending', ({ qrCode, paymentUrl }) => {
  // Show QR code image or redirect to payment URL
  showQr(qrCode);
});

socket.on('payment:success', () => {
  // Payment confirmed — navigate to order confirmation page
  router.push('/orders/42/confirmed');
});

socket.on('payment:failed', ({ status }) => {
  // Show error state
  showError(`Payment ${status}`);
});
```

### Server-side room naming

Each order gets its own room: `payment:{orderId}`. Only clients that have called `subscribe_payment` with that `orderId` receive its events.

---

## Standard Response Format

### Success

```json
{
  "success": true,
  "statusCode": 200,
  "data": { ... },
  "timestamp": "2026-05-19T04:10:00.000Z"
}
```

### Error

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": ["email must be an email"],
  "timestamp": "2026-05-19T04:10:00.000Z",
  "path": "/v1/auth/register"
}
```

---

## Authentication & Authorization

See [PERMISSIONS.md](./PERMISSIONS.md) for full details.

### Quick summary

- All routes require a valid JWT except those decorated with `@Public()`
- Customer routes check only JWT (no permission strings)
- Admin/Staff routes use `@Permissions('resource:action')` — permissions come from the role stored in JWT
- A role with `permissions: ["*"]` bypasses all permission checks

### Public routes

| Method | Path |
|--------|------|
| `POST` | `/v1/auth/login` |
| `POST` | `/v1/auth/admin/login` |
| `POST` | `/v1/auth/register` |
| `GET` | `/v1/products` |
| `GET` | `/v1/products/:id` |
| `GET` | `/v1/categories` |
| `GET` | `/v1/categories/:id` |
| `POST` | `/v1/payments/webhook/:provider` |

---

## Global Providers

| Provider | Scope | Description |
|----------|-------|-------------|
| `AuthGuard` | `APP_GUARD` | JWT verification + RBAC permission check on every route |
| `TransformInterceptor` | `APP_INTERCEPTOR` | Wraps all responses in `{ success, statusCode, data, timestamp }` |
| `AuditLogInterceptor` | `APP_INTERCEPTOR` | Writes every request/response to `audit_logs` table |
| `AllExceptionsFilter` | `APP_FILTER` | Catches all exceptions and returns structured error responses |
| `PermissionValMiddleware` | Middleware (`*`) | Attaches `PermissionVal` and `AsyncLocalStorage` context to every request |

---

## Data Layer — Queries & Repositories

Every Prisma model has a dedicated **Queries** class (reads) and **Repository** class (writes), both extending `BaseRepository`. All are provided and exported from `SharedModule`.

| Model | Queries | Repository |
|-------|---------|-----------|
| User | `UserQueries` | `UserRepository` |
| Role | `RoleQueries` | `RoleRepository` |
| AuditLog | `AuditLogQueries` | `AuditLogRepository` |
| Category | `CategoryQueries` | `CategoryRepository` |
| Product | `ProductQueries` | `ProductRepository` |
| CustomerProfile | `CustomerProfileQueries` | `CustomerProfileRepository` |
| Cart | `CartQueries` | `CartRepository` |
| CartItem | `CartItemQueries` | `CartItemRepository` |
| Order | `OrderQueries` | `OrderRepository` |
| PaymentTransaction | `PaymentTransactionQueries` | `PaymentTransactionRepository` |

`BaseRepository.joinTransaction(tx)` returns a new instance of the repository bound to a Prisma transaction client — use this inside `prisma.$transaction()` for atomic multi-step writes.

---

## Running the Application

### Local development

```bash
# Install dependencies
npm install

# Copy env file
cp .env.example .env

# Run DB migrations
npx prisma migrate dev

# Start dev server (watch mode)
npm run start:dev
```

### Production build

```bash
npm run build
npm run start:prod
```

---

## Docker

```bash
# Start all services (postgres + app + ngrok)
docker compose up -d

# Rebuild image after code changes
docker compose up -d --build

# View app logs
docker logs nestjs_app -f

# Run migrations inside container (manual)
docker exec nestjs_app npx prisma migrate deploy
```

**Services:**

| Service | Port | Description |
|---------|------|-------------|
| `nestjs_app` | `3000` | NestJS application |
| `nestjs_postgres` | `5432` | PostgreSQL database |
| `ngrok` | `4040` | Tunnel — inspect at `http://localhost:4040` |

The `nestjs_app` container runs `prisma migrate deploy` automatically on startup before `node dist/main`.


