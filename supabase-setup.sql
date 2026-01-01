-- Quarion Dashboard Database Schema (Simplified - No Auth Required)
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

-- Enable Row Level Security but allow all operations (for demo)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read/write (for demo purposes)
CREATE POLICY "Allow all for categories" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for transactions" ON transactions FOR ALL USING (true) WITH CHECK (true);

-- Create storage bucket for slips (optional)
INSERT INTO storage.buckets (id, name, public) VALUES ('slips', 'slips', true)
ON CONFLICT DO NOTHING;
