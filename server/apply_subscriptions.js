const db = require('./db');

const createTableQuery = `
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    plan_type VARCHAR(20) DEFAULT 'pro', -- 'pro', 'enterprise'
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'expired', 'cancelled'
    start_date TIMESTAMP DEFAULT NOW(),
    end_date TIMESTAMP,
    payment_ref VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);
`;

async function apply() {
    try {
        await db.query(createTableQuery);
        console.log("Subscriptions table created successfully (or already exists).");
    } catch (err) {
        console.error("Error creating table:", err);
    } finally {
        process.exit();
    }
}

apply();
