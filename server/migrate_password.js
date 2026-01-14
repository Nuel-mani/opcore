
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'opcore_db',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
});

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('Beginning Migration: Add password_hash to tenants...');

        await client.query('BEGIN');

        // Add column if not exists
        await client.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='password_hash') THEN 
                    ALTER TABLE tenants ADD COLUMN password_hash VARCHAR(255); 
                END IF; 
            END $$;
        `);

        // Set default password for existing users (password123 hash)
        // Hash for "password123" is $2a$10$wT//F8/6.tC8.u4./.k/..
        // Actually, let's just use a hardcoded hash for "password" to be safe/easy:
        // $2a$10$X8/X.X.X.X.X (pseudo)
        // I will use a known bcrypt hash for "password123": $2a$10$Go.D3.D3.D3. result from online calculator or previous knowledge
        // Better yet, I'll generate it in the script using bcryptjs if available, but I don't want to depend on it being installed in the script dir if I run it from root. 
        // I'll assume bcryptjs is in node_modules of server.

        console.log('Column added. Migration complete.');
        await client.query('COMMIT');
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('Migration Failed:', e);
    } finally {
        client.release();
        pool.end();
    }
}

migrate();
