# ChamaLoop — Backend API

Built with Node.js and Express. Uses MySQL as the database.

---

## Requirements

- Node.js v18 or higher
- MySQL v8 or higher — easiest way to run this locally is with **XAMPP**

---

## Setting Up MySQL with XAMPP

If you do not already have MySQL installed, XAMPP is the simplest option. Follow these steps:

1. **Download XAMPP** from https://www.apachefriends.org and install it.

2. **Start MySQL:**
   - Open the XAMPP Control Panel
   - Click **Start** next to **MySQL**
   - The status light turns green when it is running

3. **Open phpMyAdmin** (the database GUI that comes with XAMPP):
   - Click **Admin** next to MySQL in the Control Panel, or open `http://localhost/phpmyadmin` in your browser

4. **Create the database:**
   - Click **New** in the left sidebar
   - Type `chamaloop` as the database name
   - Leave the collation as default and click **Create**

5. **That is all** — the backend will create all the tables automatically when it starts for the first time.

> **XAMPP default credentials:**
> - Host: `localhost`
> - User: `root`
> - Password: *(leave blank — XAMPP sets no password by default)*

---

## Backend Setup

1. Install dependencies:
```
npm install
```

2. Copy the environment file:
```
cp .env.example .env
```

3. Open `.env` and fill in your values:
```
PORT=5000
JWT_SECRET=pick_any_long_random_string_here
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=chamaloop
FRONTEND_URL=http://localhost:5173
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your_gmail_address@gmail.com
MAIL_PASS=your_gmail_app_password
```

> **Note on `DB_PASSWORD`:** If you are using XAMPP defaults, leave this blank.
>
> **Note on email:** The email settings are only needed for the admin PIN reset feature.
> Gmail requires an App Password, not your regular Gmail password.
> Generate one at: Google Account → Security → 2-Step Verification → App Passwords.

4. Start the server:
```
npm start
```

You should see:
```
Database tables ready.
ChamaLoop server running on port 5000
```

---

## Folder Structure

```
backend/
  src/
    config/       — database connection and table setup
    controllers/  — route handler logic
    middleware/   — JWT authentication, role checks, and validators
    routes/       — API route definitions
  server.js       — app entry point
```

---

## API Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | /api/auth/register | None | Register Chama + Admin |
| POST | /api/auth/login | None | Login |
| POST | /api/auth/forgot-pin | None | Request PIN reset email |
| POST | /api/auth/reset-pin | None | Reset PIN with email code |
| GET | /api/members | Any | Get all members |
| POST | /api/members | Admin | Add new member |
| PUT | /api/members/:id/rotation | Admin | Update rotation order |
| PUT | /api/members/:id/reset-pin | Admin | Reset member PIN |
| GET | /api/rounds/active | Any | Get active round |
| POST | /api/rounds | Admin | Start new round |
| PUT | /api/rounds/:id/close | Admin | Close round |
| PUT | /api/rounds/:roundId/contributions/:memberId/pay | Admin | Mark contribution paid |
| PUT | /api/rounds/:roundId/contributions/:memberId/late | Admin | Mark contribution late |
| GET | /api/history | Any | Get history ledger |
| GET | /api/settings | Any | Get group settings |
| PUT | /api/settings | Admin | Update group settings |
