# 🍲 Smart Hostel / PG Food Waste Management & Kitchen Planning System

An enterprise-grade, full-stack web application designed for PG accommodations and hostel messes to dramatically reduce food waste, optimize meal preparation quantities, track cost & carbon footprint, manage NGO surplus donations, and gamify resident meal attendance.

---

## 🌟 Key Features

### 👨‍💼 For Hostel / Mess Managers
- **Smart Prep Planner**: ML/heuristic engine calculating optimal kitchen batch sizes using historical weekday consumption (4–8 weeks), approved cart trends, resident meal skip headcounts, and dynamic buffer adjustments (+10%).
- **Cart Approvals & Real-Time Stock Sync**: Real-time deduction of ingredients/portions upon cart approval with automatic stock threshold updates (`available`, `low_stock`, `out_of_stock`). Blocks approval if stock is insufficient and automatically restores stock upon rejection.
- **Surplus Food Donation Hub**: Log food donations in kilograms directly to verified partner NGOs. Computes net wasted food accurately: $\text{Wasted} = \text{Prepared} - \text{Consumed} - \text{Donated}$. Reusable NGO directory included.
- **Recipe Quality & Waste Correlation**: Correlates resident dish ratings with waste percentages, automatically identifying dishes with $<3.0$ rating and $>25\%$ waste as **"Review Recipe"**.
- **Financial & Environmental Reports**: Real-time waste cost calculation (INR ₹) using per-item costs, carbon emissions tracking ($2.5\text{ kg CO}_2\text{e}$ per kg waste), monthly waste reduction targets with dynamic progress bars, week-over-week analytics, and 1-click **PDF & CSV export**.
- **Issue & Complaint Resolution**: Triaged priority system (Low, Medium, High) for dining issues and resident feedback.

### 🧑‍🎓 For Residents
- **Interactive Food Ordering**: Real-time stock status badges, preventing out-of-stock ordering and displaying available inventory quantities.
- **Meal Skip Planner**: Interactive weekly calendar enabling residents to signal upcoming meal absences (`breakfast`, `lunch`, `dinner`) to instantly adjust kitchen preparation headcounts.
- **Zero Waste Hero Leaderboard**: Gamified badge & ranking system rewarding residents with the highest skip reliability and lowest food waste.
- **Real-Time In-App Notifications**: Instant bell alerts on cart status changes (approved/rejected), complaint resolutions, and newly published mess menus.
- **Dish Ratings & Feedback**: Submit 1–5 star dish reviews with specific suggestions.

### ♿ Accessibility & Aesthetics
- **Responsive & Mobile-First**: Tested across desktop, tablet, and mobile viewports (down to 375px) with $\ge 44\text{px}$ touch targets, WCAG AA contrast, and mobile card layouts.
- **Motion & 3D Interactive Canvas**: Three.js / React Three Fiber interactive background with automated `prefers-reduced-motion` compliance.

---

## 🏗️ Architecture & Tech Stack

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Vite + React 19)               │
│  • React 19, TypeScript, TailwindCSS v4                     │
│  • Recharts & Chart.js for Analytics                        │
│  • Three.js / React Three Fiber for 3D Visuals              │
│  • Lucide React Icons & Motion Animations                   │
│  • Vitest & React Testing Library                           │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / JSON (JWT Auth)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   Backend (Node.js + Express)               │
│  • Express REST API with Zod Schema Validation              │
│  • JWT Authentication & Role-Based Access Control           │
│  • Dynamic Production CORS & Rate-Safe Endpoints            │
│  • Jest / Supertest API Test Suite                          │
│  • Dual Mode: MongoDB Atlas + In-Memory Fallback            │
└──────────────────────────────┬──────────────────────────────┘
                               │ Mongoose ODM
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   Database (MongoDB Atlas)                  │
│  • Users, FoodItems, CartRequests, Feedback, Complaints     │
│  • LogEntries, MealAttendance, Donations, NGOs, Notifs     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 Seeded Login Accounts

The system automatically initializes default user accounts on first launch for immediate testing and demonstration:

| Role | Email | Password | Name | Default Permissions |
| :--- | :--- | :--- | :--- | :--- |
| **Manager** | `vikas@gmail.com` | `admin123` | Vikas Manager | Full access: Smart Prep Planner, Stock Management, Cart Approvals, Donations, Waste Reports, Recipe Quality, Complaints. |
| **Resident** | `student@hostel.com` | `student123` | Aarav Kumar | Resident portal: Order Food, Meal Attendance Skipping, Zero Waste Hero Leaderboard, Submit Feedback/Complaints, Notifications. |

> ⚡ **1-Click Instant Guest Login**: On the login screen, you can also click **"⚡ Login as Guest (Resident)"** or **"👨‍💼 Login as Guest (Manager)"** to immediately enter the application without manually typing credentials!

