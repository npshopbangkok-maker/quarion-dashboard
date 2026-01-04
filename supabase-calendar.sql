-- สร้างตาราง scheduled_transactions สำหรับ Calendar
-- รันใน Supabase SQL Editor

CREATE TABLE IF NOT EXISTS scheduled_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category TEXT NOT NULL,
  date INTEGER NOT NULL CHECK (date >= 1 AND date <= 31),
  is_recurring BOOLEAN DEFAULT true,
  recurring_type TEXT DEFAULT 'monthly' CHECK (recurring_type IN ('monthly', 'weekly', 'yearly', 'once')),
  description TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE scheduled_transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read
CREATE POLICY "Anyone can read scheduled_transactions" ON scheduled_transactions
  FOR SELECT USING (true);

-- Policy: Authenticated users can insert
CREATE POLICY "Authenticated users can insert scheduled_transactions" ON scheduled_transactions
  FOR INSERT WITH CHECK (true);

-- Policy: Users can update their own
CREATE POLICY "Users can update own scheduled_transactions" ON scheduled_transactions
  FOR UPDATE USING (true);

-- Policy: Users can delete their own
CREATE POLICY "Users can delete own scheduled_transactions" ON scheduled_transactions
  FOR DELETE USING (true);

-- Create index for faster queries
CREATE INDEX idx_scheduled_transactions_date ON scheduled_transactions(date);
CREATE INDEX idx_scheduled_transactions_type ON scheduled_transactions(type);
