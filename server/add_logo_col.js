const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function run() {
    try {
        console.log("Adding logo_url column to tenants...");
        await pool.query(`
            ALTER TABLE tenants 
            ADD COLUMN IF NOT EXISTS logo_url TEXT;
        `);
        console.log("✅ Column added.");
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

run();
