const db = require('./db');

(async () => {
    try {
        console.log("Migrating Invoices Table...");
        await db.query(`
            ALTER TABLE invoices 
            ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb,
            ADD COLUMN IF NOT EXISTS vat_amount DECIMAL(19, 2) DEFAULT 0
        `);
        console.log("Migration Complete: Added items and vat_amount to invoices.");
        process.exit(0);
    } catch (err) {
        console.error("Migration Failed", err);
        process.exit(1);
    }
})();
