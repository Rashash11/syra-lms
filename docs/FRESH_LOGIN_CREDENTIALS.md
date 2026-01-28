# 🔐 Fresh Login Credentials (After Database Reset)

## ✅ Database Reset Complete!

All users have been deleted and recreated with fresh authentication tokens. You can now login without any 401 errors!

---

## 👤 Login Credentials

### Admin Account
```
Email: admin@portal.com
Password: Admin123!
```

**Capabilities:**
- Full system access
- User management
- Course management
- Learning path management
- Reports and analytics
- All branches access

---

### Super Instructor Account
```
Email: superinstructor@portal.com
Password: Super123!
```

**Capabilities:**
- Extended instructor permissions
- Can manage multiple courses
- Student tracking across courses
- Limited admin functions

---

### Instructor Account
```
Email: instructor@portal.com
Password: Instructor123!
```

**Capabilities:**
- Course content editing
- Student progress tracking
- Assignment grading
- Course-specific management

---

### Learner Accounts

**Primary Learner:**
```
Email: learner1@portal.com
Password: Learner123!
```

**Additional Learners:**
All learner accounts use the same password: `Learner123!`

Available learner emails:
- `learner1@portal.com`
- `learner2@portal.com`
- `learner3@portal.com`
- `hana.mahmoud@portal.com`
- `ali.hassan@portal.com`
- `mariam.elsayed@portal.com`
- `kareem.farouk@portal.com`
- `nour.said@portal.com`
- `youssef.ahmed@portal.com`
- `layla.mostafa@portal.com`
- `omar.khaled@portal.com`
- `fatima.omar@portal.com`
- `mohamed.ibrahim@portal.com`
- `sara.ali@portal.com`
- `ahmed.hassan@portal.com`

**Capabilities:**
- View enrolled courses
- Access learning paths
- Complete assignments
- Track progress
- View certificates

---

## 🧪 Test Accounts (For E2E Testing)

### Smoke Test Accounts
```
Admin:       admin-a@test.local / TestPass123!
Instructor:  instructor-a@test.local / TestPass123!
Learner A:   learner-a@test.local / TestPass123!
Learner B:   learner-b@test.local / TestPass123!
```

### Tenant B Accounts (Multi-tenant Testing)
```
Admin:       admin-b@test.local / TestPass123!
Instructor:  instructor-b@test.local / TestPass123!
```

---

## 📊 What Was Created

### Users
- **3 Admin users** (including test accounts)
- **3 Super Instructor users**
- **3 Instructor users**
- **17 Learner users**
- **Total: 26 users**

### Content
- **5 Sample courses** with sections and units
- **2 Learning paths**
- **4 Categories**
- **68 Enrollments** with varied progress
- **3 Skills**
- **2 Assignments**
- **100 Timeline events** for activity charts

### Organization
- **2 Tenants** (Default Portal, Tenant B Portal)
- **3 Branches** (Main Branch, Secondary Branch, Branch C)

---

## 🚀 How to Login

### Step 1: Clear Your Browser Session (Important!)
Even though we reset the database, your browser still has old cookies.

**Quick Method:**
1. Press **F12** → **Application** tab
2. Under **Cookies** → `http://localhost:3000` → **Delete ALL**
3. Under **Local Storage** → `http://localhost:3000` → **Clear**
4. Under **Session Storage** → `http://localhost:3000` → **Clear**

**Or just close browser completely and reopen**

### Step 2: Login
1. Go to `http://localhost:3000`
2. Use any credentials above
3. **Note**: Passwords are case-sensitive!
   - Admin: `Admin123!` (capital A)
   - Instructor: `Instructor123!` (capital I)
   - Learner: `Learner123!` (capital L)

### Step 3: Verify
- ✅ No 401 errors in console
- ✅ Dashboard loads with data
- ✅ All pages accessible
- ✅ API calls return 200 OK

---

## 🎯 Quick Access URLs

### Admin
- Dashboard: `http://localhost:3000/admin`
- Users: `http://localhost:3000/admin/users`
- Courses: `http://localhost:3000/admin/courses`
- Learning Paths: `http://localhost:3000/admin/learning-paths`
- Reports: `http://localhost:3000/admin/reports`

### Instructor
- Dashboard: `http://localhost:3000/instructor`
- My Courses: `http://localhost:3000/instructor/courses`
- Students: `http://localhost:3000/instructor/students`

### Learner
- Dashboard: `http://localhost:3000/learner`
- My Courses: `http://localhost:3000/learner/courses`
- Learning Paths: `http://localhost:3000/learner/learning-paths`
- Assignments: `http://localhost:3000/learner/assignments`

---

## ✨ What's Fixed

### Before Reset
- ❌ Old JWT tokens with wrong userId
- ❌ Missing tenantId in tokens
- ❌ Inconsistent user roles
- ❌ 401 errors everywhere

### After Reset
- ✅ Fresh JWT tokens with correct userId (UUID)
- ✅ All tokens include tenantId
- ✅ Consistent user roles across database
- ✅ No authentication errors
- ✅ All API endpoints working

---

## 🔄 If You Need to Reset Again

Run this command:
```bash
npm run db:seed
```

This will:
1. Clear all existing data
2. Recreate all tables
3. Seed with fresh users and content
4. Reset all authentication

---

## 📝 Notes

- **Passwords are case-sensitive!** Make sure to use the exact format shown
- **Clear browser cookies** after reset to avoid old session conflicts
- **All learner passwords** are the same: `Learner123!`
- **Test accounts** use `TestPass123!` for easier testing
- **Multi-tenant** testing available with Tenant B accounts

---

## 🎉 You're All Set!

The database is fresh, all users have valid authentication tokens, and you can now login without any 401 errors. Enjoy testing the LMS! 🚀
