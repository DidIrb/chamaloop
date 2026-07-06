# ChamaLoop

A web-based automated management and record-keeping system for community savings groups (Chamas) operating a Merry-Go-Round savings model.

---

## Project Structure

```
chamaloop/
  backend/              — Node.js + Express REST API
    src/
      config/           — database connection and table setup
      controllers/      — route handler logic
      middleware/       — JWT auth, role checks, and validators
      routes/           — API route definitions
    server.js           — entry point
  frontend/             — Vite + React web application
    src/
      api/              — axios instance
      components/       — shared components
      context/          — auth context
      pages/            — page components (auth, admin, member)
      utils/            — utility helpers
  README.md             — this file
```

---

## Requirements

Before running the project make sure you have the following installed:

- Node.js (v18 or higher)
- MySQL (v8 or higher)
- A tool like XAMPP, WAMP, or MySQL Workbench to manage your database

---

## Database Setup

1. Open MySQL and create the database:

```sql
CREATE DATABASE chamaloop;
```

That is all. The tables are created automatically when the backend server starts for the first time.

---

## Backend Setup

1. Open a terminal and navigate to the backend folder:

```
cd chamaloop/backend
```

2. Install dependencies:

```
npm install
```

3. Copy the environment file and fill in your values:

```
cp .env.example .env
```

4. Open the `.env` file and update the following:

```
PORT=5000
JWT_SECRET=pick_any_long_random_string_here
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=chamaloop
FRONTEND_URL=http://localhost:5173
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your_gmail_address@gmail.com
MAIL_PASS=your_gmail_app_password
```

> **Note on email:** The email settings are only needed for the admin PIN reset feature.
> Gmail requires an App Password, not your regular password.
> You can generate one at: Google Account → Security → 2-Step Verification → App Passwords.

5. Start the backend server:

```
npm start
```

You should see:

```
Database tables ready.
ChamaLoop server running on port 5000
```

---

## Frontend Setup

1. Open a new terminal and navigate to the frontend folder:

```
cd chamaloop/frontend
```

2. Install dependencies:

```
npm install
```

3. Copy the environment file:

```
cp .env.example .env
```

4. The `.env` file should contain:

```
VITE_API_URL=http://localhost:5000/api
```

5. Start the frontend:

```
npm run dev
```

The application will open at `http://localhost:5173`

---

## Using the Application

### First Time Setup

1. Open `http://localhost:5173` in your browser
2. Click **Register your Chama**
3. Fill in the group details — Chama name, contribution amount, late fine and meeting frequency
4. Fill in the organiser (admin) details — name, phone number, email and a 4-digit PIN
5. Click **Create account**
6. You will be redirected to the login page

### Logging In

- Enter your phone number and 4-digit PIN
- Admins are taken to the Admin Dashboard
- Members are taken to the Member Dashboard

### Admin — Day to Day Use

**Starting a round:**
1. Go to the Dashboard
2. Select the member who will receive the money this round
3. Click **Start round**

**Marking contributions:**
1. On the Dashboard you will see all members listed
2. When a member pays, enter their M-Pesa transaction code and click **Mark paid**
3. If a member is late click **Late** to apply the configured fine

**Closing a round:**
1. Once all members have paid click **Close round & record in history**
2. The round is permanently saved to the History Ledger

**Adding members:**
1. Go to the **Members** page
2. Fill in the member's name, phone number and assign them a 4-digit PIN
3. Click **Add member**

**Updating rotation order:**
1. On the Members page, type a new number in the rotation field next to any member
2. Click **Save**

**Resetting a member's PIN:**
1. On the Members page click **Reset PIN** next to the member
2. Enter a new 4-digit PIN and click **Save PIN**

**Admin forgot PIN:**
1. On the login page click **Forgot your PIN?**
2. Enter your registered email address
3. Check your email for the 6-digit reset code
4. Enter the code and your new PIN

### Member — What They Can See

- Their own contribution status for the active round
- Who the current recipient is and the payout amount
- Their personal contribution history across all past rounds

---

## API Endpoints Reference

| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| POST | /api/auth/register | Public | Register Chama and admin |
| POST | /api/auth/login | Public | Login |
| POST | /api/auth/forgot-pin | Public | Request PIN reset email |
| POST | /api/auth/reset-pin | Public | Reset PIN with code |
| GET | /api/members | Any | Get members |
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

---

## Important Notes

- Only one Chama group can be registered per installation
- Records in the History Ledger are permanent and cannot be deleted or modified
- The system does not integrate with M-Pesa — transaction codes are entered manually as proof of payment
- JWT tokens expire after 8 hours — users will need to log in again after that
