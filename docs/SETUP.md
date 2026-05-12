# 🎧 DJ Booking System — Setup Guide

## Prerequisites
- **Node.js** 18+ and npm
- **MongoDB Atlas** account (free tier available at mongodb.com/cloud/atlas)
- **Angular CLI**: `npm install -g @angular/cli`
- (Optional) **SendGrid** or Gmail account for emails

---

## 1. Backend Setup

```bash
cd dj-booking-system/backend
npm install
cp .env.example .env
```

Edit `.env` with your credentials:
```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/dj-booking
JWT_SECRET=your_very_secret_key_min_32_chars
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password  # Use App Password, not regular password
ADMIN_EMAIL=dj@yourdomain.com
CLIENT_URL=http://localhost:4200
```

**Gmail App Password Setup:**
1. Go to Google Account → Security → 2-Step Verification → App Passwords
2. Generate a password for "Mail" → use that as EMAIL_PASS

**Seed the database (creates admin user + packages):**
```bash
npm run seed
```

**Start the backend:**
```bash
npm run dev        # Development with auto-reload
# or
npm start          # Production
```

API will be available at: `http://localhost:5000`

---

## 2. Angular Frontend Setup

```bash
# Create a new Angular project
ng new dj-frontend --routing --style=scss --standalone

cd dj-frontend

# Copy the frontend-src/app/ contents into src/app/
# Copy environments into src/environments/
```

**Install project and run:**
```bash
npm install
ng serve
```

Frontend will be available at: `http://localhost:4200`

---

## 3. Default Login Credentials

After running `npm run seed`:

| Role  | Email                     | Password    |
|-------|---------------------------|-------------|
| Admin | admin@djbooking.com        | Admin@123   |
| Client| client@example.com        | Client@123  |

---

## 4. Project Structure Map

```
/backend
  server.js          ← Entry point
  .env               ← Your config (never commit this)
  /models            ← MongoDB schemas
  /controllers       ← Business logic
  /routes            ← API endpoints
  /services          ← Email + scheduler + availability
  /middleware        ← Auth + role protection
  /utils             ← seed.js + apiResponse.js

/frontend-src/app
  /core/services     ← auth.service.ts + api.service.ts
  /core/guards       ← auth + admin guards + interceptor
  /features/auth     ← Login + Register pages
  /features/booking  ← Multi-step booking form
  /features/dashboard← Client portal
  /features/admin    ← Admin panel (dashboard, bookings, calendar, packages)
  /shared/models     ← TypeScript interfaces
  app.routes.ts      ← Routing configuration
```

---

## 5. Key API Endpoints

```
POST   /api/auth/login              → Login
POST   /api/auth/register           → Register
GET    /api/packages                → List packages (public)
GET    /api/calendar/availability   → Check availability (public)
POST   /api/bookings                → Submit booking (client)
GET    /api/bookings/my             → My bookings (client)
GET    /api/bookings                → All bookings (admin)
PUT    /api/bookings/:id/status     → Update status (admin)
GET    /api/analytics/summary       → Stats (admin)
GET    /api/analytics/monthly       → Monthly chart data (admin)
POST   /api/calendar/block          → Block date (admin)
```

---

## 6. Deployment

### Backend on Railway / Render / Heroku
```bash
# Set environment variables in your platform's dashboard
# Deploy the /backend folder
# Set start command: node server.js
```

### Frontend on Vercel / Netlify
```bash
ng build --configuration=production
# Upload the /dist/dj-frontend/browser folder
# Add environment variable for production API URL
```

---

## 7. Common Issues

**MongoDB connection fails:**
- Check MONGO_URI includes correct username/password
- Whitelist your IP in MongoDB Atlas (Network Access)

**Emails not sending:**
- For Gmail: enable 2FA and use App Password
- Check EMAIL_USER and EMAIL_PASS are set in .env

**CORS errors:**
- Make sure CLIENT_URL in .env matches your Angular dev server URL exactly

**Angular can't find components:**
- Make sure all components are imported in their module or marked as standalone
- Run `ng generate component feature/my-component --standalone`
