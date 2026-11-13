# 🎯 QueueFlow — Full-Stack Queue Management & Analytics System

QueueFlow is a full-stack, real-time Queue Management System built with **Express.js + TypeScript** on the backend and **React + Vite + Tailwind CSS + Shadcn UI styling** on the frontend, powered by **Neon Lakebase Postgres with Prisma ORM** for cloud-native persistence and wait-time telemetry analytics.

---

## ✨ Features Implemented

1. **Manager Authentication & Multi-Queue Creation**
   - Register and Login as Queue Manager with secure JWT & bcrypt hashing.
   - Create and manage multiple named queues (e.g., *Customer Service*, *Express Billing*) with custom ticket prefixes.

2. **Customer Token Generation**
   - Add new customers/persons into queues with customizable name, phone number, priority tags (Standard / VIP), and notes.
   - Generates numbered tokens automatically (e.g. `CS-008`, `EXP-009`) with live ticket preview.

3. **Live Waiting Line Visualization**
   - Displays real-time waiting list ordered by priority rank (`#1 Next Up`, `#2`, `#3`...).
   - Displays wait duration timers (`Waited: 8 mins ago`).

4. **Dynamic Queue Reordering (Move Up / Down)**
   - Move any waiting token **Up** or **Down** in the queue with transactional position swapping and contiguous re-indexing.

5. **One-Click Top-of-Queue Assignment**
   - Assign the top customer in line for service with a single button click.
   - Automatically promotes the next waiting customer to the `#1` slot.

6. **Active Service Counter & Completion**
   - Dedicated counter station displaying customers currently being served, live timer, and a one-click **"Complete Service"** action.

7. **Token Cancellation**
   - Cancel any token with pre-configured reason options (*Customer left premises*, *No-show*, etc.) and automatic queue re-alignment.

8. **Telemetry & Wait-Time Analytics Dashboard**
   - **KPI Cards**: Average Wait Time, Average Service Time, Active Waiting Count, Service Completion Rate.
   - **Queue Flow & Arrival Trends**: Area chart visualizing hourly customer arrivals vs. customers served.
   - **Wait-Time Distribution**: Bar chart histogram of waiting intervals.
   - **Status Breakdown**: Donut chart tracking Waiting, In-Service, Completed, and Cancelled tokens.
   - **Queue Comparison**: Detailed table comparing performance across counters.

---

## 🛠️ Architecture & Tech Stack

- **Backend**: Express.js, TypeScript, Prisma ORM, Neon Lakebase Postgres, Zod validation, JWT, bcryptjs.
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Shadcn-style components, Lucide Icons, Recharts.
- **Database**: Neon Lakebase Postgres (`production` branch, pooled connections for application traffic and direct connections for migrations).

---

## 🚀 Running the Project

Both servers are pre-configured:

### Backend (Port 5000)
```bash
cd server
npm run dev
```

### Frontend (Port 3000)
```bash
cd client
npm run dev
```

Open your browser to: **`http://127.0.0.1:3000`**

### 🔑 Demo Manager Credentials
- **Email**: `manager@queueflow.com`
- **Password**: `password123`
*(Or click the **"Launch Demo Manager (1-Click)"** button on the home screen)*
