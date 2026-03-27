# 🏋️ IronPeak Gym Ｗeb App

# Overview
This application provides a centralized platform for gym members and trainers to connect and manage fitness classes more efficiently. Traditional gym scheduling is often handled through paper sign-up sheets or manual messaging, making it hard to track availability or manage waitlists. This project aims to solve that problem by providing a dedicated website where anyone can browse upcoming classes, enroll, and manage their participation — while giving trainers full control over class creation and attendance.

# Features
# 1. Browsing Classes
- The Classes page lists all available classes for the current week
Anyone with an account can browse all classes
- Each card displays the class name, level, trainer, schedule, term, and current enrollment status
- Members and Trainers can switch to a Calendar view to see their full monthly schedule
# 2. Registration and Login
- Browsing is available after logging in
- New users must Register with a username, email, password, and role before accessing any features
- After registration, you are redirected to the Sign In page to log in with your credentials
Once logged in, your profile can be accessed by clicking your username in the top-right header
# 3. User Roles
- Member role can browse, enroll in, and leave classes
- Trainer role can create, edit, and delete classes; manages attendance and member lists
# 4. Trainer creating classes 
- Trainers see a + Create Class button on the Classes page
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
 
# Installation & Setup
```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

# Tech Stack
- React (Vite)

# Sources and Licensing
Pictures Donload from https://unsplash.com/
