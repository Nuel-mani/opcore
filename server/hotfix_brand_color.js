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

async function hotfixBrandColor() {
    console.log('🔵 Updating all tenants to Brand Color: #2252c9');
    const client = await pool.connect();
    try {
        const res = await client.query(`
            UPDATE tenants 
            SET brand_color = '#2252c9'
            WHERE brand_color = '#ea580c' OR brand_color = '#D9A47A' OR brand_color IS NULL OR brand_color = '#2563eb'
        `);
        console.log(`✅ Updated ${res.rowCount} tenants.`);
    } catch (err) {
        console.error('Update Failed', err);
    } finally {
        client.release();
        await pool.end();
    }
}

hotfixBrandColor();
