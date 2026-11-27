# 🏋️ IronPeak Gym Web App

# Overview
This application provides a centralized platform for gym members and trainers to connect and manage fitness classes more efficiently. Traditional gym scheduling is often handled through paper sign-up sheets or manual messaging, making it hard to track availability or manage waitlists. This project aims to solve that problem by providing a dedicated website where anyone can browse upcoming classes, enroll, and manage their participation — while giving trainers full control over class creation and attendance.

# Features
# 1. User Roles
- Member role can browse, enroll in, and leave classes
- Trainer role can create, edit, and delete their own classes; manages attendance and member lists for those classes
- Admin role manages contact messages and assigns user roles

# 2. Registration and Login
- Browsing is available after logging in
- New users register with a username, email, and password; every new account starts as a Member
- Trainer and Admin roles are assigned by an Admin from the Manage Dashboard
- The login card shows the Sign In form by default; a "Don't have an account? Register" link at the bottom switches to the registration form
- After registration, you are returned to the Sign In form to log in with your credentials
- Once logged in, your profile can be accessed by clicking your username in the top-right header

# 3. Browsing Classes
- The Classes page lists all available classes for the current week
- Anyone with an account can browse all classes
- Each card displays the class name, level, trainer, schedule, term, and current enrollment status
- Members can switch My Classes to a Calendar view; trainers can switch to a Calendar view of the classes they teach

# 4. Trainer Creating Classes
- Trainers see a + Create Class button on the Classes page
- When creating a class, trainers can set the name, date, time, level, capacity, and description
- Classes can be set to repeat on selected weekdays for up to 4 weeks automatically
- After creation, the new class appears immediately in the class list

# 5. Members Joining Classes
- Join Class if spots are available
- Join Waitlist if the class is full
- Leave Class or leave the waitlist at any time
- When an enrolled member leaves, the first person on the waitlist is automatically promoted
- Enrollment is concurrency-safe: when several members try to take the last spot at the same time, only one is enrolled and the rest join the waitlist

# 6. Trainer Class Management
Management controls (edit, delete, View Members) appear only on classes the trainer created. Classes taught by other trainers are shown read-only with the trainer's name.
- Edit class details at any time
- Delete a class with a confirmation prompt
- View Members — see enrolled members and the waitlist, and mark attendance
- Remove a member from the class; if they held an enrolled spot, the first person on the waitlist is promoted

# 7. Profile Page
- View account info: username, email, role, and membership
- Edit email inline without leaving the page
- Change password with current password verification
- Members can view their Class History: Upcoming, Past, and Attended classes

# 8. Contact & Admin Dashboard
- Any visitor can send a message to the gym via the Contact Us form
- Messages are stored in the database and shown in the admin dashboard
- Admins access the dashboard from their Profile Page → Manage Dashboard
- Admin can filter messages by All / Unread / Read, mark messages as read/unread, and delete them
- Admin can change a user's role between Member and Trainer

# Access Control
All permission checks are enforced on the server, not only in the UI:
- Every class and profile endpoint requires a valid JWT
- Trainer-only endpoints check the trainer role **and** that the trainer owns the class (members list, attendance, remove member, edit, delete)
- Attendance can only be marked for members with an enrolled spot
- Admin-only endpoints (messages, user roles) check the admin role

# Installation & Setup

### Prerequisites
- Node.js
- PostgreSQL (e.g. [Postgres.app](https://postgresapp.com/) on macOS)

### 1. Install dependencies
```bash
# Backend (project root: gym-app-fullstack)
npm install

# Frontend
cd components
npm install
cd ..
```

### 2. Create the database
```bash
createdb gym_app
psql -d gym_app -f server/db/schema.sql
```

### 3. Create a `.env` file
Create `.env` in the project root (`gym-app-fullstack/`). It is listed in `.gitignore` and must never be committed.

```
PORT=3000
JWT_SECRET=<a long random string>
DB_HOST=localhost
DB_PORT=5432
DB_NAME=gym_app
DB_USER=<your PostgreSQL user>
DB_PASSWORD=<your PostgreSQL password, empty for Postgres.app>
```

Generate a `JWT_SECRET` with:
```bash
openssl rand -hex 32
```

### 4. Start the app
```bash
# Backend (from gym-app-fullstack/)
npm run dev

# Frontend (in a new terminal)
cd components
npm run dev
```
- Backend runs on: http://localhost:3000
- Frontend runs on: http://localhost:5173

On startup the backend prints ` Connected to PostgreSQL` if the database settings are correct.

# Testing
```bash
npm test
```
Backend tests use Jest.

# Tech Stack
- Frontend : React (Vite)
- Backend : Node.js, Express
- Database : PostgreSQL
- Auth : JWT (JSON Web Token), bcrypt password hashing
- Testing : Jest

# Project Structure

<details>
<summary>Click to expand</summary>

```
.
├── components                     # Frontend (React + Vite)
│   ├── images
│   ├── public
│   ├── src
│   │   ├── assets
│   │   ├── component
│   │   │   ├── Button.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── Header.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Nav.jsx
│   │   │   └── UserRoleManager.jsx
│   │   ├── context
│   │   │   ├── AuthContext.jsx
│   │   │   └── ClassesContext.jsx
│   │   ├── pages
│   │   │   ├── AdminPage.jsx
│   │   │   ├── CardsPage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── PanelsPage.jsx
│   │   │   ├── ProfilePage.jsx
│   │   │   └── TextPage.jsx
│   │   ├── App.css
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── eslint.config.js
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── server                         # Backend (Express)
│   ├── controllers
│   │   ├── authController.js
│   │   ├── classesController.js
│   │   ├── messagesController.js
│   │   └── usersController.js
│   ├── db
│   │   ├── index.js               # PostgreSQL connection pool
│   │   └── schema.sql             # Database schema
│   ├── middleware
│   │   └── auth.js                # JWT verification and role checks
│   ├── routes
│   │   ├── auth.js
│   │   ├── classes.js
│   │   ├── messages.js
│   │   └── users.js
│   ├── utils
│   │   ├── enrollment.js
│   │   └── enrollment.test.js
│   ├── app.js                     # Express app setup (imported by tests)
│   └── server.js                  # Starts the server
├── .env                           # Local settings (not committed)
├── package.json
└── package-lock.json
```

</details>

# Sources and Licensing
Pictures downloaded from https://unsplash.com/
