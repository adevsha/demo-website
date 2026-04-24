# demo-website

A small e-commerce website you can click through in the browser: sign in, browse products, fill a cart, apply a discount code, place an order, and look at what you bought. It talks to [demo-rest](../demo-rest) for all of its data.

The point of this repo is to be **readable and approachable**. It's built with plain HTML, CSS, and TypeScript — no React, no Vue, no bundler setup to learn. If you've written a web page before, the code here will look familiar. If you haven't, each screen is one file you can open and follow top-to-bottom.

It's useful as:

- A friendly demo to show what the demo-rest API can do, without having to type `curl` commands.
- A test target for the Playwright scenarios in [demo-testing](../demo-testing).
- A starting point for learning modern web development on the [Bun](https://bun.sh) runtime.

---

## Table of contents

1. [What you'll see](#1-what-youll-see)
2. [How the three repos fit together](#2-how-the-three-repos-fit-together)
3. [Quick start (5 minutes)](#3-quick-start-5-minutes)
4. [First walkthrough — click through the app](#4-first-walkthrough--click-through-the-app)
5. [The eight pages at a glance](#5-the-eight-pages-at-a-glance)
6. [How the API proxy works (and why)](#6-how-the-api-proxy-works-and-why)
7. [Running without containers](#7-running-without-containers)
8. [Configuration](#8-configuration)
9. [Project layout](#9-project-layout)
10. [For testers — the `data-testid` contract](#10-for-testers--the-data-testid-contract)
11. [Troubleshooting](#11-troubleshooting)
12. [Shutting down](#12-shutting-down)

---

## 1. What you'll see

Open `http://localhost:3000` in a browser and you get a warm, minimal store front with:

- **A sign-in page** — seeded accounts (any of the 10 demo users, password `password123`).
- **A product catalog** — 10 products with prices and in-stock badges.
- **A product detail page** with an **Add to cart** button.
- **A checkout page** that accepts discount codes (`WELCOME10` for 10% off, `SAVE20` for 20% off).
- **An orders page** listing everything you've bought, with a running total.
- **A profile page** showing your name, email, age, lifetime order count, total spent, and top product — all pulled live from the backend.

There's no placeholder data. Every number on screen is the real response from demo-rest.

## 2. How the three repos fit together

```
   ┌───────────────┐        ┌──────────────────┐        ┌──────────────────────┐
   │   Browser     │  HTML  │   demo-website   │  REST  │      demo-rest       │
   │  :3000        ├───────►│  (Bun server)    ├───────►│  (FastAPI + MySQL    │
   │               │        │  /api/* → proxy  │        │   + Mongo + Kafka)   │
   └───────────────┘        └──────────────────┘        └──────────────────────┘
                                                                 ▲
                                                                 │
                                                      ┌──────────┴──────────┐
                                                      │    demo-testing     │
                                                      │  (Cucumber + Java   │
                                                      │  REST + Playwright) │
                                                      └─────────────────────┘
```

- **demo-rest** does the real work: stores users and products in MySQL, orders in MongoDB, and emits change events to Kafka. You talked to it directly with `curl` in that repo's README — this site is a friendlier way in.
- **demo-website** (this repo) is the browser-facing UI. It never connects to MySQL or Kafka; it only calls demo-rest over HTTP.
- **demo-testing** is the automated test suite. For the web pages it drives a real browser with Playwright; it finds elements on the page using `data-testid` attributes that this repo defines and freezes (see [section 10](#10-for-testers--the-data-testid-contract)).

## 3. Quick start (5 minutes)

### What you need

- [**Podman**](https://podman.io/) (or Docker) with `compose` support — recommended.
- **demo-rest running** on `localhost:8000`. If it isn't, from the `demo-rest` folder:

  ```bash
  docker compose up -d --wait
  ```

### Bring the website up

From this folder:

```bash
podman compose up -d --build
```

First build takes a minute or two (it downloads Bun and builds Tailwind). Re-runs take seconds.

Then open **http://localhost:3000** in a browser.

### Shortcut: no containers, just Bun

If you already have [Bun](https://bun.sh/) 1.2+ installed and demo-rest running on `localhost:8000`:

```bash
bun install
bun run dev
```

Same URL.

## 4. First walkthrough — click through the app

Everything below happens in the browser. No terminal needed.

### Step 1 — sign in

Go to **http://localhost:3000**. You land on the sign-in page.

| Field | Value |
|---|---|
| Email | `alice@example.com` |
| Password | `password123` |

Click **Sign in**. You'll land on the product catalog.

> All 10 seeded users share the same password. Try `bob@example.com` or any of the others from `demo-rest` if you want.

### Step 2 — browse and add to cart

- Scroll the product list. Monitor and Headphones are out of stock — they show a grey **Out of stock** badge.
- Click any other product (say, **Laptop**). You go to the detail page.
- Click **Add to cart**. The button briefly flashes "Added ✓".
- Click **← Products** to go back, then add a second product the same way (say, **Mechanical Keyboard**).

> Your cart is saved in the browser's local storage, so a page refresh keeps it.

### Step 3 — check out with a discount

- Click the cart link in the detail page (**View cart**), or navigate to `/checkout` in the URL.
- You'll see each item in your cart with price and quantity. Use the **+** and **−** buttons to adjust, or **✕** to remove.
- Type `WELCOME10` into the **Discount code** box.
- Click **Place order**.

You'll see a confirmation like:

```
Order placed!
Confirmation: ORD-D736511F2D30
Discount applied: $130.00
Total: $1169.97
```

### Step 4 — look at your orders

- Click **Orders** in the top nav.
- You'll see your lifetime stats (Orders: 1, Total spent: $1169.97, Top product: Laptop) and the order you just placed.
- Click the order to see each line item with its unit price and quantity.

### Step 5 — edit your profile

- Click **Profile** in the top nav.
- You'll see Alice's name, email, and age, plus the same lifetime stats.
- Click **Edit**. The card becomes a form — change the age to `31`, click **Save**.
- The card re-renders with the new age.

### Step 6 — sign out and back in

- Click **Logout** in the top-right. You land back on the sign-in page.
- Sign in again as Alice — your orders and profile are still there (the backend persists them).

Try the same flow as `bob@example.com` / `password123`. Bob sees his own orders, not Alice's — the UI scopes everything to the currently-signed-in user.

## 5. The eight pages at a glance

| Page | URL | What it shows |
|---|---|---|
| Login | `/login` | Email + password form. Shows an inline error on bad credentials. |
| Products list | `/products` | All 10 seeded products with name, price, in-stock badge. |
| Product detail | `/products/{id}` | Full description, price, stock count, and an **Add to cart** button. |
| Create product | `/products/new` | Form for adding a new product. Sends a `POST /products/` to demo-rest. |
| Checkout | `/checkout` | Cart summary, discount-code input, **Place order** button. |
| Orders list | `/orders` | Your lifetime order count, total spent, top product, and every order you've placed. |
| Order detail | `/orders/{id}` | Line items, server-computed total, timestamp, and a **Delete** button. |
| Profile | `/profile` | Name, email, age, lifetime stats. **Edit** swaps the card into a form. |

Navigation between pages happens in the browser without a full reload — this is a single-page app driven by a tiny History API router (`src/lib/router.ts`).

## 6. How the API proxy works (and why)

When you're on `http://localhost:3000/products` and the page fetches products, the request goes to:

```
GET http://localhost:3000/api/products/
```

**not** directly to demo-rest on port 8000. The Bun server takes `/api/*`, strips the `/api` prefix, and forwards to demo-rest:

```
   Browser
     │   GET /api/products/      (same-origin — no CORS problem)
     ▼
   Bun server (:3000)
     │   GET /products/          (upstream call)
     ▼
   demo-rest (:8000)
```

Why route everything through one origin?

- **No CORS headaches**: the browser only talks to `:3000`, so demo-rest doesn't have to allow cross-origin requests.
- **One place to swap backends**: change `API_BASE_URL` at the server and every `/api/*` request follows. You can point the same website at staging, production, or a mock without rebuilding.
- **Secrets stay on the server**: the browser never learns the upstream URL, and the Bun server can attach headers (e.g. an upstream API key) without exposing them.

The proxy code is 50 lines: `src/lib/proxy.ts`.

## 7. Running without containers

If you already have Bun installed and want to hack on the code:

```bash
bun install           # first time only
bun run dev           # builds CSS + JS, starts server on :3000 with file watching
```

- **Source you can edit**: `src/**/*.ts`, `src/index.html`, `src/styles/app.css`.
- **Rebuild after changing frontend code**: `bun run build` (or kill and re-run `bun run dev`).
- **Backend target**: the server expects `http://localhost:8000` by default. Override with `API_BASE_URL=https://staging.example.com bun run dev`.

## 8. Configuration

All configuration happens through environment variables. The browser never sees them — they're read once when the Bun server starts.

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `3000` | Port the Bun server listens on |
| `API_BASE_URL` | `http://localhost:8000` | Upstream target for `/api/*` proxy |
| `NODE_ENV` | `development` | Set to `production` to disable file watching |
| `PUBLIC_DIR` | `dist` | Folder that holds the built `styles.css` and `main.js` |

When running in a container, `API_BASE_URL` is set to `http://host.containers.internal:8000` (Podman) or `http://host.docker.internal:8000` (Docker Desktop), both of which resolve to the host machine from inside the container.

Nothing here is a secret. There is no `.env` file and no build-time substitution into the JavaScript bundle.

## 9. Project layout

```
src/
├── index.html                  Shell page — loads one stylesheet and one script
├── main.ts                     Boots the app: mounts nav, starts the router
├── server.ts                   Bun.serve: static files + /api/* proxy + SPA fallback
├── styles/
│   └── app.css                 Tailwind v4: colour tokens + component classes
├── lib/
│   ├── api.ts                  fetch() wrapper with Bearer-token injection and 401 handling
│   ├── auth.ts                 login / logout / getUser (decodes JWT for user_id)
│   ├── proxy.ts                Server-side /api/* forwarder
│   ├── router.ts               History-API router (~100 lines, handles :params)
│   ├── state.ts                Pub/sub store: token + cart, both persisted to localStorage
│   └── types.ts                Shared TypeScript types (Product, Order, User, etc.)
├── components/
│   ├── nav.ts                  Top bar with login-state awareness
│   ├── loading.ts              Spinner
│   └── error-toast.ts          Dismissable toast for API errors
└── pages/                      One file per screen — each exports a render function
    ├── login.ts
    ├── products-list.ts
    ├── product-detail.ts
    ├── product-create.ts
    ├── checkout.ts
    ├── orders-list.ts
    ├── order-detail.ts
    └── profile.ts

public/                         Static assets served as-is (favicon, etc.)
dist/                           Build output (gitignored)
Dockerfile                      Two-stage build: Bun builder → slim runtime
docker-compose.yml              Single `web` service, ready for podman compose up
tailwind.config.js              Content globs (for editor autocomplete)
tsconfig.json                   strict TypeScript, ES2022, DOM libs enabled
SKILL.md                        Architecture and build decisions (for AI assistants)
```

Pages never import each other — they only import from `lib/` and `components/`. That makes them easy to read independently and swap out as the app grows.

## 10. For testers — the `data-testid` contract

Every interactive element on every page has a `data-testid` attribute with a stable, snake_case name. Playwright scenarios in `demo-testing` select elements with `page.getByTestId('login_button')` — no XPath, no class-name selectors, no fragile text matching.

A few examples (see `SKILL.md` section "Test-ID Contract" for the full table):

| Where | `data-testid` | What it selects |
|---|---|---|
| Login page | `login_email`, `login_password`, `login_button` | the three form elements |
| Nav bar | `nav_products`, `nav_orders`, `nav_profile`, `logout_button` | the four nav items |
| Product list | `product_row_1`, `product_row_2`, … | each product card (dynamic id) |
| Checkout | `checkout_discount_input`, `checkout_submit`, `checkout_confirmation_number` | inputs and results |
| Profile | `profile_name`, `profile_email`, `profile_order_count`, `profile_edit_button` | read-only fields and the edit trigger |

Renaming a `data-testid` is a breaking change for any test scenario that uses it. If you need to add one, add it — but don't rename existing ones without coordinating with the test suite.

## 11. Troubleshooting

**The page shows "Unable to load products" or "Upstream unreachable".**
demo-rest probably isn't running on port 8000. In another terminal:

```bash
curl http://localhost:8000/health
```

You should see `{"status":"healthy"}`. If not, start the backend (see [section 3](#3-quick-start-5-minutes)).

**Sign-in says "Invalid email or password" even with the seeded credentials.**
The seeded users are reset every time demo-rest's MySQL volume is wiped. Make sure you're using one of the seeded emails (`alice@example.com` through `carol@example.com` — see `demo-rest/app/data/seed.py`) and password `password123`.

**Logged in, then suddenly back at the login screen.**
JWTs issued by demo-rest expire after 30 minutes. The site detects the 401 and bounces you to `/login` automatically. Just sign in again.

**Changed a `src/` file but the browser shows the old version.**
`bun --watch` reloads the server, but it does *not* re-bundle the frontend. Run `bun run build` to rebuild `dist/main.js` and `dist/styles.css`, then refresh.

**Container can't reach demo-rest.**
If you're on Linux with Podman, the container uses `host.containers.internal`. On older Podman versions (< 4.4) or if you disabled the host-gateway alias, use the host's LAN IP instead:

```bash
API_BASE_URL=http://192.168.1.42:8000 podman compose up -d --build
```

**Port 3000 is already in use.**
Pick a different one:

```bash
PORT=4000 bun run dev
# or, in docker-compose.yml, change "3000:3000" to e.g. "4000:3000"
```

## 12. Shutting down

```bash
# Stop the container, keep the image
podman compose down

# Stop demo-rest too (from the demo-rest folder)
docker compose down

# Local Bun dev server: Ctrl-C in the terminal where `bun run dev` is running
```

Nothing persists on your machine outside of the Bun install cache and the Docker images themselves. Your cart is kept in the browser's localStorage, so clearing site data for `localhost:3000` resets it.
