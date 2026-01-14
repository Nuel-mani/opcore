const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Load environment from server .env
dotenv.config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function checkTenants() {
    const client = await pool.connect();
    try {
        const res = await client.query('SELECT id, business_name, email, subscription_tier FROM tenants');
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error('Check Failed', err);
    } finally {
        client.release();
        await pool.end();
    }
}

checkTenants();
