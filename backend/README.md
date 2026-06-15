# Cargo Warehouse Inventory System — Backend API

This folder contains the complete, production-ready backend for the **Cargo Warehouse Inventory System**, built with Node.js, Express.js, and MySQL.

## Tech Stack
* **Runtime:** Node.js (v18+)
* **Framework:** Express.js
* **Database:** MySQL (via `mysql2/promise` pool)
* **Auth:** JSON Web Tokens (JWT) & `bcryptjs` password hashing
* **Validation:** `express-validator` middleware
* **Logging:** `morgan` (dev HTTP logger) & internal `activity_logs` audit trail

---

## Folder Structure
```text
backend/
├── config/
│   ├── db.js             # MySQL Pool & Connection tester
│   ├── schema.sql        # Database schema definition
│   └── seed.sql          # Sample test data
├── controllers/          # Endpoint handler controllers
├── middleware/           # Auth, Roles, Error & Validator middlewares
├── models/               # Thin active-record database models
├── routes/               # Express endpoints routers
├── services/             # Core business logic handlers
├── utils/                # Weight calculators, JWT & Paginate helpers
├── .env.example          # Template for environment settings
├── app.js                # Express app & route definition
├── server.js             # Entrypoint script
└── postman_collection.json # Exported Postman tests
```

---

## Quick Start Setup

### 1. Install Dependencies
Navigate into the backend folder and install the NPM packages:
```bash
cd backend
npm install
```

### 2. Configure Environment variables
Create a `.env` file from the example:
```bash
cp .env.example .env
```
Open `.env` and fill in your MySQL details:
```ini
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=cargo_warehouse

JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
```

### 3. Initialize & Seed Database
First, verify your MySQL server is running. Create and load the tables and dummy data using your command terminal:
```bash
# Initialize schema (Creates database 'cargo_warehouse' and tables)
mysql -u root -p < config/schema.sql

# Insert Seed Data
mysql -u root -p cargo_warehouse < config/seed.sql
```
*Alternatively, you can run the npm shortcuts if MySQL is globally accessible:*
```bash
npm run db:init
npm run db:seed
```

### 4. Run the Server
To run in hot-reload mode:
```bash
npm run dev
```
To run in production mode:
```bash
npm start
```
The server will boot and display:
```text
✅ MySQL connected successfully
🚀 Server running in development mode on port 5000
```

---

## Seed Credentials
Once seeded, you can log in with these pre-registered users (all share the password `Password@123`):

1. **Admin:** `admin@cargowarehouse.com`
2. **Warehouse Staff:** `warehouse@cargowarehouse.com`
3. **Operations Staff:** `ops@cargowarehouse.com`

---

## Business Logic Rules
**Volumetric (Chargeable) Weight calculation:**
* Formula: `chargeable_weight = (length * width * height) / 6000`
* Billing weight is determined by: `billing_weight = MAX(actual_weight, chargeable_weight)`
* This calculation occurs automatically in `cargoService.js` on creation and updates.

---

## API Endpoints List

### Authentication Module
* `POST /api/auth/register` - Create user
* `POST /api/auth/login` - Authenticate user & get JWT token
* `GET /api/auth/profile` - Retrieve caller user profile

### Cargo Module
* `GET /api/cargo` - Search, filter, and page cargo records
* `GET /api/cargo/:id` - Read single cargo details
* `POST /api/cargo` - Create new cargo (*Admin, Warehouse Staff*)
* `PUT /api/cargo/:id` - Update cargo status or parameters (*Admin, Warehouse Staff*)
* `DELETE /api/cargo/:id` - Delete cargo record (*Admin*)

### Warehouse Module
* `GET /api/warehouse/zones` - Get list of storage zones & capacities
* `POST /api/warehouse/zones` - Create warehouse zone (*Admin*)
* `GET /api/warehouse/locations` - Retrieve storage racks within zones
* `POST /api/warehouse/locations` - Create shelf locations (*Admin*)
* `GET /api/warehouse/occupancy` - Summary percentage capacity

### Dispatch Module
* `GET /api/dispatch` - List all shipments
* `GET /api/dispatch/:id` - Show single dispatch details
* `POST /api/dispatch` - Schedule shipment for cargo (*Admin, Operations Staff*)
* `PUT /api/dispatch/:id` - Update driver, vehicle, or status (*Admin, Operations Staff*)

### Dashboard Module
* `GET /api/dashboard` - Combined statistics, zones capacity, actions log, and notifications

### Activity Logs
* `GET /api/activity-logs` - Query-able audit records log (*Admin*)

### Notifications Module
* `GET /api/notifications` - Retrieve list of warehouse alert flags
* `PUT /api/notifications/:id/read` - Mark specific notification read
