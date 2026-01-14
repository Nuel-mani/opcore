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

async function addProfileCols() {
    console.log('🔄 Adding business_address and phone_number to tenants table...');
    const client = await pool.connect();
    try {
        await client.query(`
            ALTER TABLE tenants 
            ADD COLUMN IF NOT EXISTS business_address TEXT,
            ADD COLUMN IF NOT EXISTS phone_number VARCHAR(50);
        `);
        console.log('✅ Columns added successfully.');
    } catch (err) {
        console.error('Migration Failed', err);
    } finally {
        client.release();
        await pool.end();
    }
}

addProfileCols();
