-- OpCore Database Schema (Supabase/PostgreSQL Compatible)
-- Includes "God Mode" Infrastructure & NTA 2025 Triggers

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 0. CLEANUP (For God Mode Init)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;
DROP TABLE IF EXISTS compliance_requests CASCADE;
DROP TABLE IF EXISTS brand_change_history CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS subscription_history CASCADE;
DROP TABLE IF EXISTS starting_balances CASCADE;
DROP TABLE IF EXISTS balance_history CASCADE;

-- =============================================
-- 1. SECTORS (Tax Classification)
-- =============================================
CREATE TABLE IF NOT EXISTS sectors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE,
    is_exempt_from_small_co_benefit BOOLEAN DEFAULT FALSE, -- e.g., Professional Services
    description TEXT
);

INSERT INTO sectors (name, is_exempt_from_small_co_benefit, description) VALUES
('Agriculture', TRUE, 'Exempt from most levies, special incentives'),
('Manufacturing', FALSE, 'Standard CIT rules apply'),
('Professional Services', TRUE, 'Legal, Accountancy, Consulting - NOT exempt from Small Co Levy'),
('General Trade', FALSE, 'Default trading business'),
('Oil & Gas', FALSE, 'Special PPT rates apply')
ON CONFLICT (name) DO NOTHING;

-- =============================================
-- 2. PROFILES (Tenants)
-- =============================================
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    serial_id SERIAL UNIQUE,
    business_name VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255),
    country_code VARCHAR(10) DEFAULT 'NG',
    currency_symbol VARCHAR(5) DEFAULT '₦',
    
    -- "God Mode" & Branding
    subscription_tier VARCHAR(50) DEFAULT 'free',
    account_type VARCHAR(50) DEFAULT 'personal',
    brand_color VARCHAR(50) DEFAULT '#2252c9',
    logo_url TEXT,
    
    -- Tax Data (NTA 2025)
    turnover_band VARCHAR(50) DEFAULT 'micro',
    sector VARCHAR(50) DEFAULT 'general',
    tax_identity_number VARCHAR(50),
    is_tax_exempt BOOLEAN DEFAULT FALSE,
    local_status VARCHAR(20) DEFAULT 'active',
    
    -- Personal Specific
    residence_state VARCHAR(50),
    pays_rent BOOLEAN DEFAULT FALSE,
    rent_amount DECIMAL(19, 2) DEFAULT 0,
    annual_income DECIMAL(19, 2) DEFAULT 0,
    
-- NTA 2025: Business Logic
    business_structure VARCHAR(50), -- 'sole_prop' | 'limited'
    is_professional_service BOOLEAN DEFAULT FALSE, -- NTA 2025 "Professional Services" Trap
    pension_contribution DECIMAL(19, 2) DEFAULT 0, -- For Reliefs
    global_income_days INTEGER DEFAULT 0, -- 183 Day Rule Tracker

    -- [NEW] Contact
    business_address TEXT,
    phone_number VARCHAR(50),
    
    -- [NEW] Sectors (Migration)
    sector_id INTEGER REFERENCES sectors(id),

    is_cit_exempt BOOLEAN DEFAULT FALSE, -- < 25M Turnover
    is_vat_exempt BOOLEAN DEFAULT FALSE, -- < 25M Turnover
    logo_url TEXT,
    
    -- Contact & Location
    country_code VARCHAR(10) DEFAULT 'NG',
    currency_symbol VARCHAR(5) DEFAULT '₦',
    
    last_login TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- 2. TRANSACTIONS (Ledger)
-- =============================================
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    serial_id SERIAL,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    type VARCHAR(20) CHECK (type IN ('income', 'expense')),
    amount DECIMAL(19, 2) NOT NULL,
    category_id VARCHAR(100),
    category_name VARCHAR(100),
    description TEXT,
    payee VARCHAR(255),
    vendor_tin VARCHAR(50), -- NTA 2025 Transaction Integrity
    payment_method VARCHAR(50),
    ref_id VARCHAR(100) UNIQUE, -- The Duplicate Trap: Prevents double-logging
    receipt_urls JSONB DEFAULT '[]', -- Changed from single TEXT to JSON Array for Batch Processing
    vat_amount DECIMAL(19, 2) DEFAULT 0, -- Output VAT (Income) or Input VAT (Expense)
    
    -- Compliance Logic
    is_deductible BOOLEAN DEFAULT FALSE,
    we_compliant BOOLEAN DEFAULT FALSE,
    has_vat_evidence BOOLEAN DEFAULT FALSE,
    is_rnd_expense BOOLEAN DEFAULT FALSE,
    wallet VARCHAR(50) DEFAULT 'operations',
    deduction_tip TEXT,
    is_capital_asset BOOLEAN DEFAULT FALSE,
    asset_class VARCHAR(100),
    
    -- [NEW] Linkage for Evidence
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,

    sync_status VARCHAR(20) DEFAULT 'synced',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- 3. INVOICES (Sales Monitoring)
