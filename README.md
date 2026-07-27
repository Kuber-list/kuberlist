# KuberList — Capital Discovery Marketplace

A full-stack MVP connecting startups & SMEs (Capital Seekers) with Angels, Micro VCs, Family Offices, and other investors.

---

## Demo Accounts

| Role           | Email                   | Password    |
|----------------|-------------------------|-------------|
| Admin          | admin@kuberlist.com     | admin123    |
| Capital Seeker | arjun@nexapay.io        | seeker123   |
| Capital Seeker | priya@agrisense.in      | seeker123   |
| Investor       | rahul@vcfund.com        | investor123 |

---

## Quick Start (Local)

### Prerequisites
- Node.js 18+
- PostgreSQL 14+ running locally

### 1. Backend

```bash
cd backend
npm install

# Edit .env — set your PostgreSQL password in DATABASE_URL

npm run db:migrate    # Create tables
npm run db:generate   # Generate Prisma client
npm run db:seed       # Seed demo data
npm run dev           # Start on http://localhost:3001
```

Swagger API docs available at: **http://localhost:3001/api/docs**

### 2. Frontend

```bash
cd frontend
npm install
npm run dev           # Start on http://localhost:5173
```

---

## Docker (Full Stack)

```bash
# From project root
docker-compose up --build
```

- Frontend: http://localhost:5173
- Backend:  http://localhost:3001
- Swagger:  http://localhost:3001/api/docs

---

## Features

### Capital Seeker
- Create and manage funding listings (Startup or SME)
- Submit listings for admin review
- Manage investor interests (Accept / Reject)
- Upload pitch decks and documents (local storage)
- Post company updates
- Complete organisation profile

### Investor
- Set preferences (category, sectors, stages, ticket size)
- Discover filtered listings with smart matching
- Save deals for later
- Express interest with custom messages
- Access documents after interest is accepted
- Track all sent interests

### Admin
- Platform metrics dashboard
- Review and approve/reject listings
- User management
- Interest expression oversight

### Matching Engine
Recommendations based on:
- Sector intersection with preferred_sectors
- Stage intersection with preferred_stage
- Entity type preference (STARTUP / SME / BOTH)
- Funding ask within ticket range

---

## Tech Stack

| Layer     | Technology                              |
|-----------|-----------------------------------------|
| Frontend  | React 18, Vite, Tailwind CSS, Axios     |
| Backend   | Node.js, Express.js                     |
| Database  | PostgreSQL, Prisma ORM                  |
| Auth      | JWT Access + Refresh tokens             |
| Files     | Local disk (Multer) — MVP               |
| Docs      | Swagger / OpenAPI 3.0                   |
| DevOps    | Docker + Docker Compose                 |

---

## API Endpoints

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
GET    /api/auth/me

GET/PUT /api/capital-seeker/profile
GET     /api/capital-seeker/dashboard

POST   /api/listings/my
GET    /api/listings/my
GET    /api/listings/my/:id
PUT    /api/listings/my/:id
DELETE /api/listings/my/:id
POST   /api/listings/my/:id/submit
GET    /api/listings          (public browse with filters)
GET    /api/listings/:id      (public detail)

GET/PUT /api/investor/profile
GET     /api/investor/dashboard
POST    /api/investor/save
GET     /api/investor/saved

POST   /api/interest/send
GET    /api/interest/mine
GET    /api/interest/startup/:id
PUT    /api/interest/:id/status

POST   /api/document/upload
GET    /api/document/startup/:id
DELETE /api/document/:id

POST   /api/update
GET    /api/update/startup/:id

GET    /api/admin/metrics
GET    /api/admin/users
GET    /api/admin/listings
PATCH  /api/admin/listings/:id/review
GET    /api/admin/interests

GET    /api/score/listing/:id/score   (Capital Seeker — compute score)
GET    /api/score/listing/:id/report  (Capital Seeker — full report)
GET    /api/score/public/:id          (Any auth user — get stored score)
```
