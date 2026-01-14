const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const dotenv = require('dotenv');

// Load environment variables from server directory
const envPath = path.join(__dirname, '.env');
dotenv.config({ path: envPath });

console.log('Using Environment:', {
    user: process.env.DB_USER,
    port: process.env.DB_PORT,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD ? '****' : 'MISSING' // Security
});

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function resetDatabase() {
    const client = await pool.connect();
    try {
        console.log('🔄 Connected to PostgreSQL...');

        // Read schema.sql
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log('🔥 Dropping and Recreating Schema...');

        // Execute the entire SQL file
        await client.query(schemaSql);

        console.log('✅ Database Reset Complete!');
        console.log('🌱 Seed Data Inserted.');

    } catch (err) {
        console.error('❌ Database Reset Failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

resetDatabase();
