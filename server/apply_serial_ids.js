const db = require('./db');

const migrationScript = `
-- 1. Add serial_id to tenants if not exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='serial_id') THEN 
        ALTER TABLE tenants ADD COLUMN serial_id SERIAL UNIQUE; 
    END IF; 
END $$;

-- 2. Add serial_id to transactions if not exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='serial_id') THEN 
        ALTER TABLE transactions ADD COLUMN serial_id SERIAL; 
    END IF; 
END $$;

-- 3. Add serial_id to invoices if not exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoices' AND column_name='serial_id') THEN 
        ALTER TABLE invoices ADD COLUMN serial_id SERIAL; 
    END IF; 
END $$;
`;

async function apply() {
    try {
        console.log("Applying Serial ID Migration...");
        await db.query(migrationScript);
        console.log("Migration Successful: serial_id columns added.");
    } catch (err) {
        console.error("Migration Error:", err);
    } finally {
        process.exit();
    }
}

apply();
