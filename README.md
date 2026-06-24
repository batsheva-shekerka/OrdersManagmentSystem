# Goldie's Food Ordering System

A full-stack food ordering system with a loyalty/points program, real-time order updates, and an admin panel.

- **Backend:** Node.js + Express + Mongoose (MongoDB), JWT auth, Socket.IO
- **Frontend:** Angular 18 (standalone components, Reactive Forms)

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [Running the App](#running-the-app)
- [Seeding the Database](#seeding-the-database)
- [Default Accounts](#default-accounts)
- [Environment Variables](#environment-variables)
- [API Overview](#api-overview)
- [Smoke Test](#smoke-test)

---

## Tech Stack

| Layer       | Technology                                                        |
| ----------- | ----------------------------------------------------------------- |
| Backend     | Node.js, Express 4, Mongoose 8 (CommonJS)                         |
| Database    | MongoDB                                                           |
| Auth        | JWT (`jsonwebtoken`) + `bcrypt`                                   |
| Validation  | `express-validator`                                              |
| Real-time   | Socket.IO                                                         |
| Uploads     | `multer` (stored locally in `/uploads`, served statically)       |
| Logging     | `morgan`                                                          |
| Frontend    | Angular 18, RxJS, `socket.io-client`                             |

---

## Project Structure

```
OrdersManagmentSystem/
├── server.js                # Entry point: env, DB connect, Socket.IO, listen
├── src/
│   ├── app.js               # Express app (CORS, JSON, static, routes, errors)
│   ├── seed.js              # Seeds admin, categories, products, points tiers
│   ├── config/              # db.js (Mongo connection), env.js (env vars)
│   ├── models/              # Mongoose schemas (User, Category, Product, Order, ...)
│   ├── controllers/         # HTTP handlers (req/res only)
│   ├── services/            # Business logic (auth, orders, loyalty)
│   ├── routes/              # REST endpoints under /api
│   ├── middlewares/         # auth, authorize, validate, error, logger
│   ├── validators/          # express-validator rule sets
│   ├── utils/               # ApiError, asyncHandler, upload
│   └── sockets/             # Socket.IO setup + order event helpers
├── client/                  # Angular 18 frontend
│   └── src/app/
│       ├── features/        # menu, cart, checkout, auth, orders, admin
│       └── core/            # services, guards, interceptors, models
├── .env.example             # Template for environment variables
└── README.md
```

---

## Prerequisites

Make sure the following are installed:

- **Node.js** 18+ and npm
- **MongoDB** 6+ (running locally, or a MongoDB Atlas connection string)
- **Angular CLI** (optional; `npx ng` works without a global install)

Verify your versions:

```bash
node -v
npm -v
mongod --version
```

---

## Setup

### 1. Backend

From the project root (`OrdersManagmentSystem/`):

```bash
npm install
```

Create your local environment file by copying the example:

```bash
# Windows (PowerShell)
Copy-Item .env.example .env

# macOS / Linux
cp .env.example .env
```

Then review `.env` and adjust values if needed (see [Environment Variables](#environment-variables)).

### 2. Frontend

```bash
cd client
npm install
cd ..
```

---

## Running the App

You need **three** things running: MongoDB, the backend, and the frontend.

### 1. Start MongoDB

If MongoDB is installed locally as a service it may already be running. Otherwise start it manually:

```bash
# Windows (if installed as a service)
net start MongoDB

# Or run mongod directly (any OS), pointing to a data folder
mongod --dbpath "C:\data\db"
```

### 2. Start the backend (port 3000)

From the project root:

```bash
npm run dev      # auto-restarts on file changes (node --watch)
# or
npm start        # plain start
```

The API will be available at `http://localhost:3000` and the health check at
`http://localhost:3000/api/health`.

### 3. Start the frontend (port 4200)

In a **separate terminal**:

```bash
cd client
npm start
```

Open `http://localhost:4200` in your browser.

---

## Seeding the Database

This creates the admin user, a sample category, three products, and three loyalty tiers.
Make sure MongoDB is running first.

```bash
npm run seed
```

Re-running the seed is safe: it skips records that already exist.

---

## Default Accounts

After seeding, you can log in as the admin:

| Role  | Email              | Password   |
| ----- | ------------------ | ---------- |
| Admin | `admin@goldis.com` | `admin123` |

> Change these credentials before deploying anywhere public.

---

## Environment Variables

Defined in `.env` (copied from `.env.example`):

| Variable         | Example                                   | Description                                      |
| ---------------- | ----------------------------------------- | ------------------------------------------------ |
| `PORT`           | `3000`                                    | Port the backend listens on                      |
| `MONGO_URI`      | `mongodb://127.0.0.1:27017/goldis`        | MongoDB connection string                        |
| `JWT_SECRET`     | `change_me_in_production`                 | Secret used to sign JWTs (change for production) |
| `JWT_EXPIRES_IN` | `7d`                                      | JWT lifetime                                     |
| `CLIENT_ORIGIN`  | `http://localhost:4200`                   | Allowed CORS origin (the Angular dev server)     |

> `.env` is gitignored. Never commit real secrets.

---

## API Overview

Base path: `/api`. All write operations on shop/admin resources require an admin JWT.

| Method | Endpoint                              | Auth        | Description                                  |
| ------ | ------------------------------------- | ----------- | -------------------------------------------- |
| GET    | `/api/health`                         | Public      | Health check                                 |
| POST   | `/api/auth/register`                  | Public      | Register a customer                          |
| POST   | `/api/auth/login`                     | Public      | Log in (customer or admin), returns JWT      |
| GET    | `/api/auth/me`                        | Customer    | Current user profile                         |
| GET    | `/api/categories`                     | Public      | List categories                             |
| POST   | `/api/categories`                     | Admin       | Create a category                            |
| PUT    | `/api/categories/:id`                 | Admin       | Update a category                            |
| DELETE | `/api/categories/:id`                 | Admin       | Delete a category                            |
| GET    | `/api/products`                       | Public      | List products                               |
| GET    | `/api/products/:id`                   | Public      | Get one product                             |
| POST   | `/api/products`                       | Admin       | Create a product (supports image upload)     |
| PUT    | `/api/products/:id`                   | Admin       | Update a product                             |
| PATCH  | `/api/products/:id` (stock)           | Admin       | Update product stock/status                  |
| DELETE | `/api/products/:id`                   | Admin       | Delete a product                             |
| POST   | `/api/orders`                         | Guest/Cust. | Place an order (guest or logged-in)          |
| GET    | `/api/orders`                         | Admin       | List all orders                             |
| GET    | `/api/orders/mine`                    | Customer    | List the current user's orders               |
| GET    | `/api/orders/:id`                     | Customer    | Get one order                               |
| PATCH  | `/api/orders/:id/status`              | Admin       | Update an order's status                     |
| PATCH  | `/api/orders/:id/items/:itemId/status`| Admin       | Update a single order item's status          |
| GET    | `/api/tiers`                          | Admin       | List loyalty tiers                          |
| POST   | `/api/tiers`                          | Admin       | Create a loyalty tier                        |
| PUT    | `/api/tiers/:id`                      | Admin       | Update a loyalty tier                        |
| DELETE | `/api/tiers/:id`                      | Admin       | Delete a loyalty tier                        |

### Loyalty / Points

- Points are earned per order based on the matching `PointsTier` (`pointsPercentage`, where 1 point = 1 NIS).
- The current balance is denormalized on `User.loyaltyBalance`; full history lives in the append-only `LoyaltyTransaction` collection.

### Real-time (Socket.IO)

- Clients connect to `http://localhost:3000`.
- `admin:join` joins the admin room for live order notifications.
- `order:join` (with an order id) joins a per-order room for status updates.

---

## Smoke Test

An end-to-end PowerShell script exercises the main flow (health, admin login, products, customer order, points).

Prerequisites: server running (`npm run dev`) and database seeded (`npm run seed`).

```powershell
powershell -ExecutionPolicy Bypass -File .\test-flow.ps1
```
