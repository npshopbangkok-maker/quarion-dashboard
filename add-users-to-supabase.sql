-- ========================================
-- Run this in Supabase SQL Editor
-- เพิ่ม columns และ users ลง Supabase
-- ========================================

-- Step 1: เพิ่ม columns username และ password (ถ้ายังไม่มี)
ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT;

-- Step 2: ลบ users เก่าทั้งหมด (ถ้าต้องการ fresh start)
-- DELETE FROM users;

-- Step 3: เพิ่ม users ใหม่
INSERT INTO users (id, username, password, name, email, role) VALUES
  ('11111111-1111-1111-1111-111111111111', 'owner', 'quarion2024', 'Owner', 'owner@quarion.com', 'owner'),
  ('22222222-2222-2222-2222-222222222222', 'admin', 'admin2024', 'Admin', 'admin@quarion.com', 'admin'),
  ('33333333-3333-3333-3333-333333333333', 'viewer', 'viewer2024', 'Viewer', 'viewer@quarion.com', 'viewer'),
  ('44444444-4444-4444-4444-444444444444', 'admin01', 'admin01', 'Pukan', 'admin01@quarion.com', 'admin'),
  ('55555555-5555-5555-5555-555555555555', 'admin02', 'admin02', 'Gift', 'admin02@quarion.com', 'admin'),
  ('66666666-6666-6666-6666-666666666666', 'skillfi99', 'skillfi99', 'Skillfi99', 'skillfi99@quarion.com', 'owner'),
  ('77777777-7777-7777-7777-777777777777', 'convertcake', 'convertcake', 'Convertcake', 'convertcake@quarion.com', 'viewer')
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  password = EXCLUDED.password,
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  role = EXCLUDED.role;

-- Step 4: ปิด RLS สำหรับ users table (เพื่อให้ anonymous เข้าได้ตอน login)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- หรือถ้าต้องการ RLS ให้เพิ่ม policy สำหรับ anon
-- CREATE POLICY "Allow anon to read users for auth" ON users FOR SELECT TO anon USING (true);

-- ตรวจสอบผลลัพธ์
SELECT id, username, name, email, role FROM users;
