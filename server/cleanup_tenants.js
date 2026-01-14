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

async function cleanupTenants() {
    const PRESERVE_ID = 'b77d3046-96ec-47c9-bb4a-6e392445f856';
    console.log(`🗑️  Purging all tenants except: ${PRESERVE_ID}`);

    const client = await pool.connect();
    try {
        const res = await client.query(`
            DELETE FROM tenants 
            WHERE id != $1
        `, [PRESERVE_ID]);

        console.log(`✅ Deleted ${res.rowCount} tenants (and linked data).`);

    } catch (err) {
        console.error('Cleanup Failed', err);
    } finally {
        client.release();
        await pool.end();
    }
}

cleanupTenants();
