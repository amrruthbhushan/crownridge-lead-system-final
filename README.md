# IT Consultancy Inbound Lead Scoring & Qualification System

Crownridge CRM is a production-ready inbound lead management system designed specifically for IT consultancies. It automates lead capture, applies mathematical criteria to rank prospects, assigns warm/hot leads in a round-robin format, tracks qualification checklists, provides rule-based pre-sales consulting AI advice, and aggregates operations on executive dashboards.

---

## Technical Stack

- **Frontend**: React, Vite, Tailwind CSS, React Router, Axios, Lucide Icons
- **Backend**: Node.js, Express.js, Prisma ORM
- **Database**: SQLite (local development / prototyping), PostgreSQL (production-ready)
- **Authentication**: JWT authentication with Role Based Access Control (RBAC)

---

## Directory Structure

```text
crownridge-lead-system/
├── backend/                  # Express REST API Server
│   ├── controllers/          # Business logic handlers
│   ├── middleware/           # Auth and RBAC middleware
│   ├── prisma/               # Prisma SQLite schemas & seeds
│   │   ├── schema.prisma     # DB models
│   │   └── seed.js           # Database seeds
│   ├── routes/               # Express endpoints
│   ├── services/             # Scoring, routing, and AI rules engines
│   └── tests/                # Unit & Integration tests
├── frontend/                 # React SPA Client
│   ├── src/
│   │   ├── components/       # Visual widgets
│   │   ├── layouts/          # Workspace page wrapper layouts
│   │   ├── pages/            # View dashboards, lists, details
│   │   └── services/         # Axios config client
│   └── index.html            # SPA index
├── package.json              # Monorepo task script controls
└── README.md                 # System index documentation
```

---

## Quick Start (Local Development)

Ensure you have [Node.js](https://nodejs.org/) (v16+) installed.

### 1. Installation

Run this command at the root directory to install packages for the monorepo, backend, and frontend concurrently:
```bash
npm run install:all
```

### 2. Database Sync & Seeding

Go to the `backend` folder and synchronize the Prisma SQLite schema, generate clients, and populate default seeds:
```bash
cd backend
npx prisma db push
node prisma/seed.js
cd ..
```
*Note: SQLite is configured by default for instant local execution. See the deployment guide for switching to PostgreSQL.*

### 3. Running the Application

From the root directory, run both servers concurrently:
```bash
npm run dev
```
- **React Frontend**: http://localhost:5173
- **Express Backend API**: http://localhost:5000

---

## Test Executions

We ship a custom test runner that verifies lead scoring engines, assignment queues, and AI advice modules. To execute:
```bash
cd backend
node tests/testRunner.js
```

---

## Demo Accounts

Use these accounts to test the Role-Based Access Control (RBAC):

| Role | Email | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@crownridge.com` | `admin123` | Full access, user setup, database deletion, manual overrides. |
| **Sales Rep 1** | `sarah.sales@crownridge.com` | `sales123` | View and modify only their assigned leads. |
| **Sales Rep 2** | `john.sales@crownridge.com` | `sales123` | View and modify only their assigned leads. |
| **Project Manager** | `peter.pm@crownridge.com` | `pm123` | Read-only leads view, can collaborate on comments/checklists. |
| **Tech Lead** | `tina.tech@crownridge.com` | `tech123` | Read-only leads view, can collaborate on comments/checklists. |
