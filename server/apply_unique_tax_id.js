const db = require('./db');

const migrationScript = `
-- Enforce Uniqueness on tax_identity_number
-- First, handle duplicates if any (though unlikely in dev) by appending random suffix (Optional safety, usually we just fail)
-- For this environment, we assume clean data or fail.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'tenants_tax_identity_number_key'
    ) THEN
        ALTER TABLE tenants 
        ADD CONSTRAINT tenants_tax_identity_number_key UNIQUE (tax_identity_number);
    END IF;
END $$;
`;

async function apply() {
    try {
        console.log("Applying Unique Constraint to Tax ID...");
        await db.query(migrationScript);
        console.log("Constraint Applied: Tax IDs must now be unique.");
    } catch (err) {
        // If duplicate key error, warn user
        if (err.code === '23505') {
            console.error("Failed: Duplicate Tax IDs found. Please resolve duplicates before enforcing uniqueness.");
        } else {
            console.error("Migration Error:", err);
        }
    } finally {
        process.exit();
    }
}

apply();
