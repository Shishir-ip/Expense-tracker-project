-- ============================================================
-- EXPENSE TRACKER - SUPABASE DATABASE SCHEMA
-- ============================================================
-- Run this SQL in your Supabase SQL Editor to create the required tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    pin_hash VARCHAR(255) NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    otp_code VARCHAR(6),
    otp_expiry TIMESTAMPTZ,
    reset_otp VARCHAR(6),
    reset_otp_expiry TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- ============================================================
-- EXPENSES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    category VARCHAR(50) NOT NULL,
    notes TEXT,
    date DATE NOT NULL,
    is_recurring BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);

-- ============================================================
-- BUDGETS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    category VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    month VARCHAR(7) NOT NULL, -- Format: YYYY-MM
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create unique constraint (one budget per category per month)
CREATE UNIQUE INDEX IF NOT EXISTS idx_budgets_user_category_month 
ON budgets(user_id, category, month);

-- ============================================================
-- BORROW_LEND TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS borrow_lend (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    person_name VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('borrow', 'lend')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'settled')),
    paid_amount DECIMAL(10,2) DEFAULT 0,
    due_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_borrow_lend_user_id ON borrow_lend(user_id);
CREATE INDEX IF NOT EXISTS idx_borrow_lend_type ON borrow_lend(type);
CREATE INDEX IF NOT EXISTS idx_borrow_lend_status ON borrow_lend(status);

-- ============================================================
-- MONTHLY TARGETS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS monthly_targets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    daily_avg_target DECIMAL(10,2) DEFAULT 0,
    total_monthly_target DECIMAL(10,2) DEFAULT 0,
    year_month VARCHAR(7) NOT NULL, -- Format: YYYY-MM
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create unique constraint (one target per month)
CREATE UNIQUE INDEX IF NOT EXISTS idx_monthly_targets_user_month 
ON monthly_targets(user_id, year_month);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE borrow_lend ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_targets ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view their own data"
ON users FOR SELECT
USING (auth.uid() = id OR true); -- Allow read for demo

CREATE POLICY "Users can insert their own data"
ON users FOR INSERT
WITH CHECK (true); -- Allow registration

CREATE POLICY "Users can update their own data"
ON users FOR UPDATE
USING (auth.uid() = id OR true); -- Allow update for demo

-- Expenses table policies
CREATE POLICY "Users can view their own expenses"
ON expenses FOR SELECT
USING (user_id = (SELECT id FROM users WHERE true LIMIT 1) OR true); -- Demo: allow all

CREATE POLICY "Users can insert their own expenses"
ON expenses FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update their own expenses"
ON expenses FOR UPDATE
USING (true);

CREATE POLICY "Users can delete their own expenses"
ON expenses FOR DELETE
USING (true);

-- Budgets table policies
CREATE POLICY "Users can view their own budgets"
ON budgets FOR SELECT
USING (true);

CREATE POLICY "Users can manage their own budgets"
ON budgets FOR ALL
USING (true)
WITH CHECK (true);

-- Borrow/Lend table policies
CREATE POLICY "Users can view their own borrow/lend records"
ON borrow_lend FOR SELECT
USING (true);

CREATE POLICY "Users can manage their own borrow/lend records"
ON borrow_lend FOR ALL
USING (true)
WITH CHECK (true);

-- Monthly targets policies
CREATE POLICY "Users can view their own targets"
ON monthly_targets FOR SELECT
USING (true);

CREATE POLICY "Users can manage their own targets"
ON monthly_targets FOR ALL
USING (true)
WITH CHECK (true);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_expenses_updated_at
BEFORE UPDATE ON expenses
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budgets_updated_at
BEFORE UPDATE ON budgets
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_borrow_lend_updated_at
BEFORE UPDATE ON borrow_lend
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_monthly_targets_updated_at
BEFORE UPDATE ON monthly_targets
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- SAMPLE DATA (OPTIONAL - FOR TESTING)
-- ============================================================
-- Uncomment below to insert sample data for testing

-- INSERT INTO users (email, username, name, pin_hash, is_verified)
-- VALUES (
--     'test@gmail.com',
--     'testuser',
--     'Test User',
--     'demo_hash_placeholder',
--     true
-- );