-- =============================================
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    serial_id SERIAL,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    customer_name VARCHAR(255),
    amount DECIMAL(19, 2) NOT NULL,
    vat_amount DECIMAL(19, 2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'draft',
    date_issued DATE DEFAULT CURRENT_DATE,
    items JSONB DEFAULT '[]',
    
    -- [NEW] Evidence Tracking
    pdf_generated_at TIMESTAMP,
    reprint_count INTEGER DEFAULT 0,

    sync_status VARCHAR(20) DEFAULT 'synced',
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- 4. TAX CONFIG (Global Brain)
-- =============================================
CREATE TABLE IF NOT EXISTS system_settings (
    setting_key VARCHAR(50) PRIMARY KEY,
    setting_value DECIMAL(19, 4),
    description TEXT,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- 5. AUDIT LOGS
-- =============================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID,
    action_type VARCHAR(100),
    details TEXT,
    timestamp TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- 6. BRAND HISTORY
-- =============================================
CREATE TABLE IF NOT EXISTS brand_change_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    change_type VARCHAR(50),
    old_value TEXT,
    new_value TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- 7. SUBSCRIPTIONS
-- =============================================
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    plan_type VARCHAR(20) DEFAULT 'pro',
    status VARCHAR(20) DEFAULT 'active',
    start_date TIMESTAMP DEFAULT NOW(),
    end_date TIMESTAMP,
    payment_ref VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- 8. SUBSCRIPTIONS HISTORY
-- =============================================
CREATE TABLE IF NOT EXISTS subscription_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    old_status VARCHAR(20),
    new_status VARCHAR(20),
    old_plan VARCHAR(20),
    new_plan VARCHAR(20),
    change_reason TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);



-- Trigger to log subscription changes
CREATE OR REPLACE FUNCTION log_subscription_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO subscription_history (tenant_id, new_status, new_plan, change_reason)
        VALUES (NEW.tenant_id, NEW.status, NEW.plan_type, 'Initial Subscription');
    ELSIF (TG_OP = 'UPDATE') THEN
        IF (OLD.status IS DISTINCT FROM NEW.status OR OLD.plan_type IS DISTINCT FROM NEW.plan_type) THEN
            INSERT INTO subscription_history (tenant_id, old_status, new_status, old_plan, new_plan, change_reason)
            VALUES (NEW.tenant_id, OLD.status, NEW.status, OLD.plan_type, NEW.plan_type, 'Plan Update');
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_log_sub_change ON subscriptions;
CREATE TRIGGER trigger_log_sub_change
AFTER INSERT OR UPDATE ON subscriptions
FOR EACH ROW
EXECUTE PROCEDURE log_subscription_change();

-- =============================================
-- 9. STARTING BALANCES (Annual)
-- =============================================
CREATE TABLE IF NOT EXISTS starting_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    amount DECIMAL(19, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(tenant_id, year)
);

-- =============================================
-- 10. BALANCE HISTORY (Monthly Analytics)
-- =============================================
CREATE TABLE IF NOT EXISTS balance_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    month_year VARCHAR(7),
    opening_balance DECIMAL(19, 2),
    total_income DECIMAL(19, 2),
    total_expense DECIMAL(19, 2),
    closing_balance DECIMAL(19, 2),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(tenant_id, month_year)
);

-- =============================================
-- TRIGGERS & FUNCTIONS
-- =============================================

-- Auto-Update Timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_tenants_timestamp ON tenants;
CREATE TRIGGER update_tenants_timestamp BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

-- "Turnover Watch" Trigger
-- "Turnover & Asset Watch" Trigger (Triple Constraint Enforcement)
CREATE OR REPLACE FUNCTION check_turnover_threshold()
RETURNS TRIGGER AS $$
DECLARE
    total_sales DECIMAL;
    total_assets DECIMAL;
    professional_service BOOLEAN;
BEGIN
    -- 1. Calculate Total Sales (Invoices + Ledger Income)
    SELECT (
        COALESCE((SELECT SUM(amount) FROM invoices WHERE tenant_id = NEW.tenant_id AND status = 'paid'), 0) +
        COALESCE((SELECT SUM(amount) FROM transactions WHERE tenant_id = NEW.tenant_id AND type = 'income'), 0)
    ) INTO total_sales;

    -- 2. Calculate Total Assets (Net Book Value Approximation - Sum of Capital Assets)
    SELECT COALESCE(SUM(amount), 0)
    INTO total_assets
    FROM transactions 
    WHERE tenant_id = NEW.tenant_id 
    AND is_capital_asset = TRUE;

    -- 3. Check Sector (Professional Service Trap)
    SELECT is_professional_service INTO professional_service
    FROM tenants
    WHERE id = NEW.tenant_id;

    -- NTA 2025 Triple Constraint Logic
    -- Exemption is LOST if: Turnover > 100M OR Assets > 250M OR Professional Service
    IF total_sales > 100000000 OR total_assets > 250000000 OR professional_service = TRUE THEN
        UPDATE tenants 
        SET turnover_band = CASE 
                WHEN total_sales > 100000000 THEN 'large' 
                ELSE 'medium' -- Asset/Sector triggered
            END,
            is_cit_exempt = FALSE, 
            is_vat_exempt = FALSE 
        WHERE id = NEW.tenant_id;
    ELSE
        -- Revert to exempt if they fall back within limits (and not Prof Service)
        UPDATE tenants 
        SET turnover_band = CASE 
                WHEN total_sales < 25000000 THEN 'micro'
                ELSE 'small'
            END,
            is_cit_exempt = (total_sales < 100000000), -- Strictly < 100M
            is_vat_exempt = (total_sales < 25000000) -- VAT still triggers at 25M
        WHERE id = NEW.tenant_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS turnover_watch ON invoices;
