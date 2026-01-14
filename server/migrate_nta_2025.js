
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
        console.log('Beginning Migration: Add NTA 2025 columns to transactions...');

        await client.query('BEGIN');

        const columns = [
            { name: 'has_vat_evidence', type: 'BOOLEAN DEFAULT FALSE' },
            { name: 'is_deductible', type: 'BOOLEAN DEFAULT FALSE' },
            { name: 'deduction_tip', type: 'TEXT' },
            { name: 'is_rnd_expense', type: 'BOOLEAN DEFAULT FALSE' },
            { name: 'wallet', type: "VARCHAR(50) DEFAULT 'operations'" }
        ];

        for (const col of columns) {
            await client.query(`
                DO $$ 
                BEGIN 
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='${col.name}') THEN 
                        ALTER TABLE transactions ADD COLUMN ${col.name} ${col.type}; 
                        RAISE NOTICE 'Added column %', '${col.name}';
                    END IF; 
                END $$;
            `);
        }

        console.log('NTA 2025 Columns verified/added.');
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
