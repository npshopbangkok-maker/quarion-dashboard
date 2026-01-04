-- สร้างตาราง user_settings สำหรับเก็บการตั้งค่าต่างๆ
-- รันใน Supabase SQL Editor

CREATE TABLE IF NOT EXISTS user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  setting_key TEXT NOT NULL,
  setting_value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, setting_key)
);

-- Enable Row Level Security
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read/write (for simplicity)
CREATE POLICY "full_access" ON user_settings FOR ALL USING (true) WITH CHECK (true);

-- Create index
CREATE INDEX idx_user_settings_user_key ON user_settings(user_id, setting_key);

-- สร้างตาราง categories สำหรับเก็บหมวดหมู่
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(name, type)
);

-- Enable Row Level Security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read/write
CREATE POLICY "full_access" ON categories FOR ALL USING (true) WITH CHECK (true);

-- Insert default categories
INSERT INTO categories (name, type) VALUES
  ('ขายสินค้า', 'income'),
  ('บริการ', 'income'),
  ('ดอกเบี้ย', 'income'),
  ('รายได้อื่นๆ', 'income'),
  ('ค่าวัตถุดิบ', 'expense'),
  ('ค่าจ้าง', 'expense'),
  ('ค่าเช่า', 'expense'),
  ('ค่าน้ำ', 'expense'),
  ('ค่าไฟ', 'expense'),
  ('ค่าโทรศัพท์', 'expense'),
  ('ค่าอินเทอร์เน็ต', 'expense'),
  ('ค่าขนส่ง', 'expense'),
  ('ค่าใช้จ่ายทั่วไป', 'expense'),
  ('อื่นๆ', 'expense')
ON CONFLICT (name, type) DO NOTHING;
