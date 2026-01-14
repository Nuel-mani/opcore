const db = require('./db');

const createTableQuery = `
CREATE TABLE IF NOT EXISTS brand_change_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    change_type VARCHAR(50), -- 'logo', 'color', 'info'
    old_value TEXT,
    new_value TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
`;

async function apply() {
    try {
        await db.query(createTableQuery);
        console.log("brand_change_history table created successfully (or already exists).");
    } catch (err) {
        console.error("Error creating table:", err);
    } finally {
        process.exit();
    }
}

apply();
