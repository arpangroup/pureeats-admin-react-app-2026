# PureEats Admin & Restaurant Owner UI

A standalone React + TypeScript UI for the PureEats Admin panel and Restaurant Owner panel — built from the existing Laravel Blade views (`resources/views/admin/*`, `resources/views/restaurantowner/*`) as a UI-only replacement, ready to be wired up to the future Java/Spring Boot backend.

It runs **completely on its own**, no backend required: every screen is backed by organized, realistic mock data out of the box.

## Quick start

```bash
npm install
npm run dev
npm run dev:uat
```

Open the printed local URL, then sign in with one of the demo accounts shown on the login screen (any password works in mock mode):

- **Admin** — `arpan@pureeats.in`
- **Restaurant Owner** — `ravi@spicegarden.in`

## Switching from mock data to the live API

This is the one thing you change when the Spring Boot backend is ready — no component code changes required.

Edit `.env` (copy `.env.example` if you don't have one):

```bash
VITE_DATA_SOURCE=live
VITE_API_BASE_URL=https://your-api-host/api
```

That's it. Every screen re-points itself at the real API the next time the app runs.

### How the switch works

- `src/config/env.ts` reads `VITE_DATA_SOURCE` once into `IS_MOCK`.
- Every file in `src/services/*` is a thin wrapper: each method starts with `if (IS_MOCK) { …return mock data… } else { …call the real endpoint… }`.
- Pages and components only ever call `someService.list()` / `.get()` / `.create()` / etc. — they never know or care which branch ran.
- `src/lib/apiClient.ts` is the one Axios instance used for every live call (base URL, auth header injection, error shape normalization). Point it at a different backend by changing `VITE_API_BASE_URL` — nothing else to touch.
- REST paths used in live mode already follow a consistent `/resource`, `/resource/:id` shape per service — adjust them to match the actual Spring Boot controllers when the time comes.

## Authentication

`src/context/AuthContext.tsx` + `src/services/authService.ts` is a self-contained auth module:

- In mock mode, "login" just matches the email against the mock user list (any password accepted) and hands back a fake token.
- In live mode, it posts to `/auth/login` and expects `{ user, token }` back.
- The token is stored in `localStorage` and attached as `Authorization: Bearer <token>` to every live API call automatically.

To swap in real authentication (JWT, OAuth, session cookies, whatever Spring Security ends up using), you only need to edit `authService.ts` — `AuthContext`, `ProtectedRoute`, and every page calling `useAuth()` stay exactly as they are.

## Project structure

```
src/
  config/env.ts          Data-source switch (mock/live), API base URL
  types/                 TypeScript models mirroring the Laravel tables
  mocks/fixtures/        Organized dummy data, one file per domain
  lib/                   API client, mock pagination/search helpers, formatters
  services/               One file per resource — the mock/live switch lives here
  context/AuthContext.tsx Auth state (user, login, logout)
  hooks/                  useAsync (data fetching), useDebounce, useAuth
  components/
    ui/                   Buttons, inputs, modals, badges, tables — the design system
    layout/               Sidebar, topbar, Admin/Owner/Auth page shells
    resource/             Generic config-driven CRUD list+form (used by ~15 screens)
    orders/, items/, restaurants/, users/   Feature-specific shared views
  routes/                 React Router route tree + role-based route guarding
  pages/
    admin/                Every Admin panel screen
    restaurant-owner/     Every Restaurant Owner panel screen
    auth/                 Login
```

## Design decisions worth knowing about

- **Config-driven CRUD** (`src/components/resource/ResourceListPage.tsx`): most "manage a list of X" screens (item categories, addon categories, addons, coupons, locations, translations, pages, sliders, etc.) are one short config file — columns + form fields — rendered through a shared list/search/paginate/create/edit/delete component. This keeps ~15 screens consistent and cheap to maintain instead of duplicating table/modal/form boilerplate everywhere.
- **Mock data is organized like real rows**, in `src/mocks/fixtures/`, one file per domain, cross-referenced by id exactly like the Laravel tables (orders reference real restaurant/customer/item ids, etc.), so the dashboard, orders and detail screens all show consistent, believable numbers.
- **Role scoping**: the Restaurant Owner panel reuses the same services as Admin but scopes queries by the signed-in owner's restaurant(s) (`restaurantService.listByOwner`, filters on `userId`/`restaurantId`), so it's the same data layer, just narrower.
- **TypeScript models** in `src/types/entities.ts` mirror the Laravel table structure given for this project (Order, Restaurant, Item, Coupon, DeliveryGuyDetail, RestaurantPayout, Wallet, Transaction, etc.) so Spring Boot DTOs can be matched up field-by-field later.

## What's next when the backend is ready

1. Confirm the Spring Boot API's actual JSON field names and paths, and adjust `src/services/*` and the `apiPath` values passed to `createCrudService(...)` if they differ from the `/kebab-case` guesses used here.
2. Implement real auth in `authService.ts`.
3. Flip `VITE_DATA_SOURCE=live` in `.env`.
4. Everything else — routing, layouts, forms, tables — stays as-is.
#
