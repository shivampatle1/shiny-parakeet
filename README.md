# 🎓 GDC Chhindwara — College Portal

Full-stack college web app for **Govt. Degree College, Chhindwara University**

## Tech Stack
- **Backend**: Node.js + Express + MongoDB (Mongoose) + JWT
- **Frontend**: React 18 + Vite + React Router v6 + Vanilla CSS

## Quick Start

### Prerequisites
- MongoDB running locally (`brew services start mongodb-community`)
- Node.js installed

### 1. Start Backend
```bash
cd backend
npm install
node server.js
# Runs on http://localhost:5001
```

### 2. Start Frontend
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

## Features
| Feature | Description |
|---|---|
| 🏫 Landing Page | Hero, scrolling notice marquee, contact directory, login portal |
| 🎒 Student Register | Name, Enrollment No., Course, Group, Type (Regular/Private) |
| 👩‍🏫 Teacher Register | Department, Designation — auto-approved |
| ⏳ Pending Verification | Students start as "pending" until teacher approves |
| ✅ Teacher Dashboard | Approve / Reject pending students, view all students |
| 🔒 Protected Routes | JWT-based role guards (student vs teacher) |

## Test Accounts (after seeding)
> Register via the UI or use these if already created:
- **Teacher**: `anita@gdc.ac.in` / `teacher123`
- **Student**: `rahul@student.gdc.ac.in` / `student123` (pending)

## Routes
| Route | Description |
|---|---|
| `/` | Landing page |
| `/student/login` | Student login |
| `/student/register` | Student registration |
| `/teacher/login` | Teacher login |
| `/teacher/register` | Teacher registration |
| `/student/dashboard` | Student dashboard (protected) |
| `/teacher/dashboard` | Teacher dashboard (protected) |
