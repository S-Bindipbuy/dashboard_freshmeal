# 🍔 Food App Dashboard — Project Documentation

A SvelteKit-based internal dashboard for managing a food delivery business:
orders, branches, menu items, customers, and kitchen view.

---

## Table of Contents

1. [Tech Stack](#1-tech-stack)
2. [Project Structure](#2-project-structure)
3. [Data Store](#3-data-store)
4. [Routes / Pages](#4-routes--pages)
5. [Components](#5-components)
6. [Branch & Order Map Feature](#6-branch--order-map-feature)
7. [Order Routing Logic](#7-order-routing-logic)
8. [Type Reference](#8-type-reference)

---

## 1. Tech Stack

| Technology | Role |
|---|---|
| [SvelteKit](https://kit.svelte.dev) | Full-stack framework (routing, SSR, layouts) |
| Svelte 5 | UI components with runes (`$state`, `$props`, `$derived`) |
| TypeScript | Type safety across stores and components |
| Deno | Runtime & package manager (via `deno.lock`) |
| Vite | Dev server & bundler |
| Vanilla CSS | Styling — no frameworks |

---

## 2. Project Structure

```
src/
├── app.css                   # Global design tokens & base styles
├── app.html                  # Root HTML shell
├── lib/
│   ├── components/
│   │   ├── Header.svelte     # Top header bar
│   │   ├── Sidebar.svelte    # Navigation sidebar
│   │   ├── StatsCard.svelte  # KPI stat cards (dashboard)
│   │   ├── OrdersTable.svelte# Orders list with branch & distance columns
│   │   └── OrderMap.svelte   # SVG map: branch pins + order point markers
│   ├── stores/
│   │   └── dashboard.ts      # Central Svelte writable stores + all business logic
│   └── index.ts              # Re-exports
└── routes/
    ├── +layout.svelte        # Root layout (sidebar + main slot)
    ├── +page.svelte          # Dashboard Overview
    ├── orders/+page.svelte   # Mobile Orders + Map
    ├── chef/+page.svelte     # Kitchen View
    ├── menu/+page.svelte     # Menu / Products
    ├── customers/+page.svelte# Customer list
    └── branches/+page.svelte # Store Branches management
```

---

## 3. Data Store

**File:** [`src/lib/stores/dashboard.ts`](file:///home/Spider/svelte/src/lib/stores/dashboard.ts)

All application state lives here as Svelte `writable` stores. There is no backend — data is in-memory and resets on page reload.

### Stores

| Store | Type | Description |
|---|---|---|
| `orders` | `writable<Order[]>` | All customer orders |
| `menu` | `writable<MenuItem[]>` | Available menu items |
| `customers` | `writable<Customer[]>` | Registered customers |
| `branches` | `writable<Branch[]>` | Physical store branches with GPS coords |
| `stats` | `derived<Stats>` | Auto-computed KPIs from `orders` |

### Exported Functions

| Function | Signature | Description |
|---|---|---|
| `updateOrderStatus` | `(id, status) → void` | Change an order's status |
| `routeAndAddOrder` | `(customer, total, location, branches) → void` | Create a new order auto-routed to the nearest branch |
| `toggleMenuAvailability` | `(id) → void` | Toggle a menu item on/off |
| `addMenuItem` | `(item) → void` | Add a new menu item |
| `toggleBranchStatus` | `(id) → void` | Open/close a branch |
| `addBranch` | `(branch) → void` | Register a new branch |
| `getDistanceKm` | `(loc1, loc2) → number` | Haversine distance between two GPS points |

---

## 4. Routes / Pages

### `/` — Dashboard Overview

Displays four KPI cards and a recent orders table with a sparkline chart.

**KPIs shown:**

| Card | Source |
|---|---|
| Today's Orders | `stats.todaysOrders` |
| Revenue | `stats.revenue` |
| Active Users | hardcoded `92` |
| Avg. Order Value | `stats.avgOrder` |

---

### `/orders` — Mobile Orders

> **This is where the Branch & Order Map was added.**

Two sections:

1. **📍 Branch & Order Point Map** — visual SVG map (see §6)
2. **All Orders** — full table with Branch, Distance, Status columns

---

### `/branches` — Store Branches

- Lists all branches in a card grid with active/closed badge
- Form to **add a new branch** (name, address, phone, lat/lng)
- Toggle button to open/close each branch

> [!NOTE]
> Latitude/Longitude fields were removed from the visible form UI but are still handled internally via `addBranch()`. You can re-expose them if manual GPS entry is needed.

---

### `/menu` — Menu / Products

CRUD-style page for menu items. Each item has:
- Name, Price, Availability toggle

---

### `/chef` — Kitchen View

Live view of orders filtered to show kitchen-relevant statuses (Pending / In Progress).

---

### `/customers` — Customers

Lists customers with order count.

---

## 5. Components

### `Sidebar.svelte`

Fixed left navigation. Highlights the active route using `page.url.pathname`.

**Nav links:**

| Label | Path |
|---|---|
| Overview | `/` |
| Mobile Orders | `/orders` |
| Kitchen View | `/chef` |
| Menu / Products | `/menu` |
| Customers | `/customers` |
| Store Branches | `/branches` |

---

### `StatsCard.svelte`

Accepts `title`, `value`, and optional `change` (e.g. `+8%`). Renders a coloured KPI tile.

---

### `OrdersTable.svelte`

Renders an orders table.

**Props:**

| Prop | Type | Default |
|---|---|---|
| `orders` | `Order[]` | `[]` |
| `branches` | `Branch[]` | `[]` |

**Columns:**

| Column | Source |
|---|---|
| Order | `o.id` |
| Customer | `o.customer` |
| Branch | resolved from `o.branchId` via `branches` |
| Dist (km) | `o.distanceKm` |
| Total | `o.total` |
| Status | dropdown (`Pending` / `Completed` / `Cancelled`) |
| Time | `o.time` |

---

### `OrderMap.svelte`

**New component** — pure SVG interactive map for the HCMC bounding box.

**Props:**

| Prop | Type | Default |
|---|---|---|
| `branches` | `Branch[]` | `[]` |
| `orders` | `Order[]` | `[]` |

See §6 for full details.

---

## 6. Branch & Order Map Feature

**File:** [`src/lib/components/OrderMap.svelte`](file:///home/Spider/svelte/src/lib/components/OrderMap.svelte)

### What it shows

```
 [Branch Pin 🏢] -------(dashed line)------- [Customer Dot ●]
```

| Visual Element | Meaning |
|---|---|
| Coloured circle with 🏢 | Branch location (grey = closed) |
| Small dot | Customer order location |
| Dashed line | Assignment link (customer → nearest branch) |
| Animated pulse ring | Order is still **Pending** |
| Hover tooltip | Shows name + status on hover |

### Map Projection

The map uses a simple **linear projection** over the HCMC bounding box:

```
LAT:  10.68 – 10.85  →  Y axis (inverted, north = up)
LNG: 106.62 – 106.78  →  X axis
```

No external map library is used. The SVG is `760 × 420` units and scales fluidly via `viewBox`.

### Colour Coding

Branches are assigned colours from a fixed palette in index order:

| Index | Colour |
|---|---|
| 0 | `#0b74de` (blue) |
| 1 | `#e84393` (pink) |
| 2 | `#f59e0b` (amber) |
| 3 | `#10b981` (green) |
| 4 | `#8b5cf6` (purple) |

Each order dot and its connecting dashed line use the **same colour as its assigned branch**.

### Legend

Rendered below the SVG, listing each branch name with its colour swatch, a grey dot for unassigned customer locations, and an animated pulse for pending orders.

---

## 7. Order Routing Logic

**Function:** `routeAndAddOrder()` in `dashboard.ts`

When a new order is placed from the mobile app:

```
1. Filter branches to active only
2. For each active branch, compute Haversine distance to customer GPS
3. Assign the order to the closest branch (minimum distance)
4. If ALL branches are closed, fall back to routing among all branches
5. Append the new order to the top of the orders list
```

### Haversine Formula

```
R = 6371 km (Earth radius)
dLat = (lat2 - lat1) * π/180
dLng = (lng2 - lng1) * π/180
a = sin²(dLat/2) + cos(lat1) * cos(lat2) * sin²(dLng/2)
c = 2 * atan2(√a, √(1-a))
distance = R * c
```

---

## 8. Type Reference

```typescript
type LatLng = { lat: number; lng: number };

type Order = {
  id: string;
  customer: string;
  customerLocation: LatLng;
  total: string;                              // e.g. "$23.50"
  status: 'Pending' | 'Completed' | 'Cancelled';
  time: string;                               // e.g. "10:12"
  branchId?: string;                          // assigned branch ID
  distanceKm?: number;                        // distance to assigned branch
};

type MenuItem = {
  id: string;
  name: string;
  price: string;
  available: boolean;
};

type Customer = {
  id: string;
  name: string;
  orders: number;
};

type Branch = {
  id: string;
  name: string;
  address: string;
  phone: string;
  active: boolean;
  location: LatLng;
};
```

---

> [!TIP]
> To add a real map tile background, consider integrating **Leaflet.js** or **MapLibre GL** as a future enhancement. The current SVG approach is dependency-free and instant to load.

> [!NOTE]
> All data is in-memory. To persist across sessions, replace the `writable()` stores with a backend API or `localStorage`-backed stores.
