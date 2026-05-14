# fe-shop-nextjs

A modern e-commerce storefront built with **Next.js 16**, **React 19**, **Tailwind CSS v4**, and **NextAuth v5**. It consumes a REST API backend (see `docs/BE_DOCUMENT.md`) and supports guest browsing, authenticated cart management, order history, and user profiles.

---

## Tech Stack

| Layer | Library / Tool |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 |
| Auth | NextAuth v5 (Credentials provider) |
| HTTP client | Axios |
| State management | Zustand |
| Date formatting | Day.js |

---

## Features

- **Home page** — hero banner, shop-by-category grid, featured products
- **Product catalog** — search, category filter, pagination
- **Product detail** — images, description, add-to-cart
- **Shopping cart** — add / update quantity / remove items
- **Orders** — order history list and order detail view
- **Profile** — view and edit customer profile
- **Authentication** — login and register with JWT-based session via NextAuth

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx               # Home page
│   ├── layout.tsx             # Root layout (font, session provider)
│   ├── (auth)/                # Login & register pages
│   ├── (shop)/                # Authenticated shop layout (header + footer)
│   │   ├── products/          # Product list & detail
│   │   ├── cart/              # Shopping cart
│   │   ├── orders/            # Order history & detail
│   │   └── profile/           # User profile
│   └── api/auth/[...nextauth] # NextAuth route handler
├── components/
│   ├── common/                # Loading spinner, empty state
│   ├── layout/                # Header, footer
│   └── providers/             # SessionProvider wrapper
├── hooks/                     # useAuth, useDebounce
├── modules/auth/              # Login / register form components
├── services/                  # API service layer (product, cart, order, …)
├── store/                     # Zustand stores (cart, ui)
├── types/                     # Shared TypeScript types
└── utils/                     # Constants, helpers (formatPrice, formatDate)
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- A running backend API (see `docs/BE_DOCUMENT.md`)

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/v1
AUTH_SECRET=your-nextauth-secret
```

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL of the backend REST API |
| `AUTH_SECRET` | Secret used by NextAuth to sign session tokens |

### Running Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Other Scripts

```bash
npm run build   # Production build
npm run start   # Start production server
npm run lint    # Run ESLint
```

---

## API Integration

All HTTP calls go through `src/services/api-client.ts`, which creates two Axios instances:

- **`publicClient`** — unauthenticated requests (products, categories)
- **`apiClient`** — authenticated requests; automatically attaches the JWT `Bearer` token from the NextAuth session

The token is injected via `setApiToken()` called from the `SessionProvider` once the session is resolved, preventing race conditions on page reload.

---

## Authentication Flow

1. User submits credentials on `/login`
2. NextAuth `Credentials` provider calls `POST /auth/login` on the backend
3. On success, the JWT access token is decoded and stored in the NextAuth session
4. `SessionProvider` calls `setApiToken()` so all subsequent API calls are authenticated
5. `useAuth()` hook exposes `user`, `isAuthenticated`, and `logout()`

---

## Deployment

Build the production bundle and start the server:

```bash
npm run build
npm run start
```

For cloud deployment, [Vercel](https://vercel.com) is the recommended platform — import the repository, set the environment variables, and deploy.

