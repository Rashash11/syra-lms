-- Fix user roles to match their intended roles

-- Update admin users
UPDATE users SET role = 'ADMIN', "activeRole" = 'ADMIN' 
WHERE email IN ('admin@portal.com', 'admin-a@test.local', 'admin-b@test.local');

-- Update super instructor users
UPDATE users SET role = 'SUPER_INSTRUCTOR', "activeRole" = 'SUPER_INSTRUCTOR' 
WHERE email IN ('superinstructor@portal.com', 'super-instructor-a@test.local');

-- Update instructor users
UPDATE users SET role = 'INSTRUCTOR', "activeRole" = 'INSTRUCTOR' 
WHERE email IN ('instructor@portal.com', 'instructor-a@test.local', 'instructor-b@test.local');

-- Update learner users (keep as LEARNER)
UPDATE users SET role = 'LEARNER', "activeRole" = 'LEARNER' 
WHERE email LIKE 'learner%';

-- Verify the changes
SELECT email, role, "activeRole" FROM users ORDER BY role, email;
