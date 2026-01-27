# 🔐 How to Login to SYRA LMS

## The Issue

You're seeing 401 (Unauthorized) errors because you're not logged in yet. The middleware is protecting the `/admin` route and should redirect you to `/login`, but you need to manually navigate there first.

---

## ✅ Solution: Login First

### Step 1: Navigate to Login Page

Open your browser and go to:
```
http://localhost:3000/login
```

### Step 2: Use One of These Accounts

#### Admin Account (Full Access)
```
Email: admin@portal.com
Password: Admin123!
```

#### Super Instructor Account
```
Email: superinstructor@portal.com
Password: Super123!
```

#### Instructor Account
```
Email: instructor@portal.com
Password: Instructor123!
```

#### Learner Account
```
Email: learner1@portal.com
Password: Learner123!
```

#### Test Accounts (For Multi-Tenant Testing)
```
Email: admin-a@test.local
Password: TestPass123!

Email: instructor-a@test.local
Password: TestPass123!

Email: learner-a@test.local
Password: TestPass123!
```

---

## 🎯 After Login

Once you log in, you'll be automatically redirected to the appropriate dashboard based on your role:

- **ADMIN** → `/admin` (Admin Dashboard)
- **SUPER_INSTRUCTOR** → `/super-instructor` (Super Instructor Dashboard)
- **INSTRUCTOR** → `/instructor` (Instructor Dashboard)
- **LEARNER** → `/learner` (Learner Dashboard)

---

## 🔍 What Was Happening

The errors you saw in the console:

```
GET http://localhost:3000/api/favicon.ico 404 (Not Found)
GET http://localhost:3000/api/dashboard 401 (Unauthorized)
Error fetching dashboard data: ApiFetchError: User not found
```

These occurred because:
1. **401 Unauthorized** - You weren't logged in, so the API rejected the request
2. **404 Not Found** - The browser was looking for a favicon in the wrong place (not critical)
3. **User not found** - The authentication middleware couldn't find your session

---

## 🛠️ Troubleshooting

### If Login Doesn't Work:

1. **Check Backend is Running:**
   ```bash
   # Should show backend running on port 8000
   curl http://localhost:8000/api/health
   ```

2. **Check Database Connection:**
   ```bash
   docker ps
   # Should show lms_postgres running
   ```

3. **Clear Browser Cookies:**
   - Open DevTools (F12)
   - Go to Application → Cookies
   - Delete all cookies for localhost:3000
   - Try logging in again

4. **Check Backend Logs:**
   Look at the terminal where the backend is running for any errors

---

## 📊 What You'll See After Login

### Admin Dashboard:
- **Stats Cards:**
  - Active Users
  - Total Courses
  - Published Courses
  - Total Branches
  
- **Portal Activity Chart:**
  - Weekly login activity
  - Course completions
  
- **Timeline:**
  - Recent system events
  - User activities
  
- **Recent Courses:**
  - Latest created courses
  - Course status

### Navigation Menu:
- Home
- Users
- Courses
- Learning Paths
- Course Store
- Groups
- Branches
- Automations
- Notifications
- Reports
- Skills
- Assignments

---

## 🎓 Quick Start After Login

### As Admin:

1. **View Users:**
   - Click "Users" in sidebar
   - See all 25 seeded users

2. **View Courses:**
   - Click "Courses" in sidebar
   - See 5 sample courses

3. **View Enrollments:**
   - Click on a course
   - See enrolled students

4. **Create New Course:**
   - Click "Courses" → "Create Course"
   - Fill in details
   - Add sections and units

### As Instructor:

1. **View My Courses:**
   - See courses you're assigned to
   - Manage course content

2. **View Students:**
   - See enrolled students
   - Track progress

3. **Grade Assignments:**
   - View submissions
   - Provide feedback

### As Learner:

1. **View My Courses:**
   - See enrolled courses
   - Track progress

2. **Take Courses:**
   - Access course content
   - Complete units

3. **Submit Assignments:**
   - Upload assignments
   - View grades

---

## 🔐 Security Notes

- **JWT Tokens:** The system uses JWT tokens stored in HTTP-only cookies
- **CSRF Protection:** CSRF tokens are used for state-changing operations
- **Session Management:** Sessions are managed server-side
- **Password Hashing:** Passwords are hashed with bcrypt

---

## 🚀 Next Steps

1. **Login** with admin@portal.com / Admin123!
2. **Explore** the admin dashboard
3. **Create** a new course
4. **Enroll** users in courses
5. **Test** different roles by logging in with different accounts

---

## 📝 Common URLs

- **Login:** http://localhost:3000/login
- **Admin Dashboard:** http://localhost:3000/admin
- **Instructor Dashboard:** http://localhost:3000/instructor
- **Learner Dashboard:** http://localhost:3000/learner
- **API Docs:** http://localhost:8000/docs
- **API Health:** http://localhost:8000/api/health

---

## ✅ Verification

To verify everything is working:

1. Login at http://localhost:3000/login
2. You should see the dashboard with data
3. No 401 errors in console
4. Navigation menu should be visible
5. Stats should show real numbers (25 users, 5 courses, etc.)

---

**Happy Learning! 🎉**
