# 🎧 DJ Event Booking & Management System — Architecture Documentation

## Table of Contents

1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture Diagram](#architecture-diagram)
4. [Folder Structure](#folder-structure)
5. [Database Schema](#database-schema)
6. [API Reference](#api-reference)
7. [Authentication &amp; Authorization](#authentication--authorization)
8. [Booking Workflow](#booking-workflow)
9. [Email Notification System](#email-notification-system)
10. [Deployment Guide](#deployment-guide)

---

## System Overview

A full-stack automated booking and management system for a solo DJ business. Clients can discover availability, submit booking requests, and manage their events through a dedicated portal. The DJ (admin) manages all bookings, blocks dates, views analytics, and receives automated notifications.

**Key capabilities:**

- Multi-step online booking form with package selection
- Real-time availability calendar (conflict prevention)
- Automated email notifications at every workflow stage
- Client self-service portal (view bookings, upload documents)
- Admin analytics dashboard (revenue, booking trends, event types)
- JWT-based role authentication (Admin / Client)

---

## Technology Stack

| Layer      | Technology            | Purpose                              |
| ---------- | --------------------- | ------------------------------------ |
| Frontend   | Angular 17+           | SPA with lazy-loaded feature modules |
| Backend    | Node.js + Express 4   | RESTful API server                   |
| Database   | MongoDB + Mongoose    | Document storage                     |
| Auth       | JWT + bcrypt          | Stateless authentication             |
| Email      | Nodemailer + SendGrid | Transactional emails                 |
| Scheduling | node-cron             | Reminder automation                  |
| Env Config | dotenv                | Secret management                    |

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT BROWSER                        │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  Public Site  │  │ Client Portal│  │  Admin Dashboard │  │
│  │  (Booking)    │  │  (My Events) │  │  (Full Control)  │  │
│  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘  │
│         └─────────────────┴──────────────────┘             │
│                    Angular 17 SPA                           │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTPS / REST API
┌─────────────────────────▼───────────────────────────────────┐
│                   EXPRESS.JS API SERVER                      │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────┐    │
│  │  Auth Routes │  │Booking Routes│  │  Admin Routes    │    │
│  └─────────────┘  └─────────────┘  └──────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Middleware Layer                         │    │
│  │   JWT Auth │ Role Guard │ Rate Limit │ Validation    │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────┐    │
│  │  Controllers │  │   Services  │  │   node-cron      │    │
│  │  (HTTP logic)│  │(Business)   │  │  (Reminders)     │    │
│  └─────────────┘  └─────────────┘  └──────────────────┘    │
└──────────────┬──────────────────────────┬───────────────────┘
               │                          │
┌──────────────▼──────┐    ┌──────────────▼──────────────────┐
│     MONGODB          │    │         EMAIL SERVICE            │
│                      │    │                                  │
│  Collections:        │    │  • Booking Confirmation          │
│  • users             │    │  • Status Updates                │
│  • bookings          │    │  • 48hr Reminders                │
│  • packages          │    │  • Admin Alerts                  │
│  • blockedDates      │    │  • Invoice / Receipt             │
│  • reviews           │    │                                  │
└──────────────────────┘    └──────────────────────────────────┘
```

---

## Folder Structure

```
dj-booking-system/
│
├── backend/                        # Node.js + Express API
│   ├── config/
│   │   ├── database.js             # MongoDB connection
│   │   └── email.js                # Nodemailer/SendGrid config
│   │
│   ├── controllers/
│   │   ├── auth.controller.js      # Login, register, refresh
│   │   ├── booking.controller.js   # CRUD + status transitions
│   │   ├── calendar.controller.js  # Availability queries
│   │   ├── package.controller.js   # DJ service packages
│   │   └── analytics.controller.js # Dashboard stats
│   │
│   ├── middleware/
│   │   ├── auth.middleware.js      # JWT verification
│   │   ├── role.middleware.js      # Admin/Client role guard
│   │   └── validate.middleware.js  # Request body validation
│   │
│   ├── models/
│   │   ├── User.model.js           # Users (admin + clients)
│   │   ├── Booking.model.js        # Event bookings
│   │   ├── Package.model.js        # Service packages/pricing
│   │   ├── BlockedDate.model.js    # DJ unavailability
│   │   └── Review.model.js         # Client reviews
│   │
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── booking.routes.js
│   │   ├── calendar.routes.js
│   │   ├── package.routes.js
│   │   └── analytics.routes.js
│   │
│   ├── services/
│   │   ├── email.service.js        # All email templates + sending
│   │   ├── availability.service.js # Conflict detection logic
│   │   └── scheduler.service.js    # Cron jobs for reminders
│   │
│   ├── utils/
│   │   └── apiResponse.js          # Standardized API responses
│   │
│   ├── .env.example
│   ├── package.json
│   └── server.js                   # App entry point
│
├── frontend-src/                   # Angular 17 Application
│   └── app/
│       ├── core/
│       │   ├── guards/             # Auth & Role guards
│       │   ├── interceptors/       # HTTP auth interceptor
│       │   └── services/           # Auth, API base services
│       │
│       ├── features/
│       │   ├── auth/               # Login, Register pages
│       │   ├── booking/            # Multi-step booking form
│       │   ├── dashboard/          # Client "My Bookings"
│       │   ├── calendar/           # Availability calendar
│       │   └── admin/              # Admin panel + analytics
│       │
│       └── shared/
│           ├── components/         # Reusable UI components
│           ├── models/             # TypeScript interfaces
│           └── pipes/              # Custom Angular pipes
│
└── docs/
    ├── ARCHITECTURE.md             # This file
    └── SETUP.md                    # Installation guide
```

---

## Database Schema

### User

```json
{
  "_id": "ObjectId",
  "name": "string (required)",
  "email": "string (unique, required)",
  "password": "string (hashed)",
  "role": "enum: ['admin', 'client']",
  "phone": "string",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Booking

```json
{
  "_id": "ObjectId",
  "client": "ref: User",
  "package": "ref: Package",
  "eventType": "enum: ['wedding', 'birthday', 'corporate', 'club', 'festival', 'other']",
  "eventDate": "Date (required)",
  "startTime": "string (e.g. '19:00')",
  "endTime": "string (e.g. '23:00')",
  "venue": {
    "name": "string",
    "address": "string",
    "city": "string"
  },
  "guestCount": "number",
  "specialRequests": "string",
  "status": "enum: ['pending', 'confirmed', 'completed', 'cancelled']",
  "totalPrice": "number",
  "depositPaid": "boolean",
  "depositAmount": "number",
  "adminNotes": "string",
  "createdAt": "Date"
}
```

### Package

```json
{
  "_id": "ObjectId",
  "name": "string (e.g. 'Gold Package')",
  "description": "string",
  "duration": "number (hours)",
  "basePrice": "number",
  "features": "[string]",
  "isActive": "boolean"
}
```

### BlockedDate

```json
{
  "_id": "ObjectId",
  "date": "Date (required)",
  "reason": "string (e.g. 'Personal', 'Holiday')",
  "createdBy": "ref: User (admin)"
}
```

### Review

```json
{
  "_id": "ObjectId",
  "booking": "ref: Booking",
  "client": "ref: User",
  "rating": "number (1-5)",
  "comment": "string",
  "isPublished": "boolean",
  "createdAt": "Date"
}
```

---

## API Reference

### Auth Endpoints

| Method | Endpoint                  | Access  | Description              |
| ------ | ------------------------- | ------- | ------------------------ |
| POST   | /api/auth/register        | Public  | Register new client      |
| POST   | /api/auth/login           | Public  | Login, returns JWT       |
| GET    | /api/auth/me              | Private | Get current user profile |
| PUT    | /api/auth/me              | Private | Update profile           |
| POST   | /api/auth/forgot-password | Public  | Send reset email         |

### Booking Endpoints

| Method | Endpoint                 | Access | Description           |
| ------ | ------------------------ | ------ | --------------------- |
| GET    | /api/bookings            | Admin  | Get all bookings      |
| GET    | /api/bookings/my         | Client | Get client's bookings |
| GET    | /api/bookings/:id        | Auth   | Get single booking    |
| POST   | /api/bookings            | Client | Create new booking    |
| PUT    | /api/bookings/:id/status | Admin  | Update booking status |
| PUT    | /api/bookings/:id        | Admin  | Edit booking details  |
| DELETE | /api/bookings/:id        | Admin  | Cancel/delete booking |

### Calendar Endpoints

| Method | Endpoint                   | Access | Description                |
| ------ | -------------------------- | ------ | -------------------------- |
| GET    | /api/calendar/availability | Public | Get available/booked dates |
| POST   | /api/calendar/block        | Admin  | Block a date               |
| DELETE | /api/calendar/block/:id    | Admin  | Unblock a date             |
| GET    | /api/calendar/blocked      | Admin  | Get all blocked dates      |

### Package Endpoints

| Method | Endpoint          | Access | Description             |
| ------ | ----------------- | ------ | ----------------------- |
| GET    | /api/packages     | Public | Get all active packages |
| POST   | /api/packages     | Admin  | Create package          |
| PUT    | /api/packages/:id | Admin  | Update package          |
| DELETE | /api/packages/:id | Admin  | Deactivate package      |

### Analytics Endpoints

| Method | Endpoint                   | Access | Description                  |
| ------ | -------------------------- | ------ | ---------------------------- |
| GET    | /api/analytics/summary     | Admin  | Revenue, booking counts      |
| GET    | /api/analytics/monthly     | Admin  | Monthly breakdown chart data |
| GET    | /api/analytics/event-types | Admin  | Bookings by event type       |
| GET    | /api/analytics/upcoming    | Admin  | Next 30 days events          |

---

## Authentication & Authorization

The system uses **JWT (JSON Web Tokens)** with two roles:

```
Public ──────► No token required (availability check, packages, register)
Client ──────► JWT required, role = 'client'
Admin  ──────► JWT required, role = 'admin'
```

**Flow:**

1. User logs in → server returns `accessToken` (24h) + `refreshToken` (7d)
2. Angular HTTP interceptor attaches `Authorization: Bearer <token>` to every API call
3. Express `auth.middleware.js` verifies JWT on protected routes
4. `role.middleware.js` checks role for admin-only endpoints

---

## Booking Workflow

```
Client submits form
        │
        ▼
  Status: PENDING ──────────────────────────────► Email: "We received your request"
        │                                          Email to Admin: "New booking request"
        │
        │  Admin reviews
        ├──► [Confirms] ────► Status: CONFIRMED ──► Email: "Your booking is confirmed!"
        │                                           Cron: Reminder 48h before event
        │
        └──► [Declines] ────► Status: CANCELLED ──► Email: "Unfortunately we can't..."
                                  
  After event date passes:
        │
        ▼
  Status: COMPLETED ──────────────────────────────► Email: "Thank you! Leave a review"
```

---

## Email Notification System

All emails are sent via **Nodemailer** (configurable with Gmail/SendGrid SMTP).

| Trigger               | Recipients     | Template                  |
| --------------------- | -------------- | ------------------------- |
| New booking submitted | Client + Admin | `booking-received.hbs`  |
| Booking confirmed     | Client         | `booking-confirmed.hbs` |
| Booking cancelled     | Client         | `booking-cancelled.hbs` |
| 48h before event      | Client         | `event-reminder.hbs`    |
| Event completed       | Client         | `review-request.hbs`    |
| Password reset        | Client         | `password-reset.hbs`    |

---

## Deployment Guide

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- SendGrid / Gmail SMTP credentials

### Steps

```bash
# 1. Clone & install backend
cd backend && npm install 

# 2. Configure environment
cp .env.example .env
# Fill in MONGO_URI, JWT_SECRET, EMAIL_* vars

# 3. Seed initial data (packages + admin user)
npm run seed

# 4. Start backend
npm run dev        # Development
npm start          # Production

# 5. Install & build Angular frontend
cd ../frontend
npm install -g @angular/cli
ng new dj-frontend --routing --style=scss
# Copy feature files into src/app/
ng serve           # Development
ng build --prod    # Production build → serve with nginx
```

### Environment Variables (.env)

```
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_super_secret_key
JWT_EXPIRE=24h
JWT_REFRESH_EXPIRE=7d

EMAIL_SERVICE=sendgrid
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASS=your_sendgrid_api_key
EMAIL_FROM=dj@yourdomain.com
ADMIN_EMAIL=your@email.com

CLIENT_URL=http://localhost:4200
```
