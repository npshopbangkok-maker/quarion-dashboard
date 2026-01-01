-- Quarion Dashboard Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner', 'admin', 'viewer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount NUMERIC NOT NULL CHECK (amount > 0),
  category TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  slip_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default categories
INSERT INTO categories (name, type) VALUES
  ('ขายสินค้า', 'income'),
  ('บริการ', 'income'),
  ('ดอกเบี้ย', 'income'),
  ('รายได้อื่นๆ', 'income'),
  ('เงินเดือน', 'expense'),
  ('ค่าเช่า', 'expense'),
  ('ค่าน้ำค่าไฟ', 'expense'),
  ('อุปกรณ์สำนักงาน', 'expense'),
  ('การตลาด', 'expense'),
  ('ค่าใช้จ่ายอื่นๆ', 'expense')
ON CONFLICT DO NOTHING;

-- Insert demo users (password will be set via Supabase Auth)
INSERT INTO users (id, name, email, role) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Owner Demo', 'owner@demo.com', 'owner'),
  ('22222222-2222-2222-2222-222222222222', 'Admin Demo', 'admin@demo.com', 'admin'),
  ('33333333-3333-3333-3333-333333333333', 'Viewer Demo', 'viewer@demo.com', 'viewer')
ON CONFLICT (email) DO NOTHING;

-- Insert sample transactions
INSERT INTO transactions (type, amount, category, description, date, created_by) VALUES
  ('income', 150000, 'ขายสินค้า', 'ขายสินค้าออนไลน์', '2026-01-15', '11111111-1111-1111-1111-111111111111'),
  ('income', 85000, 'บริการ', 'ค่าบริการที่ปรึกษา', '2026-01-20', '11111111-1111-1111-1111-111111111111'),
  ('expense', 45000, 'เงินเดือน', 'เงินเดือนพนักงาน', '2026-01-25', '22222222-2222-2222-2222-222222222222'),
  ('expense', 15000, 'ค่าเช่า', 'ค่าเช่าออฟฟิศ', '2026-01-01', '22222222-2222-2222-2222-222222222222'),
  ('income', 250000, 'ขายสินค้า', 'ยอดขายประจำเดือน', '2026-01-28', '11111111-1111-1111-1111-111111111111')
ON CONFLICT DO NOTHING;

-- Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Policies for authenticated users
CREATE POLICY "Users can view all users" ON users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Only owners can manage users" ON users FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'owner'));

CREATE POLICY "Everyone can view categories" ON categories FOR SELECT TO authenticated USING (true);

CREATE POLICY "Everyone can view transactions" ON transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins and owners can manage transactions" ON transactions FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin')));

-- Create storage bucket for slips
INSERT INTO storage.buckets (id, name, public) VALUES ('slips', 'slips', true)
ON CONFLICT DO NOTHING;

-- Storage policy
CREATE POLICY "Authenticated users can upload slips" ON storage.objects FOR INSERT TO authenticated 
  WITH CHECK (bucket_id = 'slips');
CREATE POLICY "Anyone can view slips" ON storage.objects FOR SELECT TO authenticated 
  USING (bucket_id = 'slips');
