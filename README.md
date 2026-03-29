# 🏋️ IronPeak Gym Ｗeb App

# Overview
This application provides a centralized platform for gym members and trainers to connect and manage fitness classes more efficiently. Traditional gym scheduling is often handled through paper sign-up sheets or manual messaging, making it hard to track availability or manage waitlists. This project aims to solve that problem by providing a dedicated website where anyone can browse upcoming classes, enroll, and manage their participation — while giving trainers full control over class creation and attendance.

# Features
# 1. User Roles
- Member role can browse, enroll in, and leave classes
- Trainer role can create, edit, and delete classes; manages attendance and member lists
# 2. Registration and Login
- Browsing is available after logging in
- New users must Register with a username, email, password, and role before accessing any features
- After registration, you are redirected to the Sign In page to log in with your credentials
Once logged in, your profile can be accessed by clicking your username in the top-right header
# 3. Browsing Classes
- The Classes page lists all available classes for the current week
Anyone with an account can browse all classes
- Each card displays the class name, level, trainer, schedule, term, and current enrollment status
- Members and Trainers can switch to a Calendar view to see their full monthly schedule
# 4. Trainer creating classes 
- Trainers see a plus Create Class button on the Classes page
- When creating a class, trainers can set the name, date, time, level, capacity, and description
- Classes can be set to repeat on selected weekdays for up to 4 weeks automatically
- After creation, the new class appears immediately in the class list
# 5. Members joining classes
- Join Class if spots are available
- Join Waitlist if the class is full — position is shown on the card
- Leave Class or leave the waitlist at any time,
When a member leaves an enrolled spot, the first person on the waitlist is automatically promoted and receives a notification toast.
# 6. Trainer Class Management
- Edit class details at any time
- Delete a class with a confirmation prompt
- View Members — see enrolled members, mark attendance, and view the waitlist
- Promotion Log — track every waitlist-to-enrolled promotion with timestamps
# 7. Profile Page
- View account info: username, email, role, and membership
- Edit email inline without leaving the page
- Change password with current password verification
- Members can view their Class History: Upcoming, Past, and Attended classes
# 8. Contact & Admin Dashboard
- Any visitor can send a message to the gym via the Contact Us form
- Messages are stored in the database and delivered to the admin in real time
- Admins access the dashboard from their Profile Page → Manage Dashboard
- Admin can filter messages by All / Unread / Read, mark messages as read/unread, and delete them

# Installation & Setup
```bash

# 1. Install backend dependencies (root)
npm install

# 2. Install frontend dependencies
cd components
npm install

# 3. Go back to root and start backend
cd ..
npm run dev

# 4. In a new terminal, start frontend
cd components
npm run dev
```
- Backend runs on: http://localhost:3000
- Frontend runs on: http://localhost:5173
  
# Tech Stack
- Frontend : React (Vite)
- Backend : Node.js, Express
- Database : PostgreSQL
- Auth : JWT (JSON Web Token)

# Project Structure
```
.
├── components
│   ├── images
│   │   ├── equipment.jpg
│   │   ├── nutrition.jpg
│   │   └── trainers.jpg
│   ├── public
│   │   ├── favicon.svg
│   │   └── icons.svg
│   ├── src
│   │   ├── assets
│   │   │   ├── hero.png
│   │   │   ├── react.svg
│   │   │   └── vite.svg
│   │   ├── component
│   │   │   ├── Button.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── Header.jsx
│   │   │   ├── Modal.jsx
│   │   │   └── Nav.jsx
│   │   ├── context
│   │   │   ├── AuthContext.jsx
│   │   │   └── ClassesContext.jsx
│   │   ├── pages
│   │   │   ├── AdminPage.jsx
│   │   │   ├── CardsPage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── PanelsPage.jsx
│   │   │   ├── ProfilePage.jsx
│   │   │   └── TextPage.jsx
│   │   ├── App.css
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── eslint.config.js
│   ├── index.html
│   ├── licenses.txt
│   ├── package-lock.json
│   ├── package.json
│   └── vite.config.js
├── server
│   ├── controllers
│   │   ├── authController.js
│   │   ├── classesController.js
│   │   └── messagesController.js
│   ├── db
│   │   └── index.js
│   ├── middleware
│   │   └── auth.js
│   ├── routes
│   │   ├── auth.js
│   │   ├── classes.js
│   │   └── messages.js
│   └── server.js
├── package-lock.json
└── package.json
```

# Sources and Licensing
Pictures Donload from https://unsplash.com/
