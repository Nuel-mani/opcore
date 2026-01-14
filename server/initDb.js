const fs = require('fs');
const path = require('path');
const db = require('./db');

async function initDb() {
    try {
        console.log("Reading schema.sql...");
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log("Executing Schema...");
        await db.query(schemaSql);

        console.log("✅ Database Initialized Successfully!");
        process.exit(0);
    } catch (err) {
        console.error("❌ Database Initialization Failed", err);
        process.exit(1);
    }
}

initDb();
