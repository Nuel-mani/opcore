const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Explicitly load .env from the server directory BEFORE importing db
require('dotenv').config({ path: path.join(__dirname, '.env') });

const db = require('./db');
const bcrypt = require('bcryptjs');
const multer = require('multer');

const app = express();

app.use(cors());
app.use(express.json({ limit: '20mb' }));

// Configure Multer for Local Storage
const uploadDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images are allowed'));
        }
    }
});

app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

const PORT = process.env.PORT || 3001;

// ==========================================
// 1. HEALTH CHECK
// ==========================================
app.get('/api/status', async (req, res) => {
    try {
        const result = await db.query('SELECT NOW()');
        res.json({
            status: 'online',
            db_time: result.rows[0].now,
            message: 'OpCore Backend Online (PostgreSQL Connected)'
        });
    } catch (err) {
        console.error("DB Connection Failed", err);
        res.status(500).json({ status: 'error', error: err.message });
    }
});

// ==========================================
// 1.1 ADMIN ENDPOINTS (God Mode)
// ==========================================
app.get('/api/admin/users', async (req, res) => {
    try {
        // In a real app, verify Admin Secret Header here
        const result = await db.query(`
            SELECT id, business_name, email, account_type, subscription_tier, local_status, created_at 
            FROM tenants 
            ORDER BY created_at DESC
        `);
        res.json({ users: result.rows });
    } catch (err) {
        console.error("Admin Fetch Failed", err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/admin/compliance', async (req, res) => {
    // Mock Compliance Queue
    res.json([
        { id: '1', user_id: 'u1', user_name: 'Lagos Ventures', request_type: 'sme_status', status: 'pending' },
        { id: '2', user_id: 'u2', user_name: 'Abuja Tech', request_type: 'rent_relief', status: 'pending' }
    ]);
});

app.get('/api/admin/config', async (req, res) => {
    try {
        const result = await db.query('SELECT setting_key, setting_value FROM system_settings');
        const config = {};
        result.rows.forEach(row => {
            config[row.setting_key] = parseFloat(row.setting_value);
        });
        res.json(config);
    } catch (err) {
        console.error("Config Fetch Failed", err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/admin/config', async (req, res) => {
    const { key, value } = req.body;
    try {
        await db.query(`
            INSERT INTO system_settings (setting_key, setting_value)
            VALUES ($1, $2)
            ON CONFLICT (setting_key) DO UPDATE SET setting_value = $2, updated_at = NOW()
        `, [key, value]);
        res.json({ status: 'success' });
    } catch (err) {
        console.error("Config Update Failed", err);
        res.status(500).json({ error: err.message });
    }
});

// Public Config Endpoint (For Tenants)
app.get('/api/config', async (req, res) => {
    try {
        const result = await db.query('SELECT setting_key, setting_value FROM system_settings');
        const config = {};
        result.rows.forEach(row => {
            config[row.setting_key] = parseFloat(row.setting_value);
        });
        res.json(config);
    } catch (err) {
        console.error("Public Config Fetch Failed", err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/admin/compliance/:id', async (req, res) => {
    res.json({ status: 'success' });
});

// Backfill Subscriptions for existing users
app.post('/api/admin/backfill-subscriptions', async (req, res) => {
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        // Find tenants without subscriptions
        const missing = await client.query(`
            SELECT t.id, t.subscription_tier 
            FROM tenants t
            LEFT JOIN subscriptions s ON t.id = s.tenant_id
            WHERE s.id IS NULL
        `);

        let count = 0;
        for (const tenant of missing.rows) {
            await client.query(`
                INSERT INTO subscriptions(tenant_id, plan_type, status)
                VALUES($1, $2, 'active')
            `, [tenant.id, tenant.subscription_tier || 'free']);
            count++;
        }

        await client.query('COMMIT');
        res.json({ status: 'success', backfilled: count });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// ==========================================
// 1.5 FILE UPLOAD
// ==========================================
app.post('/api/upload', upload.single('logo'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Construct public URL
        const fileUrl = `/uploads/${req.file.filename}`;

        res.json({
            status: 'success',
            url: fileUrl,
            message: 'File uploaded successfully'
        });
    } catch (err) {
        console.error("Upload Error", err);
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 2. SYNC ENGINE (Offline-First)
// ==========================================
app.post('/api/sync/transactions', async (req, res) => {
    const { transactions, tenantId } = req.body;
    console.log(`Syncing ${transactions.length} txs for ${tenantId}`);

    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        for (const tx of transactions) {
            await client.query(`
                INSERT INTO transactions(
                    id, tenant_id, date, type, amount, category_id, category_name, description,
                    payee, payment_method, ref_id, receipt_urls,
                    is_deductible, we_compliant, has_vat_evidence, is_rnd_expense,
                    wallet, deduction_tip, is_capital_asset, asset_class, vendor_tin, sync_status
                ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, 'synced')
                ON CONFLICT(id) DO UPDATE SET
                    amount = EXCLUDED.amount,
                    description = EXCLUDED.description,
                    category_id = EXCLUDED.category_id,
                    is_deductible = EXCLUDED.is_deductible,
                    we_compliant = EXCLUDED.we_compliant,
                    has_vat_evidence = EXCLUDED.has_vat_evidence,
                    is_rnd_expense = EXCLUDED.is_rnd_expense,
                    wallet = EXCLUDED.wallet,
                    deduction_tip = EXCLUDED.deduction_tip,
                    vendor_tin = EXCLUDED.vendor_tin,
                    sync_status = 'synced',
                    updated_at = NOW()
            `, [
                tx.id, tenantId, tx.date, tx.type, tx.amount, tx.categoryId, tx.categoryName, tx.description,
                tx.payee, tx.paymentMethod, tx.refId, JSON.stringify(tx.receiptUrls || []),
                tx.isDeductible, tx.weCompliant, tx.hasVatEvidence, tx.isRndExpense,
                tx.wallet, tx.deductionTip, tx.isCapitalAsset, tx.assetClass, tx.vendorTin
            ]);
        }

        await client.query('COMMIT');
        res.json({ status: 'success', synced_count: transactions.length });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Sync Failed", err);
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

app.get('/api/sync/transactions', async (req, res) => {
    const { tenantId, lastSync } = req.query;
    if (!tenantId) return res.status(400).json({ error: 'Missing tenantId' });

    try {
        // Only fetch transactions updated AFTER the last sync
        const queryText = `
            SELECT * FROM transactions 
            WHERE tenant_id = $1 
            AND updated_at > $2
        `;
        // Default to epoch 0 if lastSync is missing (full sync)
        const since = lastSync ? new Date(lastSync) : new Date(0);

        const result = await db.query(queryText, [tenantId, since.toISOString()]);

        // Map back to camelCase
        const transactions = result.rows.map(row => ({
            id: row.id,
            date: row.date,
            type: row.type,
            amount: parseFloat(row.amount),
            categoryId: row.category_id,
            categoryName: row.category_name,
            description: row.description,
            payee: row.payee,
            paymentMethod: row.payment_method,
            refId: row.ref_id,
            receiptImageUrl: row.receipt_image_url,
            isDeductible: row.is_deductible,
            weCompliant: row.we_compliant,
            hasVatEvidence: row.has_vat_evidence,
            isRndExpense: row.is_rnd_expense,
            wallet: row.wallet,
            deductionTip: row.deduction_tip,
            isCapitalAsset: row.is_capital_asset,
            assetClass: row.asset_class,
            vendorTin: row.vendor_tin,
            syncStatus: 'synced' // Explicitly mark coming from server as synced
        }));

        res.json({ transactions });
    } catch (err) {
        console.error("Pull Sync Failed", err);
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 3. INVOICE GENERATOR
// ==========================================
app.post('/api/invoices', async (req, res) => {
    // ... (Invoice Logic)
    res.json({ status: 'mock_success', message: 'Invoice generated' });
});

app.get('/api/invoices', async (req, res) => {
    try {
        const { tenantId } = req.query;
        if (!tenantId) return res.status(400).json({ error: 'Missing tenantId' });

        const result = await db.query('SELECT * FROM invoices WHERE tenant_id = $1', [tenantId]);
        res.json({ invoices: result.rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 3.5 SYNC ENDPOINTS (Data Pull)
// ==========================================
app.get('/api/sync/invoices', async (req, res) => {
    try {
        const { tenantId } = req.query;
        if (!tenantId) return res.status(400).json({ error: 'Missing tenantId' });
        const result = await db.query('SELECT * FROM invoices WHERE tenant_id = $1', [tenantId]);
        res.json({ invoices: result.rows });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/sync/subscriptions', async (req, res) => {
    try {
        const { tenantId } = req.query;
        if (!tenantId) return res.status(400).json({ error: 'Missing tenantId' });
        // Return active subscription (Mock if table empty)
        res.json({ subscription: { tier: 'free', active: true } });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/sync/balances/starting', async (req, res) => {
    try {
        const { tenantId } = req.query;
        if (!tenantId) return res.status(400).json({ error: 'Missing tenantId' });
        res.json({
            status: 'success',
            data: [{ year: new Date().getFullYear(), amount: 0 }]
        });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/sync/balances/history', async (req, res) => {
    res.json({ history: [] }); // Placeholder
});

// ==========================================
// 4. AUTHENTICATION (Login)
// ==========================================
app.get('/api/sectors', async (req, res) => {
    try {
        const result = await db.query('SELECT name FROM sectors ORDER BY name ASC');
        if (result.rows.length === 0) {
            // Fallback if table empty
            return res.json([
                { name: 'general' }, { name: 'agriculture' }, { name: 'manufacturing' },
                { name: 'tech' }, { name: 'retail' }, { name: 'finance' },
                { name: 'education' }, { name: 'health' }
            ]);
        }
        res.json(result.rows);
    } catch (err) {
        console.error("Sector Fetch Failed", err);
        // Fallback on error
        res.json([
            { name: 'general' }, { name: 'agriculture' }, { name: 'manufacturing' },
            { name: 'tech' }, { name: 'retail' }, { name: 'finance' },
            { name: 'education' }, { name: 'health' }
        ]);
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await db.query('SELECT * FROM tenants WHERE email = $1', [email]);
        const tenant = result.rows[0];

        if (!tenant) return res.status(401).json({ error: 'Invalid credentials' });

        const valid = await bcrypt.compare(password, tenant.password_hash);
        if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

        res.json({
            status: 'success',
            data: {
                id: tenant.id,
                email: tenant.email,
                businessName: tenant.business_name,
                accountType: (tenant.account_type || 'personal').toLowerCase(),
                subscriptionTier: tenant.subscription_tier,
                turnoverBand: tenant.turnover_band,
                sector: tenant.sector,
                taxIdentityNumber: tenant.tax_identity_number,
                localStatus: tenant.local_status,
                // Merged Fields
                brandColor: tenant.brand_color,
                logoUrl: tenant.logo_url,
                businessAddress: tenant.business_address,
                phoneNumber: tenant.phone_number,
                residenceState: tenant.residence_state,
                countryCode: 'NG',
                currencySymbol: '₦'
            }
        });
    } catch (err) {
        console.error("Login Error", err);
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 5. REGISTRATION
// ==========================================
app.post('/api/auth/register', async (req, res) => {
    const {
        email, password, businessName, accountType,
        subscriptionTier, turnoverBand, sector, taxIdentityNumber,
        residenceState, paysRent, rentAmount, annualIncome,
        businessStructure, brandColor,
        businessAddress, phoneNumber
    } = req.body;

    if (!email || !password) return res.status(400).json({ error: 'Email and Password are required' });

    const client = await db.pool.connect();
    try {
        console.log("📝 Registering Tenant:", email, businessName); // DEBUG LOG
        await client.query('BEGIN');

        // Check if exists
        const check = await client.query('SELECT id FROM tenants WHERE email = $1', [email]);
        if (check.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(409).json({ error: 'User already exists with this email.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        // Lookup Sector ID
        const sectorRes = await client.query('SELECT id FROM sectors WHERE name = $1', [sector || 'general']);
        let sectorId = sectorRes.rows.length > 0 ? sectorRes.rows[0].id : null;

        // Fallback: If sector not found (and not general), maybe default to general's ID? 
        if (!sectorId) {
            const genSec = await client.query('SELECT id FROM sectors WHERE name = $1', ['general']);
            if (genSec.rows.length > 0) sectorId = genSec.rows[0].id;
        }

        // Insert Tenant
        const result = await client.query(`
            INSERT INTO tenants(
                email, password_hash, business_name, account_type, subscription_tier,
                turnover_band, sector, sector_id, tax_identity_number,
                residence_state, pays_rent, rent_amount, annual_income,
                business_structure, brand_color,
                is_professional_service, pension_contribution, global_income_days,
                local_status,
                business_address, phone_number
            ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, 'active', $19, $20)
            RETURNING *
        `, [
            email, hash, businessName, (accountType || 'personal').toLowerCase(), (subscriptionTier || 'free').toLowerCase(),
            turnoverBand || 'micro', sector || 'general', sectorId, taxIdentityNumber,
            residenceState, paysRent, rentAmount, annualIncome,
            businessStructure, brandColor || '#2252c9',
            false, 0, 0, // Defaults for new fields
            businessAddress, phoneNumber
        ]);

        const newId = result.rows[0].id;

        // 2. Create Subscription Record
        await client.query(`
            INSERT INTO subscriptions(tenant_id, plan_type, status)
            VALUES($1, $2, 'active')
        `, [newId, subscriptionTier || 'free']);

        await client.query('COMMIT');

        res.json({
            status: 'success',
            message: 'Account created successfully',
            data: result.rows[0]
        });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Registration Failed", err);
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// ==========================================
// 6. BRAND CONSISTENCY (Rate Limiting)
// ==========================================
app.post('/api/brand/update', async (req, res) => {
    let client;
    try {
        const { tenantId, updates } = req.body;

        const restrictedFields = ['brand_color', 'logo_url', 'business_address', 'phone_number', 'business_name', 'tax_identity_number'];
        const fieldsToUpdate = updates ? Object.keys(updates).filter(k => restrictedFields.includes(k)) : [];

        if (!tenantId || !updates) {
            return res.status(400).json({ error: 'Missing tenantId or updates' });
        }

        client = await db.pool.connect();
        await client.query('BEGIN');

        // 1. Check History Limit (Raised to 10 records)
        const history = await client.query(`
            SELECT COUNT(*) as count 
            FROM brand_change_history 
            WHERE tenant_id = $1 
            AND created_at > NOW() - INTERVAL '3 months'
        `, [tenantId]);

        if (parseInt(history.rows[0].count) >= 10) {
            await client.query('ROLLBACK');
            return res.status(403).json({
                error: 'Brand consistency limit reached. Maximum 10 changes allowed every 3 months.'
            });
        }

        // 2. Process Updates
        // Perform Updates
        const setClauses = [];
        const values = [tenantId];
        let idx = 2;

        // Map incoming camelCase to snake_case for DB
        const dbFieldMap = {
            businessName: 'business_name',
            businessAddress: 'business_address',
            phoneNumber: 'phone_number',
            tinNumber: 'tax_identity_number',
            taxIdentityNumber: 'tax_identity_number',
            brandColor: 'brand_color',
            logoUrl: 'logo_url'
        };

        // Fetch old values to log before update
        const currentTenant = await client.query('SELECT * FROM tenants WHERE id = $1', [tenantId]);
        const oldData = currentTenant.rows[0];

        if (!oldData) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Tenant not found' });
        }

        for (const [key, value] of Object.entries(updates)) {
            const dbKey = dbFieldMap[key] || key; // Use mapped name or original if no map
            setClauses.push(`${dbKey} = $${idx}`);
            values.push(value);
            idx++;
        }

        if (setClauses.length > 0) {
            await client.query(`
                UPDATE tenants 
                SET ${setClauses.join(', ')}, updated_at = NOW()
                WHERE id = $1
            `, values);

            // Log History for restricted fields
            for (const field of fieldsToUpdate) {
                const dbField = dbFieldMap[field] || field;
                await client.query(`
                    INSERT INTO brand_change_history(tenant_id, change_type, old_value, new_value)
                    VALUES($1, $2, $3, $4)
                `, [tenantId, dbField, oldData[dbField], updates[field]]);
            }
        }

        await client.query('COMMIT');

        // Return updated data
        const updatedTenant = await client.query('SELECT * FROM tenants WHERE id = $1', [tenantId]);
        res.json({ success: true, message: 'Brand updated', data: updatedTenant.rows[0] });

    } catch (err) {
        if (client) await client.query('ROLLBACK');
        console.error('Update Failed', err);
        res.status(500).json({ error: err.message });
    } finally {
        if (client) client.release();
    }
});


// ==========================================
// 7. SYNC ENDPOINTS (Data Persistence)
// ==========================================

// Transactions
app.post('/api/sync/transactions', async (req, res) => {
    // MVP: Just acknowledge for now or basic insert
    res.json({ success: true, count: req.body.transactions?.length || 0 });
});

app.get('/api/sync/transactions', async (req, res) => {
    const { tenantId } = req.query;
    // MVP: Return empty or fetch from DB if we were fully implementing sync
    res.json({ transactions: [] });
});

// Invoices
app.post('/api/sync/invoices', async (req, res) => {
    res.json({ success: true, count: req.body.invoices?.length || 0 });
});

app.get('/api/sync/invoices', async (req, res) => {
    res.json({ invoices: [] });
});

// Subscriptions
app.get('/api/sync/subscriptions', async (req, res) => {
    // MVP: Return active subscription for the tenant
    res.json({
        subscriptions: []
    });
});

// Starting Balance
app.post('/api/sync/balances/starting', async (req, res) => {
    // MVP: Acknowledge
    res.json({ success: true });
});


app.listen(PORT, '0.0.0.0', () => {
    console.log(`OpCore Production Backend running on http://0.0.0.0:${PORT}`);
});