CREATE TRIGGER turnover_watch
AFTER INSERT OR UPDATE ON invoices
FOR EACH ROW
EXECUTE PROCEDURE check_turnover_threshold();

DROP TRIGGER IF EXISTS turnover_watch_ledger ON transactions;
CREATE TRIGGER turnover_watch_ledger
AFTER INSERT OR UPDATE ON transactions
FOR EACH ROW
EXECUTE PROCEDURE check_turnover_threshold();



-- =============================================
-- SEED DATA ("GOD MODE")
-- =============================================

-- 1. God Mode User (Pro, Business)
INSERT INTO tenants (id, business_name, email, subscription_tier, account_type, turnover_band, local_status)
VALUES (
    '11111111-1111-1111-1111-111111111111', 
    'God Mode Business Ltd', 
    'godmode@opcore.ng', 
    'pro', 
    'business', 
    'medium', 
    'active'
) ON CONFLICT (email) DO UPDATE SET subscription_tier = 'pro';

-- 2. God Mode User (Free, Personal)
INSERT INTO tenants (id, business_name, email, subscription_tier, account_type, turnover_band, local_status)
VALUES (
    '22222222-2222-2222-2222-222222222222', 
    'John Doe Personal', 
    'freeuser@opcore.ng', 
    'free', 
    'personal', 
    'micro', 
    'active'
) ON CONFLICT (email) DO NOTHING;

-- 3. Adewale Johnson (Personal - Seed)
INSERT INTO tenants (id, business_name, email, subscription_tier, account_type, turnover_band, local_status)
VALUES (
    '5c2677f7-ba6f-481f-859e-805529c1b071',
    'Adewale Johnson',
    'ade@gmail.com',
    'pro',
    'personal',
    'micro',
    'active'
) ON CONFLICT (email) DO NOTHING;

-- 4. Lagos Ventures LLC (Business - Seed)
INSERT INTO tenants (id, business_name, email, subscription_tier, account_type, turnover_band, local_status)
VALUES (
    '87aa1dd6-b742-4549-bfff-fe0ba16dce0e',
    'Lagos Ventures LLC',
    'lagos@gmail.com',
    'pro',
    'business',
    'medium',
    'active'
) ON CONFLICT (email) DO NOTHING;

-- 3. Tax Settings
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('vat_rate', 7.5, 'Standard VAT Rate'),
('cit_rate_small', 0, 'CIT for turnover < 25M'),
('cit_rate_medium', 30, 'CIT for turnover > 100M'),
('development_levy_rate', 4, 'NTA 2025 Dev Levy (4% on Assessable Profit)'),
('rent_relief_cap', 500000, 'Max Rent Relief Deduction'),
('pro_monthly_price', 2500, 'Pro Plan Monthly Price (NGN)'),
('pro_yearly_price', 25000, 'Pro Plan Yearly Price (NGN)')
ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value;

-- =============================================
-- MOCK data testing
-- =============================================

-- 1. ADEWALE JOHNSON TRANSACTIONS
INSERT INTO transactions (tenant_id, date, type, amount, category_id, category_name, description, is_deductible, has_vat_evidence, wallet) VALUES
('5c2677f7-ba6f-481f-859e-805529c1b071', '2026-01-01', 'income', 300000.00, '', 'Salary', 'January Monthly Salary', false, false, 'operations'),
('5c2677f7-ba6f-481f-859e-805529c1b071', '2026-01-02', 'expense', 70000.00, '', 'Rent', 'Monthly House Rent (Eligible for 20% Relief)', true, true, 'operations');

-- 2. LAGOS VENTURES LLC TRANSACTIONS
INSERT INTO transactions (tenant_id, date, type, amount, category_id, category_name, description, is_deductible, has_vat_evidence, is_rnd_expense, is_capital_asset, wallet) VALUES
('87aa1dd6-b742-4549-bfff-fe0ba16dce0e', '2026-01-01', 'income', 4500000.00, '', 'Consulting', 'Project Alpha Payment', false, false, false, false, 'operations'),
('87aa1dd6-b742-4549-bfff-fe0ba16dce0e', '2026-01-05', 'expense', 500000.00, '', 'Marketing', 'Digital Ad Campaign (Missing VAT Evidence)', false, false, false, false, 'operations');