---

## ⚙️ Environment Variables Reference

### Frontend Environment Variables (`.env`)

| Variable | Required | Default | Description |
| :--- | :---: | :--- | :--- |
| `VITE_API_URL` | Optional | `""` (empty / `/api`) | Full URL of the backend API (e.g. `https://food-waste-backend.onrender.com`). If empty, Vite dev proxy or same-origin `/api` is used. |

### Backend Environment Variables (`server/.env`)

| Variable | Required | Default | Description |
| :--- | :---: | :--- | :--- |
| `PORT` | Optional | `5000` | Port on which the Express server listens. |
| `NODE_ENV` | Optional | `development` | Set to `production` in live environments to enable static asset serving and strict production headers. |
| `MONGO_URI` | **Required in Prod** | `mongodb://127.0.0.1:27017/food-app` | Connection string for MongoDB Atlas or local MongoDB instance. In-memory data is used if unreachable. |
| `JWT_SECRET` | **Required in Prod** | *(Built-in default)* | Secure secret key used to sign and verify JSON Web Tokens. |
| `CORS_ORIGIN` | Optional | `localhost:5173,localhost:5174` | Comma-separated allowed frontend domains (e.g. `https://pg-food-waste.vercel.app`). Also supports `*.vercel.app` preview deployments. |

---

## 🚀 Local Quickstart Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.x, v20.x, or later)
- [Git](https://git-scm.com/)
- Optional: Local MongoDB or free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-username/Food_Waste_management_for_PG_Accomdation.git
cd Food_Waste_management_for_PG_Accomdation

# Install frontend and root dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### 2. Configure Environment Files
```bash
# Create server .env
cp server/.env.example server/.env

# Create frontend .env (optional for local dev)
cp .env.example .env
```

### 3. Start Development Server
Run both frontend and backend concurrently in one command:
```bash
npm run dev
```
- **Frontend**: `http://localhost:5173` (or `http://localhost:5174`)
- **Backend API**: `http://localhost:5000`
- **Proxy**: Requests to `/api/*` on the frontend are automatically proxied to port 5000.

---

## 🌐 Production Deployment Guide

You can deploy the application using a **Decoupled Setup** (MongoDB Atlas + Render Backend + Vercel Frontend) or a **Monolithic Setup** (Single Render / Railway Web Service).

---

### Step 1: Set Up MongoDB Atlas (Database)

1. Sign in to [MongoDB Atlas](https://cloud.mongodb.com/) and create a free **M0 Shared Cluster**.
2. **Create Database User**:
   - Go to **Security** $\rightarrow$ **Database Access** $\rightarrow$ **Add New Database User**.
   - Select **Password** authentication, choose a username (e.g. `pgadmin`) and secure password.
   - Assign the **Read and write to any database** built-in role.
3. **Configure Network Access**:
   - Go to **Security** $\rightarrow$ **Network Access** $\rightarrow$ **Add IP Address**.
   - Add `0.0.0.0/0` (Allow Access from Anywhere) to permit cloud backend connections from Render.
4. **Obtain Connection String**:
   - Go to **Database** $\rightarrow$ **Connect** $\rightarrow$ **Drivers** (Node.js).
   - Copy the connection URI:
     ```
     mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/food-app?retryWrites=true&w=majority
     ```

---

### Step 2: Deploy Backend to Render

1. Sign in to [Render](https://render.com/) and click **New +** $\rightarrow$ **Web Service**.
2. Connect your GitHub repository.
3. Configure the service settings:
   - **Name**: `food-waste-backend`
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
4. **Add Environment Variables** in Render Dashboard:
   - `NODE_ENV` = `production`
   - `PORT` = `10000` (or leave default assigned by Render)
   - `MONGO_URI` = `mongodb+srv://<user>:<password>@cluster0.abcde.mongodb.net/food-app?retryWrites=true&w=majority`
   - `JWT_SECRET` = `<your-secure-random-jwt-secret-string>`
   - `CORS_ORIGIN` = `https://your-app-name.vercel.app`
5. Click **Create Web Service**. Once deployed, copy your backend URL (e.g. `https://food-waste-backend.onrender.com`).

---

### Step 3: Deploy Frontend to Vercel

1. Sign in to [Vercel](https://vercel.com/) and click **Add New...** $\rightarrow$ **Project**.
2. Import your GitHub repository.
3. Configure Project Settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `./` (Root)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. **Add Environment Variables** in Vercel:
   - `VITE_API_URL` = `https://food-waste-backend.onrender.com`
5. **SPA Routing Support**:
   - The repository includes [`vercel.json`](file:///c:/Users/vikas/Downloads/Food_Waste_management_for_PG_Accomdation-main/Food_Waste_management_for_PG_Accomdation-main/vercel.json) configured to rewrite all routes to `/index.html` for clean client-side React SPA navigation.
6. Click **Deploy**. Vercel will build and publish the frontend at `https://your-app-name.vercel.app`.

---

### Step 4: Monolithic Single-Server Deployment (Alternative)

If you prefer deploying frontend and backend together on a single Node server:
1. Express in [`server/index.js`](file:///c:/Users/vikas/Downloads/Food_Waste_management_for_PG_Accomdation-main/Food_Waste_management_for_PG_Accomdation-main/server/index.js) automatically serves the static production build from `dist/` and rewrites non-API routes to `dist/index.html`.
2. On Render / Railway, set:
   - **Root Directory**: `./` (Root)
   - **Build Command**: `npm install && cd server && npm install && cd .. && npm run build`
   - **Start Command**: `npm start`
   - **Environment Variables**: `NODE_ENV=production`, `MONGO_URI=...`, `JWT_SECRET=...`

---

## 📸 Screenshots & UI Showcase

```
+-------------------------------------------------------------------------------+
|                             SMART PREP PLANNER                                |
|  [ Tomorrow: Friday - Breakfast ] Expected Headcount: 86 (-14 skipped)        |
|                                                                               |
|  +---------------------------+  +------------------------------------------+  |
|  | Masala Dosa               |  | Historical vs Predicted Waste            |  |
|  | • Hist Avg: 42 portions   |  |   [|||||||||||||||||||||||||] 12% Waste  |  |
|  | • Approved Carts: 38      |  |                                          |  |
|  | • Suggested Prep: 45      |  | [ Prep This Much Today: 45 portions ]    |  |
|  +---------------------------+  +------------------------------------------+  |
+-------------------------------------------------------------------------------+
```

- **Smart Prep Planner**: Intelligent batch recommendations per dish with historical vs predicted Recharts visualizer.
- **Resident Meal Attendance Calendar**: Weekly view allowing students to toggle meal attendance per day and meal slot.
- **Cost & Carbon Analytics**: INR ₹ waste cost, $2.5\text{ kg CO}_2\text{e}$ calculation, target progress, and 1-click PDF/CSV reports.
- **Surplus Food Donations Hub**: Direct logging to verified NGOs with real-time net waste subtraction.
- **Mobile Responsive Design**: Optimized 375px viewport layouts with card-based data tables and accessible touch controls.

---

## 🧪 Testing & CI/CD Pipeline

The project includes unit, integration, and API end-to-end tests built with **Vitest**, **React Testing Library**, and **Supertest**.

### Run Test Suite Locally
```bash
# Run all frontend & backend tests
npm test

# Run tests in watch mode
npm run test:watch

# Run TypeScript type-checking
npm run type-check

# Run ESLint linter
npm run lint
```

### GitHub Actions CI
Every commit and pull request triggers the automated CI pipeline defined in [`.github/workflows/ci.yml`](file:///c:/Users/vikas/Downloads/Food_Waste_management_for_PG_Accomdation-main/Food_Waste_management_for_PG_Accomdation-main/.github/workflows/ci.yml):
1. **Linting & Code Standards**: `npm run lint`
2. **Type Checking**: `npm run type-check`
3. **Automated Testing**: `npm test` (31+ unit and API integration tests)
4. **Production Build Verification**: `npm run build`

---

## 📡 REST API Summary

| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/auth/login` | Public | Authenticate user and obtain JWT token |
| `POST` | `/api/users` | Public | Register a new user |
| `GET` | `/api/food` | Bearer | Retrieve all inventory food items & stock levels |
| `POST` | `/api/food` | Manager | Create or update inventory items |
| `GET` | `/api/cart-requests` | Bearer | Fetch cart orders (filtered by user or all for managers) |
| `POST` | `/api/cart-requests` | Resident | Submit a new meal/food request |
| `PATCH` | `/api/cart-requests/:id/status`| Manager | Approve or reject cart (triggers atomic stock deduction) |
| `GET` | `/api/prep-planner` | Manager | Compute intelligent dish prep suggestions & waste analytics |
| `GET` | `/api/meal-attendance` | Bearer | Get meal attendance calendar and skipped counts |
| `POST` | `/api/meal-attendance` | Resident | Toggle meal attendance for upcoming dates and slots |
| `GET` | `/api/donations` | Manager | Get surplus food donation records and NGO recipients |
| `POST` | `/api/donations` | Manager | Record surplus food donation to an NGO |
| `GET` | `/api/leaderboard/zero-waste` | Bearer | Zero Waste Hero leaderboard and skip reliability rankings |
| `GET` | `/api/dish-quality` | Manager | Dish rating summaries and review-recipe waste correlation |
| `GET` | `/api/notifications` | Bearer | Fetch user notifications (status alerts, menus, updates) |

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).
